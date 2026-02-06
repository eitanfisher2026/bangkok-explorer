  // Load saved preferences
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('bangkok_preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        // Add maxStops if not present (for backward compatibility)
        if (!prefs.maxStops) prefs.maxStops = 10;
        // Add fetchMoreCount if not present
        if (!prefs.fetchMoreCount) prefs.fetchMoreCount = 5;
        return prefs;
      }
    } catch (e) {}
    return {
      hours: 3,
      area: 'sukhumvit',
      interests: [],
      circular: true,
      startPoint: '',
      maxStops: 10,
      fetchMoreCount: 5
    };
  };

  const [currentView, setCurrentView] = useState('form');
  const [formData, setFormData] = useState(loadPreferences());
  const [route, setRoute] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [disabledStops, setDisabledStops] = useState([]); // Track disabled stop IDs
  const [routeType, setRouteType] = useState(() => {
    // Load from localStorage or default to 'circular'
    const saved = localStorage.getItem('bangkok_route_type');
    return saved || 'circular';
  }); // 'circular' or 'linear'
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [routeName, setRouteName] = useState('');
  const [routeNotes, setRouteNotes] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customLocations, setCustomLocations] = useState([]);
  const [showAddLocationDialog, setShowAddLocationDialog] = useState(false);
  const [showBlacklistLocations, setShowBlacklistLocations] = useState(false); // NEW: collapsed by default
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    notes: '',
    area: formData.area,
    interests: [],
    lat: null,
    lng: null,
    mapsUrl: '',
    address: '',  // Address for geocoding
    uploadedImage: null,  // Base64 image data
    imageUrls: []  // Array of URL strings
  });
  const [customInterests, setCustomInterests] = useState([]);
  const [showAddInterestDialog, setShowAddInterestDialog] = useState(false);
  const [newInterest, setNewInterest] = useState({ label: '', icon: '📍', baseCategory: '' });
  const [showEditLocationDialog, setShowEditLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingPlaceIds, setAddingPlaceIds] = useState([]); // Track places being added
  const [showLocationDetailModal, setShowLocationDetailModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedData, setImportedData] = useState(null);
  
  // Access Log System (Admin Only)
  const [accessLogs, setAccessLogs] = useState([]);
  const [hasNewEntries, setHasNewEntries] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(() => {
    return localStorage.getItem('bangkok_is_admin') === 'true';
  });
  const [showAccessLog, setShowAccessLog] = useState(false);

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
  const [debugLogs, setDebugLogs] = useState([]);
  const [debugPanelOpen, setDebugPanelOpen] = useState(true);
  
  // Add debug log entry
  const addDebugLog = (category, message, data = null) => {
    if (!debugMode) return;
    const timestamp = new Date().toLocaleTimeString('he-IL');
    const entry = { timestamp, category, message, data };
    setDebugLogs(prev => [...prev.slice(-100), entry]); // Keep last 100 entries
    console.log(`[${category}] ${message}`, data || '');
  };
  
  // Save debug mode preference
  useEffect(() => {
    localStorage.setItem('bangkok_debug_mode', debugMode.toString());
  }, [debugMode]);
  
  // Help content - loaded from js/config.js
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
    // Longer messages get more time (min 1.5s, max 4s)
    const duration = Math.min(4000, Math.max(1500, message.length * 50));
    setTimeout(() => setToastMessage(null), duration);
  };

  // Load saved routes from localStorage (still local)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bangkok_saved_routes');
      if (saved) {
        setSavedRoutes(JSON.parse(saved));
      }
    } catch (e) {
      // Silent fail
    }
  }, []);

  // Load custom locations from Firebase
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
    }
  }, []);

  // Load custom interests from Firebase
  useEffect(() => {
    if (isFirebaseAvailable && database) {
      const interestsRef = database.ref('customInterests');
      
      const unsubscribe = interestsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const interestsArray = Object.keys(data).map(key => ({
            ...data[key],
            firebaseId: key
          }));
          setCustomInterests(interestsArray);
          console.log('[FIREBASE] Loaded', interestsArray.length, 'interests');
        } else {
          setCustomInterests([]);
        }
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
    }
  }, []);

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
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('bangkok_user_id', userId);
    }
    
    console.log('[ACCESS LOG] User ID:', userId);
    
    // Admin detection: support MULTIPLE admin devices
    // Firebase stores: settings/adminId (primary) + settings/adminDevices/{userId} = true
    database.ref('settings/adminId').once('value')
      .then(async (snapshot) => {
        let adminId = snapshot.val();
        
        if (!adminId) {
          // First user ever - this user becomes admin
          adminId = userId;
          await database.ref('settings/adminId').set(adminId);
          await database.ref(`settings/adminDevices/${userId}`).set(true);
          console.log('[ACCESS LOG] You are the FIRST admin! ID:', adminId);
          showToast('אתה ה-Admin הראשון!', 'success');
        }
        
        // Check if this device is registered as admin
        let isAdmin = (userId === adminId);
        
        if (!isAdmin) {
          // Check adminDevices list (for additional devices)
          const deviceSnapshot = await database.ref(`settings/adminDevices/${userId}`).once('value');
          isAdmin = deviceSnapshot.val() === true;
        }
        
        console.log('[ACCESS LOG] Admin:', adminId, 'Is Admin:', isAdmin);
        
        // Update admin state for UI + cache in localStorage
        setIsCurrentUserAdmin(isAdmin);
        localStorage.setItem('bangkok_is_admin', isAdmin ? 'true' : 'false');
        
        // Log access (skip admin)
        if (!isAdmin) {
          // THROTTLE: Don't log same userId more than once per hour
          const lastLogTime = parseInt(localStorage.getItem('bangkok_last_log_time') || '0');
          const oneHour = 60 * 60 * 1000;
          
          if (Date.now() - lastLogTime < oneHour) {
            console.log('[ACCESS LOG] Throttled - already logged within last hour');
          } else {
            localStorage.setItem('bangkok_last_log_time', Date.now().toString());
            
            const { browser, os } = window.BKK.parseUserAgent(navigator.userAgent);
            
            const accessEntry = {
              userId, timestamp: Date.now(), date: new Date().toISOString(),
              userAgent: navigator.userAgent.substring(0, 100),
              browser, os,
              screenSize: `${screen.width}x${screen.height}`,
              language: navigator.language || 'unknown',
              country: '', city: '', region: ''
            };
            
            const entryRef = database.ref('accessLog').push();
            entryRef.set(accessEntry)
              .then(() => {
                console.log('[ACCESS LOG] Visit logged');
                // Fetch geo data async
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
            console.log('[ACCESS LOG] Snapshot:', data ? Object.keys(data).length + ' entries' : 'EMPTY');
            if (data) {
              const logsArray = Object.keys(data).map(key => ({
                ...data[key], id: key
              })).sort((a, b) => b.timestamp - a.timestamp);
              
              setAccessLogs(logsArray);
              
              const hasNew = logsArray.some(log => log.timestamp > lastSeen);
              if (hasNew && lastSeen > 0) {
                setHasNewEntries(true);
                showToast('יש כניסות חדשות!', 'info');
              }
            } else {
              setAccessLogs([]);
            }
          });
          
          return () => logRef.off('value', unsubscribe);
        }
      })
      .catch(err => console.error('[ACCESS LOG] Error reading admin:', err));
  }, []);
  
  // Mark logs as seen
  const markLogsAsSeen = () => {
    const latest = accessLogs.length > 0 ? accessLogs[0].timestamp : Date.now();
    localStorage.setItem('bangkok_last_seen', latest.toString());
    setHasNewEntries(false);
  };

  // Config - loaded from js/config.js
  const interestOptions = window.BKK.interestOptions;

  const interestToGooglePlaces = window.BKK.interestToGooglePlaces;

  const uncoveredInterests = window.BKK.uncoveredInterests;

  const interestTooltips = window.BKK.interestTooltips;

  const areaCoordinates = window.BKK.areaCoordinates;
  
  // Utility functions - loaded from js/utils.js
  const checkLocationInArea = window.BKK.checkLocationInArea;
  const getButtonStyle = window.BKK.getButtonStyle;

  // Fetch places from Google Places API

  // === APP LOGIC (from app-logic.js) ===
  const fetchGooglePlaces = async (area, interests) => {
    const center = areaCoordinates[area];
    if (!center) {
      addDebugLog('API', `No coordinates for area: ${area}`);
      console.error('[DYNAMIC] No coordinates for area:', area);
      return [];
    }

    try {
      // Get all relevant place types
      const placeTypes = [...new Set(
        interests.flatMap(interest => {
          const customInterest = customInterests.find(ci => ci.id === interest);
          const baseInterest = customInterest?.baseCategory || interest;
          return interestToGooglePlaces[baseInterest] || ['point_of_interest'];
        })
      )];

      addDebugLog('API', `Fetching Google Places`, { area, interests, placeTypes: placeTypes.slice(0, 10), center });
      console.log('[DYNAMIC] Fetching from Google Places API:', { area, interests });

      const response = await fetch(GOOGLE_PLACES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types'
        },
        body: JSON.stringify({
          includedTypes: placeTypes.slice(0, 10), // API limit
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: center.lat,
                longitude: center.lng
              },
              radius: 2000 // 2km radius
            }
          },
          rankPreference: 'POPULARITY'
        })
      });

      console.log('[DYNAMIC] Google Places Response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DYNAMIC] Error fetching Google Places:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          area,
          interests,
          placeTypes
        });
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

      // Filter and transform Google Places data
      let filteredCount = 0;
      let ratingFilteredCount = 0;
      let typeFilteredCount = 0;
      
      const transformed = data.places
        .filter(place => {
          // Filter 1: Rating check
          if (place.rating < 4.0) {
            ratingFilteredCount++;
            return false;
          }
          
          // Filter 2: Type validation - CRITICAL!
          // Only include places that have at least one of the types we requested
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
          
          console.log('[DYNAMIC] ✅ Kept:', {
            name: place.displayName?.text,
            matchingTypes: placeTypesFromGoogle.filter(t => placeTypes.includes(t))
          });
          
          return true;
        })
        .map((place, index) => ({
          name: place.displayName?.text || 'Unknown Place',
          lat: place.location?.latitude || center.lat,
          lng: place.location?.longitude || center.lng,
          description: `⭐ ${place.rating?.toFixed(1) || 'N/A'} (${place.userRatingCount || 0} ביקורות)`,
          duration: 45,
          googlePlace: true,
          rating: place.rating || 0,
          ratingCount: place.userRatingCount || 0,
          interests: interests  // Add interests field
        }));
      
      console.log('[DYNAMIC] Filtering summary:', {
        received: data.places.length,
        ratingFiltered: ratingFilteredCount,
        typeFiltered: typeFilteredCount,
        final: transformed.length
      });
      
      addDebugLog('API', `Got ${transformed.length} results (filtered ${ratingFilteredCount} by rating, ${typeFilteredCount} by type)`, {
        names: transformed.slice(0, 5).map(p => p.name)
      });
      
      return transformed;
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

  // Combine default and custom interests - with safety check
  const allInterestOptions = [...interestOptions, ...(customInterests || [])];

  // Save preferences whenever they change
  useEffect(() => {
    localStorage.setItem('bangkok_preferences', JSON.stringify(formData));
  }, [formData]);

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

  const areaOptions = window.BKK.areaOptions;

  // Image handling - loaded from js/utils.js
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

  // Button styles - loaded from js/utils.js (via getButtonStyle reference above)

  const getStopsForInterests = () => {
    // Now we only collect CUSTOM locations - Google Places will be fetched in generateRoute
    
    // Filter custom locations that match current area and selected interests
    const matchingCustomLocations = customLocations.filter(loc => {
      // CRITICAL: Skip blacklisted locations!
      if (loc.status === 'blacklist') return false;
      
      if (loc.area !== formData.area) return false;
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

  const generateRoute = async () => {
    if (!formData.area || formData.interests.length === 0) {
      showToast('אנא בחר איזור ולפחות תחום עניין אחד', 'warning');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      addDebugLog('ROUTE', 'Starting route generation', { area: formData.area, interests: formData.interests, maxStops: formData.maxStops });
      console.log('[ROUTE] Starting route generation');
      
      // Get custom locations (always included)
      const customStops = getStopsForInterests();
      addDebugLog('ROUTE', `Found ${customStops.length} custom stops`);
      console.log('[ROUTE] Custom stops:', customStops.length);
      
      // Calculate stops needed per interest
      const numInterests = formData.interests.length || 1;
      const maxStops = formData.maxStops || 10;
      const stopsPerInterest = Math.ceil(maxStops / numInterests);
      
      // Track results per interest for smart completion
      const interestResults = {};
      const allStops = [...customStops]; // Start with custom stops (highest priority)
      let fetchErrors = [];
      
      // ROUND 1: Get places from Google Places API
      for (const interest of formData.interests) {
        // Check how many custom stops we already have for this interest
        const customStopsForInterest = customStops.filter(stop => 
          stop.interests && stop.interests.includes(interest)
        );
        
        const neededForInterest = Math.max(0, stopsPerInterest - customStopsForInterest.length);
        
        if (neededForInterest > 0) {
          let fetchedPlaces = [];
          
          try {
            console.log(`[ROUTE] Fetching for interest: ${interest}`);
            fetchedPlaces = await fetchGooglePlaces(formData.area, [interest]);
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
          
          // Filter blacklist BEFORE sorting
          fetchedPlaces = filterBlacklist(fetchedPlaces);
          
          // Sort by rating and take what we need (or all if less available)
          const sortedPlaces = fetchedPlaces
            .sort((a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1)))
            .slice(0, neededForInterest);
          
          // Track results
          interestResults[interest] = {
            requested: stopsPerInterest,
            custom: customStopsForInterest.length,
            fetched: sortedPlaces.length,
            total: customStopsForInterest.length + sortedPlaces.length,
            allPlaces: fetchedPlaces // Keep all for round 2
          };
          
          // Add to allStops
          allStops.push(...sortedPlaces);
        } else {
          // Already have enough from custom
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
            const morePlaces = result.allPlaces
              .sort((a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1)))
              .slice(alreadyUsed, alreadyUsed + canAddMore);
            
            additionalPlaces.push(...morePlaces);
          }
        }
        
        // Add additional places up to the missing amount
        const sorted = additionalPlaces
          .sort((a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1)))
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
      }
      
      // Show errors if any occurred
      if (fetchErrors.length > 0) {
        const errorMsg = fetchErrors.map(e => `${e.interest}: ${e.error}`).join(', ');
        
        console.error('[ROUTE] Data source errors:', fetchErrors);
        showToast(`שגיאות בקבלת מקומות: ${errorMsg}`, 'warning');
      }
      
      if (uniqueStops.length === 0) {
        showToast('לא נמצאו מקומות. נסה תחומי עניין או אזור אחר.', 'error');
        setIsGenerating(false);
        return;
      }

      const selectedArea = areaOptions.find(a => a.id === formData.area);
      
      // Generate default name: "Area - interests #number"
      const areaName = selectedArea?.label || 'בנקוק';
      const interestsText = formData.interests
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
        startPoint: formData.startPoint || 'התחלה מהמקום הראשון ברשימה',
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
        errors: fetchErrors.length > 0 ? fetchErrors : null
      };

      console.log('[ROUTE] Route created successfully:', {
        stops: newRoute.stops.length,
        stats: newRoute.stats,
        incomplete: newRoute.incomplete,
        errors: newRoute.errors
      });

      setRoute(newRoute);
      setRouteName(defaultName); // Set default name
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

  // NEW: Fetch more places for a specific interest
  const fetchMoreForInterest = async (interest) => {
    if (!route) return;
    
    setIsGenerating(true);
    
    try {
      const fetchCount = formData.fetchMoreCount || 5;
      console.log(`[FETCH_MORE] Fetching ${fetchCount} more for interest: ${interest}`);
      
      let newPlaces = await fetchGooglePlaces(formData.area, [interest]);
      
      // Filter blacklist
      newPlaces = filterBlacklist(newPlaces);
      
      // Filter duplicates (by name)
      const existingNames = route.stops.map(s => s.name.toLowerCase());
      newPlaces = newPlaces.filter(p => !existingNames.includes(p.name.toLowerCase()));
      
      // Take only what we need
      const placesToAdd = newPlaces.slice(0, fetchCount);
      
      if (placesToAdd.length === 0) {
        showToast(`לא נמצאו עוד מקומות ב${allInterestOptions.find(o => o.id === interest)?.label}`, 'warning');
        return;
      }
      
      // Update route
      const updatedRoute = {
        ...route,
        stops: [...route.stops, ...placesToAdd]
      };
      
      setRoute(updatedRoute);
      showToast(`נוספו ${placesToAdd.length} מקומות!`, 'success');
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('route-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('[FETCH_MORE] Error:', error);
      showToast('שגיאה בהוספת מקומות', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // NEW: Fetch more places for all interests
  const fetchMoreAll = async () => {
    if (!route) return;
    
    setIsGenerating(true);
    
    try {
      const fetchCount = formData.fetchMoreCount || 5;
      const perInterest = Math.ceil(fetchCount / formData.interests.length);
      
      console.log(`[FETCH_MORE_ALL] Fetching ${perInterest} per interest, total: ${fetchCount}`);
      
      const allNewPlaces = [];
      
      for (const interest of formData.interests) {
        let newPlaces = await fetchGooglePlaces(formData.area, [interest]);
        
        // Filter blacklist
        newPlaces = filterBlacklist(newPlaces);
        
        // Filter duplicates
        const existingNames = [...route.stops, ...allNewPlaces].map(s => s.name.toLowerCase());
        newPlaces = newPlaces.filter(p => !existingNames.includes(p.name.toLowerCase()));
        
        allNewPlaces.push(...newPlaces.slice(0, perInterest));
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
      showToast(`נוספו ${allNewPlaces.length} מקומות!`, 'success');
      
      // Scroll to results
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

  // NEW: Filter blacklisted places
  const filterBlacklist = (places) => {
    return places.filter(place => {
      const blacklisted = customLocations.find(loc => 
        loc.name.toLowerCase() === place.name.toLowerCase() && 
        loc.status === 'blacklist'
      );
      
      if (blacklisted) {
        console.log(`[BLACKLIST] Filtered out: ${place.name}`);
      }
      
      return !blacklisted;
    });
  };

  const saveRoute = () => {
    if (!routeName.trim()) {
      showToast('נא להזין שם למסלול', 'warning');
      return;
    }
    
    // Check for duplicate name
    const nameExists = savedRoutes.find(r => r.name.toLowerCase() === routeName.trim().toLowerCase());
    if (nameExists) {
      showToast('מסלול עם שם זה כבר קיים', 'error');
      return;
    }

    const routeToSave = {
      ...route,
      name: routeName.trim(),
      notes: routeNotes.trim() || '',
      savedAt: new Date().toISOString()
    };

    const updated = [routeToSave, ...savedRoutes];
    setSavedRoutes(updated);
    localStorage.setItem('bangkok_saved_routes', JSON.stringify(updated));
    
    setShowSaveDialog(false);
    setRouteName('');
    setRouteNotes('');
    setRoute(routeToSave); // Update route to show it's saved
    showToast('המסלול נשמר!', 'success');
  };

  const deleteRoute = (routeId) => {
    // Just delete without confirmation in sandbox
    const updated = savedRoutes.filter(r => r.id !== routeId);
    setSavedRoutes(updated);
    localStorage.setItem('bangkok_saved_routes', JSON.stringify(updated));
  };

  const loadSavedRoute = (savedRoute) => {
    setRoute(savedRoute);
    setFormData(savedRoute.preferences);
    setCurrentView('form'); // Go to form view to show places list
  };

  const addCustomInterest = () => {
    if (!newInterest.label.trim() || !newInterest.baseCategory) {
      return; // Require both label and baseCategory
    }
    
    const interestToAdd = {
      id: `custom_${Date.now()}`,
      label: newInterest.label.trim(),
      icon: newInterest.icon || '📍',
      baseCategory: newInterest.baseCategory, // Store the base category
      custom: true
    };
    
    // Save to Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      database.ref('customInterests').push(interestToAdd)
        .then(() => {
          console.log('[FIREBASE] Interest added to shared database');
          showToast('תחום העניין נוסף!', 'success');
        })
        .catch((error) => {
          console.error('[FIREBASE] Error adding interest:', error);
          showToast('שגיאה בשמירה', 'error');
        });
    } else {
      // STATIC MODE: localStorage (local)
      const updated = [...customInterests, interestToAdd];
      setCustomInterests(updated);
      localStorage.setItem('bangkok_custom_interests', JSON.stringify(updated));
      showToast('תחום העניין נוסף!', 'success');
    }
    
    // Reset and close dialog
    setNewInterest({ label: '', icon: '📍', baseCategory: '' });
    setShowAddInterestDialog(false);
  };

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
  
  // NEW: Toggle location status with review state
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
  
  // NEW: Handle edit location - populate form with existing data
  const handleEditLocation = (loc) => {
    console.log('[EDIT] ====== Opening edit ======');
    console.log('[EDIT] Location object:', JSON.stringify(loc, null, 2));
    console.log('[EDIT] Name:', loc.name);
    console.log('[EDIT] Description:', loc.description);
    console.log('[EDIT] Interests:', loc.interests);
    
    setEditingLocation(loc);
    const editFormData = {
      name: loc.name || '',
      description: loc.description || '',
      notes: loc.notes || '',
      area: loc.area || formData.area,
      interests: loc.interests || [],
      lat: loc.lat || null,
      lng: loc.lng || null,
      mapsUrl: loc.mapsUrl || '',
      address: loc.address || '',
      uploadedImage: loc.uploadedImage || null,
      imageUrls: loc.imageUrls || [],
      inProgress: loc.inProgress || false
    };
    
    console.log('[EDIT] Form data prepared:', JSON.stringify(editFormData, null, 2));
    setNewLocation(editFormData);
    console.log('[EDIT] newLocation state updated');
    setShowEditLocationDialog(true);
    console.log('[EDIT] Dialog opened');
  };
  
  // NEW: Add Google place to My Locations
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
      area: formData.area,
      interests: place.interests || [],
      lat: place.lat,
      lng: place.lng,
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
  
  // NEW: Skip place permanently (add to blacklist)
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
    
    // Helper to check if interest exists by label (not id)
    const interestExistsByLabel = (label) => {
      return customInterests.find(i => i.label.toLowerCase() === label.toLowerCase());
    };
    
    // Helper to check if location exists by name (not id)
    const locationExistsByName = (name) => {
      return customLocations.find(l => l.name.toLowerCase() === name.toLowerCase());
    };
    
    // Import to Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      
      // Import interests first
      for (const interest of (importedData.customInterests || [])) {
        if (!interest.label) continue;
        
        const exists = interestExistsByLabel(interest.label);
        if (exists) {
          skippedInterests++;
          continue;
        }
        
        try {
          const newInterest = {
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label: interest.label,
            icon: interest.icon || '📍',
            baseCategory: interest.baseCategory || 'other'
          };
          await database.ref('customInterests').push(newInterest);
          addedInterests++;
        } catch (error) {
          console.error('[FIREBASE] Error importing interest:', error);
        }
      }
      
      // Import locations
      for (const loc of (importedData.customLocations || [])) {
        if (!loc.name) continue;
        
        const exists = locationExistsByName(loc.name);
        if (exists) {
          skippedLocations++;
          continue;
        }
        
        try {
          // Create location with proper structure
          const newLocation = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            name: loc.name.trim(),
            description: loc.description || loc.notes || 'מקום מיובא',
            notes: loc.notes || '',
            area: loc.area || 'sukhumvit',
            interests: Array.isArray(loc.interests) ? loc.interests : ['other'],
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
            inProgress: false,
            addedAt: new Date().toISOString()
          };
          
          // Check if location has interests that don't exist - create them
          for (const interestId of newLocation.interests) {
            const baseInterests = ['temples', 'food', 'shopping', 'entertainment', 'nature', 'markets', 'massage', 'art', 'cafes', 'nightlife', 'historic', 'other'];
            if (!baseInterests.includes(interestId) && !interestExistsByLabel(interestId)) {
              // Create the interest
              const newInterest = {
                id: interestId,
                label: interestId,
                icon: '📍',
                baseCategory: 'other'
              };
              await database.ref('customInterests').push(newInterest);
            }
          }
          
          await database.ref('customLocations').push(newLocation);
          addedLocations++;
        } catch (error) {
          console.error('[FIREBASE] Error importing location:', error);
        }
      }
      
      // Import saved routes (always localStorage, not Firebase)
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
      
      setSavedRoutes(newRoutes);
      localStorage.setItem('bangkok_saved_routes', JSON.stringify(newRoutes));
    } else {
      // STATIC MODE: localStorage (local)
      const newInterests = [...customInterests];
      const newLocations = [...customLocations];
      
      // Import interests first
      (importedData.customInterests || []).forEach(interest => {
        if (!interest.label) return;
        
        const exists = newInterests.find(i => i.label.toLowerCase() === interest.label.toLowerCase());
        if (exists) {
          skippedInterests++;
          return;
        }
        
        newInterests.push({
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          label: interest.label,
          icon: interest.icon || '📍',
          baseCategory: interest.baseCategory || 'other'
        });
        addedInterests++;
      });
      
      // Import locations
      (importedData.customLocations || []).forEach(loc => {
        if (!loc.name) return;
        
        const exists = newLocations.find(l => l.name.toLowerCase() === loc.name.toLowerCase());
        if (exists) {
          skippedLocations++;
          return;
        }
        
        // Create location with proper structure
        const newLocation = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: loc.name.trim(),
          description: loc.description || loc.notes || 'מקום מיובא',
          notes: loc.notes || '',
          area: loc.area || 'sukhumvit',
          interests: Array.isArray(loc.interests) ? loc.interests : ['other'],
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
          inProgress: false,
          addedAt: new Date().toISOString()
        };
        
        // Check if location has interests that don't exist - create them
        const baseInterests = ['temples', 'food', 'shopping', 'entertainment', 'nature', 'markets', 'massage', 'art', 'cafes', 'nightlife', 'historic', 'other'];
        for (const interestId of newLocation.interests) {
          if (!baseInterests.includes(interestId) && !newInterests.find(i => i.id === interestId || i.label.toLowerCase() === interestId.toLowerCase())) {
            newInterests.push({
              id: interestId,
              label: interestId,
              icon: '📍',
              baseCategory: 'other'
            });
            addedInterests++;
          }
        }
        
        newLocations.push(newLocation);
        addedLocations++;
      });
      
      // Import saved routes
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
      localStorage.setItem('bangkok_custom_interests', JSON.stringify(newInterests));
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(newLocations));
      localStorage.setItem('bangkok_saved_routes', JSON.stringify(newRoutes));
    }
    
    setShowImportDialog(false);
    setImportedData(null);
    
    // Build detailed report
    const report = [];
    if (addedInterests > 0 || skippedInterests > 0) {
      report.push(`תחומים: ${addedInterests}+, ${skippedInterests} דולגו`);
    }
    if (addedLocations > 0 || skippedLocations > 0) {
      report.push(`מקומות: ${addedLocations}+, ${skippedLocations} דולגו`);
    }
    if (addedRoutes > 0 || skippedRoutes > 0) {
      report.push(`מסלולים: ${addedRoutes}+, ${skippedRoutes} דולגו`);
    }
    
    const totalAdded = addedInterests + addedLocations + addedRoutes;
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
      const boundaryCheck = checkLocationInArea(lat, lng, newLocation.area);
      const areaName = areaOptions.find(a => a.id === newLocation.area)?.label || newLocation.area;
      outsideArea = !boundaryCheck.valid;
      
      if (!boundaryCheck.valid) {
        showToast(
          `אזהרה: המיקום ${boundaryCheck.distanceKm} ק"מ מחוץ לאזור ${areaName}. נשמר בכל זאת.`,
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
      area: newLocation.area,
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
      status: 'active', // 'active', 'blacklist', or 'review'
      inProgress: false, // Show 🛠️ badge when true
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
    
    // Use provided coordinates (can be null)
    let hasCoordinates = (newLocation.lat !== null && newLocation.lng !== null && 
                          newLocation.lat !== 0 && newLocation.lng !== 0);
    let outsideArea = false;
    
    // Check if location is within area boundaries (only if has coordinates)
    if (hasCoordinates) {
      const boundaryCheck = checkLocationInArea(newLocation.lat, newLocation.lng, newLocation.area);
      const areaName = areaOptions.find(a => a.id === newLocation.area)?.label || newLocation.area;
      outsideArea = !boundaryCheck.valid;
      
      if (!boundaryCheck.valid) {
        showToast(
          `אזהרה: המיקום ${boundaryCheck.distanceKm} ק"מ מחוץ לאזור ${areaName}. נשמר בכל זאת.`,
          'warning'
        );
      }
    }
    
    const updatedLocation = { 
      ...editingLocation, // Keep existing fields like status, inProgress
      ...newLocation, // Override with edited fields
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
      
      // Add "Bangkok, Thailand" if not already included
      const searchQuery = address.toLowerCase().includes('bangkok') 
        ? address 
        : `${address}, Bangkok, Thailand`;
      
      // Use Google Places API Text Search
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress'
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

  // Search coordinates by place name
  const geocodeByName = async (name) => {
    if (!name || !name.trim()) {
      showToast('אנא הזן שם מקום', 'warning');
      return;
    }

    try {
      showToast('מחפש לפי שם...', 'info');
      
      // Add "Bangkok, Thailand" for better results
      const searchQuery = name.toLowerCase().includes('bangkok') 
        ? name 
        : `${name}, Bangkok, Thailand`;
      
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress'
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
    const stopId = route.stops[stopIndex].id || stopIndex;
    const newDisabledStops = disabledStops.includes(stopId)
      ? disabledStops.filter(id => id !== stopId)
      : [...disabledStops, stopId];
    
    setDisabledStops(newDisabledStops);
    
    // Regenerate map URL with only active stops
    const activeStops = route.stops.filter((_, i) => 
      !newDisabledStops.includes(route.stops[i].id || i)
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


