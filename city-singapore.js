// City data: Singapore
window.BKK.cityData = window.BKK.cityData || {};
window.BKK.cityData.singapore = {

    id: 'singapore',
    name: 'סינגפור',
    nameEn: 'Singapore',
    country: 'Singapore',
    icon: '🦁',
    secondaryIcon: '🌴',
    theme: { color: '#c0392b', iconLeft: '🦁', iconRight: '🌺' },
    active: true,
    distanceMultiplier: 1.2,
    dayStartHour: 7,
    nightStartHour: 18,
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
};
