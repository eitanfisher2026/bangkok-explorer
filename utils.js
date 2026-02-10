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

console.log('[UTILS] Loaded successfully');

