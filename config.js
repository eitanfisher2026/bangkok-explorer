// ============================================================================
// Bangkok Explorer - Configuration & Constants
// Copyright © 2026 Eitan Fisher. All Rights Reserved.
// ============================================================================

window.BKK = window.BKK || {};

// App Version
window.BKK.VERSION = '2.13.0';

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
  { id: 'riverside', label: 'ריברסייד', labelEn: 'Riverside', icon: '🌊' },
  { id: 'siam', label: 'סיאם', labelEn: 'Siam / Pratunam', icon: '🛍️' },
  { id: 'chatuchak', label: 'צ\'אטוצ\'אק', labelEn: 'Chatuchak', icon: '🏪' },
  { id: 'silom', label: 'סילום', labelEn: 'Silom / Sathorn', icon: '🌃' },
  { id: 'ratchada', label: 'ראצ\'אדה', labelEn: 'Ratchada', icon: '🌙' },
  { id: 'onnut', label: 'און נאט', labelEn: 'On Nut', icon: '🍜' },
  { id: 'bangrak', label: 'באנג ראק', labelEn: 'Bang Rak', icon: '🎭' }
];

// Area coordinates (center points + radius)
window.BKK.areaCoordinates = {
  'sukhumvit': { lat: 13.7370, lng: 100.5610, radius: 2500 },
  'old-town': { lat: 13.7500, lng: 100.4914, radius: 2000 },
  'chinatown': { lat: 13.7408, lng: 100.5050, radius: 1500 },
  'thonglor': { lat: 13.7320, lng: 100.5830, radius: 2000 },
  'ari': { lat: 13.7790, lng: 100.5410, radius: 2000 },
  'riverside': { lat: 13.7270, lng: 100.4965, radius: 2000 },
  'siam': { lat: 13.7460, lng: 100.5340, radius: 1500 },
  'chatuchak': { lat: 13.7999, lng: 100.5500, radius: 1500 },
  'silom': { lat: 13.7262, lng: 100.5235, radius: 1800 },
  'ratchada': { lat: 13.7650, lng: 100.5730, radius: 1500 },
  'onnut': { lat: 13.7060, lng: 100.6010, radius: 1800 },
  'bangrak': { lat: 13.7280, lng: 100.5130, radius: 1000 }
};

// Help content for all views
window.BKK.helpContent = {
  main: {
    title: 'איך להשתמש?',
    content: `**בנגקוק אקספלורר** עוזר לך לגלות מקומות מעניינים בבנגקוק ולתכנן מסלול טיול.

**3 צעדים פשוטים:**
1. **בחר איזור** בבנגקוק (או חפש לפי רדיוס ממיקום)
2. **בחר מה מעניין אותך** — לחץ על האייקונים (מקדשים, אוכל, גרפיטי...)
3. **לחץ "מצא נקודות עניין"** — המערכת תמצא מקומות מתאימים

**מה אפשר לעשות עם התוצאות:**
• ⏸️ השהה מקום שלא מעניין אותך כרגע
• 📌 בחר נקודת התחלה מהרשימה
• ➕ הוסף מקומות ידנית
• 💾 שמור את המסלול לפעם הבאה

**טיפ:** לחץ על שם מקום כדי לפתוח אותו בגוגל מפות!`
  },
  placesListing: {
    title: 'רשימת המקומות',
    content: `**איך המקומות נבחרים?**
קודם מופיעים מקומות שהוספת בעצמך, ואחר כך מקומות מגוגל לפי דירוג.

**כפתורים ליד כל מקום:**
• ⏸️ — השהה (לא ייכלל במסלול). לחץ ▶️ כדי להחזיר
• 📌 — קבע כנקודת התחלה
• + — הוסף למקומות שלי
• ✏️ — ערוך פרטים
• 🗑️ — הסר (רק מקומות שנוספו ידנית)

**"+ עוד"** ליד כל קטגוריה מביא מקומות נוספים מאותו סוג.

**לחיצה על שם המקום** פותחת אותו בגוגל מפות.`
  },
  route: {
    title: 'תוצאות המסלול',
    content: `**אחרי "מצא נקודות עניין"** מופיעה רשימת מקומות מחולקת לפי תחום.

**כדי לבנות מסלול:**
1. בחר 📌 נקודת התחלה (מהרשימה, חיפוש כתובת, או מיקום GPS)
2. לחץ "חשב מסלול" — המערכת תסדר את הנקודות בסדר הכי הגיוני

**פעולות נוספות:**
• 💾 **שמור** — שומר את המסלול לשימוש עתידי
• 🗺️ **פתח בגוגל** — מציג את המסלול המחושב בגוגל מפות
• ➕ **הוסף ידנית** — הוסף מקום שלא מופיע ברשימה
• ⏸️ **השהה** מקומות שלא מתאימים לך כרגע`
  },
  myContent: {
    title: 'התוכן שלי',
    content: `כאן אפשר לנהל את המקומות והתחומים שלך.

**📍 המקומות שלי** — מקומות שהוספת בעצמך. הם מקבלים עדיפות על מקומות מגוגל!

**🏷️ התחומים שלי** — בחר אילו תחומי עניין יופיעו בחיפוש (מקדשים, אוכל, גרפיטי...). אפשר גם ליצור תחומים חדשים.`
  },
  myPlaces: {
    title: 'המקומות שלי',
    content: `**מקומות שהוספת** מופיעים ראשונים בתוצאות החיפוש!

**להוספת מקום:** לחץ "➕ הוסף מקום", הזן שם ובחר תחום עניין.

**פעולות:**
• ✏️ ערוך פרטים
• 🗑️ מחק מקום
• 🚫 רשימה שחורה — מקום שלא תרצה לראות יותר

**טיפ:** אפשר גם להוסיף מקומות ישירות מתוצאות החיפוש בלחיצה על כפתור +`
  },
  myInterests: {
    title: 'התחומים שלי',
    content: `**תחומי העניין** קובעים אילו סוגי מקומות תמצא בחיפוש.

**פעיל ✅** — מופיע בחיפוש. לחץ ⏸️ להסתרה.
**מושהה ⏸️** — מוסתר מהחיפוש. לחץ ▶️ להחזרה.

**אפשר גם:**
• ➕ ליצור תחום חדש משלך
• ⚙️ לערוך הגדרות חיפוש של תחום

**שים לב:** תחום עם מסגרת אדומה חסר הגדרות חיפוש ולא יעבוד.`
  },
  interestConfig: {
    title: 'הגדרות תחום',
    content: `**הגדרות החיפוש של התחום**

**שם התחום:**
השם שיופיע ברשימת התחומים.

**סוג חיפוש (Place Types):**
קטגוריות של Google למשל: temple, restaurant, museum.
המערכת מביאה מקומות שהסוג שלהם מתאים לאחת הקטגוריות.

**חיפוש טקסט (Text Search):**
חיפוש חופשי, למשל: "street art", "rooftop bar".
המערכת מביאה מקומות שגוגל מצא לפי הטקסט, ומסננת כאלה שהשם שלהם לא מכיל את הביטוי.

**מילות סינון (Blacklist):**
מילים שאם מופיעות בשם המקום, הוא לא ייכלל. למשל: "cannabis", "massage" - כדי לסנן מקומות לא רלוונטים.

**⚠️ חשוב:** תחום בלי הגדרות חיפוש לא יעבוד!`
  },
  searchLogic: {
    title: 'איך המערכת מוצאת מקומות?',
    content: `**סדר המציאה:**
1. **קודם** - המקומות שלך (מותאמים אישית) שתואמים לאזור ולתחום
2. **אחר כך** - מקומות מ-Google Places API

**סינון מקומות מגוגל:**
• מקום עם שם שמכיל מילת סינון (blacklist) = מסונן
• מקום ששמו זהה למקום שלך = מסונן (מניעת כפילויות)
• מקום "דלג לצמיתות" = מסונן
• חיפוש טקסט: רק מקומות שהשם שלהם מכיל את ביטוי החיפוש המלא

**תיעדוף:**
• מקומות ממוינים לפי דירוג (מהגבוה לנמוך)
• הדירוג משמש רק לסדר, לא לסינון - גם מקומות עם דירוג נמוך ייכללו

**כמות:**
• מספר המקומות מחולק שווה בין התחומים שבחרת
• ניתן לשנות בהגדרות

**"+ עוד":**
• מוסיף מקומות נוספים מאותו תחום (ברירת מחדל: 3)
• המקומות החדשים מסומנים בגבול כחול מקווקו`
  },
  saved: {
    title: 'מסלולים שמורים',
    content: `**מה יש כאן:**
כל המסלולים ששמרת לשימוש עתידי.

**שמירת מסלול:**
• לחץ "💾 שמור מסלול" במסך המסלול
• תן שם ייחודי (חובה)
• הוסף הערות אם רוצה

**פעולות:**
• לחץ על מסלול לטעינה מחדש
• 🗑️ למחיקת מסלול

**טיפ:**
מסלולים נכללים בייצוא/ייבוא בהגדרות!`
  },
  settings: {
    title: 'הגדרות',
    content: `**הגדרות המערכת:**

**מספר מקומות:**
• כמות המקומות המקסימלית במסלול
• כמות מקומות נוספים ב"מצא עוד"

**ייבוא/ייצוא:**
• **ייצוא** - שומר הכל לקובץ JSON:
  - מקומות מותאמים
  - תחומים מותאמים
  - הגדרות חיפוש
  - סטטוס תחומים
  - מסלולים שמורים

• **ייבוא** - מוסיף מקובץ:
  - כפילויות ידולגו
  - הגדרות יתמזגו
  - שום דבר לא יימחק

**Admin (למנהלים):**
• צפייה בלוג כניסות
• ניהול מכשירים מורשים
• סיסמת Admin`
  },
  addLocation: {
    title: 'הוספת/עריכת מקום',
    content: `**חובה:** שם המקום + תחום עניין אחד לפחות.

**שדות נוספים (לא חובה):**
• איזור, כתובת, הערות, תמונה
• קישור מגוגל מפות

**קואורדינטות** — נדרשות כדי שהמקום יופיע במסלול.
הדרך הקלה: לחץ 🔤 (חיפוש לפי שם) או הדבק קישור מגוגל מפות ולחץ 🔗.

**כפתורים למטה:**
• **הוסף/עדכן** — שומר ונשאר בחלון
• **X** למעלה — סוגר בלי לשמור`
  },
  addInterest: {
    title: 'הוספת/עריכת תחום עניין',
    content: `**תחום עניין מותאם** — קטגוריה חדשה שאתה יוצר, למשל "בתי קולנוע" או "גגות".

**שדות בסיס:** שם + אייקון (אימוג'י).

**הגדרות חיפוש (חובה):**
• **Category** — חיפוש לפי סוג מקום בגוגל (למשל: museum, restaurant)
• **Text** — חיפוש חופשי (למשל: "rooftop bar")

**מילות סינון** — מקומות עם מילים אלו בשם לא ייכללו.

**שים לב:** בלי הגדרות חיפוש התחום לא יעבוד (יסומן באדום).`
  }
};

console.log('[CONFIG] Loaded successfully');

