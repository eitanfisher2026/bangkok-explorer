// ============================================================================
// Bangkok Explorer - Configuration & Constants
// Copyright © 2026 Eitan Fisher. All Rights Reserved.
// ============================================================================

window.BKK = window.BKK || {};

// App Version
window.BKK.VERSION = '2.11.2';

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
    title: 'תכנון מסלול',
    content: `**מה זה Bangkok Explorer?**
אפליקציה לתכנון מסלולי טיול בבנגקוק. בחר תחומי עניין ואזור, והמערכת תבנה לך מסלול מותאם.

**איך להתחיל:**
• בחר **איזור** - האזור בבנגקוק שמעניין אותך
• בחר **תחומי עניין** - לחץ על האייקונים (מקדשים, אוכל, קניות...)
• לחץ **"מצא נקודות עניין"** - הכמות מוצגת בסוגריים (ניתן לשנות בהגדרות)

**סוגי מסלול:**
• 🔄 **מעגלי** - מסלול שחוזר לנקודת ההתחלה
• ➡️ **ליניארי** - מסלול בקו ישר מנקודה לנקודה

**טיפ:**
לטיול גמיש בלי סדר מוגדר - בחר לאן ללכת בעצמך מתוך הרשימה, או השתמש ב"הצג נקודות על המפה".`
  },
  placesListing: {
    title: 'רשימת המקומות',
    content: `**איך נבחרו המקומות?**
1. קודם - המקומות שהוספת בעצמך
2. אחר כך - מקומות מ-Google לפי דירוג גבוה

**כמות המקומות לכל תחום:**
מחושבת לפי: סה"כ מקומות (מההגדרות) חלקי מספר תחומי העניין שבחרת.

**כפתורים בכל מקום:**
• ✕ **אפור** - דלג זמנית (הופך ל-⏸️ צהוב כשמושהה)
• ⏸️ **צהוב** - החזר למסלול (לחיצה מבטלת השהיה)
• 🚫 **אדום** - דלג לצמיתות (לא יופיע יותר)
• ✅ **ירוק** - בטל דילוג קבוע
• + **סגול** - הוסף לרשימה שלי
• ✏️ **כחול** - ערוך (רק למקומות שלי)

**כפתורים למטה:**
• 💾 **סגול** - שמור מסלול (שם + הערות)
• 🗺️ **ירוק** - פתח את המסלול ב-Google Maps

**"+ עוד" ליד כל תחום:**
מוסיף מקומות נוספים מאותו סוג.

**לחיצה על שם המקום** פותחת אותו ב-Google Maps.`
  },
  route: {
    title: 'תוצאות המסלול',
    content: `**לוגיקת המקומות:**
המערכת מביאה קודם את המקומות שלך (מותאמים אישית), ואחר כך משלימה עם מקומות מ-Google לפי דירוג גבוה.

**כפתורים בכל מקום:**
• 🗺️ **מפה** - פתיחה ב-Google Maps
• ✏️ **עריכה** - עריכת פרטי המקום
• 🚫 **דילוג** - הסרה זמנית מהמסלול הנוכחי
• 🔙 **החזרה** - החזרת מקום שדולג
• לחיצה על השם - פרטים מלאים

**כפתורים כלליים:**
• **"פתח ב-Google Maps"** - פתיחת המסלול המחושב במפות
• **"מצא עוד"** - הוספת מקומות נוספים לתחום מסוים
• **"שמור מסלול"** - שמירה לשימוש עתידי
• **"מסלול חדש"** - התחלה מחדש

**סימונים:**
• ⭐ - מקום מותאם אישית (שלך)
• 🛠️ - מקום בתהליך עדכון
• ⚠️ - חסרות קואורדינטות
• 🚫 - מקום שדולג (זמנית במסלול זה)`
  },
  myContent: {
    title: 'התוכן שלי',
    content: `**מבנה חדש - שני מסכים:**

**📍 המקומות שלי:**
• ניהול מקומות מותאמים אישית
• הוספה, עריכה, מחיקה
• סטטוס: פעיל / רשימה שחורה
• מקומות שלך מקבלים עדיפות!

**🏷️ התחומים שלי:**
• כל תחומי העניין במערכת
• ✅ **פעילים** - מופיעים בחיפוש
• ⏸️ **לא פעילים** - מוסתרים מהחיפוש
• ⚙️ הגדרות חיפוש לכל תחום
• ➕ הוספת תחומים חדשים

**סוגי תחומים:**
• **מובנים** - תחומים קבועים (ניתן להשבית)
• **לא נכללים** - לא פעילים כברירת מחדל
• **מותאמים** - תחומים שיצרת (ניתן למחוק)

**טיפ:** תחום ללא הגדרות חיפוש מסומן באדום ולא יעבוד!`
  },
  myPlaces: {
    title: 'המקומות שלי',
    content: `**ניהול מקומות מותאמים אישית**

**הוספת מקום:**
• לחץ **"+ הוסף מקום"**
• הזן שם ותחום עניין (חובה)
• הוסף קואורדינטות, תמונה, הערות

**פעולות:**
• ✏️ **עריכה** - שינוי פרטי המקום
• 🗑️ **מחיקה** - הסרה מהמערכת
• 🔍 **בדיקה** - מידע מ-Google על המקום

**סטטוס מקום:**
• ✅ **פעיל** - יופיע במסלולים
• 🚫 **רשימה שחורה** - לא יופיע לעולם

**מקומות שלך מקבלים עדיפות** על פני מקומות מ-Google!`
  },
  myInterests: {
    title: 'התחומים שלי',
    content: `**ניהול כל תחומי העניין**

**תחומים פעילים (✅):**
• מופיעים בטופס החיפוש
• ⚙️ לשינוי הגדרות חיפוש
• ❌ להשבתה

**תחומים לא פעילים (⏸️):**
• מוסתרים מהחיפוש
• ✅ הפעל - להוספה לחיפוש

**סוגי תחומים:**
• **מובנים** - מקדשים, אוכל, גרפיטי... (לא ניתן למחוק)
• **לא נכללים** - עיסוי, כושר... (כבויים כברירת מחדל)
• **מותאמים (חדש)** - תחומים שיצרת (ניתן למחוק)

**⚠️ תחום לא תקין:**
• מסגרת אדומה = חסר הגדרות חיפוש
• לא יעבוד עד שתגדיר Place Types`
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
    content: `**שדות חובה:**
• **שם** - שם המקום
• **תחום עניין** - לפחות אחד

**שדות נוספים:**
• **איזור** - לסינון לפי אזור בבנגקוק
• **תמונה** - העלאה מהמכשיר או קישור
• **כתובת** - טקסט חופשי
• **קישור Maps** - העתק מ-Google Maps
• **הערות** - מידע נוסף לעצמך

**מה זה קואורדינטות?**
מיקום מדויק על המפה (קו רוחב + קו אורך).
בלי קואורדינטות - המקום לא יופיע במסלול ב-Google Maps!

**איך להשיג קואורדינטות:**
• 🔤 **שם** - חיפוש אוטומטי לפי שם המקום
• 🏠 **כתובת** - חיפוש לפי הכתובת שהזנת
• 🔗 **קישור** - חילוץ מקישור Google Maps
• 📍 **מיקום** - GPS - המיקום הנוכחי שלך
• 🗺️ **בדוק** - פתיחה במפה לאימות

**טיפ לקישור Maps:**
1. פתח Google Maps ומצא את המקום
2. לחץ על המקום ואז "שתף"
3. העתק את הקישור והדבק בשדה "קישור Maps"
4. לחץ 🔗 לחילוץ הקואורדינטות

**כפתורים:**
• **הוסף/עדכן** - שומר ונשאר פתוח
• **סגור** - שומר וסוגר
• **X** - סוגר בלי לשמור`
  },
  addInterest: {
    title: 'הוספת/עריכת תחום עניין',
    content: `**מה זה תחום עניין מותאם?**
קטגוריה חדשה שאתה יוצר עם הגדרות חיפוש משלך.

**שדות בסיס:**
• **שם התחום** - השם שיוצג (לדוגמה: "בתי קולנוע")
• **אייקון** - אימוג'י שייצג את התחום

**הגדרות חיפוש (חובה!):**
• **Search Mode:**
  - **Category** - חיפוש לפי סוגי מקומות
  - **Text** - חיפוש טקסט חופשי

• **Place Types** (למצב Category):
  - רשימה מופרדת בפסיקים
  - לדוגמה: movie_theater, cinema
  - [קישור לרשימת הסוגים]

• **Text Query** (למצב Text):
  - לדוגמה: street art
  - יחפש: "[query] [area] Bangkok"

• **Blacklist:**
  - מילים לסינון (cannabis, massage...)

**⚠️ חשוב:**
תחום ללא Place Types או Text Query לא יעבוד!
יסומן באדום עד שתגדיר.

**כפתורים:**
• **הוסף** - שומר ונשאר פתוח
• **שמור** - עדכון תחום קיים
• **סגור** - שומר וסוגר`
  }
};

console.log('[CONFIG] Loaded successfully');

