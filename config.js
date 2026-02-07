// Bangkok Explorer - Configuration & Constants
// Copyright © 2026 Eitan Fisher. All Rights Reserved.
// ============================================================================

window.BKK = window.BKK || {};

// App Version
window.BKK.VERSION = '2.7.1';

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

// Interests that use text search instead of category search
window.BKK.textSearchInterests = {
  graffiti: 'street art'
};

// Interest Options (base categories)
window.BKK.interestOptions = [
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
  { id: 'entertainment', label: 'בידור', icon: '🎭' },
];

// Map interests to Google Places API categories
window.BKK.interestToGooglePlaces = {
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
  entertainment: ['movie_theater', 'amusement_park', 'performing_arts_theater'],
};

// Interests NOT covered by the system
window.BKK.uncoveredInterests = [
  { id: 'massage_spa', icon: '💆', label: 'עיסוי וספא', name: 'עיסוי וספא', examples: 'Thai massage, wellness centers, spa' },
  { id: 'fitness', icon: '🏋️', label: 'כושר וספורט', name: 'כושר וספורט', examples: 'Gyms, yoga studios, Muay Thai, fitness' },
  { id: 'shopping_special', icon: '🛍️', label: 'קניות מיוחדות', name: 'קניות מיוחדות', examples: 'Boutiques, jewelry, fashion stores' },
  { id: 'learning', icon: '🎓', label: 'לימוד וחוויות', name: 'לימוד וחוויות', examples: 'Cooking classes, meditation, workshops' },
  { id: 'health', icon: '🏥', label: 'בריאות ורפואה', name: 'בריאות ורפואה', examples: 'Clinics, pharmacies, health services' },
  { id: 'accommodation', icon: '🏨', label: 'אירוח', name: 'אירוח', examples: 'Hotels, hostels, guesthouses' },
  { id: 'transport', icon: '🚗', label: 'תחבורה', name: 'תחבורה', examples: 'Car rental, bike rental, transportation' },
  { id: 'business', icon: '💼', label: 'עסקים', name: 'עסקים', examples: 'Coworking, offices, business centers' }
];

// Tooltip content for each interest
window.BKK.interestTooltips = {
  temples: 'מקדשים בודהיסטיים והינדיים',
  food: 'מסעדות ואוכל רחוב',
  graffiti: 'אומנות רחוב וגרפיטי',
  artisans: 'בתי מלאכה ואומנים',
  galleries: 'גלריות ומוזיאונים',
  architecture: 'בניינים היסטוריים',
  canals: 'שייטים בתעלות ובנהר',
  cafes: 'בתי קפה',
  markets: 'שווקים ובזארים',
  nightlife: 'ברים ומועדוני לילה',
  parks: 'גנים ופארקים',
  rooftop: 'ברים ומסעדות על גגות',
  entertainment: 'קולנוע, תיאטרון, מופעים',
};

// Area options
window.BKK.areaOptions = [
  { id: 'sukhumvit', label: 'סוקומווית', labelEn: 'Sukhumvit', icon: '🏙️' },
  { id: 'old-town', label: 'העיר העתיקה', labelEn: 'Old Town', icon: '🏰' },
  { id: 'chinatown', label: 'צ\'יינה טאון', labelEn: 'Chinatown', icon: '🏮' },
  { id: 'thonglor', label: 'תונגלור', labelEn: 'Thonglor', icon: '☕' },
  { id: 'ari', label: 'ארי', labelEn: 'Ari', icon: '🎨' },
  { id: 'riverside', label: 'ריברסייד', labelEn: 'Riverside', icon: '🌊' }
];

// Area coordinates (center points + radius)
window.BKK.areaCoordinates = {
  'sukhumvit': { lat: 13.7370, lng: 100.5610, radius: 2500 },
  'old-town': { lat: 13.7500, lng: 100.4914, radius: 2000 },
  'chinatown': { lat: 13.7408, lng: 100.5050, radius: 1500 },
  'thonglor': { lat: 13.7320, lng: 100.5830, radius: 2000 },
  'ari': { lat: 13.7790, lng: 100.5410, radius: 2000 },
  'riverside': { lat: 13.7270, lng: 100.4965, radius: 2000 }
};
