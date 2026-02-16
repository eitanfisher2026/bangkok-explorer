  // Load saved preferences
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('bangkok_preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        // Add maxStops if not present or upgrade from old default
        if (!prefs.maxStops || prefs.maxStops === 10) prefs.maxStops = 15;
        // Add fetchMoreCount if not present
        if (!prefs.fetchMoreCount) prefs.fetchMoreCount = 3;
        // Add radius search fields if not present
        if (!prefs.searchMode) prefs.searchMode = 'area';
        // Handle legacy 'all' that was stored as radius with 15000
        if (prefs.searchMode === 'radius' && prefs.radiusMeters === 15000 && prefs.radiusPlaceName === 'כל בנגקוק') prefs.searchMode = 'all';
        if (!prefs.radiusMeters) prefs.radiusMeters = 500;
        if (!prefs.radiusSource) prefs.radiusSource = 'gps';
        if (!prefs.radiusPlaceName) prefs.radiusPlaceName = '';
        return prefs;
      }
    } catch (e) {}
    return {
      hours: 3,
      area: 'sukhumvit',
      interests: [],
      circular: true,
      startPoint: '',
      maxStops: 15,
      fetchMoreCount: 3,
      searchMode: 'area',
      radiusMeters: 500,
      radiusSource: 'gps',
      radiusPlaceId: null,
      radiusPlaceName: '',
      gpsLat: null,
      gpsLng: null,
      currentLat: null,
      currentLng: null
    };
  };

  const [currentView, setCurrentView] = useState('form');
  const [selectedCityId, setSelectedCityId] = useState(() => {
    try { return localStorage.getItem('city_explorer_city') || 'bangkok'; } catch(e) { return 'bangkok'; }
  });
  const [wizardMode, setWizardMode] = useState(() => {
    try { return localStorage.getItem('bangkok_wizard_mode') !== 'false'; } catch(e) { return true; }
  });
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState(loadPreferences());
  const [route, setRoute] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [disabledStops, setDisabledStops] = useState([]); // Track disabled stop IDs
  const [manualStops, setManualStops] = useState([]); // Manually added stops (session only)
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);
  const [routeType, setRouteType] = useState(() => {
    // Load from localStorage or default to 'circular'
    const saved = localStorage.getItem('bangkok_route_type');
    return saved || 'circular';
  }); // 'circular' or 'linear'
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [customLocations, setCustomLocations] = useState([]);
  const [showAddLocationDialog, setShowAddLocationDialog] = useState(false);
  const [showBlacklistLocations, setShowBlacklistLocations] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [placesGroupBy, setPlacesGroupBy] = useState('interest'); // 'interest' or 'area'
  const [routesSortBy, setRoutesSortBy] = useState('area'); // 'area' or 'name'
  const [editingRoute, setEditingRoute] = useState(null);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [routeDialogMode, setRouteDialogMode] = useState('edit'); // 'add' or 'edit'
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    notes: '',
    area: formData.area,
    areas: [formData.area],
    interests: [],
    lat: null,
    lng: null,
    mapsUrl: '',
    address: '',  // Address for geocoding
    uploadedImage: null,  // Base64 image data
    imageUrls: [],  // Array of URL strings
    inProgress: true  // Auto-check for new locations
  });
  const [customInterests, setCustomInterests] = useState([]);
  const [interestStatus, setInterestStatus] = useState({}); // { interestId: true/false }
  
  // Interest search configuration (editable)
  const [interestConfig, setInterestConfig] = useState({});
  const [googlePlaceInfo, setGooglePlaceInfo] = useState(null);
  const [loadingGoogleInfo, setLoadingGoogleInfo] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState(null); // null=hidden, []=no results, [...]= results
  const [editingCustomInterest, setEditingCustomInterest] = useState(null);
  const [showAddInterestDialog, setShowAddInterestDialog] = useState(false);
  const [newInterest, setNewInterest] = useState({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '' });
  const [showEditLocationDialog, setShowEditLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapMode, setMapMode] = useState('areas'); // 'areas' or 'radius'
  const leafletMapRef = React.useRef(null);
  
  // Cache for unused Google Places results per interest (avoids redundant API calls)
  const googleCacheRef = React.useRef({});

  // Leaflet Map initialization
  React.useEffect(() => {
    if (!showMapModal) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }
    
    // Wait for DOM
    const timer = setTimeout(() => {
      const container = document.getElementById('leaflet-map-container');
      if (!container) return;
      // Clean previous map if exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      
      try {
        const coords = window.BKK.areaCoordinates || {};
        const areas = window.BKK.areaOptions || [];
        
        // Area colors
        const areaColors = {
          'sukhumvit': '#3b82f6', 'old-town': '#f59e0b', 'chinatown': '#ef4444',
          'thonglor': '#10b981', 'ari': '#ec4899', 'riverside': '#6366f1',
          'siam': '#8b5cf6', 'chatuchak': '#06b6d4', 'silom': '#f97316',
          'ratchada': '#a855f7', 'onnut': '#14b8a6', 'bangrak': '#e11d48'
        };
        
        if (mapMode === 'areas') {
          // All areas mode
          const map = L.map(container).setView([13.7500, 100.5350], 12);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
            attribution: '© CartoDB © OSM', maxZoom: 18
          }).addTo(map);
          
          areas.forEach(area => {
            const c = coords[area.id];
            if (!c) return;
            const color = areaColors[area.id] || '#6b7280';
            L.circle([c.lat, c.lng], {
              radius: c.radius, color: color, fillColor: color,
              fillOpacity: 0.15, weight: 2
            }).addTo(map).bindPopup(
              '<div style="text-align:center;direction:rtl;font-size:13px;">' +
              '<b>' + area.label + '</b><br/>' +
              '<span style="color:#666;font-size:11px;">' + area.labelEn + '</span><br/>' +
              '<span style="color:#999;font-size:10px;">רדיוס: ' + c.radius + ' מ\'</span></div>'
            );
            // Name label with background for readability
            L.marker([c.lat, c.lng], {
              icon: L.divIcon({
                className: '',
                html: '<div style="font-size:10px;font-weight:bold;text-align:center;color:' + color + ';background:rgba(255,255,255,0.88);padding:2px 5px;border-radius:4px;border:1.5px solid ' + color + ';white-space:nowrap;line-height:1.2;box-shadow:0 1px 3px rgba(0,0,0,0.15);">' + area.label + '</div>',
                iconSize: [80, 22], iconAnchor: [40, 11]
              })
            }).addTo(map);
          });
          
          leafletMapRef.current = map;
        } else {
          // Radius mode
          const lat = formData.currentLat;
          const lng = formData.currentLng;
          if (!lat || !lng) return;
          
          const map = L.map(container).setView([lat, lng], 15);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
            attribution: '© CartoDB © OSM', maxZoom: 18
          }).addTo(map);
          
          // Radius circle FIRST (so marker is on top)
          const radiusCircle = L.circle([lat, lng], {
            radius: formData.radiusMeters, color: '#e11d48', fillColor: '#e11d48',
            fillOpacity: 0.12, weight: 3, dashArray: '8,6'
          }).addTo(map);
          
          // Center marker (red, prominent)
          L.circleMarker([lat, lng], {
            radius: 8, color: '#e11d48', fillColor: '#e11d48',
            fillOpacity: 1, weight: 2
          }).addTo(map).bindPopup(
            '<div style="text-align:center;direction:rtl;">' +
            '<b>📍 ' + (formData.radiusPlaceName || 'מיקום נוכחי') + '</b><br/>' +
            '<span style="font-size:11px;color:#666;">רדיוס: ' + formData.radiusMeters + ' מ\'</span></div>'
          ).openPopup();
          
          // Fit to circle bounds
          map.fitBounds(radiusCircle.getBounds().pad(0.15));
          
          // Show area circles faintly for context
          areas.forEach(area => {
            const c = coords[area.id];
            if (!c) return;
            L.circle([c.lat, c.lng], {
              radius: c.radius, color: '#94a3b8', fillColor: '#94a3b8',
              fillOpacity: 0.04, weight: 1
            }).addTo(map);
            L.marker([c.lat, c.lng], {
              icon: L.divIcon({
                className: '',
                html: '<div style="font-size:8px;color:#94a3b8;text-align:center;white-space:nowrap;">' + area.label + '</div>',
                iconSize: [50, 15], iconAnchor: [25, 7]
              })
            }).addTo(map);
          });
          
          leafletMapRef.current = map;
        }
      } catch(err) {
        console.error('[MAP]', err);
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [showMapModal, mapMode, formData.currentLat, formData.currentLng, formData.radiusMeters]);
  const [modalImage, setModalImage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [placeSearchQuery, setPlaceSearchQuery] = useState(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('bangkok_preferences'));
      return prefs?.radiusPlaceName || '';
    } catch(e) { return ''; }
  });
  const [searchResults, setSearchResults] = useState([]);
  const [addingPlaceIds, setAddingPlaceIds] = useState([]); // Track places being added
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedData, setImportedData] = useState(null);
  
  // Access Log System (Admin Only)
  const [accessLogs, setAccessLogs] = useState([]);
  const [hasNewEntries, setHasNewEntries] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(() => {
    return localStorage.getItem('bangkok_is_admin') === 'true';
  });
  const [showAccessLog, setShowAccessLog] = useState(false);

  // Feedback System
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [feedbackList, setFeedbackList] = useState([]);
  const [showFeedbackList, setShowFeedbackList] = useState(false);
  const [hasNewFeedback, setHasNewFeedback] = useState(false);

  // Confirm Dialog (replaces browser confirm)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ message: '', onConfirm: null });

  // Help System
  const [showHelp, setShowHelp] = useState(false);
  const [helpContext, setHelpContext] = useState('main');
  
  // Debug Mode System
  const [debugMode, setDebugMode] = useState(() => {
    return localStorage.getItem('bangkok_debug_mode') === 'true';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Tracks initial Firebase/localStorage load
  const dataLoadTracker = React.useRef({ locations: false, interests: false, config: false, status: false, routes: false });
  const markLoaded = (key) => {
    dataLoadTracker.current[key] = true;
    const t = dataLoadTracker.current;
    if (t.locations && t.interests && t.config && t.status && t.routes) {
      setIsDataLoaded(true);
      window.scrollTo(0, 0);
    }
  };
  
  // Safety timeout - don't show loading forever
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDataLoaded) {
        console.warn('[LOAD] Safety timeout - forcing data loaded after 5s');
        setIsDataLoaded(true);
        window.scrollTo(0, 0);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isDataLoaded]);
  const [startPointCoords, setStartPointCoords] = useState(null); // { lat, lng }
  const [isLocating, setIsLocating] = useState(false);
  const [rightColWidth, setRightColWidth] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem('bangkok_right_col_width'));
      return saved && saved >= 100 && saved <= 250 ? saved : 130;
    } catch(e) { return 130; }
  });
  
  // Admin System - Password based
  const [adminPassword, setAdminPassword] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState(''); // For setting new password in admin panel
  
  // Add debug log entry (console only)
  const addDebugLog = (category, message, data = null) => {
    if (!debugMode) return;
    console.log(`[${category}] ${message}`, data || '');
  };
  
  // Save debug mode preference
  useEffect(() => {
    localStorage.setItem('bangkok_debug_mode', debugMode.toString());
  }, [debugMode]);
  
  // Help content - loaded from config.js
  const helpContent = window.BKK.helpContent;

  const showHelpFor = (context) => {
    setHelpContext(context);
    setShowHelp(true);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmConfig({ message, onConfirm });
    setShowConfirmDialog(true);
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    const duration = Math.min(4000, Math.max(1500, message.length * 50));
    setTimeout(() => setToastMessage(null), duration);
  };

  // Get current GPS location and reverse geocode to address
  const getMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('הדפדפן לא תומך באיתור מיקום', 'error');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        console.log('[GPS] Got location:', lat, lng);
        
        // Try to get address via reverse geocode
        try {
          const address = await window.BKK.reverseGeocode(lat, lng);
          const displayAddress = address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setStartPointCoords({ lat, lng, address: displayAddress });
          setFormData(prev => ({ ...prev, startPoint: displayAddress }));
          showToast(address ? '📍 מיקום נוכחי נקלט!' : '📍 מיקום נקלט (לא נמצאה כתובת)', 'success');
        } catch (err) {
          const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setStartPointCoords({ lat, lng, address: fallback });
          setFormData(prev => ({ ...prev, startPoint: fallback }));
          showToast('📍 מיקום נקלט', 'success');
        }
        
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        console.error('[GPS] Error:', error);
        if (error.code === 1) {
          showToast('אין הרשאת מיקום - אנא אשר גישה למיקום', 'error');
        } else if (error.code === 2) {
          showToast('לא ניתן לאתר מיקום', 'error');
        } else {
          showToast('שגיאה באיתור מיקום', 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Geocode typed start point address to coordinates
  const validateStartPoint = async () => {
    const text = formData.startPoint?.trim();
    if (!text) {
      showToast('הזן כתובת או שם מקום', 'warning');
      return;
    }
    
    setIsLocating(true);
    try {
      const result = await window.BKK.geocodeAddress(text);
      if (result) {
        const validatedAddress = result.address || result.displayName || text;
        setStartPointCoords({ lat: result.lat, lng: result.lng, address: validatedAddress });
        setFormData(prev => ({ ...prev, startPoint: validatedAddress }));
        showToast(`✅ כתובת אומתה: ${result.displayName || result.address}`, 'success');
        console.log('[START_POINT] Geocoded:', text, '->', result);
      } else {
        showToast('לא נמצאה כתובת תואמת', 'warning');
      }
    } catch (err) {
      console.error('[START_POINT] Geocode error:', err);
      showToast('שגיאה בחיפוש כתובת', 'error');
    }
    setIsLocating(false);
  };

  // Detect which area the user is currently in based on GPS
  const detectArea = () => {
    if (!navigator.geolocation) {
      showToast('הדפדפן לא תומך במיקום', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const coords = window.BKK.areaCoordinates;
        
        // Calculate distance to each area center
        let closest = null;
        let closestDist = Infinity;
        
        for (const [areaId, center] of Object.entries(coords)) {
          const dlat = (lat - center.lat) * 111320;
          const dlng = (lng - center.lng) * 111320 * Math.cos(lat * Math.PI / 180);
          const dist = Math.sqrt(dlat * dlat + dlng * dlng);
          
          if (dist <= center.radius && dist < closestDist) {
            closest = areaId;
            closestDist = dist;
          }
        }
        
        if (closest) {
          const areaName = areaOptions.find(a => a.id === closest)?.label || closest;
          setFormData(prev => ({ ...prev, area: closest }));
          showToast(`📍 נמצאת באזור: ${areaName}`, 'success');
        } else {
          showToast('המיקום הנוכחי שלך נמצא מחוץ לאזורי הבחירה', 'warning');
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === 1) {
          showToast('אין הרשאת מיקום - אנא אשר גישה למיקום', 'error');
        } else {
          showToast('לא ניתן לאתר מיקום', 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };
  // Load saved routes from Firebase (shared)
  useEffect(() => {
    if (isFirebaseAvailable && database) {
      const routesRef = database.ref('savedRoutes');
      
      const unsubscribe = routesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const routesArray = Object.keys(data).map(key => ({
            ...data[key],
            firebaseId: key
          }));
          setSavedRoutes(routesArray);
          console.log('[FIREBASE] Loaded', routesArray.length, 'saved routes');
        } else {
          setSavedRoutes([]);
        }
        markLoaded('routes');
      });
      
      // One-time migration: push localStorage routes to Firebase then clear
      try {
        const localRoutes = localStorage.getItem('bangkok_saved_routes');
        if (localRoutes) {
          const parsed = JSON.parse(localRoutes);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('[MIGRATION] Migrating', parsed.length, 'routes from localStorage to Firebase');
            parsed.forEach(route => {
              const stripped = stripRouteForStorage(route);
              database.ref('savedRoutes').push(stripped);
            });
            localStorage.removeItem('bangkok_saved_routes');
            console.log('[MIGRATION] localStorage routes migrated and cleared');
          }
        }
      } catch (e) {
        console.error('[MIGRATION] Error migrating routes:', e);
      }
      
      return () => routesRef.off('value', unsubscribe);
    } else {
      try {
        const saved = localStorage.getItem('bangkok_saved_routes');
        if (saved) {
          setSavedRoutes(JSON.parse(saved));
        }
      } catch (e) {
        // Silent fail
      }
      markLoaded('routes');
    }
  }, []);

  // Load custom locations from Firebase
  useEffect(() => {
    if (isFirebaseAvailable && database) {
      console.log('[DATA] Using Firebase');
      const locationsRef = database.ref('customLocations');
      
      const unsubscribe = locationsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const locationsArray = Object.keys(data).map(key => ({
            ...data[key],
            firebaseId: key
          }));
          setCustomLocations(locationsArray);
          console.log('[FIREBASE] Loaded', locationsArray.length, 'locations');
        } else {
          setCustomLocations([]);
        }
        markLoaded('locations');
      });
      
      return () => locationsRef.off('value', unsubscribe);
    } else {
      console.log('[DATA] Firebase not available - using localStorage fallback');
      try {
        const customLocs = localStorage.getItem('bangkok_custom_locations');
        if (customLocs) {
          setCustomLocations(JSON.parse(customLocs));
        }
      } catch (e) {
        console.error('[LOCALSTORAGE] Error loading locations:', e);
      }
      markLoaded('locations');
    }
  }, []);

  // Load custom interests from Firebase
  useEffect(() => {
    if (isFirebaseAvailable && database) {
      const interestsRef = database.ref('customInterests');
      const builtInIds = new Set([...window.BKK.interestOptions.map(i => i.id), ...window.BKK.uncoveredInterests.map(i => i.id)]);
      
      const unsubscribe = interestsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const allEntries = Object.keys(data).map(key => ({
            ...data[key],
            firebaseId: key
          }));
          // Filter out built-in IDs that were accidentally saved as custom
          const duplicates = allEntries.filter(i => builtInIds.has(i.id));
          const interestsArray = allEntries.filter(i => !builtInIds.has(i.id));
          // Auto-cleanup duplicates from Firebase
          if (duplicates.length > 0) {
            console.log('[CLEANUP] Removing', duplicates.length, 'built-in duplicates from customInterests');
            duplicates.forEach(d => database.ref(`customInterests/${d.firebaseId}`).remove());
          }
          setCustomInterests(interestsArray);
          console.log('[FIREBASE] Loaded', interestsArray.length, 'interests');
        } else {
          setCustomInterests([]);
        }
        markLoaded('interests');
      });
      
      return () => interestsRef.off('value', unsubscribe);
    } else {
      try {
        const customInts = localStorage.getItem('bangkok_custom_interests');
        if (customInts) {
          setCustomInterests(JSON.parse(customInts));
        }
      } catch (e) {
        console.error('[LOCALSTORAGE] Error loading interests:', e);
      }
      markLoaded('interests');
    }
  }, []);

  // Load interest search configurations from Firebase
  useEffect(() => {
    // Default configurations
    const defaultConfig = {
      temples: { types: ['hindu_temple', 'buddhist_temple', 'church', 'mosque'], blacklist: ['hotel', 'restaurant', 'school'] },
      food: { types: ['restaurant', 'meal_takeaway'], blacklist: ['bar', 'pub', 'club', 'hotel', 'hostel'] },
      graffiti: { textSearch: 'street art', blacklist: ['tattoo', 'ink', 'piercing', 'salon'] },
      artisans: { types: ['store', 'art_gallery'], blacklist: ['cannabis', 'weed', 'kratom', 'massage', 'spa', '7-eleven', 'convenience'] },
      galleries: { types: ['art_gallery', 'museum'], blacklist: ['cannabis', 'weed', 'kratom', 'massage', 'spa', 'cafe', 'coffee', 'hotel'] },
      architecture: { types: ['historical_landmark'], blacklist: ['hotel', 'restaurant', 'mall', 'parking'] },
      canals: { types: ['boat_tour_agency', 'marina'], blacklist: ['hotel', 'restaurant', 'parking'] },
      cafes: { types: ['cafe', 'coffee_shop'], blacklist: ['cannabis', 'weed', 'kratom', 'hookah', 'shisha'] },
      markets: { types: ['market', 'shopping_mall'], blacklist: ['hotel', 'supermarket', '7-eleven', 'convenience', 'tesco', 'big c', 'makro'] },
      nightlife: { types: ['bar', 'night_club'], blacklist: ['restaurant', 'hotel', 'hostel', 'cafe'] },
      parks: { types: ['park', 'national_park'], blacklist: ['hotel', 'parking', 'car park', 'garage', 'water park'] },
      rooftop: { types: ['bar', 'restaurant'], blacklist: ['parking', 'car park', 'garage'] },
      entertainment: { types: ['movie_theater', 'amusement_park', 'performing_arts_theater'], blacklist: ['hotel', 'mall'] },
      // Uncovered interests (inactive by default)
      massage_spa: { types: ['spa', 'massage'], blacklist: ['cannabis', 'weed', 'kratom', 'hotel'] },
      fitness: { types: ['gym', 'fitness_center', 'sports_club'], blacklist: ['hotel', 'hostel', 'physiotherapy'] },
      shopping_special: { types: ['clothing_store', 'jewelry_store', 'shoe_store'], blacklist: ['market', 'wholesale', 'pawn'] },
      learning: { types: ['school', 'university'], blacklist: ['kindergarten', 'nursery', 'daycare', 'driving school'] },
      health: { types: ['pharmacy', 'hospital', 'doctor'], blacklist: ['veterinary', 'pet'] },
      accommodation: { types: ['hotel', 'lodging'], blacklist: [] },
      transport: { types: ['car_rental', 'transit_station'], blacklist: [] },
      business: { types: ['coworking_space'], blacklist: ['hotel', 'hostel'] },
    };
    
    if (isFirebaseAvailable && database) {
      const configRef = database.ref('settings/interestConfig');
      
      configRef.once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Deep merge: for each interest, use Firebase config but fall back to default blacklist if empty
          const merged = { ...defaultConfig };
          for (const [key, val] of Object.entries(data)) {
            if (merged[key]) {
              merged[key] = { ...merged[key], ...val };
              // If Firebase has empty blacklist but default has values, keep default
              if ((!val.blacklist || val.blacklist.length === 0) && defaultConfig[key]?.blacklist?.length > 0) {
                merged[key].blacklist = defaultConfig[key].blacklist;
              }
            } else {
              merged[key] = val;
            }
          }
          setInterestConfig(merged);
          console.log('[FIREBASE] Loaded interest config (deep merge)');
        } else {
          // Save defaults to Firebase
          configRef.set(defaultConfig);
          setInterestConfig(defaultConfig);
          console.log('[FIREBASE] Saved default interest config');
        }
        markLoaded('config');
      });
      
      // Listen for changes
      configRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const merged = { ...defaultConfig };
          for (const [key, val] of Object.entries(data)) {
            if (merged[key]) {
              merged[key] = { ...merged[key], ...val };
              if ((!val.blacklist || val.blacklist.length === 0) && defaultConfig[key]?.blacklist?.length > 0) {
                merged[key].blacklist = defaultConfig[key].blacklist;
              }
            } else {
              merged[key] = val;
            }
          }
          setInterestConfig(merged);
        }
      });
    } else {
      setInterestConfig(defaultConfig);
      markLoaded('config');
    }
  }, []);

  // Load interest active/inactive status (per-user with admin defaults)
  useEffect(() => {
    // Default status: built-in = active, uncovered = inactive
    const builtInIds = interestOptions.map(i => i.id);
    const uncoveredIds = uncoveredInterests.map(i => i.id || i.name.replace(/\s+/g, '_').toLowerCase());
    
    const defaultStatus = {};
    builtInIds.forEach(id => { defaultStatus[id] = true; });
    uncoveredIds.forEach(id => { defaultStatus[id] = false; });
    
    if (isFirebaseAvailable && database) {
      const userId = localStorage.getItem('bangkok_user_id') || 'unknown';
      const adminStatusRef = database.ref('settings/interestStatus');
      const userStatusRef = database.ref(`users/${userId}/interestStatus`);
      
      // Load admin defaults first, then user overrides
      adminStatusRef.once('value').then((adminSnap) => {
        const adminData = adminSnap.val() || defaultStatus;
        // Save admin defaults if not present
        if (!adminSnap.val()) {
          adminStatusRef.set(defaultStatus);
        }
        
        return userStatusRef.once('value').then((userSnap) => {
          const userData = userSnap.val();
          if (userData) {
            // User has their own preferences
            setInterestStatus({ ...defaultStatus, ...adminData, ...userData });
            console.log('[FIREBASE] Loaded user interest status');
          } else {
            // New user - use admin defaults
            setInterestStatus({ ...defaultStatus, ...adminData });
            console.log('[FIREBASE] Using admin defaults for new user');
          }
          markLoaded('status');
        });
      }).catch(err => {
        console.error('[FIREBASE] Error loading interest status:', err);
        setInterestStatus(defaultStatus);
        markLoaded('status');
      });
      
      // Listen for user's own changes
      userStatusRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setInterestStatus(prev => ({ ...prev, ...data }));
        }
      });
    } else {
      try {
        const saved = localStorage.getItem('bangkok_interest_status');
        if (saved) {
          setInterestStatus({ ...defaultStatus, ...JSON.parse(saved) });
        } else {
          setInterestStatus(defaultStatus);
        }
      } catch (e) {
        setInterestStatus(defaultStatus);
      }
      markLoaded('status');
    }
  }, []);

  // ============================================================
  // Refresh All Data - Manual reload from Firebase & localStorage
  // ============================================================
  const refreshAllData = async () => {
    setIsRefreshing(true);
    console.log('[REFRESH] Starting full data refresh...');
    
    try {
      // 1. Saved Routes
      if (isFirebaseAvailable && database) {
        try {
          const routeSnap = await database.ref('savedRoutes').once('value');
          const routeData = routeSnap.val();
          if (routeData) {
            const routesArray = Object.keys(routeData).map(key => ({
              ...routeData[key],
              firebaseId: key
            }));
            setSavedRoutes(routesArray);
            console.log('[REFRESH] Loaded', routesArray.length, 'saved routes from Firebase');
          } else {
            setSavedRoutes([]);
          }
        } catch (e) {
          console.error('[REFRESH] Error loading saved routes:', e);
        }
      } else {
        try {
          const saved = localStorage.getItem('bangkok_saved_routes');
          if (saved) {
            setSavedRoutes(JSON.parse(saved));
            console.log('[REFRESH] Saved routes loaded from localStorage');
          }
        } catch (e) {
          console.error('[REFRESH] Error loading saved routes:', e);
        }
      }
      
      if (isFirebaseAvailable && database) {
        // 2. Custom Locations
        try {
          const locSnap = await database.ref('customLocations').once('value');
          const locData = locSnap.val();
          if (locData) {
            const locationsArray = Object.keys(locData).map(key => ({
              ...locData[key],
              firebaseId: key
            }));
            setCustomLocations(locationsArray);
            console.log('[REFRESH] Loaded', locationsArray.length, 'locations');
          } else {
            setCustomLocations([]);
          }
        } catch (e) {
          console.error('[REFRESH] Error loading locations:', e);
        }
        
        // 3. Custom Interests
        try {
          const intSnap = await database.ref('customInterests').once('value');
          const intData = intSnap.val();
          if (intData) {
            const builtInIds = new Set([...window.BKK.interestOptions.map(i => i.id), ...window.BKK.uncoveredInterests.map(i => i.id)]);
            const interestsArray = Object.keys(intData).map(key => ({
              ...intData[key],
              firebaseId: key
            })).filter(i => !builtInIds.has(i.id));
            setCustomInterests(interestsArray);
            console.log('[REFRESH] Loaded', interestsArray.length, 'interests');
          } else {
            setCustomInterests([]);
          }
        } catch (e) {
          console.error('[REFRESH] Error loading interests:', e);
        }
        
        // 4. Interest Config
        try {
          const configSnap = await database.ref('settings/interestConfig').once('value');
          const configData = configSnap.val();
          if (configData) {
            setInterestConfig(prev => ({ ...prev, ...configData }));
            console.log('[REFRESH] Loaded interest config');
          }
        } catch (e) {
          console.error('[REFRESH] Error loading interest config:', e);
        }
        
        // 5. Interest Status
        try {
          const statusSnap = await database.ref('settings/interestStatus').once('value');
          const statusData = statusSnap.val();
          if (statusData) {
            const builtInIds = interestOptions.map(i => i.id);
            const uncoveredIds = uncoveredInterests.map(i => i.id || i.name.replace(/\s+/g, '_').toLowerCase());
            const defaultStatus = {};
            builtInIds.forEach(id => { defaultStatus[id] = true; });
            uncoveredIds.forEach(id => { defaultStatus[id] = false; });
            setInterestStatus({ ...defaultStatus, ...statusData });
            console.log('[REFRESH] Loaded interest status');
          }
        } catch (e) {
          console.error('[REFRESH] Error loading interest status:', e);
        }
        
        // 6. Admin Settings
        try {
          const pwSnap = await database.ref('settings/adminPassword').once('value');
          setAdminPassword(pwSnap.val() || '');
          
          const usersSnap = await database.ref('settings/adminUsers').once('value');
          const usersData = usersSnap.val() || {};
          const usersList = Object.entries(usersData).map(([oderId, data]) => ({
            oderId,
            ...data
          }));
          setAdminUsers(usersList);
          
          const userId = localStorage.getItem('bangkok_user_id');
          const isInAdminList = usersList.some(u => u.oderId === userId);
          const passwordEmpty = !pwSnap.val();
          const userIsAdmin = isInAdminList || passwordEmpty;
          setIsUnlocked(userIsAdmin);
          setIsCurrentUserAdmin(userIsAdmin);
          console.log('[REFRESH] Loaded admin settings');
        } catch (e) {
          console.error('[REFRESH] Error loading admin settings:', e);
        }
        
        showToast('🔄 כל הנתונים רועננו בהצלחה!', 'success');
      } else {
        // Firebase not available - load from localStorage fallbacks
        try {
          const customLocs = localStorage.getItem('bangkok_custom_locations');
          if (customLocs) setCustomLocations(JSON.parse(customLocs));
        } catch (e) {}
        try {
          const customInts = localStorage.getItem('bangkok_custom_interests');
          if (customInts) setCustomInterests(JSON.parse(customInts));
        } catch (e) {}
        try {
          const saved = localStorage.getItem('bangkok_interest_status');
          if (saved) {
            const builtInIds = interestOptions.map(i => i.id);
            const uncoveredIds = uncoveredInterests.map(i => i.id || i.name.replace(/\s+/g, '_').toLowerCase());
            const defaultStatus = {};
            builtInIds.forEach(id => { defaultStatus[id] = true; });
            uncoveredIds.forEach(id => { defaultStatus[id] = false; });
            setInterestStatus({ ...defaultStatus, ...JSON.parse(saved) });
          }
        } catch (e) {}
        
        showToast('🔄 נתונים רועננו (localStorage בלבד - Firebase לא זמין)', 'warning');
      }
    } catch (error) {
      console.error('[REFRESH] Unexpected error:', error);
      showToast('❌ שגיאה ברענון הנתונים', 'error');
    } finally {
      setIsRefreshing(false);
      console.log('[REFRESH] Complete');
    }
  };

  // Save routeType to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('bangkok_route_type', routeType);
  }, [routeType]);

  // Access Log System - Track visits
  useEffect(() => {
    if (!isFirebaseAvailable || !database) return;
    
    // Generate or retrieve user ID
    let userId = localStorage.getItem('bangkok_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('bangkok_user_id', userId);
    }
    
    console.log('[ACCESS LOG] User ID:', userId);
    
    // Admin detection: Password-based system
    const loadAdminSettings = async () => {
      try {
        // Load admin password
        const pwSnapshot = await database.ref('settings/adminPassword').once('value');
        const storedPassword = pwSnapshot.val() || '';
        setAdminPassword(storedPassword);
        
        // Load admin users list
        const usersSnapshot = await database.ref('settings/adminUsers').once('value');
        const usersData = usersSnapshot.val() || {};
        const usersList = Object.entries(usersData).map(([oderId, data]) => ({
          oderId,
          ...data
        }));
        setAdminUsers(usersList);
        
        // Check if user is admin: either in list OR password is empty
        const isInAdminList = usersList.some(u => u.oderId === userId);
        const passwordEmpty = !storedPassword || storedPassword === '';
        const userIsAdmin = isInAdminList || passwordEmpty;
        
        setIsUnlocked(userIsAdmin);
        setIsCurrentUserAdmin(userIsAdmin);
        localStorage.setItem('bangkok_is_admin', userIsAdmin ? 'true' : 'false');
        
        console.log('[ADMIN] Password empty:', passwordEmpty, 'In list:', isInAdminList, 'Unlocked:', userIsAdmin);
      } catch (err) {
        console.error('[ADMIN] Error loading settings:', err);
      }
    };
    
    loadAdminSettings();
    
    // Listen to admin settings changes
    database.ref('settings/adminPassword').on('value', (snap) => {
      const pw = snap.val() || '';
      setAdminPassword(pw);
      const cachedUserId = localStorage.getItem('bangkok_user_id');
      database.ref('settings/adminUsers').once('value').then(usersSnap => {
        const usersData = usersSnap.val() || {};
        const isInList = Object.keys(usersData).includes(cachedUserId);
        setIsUnlocked(isInList || !pw);
      });
    });
    
    database.ref('settings/adminUsers').on('value', (snap) => {
      const usersData = snap.val() || {};
      const usersList = Object.entries(usersData).map(([oderId, data]) => ({
        oderId,
        ...data
      }));
      setAdminUsers(usersList);
    });
    
    // Log access (skip if admin)
    const isAdmin = localStorage.getItem('bangkok_is_admin') === 'true';
    
    if (!isAdmin) {
      const lastLogTime = parseInt(localStorage.getItem('bangkok_last_log_time') || '0');
      const oneHour = 60 * 60 * 1000;
      
      if (Date.now() - lastLogTime >= oneHour) {
        localStorage.setItem('bangkok_last_log_time', Date.now().toString());
        
        const { browser, os } = window.BKK.parseUserAgent(navigator.userAgent);
        
        const accessEntry = {
          userId, 
          timestamp: Date.now(), 
          date: new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 100),
          browser, 
          os,
          screenSize: `${screen.width}x${screen.height}`,
          language: navigator.language || 'unknown',
          country: '', 
          city: '', 
          region: ''
        };
        
        const entryRef = database.ref('accessLog').push();
        entryRef.set(accessEntry)
          .then(() => {
            console.log('[ACCESS LOG] Visit logged');
            fetch('https://ipapi.co/json/')
              .then(r => r.json())
              .then(geo => {
                entryRef.update({
                  country: geo.country_name || '',
                  countryCode: geo.country_code || '',
                  city: geo.city || '',
                  region: geo.region || '',
                  ip: geo.ip ? geo.ip.substring(0, 12) + '***' : '',
                  isp: geo.org || ''
                });
              })
              .catch(err => console.log('[ACCESS LOG] Geo lookup failed:', err));
          })
          .catch(err => console.error('[ACCESS LOG] Error:', err));
      }
    }
    
    // Listen to access log (admin only)
    if (isAdmin) {
      const logRef = database.ref('accessLog').orderByChild('timestamp').limitToLast(50);
      const lastSeen = parseInt(localStorage.getItem('bangkok_last_seen') || '0');
      
      const unsubscribe = logRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const logsArray = Object.keys(data).map(key => ({
            ...data[key], 
            id: key
          })).sort((a, b) => b.timestamp - a.timestamp);
          
          setAccessLogs(logsArray);
          
          const hasNew = logsArray.some(log => log.timestamp > lastSeen);
          if (hasNew && lastSeen > 0) {
            setHasNewEntries(true);
          }
        } else {
          setAccessLogs([]);
        }
      });
      
      return () => logRef.off('value', unsubscribe);
    }
  }, []);

  // Mark logs as seen
  const markLogsAsSeen = () => {
    const latest = accessLogs.length > 0 ? accessLogs[0].timestamp : Date.now();
    localStorage.setItem('bangkok_last_seen', latest.toString());
    setHasNewEntries(false);
  };

  // Feedback System
  const submitFeedback = () => {
    if (!feedbackText.trim()) {
      showToast('אנא כתוב משוב', 'warning');
      return;
    }
    
    const feedbackEntry = {
      category: feedbackCategory,
      text: feedbackText.trim(),
      userId: localStorage.getItem('bangkok_user_id') || 'unknown',
      currentView: currentView,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      resolved: false
    };
    
    if (isFirebaseAvailable && database) {
      database.ref('feedback').push(feedbackEntry)
        .then(() => {
          showToast('תודה על המשוב! 🙏', 'success');
          setFeedbackText('');
          setFeedbackCategory('general');
          setShowFeedbackDialog(false);
        })
        .catch(() => showToast('שגיאה בשליחה', 'error'));
    } else {
      showToast('Firebase לא זמין', 'error');
    }
  };

  // Load feedback list (admin only)
  useEffect(() => {
    if (!isFirebaseAvailable || !database) return;
    if (!isCurrentUserAdmin) return;
    
    const feedbackRef = database.ref('feedback').orderByChild('timestamp').limitToLast(100);
    const lastSeenFeedback = parseInt(localStorage.getItem('bangkok_last_seen_feedback') || '0');
    
    const unsubscribe = feedbackRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.keys(data).map(key => ({
          ...data[key],
          firebaseId: key
        })).sort((a, b) => b.timestamp - a.timestamp);
        setFeedbackList(arr);
        
        const hasNew = arr.some(f => f.timestamp > lastSeenFeedback);
        if (hasNew && lastSeenFeedback > 0) {
          setHasNewFeedback(true);
        }
      } else {
        setFeedbackList([]);
      }
    });
    
    return () => feedbackRef.off('value', unsubscribe);
  }, [isCurrentUserAdmin]);

  const markFeedbackAsSeen = () => {
    const latest = feedbackList.length > 0 ? feedbackList[0].timestamp : Date.now();
    localStorage.setItem('bangkok_last_seen_feedback', latest.toString());
    setHasNewFeedback(false);
  };

  const toggleFeedbackResolved = (feedbackItem) => {
    if (isFirebaseAvailable && database && feedbackItem.firebaseId) {
      database.ref(`feedback/${feedbackItem.firebaseId}`).update({
        resolved: !feedbackItem.resolved
      });
    }
  };

  const deleteFeedback = (feedbackItem) => {
    if (isFirebaseAvailable && database && feedbackItem.firebaseId) {
      database.ref(`feedback/${feedbackItem.firebaseId}`).remove()
        .then(() => showToast('משוב נמחק', 'success'));
    }
  };

  // Config - loaded from config.js, re-read on city change via selectedCityId dependency
  const interestOptions = window.BKK.interestOptions;

  const interestToGooglePlaces = window.BKK.interestToGooglePlaces;

  const uncoveredInterests = window.BKK.uncoveredInterests;

  const interestTooltips = window.BKK.interestTooltips;

  const areaCoordinates = window.BKK.areaCoordinates;

  // Switch city function
  const switchCity = (cityId) => {
    if (cityId === selectedCityId) return;
    if (!window.BKK.cities[cityId]) return;
    
    window.BKK.selectCity(cityId);
    setSelectedCityId(cityId);
    localStorage.setItem('city_explorer_city', cityId);
    
    // Reset form data for new city
    const firstArea = window.BKK.areaOptions[0]?.id || '';
    setFormData({
      hours: 3, area: firstArea, interests: [], circular: true, startPoint: '',
      maxStops: 15, fetchMoreCount: 3, searchMode: 'area',
      radiusMeters: 500, radiusSource: 'gps', radiusPlaceId: null, radiusPlaceName: '',
      gpsLat: null, gpsLng: null, currentLat: null, currentLng: null
    });
    setRoute(null);
    setWizardStep(1);
    setCurrentView('form');
    setDisabledStops([]);
    setManualStops([]);
    window.scrollTo(0, 0);
    showToast(window.BKK.selectedCity.icon + ' ' + window.BKK.selectedCity.name, 'success');
  };
  
  // Utility functions - loaded from utils.js
  const checkLocationInArea = window.BKK.checkLocationInArea;
  const getButtonStyle = window.BKK.getButtonStyle;

  // Text Search URL
  const GOOGLE_PLACES_TEXT_SEARCH_URL = window.BKK.GOOGLE_PLACES_TEXT_SEARCH_URL || 'https://places.googleapis.com/v1/places:searchText';

  // Calculate distance between two coordinates in meters (Haversine)
  const calcDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const r1 = lat1 * Math.PI / 180;
    const r2 = lat2 * Math.PI / 180;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(r1)*Math.cos(r2)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // Detect which area a coordinate belongs to (returns areaId or null)
  const detectAreaFromCoords = (lat, lng) => {
    const coords = window.BKK.areaCoordinates;
    let closest = null;
    let closestDist = Infinity;
    
    for (const [areaId, center] of Object.entries(coords)) {
      const check = checkLocationInArea(lat, lng, areaId);
      if (check.valid && check.distance < closestDist) {
        closest = areaId;
        closestDist = check.distance;
      }
    }
    return closest;
  };

  const fetchGooglePlaces = async (area, interests, radiusOverride) => {
    // radiusOverride: { lat, lng, radius } for radius mode
    let center, searchRadius;
    
    if (radiusOverride) {
      center = { lat: radiusOverride.lat, lng: radiusOverride.lng };
      searchRadius = radiusOverride.radius;
    } else {
      const areaCenter = areaCoordinates[area];
      if (!areaCenter) {
        addDebugLog('API', `No coordinates for area: ${area}`);
        console.error('[DYNAMIC] No coordinates for area:', area);
        return [];
      }
      center = { lat: areaCenter.lat, lng: areaCenter.lng };
      searchRadius = areaCenter.radius || 2000;
    }

    // Filter out invalid interests (those without search config)
    const validInterests = interests.filter(id => isInterestValid(id));
    if (validInterests.length === 0) {
      const names = interests.map(id => allInterestOptions.find(o => o.id === id)?.label || id).join(', ');
      addDebugLog('API', `No valid config for: ${names}`);
      console.warn('[DYNAMIC] No valid interests - all are missing search config:', names);
      return [];
    }
    
    if (validInterests.length < interests.length) {
      const skipped = interests.filter(id => !isInterestValid(id));
      const skippedNames = skipped.map(id => allInterestOptions.find(o => o.id === id)?.label || id).join(', ');
      addDebugLog('API', `Skipped interests without config: ${skippedNames}`);
      console.warn('[DYNAMIC] Skipped invalid interests:', skippedNames);
    }

    try {
      // Get config for the first valid interest (primary)
      const primaryInterest = validInterests[0];
      
      // Check if this interest has direct config or through baseCategory
      let config = interestConfig[primaryInterest];
      if (!config) {
        const customInterest = customInterests.find(ci => ci.id === primaryInterest);
        if (customInterest?.baseCategory) {
          config = interestConfig[customInterest.baseCategory] || {};
        } else {
          config = {};
        }
      }
      
      // Check if this interest uses text search
      const textSearchQuery = config.textSearch;
      
      // Collect blacklist words from all valid interests
      const blacklistWords = validInterests
        .flatMap(interest => {
          const directConfig = interestConfig[interest];
          if (directConfig?.blacklist) return directConfig.blacklist;
          const ci = customInterests.find(c => c.id === interest);
          if (ci?.baseCategory) return interestConfig[ci.baseCategory]?.blacklist || [];
          return [];
        })
        .map(word => word.toLowerCase());
      
      let response;
      let placeTypes = [];
      
      if (textSearchQuery) {
        // Use Text Search API for interests like "graffiti" -> "street art"
        const areaName = area ? (areaOptions.find(a => a.id === area)?.labelEn || area) : '';
        const cityName = window.BKK.cityNameForSearch || 'Bangkok';
        const searchQuery = `${textSearchQuery} ${areaName} ${cityName}`.trim();
        
        addDebugLog('API', `Text Search`, { query: searchQuery, area });
        console.log('[DYNAMIC] Using Text Search:', searchQuery);
        
        response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.primaryType,places.currentOpeningHours'
          },
          body: JSON.stringify({
            textQuery: searchQuery,
            maxResultCount: 20,
            locationRestriction: {
              circle: {
                center: {
                  latitude: center.lat,
                  longitude: center.lng
                },
                radius: searchRadius * 1.2
              }
            }
          })
        });
      } else {
        // Use Nearby Search API with types from interestConfig
        placeTypes = [...new Set(
          validInterests.flatMap(interest => {
            // First check if this interest has direct config
            if (interestConfig[interest]?.types) {
              return interestConfig[interest].types;
            }
            // Fallback to baseCategory if it's a custom interest
            const customInterest = customInterests.find(ci => ci.id === interest);
            if (customInterest?.baseCategory && interestConfig[customInterest.baseCategory]?.types) {
              return interestConfig[customInterest.baseCategory].types;
            }
            // Fallback to interestToGooglePlaces
            return interestToGooglePlaces[interest] || interestToGooglePlaces[customInterest?.baseCategory] || ['point_of_interest'];
          })
        )];

        addDebugLog('API', `Fetching Google Places`, { area, validInterests, placeTypes: placeTypes.slice(0, 10), center });
        console.log('[DYNAMIC] Fetching from Google Places API:', { area, validInterests });

        response = await fetch(GOOGLE_PLACES_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.primaryType,places.currentOpeningHours'
          },
          body: JSON.stringify({
            includedTypes: placeTypes.slice(0, 10),
            maxResultCount: 20,
            locationRestriction: {
              circle: {
                center: {
                  latitude: center.lat,
                  longitude: center.lng
                },
                radius: searchRadius
              }
            },
            rankPreference: radiusOverride ? 'DISTANCE' : 'POPULARITY'
          })
        });
      }

      console.log('[DYNAMIC] Google Places Response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DYNAMIC] Error fetching Google Places:', {
          status: response.status,
          error: errorText,
          area,
          placeTypes
        });
        
        // Handle 400 Unsupported types - retry without bad types
        if (response.status === 400 && errorText.includes('Unsupported types') && !isTextSearch && placeTypes.length > 1) {
          console.warn('[DYNAMIC] Unsupported types detected, retrying one type at a time...');
          let allRetryPlaces = [];
          for (const singleType of placeTypes) {
            try {
              const retryResponse = await fetch(GOOGLE_PLACES_API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                  'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.primaryType,places.currentOpeningHours'
                },
                body: JSON.stringify({
                  includedTypes: [singleType],
                  maxResultCount: 20,
                  locationRestriction: {
                    circle: {
                      center: { latitude: center.lat, longitude: center.lng },
                      radius: searchRadius
                    }
                  }
                })
              });
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (retryData.places) {
                  allRetryPlaces.push(...retryData.places);
                  console.log(`[DYNAMIC] Retry success for type: ${singleType}, got ${retryData.places.length} places`);
                }
              } else {
                const interestNames = validInterests.map(id => allInterestOptions.find(o => o.id === id)?.label || id).join(', ');
                addDebugLog('API', `Type "${singleType}" not supported by Google (${interestNames})`);
                console.warn(`[DYNAMIC] Type "${singleType}" not supported, skipping`);
              }
            } catch (retryErr) {
              console.warn(`[DYNAMIC] Retry failed for type: ${singleType}`, retryErr);
            }
          }
          if (allRetryPlaces.length > 0) {
            // Process retry results - jump to processing section
            const data = { places: allRetryPlaces };
            response = { ok: true }; // Fake ok response
            // Continue with processing below using data
            const isTextSearchRetry = false;
            const textSearchPhraseRetry = '';
            let typeFilteredCountRetry = 0;
            let blacklistFilteredCountRetry = 0;
            let relevanceFilteredCountRetry = 0;
            
            const places = data.places.map(place => {
              const name = place.displayName?.text || 'Unknown';
              const placeTypesFromGoogle = place.types || [];
              const openingHours = place.currentOpeningHours;
              const todayIndex = new Date().getDay();
              const googleDayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
              const todayHours = openingHours?.weekdayDescriptions?.[googleDayIndex] || '';
              const hoursOnly = todayHours.includes(':') ? todayHours.substring(todayHours.indexOf(':') + 1).trim() : todayHours;
              return {
                name,
                description: place.formattedAddress || '',
                address: place.formattedAddress || '',
                lat: place.location?.latitude || 0,
                lng: place.location?.longitude || 0,
                rating: place.rating || 0,
                ratingCount: place.userRatingCount || 0,
                duration: 45,
                interests: validInterests,
                googleTypes: placeTypesFromGoogle,
                primaryType: place.primaryType || null,
                googlePlaceId: place.id || null,
                openNow: openingHours?.openNow ?? null,
                todayHours: hoursOnly || '',
                custom: false
              };
            }).filter(place => place.lat !== 0 && place.lng !== 0);
            
            addDebugLog('API', `Got ${places.length} results from retry`, { names: places.slice(0, 5).map(p => p.name) });
            return places;
          }
          return []; // No results from any type
        }
        
        throw new Error(`Google API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      console.log('[DYNAMIC] Google Places Response:', {
        area,
        interests,
        placeTypes,
        foundPlaces: data.places?.length || 0
      });
      
      if (!data.places) {
        console.warn('[DYNAMIC] No places found in response');
        return [];
      }

      // Check if this was a text search
      const isTextSearch = !!textSearchQuery;
      
      // For text search: use the full query phrase for relevance filtering
      const textSearchPhrase = isTextSearch ? textSearchQuery.toLowerCase().trim() : '';
      
      // Filter and transform Google Places data
      let typeFilteredCount = 0;
      let blacklistFilteredCount = 0;
      let relevanceFilteredCount = 0;
      
      const transformed = data.places
        .filter(place => {
          const placeName = (place.displayName?.text || '').toLowerCase();
          const placeTypesFromGoogle = place.types || [];
          
          // Filter 1: Blacklist check - filter out places with blacklisted words in name
          if (blacklistWords.length > 0) {
            const isBlacklisted = blacklistWords.some(word => placeName.includes(word));
            if (isBlacklisted) {
              blacklistFilteredCount++;
              console.log('[DYNAMIC] ❌ Filtered out (blacklist):', {
                name: place.displayName?.text,
                matchedWord: blacklistWords.find(word => placeName.includes(word))
              });
              return false;
            }
          }
          
          // Filter 2: For text search - relevance check
          // Place name must contain the FULL search phrase (e.g. "street art")
          if (isTextSearch && textSearchPhrase) {
            const nameHasPhrase = placeName.includes(textSearchPhrase);
            
            if (!nameHasPhrase) {
              relevanceFilteredCount++;
              console.log('[DYNAMIC] ❌ Filtered out (text search irrelevant):', {
                name: place.displayName?.text,
                searchPhrase: textSearchPhrase
              });
              return false;
            }
          }
          
          // Filter 3: Type validation - for category search only
          if (!isTextSearch && placeTypes.length > 0) {
            const placeTypesFromGoogle = place.types || [];
            const hasValidType = placeTypesFromGoogle.some(type => placeTypes.includes(type));
            
            if (!hasValidType) {
              typeFilteredCount++;
              console.log('[DYNAMIC] ❌ Filtered out (invalid type):', {
                name: place.displayName?.text,
                googleTypes: placeTypesFromGoogle,
                expectedTypes: placeTypes
              });
              return false;
            }
          }
          
          console.log('[DYNAMIC] ✅ Kept:', {
            name: place.displayName?.text,
            isTextSearch
          });
          
          return true;
        })
        .map((place, index) => {
          // Extract today's opening hours
          const openingHours = place.currentOpeningHours;
          const todayIndex = new Date().getDay(); // 0=Sun, need to map to weekdayDescriptions (0=Mon in Google)
          const googleDayIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Convert: Sun=6, Mon=0, Tue=1...
          const todayHours = openingHours?.weekdayDescriptions?.[googleDayIndex] || '';
          // Remove day name prefix (e.g. "Monday: 9:00 AM – 5:00 PM" -> "9:00 AM – 5:00 PM")
          const hoursOnly = todayHours.includes(':') ? todayHours.substring(todayHours.indexOf(':') + 1).trim() : todayHours;
          
          return {
            name: place.displayName?.text || 'Unknown Place',
            lat: place.location?.latitude || center.lat,
            lng: place.location?.longitude || center.lng,
            description: `⭐ ${place.rating?.toFixed(1) || 'N/A'} (${place.userRatingCount || 0} ביקורות)`,
            duration: 45,
            googlePlace: true,
            rating: place.rating || 0,
            ratingCount: place.userRatingCount || 0,
            googleTypes: place.types || [],
            primaryType: place.primaryType || '',
            googlePlaceId: place.id || null,
            address: place.formattedAddress || '',
            openNow: openingHours?.openNow ?? null,
            todayHours: hoursOnly || '',
            interests: interests
          };
        });
      
      console.log('[DYNAMIC] Filtering summary:', {
        received: data.places.length,
        typeFiltered: typeFilteredCount,
        blacklistFiltered: blacklistFilteredCount,
        relevanceFiltered: relevanceFilteredCount,
        beforeDistFilter: transformed.length
      });
      
      // Filter 4: Distance check - remove places too far from search center
      // Use per-area distanceMultiplier, fallback to city default, fallback to 1.2
      const areaConfig = areaCoordinates[area] || {};
      const distMultiplier = areaConfig.distanceMultiplier || window.BKK.selectedCity?.distanceMultiplier || 1.2;
      const maxDistance = searchRadius * distMultiplier;
      const distanceFiltered = transformed.filter(place => {
        const dist = calcDistance(center.lat, center.lng, place.lat, place.lng);
        if (dist > maxDistance) {
          console.log('[DYNAMIC] ❌ Filtered out (too far):', {
            name: place.name,
            distance: Math.round(dist) + 'm',
            maxAllowed: Math.round(maxDistance) + 'm'
          });
          return false;
        }
        return true;
      });
      
      if (distanceFiltered.length < transformed.length) {
        console.log(`[DYNAMIC] Distance filter removed ${transformed.length - distanceFiltered.length} far places`);
      }
      
      addDebugLog('API', `Got ${distanceFiltered.length} results (filtered ${blacklistFilteredCount} blacklist, ${typeFilteredCount} type, ${relevanceFilteredCount} irrelevant, ${transformed.length - distanceFiltered.length} too far)`, {
        names: distanceFiltered.slice(0, 5).map(p => p.name)
      });
      
      return distanceFiltered;
    } catch (error) {
      console.error('[DYNAMIC] Error fetching Google Places:', {
        error: error.message,
        stack: error.stack,
        area,
        interests
      });
      
      // Throw error to be handled by caller
      throw {
        type: 'GOOGLE_API_ERROR',
        message: error.message,
        details: { area, interests, stack: error.stack }
      };
    }
  };

  // Function to fetch Google Place info for a location
  const fetchGooglePlaceInfo = async (location) => {
    if (!location || (!location.lat && !location.name)) {
      showToast('אין מספיק מידע על המקום', 'error');
      return null;
    }
    
    setLoadingGoogleInfo(true);
    
    try {
      // Use Text Search to find the place
      const searchQuery = location.name + ' ' + (window.BKK.cityNameForSearch || 'Bangkok');
      
      const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.primaryType,places.primaryTypeDisplayName,places.currentOpeningHours'
        },
        body: JSON.stringify({
          textQuery: searchQuery,
          maxResultCount: 5,
          locationBias: location.lat && location.lng ? {
            circle: {
              center: { latitude: location.lat, longitude: location.lng },
              radius: 1000.0
            }
          } : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Google API error');
      }
      
      const data = await response.json();
      
      if (!data.places || data.places.length === 0) {
        setGooglePlaceInfo({ notFound: true, searchQuery });
        showToast('המקום לא נמצא ב-Google', 'warning');
        return null;
      }
      
      // Find best match (closest to our coordinates if available)
      let bestMatch = data.places[0];
      
      if (location.lat && location.lng && data.places.length > 1) {
        const getDistance = (place) => {
          const lat = place.location?.latitude || 0;
          const lng = place.location?.longitude || 0;
          return Math.sqrt(Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2));
        };
        
        bestMatch = data.places.reduce((best, place) => 
          getDistance(place) < getDistance(best) ? place : best
        );
      }
      
      const placeInfo = {
        name: bestMatch.displayName?.text,
        address: bestMatch.formattedAddress,
        types: bestMatch.types || [],
        primaryType: bestMatch.primaryType,
        primaryTypeDisplayName: bestMatch.primaryTypeDisplayName?.text,
        rating: bestMatch.rating,
        ratingCount: bestMatch.userRatingCount,
        location: bestMatch.location,
        googlePlaceId: bestMatch.id || null,
        allResults: data.places.map(p => ({
          name: p.displayName?.text,
          types: p.types,
          primaryType: p.primaryType
        }))
      };
      
      setGooglePlaceInfo(placeInfo);
      addDebugLog('API', 'Fetched Google Place Info', { name: placeInfo.name, types: placeInfo.types });
      
      return placeInfo;
    } catch (error) {
      console.error('Error fetching Google place info:', error);
      showToast('שגיאה בשליפת מידע מ-Google', 'error');
      return null;
    } finally {
      setLoadingGoogleInfo(false);
    }
  };

  // Combine all interests: built-in + uncovered + custom
  const allInterestOptions = [...interestOptions, ...uncoveredInterests, ...(customInterests || [])].map(opt => {
    const config = interestConfig[opt.id];
    if (!config) return opt;
    return {
      ...opt,
      label: config.labelOverride || opt.label,
      icon: config.iconOverride || opt.icon,
      inProgress: config.inProgress !== undefined ? config.inProgress : opt.inProgress,
      locked: config.locked !== undefined ? config.locked : opt.locked
    };
  });

  // Save preferences whenever they change
  useEffect(() => {
    // Don't save if data hasn't loaded yet - prevents overwriting saved interests with empty state
    if (!isDataLoaded) return;
    localStorage.setItem('bangkok_preferences', JSON.stringify(formData));
  }, [formData, isDataLoaded]);

  // Version check - auto-check on load + manual check
  const checkForUpdates = async (silent = false) => {
    try {
      const response = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return false;
      const data = await response.json();
      const serverVersion = data.version;
      const localVersion = window.BKK.VERSION;
      
      if (serverVersion && serverVersion !== localVersion) {
        console.log(`[UPDATE] New version available: ${serverVersion} (current: ${localVersion})`);
        setUpdateAvailable(true);
        if (!silent) {
          showToast(`גרסה חדשה זמינה: ${serverVersion}`, 'success');
        }
        return true;
      } else {
        if (!silent) showToast('האפליקציה מעודכנת ✅', 'success');
        return false;
      }
    } catch (e) {
      console.log('[UPDATE] Check failed:', e);
      if (!silent) showToast('לא ניתן לבדוק עדכונים', 'error');
      return false;
    }
  };

  const applyUpdate = () => {
    // Clear all caches and hard reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload(true);
  };

  // Auto-check for updates on load (silent)
  useEffect(() => {
    const timer = setTimeout(() => checkForUpdates(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Save column width
  useEffect(() => {
    localStorage.setItem('bangkok_right_col_width', rightColWidth.toString());
  }, [rightColWidth]);

  // Sync editingLocation to newLocation when edit dialog opens
  useEffect(() => {
    if (showEditLocationDialog && editingLocation) {
      console.log('[useEffect] Syncing editingLocation to newLocation');
      setNewLocation({
        name: editingLocation.name || '',
        description: editingLocation.description || '',
        notes: editingLocation.notes || '',
        area: editingLocation.area || formData.area,
        interests: editingLocation.interests || [],
        lat: editingLocation.lat || null,
        lng: editingLocation.lng || null,
        mapsUrl: editingLocation.mapsUrl || '',
        address: editingLocation.address || '',
        uploadedImage: editingLocation.uploadedImage || null,
        imageUrls: editingLocation.imageUrls || [],
        inProgress: editingLocation.inProgress || false
      });
    }
  }, [showEditLocationDialog, editingLocation]);

  const areaOptions = window.BKK.areaOptions || [];

  // Memoized lookup maps to avoid O(n) .find() calls in render loops
  const interestMap = useMemo(() => {
    try {
      const map = {};
      if (allInterestOptions) allInterestOptions.forEach(o => { if (o && o.id) map[o.id] = o; });
      return map;
    } catch(e) { console.error('[MEMO] interestMap error:', e); return {}; }
  }, [customInterests, allInterestOptions.length]);

  const areaMap = useMemo(() => {
    try {
      const map = {};
      if (areaOptions) areaOptions.forEach(o => { if (o && o.id) map[o.id] = o; });
      return map;
    } catch(e) { console.error('[MEMO] areaMap error:', e); return {}; }
  }, [areaOptions]);

  // Memoize expensive places grouping/sorting
  const groupedPlaces = useMemo(() => {
    try {
      if (!customLocations || customLocations.length === 0) {
        return { groups: {}, ungrouped: [], sortedKeys: [], activeCount: 0, blacklistedLocations: [] };
      }
      const activeLocations = customLocations.filter(loc => loc.status !== 'blacklist');
      const blacklistedLocations = customLocations.filter(loc => loc.status === 'blacklist');
      
      if (activeLocations.length === 0) return { groups: {}, ungrouped: [], sortedKeys: [], activeCount: 0, blacklistedLocations };
      
      const groups = {};
      const ungrouped = [];
      
      activeLocations.forEach(loc => {
        if (placesGroupBy === 'interest') {
          const interests = (loc.interests || []).filter(i => i !== '_manual');
          if (interests.length === 0) {
            ungrouped.push(loc);
          } else {
            interests.forEach(int => {
              if (!groups[int]) groups[int] = [];
              groups[int].push(loc);
            });
          }
        } else {
          const locAreas = loc.areas || (loc.area ? [loc.area] : ['unknown']);
          locAreas.forEach(areaId => {
            if (!groups[areaId]) groups[areaId] = [];
            groups[areaId].push(loc);
          });
        }
      });
      
      const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (placesGroupBy === 'interest') {
          return ((interestMap[a] || {}).label || a).localeCompare((interestMap[b] || {}).label || b, 'he');
        } else {
          return ((areaMap[a] || {}).label || a).localeCompare((areaMap[b] || {}).label || b, 'he');
        }
      });
      
      const sortWithin = (locs) => [...locs].sort((a, b) => {
        if (placesGroupBy === 'interest') {
          const aArea = (areaMap[(a.areas || [a.area])[0]] || {}).label || '';
          const bArea = (areaMap[(b.areas || [b.area])[0]] || {}).label || '';
          return aArea.localeCompare(bArea, 'he') || a.name.localeCompare(b.name, 'he');
        } else {
          return (a.interests?.[0] || '').localeCompare(b.interests?.[0] || '') || a.name.localeCompare(b.name, 'he');
        }
      });
      
      const sortedGroups = {};
      sortedKeys.forEach(key => { sortedGroups[key] = sortWithin(groups[key]); });
      const sortedUngrouped = sortWithin(ungrouped);
      
      return { groups: sortedGroups, ungrouped: sortedUngrouped, sortedKeys, activeCount: activeLocations.length, blacklistedLocations };
    } catch(e) {
      console.error('[MEMO] groupedPlaces error:', e);
      return { groups: {}, ungrouped: [], sortedKeys: [], activeCount: 0, blacklistedLocations: [] };
    }
  }, [customLocations, placesGroupBy, interestMap, areaMap]);

  // Image handling - loaded from utils.js
  const compressImage = window.BKK.compressImage;
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showToast('אנא בחר קובץ תמונה', 'error');
      return;
    }
    
    try {
      const compressed = await compressImage(file);
      setNewLocation(prev => ({ ...prev, uploadedImage: compressed }));
    } catch (error) {
      console.error('[IMAGE] Upload error:', error);
      showToast('שגיאה בהעלאת התמונה', 'error');
    }
  };

  const toggleInterest = (id) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  // Auto-clean: remove selected interests that are no longer valid/visible
  // IMPORTANT: Only runs after initial data is loaded to prevent race condition
  // where saved interests get cleared before Firebase data arrives
  useEffect(() => {
    if (!isDataLoaded) return;
    if (formData.interests.length === 0) return;
    const visibleIds = allInterestOptions
      .filter(opt => opt && opt.id && isInterestValid(opt.id))
      .map(opt => opt.id);
    const cleaned = formData.interests.filter(id => visibleIds.includes(id));
    if (cleaned.length !== formData.interests.length) {
      const removed = formData.interests.filter(id => !visibleIds.includes(id));
      const removedNames = removed.map(id => allInterestOptions.find(o => o.id === id)?.label || id).join(', ');
      console.log('[CLEANUP] Removed invalid interests from selection:', removedNames);
      setFormData(prev => ({ ...prev, interests: cleaned }));
    }
  }, [interestConfig, customInterests, isDataLoaded]);

  // Button styles - loaded from utils.js

  const getStopsForInterests = () => {
    // Now we only collect CUSTOM locations - Google Places will be fetched in generateRoute
    const isRadiusMode = formData.searchMode === 'radius' || formData.searchMode === 'all';
    
    // Filter custom locations that match current area/radius and selected interests
    const matchingCustomLocations = customLocations.filter(loc => {
      // CRITICAL: Skip blacklisted locations!
      if (loc.status === 'blacklist') return false;
      
      // Skip invalid locations (missing required data)
      if (!isLocationValid(loc)) return false;
      
      if (isRadiusMode) {
        // In radius mode: filter by distance from current position
        if (!formData.currentLat || !formData.currentLng || !loc.lat || !loc.lng) return false;
        const dist = calcDistance(formData.currentLat, formData.currentLng, loc.lat, loc.lng);
        if (dist > formData.radiusMeters) return false;
      } else {
        // In area mode: filter by area (supports multi-area)
        const locAreas = loc.areas || (loc.area ? [loc.area] : []);
        if (!locAreas.includes(formData.area)) return false;
      }
      
      if (!loc.interests || loc.interests.length === 0) return false;
      
      // Check if location interests match selected interests
      return loc.interests.some(locInterest => {
        // Direct match
        if (formData.interests.includes(locInterest)) return true;
        
        // Check if selected interest is a custom one with baseCategory that matches
        for (const selectedInterest of formData.interests) {
          const customInterest = allInterestOptions.find(opt => 
            opt.id === selectedInterest && opt.custom && opt.baseCategory
          );
          
          if (customInterest && locInterest === customInterest.baseCategory) {
            return true;
          }
        }
        
        return false;
      });
    });
    
    // Remove duplicates
    const seen = new Set();
    return matchingCustomLocations.filter(stop => {
      const key = `${stop.lat},${stop.lng}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // ========== ROUTE OPTIMIZATION (Nearest Neighbor + 2-opt) ==========
  const optimizeStopOrder = (stops, startCoords, isCircular) => {
    if (stops.length <= 2) return stops;
    
    // Filter stops with valid coordinates
    const withCoords = stops.filter(s => s.lat && s.lng);
    const noCoords = stops.filter(s => !s.lat || !s.lng);
    
    if (withCoords.length <= 1) return [...withCoords, ...noCoords];
    
    // Distance matrix (using calcDistance which is Haversine)
    const dist = (a, b) => calcDistance(a.lat, a.lng, b.lat, b.lng);
    
    // --- Step 1: Nearest Neighbor from start point ---
    const unvisited = [...withCoords];
    const ordered = [];
    
    // Determine start: use startCoords if available, otherwise pick the stop closest to center
    let currentPos;
    if (startCoords?.lat && startCoords?.lng) {
      currentPos = startCoords;
    } else {
      // Use centroid of all stops as reference, pick nearest to it
      const avgLat = withCoords.reduce((s, p) => s + p.lat, 0) / withCoords.length;
      const avgLng = withCoords.reduce((s, p) => s + p.lng, 0) / withCoords.length;
      // For linear: start from the stop furthest from centroid (creates a more natural path)
      // For circular: start from stop nearest to centroid
      if (!isCircular) {
        let maxDist = -1, startIdx = 0;
        unvisited.forEach((s, i) => {
          const d = calcDistance(avgLat, avgLng, s.lat, s.lng);
          if (d > maxDist) { maxDist = d; startIdx = i; }
        });
        ordered.push(unvisited.splice(startIdx, 1)[0]);
      } else {
        let minDist = Infinity, startIdx = 0;
        unvisited.forEach((s, i) => {
          const d = calcDistance(avgLat, avgLng, s.lat, s.lng);
          if (d < minDist) { minDist = d; startIdx = i; }
        });
        ordered.push(unvisited.splice(startIdx, 1)[0]);
      }
      currentPos = ordered[0];
    }
    
    // If we have startCoords (external start point), find nearest stop to it first
    if (startCoords?.lat && startCoords?.lng && unvisited.length > 0) {
      let minDist = Infinity, nearIdx = 0;
      unvisited.forEach((s, i) => {
        const d = dist(currentPos, s);
        if (d < minDist) { minDist = d; nearIdx = i; }
      });
      ordered.push(unvisited.splice(nearIdx, 1)[0]);
      currentPos = ordered[ordered.length - 1];
    }
    
    // Greedily pick nearest unvisited
    while (unvisited.length > 0) {
      let minDist = Infinity, nearIdx = 0;
      unvisited.forEach((s, i) => {
        const d = dist(currentPos, s);
        if (d < minDist) { minDist = d; nearIdx = i; }
      });
      ordered.push(unvisited.splice(nearIdx, 1)[0]);
      currentPos = ordered[ordered.length - 1];
    }
    
    // --- Step 2: 2-opt improvement (uncross paths) ---
    const totalDist = (route) => {
      let d = 0;
      // If start coords exist, include distance from start to first stop
      if (startCoords?.lat && startCoords?.lng) {
        d += dist(startCoords, route[0]);
      }
      for (let i = 0; i < route.length - 1; i++) {
        d += dist(route[i], route[i + 1]);
      }
      // Circular: add return to start
      if (isCircular) {
        const returnTo = startCoords?.lat ? startCoords : route[0];
        d += dist(route[route.length - 1], returnTo);
      }
      return d;
    };
    
    let improved = true;
    let passes = 0;
    const maxPasses = 5; // 2-opt passes (each pass is O(n²))
    
    while (improved && passes < maxPasses) {
      improved = false;
      passes++;
      for (let i = 0; i < ordered.length - 1; i++) {
        for (let j = i + 2; j < ordered.length; j++) {
          // Check if reversing segment [i+1..j] reduces total distance
          // Only need to compare the 2 edges being broken/reconnected
          const A = i === 0 && startCoords?.lat ? startCoords : ordered[i];
          const B = ordered[i + 1];
          const C = ordered[j];
          const D = j + 1 < ordered.length ? ordered[j + 1] 
            : (isCircular ? (startCoords?.lat ? startCoords : ordered[0]) : null);
          
          const oldDist = dist(A, B) + (D ? dist(C, D) : 0);
          const newDist = dist(A, C) + (D ? dist(B, D) : 0);
          
          if (newDist < oldDist - 1) { // 1m threshold to avoid float noise
            // Reverse segment in place
            const reversed = ordered.slice(i + 1, j + 1).reverse();
            ordered.splice(i + 1, j - i, ...reversed);
            improved = true;
          }
        }
      }
    }
    
    console.log(`[OPTIMIZE] ${withCoords.length} stops optimized in ${passes} passes`);
    console.log(`[OPTIMIZE] Total distance: ${Math.round(totalDist(ordered))}m (${isCircular ? 'circular' : 'linear'})`);
    
    // Append stops without coordinates at the end
    return [...ordered, ...noCoords];
  };

  const generateRoute = async () => {
    const isRadiusMode = formData.searchMode === 'radius' || formData.searchMode === 'all';
    
    // Clear old start point to avoid stale data
    setStartPointCoords(null);
    setFormData(prev => ({...prev, startPoint: ''}));
    
    // For 'all' mode, auto-set city center and large radius
    if (formData.searchMode === 'all') {
      if (!formData.currentLat) {
        const cityCenter = window.BKK.selectedCity?.center || { lat: 13.7563, lng: 100.5018 };
        const cityRadius = window.BKK.selectedCity?.allCityRadius || 15000;
        const cityName = window.BKK.selectedCity?.name || 'כל העיר';
        const allCityLabel = 'כל ' + cityName;
        setFormData(prev => ({...prev, currentLat: cityCenter.lat, currentLng: cityCenter.lng, radiusMeters: cityRadius, radiusPlaceName: allCityLabel}));
        formData.currentLat = cityCenter.lat;
        formData.currentLng = cityCenter.lng;
        formData.radiusMeters = cityRadius;
        formData.radiusPlaceName = allCityLabel;
      }
    }
    
    if (isRadiusMode) {
      if (!formData.currentLat || !formData.currentLng) {
        showToast('אנא מצא את המיקום הנוכחי שלך תחילה', 'warning');
        return;
      }
      if (formData.interests.length === 0) {
        showToast('אנא בחר לפחות תחום עניין אחד', 'warning');
        return;
      }
    } else {
      if (!formData.area || formData.interests.length === 0) {
        showToast('אנא בחר איזור ולפחות תחום עניין אחד', 'warning');
        return;
      }
    }
    
    setIsGenerating(true);
    
    try {
      addDebugLog('ROUTE', 'Starting route generation', { 
        mode: formData.searchMode, 
        area: formData.area, 
        radius: isRadiusMode ? formData.radiusMeters : null,
        interests: formData.interests, 
        maxStops: formData.maxStops 
      });
      console.log('[ROUTE] Starting route generation', isRadiusMode ? 'RADIUS mode' : 'AREA mode');
      
      // Get custom locations (always included)
      const customStops = getStopsForInterests();
      addDebugLog('ROUTE', `Found ${customStops.length} custom stops`);
      console.log('[ROUTE] Custom stops:', customStops.length);
      
      // Calculate stops needed per interest
      const numInterests = formData.interests.length || 1;
      const maxStops = formData.maxStops || 15;
      const stopsPerInterest = Math.ceil(maxStops / numInterests);
      
      // Track results per interest for smart completion
      const interestResults = {};
      const allStops = [...customStops]; // Start with custom stops (highest priority)
      let fetchErrors = [];
      
      // Clear Google cache for fresh route generation
      googleCacheRef.current = {};
      
      // ROUND 1: Fill from custom locations first, API only for gaps
      for (const interest of formData.interests) {
        // Check how many custom stops we already have for this interest
        const customStopsForInterest = customStops.filter(stop => 
          stop.interests && stop.interests.includes(interest)
        );
        
        const neededForInterest = Math.max(0, stopsPerInterest - customStopsForInterest.length);
        
        if (neededForInterest > 0) {
          // Check if this is a private-only interest (no Google API calls)
          const interestObj = allInterestOptions.find(o => o.id === interest);
          const interestPrivateOnly = interestObj?.privateOnly || false;
          
          let fetchedPlaces = [];
          
          if (interestPrivateOnly) {
            console.log(`[ROUTE] Skipping API for private interest: ${interest}`);
          } else {
          try {
            console.log(`[ROUTE] Fetching for interest: ${interest} (need ${neededForInterest}, have ${customStopsForInterest.length} custom)`);
            const radiusOverride = isRadiusMode ? { 
              lat: formData.currentLat, 
              lng: formData.currentLng, 
              radius: formData.radiusMeters 
            } : null;
            fetchedPlaces = await fetchGooglePlaces(isRadiusMode ? null : formData.area, [interest], radiusOverride);
          } catch (error) {
            // Track errors for user notification
            fetchErrors.push({
              interest,
              error: error.message || 'Unknown error',
              details: error.details || {}
            });
            console.error(`[ERROR] Failed to fetch for ${interest}:`, error);
            fetchedPlaces = [];
          }
          } // end if !privateOnly
          
          // Filter blacklisted places (status='blacklist') BEFORE sorting
          fetchedPlaces = filterBlacklist(fetchedPlaces);
          
          // Filter out Google places that duplicate custom locations
          fetchedPlaces = filterDuplicatesOfCustom(fetchedPlaces);
          
          // In radius mode: HARD filter by actual distance (API locationBias doesn't guarantee this)
          if (isRadiusMode) {
            const beforeFilter = fetchedPlaces.length;
            fetchedPlaces = fetchedPlaces.filter(p => {
              const dist = calcDistance(formData.currentLat, formData.currentLng, p.lat, p.lng);
              return dist <= formData.radiusMeters;
            });
            const removed = beforeFilter - fetchedPlaces.length;
            if (removed > 0) {
              addDebugLog('RADIUS', `Filtered ${removed} places beyond ${formData.radiusMeters}m radius`);
              console.log(`[RADIUS] Filtered ${removed}/${beforeFilter} places beyond radius`);
            }
          }
          
          // Sort
          let sortedAll;
          if (isRadiusMode) {
            sortedAll = fetchedPlaces
              .map(p => ({ ...p, _dist: calcDistance(formData.currentLat, formData.currentLng, p.lat, p.lng) }))
              .sort((a, b) => a._dist - b._dist || (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1)));
          } else {
            sortedAll = fetchedPlaces
              .sort((a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1)));
          }
          
          // Take what we need, cache the rest
          const sortedPlaces = sortedAll.slice(0, neededForInterest);
          const cachedPlaces = sortedAll.slice(neededForInterest);
          
          // Store unused places in cache for "find more"
          googleCacheRef.current[interest] = cachedPlaces;
          console.log(`[CACHE] Stored ${cachedPlaces.length} unused places for ${interest}`);
          
          // Track results
          interestResults[interest] = {
            requested: stopsPerInterest,
            custom: customStopsForInterest.length,
            fetched: sortedPlaces.length,
            total: customStopsForInterest.length + sortedPlaces.length,
            allPlaces: sortedAll // Keep all for round 2
          };
          
          // Add to allStops
          allStops.push(...sortedPlaces);
        } else {
          // Already have enough from custom - no API call needed!
          console.log(`[ROUTE] Skipping API for ${interest}: ${customStopsForInterest.length} custom stops suffice`);
          googleCacheRef.current[interest] = []; // Empty cache
          interestResults[interest] = {
            requested: stopsPerInterest,
            custom: customStopsForInterest.length,
            fetched: 0,
            total: customStopsForInterest.length,
            allPlaces: []
          };
        }
      }
      
      // Remove duplicates after round 1 - check ONLY exact name match
      // Allow same coordinates with different names (same physical location, different interests)
      const seen = new Set();
      let uniqueStops = allStops.filter(stop => {
        const normalizedName = stop.name.toLowerCase().trim();
        
        if (seen.has(normalizedName)) {
          console.log('[DEDUP] Removed duplicate by exact name:', stop.name);
          return false;
        }
        
        seen.add(normalizedName);
        return true;
      });
      
      // ROUND 2: If we didn't reach maxStops, try to add more from successful interests
      const totalFound = uniqueStops.length;
      const missing = maxStops - totalFound;
      
      console.log('[ROUTE] Round 1 complete:', { totalFound, maxStops, missing });
      
      if (missing > 0) {
        // Find interests that might have more places available
        const additionalPlaces = [];
        
        for (const interest of formData.interests) {
          const result = interestResults[interest];
          const alreadyUsed = result.fetched;
          const available = result.allPlaces.length;
          const canAddMore = available - alreadyUsed;
          
          if (canAddMore > 0) {
            // This interest has more places we can use
            const ratingSort = (a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1));
            const distSort = (a, b) => calcDistance(formData.currentLat, formData.currentLng, a.lat, a.lng) - calcDistance(formData.currentLat, formData.currentLng, b.lat, b.lng);
            const morePlaces = result.allPlaces
              .sort(isRadiusMode ? distSort : ratingSort)
              .slice(alreadyUsed, alreadyUsed + canAddMore);
            
            additionalPlaces.push(...morePlaces);
          }
        }
        
        // Add additional places up to the missing amount
        const ratingSort2 = (a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1));
        const distSort2 = (a, b) => calcDistance(formData.currentLat, formData.currentLng, a.lat, a.lng) - calcDistance(formData.currentLat, formData.currentLng, b.lat, b.lng);
        const sorted = additionalPlaces
          .sort(isRadiusMode ? distSort2 : ratingSort2)
          .slice(0, missing);
        
        uniqueStops = [...uniqueStops, ...sorted];
        
        // Remove duplicates again - check ONLY exact name match
        const seenNames = new Set();
        const finalStops = [];
        
        for (const stop of uniqueStops) {
          const normalizedName = stop.name.toLowerCase().trim();
          
          if (!seenNames.has(normalizedName)) {
            finalStops.push(stop);
            seenNames.add(normalizedName);
          } else {
            console.log('[DEDUP Round 2] Removed duplicate:', stop.name);
          }
        }
        
        uniqueStops = finalStops;
        
        console.log('[ROUTE] Round 2 complete:', { added: sorted.length, total: uniqueStops.length });
        
        // Update Google cache: remove places that Round 2 used
        const usedInRound2 = new Set(sorted.map(s => s.name.toLowerCase().trim()));
        for (const interest of formData.interests) {
          if (googleCacheRef.current[interest]?.length > 0) {
            googleCacheRef.current[interest] = googleCacheRef.current[interest]
              .filter(p => !usedInRound2.has(p.name.toLowerCase().trim()));
          }
        }
      }
      
      // Show errors if any occurred
      if (fetchErrors.length > 0) {
        const errorMsg = fetchErrors.map(e => `${e.interest}: ${e.error}`).join(', ');
        
        console.error('[ROUTE] Data source errors:', fetchErrors);
        showToast(`שגיאות בקבלת מקומות: ${errorMsg}`, 'warning');
      }
      
      // In radius mode: detect area for each stop + filter out places outside known areas + add distance
      if (isRadiusMode) {
        const beforeCount = uniqueStops.length;
        uniqueStops = uniqueStops.map(stop => {
          const detectedArea = detectAreaFromCoords(stop.lat, stop.lng);
          const distFromCenter = Math.round(calcDistance(formData.currentLat, formData.currentLng, stop.lat, stop.lng));
          return { ...stop, detectedArea, distFromCenter };
        }).filter(stop => {
          if (stop.detectedArea) return true;
          console.log('[RADIUS] Filtered out (outside known areas):', stop.name);
          return false;
        });
        const filtered = beforeCount - uniqueStops.length;
        if (filtered > 0) {
          addDebugLog('ROUTE', `Radius: filtered ${filtered} places outside known areas`);
        }
      } else {
        // In area mode: set detectedArea = formData.area for all
        uniqueStops = uniqueStops.map(stop => ({ ...stop, detectedArea: formData.area }));
      }
      
      if (uniqueStops.length === 0) {
        showToast(isRadiusMode 
          ? 'לא נמצאו מקומות באזורים המוכרים ברדיוס שנבחר. נסה להגדיל רדיוס.' 
          : 'לא נמצאו מקומות. נסה תחומי עניין או אזור אחר.', 'error');
        setIsGenerating(false);
        return;
      }

      // Route name and area info
      let areaName, interestsText;
      if (isRadiusMode) {
        const allCityLabel = 'כל ' + (window.BKK.selectedCity?.name || 'העיר');
        if (formData.searchMode === 'all' || formData.radiusPlaceName === allCityLabel || formData.radiusPlaceName === 'כל בנגקוק') {
          areaName = allCityLabel;
        } else {
          const sourceName = formData.radiusSource === 'myplace' && formData.radiusPlaceId
            ? customLocations.find(l => l.id === formData.radiusPlaceId)?.name || 'מקום שלי'
            : formData.radiusPlaceName || 'מיקום נוכחי';
          areaName = `${formData.radiusMeters}מ' מ-${sourceName}`;
        }
      } else {
        const selectedArea = areaOptions.find(a => a.id === formData.area);
        areaName = selectedArea?.label || 'בנקוק';
      }
      interestsText = formData.interests
        .map(id => allInterestOptions.filter(o => o && o.id).find(o => o.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      
      // Find highest sequential number for similar routes
      const baseName = `${areaName} - ${interestsText}`;
      const existingNumbers = savedRoutes
        .filter(r => r.name && r.name.startsWith(baseName))
        .map(r => {
          const match = r.name.match(/#(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        });
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      const defaultName = `${baseName} #${nextNumber}`;
      
      const newRoute = {
        id: Date.now(),
        name: '', // Will be set when user saves
        defaultName: defaultName,
        createdAt: new Date().toISOString(),
        areaName: areaName,
        interestsText: interestsText,
        title: `${areaName} - ${uniqueStops.length} מקומות`,
        description: `מסלול ${routeType === 'circular' ? 'מעגלי' : 'לינארי'}`,
        duration: formData.hours, // Keep for backward compatibility but not displayed
        circular: routeType === 'circular',
        startPoint: (startPointCoords?.address) || formData.startPoint || 'התחלה מהמקום הראשון ברשימה',
        startPointCoords: startPointCoords || null,
        stops: uniqueStops,
        preferences: { ...formData },
        stats: {
          custom: customStops.length,
          fetched: uniqueStops.length - customStops.length,
          total: uniqueStops.length
        },
        // Warning if didn't reach maxStops
        incomplete: uniqueStops.length < maxStops ? {
          requested: maxStops,
          found: uniqueStops.length,
          missing: maxStops - uniqueStops.length
        } : null,
        // Errors if any
        errors: fetchErrors.length > 0 ? fetchErrors : null,
        optimized: false
      };

      // Include manually added stops (if any)
      if (manualStops.length > 0) {
        const existingNames = new Set(uniqueStops.map(s => s.name.toLowerCase().trim()));
        const nonDuplicateManual = manualStops.filter(ms => !existingNames.has(ms.name.toLowerCase().trim()));
        if (nonDuplicateManual.length > 0) {
          newRoute.stops = [...newRoute.stops, ...nonDuplicateManual];
          newRoute.stats.manual = nonDuplicateManual.length;
          newRoute.stats.total = newRoute.stops.length;
        }
      }

      console.log('[ROUTE] Route created successfully:', {
        stops: newRoute.stops.length,
        stats: newRoute.stats,
        incomplete: newRoute.incomplete,
        errors: newRoute.errors
      });

      setRoute(newRoute);
      
      // Clean up disabled stops: keep only those that still exist in the new route
      if (disabledStops.length > 0) {
        const newStopNames = new Set(newRoute.stops.map(s => (s.name || '').toLowerCase().trim()));
        const stillRelevant = disabledStops.filter(name => newStopNames.has(name));
        if (stillRelevant.length !== disabledStops.length) {
          console.log('[ROUTE] Cleaned disabled stops:', disabledStops.length, '->', stillRelevant.length);
          setDisabledStops(stillRelevant);
        }
      }
      
      console.log('[ROUTE] Route set, staying in form view');
      console.log('[ROUTE] Route object:', newRoute);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('route-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
      // Stay in form view to show compact list
    } catch (error) {
      console.error('[ROUTE] Fatal error generating route:', error);
      showToast(`שגיאה: ${error.message || 'שגיאה לא ידועה'}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Compute/recompute optimized route order from existing stops
  const computeRoute = () => {
    if (!route || route.stops.length < 2) return;
    if (!startPointCoords) {
      showToast('בחר נקודת התחלה לפני חישוב מסלול', 'warning');
      return;
    }
    
    const isCircular = routeType === 'circular';
    
    // Filter out disabled stops for optimization, keep them at end
    const activeStops = route.stops.filter(stop => {
      return !disabledStops.includes((stop.name || '').toLowerCase().trim());
    });
    const inactiveStops = route.stops.filter(stop => {
      return disabledStops.includes((stop.name || '').toLowerCase().trim());
    });
    
    console.log(`[COMPUTE] Optimizing ${activeStops.length} active stops (${isCircular ? 'circular' : 'linear'})`);
    const optimized = optimizeStopOrder(activeStops, startPointCoords, isCircular);
    
    // Recombine: optimized active stops first, then inactive at end
    const newStops = [...optimized, ...inactiveStops];
    
    setRoute({
      ...route,
      stops: newStops,
      circular: isCircular,
      optimized: true,
      startPoint: startPointCoords.address || formData.startPoint || '',
      startPointCoords: startPointCoords
    });
    
    showToast(`מסלול חושב! ${optimized.length} עצירות`, 'success');
    
    setTimeout(() => {
      // Scroll to bottom of results to show the Google Maps button
      const el = document.getElementById('open-google-maps-btn');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  // Fetch more places for a specific interest
  // Priority: 1) unused custom locations  2) Google cache  3) new API call
  const fetchMoreForInterest = async (interest) => {
    if (!route) return;
    
    setIsGenerating(true);
    
    try {
      const fetchCount = formData.fetchMoreCount || 3;
      const isRadiusMode = formData.searchMode === 'radius' || formData.searchMode === 'all';
      const existingNames = route.stops.map(s => s.name.toLowerCase().trim());
      const interestLabel = allInterestOptions.find(o => o.id === interest)?.label || interest;
      let placesToAdd = [];
      let source = '';
      
      console.log(`[FETCH_MORE] Need ${fetchCount} more for ${interest}`);
      
      // LAYER 1: Unused custom locations for this interest
      const unusedCustom = customLocations.filter(loc => {
        if (loc.status === 'blacklist') return false;
        if (!isLocationValid(loc)) return false;
        if (!loc.interests || !loc.interests.some(li => {
          if (li === interest) return true;
          const ci = allInterestOptions.find(opt => opt.id === interest && opt.custom && opt.baseCategory);
          return ci && li === ci.baseCategory;
        })) return false;
        // Must be in area/radius
        if (isRadiusMode) {
          if (!formData.currentLat || !formData.currentLng || !loc.lat || !loc.lng) return false;
          if (calcDistance(formData.currentLat, formData.currentLng, loc.lat, loc.lng) > formData.radiusMeters) return false;
        } else {
          const locAreas = loc.areas || (loc.area ? [loc.area] : []);
          if (!locAreas.includes(formData.area)) return false;
        }
        // Not already in route
        return !existingNames.includes(loc.name.toLowerCase().trim());
      });
      
      if (unusedCustom.length > 0) {
        const toAdd = unusedCustom.slice(0, fetchCount);
        placesToAdd = toAdd.map(p => ({ ...p, addedLater: true }));
        source = 'מהמקומות שלך';
        console.log(`[FETCH_MORE] Found ${toAdd.length} from unused custom locations`);
      }
      
      // LAYER 2: Google cache (unused results from initial route generation)
      if (placesToAdd.length < fetchCount) {
        const cached = googleCacheRef.current[interest] || [];
        const allUsedNames = [...existingNames, ...placesToAdd.map(p => p.name.toLowerCase().trim())];
        const unusedCached = cached.filter(p => !allUsedNames.includes(p.name.toLowerCase().trim()));
        
        if (unusedCached.length > 0) {
          const needed = fetchCount - placesToAdd.length;
          const fromCache = unusedCached.slice(0, needed).map(p => ({
            ...p,
            addedLater: true,
            detectedArea: isRadiusMode ? detectAreaFromCoords(p.lat, p.lng) : formData.area
          }));
          placesToAdd.push(...fromCache);
          // Update cache: remove used ones
          googleCacheRef.current[interest] = unusedCached.slice(needed);
          source = source ? `${source} ומגוגל (cache)` : 'מגוגל';
          console.log(`[FETCH_MORE] Added ${fromCache.length} from Google cache (${googleCacheRef.current[interest].length} remaining)`);
        }
      }
      
      // LAYER 3: New API call (only if still need more AND not private-only)
      if (placesToAdd.length < fetchCount) {
        // Check privateOnly
        const interestObjFM = allInterestOptions.find(o => o.id === interest);
        const isPrivate = interestObjFM?.privateOnly || false;
        
        if (isPrivate) {
          console.log(`[FETCH_MORE] Private interest ${interest} - skipping API call`);
        } else {
        const needed = fetchCount - placesToAdd.length;
        console.log(`[FETCH_MORE] Cache exhausted, calling API for ${needed} more`);
        
        const radiusOverride = isRadiusMode ? { 
          lat: formData.currentLat, lng: formData.currentLng, radius: formData.radiusMeters 
        } : null;
        let newPlaces = await fetchGooglePlaces(isRadiusMode ? null : formData.area, [interest], radiusOverride);
        
        if (isRadiusMode) {
          newPlaces = newPlaces.map(p => ({ ...p, detectedArea: detectAreaFromCoords(p.lat, p.lng) }))
            .filter(p => p.detectedArea);
          newPlaces = newPlaces.filter(p => calcDistance(formData.currentLat, formData.currentLng, p.lat, p.lng) <= formData.radiusMeters);
        } else {
          newPlaces = newPlaces.map(p => ({ ...p, detectedArea: formData.area }));
        }
        
        newPlaces = filterBlacklist(newPlaces);
        newPlaces = filterDuplicatesOfCustom(newPlaces);
        
        const allUsedNames = [...existingNames, ...placesToAdd.map(p => p.name.toLowerCase().trim())];
        newPlaces = newPlaces.filter(p => !allUsedNames.includes(p.name.toLowerCase().trim()));
        
        if (isRadiusMode && formData.currentLat) {
          newPlaces.sort((a, b) => calcDistance(formData.currentLat, formData.currentLng, a.lat, a.lng) - calcDistance(formData.currentLat, formData.currentLng, b.lat, b.lng));
        } else {
          newPlaces.sort((a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1)));
        }
        
        const fromApi = newPlaces.slice(0, needed).map(p => ({ ...p, addedLater: true }));
        // Cache remaining for future use
        googleCacheRef.current[interest] = newPlaces.slice(needed);
        placesToAdd.push(...fromApi);
        source = source ? `${source} ומגוגל` : 'מגוגל';
        console.log(`[FETCH_MORE] Got ${fromApi.length} from API, cached ${googleCacheRef.current[interest].length}`);
        } // end if !isPrivate
      }
      
      if (placesToAdd.length === 0) {
        showToast(`לא נמצאו עוד מקומות ב${interestLabel}`, 'warning');
        return;
      }
      
      const updatedRoute = {
        ...route,
        stops: [...route.stops, ...placesToAdd]
      };
      
      setRoute(updatedRoute);
      showToast(`נוספו ${placesToAdd.length} מקומות ל${interestLabel} (${source})`, 'success');
      
    } catch (error) {
      console.error('[FETCH_MORE] Error:', error);
      showToast('שגיאה בהוספת מקומות', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch more places for all interests - delegates to fetchMoreForInterest per interest
  const fetchMoreAll = async () => {
    if (!route) return;
    
    setIsGenerating(true);
    
    try {
      const fetchCount = formData.fetchMoreCount || 3;
      const perInterest = Math.ceil(fetchCount / formData.interests.length);
      const isRadiusMode = formData.searchMode === 'radius' || formData.searchMode === 'all';
      const existingNames = route.stops.map(s => s.name.toLowerCase().trim());
      
      console.log(`[FETCH_MORE_ALL] Need ${perInterest} per interest, total target: ${fetchCount}`);
      
      const allNewPlaces = [];
      let fromCustom = 0;
      let fromCache = 0;
      let fromApi = 0;
      
      for (const interest of formData.interests) {
        const allUsedNames = [...existingNames, ...allNewPlaces.map(p => p.name.toLowerCase().trim())];
        let placesForInterest = [];
        
        // LAYER 1: Unused custom locations
        const unusedCustom = customLocations.filter(loc => {
          if (loc.status === 'blacklist') return false;
          if (!isLocationValid(loc)) return false;
          if (!loc.interests || !loc.interests.some(li => {
            if (li === interest) return true;
            const ci = allInterestOptions.find(opt => opt.id === interest && opt.custom && opt.baseCategory);
            return ci && li === ci.baseCategory;
          })) return false;
          if (isRadiusMode) {
            if (!formData.currentLat || !formData.currentLng || !loc.lat || !loc.lng) return false;
            if (calcDistance(formData.currentLat, formData.currentLng, loc.lat, loc.lng) > formData.radiusMeters) return false;
          } else {
            const locAreas = loc.areas || (loc.area ? [loc.area] : []);
            if (!locAreas.includes(formData.area)) return false;
          }
          return !allUsedNames.includes(loc.name.toLowerCase().trim());
        });
        
        if (unusedCustom.length > 0) {
          const toAdd = unusedCustom.slice(0, perInterest).map(p => ({ ...p, addedLater: true }));
          placesForInterest.push(...toAdd);
          fromCustom += toAdd.length;
        }
        
        // LAYER 2: Google cache
        if (placesForInterest.length < perInterest) {
          const cached = googleCacheRef.current[interest] || [];
          const usedNames = [...allUsedNames, ...placesForInterest.map(p => p.name.toLowerCase().trim())];
          const unusedCached = cached.filter(p => !usedNames.includes(p.name.toLowerCase().trim()));
          
          if (unusedCached.length > 0) {
            const needed = perInterest - placesForInterest.length;
            const fromC = unusedCached.slice(0, needed).map(p => ({
              ...p, addedLater: true,
              detectedArea: isRadiusMode ? detectAreaFromCoords(p.lat, p.lng) : formData.area
            }));
            placesForInterest.push(...fromC);
            googleCacheRef.current[interest] = unusedCached.slice(needed);
            fromCache += fromC.length;
          }
        }
        
        // LAYER 3: API (only if still need more)
        if (placesForInterest.length < perInterest) {
          // Check privateOnly
          const interestObjFA = allInterestOptions.find(o => o.id === interest);
          const isPrivateAll = interestObjFA?.privateOnly || false;
          
          if (!isPrivateAll) {
          const needed = perInterest - placesForInterest.length;
          console.log(`[FETCH_MORE_ALL] API call for ${interest} (need ${needed} more)`);
          
          const radiusOverride = isRadiusMode ? { 
            lat: formData.currentLat, lng: formData.currentLng, radius: formData.radiusMeters 
          } : null;
          let newPlaces = await fetchGooglePlaces(isRadiusMode ? null : formData.area, [interest], radiusOverride);
          
          if (isRadiusMode) {
            newPlaces = newPlaces.map(p => ({ ...p, detectedArea: detectAreaFromCoords(p.lat, p.lng) }))
              .filter(p => p.detectedArea);
            newPlaces = newPlaces.filter(p => calcDistance(formData.currentLat, formData.currentLng, p.lat, p.lng) <= formData.radiusMeters);
          } else {
            newPlaces = newPlaces.map(p => ({ ...p, detectedArea: formData.area }));
          }
          
          newPlaces = filterBlacklist(newPlaces);
          newPlaces = filterDuplicatesOfCustom(newPlaces);
          const usedNames = [...allUsedNames, ...placesForInterest.map(p => p.name.toLowerCase().trim())];
          newPlaces = newPlaces.filter(p => !usedNames.includes(p.name.toLowerCase().trim()));
          
          const fromA = newPlaces.slice(0, needed).map(p => ({ ...p, addedLater: true }));
          googleCacheRef.current[interest] = newPlaces.slice(needed);
          placesForInterest.push(...fromA);
          fromApi += fromA.length;
          } else {
            console.log(`[FETCH_MORE_ALL] Private interest ${interest} - skipping API`);
          }
        }
        
        allNewPlaces.push(...placesForInterest);
      }
      
      if (allNewPlaces.length === 0) {
        showToast('לא נמצאו עוד מקומות', 'warning');
        return;
      }
      
      const updatedRoute = {
        ...route,
        stops: [...route.stops, ...allNewPlaces]
      };
      
      setRoute(updatedRoute);
      
      // Build source message
      const sources = [];
      if (fromCustom > 0) sources.push(`${fromCustom} מהמקומות שלך`);
      if (fromCache > 0) sources.push(`${fromCache} מגוגל (cache)`);
      if (fromApi > 0) sources.push(`${fromApi} מגוגל`);
      showToast(`נוספו ${allNewPlaces.length} מקומות (${sources.join(', ')})`, 'success');
      
      setTimeout(() => {
        document.getElementById('route-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('[FETCH_MORE_ALL] Error:', error);
      showToast('שגיאה בהוספת מקומות', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter blacklisted places
  // Filter out places that exist in custom locations with status='blacklist' (exact name match)
  const filterBlacklist = (places) => {
    const blacklistedNames = customLocations
      .filter(loc => loc.status === 'blacklist')
      .map(loc => loc.name.toLowerCase().trim());
    
    if (blacklistedNames.length === 0) return places;
    
    return places.filter(place => {
      const placeName = place.name.toLowerCase().trim();
      const isBlacklisted = blacklistedNames.includes(placeName);
      if (isBlacklisted) {
        console.log(`[BLACKLIST] Filtered out: ${place.name}`);
      }
      return !isBlacklisted;
    });
  };
  
  // Filter out Google places that already exist in custom locations (exact name match)
  const filterDuplicatesOfCustom = (places) => {
    const customNames = customLocations
      .filter(loc => loc.status !== 'blacklist')
      .map(loc => loc.name.toLowerCase().trim());
    
    if (customNames.length === 0) return places;
    
    return places.filter(place => {
      const placeName = place.name.toLowerCase().trim();
      const isDuplicate = customNames.includes(placeName);
      if (isDuplicate) {
        console.log(`[DEDUP] Filtered Google duplicate of custom location: ${place.name}`);
      }
      return !isDuplicate;
    });
  };

  // Strip heavy data (base64 images) from route before localStorage save
  const stripRouteForStorage = (r) => {
    const stripped = { ...r };
    if (stripped.stops) {
      stripped.stops = stripped.stops.map(s => {
        const { uploadedImage, ...rest } = s;
        return rest;
      });
    }
    return stripped;
  };

  const saveRoutesToStorage = (routes) => {
    if (isFirebaseAvailable && database) {
      // Firebase mode: no-op, individual operations handle persistence
      return;
    }
    try {
      const stripped = routes.map(stripRouteForStorage);
      localStorage.setItem('bangkok_saved_routes', JSON.stringify(stripped));
    } catch (e) {
      console.error('[STORAGE] Failed to save routes:', e);
      showToast('שגיאה בשמירה - אחסון מלא. נסה למחוק מסלולים ישנים', 'error');
    }
  };

  const quickSaveRoute = () => {
    const name = route.defaultName || route.name || `מסלול ${Date.now()}`;
    
    const routeToSave = {
      ...route,
      name: name,
      notes: '',
      savedAt: new Date().toISOString(),
      inProgress: true,
      locked: false
    };

    if (isFirebaseAvailable && database) {
      const stripped = stripRouteForStorage(routeToSave);
      database.ref('savedRoutes').push(stripped)
        .then((ref) => {
          console.log('[FIREBASE] Route saved');
          const savedWithFbId = { ...routeToSave, firebaseId: ref.key };
          setRoute(savedWithFbId);
          setEditingRoute({...savedWithFbId});
          setRouteDialogMode('add');
          setShowRouteDialog(true);
          showToast('המסלול נשמר!', 'success');
        })
        .catch((error) => {
          console.error('[FIREBASE] Error saving route:', error);
          showToast('שגיאה בשמירת מסלול', 'error');
        });
    } else {
      const updated = [routeToSave, ...savedRoutes];
      setSavedRoutes(updated);
      saveRoutesToStorage(updated);
      setRoute(routeToSave);
      showToast('המסלול נשמר!', 'success');
      setEditingRoute({...routeToSave});
      setRouteDialogMode('add');
      setShowRouteDialog(true);
    }
  };

  const deleteRoute = (routeId) => {
    if (isFirebaseAvailable && database) {
      const routeToDelete = savedRoutes.find(r => r.id === routeId);
      if (routeToDelete && routeToDelete.firebaseId) {
        database.ref(`savedRoutes/${routeToDelete.firebaseId}`).remove()
          .then(() => {
            console.log('[FIREBASE] Route deleted');
            showToast('המסלול נמחק', 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error deleting route:', error);
            showToast('שגיאה במחיקה', 'error');
          });
      }
    } else {
      const updated = savedRoutes.filter(r => r.id !== routeId);
      setSavedRoutes(updated);
      saveRoutesToStorage(updated);
      showToast('המסלול נמחק', 'success');
    }
  };

  const updateRoute = (routeId, updates) => {
    if (isFirebaseAvailable && database) {
      const routeToUpdate = savedRoutes.find(r => r.id === routeId);
      if (routeToUpdate && routeToUpdate.firebaseId) {
        database.ref(`savedRoutes/${routeToUpdate.firebaseId}`).update(updates)
          .then(() => {
            console.log('[FIREBASE] Route updated');
            showToast('המסלול עודכן', 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error updating route:', error);
            showToast('שגיאה בעדכון', 'error');
          });
      }
    } else {
      const updated = savedRoutes.map(r => r.id === routeId ? { ...r, ...updates } : r);
      setSavedRoutes(updated);
      saveRoutesToStorage(updated);
      showToast('המסלול עודכן', 'success');
    }
  };

  const loadSavedRoute = (savedRoute) => {
    setRoute(savedRoute);
    // Restore startPoint: prefer startPointCoords.address (validated), then route.startPoint, then preferences
    const coords = savedRoute.startPointCoords || null;
    const validatedAddress = coords?.address || '';
    const startPointText = validatedAddress || 
      (savedRoute.startPoint !== 'התחלה מהמקום הראשון ברשימה' ? savedRoute.startPoint : '') || 
      '';
    setFormData({...savedRoute.preferences, startPoint: startPointText });
    setStartPointCoords(coords);
    // Restore route type (circular/linear)
    setRouteType(savedRoute.circular ? 'circular' : 'linear');
    setCurrentView('route');
  };

  // NOTE: addCustomInterest logic is now inline in the dialog footer (see Add Interest Dialog)
  // This allows direct configuration of search settings when creating an interest

  const deleteCustomInterest = (interestId) => {
    const interestToDelete = customInterests.find(i => i.id === interestId);
    
    // Check if any custom locations use this interest
    const locationsUsingInterest = customLocations.filter(loc => 
      loc.interests && loc.interests.includes(interestId)
    );
    
    // Delete from Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      if (interestToDelete && interestToDelete.firebaseId) {
        database.ref(`customInterests/${interestToDelete.firebaseId}`).remove()
          .then(() => {
            console.log('[FIREBASE] Interest deleted from shared database');
            if (locationsUsingInterest.length > 0) {
              showToast(`תחום נמחק (${locationsUsingInterest.length} מקומות עדיין משתמשים בו)`, 'success');
            } else {
              showToast('תחום נמחק!', 'success');
            }
          })
          .catch((error) => {
            console.error('[FIREBASE] Error deleting interest:', error);
            showToast('שגיאה במחיקה', 'error');
          });
      }
    } else {
      // STATIC MODE: localStorage (local)
      const updated = customInterests.filter(i => i.id !== interestId);
      setCustomInterests(updated);
      localStorage.setItem('bangkok_custom_interests', JSON.stringify(updated));
      
      if (locationsUsingInterest.length > 0) {
        showToast(`תחום נמחק (${locationsUsingInterest.length} מקומות עדיין משתמשים בו)`, 'success');
      } else {
        showToast('תחום נמחק!', 'success');
      }
    }
  };

  // Toggle interest active/inactive status (per-user)
  const toggleInterestStatus = (interestId) => {
    // Invalid interests cannot be activated
    if (!isInterestValid(interestId) && !interestStatus[interestId]) return;
    
    const newStatus = !interestStatus[interestId];
    const updatedStatus = { ...interestStatus, [interestId]: newStatus };
    setInterestStatus(updatedStatus);
    
    if (isFirebaseAvailable && database) {
      const userId = localStorage.getItem('bangkok_user_id') || 'unknown';
      database.ref(`users/${userId}/interestStatus/${interestId}`).set(newStatus)
        .then(() => {
          console.log('[FIREBASE] User interest status updated:', interestId, newStatus);
        })
        .catch(err => {
          console.error('Error updating interest status:', err);
        });
    } else {
      localStorage.setItem('bangkok_interest_status', JSON.stringify(updatedStatus));
    }
  };

  // Reset user interest preferences to admin defaults
  const resetInterestStatusToDefault = async () => {
    if (isFirebaseAvailable && database) {
      const userId = localStorage.getItem('bangkok_user_id') || 'unknown';
      try {
        // Remove user overrides
        await database.ref(`users/${userId}/interestStatus`).remove();
        // Reload admin defaults
        const adminSnap = await database.ref('settings/interestStatus').once('value');
        const adminData = adminSnap.val() || {};
        const builtInIds = interestOptions.map(i => i.id);
        const uncoveredIds = uncoveredInterests.map(i => i.id || i.name.replace(/\s+/g, '_').toLowerCase());
        const defaultStatus = {};
        builtInIds.forEach(id => { defaultStatus[id] = true; });
        uncoveredIds.forEach(id => { defaultStatus[id] = false; });
        setInterestStatus({ ...defaultStatus, ...adminData });
        showToast('התחומים אופסו לברירת מחדל', 'success');
      } catch (err) {
        console.error('Error resetting interest status:', err);
        showToast('שגיאה באיפוס', 'error');
      }
    } else {
      localStorage.removeItem('bangkok_interest_status');
      const builtInIds = interestOptions.map(i => i.id);
      const uncoveredIds = uncoveredInterests.map(i => i.id || i.name.replace(/\s+/g, '_').toLowerCase());
      const defaultStatus = {};
      builtInIds.forEach(id => { defaultStatus[id] = true; });
      uncoveredIds.forEach(id => { defaultStatus[id] = false; });
      setInterestStatus(defaultStatus);
      showToast('התחומים אופסו לברירת מחדל', 'success');
    }
  };

  // Check if interest has valid search config
  const isInterestValid = (interestId) => {
    // Private interests are always valid (no Google search needed)
    const interestObj = allInterestOptions.find(o => o.id === interestId);
    if (interestObj?.privateOnly) return true;
    
    const config = interestConfig[interestId];
    if (!config) return false;
    
    // Valid if has textSearch OR has types array with items
    if (config.textSearch && config.textSearch.trim()) return true;
    if (config.types && Array.isArray(config.types) && config.types.length > 0) return true;
    
    return false;
  };

  // Check if location has all required data
  const isLocationValid = (loc) => {
    if (!loc) return false;
    // Must have name
    if (!loc.name || !loc.name.trim()) return false;
    // Must have at least one interest
    if (!loc.interests || loc.interests.length === 0) return false;
    // Must have address OR coordinates
    const hasAddress = loc.address && loc.address.trim();
    const hasCoords = loc.lat && loc.lng;
    if (!hasAddress && !hasCoords) return false;
    return true;
  };

  const deleteCustomLocation = (locationId) => {
    const locationToDelete = customLocations.find(loc => loc.id === locationId);
    
    // Delete from Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      if (locationToDelete && locationToDelete.firebaseId) {
        database.ref(`customLocations/${locationToDelete.firebaseId}`).remove()
          .then(() => {
            console.log('[FIREBASE] Location deleted from shared database');
            showToast('המקום נמחק!', 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error deleting location:', error);
            showToast('שגיאה במחיקה', 'error');
          });
      }
    } else {
      // STATIC MODE: localStorage (local)
      const updated = customLocations.filter(loc => loc.id !== locationId);
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast('המקום נמחק!', 'success');
    }
  };
  
  // Toggle location status with review state
  const toggleLocationStatus = (locationId) => {
    const location = customLocations.find(loc => loc.id === locationId);
    if (!location) return;
    
    let newStatus = location.status;
    let newInProgress = location.inProgress;
    
    if (location.status === 'blacklist') {
      // From blacklist → review (with inProgress badge)
      newStatus = 'review';
      newInProgress = true;
    } else if (location.status === 'review') {
      // From review → active (remove badge)
      newStatus = 'active';
      newInProgress = false;
    } else {
      // From active → blacklist
      newStatus = 'blacklist';
      newInProgress = false;
    }
    
    // Update in Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      if (location.firebaseId) {
        database.ref(`customLocations/${location.firebaseId}`).update({
          status: newStatus,
          inProgress: newInProgress
        })
          .then(() => {
            const statusText = 
              newStatus === 'blacklist' ? '🚫 דלג תמיד' : 
              newStatus === 'review' ? '🛠️ בבדיקה' : 
              '✅ כלול';
            showToast(`${location.name}: ${statusText}`, 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error updating status:', error);
            showToast('שגיאה בעדכון', 'error');
          });
      }
    } else {
      // STATIC MODE: localStorage (local)
      const updated = customLocations.map(loc => {
        if (loc.id === locationId) {
          return { ...loc, status: newStatus, inProgress: newInProgress };
        }
        return loc;
      });
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      
      const statusText = 
        newStatus === 'blacklist' ? '🚫 דלג תמיד' : 
        newStatus === 'review' ? '🛠️ בבדיקה' : 
        '✅ כלול';
      showToast(`${location.name}: ${statusText}`, 'success');
    }
  };
  
  // Handle edit location - populate form with existing data
  const handleEditLocation = (loc) => {
    setEditingLocation(loc);
    const editFormData = {
      name: loc.name || '',
      description: loc.description || '',
      notes: loc.notes || '',
      area: loc.area || (loc.areas ? loc.areas[0] : formData.area),
      areas: loc.areas || (loc.area ? [loc.area] : [formData.area]),
      interests: loc.interests || [],
      lat: loc.lat || null,
      lng: loc.lng || null,
      mapsUrl: loc.mapsUrl || '',
      address: loc.address || '',
      uploadedImage: loc.uploadedImage || null,
      imageUrls: loc.imageUrls || [],
      inProgress: !!loc.inProgress,
      locked: !!loc.locked
    };
    
    setNewLocation(editFormData);
    setGooglePlaceInfo(null);
    setLocationSearchResults(null);
    setShowEditLocationDialog(true);
  };
  
  // Add Google place to My Locations
  const addGooglePlaceToCustom = async (place) => {
    // Check if already exists (by name, case-insensitive)
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase().trim() === place.name.toLowerCase().trim()
    );
    
    if (exists) {
      showToast(`"${place.name}" כבר קיים ברשימה שלך`, 'warning');
      return false;
    }
    
    // Set adding state for dimmed button
    const placeId = place.id || place.name;
    setAddingPlaceIds(prev => [...prev, placeId]);
    
    const boundaryCheck = checkLocationInArea(place.lat, place.lng, formData.area);
    
    const locationToAdd = {
      id: Date.now(),
      name: place.name,
      description: place.description || 'נוסף מ-Google',
      notes: '',
      address: place.address || '',
      area: formData.area,
      areas: (() => { const d = window.BKK.getAreasForCoordinates(place.lat, place.lng); return d.length > 0 ? d : [formData.area]; })(),
      interests: place.interests || [],
      lat: place.lat,
      lng: place.lng,
      googlePlaceId: place.googlePlaceId || null,
      uploadedImage: null,
      imageUrls: [],
      outsideArea: !boundaryCheck.valid,
      duration: 45,
      custom: true,
      status: 'active',
      inProgress: false,
      addedAt: new Date().toISOString(),
      fromGoogle: true // Mark as added from Google
    };
    
    // Save to Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      try {
        await database.ref('customLocations').push(locationToAdd);
        addDebugLog('ADD', `Added "${place.name}" to Firebase`);
        showToast(`"${place.name}" נוסף לרשימה שלך!`, 'success');
        setAddingPlaceIds(prev => prev.filter(id => id !== placeId));
        return true;
      } catch (error) {
        console.error('[FIREBASE] Error adding Google place:', error);
        addDebugLog('ERROR', `Failed to add "${place.name}"`, error);
        showToast('שגיאה בשמירה', 'error');
        setAddingPlaceIds(prev => prev.filter(id => id !== placeId));
        return false;
      }
    } else {
      const updated = [...customLocations, locationToAdd];
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(`"${place.name}" נוסף לרשימה שלך!`, 'success');
      setAddingPlaceIds(prev => prev.filter(id => id !== placeId));
      return true;
    }
  };
  
  // Skip place permanently (add to blacklist)
  const skipPlacePermanently = (place) => {
    // Check if already exists
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase() === place.name.toLowerCase()
    );
    
    if (exists) {
      // Already exists - just update status to blacklist
      if (exists.status === 'blacklist') {
        showToast(`"${place.name}" כבר ברשימת דילוג`, 'warning');
        return;
      }
      
      // Update existing location to blacklist
      const locationId = exists.id;
      
      if (isFirebaseAvailable && database && exists.firebaseId) {
        database.ref(`customLocations/${exists.firebaseId}`).update({
          status: 'blacklist',
          inProgress: false
        })
          .then(() => {
            showToast(`"${place.name}" נוסף לדילוג קבוע`, 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error updating to blacklist:', error);
            showToast('שגיאה בעדכון', 'error');
          });
      } else {
        const updated = customLocations.map(loc => {
          if (loc.id === locationId) {
            return { ...loc, status: 'blacklist', inProgress: false };
          }
          return loc;
        });
        setCustomLocations(updated);
        localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
        showToast(`"${place.name}" נוסף לדילוג קבוע`, 'success');
      }
      return;
    }
    
    // Doesn't exist - create new with blacklist status
    const boundaryCheck = checkLocationInArea(place.lat, place.lng, formData.area);
    
    // IMPORTANT: Copy interests from the place - blacklist needs same validation as active
    const locationToAdd = {
      id: Date.now(),
      name: place.name,
      description: place.description || 'נוסף מחיפוש',
      notes: '',
      area: formData.area,
      areas: (() => { const d = window.BKK.getAreasForCoordinates(place.lat, place.lng); return d.length > 0 ? d : [formData.area]; })(),
      interests: place.interests && place.interests.length > 0 ? place.interests : [],
      lat: place.lat,
      lng: place.lng,
      uploadedImage: null,
      imageUrls: [],
      outsideArea: !boundaryCheck.valid,
      duration: 45,
      custom: true,
      status: 'blacklist', // Start as blacklisted!
      inProgress: false,
      addedAt: new Date().toISOString(),
      fromGoogle: true
    };
    
    // Save to Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      database.ref('customLocations').push(locationToAdd)
        .then(() => {
          console.log('[FIREBASE] Place added to blacklist');
          showToast(`"${place.name}" נוסף לדילוג קבוע`, 'success');
        })
        .catch((error) => {
          console.error('[FIREBASE] Error adding to blacklist:', error);
          showToast('שגיאה בשמירה', 'error');
        });
    } else {
      const updated = [...customLocations, locationToAdd];
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(`"${place.name}" נוסף לדילוג קבוע`, 'success');
    }
  };
  
  // Import function - add new only, skip existing
  const handleImportMerge = async () => {
    let addedInterests = 0;
    let skippedInterests = 0;
    let addedLocations = 0;
    let skippedLocations = 0;
    let addedRoutes = 0;
    let skippedRoutes = 0;
    let updatedConfigs = 0;
    let updatedStatuses = 0;
    
    // Helper to check if interest exists by label (not id)
    const interestExistsByLabel = (label) => {
      return customInterests.find(i => (i.label || i.name || '').toLowerCase() === label.toLowerCase());
    };
    
    // Helper to check if location exists by name (not id)
    const locationExistsByName = (name) => {
      return customLocations.find(l => l.name.toLowerCase() === name.toLowerCase());
    };
    
    // Import to Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      
      // 1. Import custom interests
      for (const interest of (importedData.customInterests || [])) {
        const label = interest.label || interest.name;
        if (!label) continue;
        
        const exists = interestExistsByLabel(label);
        if (exists) {
          skippedInterests++;
          continue;
        }
        
        try {
          const interestId = interest.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          const newInterest = {
            id: interestId,
            label: label,
            name: label,
            icon: interest.icon || '📍',
            inProgress: !!interest.inProgress,
            locked: !!interest.locked
          };
          await database.ref(`customInterests/${interestId}`).set(newInterest);
          addedInterests++;
        } catch (error) {
          console.error('[FIREBASE] Error importing interest:', error);
        }
      }
      
      // 2. Import interest configurations (search settings)
      if (importedData.interestConfig) {
        for (const [interestId, config] of Object.entries(importedData.interestConfig)) {
          try {
            await database.ref(`settings/interestConfig/${interestId}`).set(config);
            updatedConfigs++;
          } catch (error) {
            console.error('[FIREBASE] Error importing config:', error);
          }
        }
      }
      
      // 3. Import interest statuses (active/inactive)
      if (importedData.interestStatus) {
        for (const [interestId, status] of Object.entries(importedData.interestStatus)) {
          try {
            await database.ref(`settings/interestStatus/${interestId}`).set(status);
            updatedStatuses++;
          } catch (error) {
            console.error('[FIREBASE] Error importing status:', error);
          }
        }
      }
      
      // 4. Import locations
      for (const loc of (importedData.customLocations || [])) {
        if (!loc.name) continue;
        
        const exists = locationExistsByName(loc.name);
        if (exists) {
          skippedLocations++;
          continue;
        }
        
        try {
          const newLocation = {
            id: loc.id || Date.now() + Math.floor(Math.random() * 1000),
            name: loc.name.trim(),
            description: loc.description || loc.notes || '',
            notes: loc.notes || '',
            area: loc.area || (loc.areas ? loc.areas[0] : 'sukhumvit'),
            areas: window.BKK.normalizeLocationAreas(loc),
            interests: Array.isArray(loc.interests) ? loc.interests : [],
            lat: loc.lat || null,
            lng: loc.lng || null,
            mapsUrl: loc.mapsUrl || '',
            address: loc.address || '',
            uploadedImage: loc.uploadedImage || null,
            imageUrls: Array.isArray(loc.imageUrls) ? loc.imageUrls : [],
            outsideArea: loc.outsideArea || false,
            missingCoordinates: !loc.lat || !loc.lng,
            duration: loc.duration || 45,
            custom: true,
            status: loc.status || 'active',
            inProgress: !!loc.inProgress,
            locked: !!loc.locked,
            rating: loc.rating || null,
            ratingCount: loc.ratingCount || null,
            fromGoogle: loc.fromGoogle || false,
            addedAt: loc.addedAt || new Date().toISOString()
          };
          
          await database.ref('customLocations').push(newLocation);
          addedLocations++;
        } catch (error) {
          console.error('[FIREBASE] Error importing location:', error);
        }
      }
      
      // 5. Import saved routes (to Firebase)
      for (const route of (importedData.savedRoutes || [])) {
        if (!route.name) continue;
        
        const exists = savedRoutes.find(r => r.name.toLowerCase() === route.name.toLowerCase());
        if (exists) {
          skippedRoutes++;
          continue;
        }
        
        try {
          const routeToSave = stripRouteForStorage({
            ...route,
            id: route.id || Date.now() + Math.floor(Math.random() * 1000),
            importedAt: new Date().toISOString()
          });
          await database.ref('savedRoutes').push(routeToSave);
          addedRoutes++;
        } catch (error) {
          console.error('[FIREBASE] Error importing route:', error);
        }
      }
      
    } else {
      // STATIC MODE: localStorage (local)
      const newInterests = [...customInterests];
      const newLocations = [...customLocations];
      const newConfig = { ...interestConfig };
      const newStatus = { ...interestStatus };
      
      // 1. Import custom interests
      (importedData.customInterests || []).forEach(interest => {
        const label = interest.label || interest.name;
        if (!label) return;
        
        const exists = newInterests.find(i => (i.label || i.name || '').toLowerCase() === label.toLowerCase());
        if (exists) {
          skippedInterests++;
          return;
        }
        
        const interestId = interest.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        newInterests.push({
          id: interestId,
          label: label,
          name: label,
          icon: interest.icon || '📍',
          inProgress: !!interest.inProgress,
          locked: !!interest.locked
        });
        addedInterests++;
      });
      
      // 2. Import interest configurations
      if (importedData.interestConfig) {
        Object.entries(importedData.interestConfig).forEach(([id, config]) => {
          newConfig[id] = config;
          updatedConfigs++;
        });
      }
      
      // 3. Import interest statuses
      if (importedData.interestStatus) {
        Object.entries(importedData.interestStatus).forEach(([id, status]) => {
          newStatus[id] = status;
          updatedStatuses++;
        });
      }
      
      // 4. Import locations
      (importedData.customLocations || []).forEach(loc => {
        if (!loc.name) return;
        
        const exists = newLocations.find(l => l.name.toLowerCase() === loc.name.toLowerCase());
        if (exists) {
          skippedLocations++;
          return;
        }
        
        const newLocation = {
          id: loc.id || Date.now() + Math.floor(Math.random() * 1000),
          name: loc.name.trim(),
          description: loc.description || loc.notes || '',
          notes: loc.notes || '',
          area: loc.area || (loc.areas ? loc.areas[0] : 'sukhumvit'),
          areas: window.BKK.normalizeLocationAreas(loc),
          interests: Array.isArray(loc.interests) ? loc.interests : [],
          lat: loc.lat || null,
          lng: loc.lng || null,
          mapsUrl: loc.mapsUrl || '',
          address: loc.address || '',
          uploadedImage: loc.uploadedImage || null,
          imageUrls: Array.isArray(loc.imageUrls) ? loc.imageUrls : [],
          outsideArea: loc.outsideArea || false,
          missingCoordinates: !loc.lat || !loc.lng,
          duration: loc.duration || 45,
          custom: true,
          status: loc.status || 'active',
          inProgress: !!loc.inProgress,
          locked: !!loc.locked,
          rating: loc.rating || null,
          ratingCount: loc.ratingCount || null,
          fromGoogle: loc.fromGoogle || false,
          addedAt: loc.addedAt || new Date().toISOString()
        };
        
        newLocations.push(newLocation);
        addedLocations++;
      });
      
      // 5. Import saved routes
      const newRoutes = [...savedRoutes];
      (importedData.savedRoutes || []).forEach(route => {
        if (!route.name) return;
        
        const exists = newRoutes.find(r => r.name.toLowerCase() === route.name.toLowerCase());
        if (exists) {
          skippedRoutes++;
          return;
        }
        
        newRoutes.push({
          ...route,
          id: route.id || Date.now() + Math.floor(Math.random() * 1000),
          importedAt: new Date().toISOString()
        });
        addedRoutes++;
      });
      
      setCustomInterests(newInterests);
      setCustomLocations(newLocations);
      setSavedRoutes(newRoutes);
      setInterestConfig(newConfig);
      setInterestStatus(newStatus);
      
      localStorage.setItem('bangkok_custom_interests', JSON.stringify(newInterests));
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(newLocations));
      saveRoutesToStorage(newRoutes);
      localStorage.setItem('bangkok_interest_status', JSON.stringify(newStatus));
    }
    
    setShowImportDialog(false);
    setImportedData(null);
    
    // Build detailed report
    const report = [];
    if (addedInterests > 0 || skippedInterests > 0) {
      report.push(`תחומים: +${addedInterests}`);
    }
    if (updatedConfigs > 0) {
      report.push(`הגדרות: +${updatedConfigs}`);
    }
    if (addedLocations > 0 || skippedLocations > 0) {
      report.push(`מקומות: +${addedLocations}`);
    }
    if (addedRoutes > 0 || skippedRoutes > 0) {
      report.push(`מסלולים: +${addedRoutes}`);
    }
    
    const totalAdded = addedInterests + addedLocations + addedRoutes + updatedConfigs;
    showToast(report.join(' | ') || 'לא נמצאו פריטים לייבוא', totalAdded > 0 ? 'success' : 'warning');
  };

  const addCustomLocation = (closeAfter = true) => {
    if (!newLocation.name.trim() || newLocation.interests.length === 0) {
      return; // Just don't add if validation fails
    }
    
    // Check for duplicate name
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase().trim() === newLocation.name.toLowerCase().trim()
    );
    if (exists) {
      showToast(`"${newLocation.name}" כבר קיים ברשימה`, 'warning');
      return;
    }
    
    // Use provided coordinates (can be null)
    let lat = newLocation.lat;
    let lng = newLocation.lng;
    let outsideArea = false;
    let hasCoordinates = (lat !== null && lng !== null && lat !== 0 && lng !== 0);
    
    // Check if location is within area boundaries (only if has coordinates)
    if (hasCoordinates) {
      const selectedAreas = newLocation.areas || (newLocation.area ? [newLocation.area] : []);
      const inAnyArea = selectedAreas.some(aId => checkLocationInArea(lat, lng, aId).valid);
      outsideArea = !inAnyArea && selectedAreas.length > 0;
      
      if (outsideArea) {
        const areaNames = selectedAreas.map(aId => areaOptions.find(a => a.id === aId)?.label || aId).join(', ');
        showToast(
          `אזהרה: המיקום מחוץ לאזורים שנבחרו (${areaNames}). נשמר בכל זאת.`,
          'warning'
        );
      }
    }
    
    const newId = Date.now();
    const locationToAdd = {
      id: newId,
      name: newLocation.name.trim(),
      description: newLocation.description.trim() || newLocation.notes?.trim() || 'מקום שהוספתי',
      notes: newLocation.notes?.trim() || '',
      area: (newLocation.areas || [newLocation.area])[0] || 'sukhumvit',
      areas: newLocation.areas || (newLocation.area ? [newLocation.area] : ['sukhumvit']),
      interests: newLocation.interests,
      lat: lat,
      lng: lng,
      mapsUrl: newLocation.mapsUrl || '',
      address: newLocation.address || '',
      uploadedImage: newLocation.uploadedImage || null,
      imageUrls: newLocation.imageUrls || [],
      outsideArea: outsideArea, // Flag for outside area
      missingCoordinates: !hasCoordinates, // Flag for missing coordinates
      duration: 45,
      custom: true,
      status: 'active',
      inProgress: newLocation.inProgress || false,
      locked: newLocation.locked || false,
      addedAt: new Date().toISOString()
    };
    
    // Save to Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      database.ref('customLocations').push(locationToAdd)
        .then((ref) => {
          console.log('[FIREBASE] Location added to shared database');
          showToast('המקום נוסף ונשמר לכולם!', 'success');
          
          // If staying open, switch to edit mode
          if (!closeAfter) {
            const addedWithFirebaseId = { ...locationToAdd, firebaseId: ref.key };
            setEditingLocation(addedWithFirebaseId);
            setShowAddLocationDialog(false);
            setShowEditLocationDialog(true);
          }
        })
        .catch((error) => {
          console.error('[FIREBASE] Error adding location:', error);
          showToast('שגיאה בשמירה', 'error');
        });
    } else {
      // STATIC MODE: localStorage (local)
      const updated = [...customLocations, locationToAdd];
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast('המקום נוסף!', 'success');
      
      // If staying open, switch to edit mode
      if (!closeAfter) {
        setEditingLocation(locationToAdd);
        setShowAddLocationDialog(false);
        setShowEditLocationDialog(true);
      }
    }
    
    // Add to current route if exists (only if has coordinates)
    if (route && hasCoordinates) {
      const updatedRoute = {
        ...route,
        stops: [...route.stops, locationToAdd]
      };
      setRoute(updatedRoute);
    }
    
    if (closeAfter) {
      setShowAddLocationDialog(false);
      setNewLocation({ 
        name: '', 
        description: '', 
        notes: '',
        area: formData.area, 
        areas: [formData.area],
        interests: [], 
        lat: null, 
        lng: null, 
        mapsUrl: '',
        address: '',
        uploadedImage: null,
        imageUrls: []
      });
    }
  };
  
  // Update existing location
  const updateCustomLocation = (closeAfter = true) => {
    if (!newLocation.name?.trim()) {
      showToast('אנא הזן שם למקום', 'warning');
      return;
    }
    
    // Check for duplicate name (exclude current location)
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase().trim() === newLocation.name.toLowerCase().trim() &&
      loc.id !== editingLocation.id
    );
    if (exists) {
      showToast(`"${newLocation.name}" כבר קיים ברשימה`, 'warning');
      return;
    }
    
    // Check if anything actually changed (normalize null/undefined)
    const hasChanges = (() => {
      const e = editingLocation;
      const n = newLocation;
      const s = (v) => (v || '').toString().trim(); // normalize strings
      const nn = (v) => v ?? null; // normalize null/undefined
      if (s(n.name) !== s(e.name)) return true;
      if (s(n.description) !== s(e.description)) return true;
      if (s(n.notes) !== s(e.notes)) return true;
      if (JSON.stringify(n.areas || []) !== JSON.stringify(e.areas || (e.area ? [e.area] : []))) return true;
      if (JSON.stringify(n.interests || []) !== JSON.stringify(e.interests || [])) return true;
      if (nn(n.lat) !== nn(e.lat) || nn(n.lng) !== nn(e.lng)) return true;
      if (s(n.mapsUrl) !== s(e.mapsUrl)) return true;
      if (s(n.address) !== s(e.address)) return true;
      if (!!n.inProgress !== !!e.inProgress) return true;
      if (!!n.locked !== !!e.locked) return true;
      if (nn(n.uploadedImage) !== nn(e.uploadedImage)) return true;
      return false;
    })();
    
    if (!hasChanges) {
      if (closeAfter) {
        setShowEditLocationDialog(false);
        setEditingLocation(null);
      }
      return; // No toast, no save
    }
    
    // Use provided coordinates (can be null)
    let hasCoordinates = (newLocation.lat !== null && newLocation.lng !== null && 
                          newLocation.lat !== 0 && newLocation.lng !== 0);
    let outsideArea = false;
    
    // Check if location is within area boundaries (only if has coordinates)
    if (hasCoordinates) {
      const selectedAreas = newLocation.areas || (newLocation.area ? [newLocation.area] : []);
      const inAnyArea = selectedAreas.some(aId => checkLocationInArea(newLocation.lat, newLocation.lng, aId).valid);
      outsideArea = !inAnyArea && selectedAreas.length > 0;
      
      if (outsideArea) {
        const areaNames = selectedAreas.map(aId => areaOptions.find(a => a.id === aId)?.label || aId).join(', ');
        showToast(
          `אזהרה: המיקום מחוץ לאזורים שנבחרו (${areaNames}). נשמר בכל זאת.`,
          'warning'
        );
      }
    }
    
    const updatedLocation = { 
      ...editingLocation, // Keep existing fields like status, inProgress
      ...newLocation, // Override with edited fields
      area: (newLocation.areas || [newLocation.area])[0] || editingLocation.area || 'sukhumvit',
      areas: newLocation.areas || (newLocation.area ? [newLocation.area] : editingLocation.areas || ['sukhumvit']),
      custom: true, 
      id: editingLocation.id,
      outsideArea: outsideArea, // Flag for outside area
      missingCoordinates: !hasCoordinates // Flag for missing coordinates
    };
    
    // Update in Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      const { firebaseId, ...locationData } = updatedLocation;
      
      if (firebaseId) {
        database.ref(`customLocations/${firebaseId}`).set(locationData)
          .then(() => {
            console.log('[FIREBASE] Location updated in shared database');
            showToast('המקום עודכן!', 'success');
            // Update editingLocation with latest data
            if (!closeAfter) {
              setEditingLocation({ ...updatedLocation, firebaseId });
            }
          })
          .catch((error) => {
            console.error('[FIREBASE] Error updating location:', error);
            showToast('שגיאה בעדכון', 'error');
          });
      }
    } else {
      // STATIC MODE: localStorage (local)
      const updated = customLocations.map(loc => 
        loc.id === editingLocation.id ? updatedLocation : loc
      );
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast('המקום עודכן!', 'success');
      // Update editingLocation with latest data
      if (!closeAfter) {
        setEditingLocation(updatedLocation);
      }
    }
    
    if (closeAfter) {
      setShowEditLocationDialog(false);
      setEditingLocation(null);
      setNewLocation({ 
        name: '', 
        description: '', 
        notes: '',
        area: formData.area, 
        areas: [formData.area],
        interests: [], 
        lat: null, 
        lng: null, 
        mapsUrl: '',
        address: '',
        uploadedImage: null,
        imageUrls: []
      });
    }
  };

  // Get current location from GPS
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('הדפדפן שלך לא תומך במיקום GPS', 'error');
      return;
    }
    
    showToast('מחפש מיקום...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // First update with coordinates
        setNewLocation(prev => ({
          ...prev,
          lat: lat,
          lng: lng,
          mapsUrl: `https://maps.google.com/?q=${lat},${lng}`
        }));
        
        showToast(`מיקום נקלט: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 'success');
        
        // Then try to get address (reverse geocode)
        try {
          const address = await reverseGeocode(lat, lng);
          if (address) {
            setNewLocation(prev => ({
              ...prev,
              address: address
            }));
          }
        } catch (err) {
          console.log('[GPS] Reverse geocode failed (ok):', err);
        }
      },
      (error) => {
        let errorMessage = 'לא הצלחתי לקבל את המיקום.';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'נדרשת הרשאה למיקום. אנא אפשר גישה במיקום בהגדרות הדפדפן.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'המיקום לא זמין כרגע. נסה שוב.';
            break;
          case error.TIMEOUT:
            errorMessage = 'תם הזמן לקבלת המיקום. נסה שוב.';
            break;
        }
        
        showToast(`${errorMessage}`, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Parse Google Maps URL to extract coordinates
  const parseMapsUrl = (url) => {
    if (!url || !url.trim()) {
      setNewLocation({ ...newLocation, lat: null, lng: null, mapsUrl: '' });
      return;
    }

    // Try different Google Maps URL formats
    let lat = null, lng = null;
    
    // Format 1: https://maps.google.com/?q=13.7465,100.4927
    let match = url.match(/[?&]q=([-\d.]+),([-\d.]+)/);
    if (match) {
      lat = parseFloat(match[1]);
      lng = parseFloat(match[2]);
    }
    
    // Format 2: https://www.google.com/maps/@13.7465,100.4927,17z
    if (!match) {
      match = url.match(/@([-\d.]+),([-\d.]+)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }
    
    // Format 3: https://maps.google.com/maps?q=...&ll=13.7465,100.4927
    if (!match) {
      match = url.match(/[?&]ll=([-\d.]+),([-\d.]+)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }
    
    // Format 4: https://goo.gl/maps/... or https://maps.app.goo.gl/...
    // These shortened URLs need to be opened first, so just inform user
    if (!match && (url.includes('goo.gl') || url.includes('maps.app'))) {
      showToast('קישורים מקוצרים: פתח בדפדפן והעתק את הקישור המלא', 'warning');
      setNewLocation({ ...newLocation, mapsUrl: url });
      return;
    }
    
    // Format 5: Just coordinates: 13.7465,100.4927 or 13.7465, 100.4927
    if (!match) {
      match = url.match(/^([-\d.]+)\s*,\s*([-\d.]+)$/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }
    
    if (lat !== null && lng !== null) {
      setNewLocation({ ...newLocation, lat, lng, mapsUrl: url });
      showToast(`קואורדינטות נקלטו: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 'success');
    } else {
      showToast('לא זיהיתי קואורדינטות. נסה קישור Google Maps או: 13.7465,100.4927', 'error');
      setNewLocation({ ...newLocation, mapsUrl: url });
    }
  };

  // Search address using Google Places API (instead of Geocoding)
  const geocodeAddress = async (address) => {
    if (!address || !address.trim()) {
      showToast('אנא הזן כתובת', 'warning');
      return;
    }

    try {
      showToast('מחפש כתובת...', 'info');
      
      // Add city name if not already included
      const cityName = window.BKK.cityNameForSearch || 'Bangkok';
      const countryName = window.BKK.selectedCity?.country || '';
      const searchQuery = address.toLowerCase().includes(cityName.toLowerCase()) 
        ? address 
        : `${address}, ${cityName}${countryName ? ', ' + countryName : ''}`;
      
      // Use Google Places API Text Search
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress'
          },
          body: JSON.stringify({
            textQuery: searchQuery,
            maxResultCount: 1
          })
        }
      );
      
      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        const location = place.location;
        const formattedAddress = place.formattedAddress || place.displayName?.text || searchQuery;
        
        setNewLocation({
          ...newLocation,
          lat: location.latitude,
          lng: location.longitude,
          address: formattedAddress,
          googlePlaceId: place.id || null,
          mapsUrl: `https://maps.google.com/?q=${location.latitude},${location.longitude}`
        });
        
        showToast(`נמצא! ${formattedAddress}`, 'success');
      } else {
        showToast('לא נמצאה כתובת. נסה כתובת אחרת', 'error');
      }
    } catch (error) {
      console.error('[GEOCODING] Error:', error);
      showToast('שגיאה בחיפוש הכתובת. נסה באמצעות קישור Google Maps', 'error');
    }
  };

  // Search places by name - returns multiple results for picking
  const searchPlacesByName = async (query) => {
    if (!query || !query.trim()) return;
    try {
      setLocationSearchResults([]); // show loading state
      const cityForSearch = window.BKK.cityNameForSearch || 'Bangkok';
      const countryForSearch = window.BKK.selectedCity?.country || '';
      const searchQuery = query.toLowerCase().includes(cityForSearch.toLowerCase()) ? query : `${query}, ${cityForSearch}${countryForSearch ? ', ' + countryForSearch : ''}`;
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress,places.rating,places.userRatingCount'
        },
        body: JSON.stringify({ textQuery: searchQuery, maxResultCount: 5 })
      });
      const data = await response.json();
      if (data.places && data.places.length > 0) {
        setLocationSearchResults(data.places.map(p => ({
          name: p.displayName?.text || '',
          lat: p.location?.latitude,
          lng: p.location?.longitude,
          address: p.formattedAddress || '',
          rating: p.rating,
          ratingCount: p.userRatingCount,
          googlePlaceId: p.id
        })));
      } else {
        setLocationSearchResults([]);
        showToast('לא נמצאו תוצאות', 'warning');
      }
    } catch (err) {
      console.error('[SEARCH] Error:', err);
      showToast('שגיאה בחיפוש', 'error');
      setLocationSearchResults(null);
    }
  };

  // Search coordinates by place name
  const geocodeByName = async (name) => {
    if (!name || !name.trim()) {
      showToast('אנא הזן שם מקום', 'warning');
      return;
    }

    try {
      showToast('מחפש לפי שם...', 'info');
      
      // Add city name for better results
      const cityForSearch = window.BKK.cityNameForSearch || 'Bangkok';
      const countryForSearch = window.BKK.selectedCity?.country || '';
      const searchQuery = name.toLowerCase().includes(cityForSearch.toLowerCase()) 
        ? name 
        : `${name}, ${cityForSearch}${countryForSearch ? ', ' + countryForSearch : ''}`;
      
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress'
          },
          body: JSON.stringify({
            textQuery: searchQuery,
            maxResultCount: 1
          })
        }
      );
      
      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        const location = place.location;
        const formattedAddress = place.formattedAddress || '';
        
        setNewLocation({
          ...newLocation,
          lat: location.latitude,
          lng: location.longitude,
          address: formattedAddress,
          googlePlaceId: place.id || null,
          mapsUrl: `https://maps.google.com/?q=${location.latitude},${location.longitude}`
        });
        
        showToast(`נמצא: ${place.displayName?.text || name}`, 'success');
      } else {
        showToast('לא נמצא מקום. נסה שם אחר או כתובת', 'error');
      }
    } catch (error) {
      console.error('[GEOCODE BY NAME] Error:', error);
      showToast('שגיאה בחיפוש', 'error');
    }
  };

  // Reverse geocode: get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.formattedAddress'
          },
          body: JSON.stringify({
            textQuery: `${lat},${lng}`,
            maxResultCount: 1
          })
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

  const toggleStopActive = (stopIndex) => {
    const stopName = route.stops[stopIndex]?.name?.toLowerCase().trim();
    if (!stopName) return;
    const newDisabledStops = disabledStops.includes(stopName)
      ? disabledStops.filter(n => n !== stopName)
      : [...disabledStops, stopName];
    
    setDisabledStops(newDisabledStops);
    
    // Regenerate map URL with only active stops
    const activeStops = route.stops.filter(s => 
      !newDisabledStops.includes(s.name?.toLowerCase().trim())
    );
    
    let waypoints = activeStops.map(s => `${s.lat},${s.lng}`);
    
    if (route.preferences.circular && activeStops.length > 1) {
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
    
    setRoute({...route, mapUrl});
  };

