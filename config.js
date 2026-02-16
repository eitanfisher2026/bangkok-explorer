// ============================================================================
// City Explorer - Configuration & Constants
// Copyright © 2026 Eitan Fisher. All Rights Reserved.
// ============================================================================

window.BKK = window.BKK || {};

// App Version
window.BKK.VERSION = '3.0.0';

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
// CITIES DATABASE
// ============================================================================

window.BKK.cities = {

  // =========================================================================
  // BANGKOK
  // =========================================================================
  bangkok: {
    id: 'bangkok',
    name: 'בנגקוק',
    nameEn: 'Bangkok',
    country: 'Thailand',
    icon: '🛺',
    secondaryIcon: '🍜',
    distanceMultiplier: 1.2,
    center: { lat: 13.7563, lng: 100.5018 },
    allCityRadius: 15000,

    areas: [
      { id: 'sukhumvit', label: 'סוקומווית', labelEn: 'Sukhumvit', desc: 'חיי לילה, מסעדות, קניונים', lat: 13.7370, lng: 100.5610, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'old-town', label: 'העיר העתיקה', labelEn: 'Old Town', desc: 'מקדשים, ארמון המלך, היסטוריה', lat: 13.7500, lng: 100.4914, radius: 2000, size: 'medium', safety: 'safe' },
      { id: 'chinatown', label: 'צ\'יינה טאון', labelEn: 'Chinatown', desc: 'אוכל רחוב, שווקים, מקדשים סיניים', lat: 13.7408, lng: 100.5050, radius: 1500, size: 'medium', safety: 'caution' },
      { id: 'thonglor', label: 'תונגלור', labelEn: 'Thonglor', desc: 'קפה, גלריות, בוטיקים', lat: 13.7320, lng: 100.5830, radius: 2000, size: 'medium', safety: 'safe' },
      { id: 'ari', label: 'ארי', labelEn: 'Ari', desc: 'שכונתי, קפה, אמנות רחוב', lat: 13.7790, lng: 100.5410, radius: 2000, size: 'medium', safety: 'safe' },
      { id: 'riverside', label: 'ריברסייד', labelEn: 'Riverside', desc: 'נהר, מקדשים, שווקי לילה', lat: 13.7270, lng: 100.4965, radius: 2000, size: 'medium', safety: 'safe' },
      { id: 'siam', label: 'סיאם', labelEn: 'Siam / Pratunam', desc: 'קניות, קניונים, מרכז העיר', lat: 13.7460, lng: 100.5340, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'chatuchak', label: 'צ\'אטוצ\'אק', labelEn: 'Chatuchak', desc: 'שוק ענק, פארקים, אמנות', lat: 13.7999, lng: 100.5500, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'silom', label: 'סילום', labelEn: 'Silom / Sathorn', desc: 'עסקים, מקדשים, חיי לילה', lat: 13.7262, lng: 100.5235, radius: 1800, size: 'medium', safety: 'safe' },
      { id: 'ratchada', label: 'ראצ\'אדה', labelEn: 'Ratchada', desc: 'שווקי לילה, אוכל, בידור', lat: 13.7650, lng: 100.5730, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'onnut', label: 'און נאט', labelEn: 'On Nut', desc: 'מקומי, אוכל זול, שווקים', lat: 13.7060, lng: 100.6010, radius: 1800, size: 'medium', safety: 'safe' },
      { id: 'bangrak', label: 'באנג ראק', labelEn: 'Bang Rak', desc: 'אמנות, גלריות, אוכל', lat: 13.7280, lng: 100.5130, radius: 1000, size: 'small', safety: 'safe' }
    ],

    interests: [
      { id: 'temples', label: 'מקדשים', icon: '🛕' },
      { id: 'food', label: 'אוכל', icon: '🍜' },
      { id: 'graffiti', label: 'גרפיטי', icon: '🎨' },
      { id: 'artisans', label: 'מלאכה', icon: '🔨' },
      { id: 'galleries', label: 'גלריות', icon: '🖼️' },
      { id: 'architecture', label: 'ארכיטקטורה', icon: '🏛️' },
      { id: 'canals', label: 'תעלות', icon: '🚤' },
      { id: 'cafes', label: 'קפה', icon: '☕' },
      { id: 'markets', label: 'שווקים', icon: '🏪' },
      { id: 'nightlife', label: 'לילה', icon: '🌃' },
      { id: 'parks', label: 'פארקים', icon: '🌳' },
      { id: 'rooftop', label: 'גגות', icon: '🌆' },
      { id: 'entertainment', label: 'בידור', icon: '🎭' }
    ],

    interestToGooglePlaces: {
      temples: ['hindu_temple', 'church', 'mosque', 'synagogue'],
      food: ['restaurant', 'meal_takeaway'],
      graffiti: ['art_gallery'],
      artisans: ['store', 'art_gallery'],
      galleries: ['art_gallery', 'museum'],
      architecture: ['historical_landmark'],
      canals: ['boat_tour_agency', 'marina'],
      cafes: ['cafe', 'coffee_shop'],
      markets: ['market', 'shopping_mall'],
      nightlife: ['bar', 'night_club'],
      parks: ['park', 'national_park'],
      rooftop: ['bar', 'restaurant'],
      entertainment: ['movie_theater', 'amusement_park', 'performing_arts_theater']
    },

    textSearchInterests: { graffiti: 'street art' },

    uncoveredInterests: [
      { id: 'massage_spa', icon: '💆', label: 'עיסוי וספא', name: 'עיסוי וספא', examples: 'Thai massage, wellness centers, spa' },
      { id: 'fitness', icon: '🏋️', label: 'כושר וספורט', name: 'כושר וספורט', examples: 'Gyms, yoga studios, Muay Thai, fitness' },
      { id: 'shopping_special', icon: '🛍️', label: 'קניות מיוחדות', name: 'קניות מיוחדות', examples: 'Boutiques, jewelry, fashion stores' },
      { id: 'learning', icon: '🎓', label: 'לימוד וחוויות', name: 'לימוד וחוויות', examples: 'Cooking classes, meditation, workshops' },
      { id: 'health', icon: '🏥', label: 'בריאות ורפואה', name: 'בריאות ורפואה', examples: 'Clinics, pharmacies, health services' },
      { id: 'accommodation', icon: '🏨', label: 'אירוח', name: 'אירוח', examples: 'Hotels, hostels, guesthouses' },
      { id: 'transport', icon: '🚗', label: 'תחבורה', name: 'תחבורה', examples: 'Car rental, bike rental, transportation' },
      { id: 'business', icon: '💼', label: 'עסקים', name: 'עסקים', examples: 'Coworking, offices, business centers' }
    ],

    interestTooltips: {
      temples: 'מקדשים בודהיסטיים והינדיים', food: 'מסעדות ואוכל רחוב', graffiti: 'אומנות רחוב וגרפיטי',
      artisans: 'בתי מלאכה ואומנים', galleries: 'גלריות ומוזיאונים', architecture: 'בניינים היסטוריים',
      canals: 'שייטים בתעלות ובנהר', cafes: 'בתי קפה', markets: 'שווקים ובזארים',
      nightlife: 'ברים ומועדוני לילה', parks: 'גנים ופארקים', rooftop: 'ברים ומסעדות על גגות',
      entertainment: 'קולנוע, תיאטרון, מופעים'
    }
  },

  // =========================================================================
  // GUSH DAN (Tel Aviv Metropolitan Area)
  // =========================================================================
  gushdan: {
    id: 'gushdan',
    name: 'גוש דן',
    nameEn: 'Gush Dan',
    country: 'Israel',
    icon: '🏖️',
    secondaryIcon: '☀️',
    distanceMultiplier: 1.2,
    center: { lat: 32.0853, lng: 34.7818 },
    allCityRadius: 15000,

    areas: [
      { id: 'tlv-north', label: 'צפון תל אביב', labelEn: 'North Tel Aviv', desc: 'הנמל, פארק הירקון, בזל', lat: 32.1033, lng: 34.7750, radius: 2000, size: 'large', safety: 'safe' },
      { id: 'tlv-center', label: 'מרכז תל אביב', labelEn: 'Central Tel Aviv', desc: 'רוטשילד, דיזנגוף, הבימה', lat: 32.0731, lng: 34.7746, radius: 2000, size: 'large', safety: 'safe' },
      { id: 'tlv-south', label: 'דרום ת"א ויפו', labelEn: 'South TLV & Jaffa', desc: 'שוק הפשפשים, נמל יפו, פלורנטין', lat: 32.0515, lng: 34.7561, radius: 2500, size: 'large', safety: 'caution' },
      { id: 'holon', label: 'חולון', labelEn: 'Holon', desc: 'מוזיאון הילדים, עיצוב, פארקים', lat: 32.0114, lng: 34.7748, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'bat-yam', label: 'בת ים', labelEn: 'Bat Yam', desc: 'חוף, טיילת, אוכל', lat: 32.0236, lng: 34.7515, radius: 1800, size: 'medium', safety: 'safe' },
      { id: 'petah-tikva', label: 'פתח תקווה', labelEn: 'Petah Tikva', desc: 'מסעדות, פארקים, קניונים', lat: 32.0841, lng: 34.8878, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'herzliya', label: 'הרצליה', labelEn: 'Herzliya', desc: 'מרינה, חופים, הייטק', lat: 32.1629, lng: 34.7987, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'ramat-gan', label: 'רמת גן וגבעתיים', labelEn: 'Ramat Gan & Givatayim', desc: 'הבורסה, ספארי, פארקים', lat: 32.0804, lng: 34.8135, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'bnei-brak', label: 'בני ברק', labelEn: 'Bnei Brak', desc: 'שווקים, אוכל, תרבות חרדית', lat: 32.0834, lng: 34.8338, radius: 1500, size: 'medium', safety: 'safe' }
    ],

    interests: [
      { id: 'food', label: 'אוכל', icon: '🍽️' },
      { id: 'cafes', label: 'קפה', icon: '☕' },
      { id: 'beaches', label: 'חופים', icon: '🏖️' },
      { id: 'graffiti', label: 'גרפיטי', icon: '🎨' },
      { id: 'galleries', label: 'גלריות', icon: '🖼️' },
      { id: 'architecture', label: 'באוהאוס', icon: '🏛️' },
      { id: 'markets', label: 'שווקים', icon: '🏪' },
      { id: 'nightlife', label: 'לילה', icon: '🌃' },
      { id: 'parks', label: 'פארקים', icon: '🌳' },
      { id: 'shopping', label: 'קניות', icon: '🛍️' },
      { id: 'culture', label: 'תרבות', icon: '🎭' },
      { id: 'history', label: 'היסטוריה', icon: '🏚️' }
    ],

    interestToGooglePlaces: {
      food: ['restaurant', 'meal_takeaway'], cafes: ['cafe', 'coffee_shop'], beaches: ['beach'],
      graffiti: ['art_gallery'], galleries: ['art_gallery', 'museum'], architecture: ['historical_landmark'],
      markets: ['market', 'shopping_mall'], nightlife: ['bar', 'night_club'], parks: ['park'],
      shopping: ['shopping_mall', 'store'], culture: ['performing_arts_theater', 'cultural_center', 'museum'],
      history: ['historical_landmark', 'museum']
    },

    textSearchInterests: { graffiti: 'street art', architecture: 'bauhaus building', beaches: 'beach' },

    uncoveredInterests: [
      { id: 'fitness', icon: '🏋️', label: 'כושר וספורט', name: 'כושר וספורט', examples: 'Gyms, yoga, pilates, cycling' },
      { id: 'wellness', icon: '💆', label: 'ספא ורווחה', name: 'ספא ורווחה', examples: 'Spa, massage, wellness' },
      { id: 'coworking', icon: '💻', label: 'עבודה', name: 'חללי עבודה', examples: 'Coworking, cafes with wifi' }
    ],

    interestTooltips: {
      food: 'מסעדות ואוכל רחוב', cafes: 'בתי קפה', beaches: 'חופים וטיילות',
      graffiti: 'אומנות רחוב וגרפיטי', galleries: 'גלריות ומוזיאונים', architecture: 'מבני באוהאוס ואדריכלות',
      markets: 'שווקים ובזארים', nightlife: 'ברים ומועדונים', parks: 'פארקים וגנים',
      shopping: 'קניונים וחנויות', culture: 'תיאטרון, מוזיקה, מופעים', history: 'אתרים היסטוריים ומוזיאונים'
    }
  },

  // =========================================================================
  // SINGAPORE
  // =========================================================================
  singapore: {
    id: 'singapore',
    name: 'סינגפור',
    nameEn: 'Singapore',
    country: 'Singapore',
    icon: '🦁',
    secondaryIcon: '🌴',
    distanceMultiplier: 1.2,
    center: { lat: 1.3521, lng: 103.8198 },
    allCityRadius: 15000,

    areas: [
      { id: 'marina-bay', label: 'מרינה ביי', labelEn: 'Marina Bay', desc: 'מגדלים, גנים, אטרקציות', lat: 1.2816, lng: 103.8636, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'chinatown-sg', label: 'צ\'יינה טאון', labelEn: 'Chinatown', desc: 'מקדשים, אוכל רחוב, שווקים', lat: 1.2833, lng: 103.8440, radius: 1200, size: 'small', safety: 'safe' },
      { id: 'little-india', label: 'ליטל אינדיה', labelEn: 'Little India', desc: 'צבעוני, תבלינים, מקדשים הינדיים', lat: 1.3066, lng: 103.8518, radius: 1200, size: 'small', safety: 'safe' },
      { id: 'kampong-glam', label: 'קאמפונג גלאם', labelEn: 'Kampong Glam', desc: 'ערבי, גרפיטי, היפסטרים', lat: 1.3015, lng: 103.8596, radius: 1000, size: 'small', safety: 'safe' },
      { id: 'orchard', label: 'אורצ\'רד', labelEn: 'Orchard Road', desc: 'קניות, קניונים, יוקרה', lat: 1.3048, lng: 103.8318, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'sentosa', label: 'סנטוסה', labelEn: 'Sentosa', desc: 'חופים, יוניברסל, בידור', lat: 1.2494, lng: 103.8303, radius: 2000, size: 'large', safety: 'safe' },
      { id: 'tiong-bahru', label: 'טיונג בארו', labelEn: 'Tiong Bahru', desc: 'קפה, גרפיטי, ארט דקו', lat: 1.2847, lng: 103.8310, radius: 1000, size: 'small', safety: 'safe' },
      { id: 'holland-v', label: 'הולנד וילאג\'', labelEn: 'Holland Village', desc: 'שכונתי, ברים, קפה', lat: 1.3112, lng: 103.7958, radius: 1200, size: 'small', safety: 'safe' },
      { id: 'clarke-quay', label: 'קלארק קי', labelEn: 'Clarke Quay', desc: 'נהר, ברים, חיי לילה', lat: 1.2906, lng: 103.8465, radius: 1000, size: 'small', safety: 'safe' },
      { id: 'bugis', label: 'בוגיס', labelEn: 'Bugis / Bras Basah', desc: 'תרבות, מוזיאונים, שווקים', lat: 1.2993, lng: 103.8558, radius: 1200, size: 'medium', safety: 'safe' }
    ],

    interests: [
      { id: 'food', label: 'אוכל', icon: '🍜' },
      { id: 'cafes', label: 'קפה', icon: '☕' },
      { id: 'hawkers', label: 'הוקרס', icon: '🥘' },
      { id: 'temples', label: 'מקדשים', icon: '🛕' },
      { id: 'gardens', label: 'גנים', icon: '🌺' },
      { id: 'architecture', label: 'ארכיטקטורה', icon: '🏛️' },
      { id: 'graffiti', label: 'גרפיטי', icon: '🎨' },
      { id: 'galleries', label: 'גלריות', icon: '🖼️' },
      { id: 'markets', label: 'שווקים', icon: '🏪' },
      { id: 'nightlife', label: 'לילה', icon: '🌃' },
      { id: 'shopping', label: 'קניות', icon: '🛍️' },
      { id: 'rooftop', label: 'גגות', icon: '🌆' }
    ],

    interestToGooglePlaces: {
      food: ['restaurant', 'meal_takeaway'], cafes: ['cafe', 'coffee_shop'],
      hawkers: ['restaurant'], temples: ['hindu_temple', 'church', 'mosque', 'synagogue'],
      gardens: ['park', 'botanical_garden'], architecture: ['historical_landmark'],
      graffiti: ['art_gallery'], galleries: ['art_gallery', 'museum'],
      markets: ['market', 'shopping_mall'], nightlife: ['bar', 'night_club'],
      shopping: ['shopping_mall', 'store'], rooftop: ['bar', 'restaurant']
    },

    textSearchInterests: { graffiti: 'street art', hawkers: 'hawker centre', gardens: 'garden' },

    uncoveredInterests: [
      { id: 'wellness', icon: '💆', label: 'ספא ורווחה', name: 'ספא ורווחה', examples: 'Spa, massage, wellness' },
      { id: 'adventure', icon: '🎢', label: 'אטרקציות', name: 'אטרקציות', examples: 'Theme parks, zoo, aquarium' }
    ],

    interestTooltips: {
      food: 'מסעדות מכל העולם', cafes: 'בתי קפה', hawkers: 'מרכזי הוקרס — אוכל רחוב סינגפורי',
      temples: 'מקדשים בודהיסטיים, הינדיים, מסגדים', gardens: 'גנים בוטניים ופארקים',
      architecture: 'קולוניאלי, שופהאוסים, מודרני', graffiti: 'אומנות רחוב',
      galleries: 'גלריות ומוזיאונים', markets: 'שווקים ובזארים',
      nightlife: 'ברים ומועדונים', shopping: 'קניונים וחנויות', rooftop: 'ברים ומסעדות על גגות'
    }
  }
};

// ============================================================================
// CITY SELECTION & COMPATIBILITY LAYER
// ============================================================================

/**
 * Select a city and populate all legacy window.BKK.* variables.
 * This allows ALL existing code in app-logic.js, views.js, dialogs.js
 * to work without changes — they read from the same window.BKK.* vars.
 */
window.BKK.selectCity = function(cityId) {
  var city = window.BKK.cities[cityId];
  if (!city) {
    console.error('[CONFIG] Unknown city:', cityId);
    return false;
  }

  window.BKK.selectedCity = city;
  window.BKK.selectedCityId = cityId;

  // Populate legacy area variables
  window.BKK.areaOptions = city.areas.map(function(a) {
    return { id: a.id, label: a.label, labelEn: a.labelEn, desc: a.desc };
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

  // City name for search queries (replaces hardcoded "Bangkok")
  window.BKK.cityNameForSearch = city.nameEn;

  console.log('[CONFIG] City selected: ' + city.nameEn + ' (' + city.areas.length + ' areas, ' + city.interests.length + ' interests)');
  return true;
};

// Default: load saved city or Bangkok
(function() {
  var savedCity = 'bangkok';
  try { savedCity = localStorage.getItem('city_explorer_city') || 'bangkok'; } catch(e) {}
  if (!window.BKK.cities[savedCity]) savedCity = 'bangkok';
  window.BKK.selectCity(savedCity);
})();

// ============================================================================
// HELP CONTENT (shared across cities)
// ============================================================================

window.BKK.helpContent = {
  main: {
    title: 'איך להשתמש?',
    content: "**City Explorer** עוזר לך לגלות מקומות מעניינים ולתכנן מסלול טיול.\n\n**שני מצבי שימוש:**\n• **מצב מהיר** (ברירת מחדל) — בחר אזור ← בחר תחומים ← קבל תוצאות\n• **מצב מתקדם** — שליטה מלאה: הוסף מקומות, ערוך, שמור מסלולים\n\n**איך מתחילים:**\n1. בחר עיר ואזור (או \"הכל\", או GPS לקרוב אליך) ותחומי עניין, ולחץ \"מצא נקודות עניין\"\n2. ברשימת התוצאות: דלג על מקומות שלא מתאימים (⏸️) ובחר 📌 נקודת התחלה\n3. בחר סוג מסלול (מעגלי / לינארי) ולחץ \"חשב מסלול\"\n4. לחץ \"פתח מסלול בגוגל\" לניווט!\n\n**רוצה עוד מקומות?**\n• **\"+ עוד\"** ליד כל קטגוריה — מביא מקומות נוספים מגוגל מאותו תחום\n• **\"➕ הוסף ידנית נקודה למסלול\"** — חפש מקום לפי שם כפי שהוא מופיע בגוגל מפות והוסף אותו ישירות\n\n**טיפ:** לחץ על שם מקום כדי לפתוח אותו בגוגל מפות"
  },
  placesListing: {
    title: 'רשימת המקומות',
    content: "**איך המקומות נבחרים?**\nקודם מופיעים מקומות שהוספו ע\"י המשתמשים (דרך \"מצב מתקדם\"), ואחר כך מקומות מגוגל לפי דירוג.\n\n**כפתורים ליד כל מקום:**\n• ⏸️ — דלג על מקום (לא ייכלל במסלול). לחץ ▶️ כדי להחזיר\n• 📌 — קבע מקום כנקודת התחלה\n\n**במצב מתקדם גם:**\n• + — הוסף למקומות שלי\n• ✏️ — ערוך פרטים\n• 🗑️ — הסר (רק מקומות שנוספו ידנית)\n\n**רוצה עוד מקומות?**\n• **\"+ עוד\"** ליד כל קטגוריה — מביא מקומות נוספים מגוגל מאותו תחום עניין\n• **\"➕ הוסף ידנית נקודה למסלול\"** — חפש מקום לפי שם כפי שהוא מופיע בגוגל מפות והוסף אותו ישירות למסלול\n\n**לחיצה על שם המקום** פותחת אותו בגוגל מפות.\n\n**נקודת התחלה:**\nבחר 📌 ממקום ברשימה, או השתמש ב-🔍 (חיפוש כתובת) / 📍 (מיקום GPS) בתחתית העמוד.\nלשינוי — בחר מקום אחר או לחץ ✕ ליד שורת \"נקודת התחלה\" למטה.\n\n**חישוב מסלול:**\nבחר לינארי (מנקודה לנקודה) או מעגלי (חוזר להתחלה), ולחץ \"חשב מסלול\".\nאחרי חישוב לחץ \"פתח מסלול בגוגל\" לניווט."
  },
  route: {
    title: 'תוצאות המסלול',
    content: "**אחרי \"מצא נקודות עניין\"** מופיעה רשימת מקומות מחולקת לפי תחום.\n\n**כדי לבנות מסלול:**\n1. בחר 📌 נקודת התחלה (מהרשימה, חיפוש כתובת, או מיקום GPS)\n2. לחץ \"חשב מסלול\" — המערכת תסדר את הנקודות בסדר הכי הגיוני\n\n**רוצה להוסיף מקומות?**\n• **\"+ עוד\"** ליד כל קטגוריה — מביא מקומות נוספים מגוגל מאותו תחום\n• **\"➕ הוסף ידנית\"** — חפש מקום לפי שם בגוגל והוסף אותו ישירות למסלול\n\n**פעולות נוספות:**\n• 💾 **שמור** — שומר את המסלול לשימוש עתידי\n• 🗺️ **פתח בגוגל** — מציג את המסלול המחושב בגוגל מפות\n• ⏸️ **השהה** מקומות שלא מתאימים לך כרגע"
  },
  myContent: { title: 'התוכן שלי', content: "כאן אפשר לנהל את המקומות והתחומים שלך.\n\n**📍 המקומות שלי** — מקומות שהוספת בעצמך. הם מקבלים עדיפות על מקומות מגוגל!\n\n**🏷️ התחומים שלי** — בחר אילו תחומי עניין יופיעו בחיפוש. אפשר גם ליצור תחומים חדשים." },
  myPlaces: { title: 'המקומות שלי', content: "**מקומות שהוספת** מופיעים ראשונים בתוצאות החיפוש!\n\n**להוספת מקום:** לחץ \"➕ הוסף מקום\", הזן שם ובחר תחום עניין.\n\n**פעולות:**\n• ✏️ ערוך פרטים\n• 🗑️ מחק מקום\n• 🚫 רשימה שחורה — מקום שלא תרצה לראות יותר\n\n**טיפ:** אפשר גם להוסיף מקומות ישירות מתוצאות החיפוש בלחיצה על כפתור +" },
  myInterests: { title: 'התחומים שלי', content: "**תחומי העניין** קובעים אילו סוגי מקומות יופיעו בחיפוש.\n\n**להוסיף תחום חדש:** לחץ \"➕ הוסף תחום\", בחר שם ואייקון, והגדר מה לחפש.\n\n**לשנות סטטוס:** לחץ \"השבת\" כדי להסתיר תחום מהחיפוש, או \"הפעל\" להחזיר.\n\n**לערוך הגדרות:** לחץ ✏️ ליד תחום כדי לשנות את שם, אייקון, או הגדרות חיפוש.\n\n**תחום עם מסגרת אדומה** — חסר הגדרות חיפוש ולא יעבוד עד שתגדיר." },
  interestConfig: { title: 'הגדרות תחום', content: "**הגדרות החיפוש של התחום**\n\n**שם התחום:**\nהשם שיופיע ברשימת התחומים.\n\n**סוג חיפוש (Place Types):**\nקטגוריות של Google למשל: temple, restaurant, museum.\nהמערכת מביאה מקומות שהסוג שלהם מתאים לאחת הקטגוריות.\n\n**חיפוש טקסט (Text Search):**\nחיפוש חופשי, למשל: \"street art\", \"rooftop bar\".\nהמערכת מביאה מקומות שגוגל מצא לפי הטקסט, ומסננת כאלה שהשם שלהם לא מכיל את הביטוי.\n\n**מילות סינון (Blacklist):**\nמילים שאם מופיעות בשם המקום, הוא לא ייכלל. למשל: \"cannabis\", \"massage\" - כדי לסנן מקומות לא רלוונטים.\n\n**⚠️ חשוב:** תחום בלי הגדרות חיפוש לא יעבוד!" },
  searchLogic: { title: 'איך המערכת מוצאת מקומות?', content: "**סדר המציאה:**\n1. **קודם** - המקומות שלך (מותאמים אישית) שתואמים לאזור ולתחום\n2. **אחר כך** - מקומות מ-Google Places API\n\n**סינון מקומות מגוגל:**\n• מקום עם שם שמכיל מילת סינון (blacklist) = מסונן\n• מקום ששמו זהה למקום שלך = מסונן (מניעת כפילויות)\n• מקום \"דלג לצמיתות\" = מסונן\n• חיפוש טקסט: רק מקומות שהשם שלהם מכיל את ביטוי החיפוש המלא\n\n**תיעדוף:**\n• מקומות ממוינים לפי דירוג (מהגבוה לנמוך)\n• הדירוג משמש רק לסדר, לא לסינון\n\n**כמות:**\n• מספר המקומות מחולק שווה בין התחומים שבחרת\n• ניתן לשנות בהגדרות\n\n**\"+ עוד\":**\n• מוסיף מקומות נוספים מאותו תחום (ברירת מחדל: 3)\n• המקומות החדשים מסומנים בגבול כחול מקווקו" },
  saved: { title: 'מסלולים שמורים', content: "**מה יש כאן:**\nכל המסלולים ששמרת לשימוש עתידי.\n\n**שמירת מסלול:**\n• לחץ \"💾 שמור מסלול\" במסך המסלול\n• תן שם ייחודי (חובה)\n• הוסף הערות אם רוצה\n\n**פעולות:**\n• לחץ על מסלול לטעינה מחדש\n• 🗑️ למחיקת מסלול\n\n**טיפ:**\nמסלולים נכללים בייצוא/ייבוא בהגדרות!" },
  settings: { title: 'הגדרות', content: "**הגדרות המערכת:**\n\n**מספר מקומות:**\n• כמות המקומות המקסימלית במסלול\n• כמות מקומות נוספים ב\"מצא עוד\"\n\n**ייבוא/ייצוא:**\n• **ייצוא** - שומר הכל לקובץ JSON\n• **ייבוא** - מוסיף מקובץ (כפילויות ידולגו)\n\n**Admin (למנהלים):**\n• צפייה בלוג כניסות\n• ניהול מכשירים מורשים\n• סיסמת Admin" },
  addLocation: { title: 'הוספת/עריכת מקום', content: "**חובה:** שם המקום + תחום עניין אחד לפחות.\n\n**שדות נוספים (לא חובה):**\n• איזור, כתובת, הערות, תמונה\n• קישור מגוגל מפות\n\n**קואורדינטות** — נדרשות כדי שהמקום יופיע במסלול.\nהדרך הקלה: לחץ 🔤 (חיפוש לפי שם) או הדבק קישור מגוגל מפות ולחץ 🔗.\n\n**כפתורים למטה:**\n• **הוסף/עדכן** — שומר ונשאר בחלון\n• **X** למעלה — סוגר בלי לשמור" },
  addInterest: { title: 'הוספת/עריכת תחום עניין', content: "**איך מוסיפים תחום חדש:**\n1. בחר **שם** ו**אייקון** (אימוג'י)\n2. בחר **סוג חיפוש:**\n   • **Category** — לפי סוג מקום בגוגל (למשל: museum, restaurant)\n   • **Text** — חיפוש חופשי (למשל: \"rooftop bar\")\n3. לחץ **הוסף** — התחום יופיע ברשימת התחומים\n\n**מילות סינון** — מקומות עם מילים אלו בשם לא ייכללו (למשל: cannabis)." }
};

console.log('[CONFIG] Loaded successfully');
