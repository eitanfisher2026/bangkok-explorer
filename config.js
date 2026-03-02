// ============================================================================
// FouFou — City Trail Generator - Configuration & Constants
// Copyright © 2026 Eitan Fisher. All Rights Reserved.
// ============================================================================

window.BKK = window.BKK || {};

// Generate or restore persistent visitor ID
(function() {
  let vid = null;
  try { vid = localStorage.getItem('bangkok_visitor_id'); } catch(e) {}
  if (!vid) {
    vid = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    try { localStorage.setItem('bangkok_visitor_id', vid); } catch(e) {}
  }
  window.BKK.visitorId = vid;
  // Try to get a display name
  let vname = null;
  try { vname = localStorage.getItem('bangkok_visitor_name'); } catch(e) {}
  window.BKK.visitorName = vname || vid.slice(0, 10);
})();

// App Version
window.BKK.VERSION = '3.7.11';
// Convert stop index (0-based) to letter label: 0→A, 1→B, ..., 25→Z, 26→AA
window.BKK.stopLabel = function(i) {
  if (i < 26) return String.fromCharCode(65 + i);
  return String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26));
};

// Tile URL - English labels for all cities (Carto Voyager)
window.BKK.getTileUrl = function() {
  return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
};

// App Name
window.BKK.APP_NAME = 'FouFou';

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
  singapore: { id: 'singapore', name: 'סינגפור', nameEn: 'Singapore', country: 'Singapore', icon: '🦁', secondaryIcon: '🌿', file: 'city-singapore.js' },
  malaga: { id: 'malaga', name: 'מלגה', nameEn: 'Malaga', country: 'Spain', icon: '☀️', secondaryIcon: '☀️', file: 'city-malaga.js' }
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
 * Writes ONE item at a time to avoid Firebase "Write too large" error.
 */
window.BKK.migrateLocationsToPerCity = function(database) {
  if (!database) return Promise.resolve();
  var migrated = localStorage.getItem('locations_migrated_v2');
  if (migrated === 'true') return Promise.resolve();
  
  var locCount = 0;
  var routeCount = 0;
  var errors = 0;
  
  return database.ref('customLocations').once('value').then(function(snap) {
    var data = snap.val();
    if (!data) return Promise.resolve();
    var keys = Object.keys(data);
    locCount = keys.length;
    // Write one location at a time (sequential to avoid overwhelming Firebase)
    return keys.reduce(function(chain, key) {
      return chain.then(function() {
        var loc = data[key];
        // Strip base64 images during migration to reduce size
        if (loc.uploadedImage && typeof loc.uploadedImage === 'string' && loc.uploadedImage.startsWith('data:')) {
          delete loc.uploadedImage;
        }
        var cityId = loc.cityId || 'bangkok';
        return database.ref('cities/' + cityId + '/locations/' + key).set(loc).catch(function(e) {
          console.warn('[MIGRATION] Failed to migrate location ' + key + ':', e.message);
          errors++;
        });
      });
    }, Promise.resolve());
  }).then(function() {
    return database.ref('savedRoutes').once('value');
  }).then(function(snap) {
    var data = snap.val();
    if (!data) return Promise.resolve();
    var keys = Object.keys(data);
    routeCount = keys.length;
    // Write one route at a time
    return keys.reduce(function(chain, key) {
      return chain.then(function() {
        var route = data[key];
        // Strip base64 images from route stops
        if (route.stops && Array.isArray(route.stops)) {
          route.stops = route.stops.map(function(s) {
            if (s.uploadedImage && typeof s.uploadedImage === 'string' && s.uploadedImage.startsWith('data:')) {
              var copy = Object.assign({}, s);
              delete copy.uploadedImage;
              return copy;
            }
            return s;
          });
        }
        var cityId = route.cityId || 'bangkok';
        return database.ref('cities/' + cityId + '/routes/' + key).set(route).catch(function(e) {
          console.warn('[MIGRATION] Failed to migrate route ' + key + ':', e.message);
          errors++;
        });
      });
    }, Promise.resolve());
  }).then(function() {
    if (locCount === 0 && routeCount === 0) {
      localStorage.setItem('locations_migrated_v2', 'true');
      console.log('[MIGRATION] No old data to migrate');
      return;
    }
    if (errors > 0) {
      console.warn('[MIGRATION] Completed with ' + errors + ' errors — will retry next load');
      return;
    }
    // Only remove old data and mark done if ALL writes succeeded
    var removals = [];
    if (locCount > 0) removals.push(database.ref('customLocations').remove());
    if (routeCount > 0) removals.push(database.ref('savedRoutes').remove());
    return Promise.all(removals).then(function() {
      localStorage.setItem('locations_migrated_v2', 'true');
      console.log('[MIGRATION] Migrated ' + locCount + ' locations + ' + routeCount + ' routes to per-city structure');
    });
  }).catch(function(err) {
    console.error('[MIGRATION] Error:', err);
  });
};

/**
 * One-time cleanup: remove inProgress field from all Firebase records.
 * This field was removed in v3.5.1. Runs once per browser.
 */
window.BKK.cleanupInProgress = function(database) {
  if (!database) return Promise.resolve();
  if (localStorage.getItem('cleanup_inprogress_done') === 'true') return Promise.resolve();
  
  var cities = Object.keys(window.BKK.cities || {});
  var updates = {};
  var paths = [];
  
  cities.forEach(function(cityId) {
    paths.push('cities/' + cityId + '/customLocations');
    paths.push('cities/' + cityId + '/savedRoutes');
  });
  paths.push('customInterests');
  paths.push('settings/interestConfig');
  
  return Promise.all(paths.map(function(path) {
    return database.ref(path).once('value').then(function(snap) {
      var data = snap.val();
      if (!data) return;
      Object.keys(data).forEach(function(key) {
        if (data[key] && data[key].hasOwnProperty('inProgress')) {
          updates[path + '/' + key + '/inProgress'] = null;
        }
      });
    }).catch(function() {});
  })).then(function() {
    var count = Object.keys(updates).length;
    if (count > 0) {
      return database.ref().update(updates).then(function() {
        console.log('[CLEANUP] Removed inProgress from ' + count + ' records');
      });
    }
  }).then(function() {
    localStorage.setItem('cleanup_inprogress_done', 'true');
  }).catch(function(err) {
    console.error('[CLEANUP] inProgress removal error:', err);
  });
};

/**
 * DISABLED — this function was incorrectly deleting valid interests.
 * It checked for types/textSearch on the interest object, but search config
 * is stored in settings/interestConfig/{id}, not on the interest itself.
 * Non-privateOnly interests were incorrectly flagged as orphans and deleted.
 */
window.BKK.cleanupOrphanedInterests = function(database) {
  return Promise.resolve();
};

/**
 * Admin utility: clean up stale _verify nodes and diagnose Firebase issues.
 */
window.BKK.cleanupFirebase = function(database) {
  if (!database) { console.log('[CLEANUP] No database'); return Promise.resolve(); }
  var cleaned = 0;
  return database.ref('_verify').once('value').then(function(snap) {
    var data = snap.val();
    if (!data) {
      console.log('[CLEANUP] No stale _verify nodes found');
      return;
    }
    cleaned = Object.keys(data).length;
    console.log('[CLEANUP] Removing ' + cleaned + ' stale _verify nodes...');
    return database.ref('_verify').remove();
  }).then(function() {
    if (cleaned > 0) console.log('[CLEANUP] Removed ' + cleaned + ' _verify nodes');
    // Check sizes of major nodes
    return Promise.all([
      database.ref('accessLog').once('value').then(function(s) {
        var d = s.val();
        var count = d ? Object.keys(d).length : 0;
        var size = d ? JSON.stringify(d).length : 0;
        console.log('[CLEANUP] accessLog: ' + count + ' entries, ~' + Math.round(size/1024) + 'KB');
        return { node: 'accessLog', count: count, sizeKB: Math.round(size/1024) };
      }),
      database.ref('feedback').once('value').then(function(s) {
        var d = s.val();
        var count = d ? Object.keys(d).length : 0;
        var size = d ? JSON.stringify(d).length : 0;
        console.log('[CLEANUP] feedback: ' + count + ' entries, ~' + Math.round(size/1024) + 'KB');
        return { node: 'feedback', count: count, sizeKB: Math.round(size/1024) };
      })
    ]);
  }).then(function(results) {
    console.log('[CLEANUP] Done. Results:', results);
    return { verifyRemoved: cleaned, nodes: results };
  }).catch(function(err) {
    console.error('[CLEANUP] Error:', err);
  });
};

/**
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
  window.BKK.activeCityData = city; // For GPS city-bounds validation

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

  // Time-of-day boundaries for this city
  window.BKK.dayStartHour = city.dayStartHour != null ? city.dayStartHour : 6;
  window.BKK.nightStartHour = city.nightStartHour != null ? city.nightStartHour : 17;

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
  // If saved city doesn't exist or is not active, pick first active city
  if (!window.BKK.cities[savedCity] || window.BKK.cities[savedCity].active === false) {
    var activeCities = Object.keys(window.BKK.cities).filter(function(id) { return window.BKK.cities[id].active !== false; });
    savedCity = activeCities[0] || Object.keys(window.BKK.cities)[0] || 'bangkok';
  }
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
