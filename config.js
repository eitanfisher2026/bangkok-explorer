// ============================================================================
// City Explorer - Configuration & Constants
// Copyright © 2026 Eitan Fisher. All Rights Reserved.
// ============================================================================

window.BKK = window.BKK || {};

// App Version
window.BKK.VERSION = '3.0.0';

// Tile URL - English labels for all cities
window.BKK.getTileUrl = function() {
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

// App Name
window.BKK.APP_NAME = 'City Explorer';

// Firebase Configuration
window.BKK.firebaseConfig = {
  apiKey: "AIzaSyCAH_2fk_plk6Dg5dlCCfaRWKL3Nmc6V6g",
  authDomain: "bangkok-explorer.firebaseapp.com",
  databaseURL: "https://bangkok-explorer-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bangkok-explorer",
  storageBucket: "bangkok-explorer.firebasestorage.app",
  messagingSenderId: "139083217994",
  appId: "1:139083217994:web:48fc6a45028c91d177bab3",
  measurementId: "G-QVGD0RKEHP"
};

// Google Places API Configuration
window.BKK.GOOGLE_PLACES_API_KEY = 'AIzaSyD0F0TYKuWXVqibhj-sH-DaElDtLL8hMwM';
window.BKK.GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchNearby';
window.BKK.GOOGLE_PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

// ============================================================================
// CITIES REGISTRY (lightweight metadata only - full data loaded dynamically)
// ============================================================================

window.BKK.cityRegistry = {
  bangkok: { id: 'bangkok', name: 'בנגקוק', nameEn: 'Bangkok', country: 'Thailand', icon: '🛺', secondaryIcon: '🍜', file: 'city-bangkok.js' },
  gushdan: { id: 'gushdan', name: 'גוש דן', nameEn: 'Gush Dan', country: 'Israel', icon: '🏖️', secondaryIcon: '☀️', file: 'city-gushdan.js' },
  singapore: { id: 'singapore', name: 'סינגפור', nameEn: 'Singapore', country: 'Singapore', icon: '🦁', secondaryIcon: '🌿', file: 'city-singapore.js' }
};

// Active cities (loaded from localStorage or defaults)
window.BKK.cities = {};
window.BKK.cityData = window.BKK.cityData || {};

// ============================================================================
// CITY LOADING & SELECTION
// ============================================================================

/**
 * Load a city's data file dynamically, then register it.
 * Returns a Promise that resolves when the city is ready.
 */
window.BKK.loadCity = function(cityId) {
  return new Promise(function(resolve, reject) {
    var reg = window.BKK.cityRegistry[cityId];
    if (!reg) { reject('Unknown city: ' + cityId); return; }
    
    // Already loaded?
    if (window.BKK.cityData[cityId]) {
      window.BKK.cities[cityId] = window.BKK.cityData[cityId];
      resolve(window.BKK.cities[cityId]);
      return;
    }
    
    // Load the script
    var script = document.createElement('script');
    script.src = reg.file + '?v=' + window.BKK.VERSION;
    script.onload = function() {
      if (window.BKK.cityData[cityId]) {
        window.BKK.cities[cityId] = window.BKK.cityData[cityId];
        console.log('[CONFIG] Loaded city file: ' + reg.nameEn);
        resolve(window.BKK.cities[cityId]);
      } else {
        reject('City data not found after loading: ' + cityId);
      }
    };
    script.onerror = function() { reject('Failed to load city file: ' + reg.file); };
    document.head.appendChild(script);
  });
};

/**
 * Unload a city to free memory (keeps registry entry).
 */
window.BKK.unloadCity = function(cityId) {
  delete window.BKK.cities[cityId];
  delete window.BKK.cityData[cityId];
  delete window.BKK.cityRegistry[cityId];
  // Remove from custom cities localStorage
  try {
    var customCities = JSON.parse(localStorage.getItem('custom_cities') || '{}');
    delete customCities[cityId];
    localStorage.setItem('custom_cities', JSON.stringify(customCities));
  } catch(e) {}
  console.log('[CONFIG] Unloaded city: ' + cityId);
};

/**
 * Export a city as a downloadable JS file (for GitHub upload).
 */
window.BKK.exportCityFile = function(city) {
  var cityId = city.id;
  var lines = [];
  lines.push('// City data: ' + city.nameEn);
  lines.push('window.BKK.cityData = window.BKK.cityData || {};');
  lines.push('window.BKK.cityData.' + cityId + ' = ' + JSON.stringify(city, null, 2) + ';');
  
  var content = lines.join('\n') + '\n';
  var blob = new Blob([content], { type: 'text/javascript' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'city-' + cityId + '.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('[CONFIG] Exported city file: city-' + cityId + '.js');
};

/**
 * Export config registry snippet for a city (to add to config.js cityRegistry).
 */
window.BKK.getCityRegistryEntry = function(city) {
  return '  ' + city.id + ": { id: '" + city.id + "', name: '" + city.name + "', nameEn: '" + city.nameEn + "', country: '" + (city.country || '') + "', icon: '" + city.icon + "', file: 'city-" + city.id + ".js' }";
};

/**
 * One-time migration: move old flat customLocations to per-city structure.
 * Old: customLocations/{id} → New: cities/{cityId}/locations/{id}
 */
window.BKK.migrateLocationsToPerCity = function(database) {
  if (!database) return Promise.resolve();
  var migrated = localStorage.getItem('locations_migrated_v2');
  if (migrated === 'true') return Promise.resolve();
  
  var updates = {};
  var locCount = 0;
  var routeCount = 0;
  
  return database.ref('customLocations').once('value').then(function(snap) {
    var data = snap.val();
    if (data) {
      Object.keys(data).forEach(function(key) {
        var loc = data[key];
        var cityId = loc.cityId || 'bangkok';
        updates['cities/' + cityId + '/locations/' + key] = loc;
        locCount++;
      });
    }
    return database.ref('savedRoutes').once('value');
  }).then(function(snap) {
    var data = snap.val();
    if (data) {
      Object.keys(data).forEach(function(key) {
        var route = data[key];
        var cityId = route.cityId || 'bangkok';
        updates['cities/' + cityId + '/routes/' + key] = route;
        routeCount++;
      });
    }
    
    if (locCount === 0 && routeCount === 0) {
      localStorage.setItem('locations_migrated_v2', 'true');
      console.log('[MIGRATION] No old data to migrate');
      return;
    }
    
    // Write all to new paths then remove old
    return database.ref().update(updates).then(function() {
      var removals = [];
      if (locCount > 0) removals.push(database.ref('customLocations').remove());
      if (routeCount > 0) removals.push(database.ref('savedRoutes').remove());
      return Promise.all(removals);
    }).then(function() {
      localStorage.setItem('locations_migrated_v2', 'true');
      console.log('[MIGRATION] Migrated ' + locCount + ' locations + ' + routeCount + ' routes to per-city structure');
    });
  }).catch(function(err) {
    console.error('[MIGRATION] Error:', err);
  });
};
 * Select a city and populate all legacy window.BKK.* variables.
 */
window.BKK.selectCity = function(cityId) {
  var city = window.BKK.cities[cityId];
  if (!city) {
    console.error('[CONFIG] City not loaded:', cityId);
    return false;
  }

  window.BKK.selectedCity = city;
  window.BKK.selectedCityId = cityId;

  // Populate legacy area variables
  window.BKK.areaOptions = city.areas.map(function(a) {
    return { id: a.id, label: a.label, labelEn: a.labelEn, desc: a.desc, descEn: a.descEn };
  });

  window.BKK.areaCoordinates = {};
  city.areas.forEach(function(a) {
    var multiplier = a.distanceMultiplier || city.distanceMultiplier || 1.2;
    window.BKK.areaCoordinates[a.id] = {
      lat: a.lat, lng: a.lng, radius: a.radius,
      distanceMultiplier: multiplier,
      size: a.size || 'medium',
      safety: a.safety || 'safe'
    };
  });

  // Populate legacy interest variables
  window.BKK.interestOptions = city.interests;
  window.BKK.interestToGooglePlaces = city.interestToGooglePlaces;
  window.BKK.textSearchInterests = city.textSearchInterests || {};
  window.BKK.uncoveredInterests = city.uncoveredInterests || [];
  window.BKK.interestTooltips = city.interestTooltips || {};

  // City name for search queries
  window.BKK.cityNameForSearch = city.nameEn;

  console.log('[CONFIG] City selected: ' + city.nameEn + ' (' + city.areas.length + ' areas, ' + city.interests.length + ' interests)');
  return true;
};

// Default: load saved city (synchronous for initial page load - city files are in HTML)
(function() {

  // On initial load, city data files are embedded in HTML (via build.py)
  Object.keys(window.BKK.cityData).forEach(function(cityId) {
    window.BKK.cities[cityId] = window.BKK.cityData[cityId];
  });
  
  // Load custom cities from localStorage
  try {
    var customCities = JSON.parse(localStorage.getItem('custom_cities') || '{}');
    Object.keys(customCities).forEach(function(cityId) {
      window.BKK.cities[cityId] = customCities[cityId];
      window.BKK.cityData[cityId] = customCities[cityId];
      if (!window.BKK.cityRegistry[cityId]) {
        window.BKK.cityRegistry[cityId] = {
          id: cityId, name: customCities[cityId].name, nameEn: customCities[cityId].nameEn,
          country: customCities[cityId].country, icon: customCities[cityId].icon, file: null
        };
      }
      console.log('[CONFIG] Loaded custom city: ' + cityId);
    });
  } catch(e) { console.error('[CONFIG] Error loading custom cities:', e); }
  
  // Apply saved active/inactive states from localStorage
  try {
    var states = JSON.parse(localStorage.getItem('city_active_states') || '{}');
    Object.keys(states).forEach(function(cityId) {
      if (window.BKK.cities[cityId]) {
        window.BKK.cities[cityId].active = states[cityId];
      }
    });
  } catch(e) {}
  
  var savedCity = 'bangkok';
  try { savedCity = localStorage.getItem('city_explorer_city') || 'bangkok'; } catch(e) {}
  if (!window.BKK.cities[savedCity]) savedCity = Object.keys(window.BKK.cities)[0] || 'bangkok';
  window.BKK.selectCity(savedCity);
})();

// ============================================================================
// HELP CONTENT (shared across cities)
// ============================================================================

// Help content now served from i18n.js translations
// This getter dynamically returns help in the current language
Object.defineProperty(window.BKK, 'helpContent', {
  get() {
    return window.BKK.i18n.strings?.[window.BKK.i18n.currentLang]?.help || window.BKK.i18n.strings?.he?.help || {};
  }
});

console.log('[CONFIG] Loaded successfully');
