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
 * Get all areas that contain this coordinate (within radius)
 * @returns {string[]} Array of area IDs
 */
window.BKK.getAreasForCoordinates = (lat, lng) => {
  if (!lat || !lng) return [];
  const coords = window.BKK.areaCoordinates || {};
  const results = [];
  for (const [areaId, area] of Object.entries(coords)) {
    const check = window.BKK.checkLocationInArea(lat, lng, areaId);
    if (check.valid) results.push(areaId);
  }
  return results.length > 0 ? results : [];
};

/**
 * Normalize location areas: convert old 'area' string to 'areas' array
 * Backward-compatible migration
 */
window.BKK.normalizeLocationAreas = (loc) => {
  if (loc.areas && Array.isArray(loc.areas) && loc.areas.length > 0) {
    return loc.areas;
  }
  if (loc.area && typeof loc.area === 'string') {
    return [loc.area];
  }
  return ['sukhumvit'];
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

  const cityName = (window.BKK.selectedCity?.nameEn || 'Bangkok');
  const countryName = (window.BKK.selectedCity?.country || 'Thailand');
  const searchQuery = address.toLowerCase().includes(cityName.toLowerCase()) 
    ? address 
    : `${address}, ${cityName}, ${countryName}`;
  
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

  const cityName = (window.BKK.selectedCity?.nameEn || 'Bangkok');
  const countryName = (window.BKK.selectedCity?.country || 'Thailand');
  const searchQuery = name.toLowerCase().includes(cityName.toLowerCase()) 
    ? name 
    : `${name}, ${cityName}, ${countryName}`;
  
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
 * @returns {Promise<string>} base64 compressed image (fallback) or URL
 */
window.BKK.compressImage = (file, maxSizeKB = 150) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const maxDimension = 600;
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
        
        let quality = 0.7;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        
        while (compressed.length > maxSizeKB * 1024 * 1.37 && quality > 0.2) {
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

/**
 * Upload an image to Firebase Storage and return the download URL.
 * Falls back to base64 if Storage is not available.
 */
window.BKK.uploadImage = async (file, cityId, locationId) => {
  // Compress first
  const compressed = await window.BKK.compressImage(file);
  
  // Try Firebase Storage
  if (typeof firebase !== 'undefined' && firebase.storage) {
    try {
      const storageRef = firebase.storage().ref();
      const path = `cities/${cityId}/images/${locationId}_${Date.now()}.jpg`;
      const imageRef = storageRef.child(path);
      
      // Convert base64 to blob for upload
      const response = await fetch(compressed);
      const blob = await response.blob();
      
      const snapshot = await imageRef.put(blob, { contentType: 'image/jpeg' });
      const downloadURL = await snapshot.ref.getDownloadURL();
      
      console.log('[STORAGE] Uploaded image:', path, 'URL:', downloadURL.substring(0, 60) + '...');
      return downloadURL;
    } catch (err) {
      console.error('[STORAGE] Upload failed, falling back to base64:', err);
      return compressed;
    }
  }
  
  // Fallback: return base64
  console.log('[STORAGE] Not available, using base64 fallback');
  return compressed;
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

/**
 * SHA-256 hash a string (for password protection)
 * Returns hex string. Uses Web Crypto API.
 */
window.BKK.hashPassword = async function(password) {
  if (!password) return '';
  var encoder = new TextEncoder();
  var data = encoder.encode(password);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
};

/**
 * Build the best Google Maps URL for a place.
 * Priority: Place ID → name search for Google-origin places → address → raw coords.
 */
window.BKK.getGoogleMapsUrl = (place) => {
  if (!place) return '#';
  const hasCoords = place.lat && place.lng;
  if (!hasCoords && !place.address?.trim()) return '#';
  
  // Best: use Place ID → opens the actual Google Maps place page
  if (place.googlePlaceId) {
    const query = encodeURIComponent(place.name || place.address || `${place.lat},${place.lng}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${place.googlePlaceId}`;
  }
  
  // Google-origin place without Place ID (saved before this feature):
  // Search by name near coords — Google will likely match the real place
  if ((place.fromGoogle || place.googlePlace) && place.name && hasCoords) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&center=${place.lat},${place.lng}&zoom=17`;
  }
  
  // Fallback: address
  if (place.address?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address.trim())}`;
  }
  
  // Last resort: raw coordinates (pin on map)
  if (hasCoords) {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  }
  
  return '#';
};

console.log('[UTILS] Loaded successfully');

// Build Google Maps direction URLs, splitting into multiple if exceeding maxPoints limit
// maxPoints = total points including origin + destination (default 12 = 10 waypoints + origin + dest)
// Returns array of { url, fromIndex, toIndex, label } objects
window.BKK.buildGoogleMapsUrls = (stops, origin, isCircular, maxPoints) => {
  maxPoints = maxPoints || 12;
  const maxWaypoints = maxPoints - 2; // subtract origin + destination
  
  if (stops.length === 0) return [];
  
  // Single stop, no splitting needed
  if (stops.length === 1) {
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${stops[0].lat},${stops[0].lng}&travelmode=walking`;
    return [{ url, fromIndex: 0, toIndex: 0, part: 1, total: 1 }];
  }
  
  // All stops fit in one URL (stops as waypoints + last as destination, or circular back to origin)
  const totalWaypointsNeeded = isCircular ? stops.length : stops.length - 1;
  
  if (totalWaypointsNeeded <= maxWaypoints) {
    // Everything fits in one URL
    let destination, waypointsArr;
    if (isCircular) {
      destination = origin;
      waypointsArr = stops.map(s => `${s.lat},${s.lng}`);
    } else {
      destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
      waypointsArr = stops.slice(0, -1).map(s => `${s.lat},${s.lng}`);
    }
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypointsArr.length > 0) url += `&waypoints=${waypointsArr.join('|')}`;
    url += '&travelmode=walking';
    return [{ url, fromIndex: 0, toIndex: stops.length - 1, part: 1, total: 1 }];
  }
  
  // Need to split into multiple URLs
  // Each segment: origin → maxWaypoints waypoints → destination
  // Next segment starts from previous destination
  const urls = [];
  let currentIndex = 0;
  let currentOrigin = origin;
  
  while (currentIndex < stops.length) {
    const remaining = stops.length - currentIndex;
    const isLastSegment = remaining <= maxWaypoints + 1;
    
    let segmentStops, destination;
    
    if (isLastSegment) {
      // Last segment: take all remaining stops
      segmentStops = stops.slice(currentIndex);
      if (isCircular && urls.length === 0 && segmentStops.length <= maxWaypoints + 1) {
        // Edge case: would have fit without split - shouldn't happen, but handle gracefully
        destination = origin;
        const wps = segmentStops.map(s => `${s.lat},${s.lng}`);
        let url = `https://www.google.com/maps/dir/?api=1&origin=${currentOrigin}&destination=${destination}`;
        if (wps.length > 0) url += `&waypoints=${wps.join('|')}`;
        url += '&travelmode=walking';
        urls.push({ url, fromIndex: currentIndex, toIndex: stops.length - 1, part: urls.length + 1, total: 0 });
        break;
      } else if (isCircular) {
        // Last segment of circular: return to original origin
        destination = origin;
        const wps = segmentStops.map(s => `${s.lat},${s.lng}`);
        let url = `https://www.google.com/maps/dir/?api=1&origin=${currentOrigin}&destination=${destination}`;
        if (wps.length > 0) url += `&waypoints=${wps.join('|')}`;
        url += '&travelmode=walking';
        urls.push({ url, fromIndex: currentIndex, toIndex: stops.length - 1, part: urls.length + 1, total: 0 });
        break;
      } else {
        // Last segment of linear
        destination = `${segmentStops[segmentStops.length - 1].lat},${segmentStops[segmentStops.length - 1].lng}`;
        const wps = segmentStops.slice(0, -1).map(s => `${s.lat},${s.lng}`);
        let url = `https://www.google.com/maps/dir/?api=1&origin=${currentOrigin}&destination=${destination}`;
        if (wps.length > 0) url += `&waypoints=${wps.join('|')}`;
        url += '&travelmode=walking';
        urls.push({ url, fromIndex: currentIndex, toIndex: stops.length - 1, part: urls.length + 1, total: 0 });
        break;
      }
    } else {
      // Not last segment: take maxWaypoints stops as waypoints, last one is destination
      segmentStops = stops.slice(currentIndex, currentIndex + maxWaypoints + 1);
      destination = `${segmentStops[segmentStops.length - 1].lat},${segmentStops[segmentStops.length - 1].lng}`;
      const wps = segmentStops.slice(0, -1).map(s => `${s.lat},${s.lng}`);
      let url = `https://www.google.com/maps/dir/?api=1&origin=${currentOrigin}&destination=${destination}`;
      if (wps.length > 0) url += `&waypoints=${wps.join('|')}`;
      url += '&travelmode=walking';
      urls.push({ url, fromIndex: currentIndex, toIndex: currentIndex + segmentStops.length - 1, part: urls.length + 1, total: 0 });
      
      // Next segment starts from the last stop of this segment
      currentOrigin = destination;
      currentIndex += segmentStops.length - 1; // overlap: last stop becomes next origin
    }
  }
  
  // Fill in total count
  const total = urls.length;
  urls.forEach(u => u.total = total);
  
  return urls;
};


// ============================================================================
// EMOJI SUGGESTION ENGINE
// ============================================================================

/**
 * Suggest 3 emojis for a given description.
 * Tries Gemini API first (online), falls back to local keyword mapping.
 * @param {string} description - What the emoji should represent
 * @returns {Promise<string[]>} - Array of 3 emoji suggestions
 */
window.BKK.suggestEmojis = async function(description) {
  if (!description || !description.trim()) return ['📍', '⭐', '🏷️', '🔖', '📌', '🗂️'];
  
  // Track previous suggestions to avoid duplicates on "more"
  const prevKey = '_lastEmojiSuggestions';
  const prev = window[prevKey] || [];
  
  // Try Gemini API first
  try {
    const avoidText = prev.length > 0 ? ` Do NOT use these: ${prev.join(' ')}` : '';
    const result = await window.BKK._suggestEmojisGemini(description + avoidText);
    if (result && result.length >= 3) {
      const final = result.filter(e => !prev.includes(e)).slice(0, 6);
      // Pad if filtered too many
      if (final.length < 6) {
        result.forEach(e => { if (!final.includes(e) && final.length < 6) final.push(e); });
      }
      window[prevKey] = final;
      return final;
    }
  } catch (e) {
    console.log('[EMOJI] Gemini failed, using local fallback:', e.message);
  }
  
  // Fallback: local keyword mapping with shuffle to get variety on "more"
  const all = window.BKK._suggestEmojisLocal(description, true); // get all matches
  // Filter out previously shown
  const fresh = all.filter(e => !prev.includes(e));
  const result = fresh.length >= 6 ? fresh.slice(0, 6) : all.sort(() => Math.random() - 0.5).slice(0, 6);
  window[prevKey] = result;
  return result;
};

/**
 * Gemini API emoji suggestion
 */
window.BKK._suggestEmojisGemini = async function(description) {
  const apiKey = window.BKK.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('No API key');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Suggest exactly 6 different emoji icons that best represent: "${description}". Reply with ONLY the 6 emojis separated by spaces, nothing else. No text, no numbers, no explanations.`
        }]
      }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 50 }
    })
  });
  
  if (!resp.ok) throw new Error(`Gemini API error: ${resp.status}`);
  
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Extract emojis from response
  const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
  const emojis = [...new Set(text.match(emojiRegex) || [])];
  
  if (emojis.length < 3) throw new Error('Not enough emojis in response');
  console.log('[EMOJI] Gemini suggested:', emojis);
  return emojis.slice(0, 6);
};

/**
 * Local keyword-based emoji suggestion (offline fallback)
 */
window.BKK._suggestEmojisLocal = function(description, returnAll) {
  const desc = description.toLowerCase();
  
  const mapping = [
    // Food & Drink
    { keys: ['אוכל','food','restaurant','מסעד','dining','eat'], emojis: ['🍽️','🍜','🍕','🍔','🥘','🍴'] },
    { keys: ['קפה','coffee','cafe','קפית'], emojis: ['☕','🫖','🍵','☕'] },
    { keys: ['בר','bar','drink','שתי','cocktail','beer','בירה'], emojis: ['🍺','🍸','🥂','🍻'] },
    { keys: ['wine','יין'], emojis: ['🍷','🥂','🍇'] },
    { keys: ['ice cream','גלידה','dessert','קינוח'], emojis: ['🍦','🧁','🍰'] },
    { keys: ['bakery','מאפ','bread','לחם'], emojis: ['🥐','🍞','🧁'] },
    // Nature & Outdoors
    { keys: ['חוף','beach','sea','ים','ocean'], emojis: ['🏖️','🌊','🐚','☀️'] },
    { keys: ['פארק','park','garden','גן','טבע','nature'], emojis: ['🌳','🌿','🏞️','🌲'] },
    { keys: ['הר','mountain','hill','טיול','hike'], emojis: ['⛰️','🏔️','🥾'] },
    { keys: ['river','נהר','lake','אגם'], emojis: ['🏞️','💧','🚣'] },
    { keys: ['flower','פרח','botanical'], emojis: ['🌸','🌺','🌻'] },
    { keys: ['animal','חיות','zoo','גן חיות'], emojis: ['🦁','🐘','🦒'] },
    // Culture & History
    { keys: ['מוזיאון','museum','exhibit','תערוכה'], emojis: ['🏛️','🖼️','🎨'] },
    { keys: ['היסטורי','history','historic','עתיק','ancient'], emojis: ['🏛️','📜','⏳','🏰'] },
    { keys: ['תרבות','culture','cultural'], emojis: ['🎭','🏛️','🎪'] },
    { keys: ['temple','מקדש','church','כנסי','mosque','מסגד','synagogue','בית כנסת','religion','דת'], emojis: ['⛩️','🕌','⛪','🕍','🛕'] },
    { keys: ['ארכיטקטורה','architecture','building','בניין'], emojis: ['🏗️','🏢','🏰'] },
    // Arts & Entertainment
    { keys: ['אומנות','art','גלריה','gallery','street art','גרפיטי','graffiti'], emojis: ['🎨','🖼️','🖌️'] },
    { keys: ['מוזיקה','music','concert','הופעה'], emojis: ['🎵','🎶','🎸','🎤'] },
    { keys: ['תאטרון','theater','theatre','הצגה','show','performance'], emojis: ['🎭','🎪','🎬'] },
    { keys: ['cinema','סרט','movie','film'], emojis: ['🎬','🎞️','🍿'] },
    { keys: ['nightlife','לילה','club','מועדון'], emojis: ['🌃','🪩','💃','🎉'] },
    // Shopping & Markets
    { keys: ['קניות','shopping','mall','קניון'], emojis: ['🛍️','🏬','💳'] },
    { keys: ['שוק','market','bazaar','שוק פשפשים'], emojis: ['🏪','🧺','🏬'] },
    // Services & Public
    { keys: ['שירות','שרות','service','ציבורי','public','municipal','עירי','ממשל','government','עירייה','רשות'], emojis: ['🏛️','🏥','📋','🏢','🔧','⚖️'] },
    { keys: ['בית חולים','hospital','health','בריאות','medical','רפואי'], emojis: ['🏥','⚕️','💊'] },
    { keys: ['police','משטרה','emergency','חירום'], emojis: ['🚔','🚨','👮'] },
    { keys: ['school','בית ספר','education','חינוך','university','אוניברסיטה'], emojis: ['🏫','📚','🎓'] },
    { keys: ['transport','תחבורה','bus','אוטובוס','train','רכבת','metro'], emojis: ['🚌','🚆','🚇','🚊'] },
    { keys: ['parking','חני','חנייה'], emojis: ['🅿️','🚗','🏎️'] },
    { keys: ['toilet','שירותים','שרותים','שרותיים','wc','restroom','bathroom','נוחיות'], emojis: ['🚻','🚽','🧻','🚾'] },
    // Sports & Activities
    { keys: ['sport','ספורט','gym','חדר כושר','fitness'], emojis: ['⚽','🏋️','🤸'] },
    { keys: ['yoga','יוגה','meditation','מדיטציה','wellness','spa'], emojis: ['🧘','💆','🧖'] },
    { keys: ['swim','שחי','pool','בריכה'], emojis: ['🏊','🤽','💦'] },
    { keys: ['bike','אופני','cycling','רכיבה'], emojis: ['🚲','🚴','🛴'] },
    // Travel & Places
    { keys: ['hotel','מלון','hostel','אכסני','accommodation','לינה'], emojis: ['🏨','🛏️','🏩'] },
    { keys: ['airport','שדה תעופה','flight','טיסה'], emojis: ['✈️','🛫','🛬'] },
    { keys: ['viewpoint','תצפית','panorama','view','נוף'], emojis: ['🔭','👀','🏔️','📸'] },
    { keys: ['photo','צילום','camera','instagram'], emojis: ['📸','📷','🤳'] },
    // Countries & Regions
    { keys: ['spain','ספרד','spanish'], emojis: ['🇪🇸','☀️','💃','🥘'] },
    { keys: ['thailand','תאילנד','thai'], emojis: ['🇹🇭','🛺','🍜','🐘'] },
    { keys: ['israel','ישראל'], emojis: ['🇮🇱','✡️','🕍'] },
    { keys: ['japan','יפן','japanese'], emojis: ['🇯🇵','⛩️','🍣','🗾'] },
    { keys: ['italy','איטלי','italian'], emojis: ['🇮🇹','🍕','🍝'] },
    { keys: ['france','צרפת','french'], emojis: ['🇫🇷','🥐','🗼'] },
    { keys: ['usa','america','אמריקה'], emojis: ['🇺🇸','🗽','🦅'] },
    { keys: ['uk','england','אנגלי','british','london','לונדון'], emojis: ['🇬🇧','👑','🎡'] },
    { keys: ['singapore','סינגפור'], emojis: ['🇸🇬','🦁','🌿'] },
    // Misc
    { keys: ['kid','ילד','children','family','משפח','playground'], emojis: ['👨‍👩‍👧‍👦','🎠','🧒','🎪'] },
    { keys: ['pet','חיית מחמד','dog','כלב','cat','חתול'], emojis: ['🐕','🐈','🐾'] },
    { keys: ['book','ספר','library','ספרי'], emojis: ['📚','📖','📕'] },
    { keys: ['work','עבודה','office','משרד','cowork'], emojis: ['💼','🏢','💻'] },
    { keys: ['wifi','אינטרנט','internet','tech'], emojis: ['📶','💻','🔌'] },
    { keys: ['money','כסף','exchange','חלפ','atm','בנק','bank'], emojis: ['💰','🏧','💳'] },
    { keys: ['sunset','שקיע','sunrise','זריחה'], emojis: ['🌅','🌇','🌄'] },
    { keys: ['rain','גשם','umbrella','מטרי'], emojis: ['🌧️','☂️','💧'] },
    { keys: ['hot','חם','sun','שמש','summer','קיץ'], emojis: ['☀️','🌞','🔥'] },
    { keys: ['cold','קר','snow','שלג','winter','חורף'], emojis: ['❄️','⛷️','🧊'] },
    { keys: ['love','אהבה','heart','לב','romantic','רומנטי'], emojis: ['❤️','💕','💑'] },
    { keys: ['star','כוכב','favorite','מועדף'], emojis: ['⭐','🌟','✨'] },
    { keys: ['fire','אש','hot','חם','popular','פופולרי'], emojis: ['🔥','💥','⚡'] },
    { keys: ['peace','שלום','calm','שקט','relax'], emojis: ['☮️','🕊️','😌'] },
    { keys: ['danger','סכנה','warning','אזהרה'], emojis: ['⚠️','🚫','❌'] },
    { keys: ['celebration','חגיגה','party','מסיבה','birthday','יום הולדת'], emojis: ['🎉','🎊','🥳'] },
  ];
  
  // Score each mapping entry - use prefix matching for Hebrew morphology
  const scored = mapping.map(entry => {
    let score = 0;
    entry.keys.forEach(key => {
      // Exact substring match
      if (desc.includes(key)) {
        score += key.length * 2;
      } else if (key.length >= 3) {
        // Prefix match: "ציבורי" matches "ציבוריים", "שירות" matches "שירותים"
        const keyRoot = key.substring(0, Math.max(3, Math.ceil(key.length * 0.7)));
        const descWords = desc.split(/[\s,;.]+/);
        for (const word of descWords) {
          if (word.startsWith(keyRoot) || keyRoot.startsWith(word.substring(0, 3))) {
            score += key.length;
            break;
          }
        }
      }
    });
    return { ...entry, score };
  }).filter(e => e.score > 0).sort((a, b) => b.score - a.score);
  
  // Collect unique emojis from top matches
  const result = [];
  const seen = new Set();
  for (const entry of scored) {
    for (const emoji of entry.emojis) {
      if (!seen.has(emoji)) {
        seen.add(emoji);
        result.push(emoji);
        if (!returnAll && result.length >= 6) return result;
      }
    }
  }
  
  // If not enough matches, pad with generic emojis
  const generic = ['📍','⭐','🏷️','📌','🔖','🎯'];
  for (const g of generic) {
    if (!seen.has(g)) {
      result.push(g);
      if (result.length >= 6) break;
    }
  }
  
  return result.slice(0, 6);
};
