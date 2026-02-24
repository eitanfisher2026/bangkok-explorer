  // Load saved preferences
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('bangkok_preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        // Admin-controlled settings: always use defaults (Firebase will override on load)
        // Don't trust localStorage values since admin may have changed them
        prefs.maxStops = 10;
        prefs.fetchMoreCount = prefs.fetchMoreCount || 3;
        // User-specific settings preserved from last session
        if (!prefs.searchMode) prefs.searchMode = 'area';
        if (prefs.searchMode === 'radius' && prefs.radiusMeters === 15000 && prefs.radiusPlaceName === t('general.allCity')) prefs.searchMode = 'all';
        if (!prefs.radiusMeters) prefs.radiusMeters = 500;
        if (!prefs.radiusSource) prefs.radiusSource = 'gps';
        if (!prefs.radiusPlaceName) prefs.radiusPlaceName = '';
        return prefs;
      }
    } catch (e) {}
    // First time user: area and interests empty, defaults for everything else
    return {
      hours: 3,
      area: '',
      interests: [],
      circular: true,
      startPoint: '',
      maxStops: 10,
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
  const [currentLang, setCurrentLang] = useState(() => {
    return window.BKK.i18n.currentLang || 'he';
  });
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
  const disabledStopsRef = React.useRef(disabledStops);
  React.useEffect(() => { disabledStopsRef.current = disabledStops; }, [disabledStops]);
  
  // === SHARED HELPERS (avoid code duplication) ===
  
  // Check if a stop is disabled — single source of truth
  const isStopDisabled = (stop) => disabledStops.includes((stop.name || '').toLowerCase().trim());
  const isStopDisabledRef = (stop) => (disabledStopsRef.current || []).includes((stop.name || '').toLowerCase().trim());
  
  // Find smart start point: GPS nearest → circular first → null (let optimizer pick)
  const findSmartStart = (stops, gps, isCircular) => {
    if (gps?.lat && gps?.lng) {
      const check = window.BKK.isGpsWithinCity(gps.lat, gps.lng);
      if (check.withinCity) {
        let minDist = Infinity, nearest = null;
        stops.forEach(s => {
          const d = calcDistance(gps.lat, gps.lng, s.lat, s.lng);
          if (d < minDist) { minDist = d; nearest = s; }
        });
        if (nearest) return { lat: nearest.lat, lng: nearest.lng, address: nearest.name };
      }
    }
    if (isCircular && stops.length > 0) {
      return { lat: stops[0].lat, lng: stops[0].lng, address: stops[0].name };
    }
    return null; // Linear without GPS: optimizer picks best endpoint
  };
  
  // Full smart plan: select stops, find start, optimize, update state
  // Returns { optimized, disabled, autoStart, isCircular } or null on failure
  const runSmartPlan = (options = {}) => {
    const { openMap = false, startTrail = false, skipSmartSelect = false, overrideStart = null, overrideType = null } = options;
    
    if (!route?.stops?.length) return null;
    const allStops = route.stops.filter(s => s.lat && s.lng);
    if (allStops.length < 2) { showToast(t('places.noPlacesWithCoords'), 'warning'); return null; }
    
    const isCircular = overrideType !== null ? overrideType === 'circular' : routeType === 'circular';
    
    // Step 1: Smart select or respect manual choices
    let selected, disabledList, newDisabled;
    if (skipSmartSelect) {
      const curDisabled = disabledStopsRef.current || [];
      selected = allStops.filter(s => !curDisabled.includes((s.name || '').toLowerCase().trim()));
      disabledList = allStops.filter(s => curDisabled.includes((s.name || '').toLowerCase().trim()));
      newDisabled = curDisabled;
    } else {
      const result = smartSelectStops(allStops, formData.interests);
      selected = result.selected;
      disabledList = result.disabled;
      newDisabled = disabledList.map(s => (s.name || '').toLowerCase().trim());
      setDisabledStops(newDisabled);
    }
    if (selected.length < 2) { showToast(t('places.noPlacesWithCoords'), 'warning'); return null; }
    
    // Step 2: Find start point
    let autoStart = overrideStart || startPointCoordsRef.current;
    if (!autoStart) {
      const gps = (formData.currentLat && formData.currentLng) ? { lat: formData.currentLat, lng: formData.currentLng } : null;
      autoStart = findSmartStart(selected, gps, isCircular);
    }
    
    // Step 3: Optimize route order
    const optimized = optimizeStopOrder(selected, autoStart, isCircular);
    
    // For linear without explicit start: use first optimized stop
    if (!autoStart && optimized.length > 0) {
      autoStart = { lat: optimized[0].lat, lng: optimized[0].lng, address: optimized[0].name };
    }
    
    // Step 4: Update state
    setStartPointCoords(autoStart);
    startPointCoordsRef.current = autoStart;
    setFormData(prev => ({...prev, startPoint: autoStart?.address || (autoStart ? `${autoStart.lat},${autoStart.lng}` : '')}));
    
    const newStops = [...optimized, ...disabledList];
    setRoute(prev => prev ? { ...prev, stops: newStops, circular: isCircular, optimized: true, startPoint: autoStart?.address, startPointCoords: autoStart } : prev);
    
    // Step 5: Optional actions
    if (startTrail) startActiveTrail(optimized, formData.interests, formData.area);
    if (openMap && autoStart) {
      const urls = window.BKK.buildGoogleMapsUrls(
        optimized.map(s => ({ lat: s.lat, lng: s.lng, name: s.name })),
        `${autoStart.lat},${autoStart.lng}`, isCircular, window.BKK.googleMaxWaypoints || 12
      );
      if (urls.length > 0) window.open(urls[0].url, 'city_explorer_map');
    }
    
    return { optimized, disabled: disabledList, autoStart, newDisabled, isCircular };
  };
  
  const [showRoutePreview, setShowRoutePreview] = useState(false); // Route reorder dialog
  const reorderOriginalStopsRef = React.useRef(null); // Snapshot of stops before reorder
  const [showRouteMenu, setShowRouteMenu] = useState(false); // Hamburger menu in route results
  const [routeChoiceMade, setRouteChoiceMade] = useState(null); // null | 'manual' — controls wizard step 3 split
  
  // Auto-compute route whenever route exists with stops but isn't optimized
  // Skip in wizard mode when user hasn't chosen Yalla/Manual yet
  const autoComputeRef = React.useRef(false);
  React.useEffect(() => {
    if (route && route.stops && route.stops.length >= 2 && !route.optimized && !autoComputeRef.current) {
      // Don't auto-compute while wizard choice screen is showing
      if (wizardMode && routeChoiceMade === null) return;
      autoComputeRef.current = true;
      const timer = setTimeout(() => {
        console.log('[AUTO-COMPUTE] Route not optimized, auto-computing...');
        recomputeForMap(null, undefined, true); // skipSmartSelect: respect user's manual disable choices
        autoComputeRef.current = false;
      }, 300);
      return () => { clearTimeout(timer); autoComputeRef.current = false; };
    }
  }, [route?.stops?.length, route?.optimized, routeChoiceMade]);
  const [manualStops, setManualStops] = useState([]); // Manually added stops (session only)
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);
  const [activeTrail, setActiveTrail] = useState(() => {
    try {
      const saved = localStorage.getItem('foufou_active_trail');
      if (saved) {
        const trail = JSON.parse(saved);
        // Auto-expire after configured hours
        if (trail.startedAt && (Date.now() - trail.startedAt) > (window.BKK.systemParams?.trailTimeoutHours || 8) * 60 * 60 * 1000) {
          localStorage.removeItem('foufou_active_trail');
          return null;
        }
        return trail;
      }
    } catch(e) {}
    return null;
  });
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const stopRecordingRef = React.useRef(null);

  // Detect return from Google Maps — check localStorage for activeTrail
  // Also check for app updates when returning to tab
  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Check for active trail
        try {
          const saved = localStorage.getItem('foufou_active_trail');
          if (saved) {
            const trail = JSON.parse(saved);
            if (trail.startedAt && (Date.now() - trail.startedAt) < (window.BKK.systemParams?.trailTimeoutHours || 8) * 60 * 60 * 1000) {
              setActiveTrail(trail);
              setCurrentView('form');
              window.scrollTo(0, 0);
            } else {
              localStorage.removeItem('foufou_active_trail');
              setActiveTrail(null);
            }
          }
        } catch(e) {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  const [routeType, setRouteType] = useState(() => {
    // Load from localStorage or default to 'circular'
    const saved = localStorage.getItem('bangkok_route_type');
    return saved || 'circular';
  }); // 'circular' or 'linear'
  
  // Time-of-day mode for content-aware routing (uses city-level settings)
  const getAutoTimeMode = () => {
    const h = new Date().getHours();
    const dayStart = window.BKK.dayStartHour ?? 6;
    const nightStart = window.BKK.nightStartHour ?? 17;
    // Day = dayStart..nightStart, Night = nightStart..dayStart (wraps midnight)
    if (nightStart > dayStart) {
      return (h >= dayStart && h < nightStart) ? 'day' : 'night';
    } else {
      // nightStart < dayStart (e.g. night=22, day=8)
      return (h >= dayStart || h < nightStart) ? 'day' : 'night';
    }
  };
  const routeTimeModeRef = React.useRef('auto');
  const getEffectiveTimeMode = () => routeTimeModeRef.current === 'auto' ? getAutoTimeMode() : routeTimeModeRef.current;
  
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [customLocations, setCustomLocations] = useState([]);
  const [pendingLocations, setPendingLocations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pendingLocations') || '[]'); } catch(e) { return []; }
  });
  const [pendingInterests, setPendingInterests] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pendingInterests') || '[]'); } catch(e) { return []; }
  });
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [showAddLocationDialog, setShowAddLocationDialog] = useState(false);
  const [placesTab, setPlacesTab] = useState('drafts'); // 'drafts' | 'ready' | 'skipped'
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
  });
  const [customInterests, setCustomInterests] = useState([]);
  const [interestStatus, setInterestStatus] = useState({}); // { interestId: true/false }
  
  // Interest search configuration (editable)
  const [interestConfig, setInterestConfig] = useState({});

  // System parameters — configurable scoring/optimization values
  if (!window.BKK._defaultSystemParams) {
    window.BKK._defaultSystemParams = {
      trailTimeoutHours: 8,
      timeScoreMatch: 2,
      timeScoreAnytime: 1,
      timeScoreConflict: 0,
      timeConflictPenalty: 3,
      slotEarlyThreshold: 0.4,
      slotLateThreshold: 0.6,
      slotEndThreshold: 0.7,
      slotPenaltyMultiplier: 3,
      slotEndPenaltyMultiplier: 4,
      gapPenaltyMultiplier: 2,
      maxContentPasses: 3,
      defaultInterestWeight: 3
    };
    window.BKK.systemParams = { ...window.BKK._defaultSystemParams };
  }
  const [systemParams, setSystemParams] = useState(window.BKK.systemParams);
  const sp = systemParams; // shorthand
  const [interestCounters, setInterestCounters] = useState({}); // { interestId: nextNumber }
  const [googlePlaceInfo, setGooglePlaceInfo] = useState(null);
  const [loadingGoogleInfo, setLoadingGoogleInfo] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState(null); // null=hidden, []=no results, [...]= results
  const [editingCustomInterest, setEditingCustomInterest] = useState(null);
  const [showAddInterestDialog, setShowAddInterestDialog] = useState(false);
  const [newInterest, setNewInterest] = useState({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, locked: false, scope: 'global', category: 'attraction', weight: 3, minStops: 1, maxStops: 10 });
  const [iconPickerConfig, setIconPickerConfig] = useState(null); // { description: '', callback: fn, suggestions: [], loading: false }
  const [showEditLocationDialog, setShowEditLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(null); // { place, reviews: [], myRating, myText }
  const [reviewAverages, setReviewAverages] = useState({}); // { placeKey: { avg: 4.2, count: 3 } }
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState('cities'); // 'cities' or 'general'
  const [editingArea, setEditingArea] = useState(null); // area being edited on map
  const [mapMode, setMapMode] = useState('areas'); // 'areas', 'radius', or 'stops'
  const [mapStops, setMapStops] = useState([]); // stops to show when mapMode='stops'
  const [startPointCoords, setStartPointCoords] = useState(null); // { lat, lng, address }
  const leafletMapRef = React.useRef(null);
  
  // Cache for unused Google Places results per interest (avoids redundant API calls)
  const googleCacheRef = React.useRef({});

  // Leaflet Map initialization (lazy-loaded)
  React.useEffect(() => {
    if (!showMapModal) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }
    
    // Lazy load Leaflet on first use
    window.BKK.loadLeaflet().then(function(loaded) {
      if (!loaded || !showMapModal) return;
    
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
        
        // Generate area colors dynamically from palette
        const colorPalette = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7', '#14b8a6', '#e11d48', '#84cc16', '#0ea5e9', '#d946ef', '#f43f5e'];
        const areaColors = {};
        areas.forEach((area, i) => { areaColors[area.id] = colorPalette[i % colorPalette.length]; });
        
        if (mapMode === 'areas') {
          // All areas mode - center on selected city
          const cityCenter = window.BKK.selectedCity?.center || window.BKK.activeCityData?.center || { lat: 0, lng: 0 };
          const map = L.map(container).setView([cityCenter.lat, cityCenter.lng], 12);
          L.tileLayer(window.BKK.getTileUrl(), {
            attribution: '© OpenStreetMap contributors', maxZoom: 18
          }).addTo(map);
          
          const allCircles = [];
          areas.forEach(area => {
            const c = coords[area.id];
            if (!c) return;
            const color = areaColors[area.id] || '#6b7280';
            const circle = L.circle([c.lat, c.lng], {
              radius: c.radius, color: color, fillColor: color,
              fillOpacity: 0.15, weight: 2
            }).addTo(map).bindPopup(
              '<div style="text-align:center;direction:rtl;font-size:13px;">' +
              '<b>' + tLabel(area) + '</b><br/>' +
              '<span style="color:#666;font-size:11px;">' + area.labelEn + '</span><br/>' +
              '<span style="color:#999;font-size:10px;">Radius: ' + c.radius + ' m</span></div>'
            );
            // Name label with background for readability
            L.marker([c.lat, c.lng], {
              icon: L.divIcon({
                className: '',
                html: '<div style="font-size:10px;font-weight:bold;text-align:center;color:' + color + ';background:rgba(255,255,255,0.88);padding:2px 5px;border-radius:4px;border:1.5px solid ' + color + ';white-space:nowrap;line-height:1.2;box-shadow:0 1px 3px rgba(0,0,0,0.15);">' + tLabel(area) + '</div>',
                iconSize: [80, 22], iconAnchor: [40, 11]
              })
            }).addTo(map);
            allCircles.push(circle);
          });
          
          // Auto-fit to show all areas
          if (allCircles.length > 0) {
            const group = L.featureGroup(allCircles);
            map.fitBounds(group.getBounds().pad(0.1));
          }
          
          leafletMapRef.current = map;
        } else if (mapMode === 'radius') {
          // Radius mode
          const lat = formData.currentLat;
          const lng = formData.currentLng;
          if (!lat || !lng) return;
          
          const map = L.map(container).setView([lat, lng], 15);
          L.tileLayer(window.BKK.getTileUrl(), {
            attribution: '© OpenStreetMap contributors', maxZoom: 18
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
            '<b>📍 ' + (formData.radiusPlaceName || t('form.currentLocation')) + '</b><br/>' +
            '<span style="font-size:11px;color:#666;">Radius: ' + formData.radiusMeters + ' m</span></div>'
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
                html: '<div style="font-size:8px;color:#94a3b8;text-align:center;white-space:nowrap;">' + tLabel(area) + '</div>',
                iconSize: [50, 15], iconAnchor: [25, 7]
              })
            }).addTo(map);
          });
          
          leafletMapRef.current = map;
        } else if (mapMode === 'stops') {
          // Stops mode - show route points on map (fullscreen)
          const stops = mapStops.filter(s => s.lat && s.lng);
          if (stops.length === 0) return;
          
          const avgLat = stops.reduce((sum, s) => sum + s.lat, 0) / stops.length;
          const avgLng = stops.reduce((sum, s) => sum + s.lng, 0) / stops.length;
          
          const map = L.map(container).setView([avgLat, avgLng], 13);
          L.tileLayer(window.BKK.getTileUrl(), {
            attribution: '© OpenStreetMap contributors', maxZoom: 18
          }).addTo(map);
          
          // Global callback for popup buttons
          const markerRefs = {};
          let startMarkerRef = null;
          const startPointCoordsRef_local = { current: startPointCoords };
          
          const updateStartMarker = (lat, lng, address) => {
            if (startMarkerRef) map.removeLayer(startMarkerRef);
            startMarkerRef = L.marker([lat, lng], {
              icon: L.divIcon({
                className: '',
                html: '<div style="font-size:14px;text-align:center;width:28px;height:28px;line-height:28px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);color:white;font-weight:bold;">▶</div>',
                iconSize: [28, 28], iconAnchor: [14, 14]
              })
            }).addTo(map);
            startMarkerRef.bindPopup('<div style="text-align:center;font-size:12px;font-weight:bold;">📍 ' + (address || t('route.startPoint')) + '</div>');
          };
          
          window._mapStopAction = (action, data, lat, lng) => {
            if (action === 'setstart') {
              const newStart = { lat: parseFloat(lat), lng: parseFloat(lng), address: data };
              startPointCoordsRef_local.current = newStart;
              updateStartMarker(parseFloat(lat), parseFloat(lng), data);
              map.closePopup();
              showToast(`▶ ${data}`, 'success');
              // Auto-recompute route with new start point
              const result = recomputeForMap(newStart, undefined, true);
              if (result) {
                stopsOrderRef.current = result.optimized;
              }
              setTimeout(() => { if (window._mapRedrawLine) window._mapRedrawLine(); }, 150);
              return;
            }
            const nameKey = data.toLowerCase().trim();
            if (action === 'disable') {
              setDisabledStops(prev => [...prev, nameKey]);
              if (markerRefs[nameKey]) {
                markerRefs[nameKey].circle.setStyle({ fillOpacity: 0.2, opacity: 0.3 });
                markerRefs[nameKey].label.setOpacity(0.3);
              }
              map.closePopup();
              // If disabling the current start point, clear it so recompute picks a new one
              const curStart = startPointCoordsRef_local.current;
              if (curStart) {
                const stopObj = stops.find(s => (s.name || '').toLowerCase().trim() === nameKey);
                if (stopObj && Math.abs(stopObj.lat - curStart.lat) < 0.0001 && Math.abs(stopObj.lng - curStart.lng) < 0.0001) {
                  startPointCoordsRef_local.current = null;
                  if (startMarkerRef) { map.removeLayer(startMarkerRef); startMarkerRef = null; }
                  setStartPointCoords(null);
                  startPointCoordsRef.current = null;
                }
              }
              showToast(`⏸️ ${data}`, 'info');
              // Trigger route recompute
              setRoute(prev => prev ? {...prev, optimized: false} : prev);
              setTimeout(() => { if (window._mapRedrawLine) window._mapRedrawLine(); }, 50);
            } else if (action === 'enable') {
              setDisabledStops(prev => prev.filter(n => n !== nameKey));
              if (markerRefs[nameKey]) {
                markerRefs[nameKey].circle.setStyle({ fillOpacity: 0.85, opacity: 1 });
                markerRefs[nameKey].label.setOpacity(1);
              }
              map.closePopup();
              showToast(`▶️ ${data}`, 'success');
              // Trigger route recompute
              setRoute(prev => prev ? {...prev, optimized: false} : prev);
              setTimeout(() => { if (window._mapRedrawLine) window._mapRedrawLine(); }, 50);
            }
          };
          
          const markers = [];
          const isRTL = window.BKK.i18n.isRTL();
          const stopsOrderRef = { current: stops }; // Mutable ref for current stop order
          
          // Initial start point marker (only if NOT overlapping with a stop)
          if (startPointCoords?.lat && startPointCoords?.lng) {
            const overlapsStop = stops.some(s => Math.abs(s.lat - startPointCoords.lat) < 0.0001 && Math.abs(s.lng - startPointCoords.lng) < 0.0001);
            if (!overlapsStop) {
              updateStartMarker(startPointCoords.lat, startPointCoords.lng, startPointCoords.address);
            }
          }
          stops.forEach((stop, i) => {
            const color = colorPalette[i % colorPalette.length];
            const nameKey = (stop.name || '').toLowerCase().trim();
            const isDisabled = disabledStops.includes(nameKey);
            const isStart = startPointCoordsRef_local.current && Math.abs(stop.lat - startPointCoordsRef_local.current.lat) < 0.0001 && Math.abs(stop.lng - startPointCoordsRef_local.current.lng) < 0.0001;
            
            // Green outer ring for start point
            if (isStart && !isDisabled) {
              L.circleMarker([stop.lat, stop.lng], {
                radius: 18, color: '#22c55e', fillColor: 'transparent',
                fillOpacity: 0, weight: 3, opacity: 1,
                dashArray: '6,4'
              }).addTo(map);
            }
            
            const circle = L.circleMarker([stop.lat, stop.lng], {
              radius: 12, color: color, fillColor: color,
              fillOpacity: isDisabled ? 0.2 : 0.85, weight: 2,
              opacity: isDisabled ? 0.3 : 1
            }).addTo(map);
            
            const label = L.marker([stop.lat, stop.lng], {
              icon: L.divIcon({
                className: '',
                html: '<div style="font-size:10px;font-weight:bold;text-align:center;color:white;width:22px;height:22px;line-height:22px;border-radius:50%;background:' + color + ';border:2px solid ' + (isStart ? '#22c55e' : 'white') + ';box-shadow:0 1px 4px rgba(0,0,0,0.3);opacity:' + (isDisabled ? '0.3' : '1') + ';">' + (isStart ? '▶' : window.BKK.stopLabel(i)) + '</div>',
                iconSize: [22, 22], iconAnchor: [11, 11]
              }),
              opacity: isDisabled ? 0.3 : 1
            }).addTo(map);
            
            markerRefs[nameKey] = { circle, label };
            
            const escapedName = (stop.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const googleUrl = 'https://www.google.com/maps/search/?api=1&query=' + stop.lat + ',' + stop.lng + (stop.place_id ? '&query_place_id=' + stop.place_id : '');
            
            // Dynamic popup - regenerates on open to reflect current disable state
            const makePopup = () => {
              const curDisabled = disabledStopsRef.current || [];
              const curIsDisabled = curDisabled.includes(nameKey);
              const toggleAction = curIsDisabled ? 'enable' : 'disable';
              const toggleLabel = curIsDisabled ? '▶️ ' + t('route.returnPlace') : '⏸️ ' + t('route.skipPlace');
              const toggleColor = curIsDisabled ? '#22c55e' : '#9ca3af';
              return '<div style="text-align:center;direction:' + (isRTL ? 'rtl' : 'ltr') + ';font-size:13px;min-width:160px;padding:4px 0;">' +
                '<div style="font-weight:bold;font-size:14px;margin-bottom:6px;">' + window.BKK.stopLabel(i) + '. ' + (stop.name || '') + '</div>' +
                (stop.rating ? '<div style="color:#f59e0b;margin-bottom:6px;">⭐ ' + stop.rating + (stop.ratingCount ? ' (' + stop.ratingCount + ')' : '') + '</div>' : '') +
                '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:6px;">' +
                  '<a href="' + googleUrl + '" target="_blank" style="flex:1;display:inline-block;padding:6px 10px;border-radius:8px;background:#3b82f6;color:white;text-decoration:none;font-size:12px;font-weight:bold;">Google Maps ↗</a>' +
                  '<button onclick="window._mapStopAction(\'' + toggleAction + '\',\'' + escapedName + '\')" style="flex:1;padding:6px 10px;border-radius:8px;background:' + toggleColor + ';color:white;border:none;font-size:12px;font-weight:bold;cursor:pointer;">' + toggleLabel + '</button>' +
                '</div>' +
                '<button onclick="window._mapStopAction(\'setstart\',\'' + escapedName + '\',' + stop.lat + ',' + stop.lng + ')" style="width:100%;padding:5px 8px;border-radius:8px;background:#22c55e;color:white;border:none;font-size:11px;font-weight:bold;cursor:pointer;">▶ ' + t('form.setStartPoint') + '</button>' +
              '</div>';
            };
            
            circle.bindPopup(makePopup, { maxWidth: 250 });
            circle.on('popupopen', () => { circle.getPopup().setContent(makePopup()); });
            label.on('click', () => { circle.openPopup(); });
            markers.push(circle);
          });
          
          // Route line through active stops (+ start point if set)
          let routeLine = null;
          const redrawRouteLine = () => {
            if (routeLine) map.removeLayer(routeLine);
            routeLine = null;
            const curDisabled = disabledStopsRef.current || [];
            const curStops = stopsOrderRef.current || [];
            const activeStops = curStops.filter(s => !curDisabled.includes((s.name || '').toLowerCase().trim()));
            if (activeStops.length > 1) {
              const pts = [];
              const sp = startPointCoordsRef_local.current;
              if (sp?.lat) pts.push([sp.lat, sp.lng]);
              pts.push(...activeStops.map(s => [s.lat, s.lng]));
              // For circular routes, close the loop back to start
              if (routeTypeRef.current === 'circular' && sp?.lat) {
                pts.push([sp.lat, sp.lng]);
              }
              routeLine = L.polyline(pts, { color: '#6366f1', weight: 2.5, opacity: 0.6, dashArray: '6,8' }).addTo(map);
            }
          };
          redrawRouteLine();
          
          if (markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.15));
          }
          
          // GPS locate-me button (top-right)
          const LocateControl = L.Control.extend({
            options: { position: 'topright' },
            onAdd: function() {
              const div = L.DomUtil.create('div', '');
              div.innerHTML = '<button style="width:36px;height:36px;border-radius:8px;border:2px solid rgba(0,0,0,0.2);background:white;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.15);" title="' + t('form.findCurrentLocation') + '">📍</button>';
              let myLocMarker = null;
              div.onclick = function(e) {
                e.stopPropagation();
                div.firstChild.innerHTML = '⏳';
                window.BKK.getValidatedGps(
                  function(pos) {
                    div.firstChild.innerHTML = '📍';
                    if (myLocMarker) map.removeLayer(myLocMarker);
                    const lat = pos.coords.latitude, lng = pos.coords.longitude;
                    myLocMarker = L.circleMarker([lat, lng], {
                      radius: 8, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.4, weight: 3
                    }).addTo(map);
                    myLocMarker.bindPopup(
                      '<div style="text-align:center;font-size:12px;padding:4px 0;">' +
                      '<div style="font-weight:bold;margin-bottom:6px;">📍 ' + t('wizard.myLocation') + '</div>' +
                      '<button onclick="window._mapStopAction(\'setstart\',\'' + t('wizard.myLocation').replace(/'/g, "\\'") + '\',' + lat + ',' + lng + ')" style="width:100%;padding:5px 8px;border-radius:8px;background:#22c55e;color:white;border:none;font-size:11px;font-weight:bold;cursor:pointer;">▶ ' + t('form.setStartPoint') + '</button>' +
                      '</div>'
                    ).openPopup();
                    map.setView([lat, lng], map.getZoom());
                  },
                  function(reason) {
                    div.firstChild.innerHTML = '📍';
                    if (reason === 'outside_city') showToast(t('toast.outsideCity'), 'warning', 'sticky');
                    else showToast(reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'warning', 'sticky');
                  }
                );
              };
              L.DomEvent.disableClickPropagation(div);
              return div;
            }
          });
          new LocateControl().addTo(map);
          
          // Store redraw for disable/enable callbacks
          window._mapRedrawLine = redrawRouteLine;
          window._mapStopsOrderRef = stopsOrderRef;
          
          leafletMapRef.current = map;
        }
      } catch(err) {
        console.error('[MAP]', err);
      }
    }, 150);
    }); // end loadLeaflet().then
    
    return () => { if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; } delete window._mapStopAction; delete window._mapRedrawLine; delete window._mapStopsOrderRef; };
  }, [showMapModal, mapMode, mapStops, formData.currentLat, formData.currentLng, formData.radiusMeters]);
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
  const [accessStats, setAccessStats] = useState(null); // { total, weekly: { '2026-W08': { IL: 3, TH: 12 } } }
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(() => {
    return localStorage.getItem('bangkok_is_admin') === 'true';
  });

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
  // Debug system with categories
  // Categories: api, firebase, sync, route, interest, location, migration, all
  const [debugMode, setDebugMode] = useState(() => {
    return localStorage.getItem('bangkok_debug_mode') === 'true';
  });
  const [debugCategories, setDebugCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bangkok_debug_categories') || '["all"]'); } catch(e) { return ['all']; }
  });
  const toggleDebugCategory = (cat) => {
    setDebugCategories(prev => {
      if (cat === 'all') return ['all'];
      const without = prev.filter(c => c !== 'all');
      const next = without.includes(cat) ? without.filter(c => c !== cat) : [...without, cat];
      return next.length === 0 ? ['all'] : next;
    });
  };
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Tracks initial Firebase/localStorage load
  const dataLoadTracker = React.useRef({ locations: false, interests: false, config: false, status: false, routes: false });
  const markLoaded = (key) => {
    dataLoadTracker.current[key] = true;
    const t = dataLoadTracker.current;
    if (t.locations && t.interests && t.config && t.status && t.routes) {
      setIsDataLoaded(true);
      window.scrollTo(0, 0);
      // Preload Leaflet in background (2s delay to not compete with rendering)
      setTimeout(() => window.BKK.loadLeaflet(), 2000);
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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Refs for current values (needed by map closures to avoid stale state)
  const routeTypeRef = React.useRef(routeType);
  React.useEffect(() => { routeTypeRef.current = routeType; }, [routeType]);
  const startPointCoordsRef = React.useRef(startPointCoords);
  React.useEffect(() => { startPointCoordsRef.current = startPointCoords; }, [startPointCoords]);
  const [showVersionPasswordDialog, setShowVersionPasswordDialog] = useState(false);
  const [showAddCityDialog, setShowAddCityDialog] = useState(false);
  const [addCityInput, setAddCityInput] = useState('');
  const [addCitySearchStatus, setAddCitySearchStatus] = useState(''); // '', 'searching', 'found', 'error', 'generating', 'done'
  const [addCityFound, setAddCityFound] = useState(null);
  const [addCityGenerated, setAddCityGenerated] = useState(null);
  const [googleMaxWaypoints, setGoogleMaxWaypoints] = useState(12);
  const [cityModified, setCityModified] = useState(false);
  const [cityEditCounter, setCityEditCounter] = useState(0); // Force re-render on city object mutation
  const [showSettingsMap, setShowSettingsMap] = useState(false);
  const [mapEditMode, setMapEditMode] = useState(false);
  const mapMarkersRef = React.useRef([]);
  const mapOriginalPositions = React.useRef({});
  const [passwordInput, setPasswordInput] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState(''); // For setting new password in admin panel
  
  // Add debug log entry (console only, filtered by category)
  const addDebugLog = (category, message, data = null) => {
    if (!debugMode) return;
    const cat = category.toLowerCase();
    if (!debugCategories.includes('all') && !debugCategories.includes(cat)) return;
    console.log(`[${category}] ${message}`, data || '');
  };
  
  // Save debug preferences
  useEffect(() => {
    localStorage.setItem('bangkok_debug_mode', debugMode.toString());
  }, [debugMode]);
  useEffect(() => {
    localStorage.setItem('bangkok_debug_categories', JSON.stringify(debugCategories));
  }, [debugCategories]);
  
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
  const showToast = (message, type = 'success', customDuration = null) => {
    setToastMessage({ message, type, sticky: customDuration === 'sticky' });
    if (customDuration !== 'sticky') {
      const duration = customDuration || Math.min(6000, Math.max(2500, message.length * 70));
      setTimeout(() => setToastMessage(null), duration);
    }
  };

  // Get current GPS location and reverse geocode to address
  const getMyLocation = () => {
    setIsLocating(true);
    window.BKK.getValidatedGps(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        console.log('[GPS] Got location:', lat, lng);
        
        try {
          const address = await window.BKK.reverseGeocode(lat, lng);
          const displayAddress = address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setStartPointCoords({ lat, lng, address: displayAddress });
          startPointCoordsRef.current = { lat, lng, address: displayAddress };
          setFormData(prev => ({ ...prev, startPoint: displayAddress }));
          showToast(address ? t('form.locationDetectedFull') : t('form.locationDetectedNoAddr'), 'success');
        } catch (err) {
          const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setStartPointCoords({ lat, lng, address: fallback });
          startPointCoordsRef.current = { lat, lng, address: fallback };
          setFormData(prev => ({ ...prev, startPoint: fallback }));
          showToast(t('form.locationDetected'), 'success');
        }
        setIsLocating(false);
      },
      (reason) => {
        setIsLocating(false);
        if (reason === 'outside_city') {
          showToast(t('toast.outsideCity'), 'warning', 'sticky');
        } else if (reason === 'denied') {
          showToast(t('toast.locationNoPermission'), 'error', 'sticky');
        } else {
          showToast(t('toast.noGpsSignal'), 'error', 'sticky');
        }
        // Fall back to stop A as start point
        if (route && route.stops && route.stops.length > 0) {
          const firstStop = route.stops.find(s => s.lat && s.lng);
          if (firstStop) {
            setStartPointCoords({ lat: firstStop.lat, lng: firstStop.lng, address: firstStop.name });
            startPointCoordsRef.current = { lat: firstStop.lat, lng: firstStop.lng, address: firstStop.name };
            setFormData(prev => ({ ...prev, startPoint: firstStop.name }));
          }
        }
      }
    );
  };

  // Geocode typed start point address to coordinates
  const validateStartPoint = async () => {
    const text = formData.startPoint?.trim();
    if (!text) {
      showToast(t('form.enterAddressOrName'), 'warning');
      return;
    }
    
    setIsLocating(true);
    try {
      const result = await window.BKK.geocodeAddress(text);
      if (result) {
        const validatedAddress = result.address || result.displayName || text;
        setStartPointCoords({ lat: result.lat, lng: result.lng, address: validatedAddress });
        setFormData(prev => ({ ...prev, startPoint: validatedAddress }));
        showToast(`${t("toast.addressVerified")} ${result.displayName || result.address}`, 'success');
        console.log('[START_POINT] Geocoded:', text, '->', result);
      } else {
        showToast(t('places.addressNotFound'), 'warning');
      }
    } catch (err) {
      console.error('[START_POINT] Geocode error:', err);
      showToast(t('toast.addressSearchError'), 'error');
    }
    setIsLocating(false);
  };

  // Detect which area the user is currently in based on GPS
  const detectArea = () => {
    setIsLocating(true);
    window.BKK.getValidatedGps(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const coords = window.BKK.areaCoordinates;
        
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
          const areaName = areaOptions.find(a => a.id === closest)? tLabel(areaOptions.find(a => a.id === closest)) : closest;
          setFormData(prev => ({ ...prev, area: closest }));
          showToast(`${t("toast.foundInArea")} ${areaName}`, 'success');
        } else {
          showToast(t('places.locationOutsideSelection'), 'warning');
        }
        setIsLocating(false);
      },
      (reason) => {
        setIsLocating(false);
        if (reason === 'outside_city') showToast(t('toast.outsideCity'), 'warning', 'sticky');
        else if (reason === 'denied') showToast(t('toast.locationNoPermission'), 'error', 'sticky');
        else showToast(t('toast.noGpsSignal'), 'error', 'sticky');
      }
    );
  };
  // Monitor Firebase connection state
  useEffect(() => {
    const handler = (e) => setFirebaseConnected(e.detail.connected);
    window.addEventListener('firebase-connection', handler);
    setFirebaseConnected(!!window.BKK.firebaseConnected);
    return () => window.removeEventListener('firebase-connection', handler);
  }, []);

  // Push navigation state when view or wizard step changes
  useEffect(() => {
    if (window.BKK.pushNavState) {
      window.BKK.pushNavState({ view: currentView, wizardStep, wizardMode });
    }
  }, [currentView, wizardStep, wizardMode]);

  // Handle Android/iOS back button
  useEffect(() => {
    const handler = (e) => {
      const prev = e.detail;
      if (!prev) return;
      
      if (prev.wizardMode && wizardMode) {
        // Within wizard: go to previous step
        if (prev.wizardStep < wizardStep) {
          setWizardStep(prev.wizardStep);
          if (prev.wizardStep < 3) { setRoute(null); setCurrentView('form'); }
          // Don't clear interests on back - user's selections should persist
          window.scrollTo(0, 0);
          return;
        }
      }
      
      // Normal navigation between views
      if (prev.view !== currentView) {
        setCurrentView(prev.view);
        window.scrollTo(0, 0);
        return;
      }
      
      // Wizard mode changed
      if (prev.wizardMode !== wizardMode) {
        setWizardMode(prev.wizardMode);
        if (prev.wizardMode) {
          localStorage.setItem('bangkok_wizard_mode', 'true');
        }
      }
    };
    window.addEventListener('app-nav-back', handler);
    return () => window.removeEventListener('app-nav-back', handler);
  }, [currentView, wizardStep, wizardMode]);

  // Save pending items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pendingLocations', JSON.stringify(pendingLocations));
  }, [pendingLocations]);
  useEffect(() => {
    localStorage.setItem('pendingInterests', JSON.stringify(pendingInterests));
  }, [pendingInterests]);

  // Sync pending locations to Firebase
  const syncPendingItems = async () => {
    if (!isFirebaseAvailable || !database) return 0;
    if (!window.BKK.firebaseConnected) {
      showToast(t('toast.offline'), 'warning');
      return 0;
    }
    
    let synced = 0;
    
    // Sync pending locations
    if (pendingLocations.length > 0) {
      const remaining = [];
      for (const loc of pendingLocations) {
        try {
          const cityId = loc.cityId || selectedCityId;
          const { pendingAt, ...cleanLoc } = loc;
          const ref = await database.ref(`cities/${cityId}/locations`).push(cleanLoc);
          // Verify server received it by reading back
          await Promise.race([
            ref.once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
          synced++;
          console.log('[SYNC] Synced pending location:', loc.name);
        } catch (e) {
          console.warn('[SYNC] Failed to sync location:', loc.name, e.message);
          remaining.push(loc);
        }
      }
      setPendingLocations(remaining);
    }
    
    // Sync pending interests
    if (pendingInterests.length > 0) {
      const remaining = [];
      for (const item of pendingInterests) {
        try {
          const { pendingAt, searchConfig, ...interestData } = item;
          await database.ref(`customInterests/${interestData.id}`).set(interestData);
          if (searchConfig && Object.keys(searchConfig).length > 0) {
            await database.ref(`settings/interestConfig/${interestData.id}`).set(searchConfig);
          }
          // Verify server received it by reading back
          await Promise.race([
            database.ref(`customInterests/${interestData.id}`).once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
          synced++;
          console.log('[SYNC] Synced pending interest:', interestData.label);
        } catch (e) {
          console.warn('[SYNC] Failed to sync interest:', item.label, e.message);
          remaining.push(item);
        }
      }
      setPendingInterests(remaining);
    }
    
    const totalPending = pendingLocations.length + pendingInterests.length;
    if (synced > 0) {
      showToast(`✅ ${t('toast.syncedPending').replace('{count}', String(synced))}`, 'success');
    }
    if (totalPending > 0 && synced < totalPending) {
      showToast(`⚠️ ${totalPending - synced} ${t('toast.stillPending')}`, 'warning');
    }
    return synced;
  };

  // Auto-sync when connection is restored
  useEffect(() => {
    if (firebaseConnected && isFirebaseAvailable && database) {
      if (pendingLocations.length > 0 || pendingInterests.length > 0) {
        const timer = setTimeout(() => {
          console.log('[SYNC] Connection restored, syncing', pendingLocations.length, 'locations +', pendingInterests.length, 'interests');
          showToast(`🔄 ${t('toast.connectionRestored')}`, 'info');
          syncPendingItems();
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        // No pending items but connection just came back — inform user
        console.log('[SYNC] Connection restored, no pending items');
      }
    }
  }, [firebaseConnected]);

  // Helper: save to pending localStorage
  const saveToPending = (locationData) => {
    const pending = { ...locationData, pendingAt: new Date().toISOString() };
    setPendingLocations(prev => [...prev, pending]);
    showToast(`💾 ${locationData.name} — ${t('toast.savedPending')}`, 'warning', 'sticky');
  };

  const saveToPendingInterest = (interestData, searchConfig) => {
    const pending = { ...interestData, searchConfig: searchConfig || {}, pendingAt: new Date().toISOString() };
    setPendingInterests(prev => [...prev, pending]);
    showToast(`💾 ${interestData.label || interestData.name} — ${t('toast.savedPending')}`, 'warning', 'sticky');
  };

  // One-time migration: move old customLocations to per-city structure
  useEffect(() => {
    if (isFirebaseAvailable && database) {
      window.BKK.migrateLocationsToPerCity(database);
      window.BKK.cleanupInProgress(database);
      // NOTE: cleanupOrphanedInterests REMOVED — it was deleting valid interests!
      // The function checked for types/textSearch on the interest object, but search config
      // is stored separately in settings/interestConfig/{id}. So non-privateOnly interests
      // were incorrectly flagged as orphans and deleted.
    }
  }, []);

  // Load saved routes from Firebase - PER CITY
  useEffect(() => {
    if (!selectedCityId) return;
    
    if (isFirebaseAvailable && database) {
      const routesRef = database.ref(`cities/${selectedCityId}/routes`);
      
      const onValue = routesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const routesArray = Object.keys(data).map(key => ({
            ...data[key],
            firebaseId: key
          }));
          setSavedRoutes(routesArray);
          console.log('[FIREBASE] Loaded', routesArray.length, 'saved routes for', selectedCityId);
        } else {
          setSavedRoutes([]);
        }
        markLoaded('routes');
      });
      
      return () => routesRef.off('value', onValue);
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
  }, [selectedCityId]);

  // Load custom locations from Firebase - PER CITY
  useEffect(() => {
    if (!selectedCityId) return;
    setLocationsLoading(true);
    
    if (isFirebaseAvailable && database) {
      console.log('[DATA] Loading locations for city:', selectedCityId);
      const locationsRef = database.ref(`cities/${selectedCityId}/locations`);
      
      const onValue = locationsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const locationsArray = Object.keys(data).map(key => ({
            ...data[key],
            firebaseId: key,
            cityId: selectedCityId
          }));
          setCustomLocations(locationsArray);
          console.log('[FIREBASE] Loaded', locationsArray.length, 'locations for', selectedCityId);
        } else {
          setCustomLocations([]);
        }
        setLocationsLoading(false);
        markLoaded('locations');
      });
      
      return () => locationsRef.off('value', onValue);
    } else {
      console.log('[DATA] Firebase not available - using localStorage fallback');
      try {
        const allLocs = JSON.parse(localStorage.getItem('bangkok_custom_locations') || '[]');
        const cityLocs = allLocs.filter(l => (l.cityId || 'bangkok') === selectedCityId);
        setCustomLocations(cityLocs);
      } catch (e) {
        console.error('[LOCALSTORAGE] Error loading locations:', e);
      }
      setLocationsLoading(false);
      markLoaded('locations');
    }
  }, [selectedCityId]);

  // Load custom interests from Firebase
  const recentlyAddedRef = React.useRef(new Map()); // id → timestamp of recent local adds
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
          
          // Merge: keep locally-added interests that Firebase doesn't know about yet (race condition protection)
          const firebaseIds = new Set(interestsArray.map(i => i.id));
          const now = Date.now();
          // Clean up stale entries (older than 30 seconds)
          for (const [id, ts] of recentlyAddedRef.current) {
            if (now - ts > 30000) recentlyAddedRef.current.delete(id);
          }
          setCustomInterests(prev => {
            // Detect disappearances
            const prevIds = new Set(prev.map(i => i.id));
            const disappeared = prev.filter(i => !firebaseIds.has(i.id) && !recentlyAddedRef.current.has(i.id));
            if (disappeared.length > 0 && prev.length > 0) {
              console.warn('[FIREBASE] ⚠️ INTERESTS DISAPPEARED:', disappeared.map(i => `${i.id}:"${i.label}"`).join(', '));
              console.warn('[FIREBASE] Previous count:', prev.length, '→ Firebase count:', interestsArray.length);
            }
            // Find locally-added interests not yet in Firebase (added within last 30s)
            const pendingLocal = prev.filter(i => 
              !firebaseIds.has(i.id) && recentlyAddedRef.current.has(i.id)
            );
            if (pendingLocal.length > 0) {
              console.log('[FIREBASE] Keeping', pendingLocal.length, 'pending local interests:', pendingLocal.map(i => i.label).join(', '));
            }
            return [...interestsArray, ...pendingLocal];
          });
          console.log('[FIREBASE] Loaded', interestsArray.length, 'interests from Firebase');
        } else {
          // Safety: don't wipe if we already have interests — Firebase might have returned null due to connection issue
          setCustomInterests(prev => {
            if (prev.length > 0) {
              console.warn('[FIREBASE] customInterests returned null but we have', prev.length, 'locally — keeping them');
              return prev;
            }
            return [];
          });
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

  // Load interest counters (for auto-naming: "Graffiti Chinatown #3")
  useEffect(() => {
    if (isFirebaseAvailable && database && selectedCityId) {
      const countersRef = database.ref(`cities/${selectedCityId}/interestCounters`);
      countersRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        setInterestCounters(data);
      });
      return () => countersRef.off();
    }
  }, [selectedCityId]);

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
          const routeSnap = await database.ref(`cities/${selectedCityId}/routes`).once('value');
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
          const locSnap = await database.ref(`cities/${selectedCityId}/locations`).once('value');
          const locData = locSnap.val();
          if (locData) {
            const locationsArray = Object.keys(locData).map(key => ({
              ...locData[key],
              firebaseId: key,
              cityId: selectedCityId
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
            // Don't wipe if we already have interests locally
            setCustomInterests(prev => {
              if (prev.length > 0) {
                console.warn('[REFRESH] customInterests returned null but we have', prev.length, 'locally — keeping');
                return prev;
              }
              return [];
            });
          }
        } catch (e) {
          console.error('[REFRESH] Error loading interests:', e);
        }
        
        // 4-7. All settings in single read
        try {
          const settingsSnap = await database.ref('settings').once('value');
          const s = settingsSnap.val() || {};
          
          // Interest Config
          if (s.interestConfig) {
            setInterestConfig(prev => ({ ...prev, ...s.interestConfig }));
          }
          
          // Interest Status
          if (s.interestStatus) {
            const builtInIds = interestOptions.map(i => i.id);
            const uncoveredIds = uncoveredInterests.map(i => i.id || i.name.replace(/\s+/g, '_').toLowerCase());
            const defaultStatus = {};
            builtInIds.forEach(id => { defaultStatus[id] = true; });
            uncoveredIds.forEach(id => { defaultStatus[id] = false; });
            setInterestStatus({ ...defaultStatus, ...s.interestStatus });
          }
          
          // Admin
          setAdminPassword(s.adminPassword || '');
          const usersData = s.adminUsers || {};
          const usersList = Object.entries(usersData).map(([oderId, data]) => ({ oderId, ...data }));
          setAdminUsers(usersList);
          const userId = localStorage.getItem('bangkok_user_id');
          const isInAdminList = usersList.some(u => u.oderId === userId);
          const passwordEmpty = !s.adminPassword;
          const noAdminListExists = usersList.length === 0;
          const userIsAdmin = isInAdminList || (passwordEmpty && noAdminListExists);
          setIsUnlocked(userIsAdmin);
          setIsCurrentUserAdmin(userIsAdmin);
          
          // App settings
          if (s.googleMaxWaypoints != null) setGoogleMaxWaypoints(s.googleMaxWaypoints);
          const updates = {};
          if (s.maxStops != null) updates.maxStops = s.maxStops;
          if (s.fetchMoreCount != null) updates.fetchMoreCount = s.fetchMoreCount;
          if (s.defaultRadius != null) window.BKK._defaultRadius = s.defaultRadius;
          if (Object.keys(updates).length > 0) setFormData(prev => ({...prev, ...updates}));
          
          // City overrides
          if (s.cityOverrides) {
            window.BKK._cityOverrides = s.cityOverrides;
            const cityId = window.BKK.selectedCityId;
            if (cityId && s.cityOverrides[cityId]) {
              const co = s.cityOverrides[cityId];
              if (co.dayStartHour != null) window.BKK.dayStartHour = co.dayStartHour;
              if (co.nightStartHour != null) window.BKK.nightStartHour = co.nightStartHour;
            }
          }
          
          // System params
          if (s.systemParams) {
            const merged = { ...window.BKK._defaultSystemParams, ...s.systemParams };
            window.BKK.systemParams = merged;
            setSystemParams(merged);
          }
          
          console.log('[REFRESH] All settings loaded (single read)');
        } catch (e) {
          console.error('[REFRESH] Error loading settings:', e);
        }
        
        showToast(t('toast.dataRefreshed'), 'success');
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
        
        showToast(t('toast.dataRefreshedLocal'), 'warning');
      }
    } catch (error) {
      console.error('[REFRESH] Unexpected error:', error);
      showToast(t('toast.refreshError'), 'error');
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
    // ── CONSOLIDATED settings listener (replaces 8 individual listeners + loadAdminControlledSettings) ──
    const hasSavedPrefs = !!localStorage.getItem('bangkok_preferences');
    database.ref('settings').on('value', (snap) => {
      const s = snap.val() || {};
      
      // Admin auth
      const pw = s.adminPassword || '';
      setAdminPassword(pw);
      const usersData = s.adminUsers || {};
      const usersList = Object.entries(usersData).map(([oderId, data]) => ({ oderId, ...data }));
      setAdminUsers(usersList);
      const cachedUserId = localStorage.getItem('bangkok_user_id');
      const isInList = usersList.some(u => u.oderId === cachedUserId);
      const passwordEmpty = !pw;
      const noAdminListExists = usersList.length === 0;
      const userIsAdmin = isInList || (passwordEmpty && noAdminListExists);
      setIsUnlocked(userIsAdmin);
      setIsCurrentUserAdmin(userIsAdmin);
      localStorage.setItem('bangkok_is_admin', userIsAdmin ? 'true' : 'false');
      
      // App settings
      if (s.googleMaxWaypoints != null) setGoogleMaxWaypoints(s.googleMaxWaypoints);
      
      const formUpdates = {};
      if (s.maxStops != null) formUpdates.maxStops = s.maxStops;
      if (s.fetchMoreCount != null) formUpdates.fetchMoreCount = s.fetchMoreCount;
      if (s.defaultRadius != null) {
        window.BKK._defaultRadius = s.defaultRadius;
        if (!hasSavedPrefs) formUpdates.radiusMeters = s.defaultRadius;
      }
      if (Object.keys(formUpdates).length > 0) {
        setFormData(prev => ({...prev, ...formUpdates}));
      }
      
      // City day/night overrides
      if (s.cityOverrides) {
        window.BKK._cityOverrides = s.cityOverrides;
        const cityId = window.BKK.selectedCityId;
        if (cityId && s.cityOverrides[cityId]) {
          const co = s.cityOverrides[cityId];
          if (co.dayStartHour != null) window.BKK.dayStartHour = co.dayStartHour;
          if (co.nightStartHour != null) window.BKK.nightStartHour = co.nightStartHour;
          const city = window.BKK.selectedCity;
          if (city) {
            if (co.dayStartHour != null) city.dayStartHour = co.dayStartHour;
            if (co.nightStartHour != null) city.nightStartHour = co.nightStartHour;
          }
        }
      }
      
      // System parameters (algorithm tuning)
      if (s.systemParams) {
        const merged = { ...window.BKK._defaultSystemParams, ...s.systemParams };
        window.BKK.systemParams = merged;
        setSystemParams(merged);
      }
      
      console.log('[FIREBASE] Settings loaded (single listener):', Object.keys(s).filter(k => s[k] != null).join(', '));
    });
    
    // Log access stats (aggregated weekly counters by country)
    const isAdmin = localStorage.getItem('bangkok_is_admin') === 'true';
    
    if (!isAdmin) {
      const lastLogTime = parseInt(localStorage.getItem('bangkok_last_log_time') || '0');
      const oneHour = 60 * 60 * 1000;
      
      if (Date.now() - lastLogTime >= oneHour) {
        localStorage.setItem('bangkok_last_log_time', Date.now().toString());
        
        // Get ISO week key (e.g. "2026-W08")
        const now = new Date();
        const jan1 = new Date(now.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
        const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        
        // Increment total counter
        database.ref('accessStats/total').transaction(val => (val || 0) + 1);
        
        // Increment weekly unknown first, then update with country
        database.ref(`accessStats/weekly/${weekKey}/unknown`).transaction(val => (val || 0) + 1);
        
        // Geo lookup to get country
        fetch('https://ipapi.co/json/')
          .then(r => r.json())
          .then(geo => {
            const cc = geo.country_code || 'unknown';
            if (cc !== 'unknown') {
              // Move count from unknown to actual country
              database.ref(`accessStats/weekly/${weekKey}/unknown`).transaction(val => Math.max((val || 1) - 1, 0));
              database.ref(`accessStats/weekly/${weekKey}/${cc}`).transaction(val => (val || 0) + 1);
            }
          })
          .catch(() => { /* keep as unknown */ });
      }
    }
  }, []);

  // Feedback System
  const submitFeedback = () => {
    if (!feedbackText.trim()) {
      showToast(t('settings.writeFeedback'), 'warning');
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
          showToast(t('toast.feedbackThanks'), 'success');
          setFeedbackText('');
          setFeedbackCategory('general');
          setShowFeedbackDialog(false);
        })
        .catch(() => showToast(t('toast.sendError'), 'error'));
    } else {
      showToast(t('toast.firebaseUnavailable'), 'error');
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
        .then(() => showToast(t('toast.feedbackDeleted'), 'success'));
    }
  };

  // Config - loaded from config.js, re-read on city change via selectedCityId dependency
  const interestOptions = window.BKK.interestOptions || [];

  const interestToGooglePlaces = window.BKK.interestToGooglePlaces || {};

  const uncoveredInterests = window.BKK.uncoveredInterests || [];

  const interestTooltips = window.BKK.interestTooltips || {};

  const areaCoordinates = window.BKK.areaCoordinates || {};

  // Switch city function
  const switchCity = (cityId, stayOnView) => {
    if (cityId === selectedCityId) return;
    if (!window.BKK.cities[cityId]) return;
    
    window.BKK.selectCity(cityId);
    // Apply Firebase overrides for day/night hours
    const overrides = window.BKK._cityOverrides?.[cityId];
    if (overrides) {
      if (overrides.dayStartHour != null) { window.BKK.dayStartHour = overrides.dayStartHour; window.BKK.selectedCity.dayStartHour = overrides.dayStartHour; }
      if (overrides.nightStartHour != null) { window.BKK.nightStartHour = overrides.nightStartHour; window.BKK.selectedCity.nightStartHour = overrides.nightStartHour; }
    }
    setSelectedCityId(cityId);
    localStorage.setItem('city_explorer_city', cityId);
    
    // Reset form data for new city, but preserve user settings
    const firstArea = window.BKK.areaOptions[0]?.id || '';
    setFormData(prev => ({
      hours: 3, area: firstArea, interests: [], circular: true, startPoint: '',
      maxStops: prev.maxStops || 10, fetchMoreCount: prev.fetchMoreCount || 3, searchMode: 'area',
      radiusMeters: prev.radiusMeters || 500, radiusSource: 'gps', radiusPlaceId: null, radiusPlaceName: '',
      gpsLat: null, gpsLng: null, currentLat: null, currentLng: null
    }));
    setRoute(null);
    setWizardStep(1);
    endActiveTrail(); // End any active trail when starting new wizard
    if (!stayOnView) {
      setCurrentView('form');
      window.scrollTo(0, 0);
    }
    setDisabledStops([]);
    setShowRoutePreview(false);
    setShowRouteMenu(false);
    setManualStops([]);
    setCityModified(false);
    showToast(window.BKK.selectedCity.icon + ' ' + tLabel(window.BKK.selectedCity), 'success');
  };

  const switchLanguage = (lang) => {
    if (lang === currentLang) return;
    window.BKK.i18n.setLang(lang);
    setCurrentLang(lang);
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
      const names = interests.map(id => allInterestOptions.find(o => o.id === id)).filter(Boolean).map(o => tLabel(o) || o?.id || id).join(', ');
      addDebugLog('API', `No valid config for: ${names}`);
      console.warn('[DYNAMIC] No valid interests - all are missing search config:', names);
      return [];
    }
    
    if (validInterests.length < interests.length) {
      const skipped = interests.filter(id => !isInterestValid(id));
      const skippedNames = skipped.map(id => allInterestOptions.find(o => o.id === id)).filter(Boolean).map(o => tLabel(o) || o?.id || id).join(', ');
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
      
      // Check if this interest uses text search (Firebase config first, then city defaults)
      const textSearchQuery = config.textSearch || (window.BKK.textSearchInterests || {})[validInterests[0]] || '';
      
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
            locationBias: {
              circle: {
                center: {
                  latitude: center.lat,
                  longitude: center.lng
                },
                radius: searchRadius
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
                const interestNames = validInterests.map(id => allInterestOptions.find(o => o.id === id)).filter(Boolean).map(o => tLabel(o) || o?.id || id).join(', ');
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
            description: `⭐ ${place.rating?.toFixed(1) || 'N/A'} (${place.userRatingCount || 0} reviews)`,
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
      showToast(t('places.notEnoughInfo'), 'error');
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
        showToast(t('places.placeNotOnGoogle'), 'warning');
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
      showToast(t('toast.googleInfoError'), 'error');
      return null;
    } finally {
      setLoadingGoogleInfo(false);
    }
  };

  // Combine all interests: built-in + uncovered + custom (city-filtered)
  // Filter custom interests by city scope (must be before allInterestOptions)
  const cityCustomInterests = useMemo(() => {
    return (customInterests || []).filter(i => {
      if (i.scope === 'local') return (i.cityId || '') === selectedCityId;
      return true;
    });
  }, [customInterests, selectedCityId]);

  const allInterestOptions = useMemo(() => {
    return [...interestOptions, ...uncoveredInterests, ...(cityCustomInterests || [])].map(opt => {
      const config = interestConfig[opt.id];
      if (!config) return opt;
      return {
        ...opt,
        label: config.labelOverride || opt.label, labelEn: config.labelEnOverride || config.labelOverrideEn || opt.labelEn,
        icon: config.iconOverride || opt.icon,
        locked: config.locked !== undefined ? config.locked : opt.locked,
        scope: config.scope || opt.scope || 'global',
        cityId: config.cityId || opt.cityId || '',
        category: config.category || opt.category || 'attraction',
        weight: config.weight || opt.weight || sp.defaultInterestWeight,
        minStops: config.minStops != null ? config.minStops : (opt.minStops != null ? opt.minStops : 1),
        maxStops: config.maxStops || opt.maxStops || 10
      };
    });
  }, [interestOptions, uncoveredInterests, cityCustomInterests, interestConfig]);

  // Debug: log custom interests in allInterestOptions (only when debug mode is on)
  useEffect(() => {
    if (!debugMode) return;
    addDebugLog('INTEREST', `allInterestOptions.length=${allInterestOptions.length} cityCustomInterests.length=${(cityCustomInterests||[]).length} customInterests.length=${(customInterests||[]).length}`);
    addDebugLog('INTEREST', `allInterestOptions IDs: ${allInterestOptions.map(o=>o.id).join(', ')}`);
    const customs = allInterestOptions.filter(o => o.id?.startsWith?.('custom_') || o.custom);
    if (customs.length > 0) {
      addDebugLog('INTEREST', `${customs.length} custom found in allInterestOptions:`);
      customs.forEach(c => addDebugLog('INTEREST', `  - ${c.id}: "${c.label}" scope=${c.scope||'?'} privateOnly=${c.privateOnly} valid=${isInterestValid?.(c.id)}`));
    } else if ((customInterests||[]).length > 0) {
      addDebugLog('INTEREST', 'BUG: customInterests exist but NOT in allInterestOptions!');
      addDebugLog('INTEREST', 'cityCustomInterests: ' + JSON.stringify((cityCustomInterests||[]).map(c=>({id:c.id,label:c.label}))));
    }
  }, [customInterests, cityCustomInterests, allInterestOptions, debugMode]);
  useEffect(() => {
    // Don't save if data hasn't loaded yet - prevents overwriting saved interests with empty state
    if (!isDataLoaded) return;
    // Strip admin-controlled settings before saving — these come from Firebase, not localStorage
    const { maxStops, fetchMoreCount, ...userPrefs } = formData;
    localStorage.setItem('bangkok_preferences', JSON.stringify(userPrefs));
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
          showToast(`${t("toast.newVersionAvailable")} ${serverVersion}`, 'success');
        }
        return true;
      } else {
        if (!silent) showToast(t('toast.appUpToDate'), 'success');
        return false;
      }
    } catch (e) {
      console.log('[UPDATE] Check failed:', e);
      if (!silent) showToast(t('toast.cannotCheckUpdates'), 'error');
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
        locked: editingLocation.locked || false,
        areas: editingLocation.areas || (editingLocation.area ? [editingLocation.area] : [])
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
  }, [cityCustomInterests, allInterestOptions.length]);

  const areaMap = useMemo(() => {
    try {
      const map = {};
      if (areaOptions) areaOptions.forEach(o => { if (o && o.id) map[o.id] = o; });
      return map;
    } catch(e) { console.error('[MEMO] areaMap error:', e); return {}; }
  }, [areaOptions]);

  // City-filtered custom locations and saved routes
  const cityCustomLocations = useMemo(() => {
    return customLocations; // Already filtered per city by Firebase subscription
  }, [customLocations, selectedCityId]);

  const citySavedRoutes = useMemo(() => {
    return savedRoutes.filter(r => (r.cityId || 'bangkok') === selectedCityId);
  }, [savedRoutes, selectedCityId]);


  // Memoize expensive places grouping/sorting
  const groupedPlaces = useMemo(() => {
    try {
      if (!cityCustomLocations || cityCustomLocations.length === 0) {
        return { groups: {}, ungrouped: [], sortedKeys: [], activeCount: 0, blacklistedLocations: [], draftsLocations: [], readyLocations: [], draftsCount: 0, readyCount: 0, blacklistCount: 0 };
      }
      const draftsLocations = cityCustomLocations.filter(loc => loc.status !== 'blacklist' && !loc.locked);
      const readyLocations = cityCustomLocations.filter(loc => loc.status !== 'blacklist' && loc.locked);
      const blacklistedLocations = cityCustomLocations.filter(loc => loc.status === 'blacklist');
      
      // Choose which locations to group based on placesTab
      const tabLocations = placesTab === 'drafts' ? draftsLocations : placesTab === 'ready' ? readyLocations : blacklistedLocations;
      
      if (tabLocations.length === 0) return { groups: {}, ungrouped: [], sortedKeys: [], activeCount: draftsLocations.length + readyLocations.length, blacklistedLocations, draftsLocations, readyLocations, draftsCount: draftsLocations.length, readyCount: readyLocations.length, blacklistCount: blacklistedLocations.length };
      
      const groups = {};
      const ungrouped = [];
      
      tabLocations.forEach(loc => {
        if (placesGroupBy === 'interest') {
          const interests = (loc.interests || []).filter(i => i !== '_manual');
          if (interests.length === 0) {
            ungrouped.push(loc);
          } else {
            let hasValidInterest = false;
            interests.forEach(int => {
              if (interestMap[int]) {
                if (!groups[int]) groups[int] = [];
                groups[int].push(loc);
                hasValidInterest = true;
              }
            });
            if (!hasValidInterest) ungrouped.push(loc);
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
          return (tLabel(interestMap[a]) || a).localeCompare(tLabel(interestMap[b]) || b);
        } else {
          return (tLabel(areaMap[a]) || a).localeCompare(tLabel(areaMap[b]) || b);
        }
      });
      
      const sortWithin = (locs) => [...locs].sort((a, b) => {
        if (placesGroupBy === 'interest') {
          const aArea = tLabel(areaMap[(a.areas || [a.area])[0]]) || '';
          const bArea = tLabel(areaMap[(b.areas || [b.area])[0]]) || '';
          return aArea.localeCompare(bArea, 'he') || a.name.localeCompare(b.name, 'he');
        } else {
          return (a.interests?.[0] || '').localeCompare(b.interests?.[0] || '') || a.name.localeCompare(b.name, 'he');
        }
      });
      
      const sortedGroups = {};
      sortedKeys.forEach(key => { sortedGroups[key] = sortWithin(groups[key]); });
      const sortedUngrouped = sortWithin(ungrouped);
      
      return { groups: sortedGroups, ungrouped: sortedUngrouped, sortedKeys, activeCount: draftsLocations.length + readyLocations.length, blacklistedLocations, draftsLocations, readyLocations, draftsCount: draftsLocations.length, readyCount: readyLocations.length, blacklistCount: blacklistedLocations.length };
    } catch(e) {
      console.error('[MEMO] groupedPlaces error:', e);
      return { groups: {}, ungrouped: [], sortedKeys: [], activeCount: 0, blacklistedLocations: [], draftsLocations: [], readyLocations: [], draftsCount: 0, readyCount: 0, blacklistCount: 0 };
    }
  }, [cityCustomLocations, placesGroupBy, placesTab, interestMap, areaMap]);

  // Image handling - loaded from utils.js
  const uploadImage = window.BKK.uploadImage;
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showToast(t('places.selectImageFile'), 'error');
      return;
    }
    
    try {
      showToast(t('toast.uploadingImage'), 'info');
      const locationId = newLocation.id || 'loc_' + Date.now();
      const imageUrl = await uploadImage(file, selectedCityId, locationId);
      setNewLocation(prev => ({ ...prev, uploadedImage: imageUrl }));
      showToast(t('toast.imageUploaded'), 'success');
    } catch (error) {
      console.error('[IMAGE] Upload error:', error);
      showToast(t('toast.imageUploadError'), 'error');
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
      const removedNames = removed.map(id => allInterestOptions.find(o => o.id === id)).filter(Boolean).map(o => tLabel(o) || o?.id || id).join(', ');
      console.log('[CLEANUP] Removed invalid interests from selection:', removedNames);
      setFormData(prev => ({ ...prev, interests: cleaned }));
    }
  }, [interestConfig, cityCustomInterests, isDataLoaded]);

  // Button styles - loaded from utils.js

  const getStopsForInterests = () => {
    // Now we only collect CUSTOM locations - Google Places will be fetched in generateRoute
    const isRadiusMode = formData.searchMode === 'radius' || formData.searchMode === 'all';
    
    // Filter custom locations that match current city, area/radius and selected interests
    const matchingCustomLocations = customLocations.filter(loc => {
      // Filter by current city (locations without cityId are treated as 'bangkok')
      if ((loc.cityId || 'bangkok') !== selectedCityId) return false;
      
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

  // ========== SMART STOP SELECTION (for Yalla and "Help me plan") ==========
  // Returns { selected: [...], disabled: [...] } based on category/weight/minStops config
  const smartSelectStops = (stops, selectedInterests, maxTotal) => {
    maxTotal = maxTotal || formData.maxStops || 10;
    
    // Build per-interest config
    const cfg = {};
    let totalWeight = 0;
    for (const interestId of selectedInterests) {
      const interestObj = allInterestOptions.find(o => o.id === interestId);
      cfg[interestId] = {
        weight: interestObj?.weight || sp.defaultInterestWeight,
        minStops: interestObj?.minStops != null ? interestObj.minStops : 1,
        maxStops: interestObj?.maxStops || 10,
        category: interestObj?.category || 'attraction'
      };
      totalWeight += cfg[interestId].weight;
    }
    
    // Step 1: Guarantee minimums (capped by maxStops per interest)
    const limits = {};
    let allocated = 0;
    for (const id of selectedInterests) {
      const min = Math.min(cfg[id].minStops, cfg[id].maxStops, maxTotal - allocated);
      limits[id] = { max: min, category: cfg[id].category };
      allocated += min;
    }
    
    // Step 2: Distribute remaining by weight, respecting maxStops cap
    let remaining = maxTotal - allocated;
    if (remaining > 0 && totalWeight > 0) {
      // Multiple passes: allocate proportionally, redistribute overflow
      for (let pass = 0; pass < 3 && remaining > 0; pass++) {
        // Recalculate weight of interests that haven't hit their cap
        let activeWeight = 0;
        for (const id of selectedInterests) {
          if (limits[id].max < cfg[id].maxStops) activeWeight += cfg[id].weight;
        }
        if (activeWeight <= 0) break;
        
        for (const id of selectedInterests) {
          if (remaining <= 0) break;
          if (limits[id].max >= cfg[id].maxStops) continue; // already at cap
          const share = Math.floor((cfg[id].weight / activeWeight) * remaining);
          const canAdd = Math.min(share, cfg[id].maxStops - limits[id].max, remaining);
          limits[id].max += canAdd;
          allocated += canAdd;
          remaining = maxTotal - allocated;
        }
      }
      
      // Final: distribute any leftover 1-by-1 to highest weight (not at cap)
      remaining = maxTotal - allocated;
      const sorted = [...selectedInterests].sort((a, b) => cfg[b].weight - cfg[a].weight);
      for (const id of sorted) {
        if (remaining <= 0) break;
        if (limits[id].max >= cfg[id].maxStops) continue;
        limits[id].max += 1;
        remaining -= 1;
      }
    }
    
    console.log('[SMART] Interest limits:', JSON.stringify(limits));
    
    // Group stops by their primary matching interest
    const buckets = {};
    const unmatched = [];
    for (const id of selectedInterests) buckets[id] = [];
    
    for (const stop of stops) {
      const stopInterests = stop.interests || [];
      // Find first matching selected interest
      const matchingInterest = selectedInterests.find(id => stopInterests.includes(id));
      if (matchingInterest && buckets[matchingInterest]) {
        buckets[matchingInterest].push(stop);
      } else {
        unmatched.push(stop);
      }
    }
    
    // Sort each bucket: custom/pinned first, then by time match, then by rating
    const timeMode = getEffectiveTimeMode(); // 'day' or 'night'
    
    // Get a stop's preferred time from its interest config
    const getStopBestTime = (stop) => {
      if (stop.bestTime) return stop.bestTime;
      const stopInterests = stop.interests || [];
      for (const id of stopInterests) {
        // Check interestConfig (user-defined)
        const iCfg = interestConfig[id];
        if (iCfg?.bestTime && iCfg.bestTime !== 'anytime') return iCfg.bestTime;
      }
      // Check slotConfig defaults
      const defaultTimes = {
        temples: 'day', galleries: 'day', architecture: 'day', parks: 'day',
        beaches: 'day', graffiti: 'day', artisans: 'day', canals: 'day',
        culture: 'day', history: 'day', markets: 'day', shopping: 'day',
        nightlife: 'night', bars: 'night', rooftop: 'night', entertainment: 'night'
      };
      for (const id of stopInterests) {
        if (defaultTimes[id]) return defaultTimes[id];
      }
      return 'anytime';
    };
    
    // Time score: matching=sp.timeScoreMatch, anytime=sp.timeScoreAnytime, conflicting=sp.timeScoreConflict
    const timeScore = (stop) => {
      const bt = getStopBestTime(stop);
      if (bt === 'anytime') return sp.timeScoreAnytime;
      return bt === timeMode ? sp.timeScoreMatch : sp.timeScoreConflict;
    };
    
    const stopScore = (s) => (s.rating || 0) * Math.log10((s.ratingCount || 0) + 1);
    for (const id of selectedInterests) {
      buckets[id].sort((a, b) => {
        // Custom (user-added) locations get priority
        const aCustom = a.source === 'custom' || a.custom ? 1 : 0;
        const bCustom = b.source === 'custom' || b.custom ? 1 : 0;
        if (aCustom !== bCustom) return bCustom - aCustom;
        // Time match: prefer stops matching current time of day
        const aTime = timeScore(a);
        const bTime = timeScore(b);
        if (aTime !== bTime) return bTime - aTime;
        // Rating
        return stopScore(b) - stopScore(a);
      });
    }
    
    console.log(`[SMART] Time mode: ${timeMode}, sorting buckets by time preference`);
    
    // Pick top N from each bucket
    const selected = [];
    const disabled = [];
    
    for (const interestId of selectedInterests) {
      const bucket = buckets[interestId];
      const limit = limits[interestId].max;
      selected.push(...bucket.slice(0, limit));
      disabled.push(...bucket.slice(limit));
    }
    disabled.push(...unmatched);
    
    // If we have room, fill from best disabled stops (prefer time-matching)
    if (selected.length < maxTotal && disabled.length > 0) {
      disabled.sort((a, b) => {
        const aTime = timeScore(a);
        const bTime = timeScore(b);
        if (aTime !== bTime) return bTime - aTime;
        return stopScore(b) - stopScore(a);
      });
      const extra = disabled.splice(0, maxTotal - selected.length);
      selected.push(...extra);
    }
    
    // Smart ordering: category determines position in day
    // attraction/nature early, shopping mid, break/meal interspersed, experience last
    const categoryPosition = { attraction: 1, nature: 2, shopping: 3, experience: 4, meal: 5, break: 6 };
    const getCategory = (stop) => {
      const stopInterests = stop.interests || [];
      for (const id of selectedInterests) {
        if (stopInterests.includes(id) && limits[id]) return limits[id].category;
      }
      return 'attraction';
    };
    
    // Separate by role
    const attractions = selected.filter(s => ['attraction', 'nature', 'shopping'].includes(getCategory(s)));
    const breaks = selected.filter(s => getCategory(s) === 'break');
    const meals = selected.filter(s => getCategory(s) === 'meal');
    const experiences = selected.filter(s => getCategory(s) === 'experience');
    
    // Build ordered route: attractions with breaks/meals interspersed
    const ordered = [];
    let attractionIdx = 0;
    const totalAttractions = attractions.length;
    
    // Insert break roughly 1/3 into attractions, meal at 2/3
    const breakAt = Math.max(1, Math.floor(totalAttractions / 3));
    const mealAt = Math.max(2, Math.floor(totalAttractions * 2 / 3));
    
    for (let i = 0; i < totalAttractions; i++) {
      ordered.push(attractions[i]);
      if (i === breakAt - 1 && breaks.length > 0) ordered.push(...breaks);
      if (i === mealAt - 1 && meals.length > 0) ordered.push(...meals);
    }
    
    // If no attractions but we have breaks/meals, add them
    if (totalAttractions === 0) {
      ordered.push(...breaks, ...meals);
    }
    
    // Experiences at the end
    ordered.push(...experiences);
    
    console.log('[SMART] Selected:', ordered.length, '| Disabled:', disabled.length);
    console.log('[SMART] Order:', ordered.map(s => `${s.name} [${getCategory(s)}]`).join(' → '));
    
    return { selected: ordered, disabled };
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
    
    // --- Step 3: Content-aware reordering ---
    // Adjust order so route feels natural: cafes at start/end, food in middle, no same-category neighbors
    if (ordered.length >= 4) {
      // Default slot config — overridden by interestConfig when available
      const defaultSlotConfig = {
        cafes:         { slot: 'bookend', minGap: 3, time: 'anytime' },
        food:          { slot: 'middle',  minGap: 3, time: 'anytime' },
        restaurants:   { slot: 'middle',  minGap: 3, time: 'anytime' },
        markets:       { slot: 'early',   minGap: 2, time: 'day' },
        shopping:      { slot: 'early',   minGap: 2, time: 'day' },
        temples:       { slot: 'any',     minGap: 1, time: 'day' },
        galleries:     { slot: 'any',     minGap: 1, time: 'day' },
        architecture:  { slot: 'any',     minGap: 1, time: 'day' },
        parks:         { slot: 'early',   minGap: 1, time: 'day' },
        beaches:       { slot: 'early',   minGap: 2, time: 'day' },
        graffiti:      { slot: 'any',     minGap: 1, time: 'day' },
        artisans:      { slot: 'any',     minGap: 1, time: 'day' },
        canals:        { slot: 'any',     minGap: 1, time: 'day' },
        culture:       { slot: 'any',     minGap: 1, time: 'day' },
        history:       { slot: 'any',     minGap: 1, time: 'day' },
        nightlife:     { slot: 'end',     minGap: 2, time: 'night' },
        rooftop:       { slot: 'end',     minGap: 2, time: 'night' },
        bars:          { slot: 'end',     minGap: 2, time: 'night' },
        entertainment: { slot: 'late',    minGap: 2, time: 'night' },
      };
      
      // Merge with interestConfig (user-defined values override defaults)
      const slotConfig = {};
      Object.keys(defaultSlotConfig).forEach(k => { slotConfig[k] = { ...defaultSlotConfig[k] }; });
      if (typeof interestConfig === 'object') {
        Object.entries(interestConfig).forEach(([id, cfg]) => {
          if (cfg.routeSlot || cfg.minGap || cfg.bestTime) {
            if (!slotConfig[id]) slotConfig[id] = { slot: 'any', minGap: 1, time: 'anytime' };
            if (cfg.routeSlot && cfg.routeSlot !== 'any') slotConfig[id].slot = cfg.routeSlot;
            if (cfg.minGap) slotConfig[id].minGap = cfg.minGap;
            if (cfg.bestTime && cfg.bestTime !== 'anytime') slotConfig[id].time = cfg.bestTime;
          }
        });
      }
      
      // Time-of-day compatibility scoring (simplified: day vs night)
      const timeMode = getEffectiveTimeMode();
      const timeCompat = (stopTime) => {
        if (!stopTime || stopTime === 'anytime') return 0;
        if (stopTime === timeMode) return 0;
        return sp.timeConflictPenalty;
      };
      
      const n = ordered.length;
      const getCategory = (stop) => {
        const cats = stop.interests || [];
        return cats.find(c => slotConfig[c]) || cats[0] || 'other';
      };
      const getStopTime = (stop) => {
        // Per-stop override (from bestTime field) takes priority
        if (stop.bestTime) return stop.bestTime;
        const cat = getCategory(stop);
        return slotConfig[cat]?.time || 'anytime';
      };
      
      // Score how well a stop fits its position (lower = better)
      const slotScore = (cat, pos) => {
        const cfg = slotConfig[cat];
        if (!cfg) return 0;
        const pct = n > 1 ? pos / (n - 1) : 0.5;
        switch (cfg.slot) {
          case 'bookend': return Math.min(pct, 1 - pct) * sp.slotEndPenaltyMultiplier;
          case 'early': return pct < sp.slotEarlyThreshold ? 0 : (pct - sp.slotEarlyThreshold) * sp.slotPenaltyMultiplier;
          case 'middle': return Math.abs(pct - 0.5) * sp.slotPenaltyMultiplier;
          case 'late': return pct > sp.slotLateThreshold ? 0 : (sp.slotLateThreshold - pct) * sp.slotPenaltyMultiplier;
          case 'end': return pct > sp.slotEndThreshold ? 0 : (sp.slotEndThreshold - pct) * sp.slotEndPenaltyMultiplier;
          default: return 0;
        }
      };
      
      // Penalty for same-category adjacency
      const gapPenalty = (arr) => {
        let penalty = 0;
        for (let i = 0; i < arr.length; i++) {
          const cat = getCategory(arr[i]);
          const cfg = slotConfig[cat];
          const minGap = cfg?.minGap || 1;
          for (let j = 1; j <= Math.min(minGap, i); j++) {
            if (getCategory(arr[i - j]) === cat) {
              penalty += (minGap - j + 1) * sp.gapPenaltyMultiplier;
            }
          }
        }
        return penalty;
      };
      
      // Total content penalty (includes time-of-day)
      const contentPenalty = (arr) => {
        let p = 0;
        for (let i = 0; i < arr.length; i++) {
          p += slotScore(getCategory(arr[i]), i);
          p += timeCompat(getStopTime(arr[i])); // Time mismatch penalty
        }
        p += gapPenalty(arr);
        return p;
      };
      
      // Geographic distance of the order
      const geoDist = (arr) => totalDist(arr);
      const baseGeo = geoDist(ordered);
      const basePenalty = contentPenalty(ordered);
      
      // Only apply if there are actual content issues
      if (basePenalty > 0.5) {
        // Try targeted swaps that improve content without too much geographic cost
        let contentImproved = true;
        let contentPasses = 0;
        const maxContentPasses = sp.maxContentPasses;
        
        while (contentImproved && contentPasses < maxContentPasses) {
          contentImproved = false;
          contentPasses++;
          for (let i = 0; i < ordered.length; i++) {
            for (let j = i + 1; j < ordered.length; j++) {
              const curPenalty = contentPenalty(ordered);
              // Try swap
              [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
              const newPenalty = contentPenalty(ordered);
              const newGeo = geoDist(ordered);
              const geoIncrease = (newGeo - baseGeo) / Math.max(baseGeo, 1);
              
              // Accept if content improves by more than geographic cost
              if (newPenalty < curPenalty - 0.3 && geoIncrease < 0.25) {
                contentImproved = true;
                // Keep swap
              } else {
                // Revert
                [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
              }
            }
          }
        }
        
        const finalPenalty = contentPenalty(ordered);
        const finalGeo = geoDist(ordered);
        console.log(`[CONTENT-REORDER] mode=${timeMode}, ${contentPasses} passes, penalty ${basePenalty.toFixed(1)} → ${finalPenalty.toFixed(1)}, distance ${Math.round(baseGeo)}m → ${Math.round(finalGeo)}m`);
      }
    }
    
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
        const cityCenter = window.BKK.selectedCity?.center || window.BKK.activeCityData?.center || { lat: 0, lng: 0 };
        const cityRadius = window.BKK.selectedCity?.allCityRadius || 15000;
        const cityName = tLabel(window.BKK.selectedCity) || t('general.allCity');
        const allCityLabel = t('general.all') + ' ' + cityName;
        setFormData(prev => ({...prev, currentLat: cityCenter.lat, currentLng: cityCenter.lng, radiusMeters: cityRadius, radiusPlaceName: allCityLabel}));
        formData.currentLat = cityCenter.lat;
        formData.currentLng = cityCenter.lng;
        formData.radiusMeters = cityRadius;
        formData.radiusPlaceName = allCityLabel;
      }
    }
    
    if (isRadiusMode) {
      if (!formData.currentLat || !formData.currentLng) {
        showToast(t('form.findLocationFirst'), 'warning');
        return;
      }
      if (formData.interests.length === 0) {
        showToast(t('form.selectAtLeastOneInterest'), 'warning');
        return;
      }
    } else {
      if (!formData.area || formData.interests.length === 0) {
        showToast(t('form.selectAreaAndInterest'), 'warning');
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
      console.log('[ROUTE] Selected interests:', JSON.stringify(formData.interests));
      console.log('[ROUTE] Area:', formData.area, '| SearchMode:', formData.searchMode);
      
      // Get custom locations (always included)
      const customStops = getStopsForInterests();
      addDebugLog('ROUTE', `Found ${customStops.length} custom stops`);
      console.log('[ROUTE] Custom stops:', customStops.length, customStops.map(s => `${s.name} [${(s.interests||[]).join(',')}]`));
      
      // Calculate stops needed per interest using category-based maxStops
      const maxStops = formData.maxStops || 10;
      
      // Build per-interest stop limits using weight + min + max
      const interestLimits = {};
      let totalWeight = 0;
      const interestCfg = {};
      for (const interest of formData.interests) {
        const interestObj = allInterestOptions.find(o => o.id === interest);
        interestCfg[interest] = {
          weight: interestObj?.weight || sp.defaultInterestWeight,
          minStops: interestObj?.minStops != null ? interestObj.minStops : 1,
          maxStops: interestObj?.maxStops || 10
        };
        totalWeight += interestCfg[interest].weight;
      }
      
      // Step 1: Guarantee minimums
      let allocated = 0;
      for (const interest of formData.interests) {
        const min = Math.min(interestCfg[interest].minStops, interestCfg[interest].maxStops, maxStops - allocated);
        interestLimits[interest] = min;
        allocated += min;
      }
      
      // Step 2: Distribute remaining by weight, respecting maxStops cap
      let remaining = maxStops - allocated;
      if (remaining > 0 && totalWeight > 0) {
        for (let pass = 0; pass < 3 && remaining > 0; pass++) {
          let activeWeight = 0;
          for (const interest of formData.interests) {
            if (interestLimits[interest] < interestCfg[interest].maxStops) activeWeight += interestCfg[interest].weight;
          }
          if (activeWeight <= 0) break;
          
          for (const interest of formData.interests) {
            if (remaining <= 0) break;
            if (interestLimits[interest] >= interestCfg[interest].maxStops) continue;
            const share = Math.floor((interestCfg[interest].weight / activeWeight) * remaining);
            const canAdd = Math.min(share, interestCfg[interest].maxStops - interestLimits[interest], remaining);
            interestLimits[interest] += canAdd;
            allocated += canAdd;
            remaining = maxStops - allocated;
          }
        }
        
        remaining = maxStops - allocated;
        const sorted = [...formData.interests].sort((a, b) => interestCfg[b].weight - interestCfg[a].weight);
        for (const interest of sorted) {
          if (remaining <= 0) break;
          if (interestLimits[interest] >= interestCfg[interest].maxStops) continue;
          interestLimits[interest] += 1;
          remaining -= 1;
        }
      }
      
      console.log('[ROUTE] Interest limits:', JSON.stringify(interestLimits), '| total max:', maxStops);
      
      // Track results per interest for smart completion
      const interestResults = {};
      const allStops = []; // Build this respecting limits
      let fetchErrors = [];
      
      // Clear Google cache for fresh route generation
      googleCacheRef.current = {};
      
      // ROUND 1: Fill from custom locations first (up to limit), then API for gaps
      for (const interest of formData.interests) {
        const stopsForThisInterest = interestLimits[interest] || 2;
        
        // Get custom stops for this interest, sorted by rating
        const customStopsForInterest = customStops.filter(stop => 
          stop.interests && stop.interests.includes(interest)
        );
        
        // Take only up to the limit from custom stops
        const customToUse = customStopsForInterest.slice(0, stopsForThisInterest);
        // Add custom stops that aren't already in allStops
        for (const cs of customToUse) {
          if (!allStops.some(s => s.name.toLowerCase().trim() === cs.name.toLowerCase().trim())) {
            allStops.push(cs);
          }
        }
        
        const neededFromApi = Math.max(0, stopsForThisInterest - customToUse.length);
        
        if (neededFromApi > 0) {
          // Check if this is a private-only interest (no Google API calls)
          const interestObj = allInterestOptions.find(o => o.id === interest);
          const interestPrivateOnly = interestObj?.privateOnly || false;
          
          let fetchedPlaces = [];
          
          if (interestPrivateOnly) {
            console.log(`[ROUTE] Skipping API for private interest: ${interest}`);
          } else {
          try {
            console.log(`[ROUTE] Fetching for interest: ${interest} (need ${neededFromApi}, have ${customToUse.length} custom)`);
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
          const sortedPlaces = sortedAll.slice(0, neededFromApi);
          const cachedPlaces = sortedAll.slice(neededFromApi);
          
          // Store unused places in cache for "find more"
          googleCacheRef.current[interest] = cachedPlaces;
          console.log(`[CACHE] Stored ${cachedPlaces.length} unused places for ${interest}`);
          
          // Track results
          interestResults[interest] = {
            requested: stopsForThisInterest,
            custom: customToUse.length,
            fetched: sortedPlaces.length,
            total: customToUse.length + sortedPlaces.length,
            allPlaces: sortedAll // Keep all for round 2
          };
          
          // Add to allStops
          allStops.push(...sortedPlaces);
        } else {
          // Already have enough from custom - no API call needed!
          console.log(`[ROUTE] Skipping API for ${interest}: ${customToUse.length} custom stops suffice`);
          googleCacheRef.current[interest] = []; // Empty cache
          interestResults[interest] = {
            requested: stopsForThisInterest,
            custom: customToUse.length,
            fetched: 0,
            total: customToUse.length,
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
      // BUT respect per-interest maxStops caps
      const totalFound = uniqueStops.length;
      const missing = maxStops - totalFound;
      
      console.log('[ROUTE] Round 1 complete:', { totalFound, maxStops, missing });
      
      if (missing > 0) {
        // Count how many stops we already have per interest
        const currentCountPerInterest = {};
        for (const interest of formData.interests) currentCountPerInterest[interest] = 0;
        for (const stop of uniqueStops) {
          for (const interest of formData.interests) {
            if (stop.interests?.includes(interest)) {
              currentCountPerInterest[interest] = (currentCountPerInterest[interest] || 0) + 1;
            }
          }
        }
        
        const additionalPlaces = [];
        
        for (const interest of formData.interests) {
          const result = interestResults[interest];
          const alreadyUsed = result.fetched;
          const available = result.allPlaces.length;
          const canAddMore = available - alreadyUsed;
          
          // Respect per-interest maxStops cap
          const interestMax = interestCfg[interest].maxStops;
          const currentCount = currentCountPerInterest[interest] || 0;
          const roomLeft = Math.max(0, interestMax - currentCount);
          
          if (canAddMore > 0 && roomLeft > 0) {
            const ratingSort = (a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1));
            const distSort = (a, b) => calcDistance(formData.currentLat, formData.currentLng, a.lat, a.lng) - calcDistance(formData.currentLat, formData.currentLng, b.lat, b.lng);
            const morePlaces = result.allPlaces
              .sort(isRadiusMode ? distSort : ratingSort)
              .slice(alreadyUsed, alreadyUsed + Math.min(canAddMore, roomLeft));
            
            additionalPlaces.push(...morePlaces);
            console.log(`[ROUTE R2] ${interest}: adding ${morePlaces.length} (current: ${currentCount}, max: ${interestMax})`);
          } else if (canAddMore > 0) {
            console.log(`[ROUTE R2] ${interest}: skipped, already at max (${currentCount}/${interestMax})`);
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
        showToast(`${t("toast.errorsGettingPlaces")} ${errorMsg}`, 'warning');
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
          ? t('places.noPlacesInRadius') 
          : t('places.noMatchingPlaces'), 'error');
        setIsGenerating(false);
        return;
      }

      // Route name and area info
      let areaName, interestsText;
      if (isRadiusMode) {
        const allCityLabel = t('general.all') + ' ' + (tLabel(window.BKK.selectedCity) || t('general.city'));
        if (formData.searchMode === 'all' || formData.radiusPlaceName === allCityLabel || formData.radiusPlaceName === t('general.allCity')) {
          areaName = allCityLabel;
        } else {
          const sourceName = formData.radiusSource === 'myplace' && formData.radiusPlaceId
            ? customLocations.find(l => l.id === formData.radiusPlaceId)?.name || t('form.myPlace')
            : formData.radiusPlaceName || t('form.currentLocation');
          areaName = `${formData.radiusMeters}m - ${sourceName}`;
        }
      } else {
        const selectedArea = areaOptions.find(a => a.id === formData.area);
        areaName = tLabel(selectedArea) || t('general.allCity');
      }
      interestsText = formData.interests
        .map(id => allInterestOptions.filter(o => o && o.id).find(o => o.id === id)).map(o => o ? tLabel(o) : null)
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
        title: `${areaName} - ${uniqueStops.length} ${t("route.places")}`,
        description: `Route ${routeType === 'circular' ? t('route.circular') : t('route.linear')}`,
        duration: formData.hours, // Keep for backward compatibility but not displayed
        circular: routeType === 'circular',
        startPoint: (startPointCoords?.address) || formData.startPoint || t('form.startPointFirst'),
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
      
      // Load review averages for locked custom places
      const lockedNames = newRoute.stops
        .filter(s => s.custom && (s.locked || customLocations.find(cl => cl.name === s.name)?.locked))
        .map(s => s.name);
      if (lockedNames.length > 0) loadReviewAverages(lockedNames);
      
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
      
      // Scroll to results (or top in wizard mode for Yalla button)
      setTimeout(() => {
        if (wizardMode) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          document.getElementById('route-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      // Stay in form view to show compact list
    } catch (error) {
      console.error('[ROUTE] Fatal error generating route:', error);
      showToast(`${t('general.error')}: ${error.message || t('general.unknownError')}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Recompute route for map — returns data for immediate use (avoids React state timing issues)
  // When skipSmartSelect=true, respects current disabledStops (for user manual changes)
  // Thin wrapper for backward compatibility — delegates to runSmartPlan
  // Uses routeTypeRef to avoid stale closures in useEffect/setTimeout
  const recomputeForMap = (overrideStart, overrideType, skipSmartSelect) => {
    const type = overrideType !== undefined ? overrideType : routeTypeRef.current;
    return runSmartPlan({ overrideStart, overrideType: type, skipSmartSelect });
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
        source = t('general.fromMyPlaces');
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
          source = source ? `${source} + ${t("places.fromGoogleCache")}` : t('places.fromGoogle');
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
        source = source ? `${source} + ${t("places.fromGoogle")}` : t('places.fromGoogle');
        console.log(`[FETCH_MORE] Got ${fromApi.length} from API, cached ${googleCacheRef.current[interest].length}`);
        } // end if !isPrivate
      }
      
      if (placesToAdd.length === 0) {
        showToast(`${t("toast.noMoreInInterest")} ${interestLabel}`, 'warning');
        return;
      }
      
      const updatedRoute = {
        ...route,
        stops: [...route.stops, ...placesToAdd], optimized: false
      };
      
      setRoute(updatedRoute);
      showToast(`${placesToAdd.length} ${t("toast.addedMorePlaces")} ${interestLabel} (${source})`, 'success');
      
    } catch (error) {
      console.error('[FETCH_MORE] Error:', error);
      showToast(t('toast.addPlacesError'), 'error');
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
        showToast(t('places.noMorePlaces'), 'warning');
        return;
      }
      
      const updatedRoute = {
        ...route,
        stops: [...route.stops, ...allNewPlaces], optimized: false
      };
      
      setRoute(updatedRoute);
      
      // Build source message
      const sources = [];
      if (fromCustom > 0) sources.push(`${fromCustom} ${t("general.fromMyPlaces")}`);
      if (fromCache > 0) sources.push(`${fromCache} ${t("places.fromGoogleCache")}`);
      if (fromApi > 0) sources.push(`${fromApi} ${t("places.fromGoogle")}`);
      showToast(`${allNewPlaces.length} ${t("route.places")} (${sources.join(', ')})`, 'success');
      
      setTimeout(() => {
        document.getElementById('route-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('[FETCH_MORE_ALL] Error:', error);
      showToast(t('toast.addPlacesError'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter blacklisted places
  // Filter out places that exist in custom locations with status='blacklist' (exact name match)
  const filterBlacklist = (places) => {
    const blacklistedNames = customLocations
      .filter(loc => loc.status === 'blacklist' && (loc.cityId || 'bangkok') === selectedCityId)
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
      .filter(loc => loc.status !== 'blacklist' && (loc.cityId || 'bangkok') === selectedCityId)
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

  // Strip heavy data (base64 images) from route before save - keep Storage URLs
  const stripRouteForStorage = (r) => {
    const stripped = { ...r };
    if (stripped.stops) {
      stripped.stops = stripped.stops.map(s => {
        const clean = { ...s };
        // Remove base64 images
        if (clean.uploadedImage && clean.uploadedImage.startsWith('data:')) {
          delete clean.uploadedImage;
        }
        // Remove large Firebase Storage URLs from stops (they're in customLocations)
        if (clean.uploadedImage && clean.uploadedImage.length > 200) {
          delete clean.uploadedImage;
        }
        // Remove imageUrls array from stops (they're in customLocations)
        delete clean.imageUrls;
        return clean;
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
      showToast(t('toast.storageFull'), 'error');
    }
  };

  const quickSaveRoute = () => {
    const name = route.defaultName || route.name || `Route ${Date.now()}`;
    
    const routeToSave = {
      ...route,
      name: name,
      notes: '',
      savedAt: new Date().toISOString(),
      locked: false,
      cityId: selectedCityId
    };

    if (isFirebaseAvailable && database) {
      const stripped = stripRouteForStorage(routeToSave);
      database.ref(`cities/${selectedCityId}/routes`).push(stripped)
        .then((ref) => {
          console.log('[FIREBASE] Route saved');
          const savedWithFbId = { ...routeToSave, firebaseId: ref.key };
          setRoute(savedWithFbId);
          setEditingRoute({...savedWithFbId});
          setRouteDialogMode('add');
          setShowRouteDialog(true);
          showToast(t('route.routeSaved'), 'success');
        })
        .catch((error) => {
          console.error('[FIREBASE] Error saving route:', error);
          showToast(t('toast.routeSaveError'), 'error');
        });
    } else {
      const updated = [routeToSave, ...savedRoutes];
      setSavedRoutes(updated);
      saveRoutesToStorage(updated);
      setRoute(routeToSave);
      showToast(t('route.routeSaved'), 'success');
      setEditingRoute({...routeToSave});
      setRouteDialogMode('add');
      setShowRouteDialog(true);
    }
  };

  const deleteRoute = (routeId) => {
    if (isFirebaseAvailable && database) {
      const routeToDelete = savedRoutes.find(r => r.id === routeId);
      if (routeToDelete && routeToDelete.firebaseId) {
        database.ref(`cities/${selectedCityId}/routes/${routeToDelete.firebaseId}`).remove()
          .then(() => {
            console.log('[FIREBASE] Route deleted');
            showToast(t('route.routeDeleted'), 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error deleting route:', error);
            showToast(t('toast.deleteError'), 'error');
          });
      }
    } else {
      const updated = savedRoutes.filter(r => r.id !== routeId);
      setSavedRoutes(updated);
      saveRoutesToStorage(updated);
      showToast(t('route.routeDeleted'), 'success');
    }
  };

  const updateRoute = (routeId, updates) => {
    if (isFirebaseAvailable && database) {
      const routeToUpdate = savedRoutes.find(r => r.id === routeId);
      if (routeToUpdate && routeToUpdate.firebaseId) {
        database.ref(`cities/${selectedCityId}/routes/${routeToUpdate.firebaseId}`).update(updates)
          .then(() => {
            console.log('[FIREBASE] Route updated');
            showToast(t('route.routeUpdated'), 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error updating route:', error);
            showToast(t('toast.updateError'), 'error');
          });
      }
    } else {
      const updated = savedRoutes.map(r => r.id === routeId ? { ...r, ...updates } : r);
      setSavedRoutes(updated);
      saveRoutesToStorage(updated);
      showToast(t('route.routeUpdated'), 'success');
    }
  };

  const loadSavedRoute = (savedRoute) => {
    setRoute(savedRoute);
    // Restore startPoint: prefer startPointCoords.address (validated), then route.startPoint, then preferences
    const coords = savedRoute.startPointCoords || null;
    const validatedAddress = coords?.address || '';
    const startPointText = validatedAddress || 
      (savedRoute.startPoint !== t('form.startPointFirst') ? savedRoute.startPoint : '') || 
      '';
    setFormData({...savedRoute.preferences, startPoint: startPointText });
    setStartPointCoords(coords);
    // Restore route type (circular/linear)
    setRouteType(savedRoute.circular ? 'circular' : 'linear');
    setCurrentView('form');
    window.scrollTo(0, 0);
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
              showToast(`${t("toast.interestDeletedWithPlaces")} (${locationsUsingInterest.length})`, 'success');
            } else {
              showToast(t('interests.interestDeleted'), 'success');
            }
          })
          .catch((error) => {
            console.error('[FIREBASE] Error deleting interest:', error);
            showToast(t('toast.deleteError'), 'error');
          });
      }
    } else {
      // STATIC MODE: localStorage (local)
      const updated = customInterests.filter(i => i.id !== interestId);
      setCustomInterests(updated);
      localStorage.setItem('bangkok_custom_interests', JSON.stringify(updated));
      
      if (locationsUsingInterest.length > 0) {
        showToast(`${t("toast.interestDeletedWithPlaces")} (${locationsUsingInterest.length})`, 'success');
      } else {
        showToast(t('interests.interestDeleted'), 'success');
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
        showToast(t('interests.interestsReset'), 'success');
      } catch (err) {
        console.error('Error resetting interest status:', err);
        showToast(t('toast.resetError'), 'error');
      }
    } else {
      localStorage.removeItem('bangkok_interest_status');
      const builtInIds = interestOptions.map(i => i.id);
      const uncoveredIds = uncoveredInterests.map(i => i.id || i.name.replace(/\s+/g, '_').toLowerCase());
      const defaultStatus = {};
      builtInIds.forEach(id => { defaultStatus[id] = true; });
      uncoveredIds.forEach(id => { defaultStatus[id] = false; });
      setInterestStatus(defaultStatus);
      showToast(t('interests.interestsReset'), 'success');
    }
  };

  // Check if interest has valid search config
  const isInterestValid = (interestId) => {
    // 1. Manual (privateOnly) interests are ALWAYS valid - no search config needed
    const interestObj = allInterestOptions.find(o => o.id === interestId);
    if (interestObj?.privateOnly) return true;
    const rawCustom = customInterests.find(o => o.id === interestId);
    if (rawCustom?.privateOnly) return true;
    
    // 2. Non-manual interests need search config (types or textSearch)
    // Check custom interestConfig
    const config = interestConfig[interestId];
    if (config) {
      if (config.textSearch && config.textSearch.trim()) return true;
      if (config.types && Array.isArray(config.types) && config.types.length > 0) return true;
    }
    
    // Check city's built-in search config
    const cityPlaces = window.BKK.interestToGooglePlaces || {};
    const cityTextSearch = window.BKK.textSearchInterests || {};
    if (cityPlaces[interestId] && cityPlaces[interestId].length > 0) return true;
    if (cityTextSearch[interestId]) return true;
    
    return false;
  };

  // Check if location has all required data
  const isLocationValid = (loc) => {
    if (!loc) return false;
    // Must have name
    if (!loc.name || !loc.name.trim()) return false;
    // Note: interests and coordinates are optional - location is still valid without them
    // (it just won't appear in route calculation, but will show in "my places")
    return true;
  };

  const deleteCustomLocation = (locationId) => {
    const locationToDelete = customLocations.find(loc => loc.id === locationId);
    
    // Delete from Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      if (locationToDelete && locationToDelete.firebaseId) {
        database.ref(`cities/${selectedCityId}/locations/${locationToDelete.firebaseId}`).remove()
          .then(() => {
            console.log('[FIREBASE] Location deleted from shared database');
            showToast(t('places.placeDeleted'), 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error deleting location:', error);
            showToast(t('toast.deleteError'), 'error');
          });
      }
    } else {
      // STATIC MODE: localStorage (local)
      const updated = customLocations.filter(loc => loc.id !== locationId);
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(t('places.placeDeleted'), 'success');
    }
  };
  
  // Toggle location status with review state
  const toggleLocationStatus = (locationId) => {
    const location = customLocations.find(loc => loc.id === locationId);
    if (!location) return;
    
    let newStatus = location.status;
    
    if (location.status === 'blacklist') {
      newStatus = 'review';
    } else if (location.status === 'review') {
      newStatus = 'active';
    } else {
      newStatus = 'blacklist';
    }
    
    // Update in Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared)
      if (location.firebaseId) {
        database.ref(`cities/${selectedCityId}/locations/${location.firebaseId}`).update({
          status: newStatus
        })
          .then(() => {
            const statusText = 
              newStatus === 'blacklist' ? t('route.skipPermanently') : 
              newStatus === 'review' ? t('general.underReview') : 
              t('general.included');
            showToast(`${location.name}: ${statusText}`, 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error updating status:', error);
            showToast(t('toast.updateError'), 'error');
          });
      }
    } else {
      // STATIC MODE: localStorage (local)
      const updated = customLocations.map(loc => {
        if (loc.id === locationId) {
          return { ...loc, status: newStatus };
        }
        return loc;
      });
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      
      const statusText = 
        newStatus === 'blacklist' ? t('route.skipPermanently') : 
        newStatus === 'review' ? t('general.underReview') : 
        t('general.included');
      showToast(`${location.name}: ${statusText}`, 'success');
    }
  };
  
  // Handle edit location - populate form with existing data
  // === PLACE REVIEWS ===
  
  const loadReviewAverages = async (placeNames) => {
    try {
      const db = (typeof window.firebase !== 'undefined' && window.firebase.apps?.length) ? window.firebase.database() : null;
      if (!db || !placeNames.length) return;
      const cityId = window.BKK.selectedCityId || 'bangkok';
      const avgs = {};
      for (const name of placeNames) {
        const placeKey = (name || '').replace(/[.#$/\\[\]]/g, '_');
        try {
          const snap = await db.ref(`cities/${cityId}/reviews/${placeKey}`).once('value');
          const data = snap.val();
          if (data) {
            const ratings = Object.values(data).map(r => r.rating).filter(r => r > 0);
            if (ratings.length > 0) {
              avgs[placeKey] = { avg: ratings.reduce((a, b) => a + b, 0) / ratings.length, count: ratings.length };
            }
          }
        } catch (e) { /* skip individual errors */ }
      }
      if (Object.keys(avgs).length > 0) {
        setReviewAverages(prev => ({ ...prev, ...avgs }));
      }
    } catch (e) {
      console.error('[REVIEWS] Load averages error:', e);
    }
  };

  const openReviewDialog = async (place) => {
    const cityId = window.BKK.selectedCityId || 'bangkok';
    const placeKey = (place.name || '').replace(/[.#$/\[\]]/g, '_');
    const visitorId = window.BKK.visitorId || 'anonymous';
    
    // Load existing reviews from Firebase
    let reviews = [];
    try {
      const db = (typeof window.firebase !== 'undefined' && window.firebase.apps?.length) ? window.firebase.database() : null;
      if (db) {
        const snap = await db.ref(`cities/${cityId}/reviews/${placeKey}`).once('value');
        const data = snap.val();
        if (data) {
          reviews = Object.entries(data).map(([uid, r]) => ({
            odvisitorId: uid,
            rating: r.rating || 0,
            text: r.text || '',
            userName: r.userName || uid.slice(0, 8),
            timestamp: r.timestamp || 0
          })).sort((a, b) => b.timestamp - a.timestamp);
        }
      }
    } catch (e) {
      console.error('[REVIEWS] Load error:', e);
    }
    
    // Find my existing review
    const myReview = reviews.find(r => r.odvisitorId === visitorId);
    
    setReviewDialog({
      place,
      placeKey,
      reviews,
      myRating: myReview?.rating || 0,
      myText: myReview?.text || '',
      hasChanges: false
    });
  };
  
  const saveReview = async () => {
    if (!reviewDialog) return;
    const cityId = window.BKK.selectedCityId || 'bangkok';
    const visitorId = window.BKK.visitorId || 'anonymous';
    const userName = window.BKK.visitorName || visitorId.slice(0, 8);
    
    console.log('[REVIEWS] Saving:', { cityId, placeKey: reviewDialog.placeKey, visitorId, rating: reviewDialog.myRating, text: reviewDialog.myText });
    
    try {
      const db = (typeof window.firebase !== 'undefined' && window.firebase.apps?.length) ? window.firebase.database() : null;
      console.log('[REVIEWS] Save attempt:', { database: !!db, rating: reviewDialog.myRating, text: reviewDialog.myText });
      if (db && (reviewDialog.myRating > 0 || reviewDialog.myText.trim())) {
        const path = `cities/${cityId}/reviews/${reviewDialog.placeKey}/${visitorId}`;
        console.log('[REVIEWS] Saving to:', path);
        await db.ref(path).set({
          rating: reviewDialog.myRating,
          text: reviewDialog.myText.trim(),
          userName: userName,
          timestamp: Date.now()
        });
        console.log('[REVIEWS] Save SUCCESS');
        showToast(t('reviews.saved'), 'success');
        // Refresh this place's average
        loadReviewAverages([reviewDialog.place?.name || '']);
      } else {
        console.log('[REVIEWS] Save skipped - no db or empty review', { db: !!db, rating: reviewDialog.myRating });
        if (!db) showToast('No database connection', 'error');
      }
    } catch (e) {
      console.error('[REVIEWS] Save error:', e.message, e.code);
      showToast(t('reviews.saveError') + ': ' + (e.message || ''), 'error');
    }
    setReviewDialog(null);
  };
  
  const deleteMyReview = async () => {
    if (!reviewDialog) return;
    const cityId = window.BKK.selectedCityId || 'bangkok';
    const visitorId = window.BKK.visitorId || 'anonymous';
    
    try {
      const db = (typeof window.firebase !== 'undefined' && window.firebase.apps?.length) ? window.firebase.database() : null;
      if (db) {
        await db.ref(`cities/${cityId}/reviews/${reviewDialog.placeKey}/${visitorId}`).remove();
        showToast(t('reviews.deleted'), 'success');
      }
    } catch (e) {
      console.error('[REVIEWS] Delete error:', e);
    }
    setReviewDialog(null);
  };

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
      showToast(`"${place.name}" ${t("places.alreadyInMyList")}`, 'warning');
      return false;
    }
    
    // Set adding state for dimmed button
    const placeId = place.id || place.name;
    setAddingPlaceIds(prev => [...prev, placeId]);
    
    const boundaryCheck = checkLocationInArea(place.lat, place.lng, formData.area);
    
    const locationToAdd = {
      id: Date.now(),
      name: place.name,
      description: place.description || t('general.addedFromGoogle'),
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
      custom: true,
      status: 'active',
      addedAt: new Date().toISOString(),
      fromGoogle: true, // Mark as added from Google
      cityId: selectedCityId // Associate with current city
    };
    
    // Save to Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      try {
        const ref = await database.ref(`cities/${selectedCityId}/locations`).push(locationToAdd);
        // Verify server received it by reading back
        try {
          await Promise.race([
            ref.once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
          addDebugLog('ADD', `Added "${place.name}" to Firebase (server verified)`);
          showToast(`✅ "${place.name}" ${t("places.addedToYourList")}`, 'success');
        } catch (e) {
          // Firebase SDK has it cached, will auto-sync
          showToast(`💾 "${place.name}" — ${t('toast.savedWillSync')}`, 'warning', 'sticky');
        }
        setAddingPlaceIds(prev => prev.filter(id => id !== placeId));
        return true;
      } catch (error) {
        console.error('[FIREBASE] Error adding Google place, saving to pending:', error);
        addDebugLog('ERROR', `Failed to add "${place.name}", saved to pending`, error);
        saveToPending(locationToAdd);
        setAddingPlaceIds(prev => prev.filter(id => id !== placeId));
        return false;
      }
    } else {
      const updated = [...customLocations, locationToAdd];
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(`"${place.name}" ${t("places.addedToYourList")}`, 'success');
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
        showToast(`"${place.name}" ${t("places.alreadyBlacklisted")}`, 'warning');
        return;
      }
      
      // Update existing location to blacklist
      const locationId = exists.id;
      
      if (isFirebaseAvailable && database && exists.firebaseId) {
        database.ref(`cities/${selectedCityId}/locations/${exists.firebaseId}`).update({
          status: 'blacklist',
        })
          .then(() => {
            showToast(`"${place.name}" ${t("places.addedToSkipList")}`, 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error updating to blacklist:', error);
            showToast(t('toast.updateError'), 'error');
          });
      } else {
        const updated = customLocations.map(loc => {
          if (loc.id === locationId) {
            return { ...loc, status: 'blacklist' };
          }
          return loc;
        });
        setCustomLocations(updated);
        localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
        showToast(`"${place.name}" ${t("places.addedToSkipList")}`, 'success');
      }
      return;
    }
    
    // Doesn't exist - create new with blacklist status
    const boundaryCheck = checkLocationInArea(place.lat, place.lng, formData.area);
    
    // IMPORTANT: Copy interests from the place - blacklist needs same validation as active
    const locationToAdd = {
      id: Date.now(),
      name: place.name,
      description: place.description || t('toast.addedFromSearch'),
      notes: '',
      area: formData.area,
      areas: (() => { const d = window.BKK.getAreasForCoordinates(place.lat, place.lng); return d.length > 0 ? d : [formData.area]; })(),
      interests: place.interests && place.interests.length > 0 ? place.interests : [],
      lat: place.lat,
      lng: place.lng,
      uploadedImage: null,
      imageUrls: [],
      outsideArea: !boundaryCheck.valid,
      custom: true,
      status: 'blacklist', // Start as blacklisted!
      addedAt: new Date().toISOString(),
      fromGoogle: true,
      cityId: selectedCityId
    };
    
    // Save to Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      database.ref(`cities/${selectedCityId}/locations`).push(locationToAdd)
        .then(() => {
          console.log('[FIREBASE] Place added to blacklist');
          showToast(`"${place.name}" ${t("places.addedToSkipList")}`, 'success');
        })
        .catch((error) => {
          console.error('[FIREBASE] Error adding to blacklist:', error);
          showToast(t('toast.saveError'), 'error');
        });
    } else {
      const updated = [...customLocations, locationToAdd];
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(`"${place.name}" ${t("places.addedToSkipList")}`, 'success');
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
        const label = tLabel(interest) || interest.name;
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
            labelEn: interest.labelEn || '',
            name: label,
            icon: interest.icon || '📍',
            custom: true,
            privateOnly: interest.privateOnly || false,
            locked: !!interest.locked,
            scope: interest.scope || 'global',
            cityId: interest.cityId || '',
            category: interest.category || 'attraction',
            weight: interest.weight || sp.defaultInterestWeight,
            minStops: interest.minStops != null ? interest.minStops : 1,
            maxStops: interest.maxStops || 10,
            routeSlot: interest.routeSlot || 'any',
            minGap: interest.minGap || 1,
            bestTime: interest.bestTime || 'anytime'
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
      
      // 3b. Import interest counters (auto-naming)
      if (importedData.interestCounters && typeof importedData.interestCounters === 'object') {
        for (const [interestId, counter] of Object.entries(importedData.interestCounters)) {
          try {
            await database.ref(`cities/${selectedCityId}/interestCounters/${interestId}`).set(counter);
          } catch (error) {
            console.error('[FIREBASE] Error importing counter:', error);
          }
        }
      }
      
      // 3c. Import system parameters (algorithm tuning)
      if (importedData.systemParams && typeof importedData.systemParams === 'object') {
        const merged = { ...window.BKK._defaultSystemParams, ...importedData.systemParams };
        window.BKK.systemParams = merged;
        setSystemParams(merged);
        if (isFirebaseAvailable && database) {
          await database.ref('settings/systemParams').set(merged);
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
            
            custom: true,
            status: loc.status || 'active',
            locked: !!loc.locked,
            rating: loc.rating || null,
            ratingCount: loc.ratingCount || null,
            fromGoogle: loc.fromGoogle || false,
            addedAt: loc.addedAt || new Date().toISOString()
          };
          
          await database.ref(`cities/${selectedCityId}/locations`).push(newLocation);
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
          await database.ref(`cities/${selectedCityId}/routes`).push(routeToSave);
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
        const label = tLabel(interest) || interest.name;
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
          labelEn: interest.labelEn || '',
          name: label,
          icon: interest.icon || '📍',
          custom: true,
          privateOnly: interest.privateOnly || false,
          locked: !!interest.locked,
          scope: interest.scope || 'global',
          cityId: interest.cityId || '',
          category: interest.category || 'attraction',
          weight: interest.weight || sp.defaultInterestWeight,
          minStops: interest.minStops != null ? interest.minStops : 1,
          maxStops: interest.maxStops || 10,
          routeSlot: interest.routeSlot || 'any',
          minGap: interest.minGap || 1,
          bestTime: interest.bestTime || 'anytime'
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
      
      // 3b. Import interest counters (auto-naming)
      if (importedData.interestCounters && typeof importedData.interestCounters === 'object') {
        setInterestCounters(prev => ({ ...prev, ...importedData.interestCounters }));
      }
      
      // 3c. Import system parameters
      if (importedData.systemParams && typeof importedData.systemParams === 'object') {
        const merged = { ...window.BKK._defaultSystemParams, ...importedData.systemParams };
        window.BKK.systemParams = merged;
        setSystemParams(merged);
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
          
          custom: true,
          status: loc.status || 'active',
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
      report.push(`${t("import.interests")} +${addedInterests}`);
    }
    if (updatedConfigs > 0) {
      report.push(`${t("import.configs")} +${updatedConfigs}`);
    }
    if (addedLocations > 0 || skippedLocations > 0) {
      report.push(`${t("import.locations")} +${addedLocations}`);
    }
    if (addedRoutes > 0 || skippedRoutes > 0) {
      report.push(`${t("import.routes")} +${addedRoutes}`);
    }
    
    const totalAdded = addedInterests + addedLocations + addedRoutes + updatedConfigs;
    showToast(report.join(' | ') || t('toast.noImportItems'), totalAdded > 0 ? 'success' : 'warning');
  };

  // ===== Active Trail Management =====
  const startActiveTrail = (stops, interests, area) => {
    const trail = {
      stops: stops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng, interest: s.interest || s.interests?.[0] })),
      interests: interests || formData.interests || [],
      area: area || formData.area || '',
      cityId: selectedCityId,
      startedAt: Date.now()
    };
    setActiveTrail(trail);
    localStorage.setItem('foufou_active_trail', JSON.stringify(trail));
  };

  const endActiveTrail = () => {
    setActiveTrail(null);
    localStorage.removeItem('foufou_active_trail');
  };

  const addCustomLocation = (closeAfter = true) => {
    if (!newLocation.name.trim() || newLocation.interests.length === 0) {
      return; // Just don't add if validation fails
    }
    
    // Check for duplicate name (warn only, don't block — auto-generated names may collide)
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase().trim() === newLocation.name.toLowerCase().trim()
    );
    if (exists) {
      showToast(`⚠️ "${newLocation.name}" ${t("places.alreadyInList")}`, 'warning');
    }
    
    // Use provided coordinates (can be null)
    let lat = newLocation.lat;
    let lng = newLocation.lng;
    let outsideArea = false;
    let hasCoordinates = (lat !== null && lng !== null && lat !== 0 && lng !== 0);
    
    // Auto-detect areas from coordinates at save time
    let finalAreas = newLocation.areas || (newLocation.area ? [newLocation.area] : []);
    if (hasCoordinates) {
      const detected = window.BKK.getAreasForCoordinates(lat, lng);
      if (detected.length > 0) {
        finalAreas = detected;
      } else if (finalAreas.length > 0) {
        // No area detected - check if manually selected areas match
        const inAnyArea = finalAreas.some(aId => checkLocationInArea(lat, lng, aId).valid);
        outsideArea = !inAnyArea;
        if (outsideArea) {
          const areaNames = finalAreas.map(aId => areaOptions.find(a => a.id === aId)).filter(Boolean).map(a => tLabel(a)).join(', ');
          showToast(
            `⚠️ ${newLocation.name.trim()} — ${t("toast.outsideAreaWarning")} (${areaNames})`,
            'warning'
          );
        }
      }
    }
    if (finalAreas.length === 0) finalAreas = ['sukhumvit'];
    
    const newId = Date.now();
    const locationToAdd = {
      id: newId,
      name: newLocation.name.trim(),
      description: newLocation.description.trim() || newLocation.notes?.trim() || t('general.addedByUser'),
      notes: newLocation.notes?.trim() || '',
      area: finalAreas[0],
      areas: finalAreas,
      interests: newLocation.interests,
      lat: lat,
      lng: lng,
      mapsUrl: newLocation.mapsUrl || '',
      address: newLocation.address || '',
      uploadedImage: newLocation.uploadedImage || null,
      imageUrls: newLocation.imageUrls || [],
      outsideArea: outsideArea, // Flag for outside area
      missingCoordinates: !hasCoordinates, // Flag for missing coordinates
      custom: true,
      status: 'active',
      locked: newLocation.locked || false,
      addedAt: new Date().toISOString(),
      cityId: selectedCityId
    };
    
    // Increment interest counters for auto-naming (if name matches "#N" pattern)
    const incrementCounters = () => {
      if (isFirebaseAvailable && database && locationToAdd.interests?.length > 0) {
        const nameMatch = locationToAdd.name.match(/#(\d+)$/);
        if (nameMatch) {
          const num = parseInt(nameMatch[1]);
          locationToAdd.interests.forEach(interestId => {
            const current = interestCounters[interestId] || 0;
            if (num > current) {
              database.ref(`cities/${selectedCityId}/interestCounters/${interestId}`).set(num);
            }
          });
        }
      }
    };
    
    // Save to Firebase (or localStorage fallback)
    if (isFirebaseAvailable && database) {
      // DYNAMIC MODE: Firebase (shared) — SDK handles offline caching automatically
      incrementCounters();
      database.ref(`cities/${selectedCityId}/locations`).push(locationToAdd)
        .then(async (ref) => {
          // Firebase push succeeded (may be cached offline - SDK will sync when online)
          try {
            await Promise.race([
              ref.once('value'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);
            console.log('[FIREBASE] Location VERIFIED on server:', ref.key);
            showToast(`✅ ${locationToAdd.name} — ${t('places.placeAddedShared')}`, 'success');
          } catch (verifyErr) {
            // Server unreachable but Firebase SDK has the data cached - it WILL sync when online
            console.warn('[FIREBASE] Saved to Firebase cache (will auto-sync):', verifyErr.message);
            showToast(`💾 ${locationToAdd.name} — ${t('toast.savedWillSync')}`, 'warning', 'sticky');
          }
          
          // If staying open, switch to edit mode
          if (!closeAfter) {
            const addedWithFirebaseId = { ...locationToAdd, firebaseId: ref.key };
            setEditingLocation(addedWithFirebaseId);
            setShowAddLocationDialog(false);
            setShowEditLocationDialog(true);
          }
        })
        .catch((error) => {
          // Firebase push itself failed — this shouldn't happen even offline, but save to pending as safety net
          console.error('[FIREBASE] Push failed completely, saving to pending:', error);
          saveToPending(locationToAdd);
        });
    } else {
      // STATIC MODE: localStorage (local)
      const updated = [...customLocations, locationToAdd];
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(t('places.placeAdded'), 'success');
      
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
      showToast(t('places.enterPlaceName'), 'warning');
      return;
    }
    
    // Check for duplicate name (warn only, don't block)
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase().trim() === newLocation.name.toLowerCase().trim() &&
      loc.id !== editingLocation.id
    );
    if (exists) {
      showToast(`⚠️ "${newLocation.name}" ${t("places.alreadyInList")}`, 'warning');
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
    
    // Auto-detect areas from coordinates at save time
    let finalAreas = newLocation.areas || (newLocation.area ? [newLocation.area] : editingLocation.areas || []);
    if (hasCoordinates) {
      const detected = window.BKK.getAreasForCoordinates(newLocation.lat, newLocation.lng);
      if (detected.length > 0) {
        finalAreas = detected;
      } else if (finalAreas.length > 0) {
        const inAnyArea = finalAreas.some(aId => checkLocationInArea(newLocation.lat, newLocation.lng, aId).valid);
        outsideArea = !inAnyArea;
        if (outsideArea) {
          const areaNames = finalAreas.map(aId => areaOptions.find(a => a.id === aId)).filter(Boolean).map(a => tLabel(a)).join(', ');
          showToast(
            `⚠️ ${newLocation.name || editingLocation.name} — ${t("toast.outsideAreaWarning")} (${areaNames})`,
            'warning'
          );
        }
      }
    }
    if (finalAreas.length === 0) finalAreas = editingLocation.areas || ['sukhumvit'];
    
    const updatedLocation = { 
      ...editingLocation, // Keep existing fields like status
      ...newLocation, // Override with edited fields
      area: finalAreas[0],
      areas: finalAreas,
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
        database.ref(`cities/${selectedCityId}/locations/${firebaseId}`).set(locationData)
          .then(async () => {
            // Verify server received it by reading back
            try {
              await Promise.race([
                database.ref(`cities/${selectedCityId}/locations/${firebaseId}`).once('value'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
              ]);
              console.log('[FIREBASE] Location update VERIFIED on server');
              showToast(`✅ ${updatedLocation.name} — ${t('places.placeUpdated')}`, 'success');
            } catch (e) {
              showToast(`💾 ${updatedLocation.name} — ${t('toast.savedWillSync')}`, 'warning', 'sticky');
            }
            if (!closeAfter) {
              setEditingLocation({ ...updatedLocation, firebaseId });
            }
          })
          .catch((error) => {
            console.error('[FIREBASE] Error updating location:', error);
            showToast(`❌ ${updatedLocation.name} — ${t('toast.updateError')}: ${error.message || error}`, 'error', 'sticky');
          });
      }
    } else {
      // STATIC MODE: localStorage (local)
      const updated = customLocations.map(loc => 
        loc.id === editingLocation.id ? updatedLocation : loc
      );
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(t('places.placeUpdated'), 'success');
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
    showToast(t('form.searchingLocation'), 'info');
    
    window.BKK.getValidatedGps(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const detected = window.BKK.getAreasForCoordinates(lat, lng);
        const areaUpdates = detected.length > 0 ? { areas: detected, area: detected[0] } : {};
        
        setNewLocation(prev => ({
          ...prev,
          lat: lat,
          lng: lng,
          mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
          ...areaUpdates
        }));
        
        showToast(`${t("toast.locationDetectedCoords")} ${lat.toFixed(5)}, ${lng.toFixed(5)}${detected.length > 0 ? ` (${detected.length} ${t("toast.detectedAreas")})` : ''}`, 'success');
        
        try {
          const address = await reverseGeocode(lat, lng);
          if (address) {
            setNewLocation(prev => ({ ...prev, address: address }));
          }
        } catch (err) {
          console.log('[GPS] Reverse geocode failed (ok):', err);
        }
      },
      (reason) => {
        if (reason === 'outside_city') showToast(t('toast.outsideCity'), 'warning', 'sticky');
        else showToast(reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'error', 'sticky');
      }
    );
  };

  // Parse Google Maps URL to extract coordinates
  // Search address using Google Places API (instead of Geocoding)
  const geocodeAddress = async (address) => {
    if (!address || !address.trim()) {
      showToast(t('form.enterAddress'), 'warning');
      return;
    }

    try {
      showToast(t('places.searchingAddress'), 'info');
      
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
        
        // Auto-detect areas from coordinates
        const detected = window.BKK.getAreasForCoordinates(location.latitude, location.longitude);
        const areaUpdates = detected.length > 0 ? { areas: detected, area: detected[0] } : {};
        
        setNewLocation({
          ...newLocation,
          lat: location.latitude,
          lng: location.longitude,
          address: formattedAddress,
          googlePlaceId: place.id || null,
          mapsUrl: `https://maps.google.com/?q=${location.latitude},${location.longitude}`,
          ...areaUpdates
        });
        
        showToast(`${t("toast.found")} ${formattedAddress}${detected.length > 0 ? ` (${detected.length} ${t("toast.detectedAreas")})` : ''}`, 'success');
      } else {
        showToast(t('places.addressNotFoundRetry'), 'error');
      }
    } catch (error) {
      console.error('[GEOCODING] Error:', error);
      showToast(t('toast.addressSearchErrorHint'), 'error');
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
        showToast(t('places.noPlacesFound'), 'warning');
      }
    } catch (err) {
      console.error('[SEARCH] Error:', err);
      showToast(t('toast.searchError'), 'error');
      setLocationSearchResults(null);
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
    const stop = route.stops[stopIndex];
    const stopName = (stop?.name || '').toLowerCase().trim();
    if (!stopName) return;
    const isCurrentlyDisabled = isStopDisabled(stop);
    const newDisabledStops = isCurrentlyDisabled
      ? disabledStops.filter(n => n !== stopName)
      : [...disabledStops, stopName];
    
    setDisabledStops(newDisabledStops);
    
    // If disabling the current start point, clear it so recompute picks a new one
    if (!isCurrentlyDisabled && startPointCoords && stop?.lat && stop?.lng) {
      if (Math.abs(stop.lat - startPointCoords.lat) < 0.0001 && Math.abs(stop.lng - startPointCoords.lng) < 0.0001) {
        setStartPointCoords(null);
        startPointCoordsRef.current = null;
        setFormData(prev => ({...prev, startPoint: ''}));
      }
    }
    
    // Mark as not optimized — auto-compute useEffect will recompute
    if (route?.optimized) {
      setRoute(prev => prev ? {...prev, optimized: false} : prev);
    }
  };

