
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
    content: `**מה יש כאן:**
ניהול המקומות ותחומי העניין שהוספת בעצמך.

**מקומות מותאמים אישית:**
• לחץ **"+ הוסף מקום"** להוספת מקום חדש
• לחץ על מקום קיים לצפייה בפרטים
• ✏️ לעריכה, 🗑️ למחיקה

**תחומי עניין:**
• לחץ **"+ הוסף תחום"** ליצירת קטגוריה חדשה
• בחר אייקון ושם
• תחומים מותאמים יופיעו בבחירת תחומי עניין

**סטטוס מקום:**
• ✅ **פעיל** - יופיע במסלולים
• 🚫 **רשימה שחורה** - לא יופיע לעולם

**טיפ:** מקומות שלך מקבלים עדיפות על פני מקומות מ-Google!`
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

**מקור נתונים:**
• **דינמי** - נתונים משותפים (Firebase) - מומלץ
• **סטטי** - נתונים מקומיים בלבד (לפיתוח)

**ייבוא/ייצוא:**
• **ייצוא** - שומר את כל המקומות והתחומים שלך לקובץ JSON
• **ייבוא** - מוסיף מקומות ותחומים מקובץ

**איך עובד הייבוא:**
• כפילויות (לפי שם) ידולגו אוטומטית
• תחומים חסרים ייווצרו אוטומטית
• שום דבר לא יימחק - רק הוספה

**Admin (למנהלים):**
• צפייה בלוג כניסות
• ניהול מכשירים מורשים`
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
    title: 'הוספת תחום עניין',
    content: `**מה זה תחום עניין מותאם?**
תת-תחום חדש שאתה יוצר, מבוסס על תחום קיים במערכת.

**שדות:**
• **שם התחום** - השם שיוצג (לדוגמה: "בתי קולנוע")
• **אייקון** - אימוג'י שייצג את התחום
• **תחום בסיס** - התחום הקיים שאליו יתווסף התחום החדש כתת-תחום

**איך זה עובד?**
ב"מצא מקומות", כשתבחר את התחום החדש, המערכת תחפש בגוגל מקומות מתחום הבסיס שכוללים את התחום החדש.

**דוגמה:**
תחום חדש: "בתי קולנוע" 🎬
תחום בסיס: "בידור" 🎭
→ המערכת תחפש מקומות בידור שהם בתי קולנוע

**כפתורים:**
• **הוסף** - שומר ונשאר פתוח להוספה נוספת
• **סגור** - שומר וסוגר
• **X** - סוגר בלי לשמור`
  }
};

console.log('[CONFIG] Loaded successfully');

    </script>
    <script>
// ============================================================================
// Bangkok Explorer - Utility Functions
// Copyright © 2026 Eitan Fisher. All Rights Reserved.
// Pure functions - no React state dependency
// ============================================================================

window.BKK = window.BKK || {};

// ============================================================================
// GEOLOCATION & COORDINATES
// ============================================================================

/**
 * Check if a location is within an area's boundaries using Haversine formula
 * @returns {{ valid: boolean, distance: number, distanceKm: string }}
 */
window.BKK.checkLocationInArea = (lat, lng, areaId) => {
  const area = window.BKK.areaCoordinates[areaId];
  if (!area || !lat || !lng) return { valid: true, distance: 0 };
  
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = lat * Math.PI / 180;
  const lat2Rad = area.lat * Math.PI / 180;
  const deltaLat = (area.lat - lat) * Math.PI / 180;
  const deltaLng = (area.lng - lng) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return { 
    valid: distance <= area.radius, 
    distance: Math.round(distance),
    distanceKm: (distance / 1000).toFixed(1)
  };
};

/**
 * Extract coordinates from Google Maps URL (various formats)
 * @returns {{ lat: number, lng: number } | null}
 */
window.BKK.extractCoordsFromUrl = (url) => {
  if (!url || !url.trim()) return null;

  let lat = null, lng = null;
  let match;
  
  // Format 1: ?q=13.7465,100.4927
  match = url.match(/[?&]q=([-\d.]+),([-\d.]+)/);
  if (match) { lat = parseFloat(match[1]); lng = parseFloat(match[2]); }
  
  // Format 2: @13.7465,100.4927,17z
  if (!lat) {
    match = url.match(/@([-\d.]+),([-\d.]+)/);
    if (match) { lat = parseFloat(match[1]); lng = parseFloat(match[2]); }
  }
  
  // Format 3: &ll=13.7465,100.4927
  if (!lat) {
    match = url.match(/[?&]ll=([-\d.]+),([-\d.]+)/);
    if (match) { lat = parseFloat(match[1]); lng = parseFloat(match[2]); }
  }
  
  // Format 4: Shortened URLs (goo.gl)
  if (!lat && (url.includes('goo.gl') || url.includes('maps.app'))) {
    return { lat: null, lng: null, shortened: true };
  }
  
  // Format 5: Raw coordinates: 13.7465,100.4927
  if (!lat) {
    match = url.match(/^([-\d.]+)\s*,\s*([-\d.]+)$/);
    if (match) { lat = parseFloat(match[1]); lng = parseFloat(match[2]); }
  }
  
  if (lat !== null && lng !== null) {
    return { lat, lng };
  }
  return null;
};

/**
 * Geocode address using Google Places Text Search API
 * @returns {{ lat, lng, address, displayName } | null}
 */
window.BKK.geocodeAddress = async (address) => {
  if (!address || !address.trim()) return null;

  const searchQuery = address.toLowerCase().includes('bangkok') 
    ? address 
    : `${address}, Bangkok, Thailand`;
  
  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': window.BKK.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress'
      },
      body: JSON.stringify({ textQuery: searchQuery, maxResultCount: 1 })
    }
  );
  
  const data = await response.json();
  
  if (data.places && data.places.length > 0) {
    const place = data.places[0];
    return {
      lat: place.location.latitude,
      lng: place.location.longitude,
      address: place.formattedAddress || place.displayName?.text || searchQuery,
      displayName: place.displayName?.text || ''
    };
  }
  return null;
};

/**
 * Geocode by place name
 * @returns {{ lat, lng, address, displayName } | null}
 */
window.BKK.geocodeByName = async (name) => {
  if (!name || !name.trim()) return null;

  const searchQuery = name.toLowerCase().includes('bangkok') 
    ? name 
    : `${name}, Bangkok, Thailand`;
  
  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': window.BKK.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress'
      },
      body: JSON.stringify({ textQuery: searchQuery, maxResultCount: 1 })
    }
  );
  
  const data = await response.json();
  
  if (data.places && data.places.length > 0) {
    const place = data.places[0];
    return {
      lat: place.location.latitude,
      lng: place.location.longitude,
      address: place.formattedAddress || '',
      displayName: place.displayName?.text || name
    };
  }
  return null;
};

/**
 * Reverse geocode: get address from coordinates
 * @returns {string} formatted address
 */
window.BKK.reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': window.BKK.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.formattedAddress'
        },
        body: JSON.stringify({ textQuery: `${lat},${lng}`, maxResultCount: 1 })
      }
    );
    
    const data = await response.json();
    if (data.places && data.places.length > 0) {
      return data.places[0].formattedAddress || '';
    }
    return '';
  } catch (error) {
    console.error('[REVERSE GEOCODE] Error:', error);
    return '';
  }
};

// ============================================================================
// IMAGE HANDLING
// ============================================================================

/**
 * Compress image file to target size
 * @returns {Promise<string>} base64 compressed image
 */
window.BKK.compressImage = (file, maxSizeKB = 200) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const maxDimension = 800;
        if (width > height && width > maxDimension) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        let quality = 0.8;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        
        while (compressed.length > maxSizeKB * 1024 * 1.37 && quality > 0.3) {
          quality -= 0.1;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        
        console.log('[IMAGE] Compressed:', {
          original: file.size,
          compressed: Math.round(compressed.length / 1024),
          quality
        });
        
        resolve(compressed);
      };
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Consistent button style generator
 */
window.BKK.getButtonStyle = (isActive = false, variant = 'primary') => {
  const baseStyle = {
    border: isActive ? '5px solid #f97316' : '3px solid #d1d5db',
    backgroundColor: isActive ? '#fed7aa' : '#ffffff',
    boxShadow: isActive ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none',
    padding: '12px 16px',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };
  
  if (variant === 'danger') {
    return {
      ...baseStyle,
      border: '3px solid #ef4444',
      backgroundColor: isActive ? '#fecaca' : '#ffffff',
      color: '#dc2626'
    };
  }
  
  if (variant === 'success') {
    return {
      ...baseStyle,
      border: '3px solid #10b981',
      backgroundColor: isActive ? '#d1fae5' : '#ffffff',
      color: '#059669'
    };
  }
  
  return baseStyle;
};

/**
 * Build Google Maps directions URL from stops
 */
window.BKK.buildMapsUrl = (stops, circular = false) => {
  if (!stops || stops.length === 0) return '';
  
  const validStops = stops.filter(s => s.lat && s.lng && s.lat !== 0 && s.lng !== 0);
  if (validStops.length === 0) return '';
  
  let waypoints = validStops.map(s => `${s.lat},${s.lng}`);
  
  if (circular && validStops.length > 1) {
    waypoints.push(waypoints[0]);
  }
  
  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const middlePoints = waypoints.slice(1, -1).join('|');
  
  let mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  if (middlePoints) {
    mapUrl += `&waypoints=${middlePoints}`;
  }
  mapUrl += '&travelmode=walking';
  
  return mapUrl;
};

/**
 * Parse user agent for readable browser/OS info
 */
window.BKK.parseUserAgent = (ua) => {
  let browser = 'Unknown', os = 'Unknown';
  if (ua.includes('SamsungBrowser')) browser = 'Samsung';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';
  return { browser, os };
};

console.log('[UTILS] Loaded successfully');

