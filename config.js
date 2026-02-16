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
    active: true,
    distanceMultiplier: 1.2,
    center: { lat: 13.7563, lng: 100.5018 },
    allCityRadius: 15000,

    areas: [
      { id: 'sukhumvit', label: 'סוקומווית', labelEn: 'Sukhumvit', desc: 'חיי לילה, מסעדות, קניונים', descEn: 'Nightlife, restaurants, malls', lat: 13.7370, lng: 100.5610, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'old-town', label: 'העיר העתיקה', labelEn: 'Old Town', desc: 'מקדשים, ארמון המלך, היסטוריה', descEn: 'Temples, Grand Palace, history', lat: 13.7500, lng: 100.4914, radius: 2000, size: 'medium', safety: 'safe' },
      { id: 'chinatown', label: 'צ\'יינה טאון', labelEn: 'Chinatown', desc: 'אוכל רחוב, שווקים, מקדשים סיניים', descEn: 'Street food, markets, Chinese temples', lat: 13.7408, lng: 100.5050, radius: 1500, size: 'medium', safety: 'caution' },
      { id: 'thonglor', label: 'תונגלור', labelEn: 'Thonglor', desc: 'קפה, גלריות, בוטיקים', descEn: 'Coffee, galleries, boutiques', lat: 13.7320, lng: 100.5830, radius: 2000, size: 'medium', safety: 'safe' },
      { id: 'ari', label: 'ארי', labelEn: 'Ari', desc: 'שכונתי, קפה, אמנות רחוב', descEn: 'Local, coffee, street art', lat: 13.7790, lng: 100.5410, radius: 2000, size: 'medium', safety: 'safe' },
      { id: 'riverside', label: 'ריברסייד', labelEn: 'Riverside', desc: 'נהר, מקדשים, שווקי לילה', descEn: 'River, temples, night markets', lat: 13.7270, lng: 100.4965, radius: 2000, size: 'medium', safety: 'safe' },
      { id: 'siam', label: 'סיאם', labelEn: 'Siam / Pratunam', desc: 'קניות, קניונים, מרכז העיר', descEn: 'Shopping, malls, city center', lat: 13.7460, lng: 100.5340, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'chatuchak', label: 'צ\'אטוצ\'אק', labelEn: 'Chatuchak', desc: 'שוק ענק, פארקים, אמנות', descEn: 'Huge market, parks, art', lat: 13.7999, lng: 100.5500, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'silom', label: 'סילום', labelEn: 'Silom / Sathorn', desc: 'עסקים, מקדשים, חיי לילה', descEn: 'Business, temples, nightlife', lat: 13.7262, lng: 100.5235, radius: 1800, size: 'medium', safety: 'safe' },
      { id: 'ratchada', label: 'ראצ\'אדה', labelEn: 'Ratchada', desc: 'שווקי לילה, אוכל, בידור', descEn: 'Night markets, food, entertainment', lat: 13.7650, lng: 100.5730, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'onnut', label: 'און נאט', labelEn: 'On Nut', desc: 'מקומי, אוכל זול, שווקים', descEn: 'Local, cheap food, markets', lat: 13.7060, lng: 100.6010, radius: 1800, size: 'medium', safety: 'safe' },
      { id: 'bangrak', label: 'באנג ראק', labelEn: 'Bang Rak', desc: 'אמנות, גלריות, אוכל', descEn: 'Art, galleries, food', lat: 13.7280, lng: 100.5130, radius: 1000, size: 'small', safety: 'safe' }
    ],

    interests: [
      { id: 'temples', label: 'מקדשים', labelEn: 'Temples', icon: '🛕' },
      { id: 'food', label: 'אוכל', labelEn: 'Food', icon: '🍜' },
      { id: 'graffiti', label: 'גרפיטי', labelEn: 'Street Art', icon: '🎨' },
      { id: 'artisans', label: 'מלאכה', labelEn: 'Crafts', icon: '🔨' },
      { id: 'galleries', label: 'גלריות', labelEn: 'Galleries', icon: '🖼️' },
      { id: 'architecture', label: 'ארכיטקטורה', labelEn: 'Architecture', icon: '🏛️' },
      { id: 'canals', label: 'תעלות', labelEn: 'Canals', icon: '🚤' },
      { id: 'cafes', label: 'קפה', labelEn: 'Coffee', icon: '☕' },
      { id: 'markets', label: 'שווקים', labelEn: 'Markets', icon: '🏪' },
      { id: 'nightlife', label: 'לילה', labelEn: 'Nightlife', icon: '🌃' },
      { id: 'parks', label: 'פארקים', labelEn: 'Parks', icon: '🌳' },
      { id: 'rooftop', label: 'גגות', labelEn: 'Rooftops', icon: '🌆' },
      { id: 'entertainment', label: 'בידור', labelEn: 'Entertainment', icon: '🎭' }
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
      { id: 'massage_spa', icon: '💆', label: 'עיסוי וספא', labelEn: 'Massage & Spa', name: 'עיסוי וספא', examples: 'Thai massage, wellness centers, spa' },
      { id: 'fitness', icon: '🏋️', label: 'כושר וספורט', labelEn: 'Fitness & Sports', name: 'כושר וספורט', examples: 'Gyms, yoga studios, Muay Thai, fitness' },
      { id: 'shopping_special', icon: '🛍️', label: 'קניות מיוחדות', labelEn: 'Special Shopping', name: 'קניות מיוחדות', examples: 'Boutiques, jewelry, fashion stores' },
      { id: 'learning', icon: '🎓', label: 'לימוד וחוויות', labelEn: 'Learning & Experiences', name: 'לימוד וחוויות', examples: 'Cooking classes, meditation, workshops' },
      { id: 'health', icon: '🏥', label: 'בריאות ורפואה', labelEn: 'Health & Medical', name: 'בריאות ורפואה', examples: 'Clinics, pharmacies, health services' },
      { id: 'accommodation', icon: '🏨', label: 'אירוח', labelEn: 'Accommodation', name: 'אירוח', examples: 'Hotels, hostels, guesthouses' },
      { id: 'transport', icon: '🚗', label: 'תחבורה', labelEn: 'Transport', name: 'תחבורה', examples: 'Car rental, bike rental, transportation' },
      { id: 'business', icon: '💼', label: 'עסקים', labelEn: 'Business', name: 'עסקים', examples: 'Coworking, offices, business centers' }
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
    active: false,
    distanceMultiplier: 1.2,
    center: { lat: 32.0853, lng: 34.7818 },
    allCityRadius: 15000,

    areas: [
      { id: 'tlv-north', label: 'צפון תל אביב', labelEn: 'North Tel Aviv', desc: 'הנמל, פארק הירקון, בזל', descEn: 'Port, Yarkon Park, Basel', lat: 32.1033, lng: 34.7750, radius: 2000, size: 'large', safety: 'safe' },
      { id: 'tlv-center', label: 'מרכז תל אביב', labelEn: 'Central Tel Aviv', desc: 'רוטשילד, דיזנגוף, הבימה', descEn: 'Rothschild, Dizengoff, Habima', lat: 32.0731, lng: 34.7746, radius: 2000, size: 'large', safety: 'safe' },
      { id: 'tlv-south', label: 'דרום ת"א ויפו', labelEn: 'South TLV & Jaffa', desc: 'שוק הפשפשים, נמל יפו, פלורנטין', descEn: 'Flea market, Jaffa port, Florentin', lat: 32.0515, lng: 34.7561, radius: 2500, size: 'large', safety: 'caution' },
      { id: 'holon', label: 'חולון', labelEn: 'Holon', desc: 'מוזיאון הילדים, עיצוב, פארקים', descEn: 'Children museum, design, parks', lat: 32.0114, lng: 34.7748, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'bat-yam', label: 'בת ים', labelEn: 'Bat Yam', desc: 'חוף, טיילת, אוכל', descEn: 'Beach, boardwalk, food', lat: 32.0236, lng: 34.7515, radius: 1800, size: 'medium', safety: 'safe' },
      { id: 'petah-tikva', label: 'פתח תקווה', labelEn: 'Petah Tikva', desc: 'מסעדות, פארקים, קניונים', descEn: 'Restaurants, parks, malls', lat: 32.0841, lng: 34.8878, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'herzliya', label: 'הרצליה', labelEn: 'Herzliya', desc: 'מרינה, חופים, הייטק', descEn: 'Marina, beaches, hi-tech', lat: 32.1629, lng: 34.7987, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'ramat-gan', label: 'רמת גן וגבעתיים', labelEn: 'Ramat Gan & Givatayim', desc: 'הבורסה, ספארי, פארקים', lat: 32.0804, lng: 34.8135, radius: 2500, size: 'large', safety: 'safe' },
      { id: 'bnei-brak', label: 'בני ברק', labelEn: 'Bnei Brak', desc: 'שווקים, אוכל, תרבות חרדית', descEn: 'Markets, food, ultra-orthodox culture', lat: 32.0834, lng: 34.8338, radius: 1500, size: 'medium', safety: 'safe' }
    ],

    interests: [
      { id: 'food', label: 'אוכל', labelEn: 'Food', icon: '🍽️' },
      { id: 'cafes', label: 'קפה', labelEn: 'Coffee', icon: '☕' },
      { id: 'beaches', label: 'חופים', labelEn: 'Beaches', icon: '🏖️' },
      { id: 'graffiti', label: 'גרפיטי', labelEn: 'Street Art', icon: '🎨' },
      { id: 'galleries', label: 'גלריות', labelEn: 'Galleries', icon: '🖼️' },
      { id: 'architecture', label: 'באוהאוס', labelEn: 'Bauhaus', icon: '🏛️' },
      { id: 'markets', label: 'שווקים', labelEn: 'Markets', icon: '🏪' },
      { id: 'nightlife', label: 'לילה', labelEn: 'Nightlife', icon: '🌃' },
      { id: 'parks', label: 'פארקים', labelEn: 'Parks', icon: '🌳' },
      { id: 'shopping', label: 'קניות', labelEn: 'Shopping', icon: '🛍️' },
      { id: 'culture', label: 'תרבות', labelEn: 'Culture', icon: '🎭' },
      { id: 'history', label: 'היסטוריה', labelEn: 'History', icon: '🏚️' }
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
      { id: 'fitness', icon: '🏋️', label: 'כושר וספורט', labelEn: 'Fitness & Sports', name: 'כושר וספורט', examples: 'Gyms, yoga, pilates, cycling' },
      { id: 'wellness', icon: '💆', label: 'ספא ורווחה', labelEn: 'Spa & Wellness', name: 'ספא ורווחה', examples: 'Spa, massage, wellness' },
      { id: 'coworking', icon: '💻', label: 'עבודה', labelEn: 'Coworking', name: 'חללי עבודה', examples: 'Coworking, cafes with wifi' }
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
    active: false,
    distanceMultiplier: 1.2,
    center: { lat: 1.3521, lng: 103.8198 },
    allCityRadius: 15000,

    areas: [
      { id: 'marina-bay', label: 'מרינה ביי', labelEn: 'Marina Bay', desc: 'מגדלים, גנים, אטרקציות', lat: 1.2816, lng: 103.8636, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'chinatown-sg', label: 'צ\'יינה טאון', labelEn: 'Chinatown', desc: 'מקדשים, אוכל רחוב, שווקים', lat: 1.2833, lng: 103.8440, radius: 1200, size: 'small', safety: 'safe' },
      { id: 'little-india', label: 'ליטל אינדיה', labelEn: 'Little India', desc: 'צבעוני, תבלינים, מקדשים הינדיים', lat: 1.3066, lng: 103.8518, radius: 1200, size: 'small', safety: 'safe' },
      { id: 'kampong-glam', label: 'קאמפונג גלאם', labelEn: 'Kampong Glam', desc: 'ערבי, גרפיטי, היפסטרים', lat: 1.3015, lng: 103.8596, radius: 1000, size: 'small', safety: 'safe' },
      { id: 'orchard', label: 'אורצ\'רד', labelEn: 'Orchard Road', desc: 'קניות, קניונים, יוקרה', descEn: 'Shopping, malls, luxury', lat: 1.3048, lng: 103.8318, radius: 1500, size: 'medium', safety: 'safe' },
      { id: 'sentosa', label: 'סנטוסה', labelEn: 'Sentosa', desc: 'חופים, יוניברסל, בידור', descEn: 'Beaches, Universal, entertainment', lat: 1.2494, lng: 103.8303, radius: 2000, size: 'large', safety: 'safe' },
      { id: 'tiong-bahru', label: 'טיונג בארו', labelEn: 'Tiong Bahru', desc: 'קפה, גרפיטי, ארט דקו', descEn: 'Coffee, graffiti, art deco', lat: 1.2847, lng: 103.8310, radius: 1000, size: 'small', safety: 'safe' },
      { id: 'holland-v', label: 'הולנד וילאג\'', labelEn: 'Holland Village', desc: 'שכונתי, ברים, קפה', lat: 1.3112, lng: 103.7958, radius: 1200, size: 'small', safety: 'safe' },
      { id: 'clarke-quay', label: 'קלארק קי', labelEn: 'Clarke Quay', desc: 'נהר, ברים, חיי לילה', lat: 1.2906, lng: 103.8465, radius: 1000, size: 'small', safety: 'safe' },
      { id: 'bugis', label: 'בוגיס', labelEn: 'Bugis / Bras Basah', desc: 'תרבות, מוזיאונים, שווקים', lat: 1.2993, lng: 103.8558, radius: 1200, size: 'medium', safety: 'safe' }
    ],

    interests: [
      { id: 'food', label: 'אוכל', labelEn: 'Food', icon: '🍜' },
      { id: 'cafes', label: 'קפה', labelEn: 'Coffee', icon: '☕' },
      { id: 'hawkers', label: 'הוקרס', labelEn: 'Hawkers', icon: '🥘' },
      { id: 'temples', label: 'מקדשים', labelEn: 'Temples', icon: '🛕' },
      { id: 'gardens', label: 'גנים', labelEn: 'Gardens', icon: '🌺' },
      { id: 'architecture', label: 'ארכיטקטורה', labelEn: 'Architecture', icon: '🏛️' },
      { id: 'graffiti', label: 'גרפיטי', labelEn: 'Street Art', icon: '🎨' },
      { id: 'galleries', label: 'גלריות', labelEn: 'Galleries', icon: '🖼️' },
      { id: 'markets', label: 'שווקים', labelEn: 'Markets', icon: '🏪' },
      { id: 'nightlife', label: 'לילה', labelEn: 'Nightlife', icon: '🌃' },
      { id: 'shopping', label: 'קניות', labelEn: 'Shopping', icon: '🛍️' },
      { id: 'rooftop', label: 'גגות', labelEn: 'Rooftops', icon: '🌆' }
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
      { id: 'wellness', icon: '💆', label: 'ספא ורווחה', labelEn: 'Spa & Wellness', name: 'ספא ורווחה', examples: 'Spa, massage, wellness' },
      { id: 'adventure', icon: '🎢', label: 'אטרקציות', labelEn: 'Attractions', name: 'אטרקציות', examples: 'Theme parks, zoo, aquarium' }
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

  // City name for search queries (replaces hardcoded "Bangkok")
  window.BKK.cityNameForSearch = city.nameEn;

  console.log('[CONFIG] City selected: ' + city.nameEn + ' (' + city.areas.length + ' areas, ' + city.interests.length + ' interests)');
  return true;
};

// Default: load saved city or Bangkok
(function() {
  // Restore city active/inactive states
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
  if (!window.BKK.cities[savedCity]) savedCity = 'bangkok';
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
