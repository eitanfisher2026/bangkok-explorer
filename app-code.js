const { useState, useEffect, useMemo, useCallback } = React;

const firebaseConfig = window.BKK.firebaseConfig;

let firebaseApp = null;
let database = null;
let storage = null;
let isFirebaseAvailable = false;

function initFirebase() {
  try {
    if (typeof firebase !== 'undefined') {
      const cfg = window.BKK.firebaseConfig;
      if (!cfg || !cfg.apiKey) { console.error('[FIREBASE] Config not found'); return; }
      firebaseApp = firebase.initializeApp(cfg);
      database = firebase.database();
      window.BKK.firebaseConnected = false;
      var _connTimer = null;
      database.ref('.info/connected').on('value', function(snap) {
        var isConnected = snap.val() === true;
        if (isConnected === window.BKK.firebaseConnected) return;
        clearTimeout(_connTimer);
        _connTimer = setTimeout(function() {
          if (isConnected === window.BKK.firebaseConnected) return;
          window.BKK.firebaseConnected = isConnected;
          console.log('[FIREBASE] Connection:', isConnected ? 'ONLINE' : 'OFFLINE');
          window.dispatchEvent(new CustomEvent('firebase-connection', { detail: { connected: isConnected } }));
        }, isConnected ? 500 : 2000);
      });
      if (firebase.storage) { storage = firebase.storage(); }
      isFirebaseAvailable = true;
      console.log('[FIREBASE] Initialized');
    }
  } catch (error) {
    console.error('[FIREBASE] Init failed:', error);
  }
}

const GOOGLE_PLACES_API_KEY = window.BKK.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_API_URL = window.BKK.GOOGLE_PLACES_API_URL;

const FouFouApp = () => {

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('bangkok_preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        prefs.maxStops = 10;
        prefs.fetchMoreCount = prefs.fetchMoreCount || 3;
        if (!prefs.searchMode) prefs.searchMode = 'area';
        if (prefs.searchMode === 'radius' && prefs.radiusMeters === 15000 && prefs.radiusPlaceName === t('general.allCity')) prefs.searchMode = 'all';
        if (!prefs.radiusMeters) prefs.radiusMeters = 500;
        if (!prefs.radiusSource) prefs.radiusSource = 'gps';
        if (!prefs.radiusPlaceName) prefs.radiusPlaceName = '';
        return prefs;
      }
    } catch (e) {}
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
  
  const isStopDisabled = (stop) => disabledStops.includes((stop.name || '').toLowerCase().trim());
  const isStopDisabledRef = (stop) => (disabledStopsRef.current || []).includes((stop.name || '').toLowerCase().trim());
  
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
  
  const runSmartPlan = (options = {}) => {
    const { openMap = false, startTrail = false, skipSmartSelect = false, overrideStart = null, overrideType = null } = options;
    
    if (!route?.stops?.length) return null;
    const allStops = route.stops.filter(s => s.lat && s.lng);
    if (allStops.length < 2) { showToast(t('places.noPlacesWithCoords'), 'warning'); return null; }
    
    const isCircular = overrideType !== null ? overrideType === 'circular' : routeType === 'circular';
    
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
    
    let autoStart = overrideStart || startPointCoordsRef.current;
    if (!autoStart) {
      const gps = (formData.currentLat && formData.currentLng) ? { lat: formData.currentLat, lng: formData.currentLng } : null;
      autoStart = findSmartStart(selected, gps, isCircular);
    }
    
    const optimized = optimizeStopOrder(selected, autoStart, isCircular);
    
    if (!autoStart && optimized.length > 0) {
      autoStart = { lat: optimized[0].lat, lng: optimized[0].lng, address: optimized[0].name };
    }
    
    setStartPointCoords(autoStart);
    startPointCoordsRef.current = autoStart;
    setFormData(prev => ({...prev, startPoint: autoStart?.address || (autoStart ? `${autoStart.lat},${autoStart.lng}` : '')}));
    
    const newStops = [...optimized, ...disabledList];
    setRoute(prev => prev ? { ...prev, stops: newStops, circular: isCircular, optimized: true, startPoint: autoStart?.address, startPointCoords: autoStart } : prev);
    
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
  
  const autoComputeRef = React.useRef(false);
  React.useEffect(() => {
    if (route && route.stops && route.stops.length >= 2 && !route.optimized && !autoComputeRef.current) {
      if (wizardMode && routeChoiceMade === null) return;
      autoComputeRef.current = true;
      const timer = setTimeout(() => {
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

  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
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
    const saved = localStorage.getItem('bangkok_route_type');
    return saved || 'circular';
  }); // 'circular' or 'linear'
  
  const getAutoTimeMode = () => {
    const h = new Date().getHours();
    const dayStart = window.BKK.dayStartHour ?? 6;
    const nightStart = window.BKK.nightStartHour ?? 17;
    if (nightStart > dayStart) {
      return (h >= dayStart && h < nightStart) ? 'day' : 'night';
    } else {
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
  
  const [interestConfig, setInterestConfig] = useState({});

  if (!window.BKK._defaultSystemParams) {
    window.BKK._defaultSystemParams = {
      maxStops: 10,
      fetchMoreCount: 3,
      googleMaxWaypoints: 12,
      defaultRadius: 500,
      dedupRadiusMeters: 50,
      dedupGoogleEnabled: 1,
      dedupCustomEnabled: 1,
      trailTimeoutHours: 8,
      defaultInterestWeight: 3,
      maxContentPasses: 3,
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
  const [editingParamKey, setEditingParamKey] = useState(null); // key of param being edited inline
  const [editingParamVal, setEditingParamVal] = useState('');
  const [editingArea, setEditingArea] = useState(null); // area being edited on map
  const [mapMode, setMapMode] = useState('areas'); // 'areas', 'radius', or 'stops'
  const [mapStops, setMapStops] = useState([]); // stops to show when mapMode='stops'
  const [startPointCoords, setStartPointCoords] = useState(null); // { lat, lng, address }
  const leafletMapRef = React.useRef(null);
  
  const googleCacheRef = React.useRef({});

  React.useEffect(() => {
    if (!showMapModal) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }
    
    window.BKK.loadLeaflet().then(function(loaded) {
      if (!loaded || !showMapModal) return;
    
    const timer = setTimeout(() => {
      const container = document.getElementById('leaflet-map-container');
      if (!container) return;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      
      try {
        const coords = window.BKK.areaCoordinates || {};
        const areas = window.BKK.areaOptions || [];
        
        const colorPalette = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7', '#14b8a6', '#e11d48', '#84cc16', '#0ea5e9', '#d946ef', '#f43f5e'];
        const areaColors = {};
        areas.forEach((area, i) => { areaColors[area.id] = colorPalette[i % colorPalette.length]; });
        
        if (mapMode === 'areas') {
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
            L.marker([c.lat, c.lng], {
              icon: L.divIcon({
                className: '',
                html: '<div style="font-size:10px;font-weight:bold;text-align:center;color:' + color + ';background:rgba(255,255,255,0.88);padding:2px 5px;border-radius:4px;border:1.5px solid ' + color + ';white-space:nowrap;line-height:1.2;box-shadow:0 1px 3px rgba(0,0,0,0.15);">' + tLabel(area) + '</div>',
                iconSize: [80, 22], iconAnchor: [40, 11]
              })
            }).addTo(map);
            allCircles.push(circle);
          });
          
          if (allCircles.length > 0) {
            const group = L.featureGroup(allCircles);
            map.fitBounds(group.getBounds().pad(0.1));
          }
          
          leafletMapRef.current = map;
        } else if (mapMode === 'radius') {
          const lat = formData.currentLat;
          const lng = formData.currentLng;
          if (!lat || !lng) return;
          
          const map = L.map(container).setView([lat, lng], 15);
          L.tileLayer(window.BKK.getTileUrl(), {
            attribution: '© OpenStreetMap contributors', maxZoom: 18
          }).addTo(map);
          
          const radiusCircle = L.circle([lat, lng], {
            radius: formData.radiusMeters, color: '#e11d48', fillColor: '#e11d48',
            fillOpacity: 0.12, weight: 3, dashArray: '8,6'
          }).addTo(map);
          
          L.circleMarker([lat, lng], {
            radius: 8, color: '#e11d48', fillColor: '#e11d48',
            fillOpacity: 1, weight: 2
          }).addTo(map).bindPopup(
            '<div style="text-align:center;direction:rtl;">' +
            '<b>📍 ' + (formData.radiusPlaceName || t('form.currentLocation')) + '</b><br/>' +
            '<span style="font-size:11px;color:#666;">Radius: ' + formData.radiusMeters + ' m</span></div>'
          ).openPopup();
          
          map.fitBounds(radiusCircle.getBounds().pad(0.15));
          
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
          const stops = mapStops.filter(s => s.lat && s.lng);
          if (stops.length === 0) return;
          
          const avgLat = stops.reduce((sum, s) => sum + s.lat, 0) / stops.length;
          const avgLng = stops.reduce((sum, s) => sum + s.lng, 0) / stops.length;
          
          const map = L.map(container).setView([avgLat, avgLng], 13);
          L.tileLayer(window.BKK.getTileUrl(), {
            attribution: '© OpenStreetMap contributors', maxZoom: 18
          }).addTo(map);
          
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
              setRoute(prev => prev ? {...prev, optimized: false} : prev);
              setTimeout(() => { if (window._mapRedrawLine) window._mapRedrawLine(); }, 50);
            }
          };
          
          const markers = [];
          const isRTL = window.BKK.i18n.isRTL();
          const stopsOrderRef = { current: stops }; // Mutable ref for current stop order
          
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
  
  const [accessStats, setAccessStats] = useState(null); // { total, weekly: { '2026-W08': { IL: 3, TH: 12 } } }
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(() => {
    return localStorage.getItem('bangkok_is_admin') === 'true';
  });

  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [feedbackList, setFeedbackList] = useState([]);
  const [showFeedbackList, setShowFeedbackList] = useState(false);
  const [hasNewFeedback, setHasNewFeedback] = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ message: '', onConfirm: null });

  const [showHelp, setShowHelp] = useState(false);
  const [helpContext, setHelpContext] = useState('main');
  
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
      setTimeout(() => window.BKK.loadLeaflet(), 2000);
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDataLoaded) {
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
  
  const [adminPassword, setAdminPassword] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
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
  
  const addDebugLog = (category, message, data = null) => {
    if (!debugMode) return;
    const cat = category.toLowerCase();
    if (!debugCategories.includes('all') && !debugCategories.includes(cat)) return;
  };
  
  useEffect(() => {
    localStorage.setItem('bangkok_debug_mode', debugMode.toString());
  }, [debugMode]);
  useEffect(() => {
    localStorage.setItem('bangkok_debug_categories', JSON.stringify(debugCategories));
  }, [debugCategories]);
  
  const helpContent = window.BKK.helpContent;

  const showHelpFor = (context) => {
    setHelpContext(context);
    setShowHelp(true);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmConfig({ message, onConfirm });
    setShowConfirmDialog(true);
  };

  const showToast = (message, type = 'success', customDuration = null) => {
    setToastMessage({ message, type, sticky: customDuration === 'sticky' });
    if (customDuration !== 'sticky') {
      const duration = customDuration || Math.min(6000, Math.max(2500, message.length * 70));
      setTimeout(() => setToastMessage(null), duration);
    }
  };

  const getMyLocation = () => {
    setIsLocating(true);
    window.BKK.getValidatedGps(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
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
      } else {
        showToast(t('places.addressNotFound'), 'warning');
      }
    } catch (err) {
      console.error('[START_POINT] Geocode error:', err);
      showToast(t('toast.addressSearchError'), 'error');
    }
    setIsLocating(false);
  };

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
  useEffect(() => {
    const handler = (e) => setFirebaseConnected(e.detail.connected);
    window.addEventListener('firebase-connection', handler);
    setFirebaseConnected(!!window.BKK.firebaseConnected);
    return () => window.removeEventListener('firebase-connection', handler);
  }, []);

  useEffect(() => {
    if (window.BKK.pushNavState) {
      window.BKK.pushNavState({ view: currentView, wizardStep, wizardMode });
    }
  }, [currentView, wizardStep, wizardMode]);

  useEffect(() => {
    const handler = (e) => {
      const prev = e.detail;
      if (!prev) return;
      
      if (prev.wizardMode && wizardMode) {
        if (prev.wizardStep < wizardStep) {
          setWizardStep(prev.wizardStep);
          if (prev.wizardStep < 3) { setRoute(null); setCurrentView('form'); }
          window.scrollTo(0, 0);
          return;
        }
      }
      
      if (prev.view !== currentView) {
        setCurrentView(prev.view);
        window.scrollTo(0, 0);
        return;
      }
      
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

  useEffect(() => {
    localStorage.setItem('pendingLocations', JSON.stringify(pendingLocations));
  }, [pendingLocations]);
  useEffect(() => {
    localStorage.setItem('pendingInterests', JSON.stringify(pendingInterests));
  }, [pendingInterests]);

  const syncPendingItems = async () => {
    if (!isFirebaseAvailable || !database) return 0;
    if (!window.BKK.firebaseConnected) {
      showToast(t('toast.offline'), 'warning');
      return 0;
    }
    
    let synced = 0;
    
    if (pendingLocations.length > 0) {
      const remaining = [];
      for (const loc of pendingLocations) {
        try {
          const cityId = loc.cityId || selectedCityId;
          const { pendingAt, ...cleanLoc } = loc;
          const ref = await database.ref(`cities/${cityId}/locations`).push(cleanLoc);
          await Promise.race([
            ref.once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
          synced++;
        } catch (e) {
          remaining.push(loc);
        }
      }
      setPendingLocations(remaining);
    }
    
    if (pendingInterests.length > 0) {
      const remaining = [];
      for (const item of pendingInterests) {
        try {
          const { pendingAt, searchConfig, ...interestData } = item;
          await database.ref(`customInterests/${interestData.id}`).set(interestData);
          if (searchConfig && Object.keys(searchConfig).length > 0) {
            await database.ref(`settings/interestConfig/${interestData.id}`).set(searchConfig);
          }
          await Promise.race([
            database.ref(`customInterests/${interestData.id}`).once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
          synced++;
        } catch (e) {
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

  useEffect(() => {
    if (firebaseConnected && isFirebaseAvailable && database) {
      if (pendingLocations.length > 0 || pendingInterests.length > 0) {
        const timer = setTimeout(() => {
          showToast(`🔄 ${t('toast.connectionRestored')}`, 'info');
          syncPendingItems();
        }, 3000);
        return () => clearTimeout(timer);
      } else {
      }
    }
  }, [firebaseConnected]);

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

  useEffect(() => {
    if (isFirebaseAvailable && database) {
      window.BKK.migrateLocationsToPerCity(database);
      window.BKK.cleanupInProgress(database);
    }
  }, []);

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
      }
      markLoaded('routes');
    }
  }, [selectedCityId]);

  useEffect(() => {
    if (!selectedCityId) return;
    setLocationsLoading(true);
    
    if (isFirebaseAvailable && database) {
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
        } else {
          setCustomLocations([]);
        }
        setLocationsLoading(false);
        markLoaded('locations');
      });
      
      return () => locationsRef.off('value', onValue);
    } else {
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
          const duplicates = allEntries.filter(i => builtInIds.has(i.id));
          const interestsArray = allEntries.filter(i => !builtInIds.has(i.id));
          if (duplicates.length > 0) {
            duplicates.forEach(d => database.ref(`customInterests/${d.firebaseId}`).remove());
          }
          
          const firebaseIds = new Set(interestsArray.map(i => i.id));
          const now = Date.now();
          for (const [id, ts] of recentlyAddedRef.current) {
            if (now - ts > 30000) recentlyAddedRef.current.delete(id);
          }
          setCustomInterests(prev => {
            const prevIds = new Set(prev.map(i => i.id));
            const disappeared = prev.filter(i => !firebaseIds.has(i.id) && !recentlyAddedRef.current.has(i.id));
            if (disappeared.length > 0 && prev.length > 0) {
            }
            const pendingLocal = prev.filter(i => 
              !firebaseIds.has(i.id) && recentlyAddedRef.current.has(i.id)
            );
            if (pendingLocal.length > 0) {
            }
            return [...interestsArray, ...pendingLocal];
          });
        } else {
          setCustomInterests(prev => {
            if (prev.length > 0) {
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

  useEffect(() => {
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
        } else {
          configRef.set(defaultConfig);
          setInterestConfig(defaultConfig);
        }
        markLoaded('config');
      });
      
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

  useEffect(() => {
    const builtInIds = interestOptions.map(i => i.id);
    const uncoveredIds = uncoveredInterests.map(i => i.id || i.name.replace(/\s+/g, '_').toLowerCase());
    
    const defaultStatus = {};
    builtInIds.forEach(id => { defaultStatus[id] = true; });
    uncoveredIds.forEach(id => { defaultStatus[id] = false; });
    
    if (isFirebaseAvailable && database) {
      const userId = localStorage.getItem('bangkok_user_id') || 'unknown';
      const adminStatusRef = database.ref('settings/interestStatus');
      const userStatusRef = database.ref(`users/${userId}/interestStatus`);
      
      adminStatusRef.once('value').then((adminSnap) => {
        const adminData = adminSnap.val() || defaultStatus;
        if (!adminSnap.val()) {
          adminStatusRef.set(defaultStatus);
        }
        
        return userStatusRef.once('value').then((userSnap) => {
          const userData = userSnap.val();
          if (userData) {
            setInterestStatus({ ...defaultStatus, ...adminData, ...userData });
          } else {
            setInterestStatus({ ...defaultStatus, ...adminData });
          }
          markLoaded('status');
        });
      }).catch(err => {
        console.error('[FIREBASE] Error loading interest status:', err);
        setInterestStatus(defaultStatus);
        markLoaded('status');
      });
      
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
  // ============================================================
  const refreshAllData = async () => {
    setIsRefreshing(true);
    
    try {
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
          }
        } catch (e) {
          console.error('[REFRESH] Error loading saved routes:', e);
        }
      }
      
      if (isFirebaseAvailable && database) {
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
          } else {
            setCustomLocations([]);
          }
        } catch (e) {
          console.error('[REFRESH] Error loading locations:', e);
        }
        
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
          } else {
            setCustomInterests(prev => {
              if (prev.length > 0) {
                return prev;
              }
              return [];
            });
          }
        } catch (e) {
          console.error('[REFRESH] Error loading interests:', e);
        }
        
        try {
          const settingsSnap = await database.ref('settings').once('value');
          const s = settingsSnap.val() || {};
          
          if (s.interestConfig) {
            setInterestConfig(prev => ({ ...prev, ...s.interestConfig }));
          }
          
          if (s.interestStatus) {
            const builtInIds = interestOptions.map(i => i.id);
            const uncoveredIds = uncoveredInterests.map(i => i.id || i.name.replace(/\s+/g, '_').toLowerCase());
            const defaultStatus = {};
            builtInIds.forEach(id => { defaultStatus[id] = true; });
            uncoveredIds.forEach(id => { defaultStatus[id] = false; });
            setInterestStatus({ ...defaultStatus, ...s.interestStatus });
          }
          
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
          
          if (s.googleMaxWaypoints != null) setGoogleMaxWaypoints(s.googleMaxWaypoints);
          const updates = {};
          if (s.maxStops != null) updates.maxStops = s.maxStops;
          if (s.fetchMoreCount != null) updates.fetchMoreCount = s.fetchMoreCount;
          if (s.defaultRadius != null) window.BKK._defaultRadius = s.defaultRadius;
          if (Object.keys(updates).length > 0) setFormData(prev => ({...prev, ...updates}));
          
          if (s.cityOverrides) {
            window.BKK._cityOverrides = s.cityOverrides;
            const cityId = window.BKK.selectedCityId;
            if (cityId && s.cityOverrides[cityId]) {
              const co = s.cityOverrides[cityId];
              if (co.dayStartHour != null) window.BKK.dayStartHour = co.dayStartHour;
              if (co.nightStartHour != null) window.BKK.nightStartHour = co.nightStartHour;
            }
          }
          
          if (s.systemParams) {
            const merged = { ...window.BKK._defaultSystemParams, ...s.systemParams };
            window.BKK.systemParams = merged;
            setSystemParams(merged);
            if (s.systemParams.maxStops != null) updates.maxStops = s.systemParams.maxStops;
            if (s.systemParams.fetchMoreCount != null) updates.fetchMoreCount = s.systemParams.fetchMoreCount;
            if (s.systemParams.googleMaxWaypoints != null) setGoogleMaxWaypoints(s.systemParams.googleMaxWaypoints);
            if (s.systemParams.defaultRadius != null) window.BKK._defaultRadius = s.systemParams.defaultRadius;
            if (Object.keys(updates).length > 0) setFormData(prev => ({...prev, ...updates}));
          }
          
        } catch (e) {
          console.error('[REFRESH] Error loading settings:', e);
        }
        
        showToast(t('toast.dataRefreshed'), 'success');
      } else {
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
    }
  };

  useEffect(() => {
    localStorage.setItem('bangkok_route_type', routeType);
  }, [routeType]);

  useEffect(() => {
    if (!isFirebaseAvailable || !database) return;
    
    let userId = localStorage.getItem('bangkok_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('bangkok_user_id', userId);
    }
    
    const hasSavedPrefs = !!localStorage.getItem('bangkok_preferences');
    database.ref('settings').on('value', (snap) => {
      const s = snap.val() || {};
      
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
      
      if (s.googleMaxWaypoints != null) setGoogleMaxWaypoints(s.googleMaxWaypoints);
      
      const formUpdates = {};
      if (s.maxStops != null) formUpdates.maxStops = s.maxStops;
      if (s.fetchMoreCount != null) formUpdates.fetchMoreCount = s.fetchMoreCount;
      if (s.defaultRadius != null) {
        window.BKK._defaultRadius = s.defaultRadius;
        if (!hasSavedPrefs) formUpdates.radiusMeters = s.defaultRadius;
      }
      
      if (s.systemParams) {
        const merged = { ...window.BKK._defaultSystemParams, ...s.systemParams };
        window.BKK.systemParams = merged;
        setSystemParams(merged);
        if (s.systemParams.maxStops != null) formUpdates.maxStops = s.systemParams.maxStops;
        if (s.systemParams.fetchMoreCount != null) formUpdates.fetchMoreCount = s.systemParams.fetchMoreCount;
        if (s.systemParams.googleMaxWaypoints != null) setGoogleMaxWaypoints(s.systemParams.googleMaxWaypoints);
        if (s.systemParams.defaultRadius != null) {
          window.BKK._defaultRadius = s.systemParams.defaultRadius;
          if (!hasSavedPrefs) formUpdates.radiusMeters = s.systemParams.defaultRadius;
        }
      }
      
      if (Object.keys(formUpdates).length > 0) {
        setFormData(prev => ({...prev, ...formUpdates}));
      }
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
      
    });
    
    const isAdmin = localStorage.getItem('bangkok_is_admin') === 'true';
    
    if (!isAdmin) {
      const lastLogTime = parseInt(localStorage.getItem('bangkok_last_log_time') || '0');
      const oneHour = 60 * 60 * 1000;
      
      if (Date.now() - lastLogTime >= oneHour) {
        localStorage.setItem('bangkok_last_log_time', Date.now().toString());
        
        const now = new Date();
        const jan1 = new Date(now.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
        const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        
        database.ref('accessStats/total').transaction(val => (val || 0) + 1);
        
        database.ref(`accessStats/weekly/${weekKey}/unknown`).transaction(val => (val || 0) + 1);
        
        fetch('https://ipapi.co/json/')
          .then(r => r.json())
          .then(geo => {
            const cc = geo.country_code || 'unknown';
            if (cc !== 'unknown') {
              database.ref(`accessStats/weekly/${weekKey}/unknown`).transaction(val => Math.max((val || 1) - 1, 0));
              database.ref(`accessStats/weekly/${weekKey}/${cc}`).transaction(val => (val || 0) + 1);
            }
          })
          .catch(() => { /* keep as unknown */ });
      }
    }
  }, []);

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

  const interestOptions = window.BKK.interestOptions || [];

  const interestToGooglePlaces = window.BKK.interestToGooglePlaces || {};

  const uncoveredInterests = window.BKK.uncoveredInterests || [];

  const interestTooltips = window.BKK.interestTooltips || {};

  const areaCoordinates = window.BKK.areaCoordinates || {};

  const switchCity = (cityId, stayOnView) => {
    if (cityId === selectedCityId) return;
    if (!window.BKK.cities[cityId]) return;
    
    window.BKK.selectCity(cityId);
    const overrides = window.BKK._cityOverrides?.[cityId];
    if (overrides) {
      if (overrides.dayStartHour != null) { window.BKK.dayStartHour = overrides.dayStartHour; window.BKK.selectedCity.dayStartHour = overrides.dayStartHour; }
      if (overrides.nightStartHour != null) { window.BKK.nightStartHour = overrides.nightStartHour; window.BKK.selectedCity.nightStartHour = overrides.nightStartHour; }
    }
    setSelectedCityId(cityId);
    localStorage.setItem('city_explorer_city', cityId);
    
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
  
  const checkLocationInArea = window.BKK.checkLocationInArea;
  const getButtonStyle = window.BKK.getButtonStyle;

  const GOOGLE_PLACES_TEXT_SEARCH_URL = window.BKK.GOOGLE_PLACES_TEXT_SEARCH_URL || 'https://places.googleapis.com/v1/places:searchText';

  const calcDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const r1 = lat1 * Math.PI / 180;
    const r2 = lat2 * Math.PI / 180;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(r1)*Math.cos(r2)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const [bulkDedupResults, setBulkDedupResults] = useState(null); // [{ loc, matches: [{...loc, _distance}] }]
  
  const findNearbyDuplicates = async (lat, lng, interests) => {
    if (!lat || !lng || !interests?.length) return null;
    const radius = sp.dedupRadiusMeters || 50;
    const results = { google: [], custom: [], lat, lng, interests };
    
    const expandedInterests = new Set(interests);
    for (const opt of allInterestOptions) {
      const related = interestConfig[opt.id]?.dedupRelated || opt.dedupRelated || [];
      if (interests.includes(opt.id)) {
        related.forEach(r => expandedInterests.add(r));
      }
      if (related.some(r => interests.includes(r))) {
        expandedInterests.add(opt.id);
      }
    }
    
    if (sp.dedupCustomEnabled) {
      for (const loc of customLocations) {
        if (!loc.lat || !loc.lng) continue;
        const dist = calcDistance(lat, lng, loc.lat, loc.lng);
        if (dist <= radius) {
          const sharedInterest = loc.interests?.some(i => expandedInterests.has(i));
          if (sharedInterest) {
            results.custom.push({ ...loc, _distance: Math.round(dist) });
          }
        }
      }
    }
    
    if (sp.dedupGoogleEnabled && GOOGLE_PLACES_API_KEY) {
      try {
        const interestToGP = window.BKK.interestToGooglePlaces || {};
        const googleTypes = [];
        const blacklistWords = [];
        for (const interest of expandedInterests) {
          const types = interestToGP[interest];
          if (types) googleTypes.push(...types);
          const cfg = interestConfig[interest];
          if (cfg?.blacklist) {
            blacklistWords.push(...cfg.blacklist.map(w => w.toLowerCase()));
          }
          const ci = customInterests.find(c => c.id === interest);
          if (ci?.baseCategory && interestConfig[ci.baseCategory]?.blacklist) {
            blacklistWords.push(...interestConfig[ci.baseCategory].blacklist.map(w => w.toLowerCase()));
          }
        }
        const uniqueTypes = [...new Set(googleTypes)].slice(0, 5);
        const uniqueBlacklist = [...new Set(blacklistWords)];
        
        if (uniqueTypes.length > 0) {
          const body = {
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: Math.max(radius, 50)
              }
            },
            includedTypes: uniqueTypes,
            maxResultCount: 5
          };
          
          const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
              'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress,places.rating,places.userRatingCount,places.id,places.types,places.googleMapsUri'
            },
            body: JSON.stringify(body)
          });
          
          if (response.ok) {
            const data = await response.json();
            results.google = (data.places || [])
              .filter(p => {
                if (uniqueBlacklist.length === 0) return true;
                const name = (p.displayName?.text || '').toLowerCase();
                return !uniqueBlacklist.some(word => name.includes(word));
              })
              .map(p => ({
                name: p.displayName?.text || '',
                lat: p.location?.latitude,
                lng: p.location?.longitude,
                address: p.formattedAddress || '',
                rating: p.rating || 0,
                ratingCount: p.userRatingCount || 0,
                googlePlaceId: p.id,
                mapsUrl: p.googleMapsUri || '',
                types: p.types || [],
                _distance: Math.round(calcDistance(lat, lng, p.location?.latitude || 0, p.location?.longitude || 0))
              }));
          }
        }
      } catch (e) {
      }
    }
    
    const total = results.google.length + results.custom.length;
    if (total > 0) {
      return results;
    }
    return null;
  };

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
    let center, searchRadius;
    
    if (radiusOverride) {
      center = { lat: radiusOverride.lat, lng: radiusOverride.lng };
      searchRadius = radiusOverride.radius;
    } else {
      const areaCenter = areaCoordinates[area];
      if (!areaCenter) {
        console.error('[DYNAMIC] No coordinates for area:', area);
        return [];
      }
      center = { lat: areaCenter.lat, lng: areaCenter.lng };
      searchRadius = areaCenter.radius || 2000;
    }

    const validInterests = interests.filter(id => isInterestValid(id));
    if (validInterests.length === 0) {
      const names = interests.map(id => allInterestOptions.find(o => o.id === id)).filter(Boolean).map(o => tLabel(o) || o?.id || id).join(', ');
      return [];
    }
    
    if (validInterests.length < interests.length) {
      const skipped = interests.filter(id => !isInterestValid(id));
      const skippedNames = skipped.map(id => allInterestOptions.find(o => o.id === id)).filter(Boolean).map(o => tLabel(o) || o?.id || id).join(', ');
    }

    try {
      const primaryInterest = validInterests[0];
      
      let config = interestConfig[primaryInterest];
      if (!config) {
        const customInterest = customInterests.find(ci => ci.id === primaryInterest);
        if (customInterest?.baseCategory) {
          config = interestConfig[customInterest.baseCategory] || {};
        } else {
          config = {};
        }
      }
      
      const textSearchQuery = config.textSearch || (window.BKK.textSearchInterests || {})[validInterests[0]] || '';
      
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
        const areaName = area ? (areaOptions.find(a => a.id === area)?.labelEn || area) : '';
        const cityName = window.BKK.cityNameForSearch || 'Bangkok';
        const searchQuery = `${textSearchQuery} ${areaName} ${cityName}`.trim();
        
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
        placeTypes = [...new Set(
          validInterests.flatMap(interest => {
            if (interestConfig[interest]?.types) {
              return interestConfig[interest].types;
            }
            const customInterest = customInterests.find(ci => ci.id === interest);
            if (customInterest?.baseCategory && interestConfig[customInterest.baseCategory]?.types) {
              return interestConfig[customInterest.baseCategory].types;
            }
            return interestToGooglePlaces[interest] || interestToGooglePlaces[customInterest?.baseCategory] || ['point_of_interest'];
          })
        )];

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DYNAMIC] Error fetching Google Places:', {
          status: response.status,
          error: errorText,
          area,
          placeTypes
        });
        
        if (response.status === 400 && errorText.includes('Unsupported types') && !isTextSearch && placeTypes.length > 1) {
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
                }
              } else {
                const interestNames = validInterests.map(id => allInterestOptions.find(o => o.id === id)).filter(Boolean).map(o => tLabel(o) || o?.id || id).join(', ');
              }
            } catch (retryErr) {
            }
          }
          if (allRetryPlaces.length > 0) {
            const data = { places: allRetryPlaces };
            response = { ok: true }; // Fake ok response
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
            
            return places;
          }
          return []; // No results from any type
        }
        
        throw new Error(`Google API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.places) {
        return [];
      }

      const isTextSearch = !!textSearchQuery;
      
      const textSearchPhrase = isTextSearch ? textSearchQuery.toLowerCase().trim() : '';
      
      let typeFilteredCount = 0;
      let blacklistFilteredCount = 0;
      let relevanceFilteredCount = 0;
      
      const transformed = data.places
        .filter(place => {
          const placeName = (place.displayName?.text || '').toLowerCase();
          const placeTypesFromGoogle = place.types || [];
          
          if (blacklistWords.length > 0) {
            const isBlacklisted = blacklistWords.some(word => placeName.includes(word));
            if (isBlacklisted) {
              blacklistFilteredCount++;
              return false;
            }
          }
          
          if (isTextSearch && textSearchPhrase) {
            const nameHasPhrase = placeName.includes(textSearchPhrase);
            
            if (!nameHasPhrase) {
              relevanceFilteredCount++;
              return false;
            }
          }
          
          if (!isTextSearch && placeTypes.length > 0) {
            const placeTypesFromGoogle = place.types || [];
            const hasValidType = placeTypesFromGoogle.some(type => placeTypes.includes(type));
            
            if (!hasValidType) {
              typeFilteredCount++;
              return false;
            }
          }
          
          return true;
        })
        .map((place, index) => {
          const openingHours = place.currentOpeningHours;
          const todayIndex = new Date().getDay(); // 0=Sun, need to map to weekdayDescriptions (0=Mon in Google)
          const googleDayIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Convert: Sun=6, Mon=0, Tue=1...
          const todayHours = openingHours?.weekdayDescriptions?.[googleDayIndex] || '';
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
      
      const areaConfig = areaCoordinates[area] || {};
      const distMultiplier = areaConfig.distanceMultiplier || window.BKK.selectedCity?.distanceMultiplier || 1.2;
      const maxDistance = searchRadius * distMultiplier;
      const distanceFiltered = transformed.filter(place => {
        const dist = calcDistance(center.lat, center.lng, place.lat, place.lng);
        if (dist > maxDistance) {
          return false;
        }
        return true;
      });
      
      if (distanceFiltered.length < transformed.length) {
      }
      
      return distanceFiltered;
    } catch (error) {
      console.error('[DYNAMIC] Error fetching Google Places:', {
        error: error.message,
        stack: error.stack,
        area,
        interests
      });
      
      throw {
        type: 'GOOGLE_API_ERROR',
        message: error.message,
        details: { area, interests, stack: error.stack }
      };
    }
  };

  const fetchGooglePlaceInfo = async (location) => {
    if (!location || (!location.lat && !location.name)) {
      showToast(t('places.notEnoughInfo'), 'error');
      return null;
    }
    
    setLoadingGoogleInfo(true);
    
    try {
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
      
      return placeInfo;
    } catch (error) {
      console.error('Error fetching Google place info:', error);
      showToast(t('toast.googleInfoError'), 'error');
      return null;
    } finally {
      setLoadingGoogleInfo(false);
    }
  };

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

  useEffect(() => {
    if (!debugMode) return;
    const customs = allInterestOptions.filter(o => o.id?.startsWith?.('custom_') || o.custom);
    if (customs.length > 0) {
      customs.forEach(c => addDebugLog('INTEREST', `  - ${c.id}: "${c.label}" scope=${c.scope||'?'} privateOnly=${c.privateOnly} valid=${isInterestValid?.(c.id)}`));
    } else if ((customInterests||[]).length > 0) {
    }
  }, [customInterests, cityCustomInterests, allInterestOptions, debugMode]);
  useEffect(() => {
    if (!isDataLoaded) return;
    const { maxStops, fetchMoreCount, ...userPrefs } = formData;
    localStorage.setItem('bangkok_preferences', JSON.stringify(userPrefs));
  }, [formData, isDataLoaded]);

  const checkForUpdates = async (silent = false) => {
    try {
      const response = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return false;
      const data = await response.json();
      const serverVersion = data.version;
      const localVersion = window.BKK.VERSION;
      
      if (serverVersion && serverVersion !== localVersion) {
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
      if (!silent) showToast(t('toast.cannotCheckUpdates'), 'error');
      return false;
    }
  };

  const applyUpdate = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => checkForUpdates(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('bangkok_right_col_width', rightColWidth.toString());
  }, [rightColWidth]);

  useEffect(() => {
    if (showEditLocationDialog && editingLocation) {
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

  const cityCustomLocations = useMemo(() => {
    return customLocations; // Already filtered per city by Firebase subscription
  }, [customLocations, selectedCityId]);

  const citySavedRoutes = useMemo(() => {
    return savedRoutes.filter(r => (r.cityId || 'bangkok') === selectedCityId);
  }, [savedRoutes, selectedCityId]);

  const groupedPlaces = useMemo(() => {
    try {
      if (!cityCustomLocations || cityCustomLocations.length === 0) {
        return { groups: {}, ungrouped: [], sortedKeys: [], activeCount: 0, blacklistedLocations: [], draftsLocations: [], readyLocations: [], draftsCount: 0, readyCount: 0, blacklistCount: 0 };
      }
      const draftsLocations = cityCustomLocations.filter(loc => loc.status !== 'blacklist' && !loc.locked);
      const readyLocations = cityCustomLocations.filter(loc => loc.status !== 'blacklist' && loc.locked);
      const blacklistedLocations = cityCustomLocations.filter(loc => loc.status === 'blacklist');
      
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
      setFormData(prev => ({ ...prev, interests: cleaned }));
    }
  }, [interestConfig, cityCustomInterests, isDataLoaded]);

  const getStopsForInterests = () => {
    const isRadiusMode = formData.searchMode === 'radius' || formData.searchMode === 'all';
    
    const matchingCustomLocations = customLocations.filter(loc => {
      if ((loc.cityId || 'bangkok') !== selectedCityId) return false;
      
      if (loc.status === 'blacklist') return false;
      
      if (!isLocationValid(loc)) return false;
      
      if (isRadiusMode) {
        if (!formData.currentLat || !formData.currentLng || !loc.lat || !loc.lng) return false;
        const dist = calcDistance(formData.currentLat, formData.currentLng, loc.lat, loc.lng);
        if (dist > formData.radiusMeters) return false;
      } else {
        const locAreas = loc.areas || (loc.area ? [loc.area] : []);
        if (!locAreas.includes(formData.area)) return false;
      }
      
      if (!loc.interests || loc.interests.length === 0) return false;
      
      return loc.interests.some(locInterest => {
        if (formData.interests.includes(locInterest)) return true;
        
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
    
    const seen = new Set();
    return matchingCustomLocations.filter(stop => {
      const key = `${stop.lat},${stop.lng}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // ========== SMART STOP SELECTION (for Yalla and "Help me plan") ==========
  const smartSelectStops = (stops, selectedInterests, maxTotal) => {
    maxTotal = maxTotal || formData.maxStops || 10;
    
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
    
    const limits = {};
    let allocated = 0;
    for (const id of selectedInterests) {
      const min = Math.min(cfg[id].minStops, cfg[id].maxStops, maxTotal - allocated);
      limits[id] = { max: min, category: cfg[id].category };
      allocated += min;
    }
    
    let remaining = maxTotal - allocated;
    if (remaining > 0 && totalWeight > 0) {
      for (let pass = 0; pass < 3 && remaining > 0; pass++) {
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
      
      remaining = maxTotal - allocated;
      const sorted = [...selectedInterests].sort((a, b) => cfg[b].weight - cfg[a].weight);
      for (const id of sorted) {
        if (remaining <= 0) break;
        if (limits[id].max >= cfg[id].maxStops) continue;
        limits[id].max += 1;
        remaining -= 1;
      }
    }
    
    const buckets = {};
    const unmatched = [];
    for (const id of selectedInterests) buckets[id] = [];
    
    for (const stop of stops) {
      const stopInterests = stop.interests || [];
      const matchingInterest = selectedInterests.find(id => stopInterests.includes(id));
      if (matchingInterest && buckets[matchingInterest]) {
        buckets[matchingInterest].push(stop);
      } else {
        unmatched.push(stop);
      }
    }
    
    const timeMode = getEffectiveTimeMode(); // 'day' or 'night'
    
    const getStopBestTime = (stop) => {
      if (stop.bestTime) return stop.bestTime;
      const stopInterests = stop.interests || [];
      for (const id of stopInterests) {
        const iCfg = interestConfig[id];
        if (iCfg?.bestTime && iCfg.bestTime !== 'anytime') return iCfg.bestTime;
      }
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
    
    const timeScore = (stop) => {
      const bt = getStopBestTime(stop);
      if (bt === 'anytime') return sp.timeScoreAnytime;
      return bt === timeMode ? sp.timeScoreMatch : sp.timeScoreConflict;
    };
    
    const stopScore = (s) => (s.rating || 0) * Math.log10((s.ratingCount || 0) + 1);
    for (const id of selectedInterests) {
      buckets[id].sort((a, b) => {
        const aCustom = a.source === 'custom' || a.custom ? 1 : 0;
        const bCustom = b.source === 'custom' || b.custom ? 1 : 0;
        if (aCustom !== bCustom) return bCustom - aCustom;
        const aTime = timeScore(a);
        const bTime = timeScore(b);
        if (aTime !== bTime) return bTime - aTime;
        return stopScore(b) - stopScore(a);
      });
    }
    
    const selected = [];
    const disabled = [];
    
    for (const interestId of selectedInterests) {
      const bucket = buckets[interestId];
      const limit = limits[interestId].max;
      selected.push(...bucket.slice(0, limit));
      disabled.push(...bucket.slice(limit));
    }
    disabled.push(...unmatched);
    
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
    
    const categoryPosition = { attraction: 1, nature: 2, shopping: 3, experience: 4, meal: 5, break: 6 };
    const getCategory = (stop) => {
      const stopInterests = stop.interests || [];
      for (const id of selectedInterests) {
        if (stopInterests.includes(id) && limits[id]) return limits[id].category;
      }
      return 'attraction';
    };
    
    const attractions = selected.filter(s => ['attraction', 'nature', 'shopping'].includes(getCategory(s)));
    const breaks = selected.filter(s => getCategory(s) === 'break');
    const meals = selected.filter(s => getCategory(s) === 'meal');
    const experiences = selected.filter(s => getCategory(s) === 'experience');
    
    const ordered = [];
    let attractionIdx = 0;
    const totalAttractions = attractions.length;
    
    const breakAt = Math.max(1, Math.floor(totalAttractions / 3));
    const mealAt = Math.max(2, Math.floor(totalAttractions * 2 / 3));
    
    for (let i = 0; i < totalAttractions; i++) {
      ordered.push(attractions[i]);
      if (i === breakAt - 1 && breaks.length > 0) ordered.push(...breaks);
      if (i === mealAt - 1 && meals.length > 0) ordered.push(...meals);
    }
    
    if (totalAttractions === 0) {
      ordered.push(...breaks, ...meals);
    }
    
    ordered.push(...experiences);
    
    return { selected: ordered, disabled };
  };

  // ========== ROUTE OPTIMIZATION (Nearest Neighbor + 2-opt) ==========
  const optimizeStopOrder = (stops, startCoords, isCircular) => {
    if (stops.length <= 2) return stops;
    
    const withCoords = stops.filter(s => s.lat && s.lng);
    const noCoords = stops.filter(s => !s.lat || !s.lng);
    
    if (withCoords.length <= 1) return [...withCoords, ...noCoords];
    
    const dist = (a, b) => calcDistance(a.lat, a.lng, b.lat, b.lng);
    
    const unvisited = [...withCoords];
    const ordered = [];
    
    let currentPos;
    if (startCoords?.lat && startCoords?.lng) {
      currentPos = startCoords;
    } else {
      const avgLat = withCoords.reduce((s, p) => s + p.lat, 0) / withCoords.length;
      const avgLng = withCoords.reduce((s, p) => s + p.lng, 0) / withCoords.length;
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
    
    if (startCoords?.lat && startCoords?.lng && unvisited.length > 0) {
      let minDist = Infinity, nearIdx = 0;
      unvisited.forEach((s, i) => {
        const d = dist(currentPos, s);
        if (d < minDist) { minDist = d; nearIdx = i; }
      });
      ordered.push(unvisited.splice(nearIdx, 1)[0]);
      currentPos = ordered[ordered.length - 1];
    }
    
    while (unvisited.length > 0) {
      let minDist = Infinity, nearIdx = 0;
      unvisited.forEach((s, i) => {
        const d = dist(currentPos, s);
        if (d < minDist) { minDist = d; nearIdx = i; }
      });
      ordered.push(unvisited.splice(nearIdx, 1)[0]);
      currentPos = ordered[ordered.length - 1];
    }
    
    const totalDist = (route) => {
      let d = 0;
      if (startCoords?.lat && startCoords?.lng) {
        d += dist(startCoords, route[0]);
      }
      for (let i = 0; i < route.length - 1; i++) {
        d += dist(route[i], route[i + 1]);
      }
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
          const A = i === 0 && startCoords?.lat ? startCoords : ordered[i];
          const B = ordered[i + 1];
          const C = ordered[j];
          const D = j + 1 < ordered.length ? ordered[j + 1] 
            : (isCircular ? (startCoords?.lat ? startCoords : ordered[0]) : null);
          
          const oldDist = dist(A, B) + (D ? dist(C, D) : 0);
          const newDist = dist(A, C) + (D ? dist(B, D) : 0);
          
          if (newDist < oldDist - 1) { // 1m threshold to avoid float noise
            const reversed = ordered.slice(i + 1, j + 1).reverse();
            ordered.splice(i + 1, j - i, ...reversed);
            improved = true;
          }
        }
      }
    }
    
    if (ordered.length >= 4) {
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
        if (stop.bestTime) return stop.bestTime;
        const cat = getCategory(stop);
        return slotConfig[cat]?.time || 'anytime';
      };
      
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
      
      const contentPenalty = (arr) => {
        let p = 0;
        for (let i = 0; i < arr.length; i++) {
          p += slotScore(getCategory(arr[i]), i);
          p += timeCompat(getStopTime(arr[i])); // Time mismatch penalty
        }
        p += gapPenalty(arr);
        return p;
      };
      
      const geoDist = (arr) => totalDist(arr);
      const baseGeo = geoDist(ordered);
      const basePenalty = contentPenalty(ordered);
      
      if (basePenalty > 0.5) {
        let contentImproved = true;
        let contentPasses = 0;
        const maxContentPasses = sp.maxContentPasses;
        
        while (contentImproved && contentPasses < maxContentPasses) {
          contentImproved = false;
          contentPasses++;
          for (let i = 0; i < ordered.length; i++) {
            for (let j = i + 1; j < ordered.length; j++) {
              const curPenalty = contentPenalty(ordered);
              [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
              const newPenalty = contentPenalty(ordered);
              const newGeo = geoDist(ordered);
              const geoIncrease = (newGeo - baseGeo) / Math.max(baseGeo, 1);
              
              if (newPenalty < curPenalty - 0.3 && geoIncrease < 0.25) {
                contentImproved = true;
              } else {
                [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
              }
            }
          }
        }
        
        const finalPenalty = contentPenalty(ordered);
        const finalGeo = geoDist(ordered);
      }
    }
    
    return [...ordered, ...noCoords];
  };

  const generateRoute = async () => {
    const isRadiusMode = formData.searchMode === 'radius' || formData.searchMode === 'all';
    
    setStartPointCoords(null);
    setFormData(prev => ({...prev, startPoint: ''}));
    
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
      
      const customStops = getStopsForInterests();
      
      const maxStops = formData.maxStops || 10;
      
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
      
      let allocated = 0;
      for (const interest of formData.interests) {
        const min = Math.min(interestCfg[interest].minStops, interestCfg[interest].maxStops, maxStops - allocated);
        interestLimits[interest] = min;
        allocated += min;
      }
      
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
      
      const interestResults = {};
      const allStops = []; // Build this respecting limits
      let fetchErrors = [];
      
      googleCacheRef.current = {};
      
      for (const interest of formData.interests) {
        const stopsForThisInterest = interestLimits[interest] || 2;
        
        const customStopsForInterest = customStops.filter(stop => 
          stop.interests && stop.interests.includes(interest)
        );
        
        const customToUse = customStopsForInterest.slice(0, stopsForThisInterest);
        for (const cs of customToUse) {
          if (!allStops.some(s => s.name.toLowerCase().trim() === cs.name.toLowerCase().trim())) {
            allStops.push(cs);
          }
        }
        
        const neededFromApi = Math.max(0, stopsForThisInterest - customToUse.length);
        
        if (neededFromApi > 0) {
          const interestObj = allInterestOptions.find(o => o.id === interest);
          const interestPrivateOnly = interestObj?.privateOnly || false;
          
          let fetchedPlaces = [];
          
          if (interestPrivateOnly) {
          } else {
          try {
            const radiusOverride = isRadiusMode ? { 
              lat: formData.currentLat, 
              lng: formData.currentLng, 
              radius: formData.radiusMeters 
            } : null;
            fetchedPlaces = await fetchGooglePlaces(isRadiusMode ? null : formData.area, [interest], radiusOverride);
          } catch (error) {
            fetchErrors.push({
              interest,
              error: error.message || 'Unknown error',
              details: error.details || {}
            });
            console.error(`[ERROR] Failed to fetch for ${interest}:`, error);
            fetchedPlaces = [];
          }
          } // end if !privateOnly
          
          fetchedPlaces = filterBlacklist(fetchedPlaces);
          
          fetchedPlaces = filterDuplicatesOfCustom(fetchedPlaces);
          
          if (isRadiusMode) {
            const beforeFilter = fetchedPlaces.length;
            fetchedPlaces = fetchedPlaces.filter(p => {
              const dist = calcDistance(formData.currentLat, formData.currentLng, p.lat, p.lng);
              return dist <= formData.radiusMeters;
            });
            const removed = beforeFilter - fetchedPlaces.length;
            if (removed > 0) {
            }
          }
          
          let sortedAll;
          if (isRadiusMode) {
            sortedAll = fetchedPlaces
              .map(p => ({ ...p, _dist: calcDistance(formData.currentLat, formData.currentLng, p.lat, p.lng) }))
              .sort((a, b) => a._dist - b._dist || (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1)));
          } else {
            sortedAll = fetchedPlaces
              .sort((a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1)));
          }
          
          const sortedPlaces = sortedAll.slice(0, neededFromApi);
          const cachedPlaces = sortedAll.slice(neededFromApi);
          
          googleCacheRef.current[interest] = cachedPlaces;
          
          interestResults[interest] = {
            requested: stopsForThisInterest,
            custom: customToUse.length,
            fetched: sortedPlaces.length,
            total: customToUse.length + sortedPlaces.length,
            allPlaces: sortedAll // Keep all for round 2
          };
          
          allStops.push(...sortedPlaces);
        } else {
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
      
      const seen = new Set();
      let uniqueStops = allStops.filter(stop => {
        const normalizedName = stop.name.toLowerCase().trim();
        
        if (seen.has(normalizedName)) {
          return false;
        }
        
        seen.add(normalizedName);
        return true;
      });
      
      const totalFound = uniqueStops.length;
      const missing = maxStops - totalFound;
      
      if (missing > 0) {
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
          } else if (canAddMore > 0) {
          }
        }
        
        const ratingSort2 = (a, b) => (b.rating * Math.log10((b.ratingCount || 0) + 1)) - (a.rating * Math.log10((a.ratingCount || 0) + 1));
        const distSort2 = (a, b) => calcDistance(formData.currentLat, formData.currentLng, a.lat, a.lng) - calcDistance(formData.currentLat, formData.currentLng, b.lat, b.lng);
        const sorted = additionalPlaces
          .sort(isRadiusMode ? distSort2 : ratingSort2)
          .slice(0, missing);
        
        uniqueStops = [...uniqueStops, ...sorted];
        
        const seenNames = new Set();
        const finalStops = [];
        
        for (const stop of uniqueStops) {
          const normalizedName = stop.name.toLowerCase().trim();
          
          if (!seenNames.has(normalizedName)) {
            finalStops.push(stop);
            seenNames.add(normalizedName);
          } else {
          }
        }
        
        uniqueStops = finalStops;
        
        const usedInRound2 = new Set(sorted.map(s => s.name.toLowerCase().trim()));
        for (const interest of formData.interests) {
          if (googleCacheRef.current[interest]?.length > 0) {
            googleCacheRef.current[interest] = googleCacheRef.current[interest]
              .filter(p => !usedInRound2.has(p.name.toLowerCase().trim()));
          }
        }
      }
      
      if (fetchErrors.length > 0) {
        const errorMsg = fetchErrors.map(e => `${e.interest}: ${e.error}`).join(', ');
        
        console.error('[ROUTE] Data source errors:', fetchErrors);
        showToast(`${t("toast.errorsGettingPlaces")} ${errorMsg}`, 'warning');
      }
      
      if (isRadiusMode) {
        const beforeCount = uniqueStops.length;
        uniqueStops = uniqueStops.map(stop => {
          const detectedArea = detectAreaFromCoords(stop.lat, stop.lng);
          const distFromCenter = Math.round(calcDistance(formData.currentLat, formData.currentLng, stop.lat, stop.lng));
          return { ...stop, detectedArea, distFromCenter };
        }).filter(stop => {
          if (stop.detectedArea) return true;
          return false;
        });
        const filtered = beforeCount - uniqueStops.length;
        if (filtered > 0) {
        }
      } else {
        uniqueStops = uniqueStops.map(stop => ({ ...stop, detectedArea: formData.area }));
      }
      
      if (uniqueStops.length === 0) {
        showToast(isRadiusMode 
          ? t('places.noPlacesInRadius') 
          : t('places.noMatchingPlaces'), 'error');
        setIsGenerating(false);
        return;
      }

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
        incomplete: uniqueStops.length < maxStops ? {
          requested: maxStops,
          found: uniqueStops.length,
          missing: maxStops - uniqueStops.length
        } : null,
        errors: fetchErrors.length > 0 ? fetchErrors : null,
        optimized: false
      };

      if (manualStops.length > 0) {
        const existingNames = new Set(uniqueStops.map(s => s.name.toLowerCase().trim()));
        const nonDuplicateManual = manualStops.filter(ms => !existingNames.has(ms.name.toLowerCase().trim()));
        if (nonDuplicateManual.length > 0) {
          newRoute.stops = [...newRoute.stops, ...nonDuplicateManual];
          newRoute.stats.manual = nonDuplicateManual.length;
          newRoute.stats.total = newRoute.stops.length;
        }
      }

      setRoute(newRoute);
      
      const lockedNames = newRoute.stops
        .filter(s => s.custom && (s.locked || customLocations.find(cl => cl.name === s.name)?.locked))
        .map(s => s.name);
      if (lockedNames.length > 0) loadReviewAverages(lockedNames);
      
      if (disabledStops.length > 0) {
        const newStopNames = new Set(newRoute.stops.map(s => (s.name || '').toLowerCase().trim()));
        const stillRelevant = disabledStops.filter(name => newStopNames.has(name));
        if (stillRelevant.length !== disabledStops.length) {
          setDisabledStops(stillRelevant);
        }
      }
      
      setTimeout(() => {
        if (wizardMode) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          document.getElementById('route-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
    } catch (error) {
      console.error('[ROUTE] Fatal error generating route:', error);
      showToast(`${t('general.error')}: ${error.message || t('general.unknownError')}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const recomputeForMap = (overrideStart, overrideType, skipSmartSelect) => {
    const type = overrideType !== undefined ? overrideType : routeTypeRef.current;
    return runSmartPlan({ overrideStart, overrideType: type, skipSmartSelect });
  };

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
        return !existingNames.includes(loc.name.toLowerCase().trim());
      });
      
      if (unusedCustom.length > 0) {
        const toAdd = unusedCustom.slice(0, fetchCount);
        placesToAdd = toAdd.map(p => ({ ...p, addedLater: true }));
        source = t('general.fromMyPlaces');
      }
      
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
          googleCacheRef.current[interest] = unusedCached.slice(needed);
          source = source ? `${source} + ${t("places.fromGoogleCache")}` : t('places.fromGoogle');
        }
      }
      
      if (placesToAdd.length < fetchCount) {
        const interestObjFM = allInterestOptions.find(o => o.id === interest);
        const isPrivate = interestObjFM?.privateOnly || false;
        
        if (isPrivate) {
        } else {
        const needed = fetchCount - placesToAdd.length;
        
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
        googleCacheRef.current[interest] = newPlaces.slice(needed);
        placesToAdd.push(...fromApi);
        source = source ? `${source} + ${t("places.fromGoogle")}` : t('places.fromGoogle');
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

  const fetchMoreAll = async () => {
    if (!route) return;
    
    setIsGenerating(true);
    
    try {
      const fetchCount = formData.fetchMoreCount || 3;
      const perInterest = Math.ceil(fetchCount / formData.interests.length);
      const isRadiusMode = formData.searchMode === 'radius' || formData.searchMode === 'all';
      const existingNames = route.stops.map(s => s.name.toLowerCase().trim());
      
      const allNewPlaces = [];
      let fromCustom = 0;
      let fromCache = 0;
      let fromApi = 0;
      
      for (const interest of formData.interests) {
        const allUsedNames = [...existingNames, ...allNewPlaces.map(p => p.name.toLowerCase().trim())];
        let placesForInterest = [];
        
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
        
        if (placesForInterest.length < perInterest) {
          const interestObjFA = allInterestOptions.find(o => o.id === interest);
          const isPrivateAll = interestObjFA?.privateOnly || false;
          
          if (!isPrivateAll) {
          const needed = perInterest - placesForInterest.length;
          
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

  const filterBlacklist = (places) => {
    const blacklistedNames = customLocations
      .filter(loc => loc.status === 'blacklist' && (loc.cityId || 'bangkok') === selectedCityId)
      .map(loc => loc.name.toLowerCase().trim());
    
    if (blacklistedNames.length === 0) return places;
    
    return places.filter(place => {
      const placeName = place.name.toLowerCase().trim();
      const isBlacklisted = blacklistedNames.includes(placeName);
      if (isBlacklisted) {
      }
      return !isBlacklisted;
    });
  };
  
  const filterDuplicatesOfCustom = (places) => {
    const customNames = customLocations
      .filter(loc => loc.status !== 'blacklist' && (loc.cityId || 'bangkok') === selectedCityId)
      .map(loc => loc.name.toLowerCase().trim());
    
    if (customNames.length === 0) return places;
    
    return places.filter(place => {
      const placeName = place.name.toLowerCase().trim();
      const isDuplicate = customNames.includes(placeName);
      if (isDuplicate) {
      }
      return !isDuplicate;
    });
  };

  const stripRouteForStorage = (r) => {
    const stripped = { ...r };
    if (stripped.stops) {
      stripped.stops = stripped.stops.map(s => {
        const clean = { ...s };
        if (clean.uploadedImage && clean.uploadedImage.startsWith('data:')) {
          delete clean.uploadedImage;
        }
        if (clean.uploadedImage && clean.uploadedImage.length > 200) {
          delete clean.uploadedImage;
        }
        delete clean.imageUrls;
        return clean;
      });
    }
    return stripped;
  };

  const saveRoutesToStorage = (routes) => {
    if (isFirebaseAvailable && database) {
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
    const coords = savedRoute.startPointCoords || null;
    const validatedAddress = coords?.address || '';
    const startPointText = validatedAddress || 
      (savedRoute.startPoint !== t('form.startPointFirst') ? savedRoute.startPoint : '') || 
      '';
    setFormData({...savedRoute.preferences, startPoint: startPointText });
    setStartPointCoords(coords);
    setRouteType(savedRoute.circular ? 'circular' : 'linear');
    setCurrentView('form');
    window.scrollTo(0, 0);
  };

  const deleteCustomInterest = (interestId) => {
    const interestToDelete = customInterests.find(i => i.id === interestId);
    
    const locationsUsingInterest = customLocations.filter(loc => 
      loc.interests && loc.interests.includes(interestId)
    );
    
    if (isFirebaseAvailable && database) {
      if (interestToDelete && interestToDelete.firebaseId) {
        database.ref(`customInterests/${interestToDelete.firebaseId}`).remove()
          .then(() => {
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

  const toggleInterestStatus = (interestId) => {
    if (!isInterestValid(interestId) && !interestStatus[interestId]) return;
    
    const newStatus = !interestStatus[interestId];
    const updatedStatus = { ...interestStatus, [interestId]: newStatus };
    setInterestStatus(updatedStatus);
    
    if (isFirebaseAvailable && database) {
      const userId = localStorage.getItem('bangkok_user_id') || 'unknown';
      database.ref(`users/${userId}/interestStatus/${interestId}`).set(newStatus)
        .then(() => {
        })
        .catch(err => {
          console.error('Error updating interest status:', err);
        });
    } else {
      localStorage.setItem('bangkok_interest_status', JSON.stringify(updatedStatus));
    }
  };

  const resetInterestStatusToDefault = async () => {
    if (isFirebaseAvailable && database) {
      const userId = localStorage.getItem('bangkok_user_id') || 'unknown';
      try {
        await database.ref(`users/${userId}/interestStatus`).remove();
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

  const isInterestValid = (interestId) => {
    const interestObj = allInterestOptions.find(o => o.id === interestId);
    if (interestObj?.privateOnly) return true;
    const rawCustom = customInterests.find(o => o.id === interestId);
    if (rawCustom?.privateOnly) return true;
    
    const config = interestConfig[interestId];
    if (config) {
      if (config.textSearch && config.textSearch.trim()) return true;
      if (config.types && Array.isArray(config.types) && config.types.length > 0) return true;
    }
    
    const cityPlaces = window.BKK.interestToGooglePlaces || {};
    const cityTextSearch = window.BKK.textSearchInterests || {};
    if (cityPlaces[interestId] && cityPlaces[interestId].length > 0) return true;
    if (cityTextSearch[interestId]) return true;
    
    return false;
  };

  const isLocationValid = (loc) => {
    if (!loc) return false;
    if (!loc.name || !loc.name.trim()) return false;
    return true;
  };

  const deleteCustomLocation = (locationId) => {
    const locationToDelete = customLocations.find(loc => loc.id === locationId);
    
    if (isFirebaseAvailable && database) {
      if (locationToDelete && locationToDelete.firebaseId) {
        database.ref(`cities/${selectedCityId}/locations/${locationToDelete.firebaseId}`).remove()
          .then(() => {
            showToast(t('places.placeDeleted'), 'success');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error deleting location:', error);
            showToast(t('toast.deleteError'), 'error');
          });
      }
    } else {
      const updated = customLocations.filter(loc => loc.id !== locationId);
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(t('places.placeDeleted'), 'success');
    }
  };
  
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
    
    if (isFirebaseAvailable && database) {
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
    
    try {
      const db = (typeof window.firebase !== 'undefined' && window.firebase.apps?.length) ? window.firebase.database() : null;
      if (db && (reviewDialog.myRating > 0 || reviewDialog.myText.trim())) {
        const path = `cities/${cityId}/reviews/${reviewDialog.placeKey}/${visitorId}`;
        await db.ref(path).set({
          rating: reviewDialog.myRating,
          text: reviewDialog.myText.trim(),
          userName: userName,
          timestamp: Date.now()
        });
        showToast(t('reviews.saved'), 'success');
        loadReviewAverages([reviewDialog.place?.name || '']);
      } else {
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
  
  const addGooglePlaceToCustom = async (place) => {
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase().trim() === place.name.toLowerCase().trim()
    );
    
    if (exists) {
      showToast(`"${place.name}" ${t("places.alreadyInMyList")}`, 'warning');
      return false;
    }
    
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
    
    if (isFirebaseAvailable && database) {
      try {
        const ref = await database.ref(`cities/${selectedCityId}/locations`).push(locationToAdd);
        try {
          await Promise.race([
            ref.once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
          showToast(`✅ "${place.name}" ${t("places.addedToYourList")}`, 'success');
        } catch (e) {
          showToast(`💾 "${place.name}" — ${t('toast.savedWillSync')}`, 'warning', 'sticky');
        }
        setAddingPlaceIds(prev => prev.filter(id => id !== placeId));
        return true;
      } catch (error) {
        console.error('[FIREBASE] Error adding Google place, saving to pending:', error);
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
  
  const skipPlacePermanently = (place) => {
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase() === place.name.toLowerCase()
    );
    
    if (exists) {
      if (exists.status === 'blacklist') {
        showToast(`"${place.name}" ${t("places.alreadyBlacklisted")}`, 'warning');
        return;
      }
      
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
    
    const boundaryCheck = checkLocationInArea(place.lat, place.lng, formData.area);
    
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
    
    if (isFirebaseAvailable && database) {
      database.ref(`cities/${selectedCityId}/locations`).push(locationToAdd)
        .then(() => {
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
  
  const handleImportMerge = async () => {
    let addedInterests = 0;
    let skippedInterests = 0;
    let addedLocations = 0;
    let skippedLocations = 0;
    let addedRoutes = 0;
    let skippedRoutes = 0;
    let updatedConfigs = 0;
    let updatedStatuses = 0;
    
    const interestExistsByLabel = (label) => {
      return customInterests.find(i => (i.label || i.name || '').toLowerCase() === label.toLowerCase());
    };
    
    const locationExistsByName = (name) => {
      return customLocations.find(l => l.name.toLowerCase() === name.toLowerCase());
    };
    
    if (isFirebaseAvailable && database) {
      
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
      
      if (importedData.interestCounters && typeof importedData.interestCounters === 'object') {
        for (const [interestId, counter] of Object.entries(importedData.interestCounters)) {
          try {
            await database.ref(`cities/${selectedCityId}/interestCounters/${interestId}`).set(counter);
          } catch (error) {
            console.error('[FIREBASE] Error importing counter:', error);
          }
        }
      }
      
      if (importedData.systemParams && typeof importedData.systemParams === 'object') {
        const merged = { ...window.BKK._defaultSystemParams, ...importedData.systemParams };
        window.BKK.systemParams = merged;
        setSystemParams(merged);
        if (isFirebaseAvailable && database) {
          await database.ref('settings/systemParams').set(merged);
        }
      }
      
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
      const newInterests = [...customInterests];
      const newLocations = [...customLocations];
      const newConfig = { ...interestConfig };
      const newStatus = { ...interestStatus };
      
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
      
      if (importedData.interestConfig) {
        Object.entries(importedData.interestConfig).forEach(([id, config]) => {
          newConfig[id] = config;
          updatedConfigs++;
        });
      }
      
      if (importedData.interestStatus) {
        Object.entries(importedData.interestStatus).forEach(([id, status]) => {
          newStatus[id] = status;
          updatedStatuses++;
        });
      }
      
      if (importedData.interestCounters && typeof importedData.interestCounters === 'object') {
        setInterestCounters(prev => ({ ...prev, ...importedData.interestCounters }));
      }
      
      if (importedData.systemParams && typeof importedData.systemParams === 'object') {
        const merged = { ...window.BKK._defaultSystemParams, ...importedData.systemParams };
        window.BKK.systemParams = merged;
        setSystemParams(merged);
      }
      
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

  const saveWithDedupCheck = async (closeAfter = true, closeQuickCapture = false) => {
    const loc = { ...newLocation };
    if (!loc.name?.trim() || !loc.interests?.length) {
      addCustomLocation(closeAfter);
      return;
    }
    if (!loc.lat || !loc.lng || (!sp.dedupGoogleEnabled && !sp.dedupCustomEnabled)) {
      addCustomLocation(closeAfter);
      if (closeQuickCapture) setShowQuickCapture(false);
      return;
    }
    
    if (closeQuickCapture) setShowQuickCapture(false);
    
    try {
      const matches = await findNearbyDuplicates(loc.lat, loc.lng, loc.interests);
      
      if (matches && matches.custom.length > 0) {
        const dup = matches.custom[0];
        const newInterests = loc.interests.filter(i => !dup.interests?.includes(i));
        
        if (newInterests.length > 0) {
          const mergedInterests = [...(dup.interests || []), ...newInterests];
          const updated = customLocations.map(l => 
            l.id === dup.id ? { ...l, interests: mergedInterests } : l
          );
          setCustomLocations(updated);
          
          if (isFirebaseAvailable && database && dup.firebaseKey) {
            database.ref(`cities/${selectedCityId}/locations/${dup.firebaseKey}/interests`).set(mergedInterests);
          }
          
          const interestNames = newInterests.map(id => {
            const opt = allInterestOptions.find(o => o.id === id);
            return opt ? (tLabel(opt) || id) : id;
          }).join(', ');
          showToast(`🔗 "${dup.name}" +${interestNames}`, 'success', 4000);
        } else {
          showToast(`⚠️ ${t('dedup.duplicateSkipped')}: "${dup.name}" (${dup._distance}m)`, 'warning', 4000);
        }
        
        if (loc.uploadedImage) {
          try { window.BKK.saveImageToDevice?.(loc.uploadedImage, dup.name); } catch(e) {}
        }
        return;
      }
      
      if (matches && matches.google.length > 0) {
        const best = matches.google.sort((a, b) => a._distance - b._distance || (b.rating - a.rating))[0];
        const googleData = {
          ...loc,
          name: best.name,
          lat: best.lat || loc.lat,
          lng: best.lng || loc.lng,
          address: best.address || '',
          mapsUrl: best.mapsUrl || '',
          description: `⭐ ${best.rating?.toFixed(1) || 'N/A'} (${best.ratingCount || 0})`,
          googlePlace: true,
          googlePlaceId: best.googlePlaceId || ''
        };
        addCustomLocation(closeAfter, googleData);
        showToast(`📍 ${t('dedup.googleMatch')}: ${best.name}`, 'success', 4000);
        return;
      }
    } catch (e) {
    }
    
    addCustomLocation(closeAfter);
    if (closeQuickCapture) showToast('✅ ' + t('trail.saved'), 'success');
  };

  const scanAllDuplicates = () => {
    const radius = sp.dedupRadiusMeters || 50;
    const locs = customLocations.filter(l => l.lat && l.lng);
    const clusters = [];
    const seen = new Set();
    
    const relatedMap = {};
    for (const opt of allInterestOptions) {
      const related = interestConfig[opt.id]?.dedupRelated || opt.dedupRelated || [];
      if (!relatedMap[opt.id]) relatedMap[opt.id] = new Set();
      related.forEach(r => {
        relatedMap[opt.id].add(r);
        if (!relatedMap[r]) relatedMap[r] = new Set();
        relatedMap[r].add(opt.id);
      });
    }
    
    const interestsOverlap = (a, b) => {
      if (!a?.length || !b?.length) return false;
      for (const ia of a) {
        if (b.includes(ia)) return true;
        const rel = relatedMap[ia];
        if (rel && b.some(ib => rel.has(ib))) return true;
      }
      return false;
    };
    
    for (let i = 0; i < locs.length; i++) {
      if (seen.has(locs[i].id)) continue;
      const matches = [];
      for (let j = i + 1; j < locs.length; j++) {
        if (seen.has(locs[j].id)) continue;
        const dist = calcDistance(locs[i].lat, locs[i].lng, locs[j].lat, locs[j].lng);
        if (dist <= radius && interestsOverlap(locs[i].interests, locs[j].interests)) {
          matches.push({ ...locs[j], _distance: Math.round(dist) });
          seen.add(locs[j].id);
        }
      }
      if (matches.length > 0) {
        seen.add(locs[i].id);
        clusters.push({ loc: locs[i], matches });
      }
    }
    
    setBulkDedupResults(clusters);
    if (clusters.length === 0) {
      showToast('✅ ' + t('dedup.noDuplicates'), 'success');
    } else {
      showToast(`🔍 ${clusters.length} ${t('dedup.clustersFound')}`, 'info');
    }
  };

  const mergeDedupLocations = (keepId, removeId) => {
    const remove = customLocations.find(l => l.id === removeId);
    if (!remove) return;
    
    const updated = customLocations.filter(l => l.id !== removeId);
    setCustomLocations(updated);
    
    if (isFirebaseAvailable && database && remove.firebaseKey) {
      database.ref(`cities/${selectedCityId}/locations/${remove.firebaseKey}`).remove();
    }
    
    setBulkDedupResults(prev => {
      if (!prev) return null;
      return prev.map(c => ({
        ...c,
        matches: c.matches.filter(m => m.id !== removeId)
      })).filter(c => c.loc.id !== removeId && c.matches.length > 0);
    });
    
    showToast(`🗑️ ${remove.name} → ${t('dedup.merged')}`, 'success');
  };

  const addCustomLocation = (closeAfter = true, overrideData = null) => {
    const locData = overrideData || newLocation;
    if (!locData.name?.trim() || !locData.interests?.length) {
      return; // Just don't add if validation fails
    }
    
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase().trim() === locData.name.toLowerCase().trim()
    );
    if (exists) {
      showToast(`⚠️ "${locData.name}" ${t("places.alreadyInList")}`, 'warning');
    }
    
    let lat = locData.lat;
    let lng = locData.lng;
    let outsideArea = false;
    let hasCoordinates = (lat !== null && lng !== null && lat !== 0 && lng !== 0);
    
    let finalAreas = locData.areas || (locData.area ? [locData.area] : []);
    if (hasCoordinates) {
      const detected = window.BKK.getAreasForCoordinates(lat, lng);
      if (detected.length > 0) {
        finalAreas = detected;
      } else if (finalAreas.length > 0) {
        const inAnyArea = finalAreas.some(aId => checkLocationInArea(lat, lng, aId).valid);
        outsideArea = !inAnyArea;
        if (outsideArea) {
          const areaNames = finalAreas.map(aId => areaOptions.find(a => a.id === aId)).filter(Boolean).map(a => tLabel(a)).join(', ');
          showToast(
            `⚠️ ${locData.name.trim()} — ${t("toast.outsideAreaWarning")} (${areaNames})`,
            'warning'
          );
        }
      }
    }
    if (finalAreas.length === 0) finalAreas = ['sukhumvit'];
    
    const newId = Date.now();
    const locationToAdd = {
      id: newId,
      name: locData.name.trim(),
      description: (locData.description || '').trim() || (locData.notes || '').trim() || t('general.addedByUser'),
      notes: (locData.notes || '').trim(),
      area: finalAreas[0],
      areas: finalAreas,
      interests: locData.interests,
      lat: lat,
      lng: lng,
      mapsUrl: locData.mapsUrl || '',
      address: locData.address || '',
      uploadedImage: locData.uploadedImage || null,
      imageUrls: locData.imageUrls || [],
      outsideArea: outsideArea, // Flag for outside area
      missingCoordinates: !hasCoordinates, // Flag for missing coordinates
      custom: true,
      status: 'active',
      locked: locData.locked || false,
      addedAt: new Date().toISOString(),
      cityId: selectedCityId
    };
    
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
    
    if (isFirebaseAvailable && database) {
      incrementCounters();
      database.ref(`cities/${selectedCityId}/locations`).push(locationToAdd)
        .then(async (ref) => {
          try {
            await Promise.race([
              ref.once('value'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);
            showToast(`✅ ${locationToAdd.name} — ${t('places.placeAddedShared')}`, 'success');
          } catch (verifyErr) {
            showToast(`💾 ${locationToAdd.name} — ${t('toast.savedWillSync')}`, 'warning', 'sticky');
          }
          
          if (!closeAfter) {
            const addedWithFirebaseId = { ...locationToAdd, firebaseId: ref.key };
            setEditingLocation(addedWithFirebaseId);
            setShowAddLocationDialog(false);
            setShowEditLocationDialog(true);
          }
        })
        .catch((error) => {
          console.error('[FIREBASE] Push failed completely, saving to pending:', error);
          saveToPending(locationToAdd);
        });
    } else {
      const updated = [...customLocations, locationToAdd];
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(t('places.placeAdded'), 'success');
      
      if (!closeAfter) {
        setEditingLocation(locationToAdd);
        setShowAddLocationDialog(false);
        setShowEditLocationDialog(true);
      }
    }
    
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
  
  const updateCustomLocation = (closeAfter = true) => {
    if (!newLocation.name?.trim()) {
      showToast(t('places.enterPlaceName'), 'warning');
      return;
    }
    
    const exists = customLocations.find(loc => 
      loc.name.toLowerCase().trim() === newLocation.name.toLowerCase().trim() &&
      loc.id !== editingLocation.id
    );
    if (exists) {
      showToast(`⚠️ "${newLocation.name}" ${t("places.alreadyInList")}`, 'warning');
    }
    
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
    
    let hasCoordinates = (newLocation.lat !== null && newLocation.lng !== null && 
                          newLocation.lat !== 0 && newLocation.lng !== 0);
    let outsideArea = false;
    
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
    
    if (isFirebaseAvailable && database) {
      const { firebaseId, ...locationData } = updatedLocation;
      
      if (firebaseId) {
        database.ref(`cities/${selectedCityId}/locations/${firebaseId}`).set(locationData)
          .then(async () => {
            try {
              await Promise.race([
                database.ref(`cities/${selectedCityId}/locations/${firebaseId}`).once('value'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
              ]);
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
      const updated = customLocations.map(loc => 
        loc.id === editingLocation.id ? updatedLocation : loc
      );
      setCustomLocations(updated);
      localStorage.setItem('bangkok_custom_locations', JSON.stringify(updated));
      showToast(t('places.placeUpdated'), 'success');
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
        }
      },
      (reason) => {
        if (reason === 'outside_city') showToast(t('toast.outsideCity'), 'warning', 'sticky');
        else showToast(reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'error', 'sticky');
      }
    );
  };

  const geocodeAddress = async (address) => {
    if (!address || !address.trim()) {
      showToast(t('form.enterAddress'), 'warning');
      return;
    }

    try {
      showToast(t('places.searchingAddress'), 'info');
      
      const cityName = window.BKK.cityNameForSearch || 'Bangkok';
      const countryName = window.BKK.selectedCity?.country || '';
      const searchQuery = address.toLowerCase().includes(cityName.toLowerCase()) 
        ? address 
        : `${address}, ${cityName}${countryName ? ', ' + countryName : ''}`;
      
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
    
    if (!isCurrentlyDisabled && startPointCoords && stop?.lat && stop?.lng) {
      if (Math.abs(stop.lat - startPointCoords.lat) < 0.0001 && Math.abs(stop.lng - startPointCoords.lng) < 0.0001) {
        setStartPointCoords(null);
        startPointCoordsRef.current = null;
        setFormData(prev => ({...prev, startPoint: ''}));
      }
    }
    
    if (route?.optimized) {
      setRoute(prev => prev ? {...prev, optimized: false} : prev);
    }
  };



  const renderIcon = (icon, size = '14px') => {
    if (!icon) return null;
    const isUrl = typeof icon === 'string' && (icon.startsWith('data:') || icon.startsWith('http'));
    return isUrl 
      ? <img src={icon} alt="" style={{ width: size, height: size, objectFit: 'contain', display: 'inline', verticalAlign: 'middle' }} />
      : icon;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50" dir={window.BKK.i18n.isRTL() ? 'rtl' : 'ltr'}>
      {/* Loading Overlay */}
      {!isDataLoaded && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #E17055 0%, #FDCB6E 100%)' }}>
          <div className="text-center">
            <svg viewBox="0 0 200 200" width="72" height="72" style={{ margin: '0 auto 12px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}>
              <circle cx="100" cy="108" r="52" fill="#FFE8D6"/>
              <polygon points="62,72 50,28 82,58" fill="#FFE8D6"/>
              <polygon points="138,72 150,28 118,58" fill="#FFE8D6"/>
              <polygon points="64,70 54,34 80,58" fill="#FFCBA4"/>
              <polygon points="136,70 146,34 120,58" fill="#FFCBA4"/>
              <rect x="68" y="94" width="26" height="19" rx="6" fill="#2D2D2D" opacity="0.9"/>
              <rect x="106" y="94" width="26" height="19" rx="6" fill="#2D2D2D" opacity="0.9"/>
              <line x1="94" y1="103" x2="106" y2="103" stroke="#2D2D2D" strokeWidth="3"/>
              <line x1="68" y1="100" x2="56" y2="95" stroke="#2D2D2D" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="132" y1="100" x2="144" y2="95" stroke="#2D2D2D" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M95,120 L100,125 L105,120 Z" fill="#FF8C94"/>
              <path d="M90,130 Q100,138 110,130" fill="none" stroke="#8B6F5E" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M148,140 Q170,125 165,100" fill="none" stroke="#FFE8D6" strokeWidth="10" strokeLinecap="round"/>
            </svg>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>FouFou</h2>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginBottom: '16px' }}>City Trail Generator 🍜🏛️🎭</div>
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" style={{ color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.3 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{t("general.loading")}</span>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const theme = window.BKK.selectedCity?.theme || { color: '#e11d48', iconLeft: '🏙️', iconRight: '🗺️' };
        const c = theme.color || '#e11d48';
        return (
      <div style={{
        background: `linear-gradient(135deg, ${c} 0%, ${c}dd 50%, ${c} 100%)`,
        backgroundSize: '200% 200%',
        animation: 'headerShimmer 6s ease infinite',
        padding: '6px 16px',
        boxShadow: `0 2px 8px ${c}33`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Feedback button - left in RTL, right in LTR */}
          <button
            onClick={() => setShowFeedbackDialog(true)}
            style={{
              position: 'absolute',
              [currentLang === 'he' ? 'left' : 'right']: '0',
              background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: '50%',
              width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '13px', color: 'white',
              transition: 'background 0.2s'
            }}
            title={t("settings.sendFeedback")}
          >💬</button>
          <span style={{ fontSize: '14px' }}>{theme.iconLeft || window.BKK.selectedCity?.secondaryIcon || '🏙️'}</span>
          <h1 style={{ 
            fontSize: '16px', 
            fontWeight: '800', 
            color: 'white',
            letterSpacing: '0.5px',
            margin: 0,
            textShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}>{tLabel(window.BKK.selectedCity) || 'FouFou'}</h1>
          <span style={{ fontSize: '14px' }}>{theme.iconRight || window.BKK.selectedCity?.icon || '🗺️'}</span>
          <span style={{ 
            fontSize: '8px', 
            color: 'rgba(255,255,255,0.5)',
            alignSelf: 'flex-end',
            marginBottom: '2px'
          }}>v{window.BKK.VERSION}</span>
          {isFirebaseAvailable && !firebaseConnected && (
            <span title={t('toast.offline')} style={{ 
              fontSize: '8px', 
              color: '#fbbf24',
              alignSelf: 'flex-end',
              marginBottom: '2px',
              animation: 'pulse 2s infinite'
            }}>⚡</span>
          )}
          {(pendingLocations.length + pendingInterests.length) > 0 && (
            <span title={`${pendingLocations.length + pendingInterests.length} ${t('toast.pendingSync')}`} style={{ 
              fontSize: '8px', 
              color: '#fb923c',
              alignSelf: 'flex-end',
              marginBottom: '2px',
              fontWeight: 'bold',
              animation: 'pulse 2s infinite'
            }}>☁️{pendingLocations.length + pendingInterests.length}</span>
          )}
        </div>
      </div>
      );
      })()}

      {/* Update Banner */}
      {updateAvailable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🐾</div>
            <h3 className="text-lg font-bold mb-2">{t("general.newVersionAvailableBanner")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("general.updateDesc")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setUpdateAvailable(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200"
              >
                {t("general.later")}
              </button>
              <button
                onClick={applyUpdate}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                {t("general.updateNow")}
              </button>
            </div>
          </div>
        </div>
      )}      <div className="max-w-4xl mx-auto p-2 sm:p-4 pb-32">
        {/* ACTIVE TRAIL MODE — shown when user opened Google Maps route */}
        {activeTrail && (
          <div className="view-fade-in">
            {/* Compact header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <button onClick={() => switchLanguage(currentLang === 'he' ? 'en' : 'he')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2px 8px', color: '#6b7280', fontSize: '10px', cursor: 'pointer' }}>
                {currentLang === 'he' ? '🇬🇧 EN' : '🇮🇱 עב'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>🐾 {t('trail.activeTitle')}</span>
              </div>
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                ⏱️ {(() => { const mins = Math.round((Date.now() - activeTrail.startedAt) / 60000); return mins < 60 ? `${mins} ${t('general.min')}` : `${Math.floor(mins/60)}h ${mins%60}m`; })()}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px 0', textAlign: 'center' }}>{t('trail.activeDesc')}</p>

            {/* Camera Button — compact */}
            <button
              onClick={() => {
                const defaultInterests = activeTrail.lastInterest 
                  ? [activeTrail.lastInterest] 
                  : (activeTrail.interests || []).slice(0, 1);
                const initLocation = {
                  name: '', description: '', notes: '',
                  area: activeTrail.area || formData.area,
                  areas: activeTrail.area ? [activeTrail.area] : [formData.area],
                  interests: defaultInterests,
                  lat: null, lng: null, mapsUrl: '', address: '',
                  uploadedImage: null, imageUrls: [],
                  nearestStop: null, gpsLoading: true
                };
                setNewLocation(initLocation);
                setShowQuickCapture(true);
                if (navigator.geolocation) {
                  window.BKK.getValidatedGps(
                    (pos) => {
                      const lat = pos.coords.latitude;
                      const lng = pos.coords.longitude;
                      let nearest = null;
                      let minDist = Infinity;
                      (activeTrail.stops || []).forEach((stop, idx) => {
                        if (!stop.lat || !stop.lng) return;
                        const dlat = (lat - stop.lat) * 111320;
                        const dlng = (lng - stop.lng) * 111320 * Math.cos(lat * Math.PI / 180);
                        const dist = Math.sqrt(dlat * dlat + dlng * dlng);
                        if (dist < minDist) { minDist = dist; nearest = { ...stop, idx, dist: Math.round(dist) }; }
                      });
                      const detected = window.BKK.getAreasForCoordinates(lat, lng);
                      const areaUpdates = detected.length > 0 ? { areas: detected, area: detected[0] } : {};
                      setNewLocation(prev => ({
                        ...prev, lat, lng, nearestStop: nearest, gpsLoading: false, ...areaUpdates
                      }));
                    },
                    (reason) => {
                      setNewLocation(prev => ({...prev, gpsLoading: false, gpsBlocked: true}));
                      showToast(reason === 'outside_city' ? t('toast.outsideCity') : reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'warning', 'sticky');
                    }
                  );
                }
              }}
              style={{
                width: '100%', padding: '14px', marginBottom: '8px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white', border: 'none', borderRadius: '14px',
                fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(34,197,94,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <span style={{ fontSize: '22px' }}>📸</span>
              <span>{t('trail.capturePlace')}</span>
            </button>

            {/* Trail Stops — compact list */}
            {activeTrail.stops?.length > 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '8px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', marginBottom: '4px' }}>
                  {`📍 ${t('trail.stops')} (${activeTrail.stops.length})`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {activeTrail.stops.slice(0, 12).map((stop, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px',
                      background: '#f9fafb', borderRadius: '6px', fontSize: '11px'
                    }}>
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', fontWeight: 'bold', color: '#6b7280', flexShrink: 0
                      }}>{String.fromCharCode(65 + idx)}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stop.name}
                      </span>
                    </div>
                  ))}
                  {activeTrail.stops.length > 12 && (
                    <div style={{ fontSize: '9px', color: '#9ca3af', padding: '3px 6px' }}>
                      +{activeTrail.stops.length - 12}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (activeTrail.stops?.length >= 2) {
                    const coords = activeTrail.stops.map(s => `${s.lat},${s.lng}`).join('/');
                    window.open(`https://www.google.com/maps/dir//${coords}/data=!4m2!4m1!3e2`, 'city_explorer_map');
                  }
                }}
                style={{
                  flex: 1, padding: '10px', background: '#2563eb', color: 'white',
                  border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {`🗺️ ${t('trail.backToMaps')}`}
              </button>
              <button
                onClick={() => {
                  endActiveTrail();
                  showToast(t('trail.ended'), 'success');
                }}
                style={{
                  padding: '10px 20px', background: '#fee2e2', color: '#dc2626',
                  border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {`🏁 ${t('trail.endTrail')}`}
              </button>
            </div>

            {/* New trail button */}
            <button
              onClick={() => {
                endActiveTrail();
                setRoute(null);
                setWizardStep(1);
                setCurrentView('form');
                window.scrollTo(0, 0);
              }}
              style={{
                width: '100%', marginTop: '8px', padding: '10px',
                background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px',
                fontSize: '12px', fontWeight: 'bold', color: '#0284c7', cursor: 'pointer'
              }}
            >
              {`🔄 ${t('trail.newTrail')}`}
            </button>
          </div>
        )}

        {/* WIZARD MODE */}
        {wizardMode && !activeTrail && (
          <div className={wizardStep < 3 ? "view-fade-in" : ""}>
            {/* Wizard Header — shown on all steps */}
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              {/* Top bar: advanced mode + language */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0px' }}>
                <button onClick={() => { setWizardMode(false); setCurrentView('form'); localStorage.setItem('bangkok_wizard_mode', 'false'); }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline' }}>
                  {`⚙️ ${t("nav.advancedMode")}`}
                </button>
                <button onClick={() => switchLanguage(currentLang === 'he' ? 'en' : 'he')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2px 8px', color: '#6b7280', fontSize: '10px', cursor: 'pointer' }}>
                  {currentLang === 'he' ? '🇬🇧 EN' : '🇮🇱 עב'}
                </button>
              </div>
              {/* Step indicators — clickable to go back */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                {[1, 2, 3].map((step, i) => (
                  <React.Fragment key={step}>
                    {i > 0 && <div style={{ width: '20px', height: '2px', background: wizardStep >= step ? '#22c55e' : '#e5e7eb', borderRadius: '1px' }} />}
                    <div
                      onClick={() => {
                        if (step < wizardStep) {
                          setWizardStep(step);
                          if (step < 3) { setRoute(null); setRouteChoiceMade(null); setCurrentView('form'); }
                          if (step === 1) { /* interests preserved */ };
                          window.scrollTo(0, 0);
                        }
                      }}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 'bold',
                        background: wizardStep === step ? '#e11d48' : wizardStep > step ? '#22c55e' : '#e5e7eb',
                        color: wizardStep >= step ? 'white' : '#9ca3af',
                        cursor: step < wizardStep ? 'pointer' : 'default',
                        transition: 'all 0.3s'
                      }}
                    >{wizardStep > step ? '✓' : step}</div>
                  </React.Fragment>
                ))}
              </div>
              
            </div>
            {wizardStep === 1 && (
              <div className="bg-white rounded-xl shadow-lg p-3">
                {/* City Selector - small button only */}
                {Object.values(window.BKK.cities || {}).filter(c => c.active !== false).length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                    <select
                      value={selectedCityId}
                      onChange={(e) => switchCity(e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '12px', fontWeight: 'bold', color: '#374151', background: 'white', cursor: 'pointer' }}
                    >
                      {Object.values(window.BKK.cities || {}).filter(c => c.active !== false).map(city => (
                        <option key={city.id} value={city.id}>{city.icon} {tLabel(city)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginBottom: '1px' }}>{`📍 ${t("wizard.step1Title")}`}</h2>
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>
                  {t("wizard.step1Subtitle")}
                  {' '}
                  <button onClick={() => showHelpFor('main')} style={{ background: 'none', border: 'none', fontSize: '11px', cursor: 'pointer', color: '#3b82f6', marginRight: '4px', textDecoration: 'underline' }}>
                    {t("general.howItWorks")}
                  </button>
                </p>
                
                {/* Mode selector tabs */}
                <div style={{ display: 'flex', gap: '0', marginBottom: '8px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                  <button
                    onClick={() => setFormData({...formData, searchMode: formData.searchMode === 'radius' ? 'area' : formData.searchMode})}
                    style={{
                      flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                      background: formData.searchMode !== 'radius' ? '#2563eb' : 'white',
                      color: formData.searchMode !== 'radius' ? 'white' : '#6b7280',
                      transition: 'all 0.2s'
                    }}
                  >🗺️ {t('wizard.chooseArea')}</button>
                  <button
                    onClick={() => {
                      if (formData.searchMode !== 'radius') {
                        setFormData({...formData, searchMode: 'radius', radiusMeters: formData.radiusMeters || 500});
                        if (navigator.geolocation) {
                          window.BKK.getValidatedGps(
                            (pos) => {
                              setFormData(prev => ({...prev, currentLat: pos.coords.latitude, currentLng: pos.coords.longitude, radiusPlaceName: t('wizard.myLocation'), radiusSource: 'gps'}));
                              showToast(t('wizard.locationFound'), 'success');
                            },
                            (reason) => {
                              setFormData(prev => ({...prev, searchMode: 'area'}));
                              showToast(reason === 'outside_city' ? t('toast.outsideCity') : reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'warning', 'sticky');
                            }
                          );
                        }
                      }
                    }}
                    style={{
                      flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                      background: formData.searchMode === 'radius' ? '#2563eb' : 'white',
                      color: formData.searchMode === 'radius' ? 'white' : '#6b7280',
                      transition: 'all 0.2s'
                    }}
                  >📍 {t('general.nearMe')}</button>
                </div>

                {/* AREA MODE content */}
                {formData.searchMode !== 'radius' && (
                  <>
                    {/* Map button */}
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                      <button
                        onClick={() => { setMapMode('areas'); setShowMapModal(true); }}
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(5,150,105,0.3)' }}
                      >{t("wizard.showMap")}</button>
                    </div>

                    {/* Area Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginBottom: '6px' }}>
                      {(window.BKK.areaOptions || []).map(area => {
                        const safety = (window.BKK.areaCoordinates?.[area.id]?.safety) || 'safe';
                        return (
                        <button
                          key={area.id}
                          onClick={() => setFormData({...formData, area: area.id, searchMode: 'area'})}
                          style={{
                            padding: '6px 6px', borderRadius: '8px', border: formData.area === area.id && formData.searchMode === 'area' ? '2px solid #2563eb' : '1.5px solid #e5e7eb',
                            background: formData.area === area.id && formData.searchMode === 'area' ? '#eff6ff' : 'white',
                            cursor: 'pointer', textAlign: window.BKK.i18n.isRTL() ? 'right' : 'left', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#1f2937' }}>
                            {tLabel(area)}
                            {safety === 'caution' && <span style={{ color: '#f59e0b', marginRight: '3px' }} title={t("general.cautionArea")}>⚠️</span>}
                            {safety === 'danger' && <span style={{ color: '#ef4444', marginRight: '3px' }} title={t("general.dangerArea")}>🔴</span>}
                          </div>
                          <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '1px' }}>{tDesc(area) || tLabel(area)}</div>
                        </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* RADIUS MODE content */}
                {formData.searchMode === 'radius' && (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    {formData.currentLat ? (
                      <>
                        <div style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold', marginBottom: '8px' }}>
                          ✅ {t('wizard.locationFound')}
                        </div>
                        {/* Radius preset buttons */}
                        <div style={{ fontSize: '11px', color: '#374151', fontWeight: 'bold', marginBottom: '6px' }}>{t('form.searchRadius')}:</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {[100, 250, 500, 750, 1000].map(r => (
                            <button
                              key={r}
                              onClick={() => setFormData({...formData, radiusMeters: r})}
                              style={{
                                padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
                                border: formData.radiusMeters === r ? '2px solid #2563eb' : '1.5px solid #d1d5db',
                                background: formData.radiusMeters === r ? '#2563eb' : 'white',
                                color: formData.radiusMeters === r ? 'white' : '#374151',
                                transition: 'all 0.15s', minWidth: '52px'
                              }}
                            >{r >= 1000 ? `${r/1000}km` : `${r}m`}</button>
                          ))}
                        </div>
                        {/* Map button */}
                        <div style={{ marginTop: '8px' }}>
                          <button
                            onClick={() => { setMapMode('radius'); setShowMapModal(true); }}
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(5,150,105,0.3)' }}
                          >{t("wizard.showMap")}</button>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '20px 0' }}>
                        <div className="animate-spin" style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 8px' }}></div>
                        <div style={{ fontSize: '13px', color: '#374151', fontWeight: 'bold' }}>
                          📍 {t('form.waitingForGps')}
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                          {t('form.allowLocationAccess')}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Continue button */}
                <button
                  onClick={() => { setWizardStep(2); window.scrollTo(0, 0); }}
                  disabled={formData.searchMode === 'radius' ? !formData.currentLat : !formData.area}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', marginTop: '6px',
                    cursor: (formData.searchMode === 'radius' ? formData.currentLat : formData.area) ? 'pointer' : 'not-allowed',
                    background: (formData.searchMode === 'radius' ? formData.currentLat : formData.area) ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#d1d5db',
                    color: 'white', fontSize: '16px', fontWeight: 'bold',
                    boxShadow: (formData.searchMode === 'radius' ? formData.currentLat : formData.area) ? '0 4px 6px rgba(37,99,235,0.3)' : 'none'
                  }}
                >{t("general.next")}</button>
              </div>
            )}

            {/* Step 2: Choose Interests */}
            {wizardStep === 2 && (
              <div className="bg-white rounded-xl shadow-lg p-3">
                {/* Breadcrumb: back + area selection */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  fontSize: '11px', color: '#9ca3af', marginBottom: '6px'
                }}>
                  <span
                    onClick={() => { setWizardStep(1); window.scrollTo(0, 0); }}
                    style={{ cursor: 'pointer', color: '#3b82f6', fontWeight: '600', textDecoration: 'underline' }}
                  >{currentLang === 'he' ? '→' : '←'} {t("general.back")}</span>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <span
                    onClick={() => { setWizardStep(1); window.scrollTo(0, 0); }}
                    style={{ cursor: 'pointer' }}
                  >📍 {(() => {
                    if (formData.searchMode === 'all') return t('wizard.allCity');
                    if (formData.searchMode === 'radius') return `${t('general.nearMe')} (${formData.radiusMeters >= 1000 ? `${formData.radiusMeters/1000}km` : `${formData.radiusMeters}m`})`;
                    const area = (window.BKK.areaOptions || []).find(a => a.id === formData.area);
                    return area ? tLabel(area) : '';
                  })()}</span>
                </div>
                <h2 style={{ textAlign: 'center', fontSize: '17px', fontWeight: 'bold', marginBottom: '2px' }}>{`⭐ ${t("wizard.step2Title")}`}</h2>
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>{t("wizard.step2Subtitle")}</p>
                
                {/* Interest Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                  {allInterestOptions.filter(option => {
                    const status = interestStatus[option.id];
                    if (option.uncovered) return status === true;
                    if (option.scope === 'local' && option.cityId && option.cityId !== selectedCityId) return false;
                    return status !== false;
                  }).filter(option => isInterestValid(option.id)).map(option => {
                    const isSelected = formData.interests.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          const newInterests = isSelected
                            ? formData.interests.filter(id => id !== option.id)
                            : [...formData.interests, option.id];
                          setFormData({...formData, interests: newInterests});
                        }}
                        style={{
                          padding: '8px 4px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                          border: isSelected ? '2px solid #2563eb' : '2px solid #e5e7eb',
                          background: isSelected ? '#eff6ff' : 'white'
                        }}
                      >
                        <div style={{ fontSize: '22px', marginBottom: '2px' }}>{option.icon?.startsWith?.('data:') ? <img src={option.icon} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', display: 'inline' }} /> : option.icon}</div>
                        <div style={{ fontWeight: '700', fontSize: '11px', color: isSelected ? '#1e40af' : '#374151', wordBreak: 'break-word' }}>{tLabel(option)}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Search button */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    onClick={() => { generateRoute(); setRouteChoiceMade(null); setWizardStep(3); window.scrollTo(0, 0); }}
                    disabled={!isDataLoaded || formData.interests.length === 0}
                    style={{
                      flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                      cursor: isDataLoaded && formData.interests.length > 0 ? 'pointer' : 'not-allowed',
                      background: isDataLoaded && formData.interests.length > 0 ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#d1d5db',
                      color: 'white', fontSize: '14px', fontWeight: 'bold',
                      boxShadow: isDataLoaded && formData.interests.length > 0 ? '0 4px 6px rgba(37,99,235,0.3)' : 'none'
                    }}
                  >{isDataLoaded ? `🔍 ${t('wizard.findPlaces')} (${formData.maxStops})` : `⏳ ${t('general.loading')}...`}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Step 3 = results, or normal mode */}
        
        {/* Navigation Tabs - hidden in wizard mode and active trail */}
        {!wizardMode && !activeTrail && (
        <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-lg p-1.5 shadow">
          <button
            onClick={() => { setCurrentView('form'); window.scrollTo(0, 0); }}
            className={`flex-1 min-w-0 py-1.5 px-1 rounded-lg font-medium transition text-[9px] sm:text-xs leading-tight ${
              currentView === 'form' ? 'bg-rose-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="text-center">🗺️</div>
            <div className="truncate text-center text-[8px]">{t("nav.route")}</div>
          </button>
          <button
            onClick={() => { setCurrentView('saved'); window.scrollTo(0, 0); }}
            className={`flex-1 min-w-0 py-1.5 px-1 rounded-lg font-medium transition text-[9px] sm:text-xs leading-tight ${
              currentView === 'saved' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="text-center">💾</div>
            <div className="truncate text-center text-[8px]">{t("nav.saved")} {citySavedRoutes.length > 0 ? `(${citySavedRoutes.length})` : ''}</div>
          </button>
          <button
            onClick={() => { setCurrentView('myPlaces'); window.scrollTo(0, 0); }}
            className={`flex-1 min-w-0 py-1.5 px-1 rounded-lg font-medium transition text-[9px] sm:text-xs leading-tight ${
              currentView === 'myPlaces' || currentView === 'search' ? 'bg-teal-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="text-center">📍</div>
            <div className="truncate text-center text-[8px]">{t("nav.myPlaces")} {locationsLoading ? '...' : cityCustomLocations.filter(l => l.status !== 'blacklist').length > 0 ? `(${cityCustomLocations.filter(l => l.status !== 'blacklist').length})` : ''}</div>
          </button>
          <button
            onClick={() => { setCurrentView('myInterests'); window.scrollTo(0, 0); }}
            className={`flex-1 min-w-0 py-1.5 px-1 rounded-lg font-medium transition text-[9px] sm:text-xs leading-tight ${
              currentView === 'myInterests' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="text-center">🏷️</div>
            <div className="truncate text-center text-[8px]">{t("nav.myInterests")} {(() => {
              const builtIn = (window.BKK.interestOptions || []).filter(i => isInterestValid(i.id) && interestStatus[i.id] !== false);
              const uncov = (window.BKK.uncoveredInterests || []).filter(i => isInterestValid(i.id) && interestStatus[i.id] === true);
              const cust = (cityCustomInterests || []).filter(i => isInterestValid(i.id) && interestStatus[i.id] !== false);
              const total = builtIn.length + uncov.length + cust.length;
              return total > 0 ? `(${total})` : '';
            })()}</div>
          </button>
          <button
            onClick={() => {
              if (isUnlocked || !adminPassword) {
                setCurrentView('settings');
              } else {
                setShowPasswordDialog(true);
              }
              window.scrollTo(0, 0);
            }}
            className={`${isUnlocked ? 'flex' : 'hidden sm:flex'} flex-1 min-w-0 py-1.5 px-1 rounded-lg font-medium transition text-[9px] sm:text-xs leading-tight ${
              currentView === 'settings' ? 'bg-slate-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ flexDirection: 'column', alignItems: 'center' }}
          >
            <div className="text-center relative inline-flex items-center justify-center w-full">
              {(isUnlocked || !adminPassword) ? '🔓' : '🔒'}
              {hasNewFeedback && isCurrentUserAdmin && (
                <span className="absolute -top-1 left-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
              )}
            </div>
            <div className="truncate text-center text-[8px]">{t("settings.title")}</div>
          </button>
        </div>
        )}

        {/* Quick mode switch — visible on non-form tabs in advanced mode */}
        {!wizardMode && !activeTrail && currentView !== 'form' && (
          <div style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '4px' }}>
            <button
              onClick={() => { setWizardMode(true); setWizardStep(1); localStorage.setItem('bangkok_wizard_mode', 'true'); setRoute(null); setRouteChoiceMade(null); setCurrentView('form'); }}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '9px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {`🚀 ${t('nav.quickMode')}`}
            </button>
          </div>
        )}

        {/* Wizard Step 3: breadcrumb with back link */}
        {wizardMode && wizardStep === 3 && !isGenerating && !activeTrail && (
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            fontSize: '11px', color: '#9ca3af', marginBottom: '6px', flexWrap: 'wrap'
          }}>
            <span
              onClick={() => { setWizardStep(2); setRoute(null); setRouteChoiceMade(null); setCurrentView('form'); window.scrollTo(0, 0); }}
              style={{ cursor: 'pointer', color: '#3b82f6', fontWeight: '600', textDecoration: 'underline' }}
            >{currentLang === 'he' ? '→' : '←'} {t("general.back")}</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span
              onClick={() => { setWizardStep(1); setRoute(null); setRouteChoiceMade(null); setCurrentView('form'); window.scrollTo(0, 0); }}
              style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#d1d5db' }}
            >📍 {(() => {
              if (formData.searchMode === 'all') return t('wizard.allCity');
              if (formData.searchMode === 'radius') return `${t('general.nearMe')} (${formData.radiusMeters >= 1000 ? `${formData.radiusMeters/1000}km` : `${formData.radiusMeters}m`})`;
              const area = (window.BKK.areaOptions || []).find(a => a.id === formData.area);
              return area ? tLabel(area) : '';
            })()}</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span
              onClick={() => { setWizardStep(2); setRoute(null); setRouteChoiceMade(null); setCurrentView('form'); window.scrollTo(0, 0); }}
              style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#d1d5db' }}
            >⭐ {formData.interests.slice(0, 3).map(id => {
              const opt = allInterestOptions.find(o => o.id === id);
              return opt ? tLabel(opt) : id;
            }).join(', ')}{formData.interests.length > 3 ? ` +${formData.interests.length - 3}` : ''}</span>
          </div>
        )}

        {/* Wizard Step 3: Loading spinner while generating */}
        {wizardMode && wizardStep === 3 && isGenerating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <svg className="animate-spin" style={{ width: '40px', height: '40px', color: '#2563eb', marginBottom: '12px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>{`🔍 ${t("general.searching")}...`}</p>
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{t("general.mayTakeSeconds")}</p>
          </div>
        )}

        {/* ROUTE CHOICE SCREEN — shown in wizard step 3 after route is loaded, before any action */}
        {wizardMode && wizardStep === 3 && !isGenerating && route && route.stops?.length > 0 && !activeTrail && !route.optimized && routeChoiceMade === null && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{`🐾 ${route.stops.length} ${t('wizard.placesFound')}`}</span>
            </div>

            {/* Option 1: Yalla - quick go */}
            <button
              onClick={() => {
                const isCircular = formData.searchMode === 'radius';
                setRouteType(isCircular ? 'circular' : 'linear');
                
                const result = runSmartPlan({ openMap: true, startTrail: true, overrideType: isCircular ? 'circular' : 'linear' });
                if (!result) return;
                
                showToast(`🚀 ${result.optimized.length} ${t('route.stops')} (${result.isCircular ? t('route.circular') : t('route.linear')})`, 'success');
              }}
              style={{
                width: '100%', padding: '14px', border: '2px solid #22c55e', borderRadius: '14px',
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#15803d',
                fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'start',
                direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr', marginBottom: '10px'
              }}
            >
              <span style={{ fontSize: '24px' }}>🚀</span>
              <div>
                <div>{t('wizard.yallaGo')}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'normal' }}>{t('wizard.yallaDesc')}</div>
              </div>
            </button>

            {/* Option 2: Manual arrangement */}
            <button
              onClick={() => { setRouteChoiceMade('manual'); window.scrollTo(0, 0); }}
              style={{
                width: '100%', padding: '14px', border: '2px solid #8b5cf6', borderRadius: '14px',
                background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', color: '#6d28d9',
                fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'start',
                direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr'
              }}
            >
              <span style={{ fontSize: '24px' }}>🛠️</span>
              <div>
                <div>{t('wizard.manualMode')}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'normal' }}>{t('wizard.manualDesc')}</div>
              </div>
            </button>
          </div>
        )}

        {/* Form View */}

        {/* === VIEWS (from views.js) === */}
        {currentView === 'form' && !activeTrail && (!wizardMode || (wizardStep === 3 && (routeChoiceMade === 'manual' || route?.optimized))) && (
          <div className="view-fade-in bg-white rounded-xl shadow-lg p-3 space-y-3">
            {/* Form inputs - advanced mode only */}
            {!wizardMode && (<>
            {/* City selector - only in advanced mode */}
            {!wizardMode && Object.values(window.BKK.cities || {}).filter(c => c.active !== false).length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
                <select
                  value={selectedCityId}
                  onChange={(e) => switchCity(e.target.value)}
                  style={{ padding: '3px 8px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '12px', fontWeight: 'bold', color: '#374151', background: 'white', cursor: 'pointer' }}
                >
                  {Object.values(window.BKK.cities || {}).filter(c => c.active !== false).map(city => (
                    <option key={city.id} value={city.id}>{city.icon} {tLabel(city)}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Header - advanced mode */}
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-base font-bold text-center">{t("wizard.step1Title")}</h2>
              <button
                onClick={() => showHelpFor('main')}
                className="text-gray-400 hover:text-blue-500 text-sm"
                title={t("general.help")}
              >
                {t("general.help")}
              </button>
              <button
                onClick={() => { setWizardMode(true); setWizardStep(1); localStorage.setItem('bangkok_wizard_mode', 'true'); setRoute(null); setRouteChoiceMade(null); }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline' }}
                title={t("nav.switchToQuick")}
              >
                {`🚀 ${t('nav.quickMode')}`}
              </button>
              <button onClick={() => switchLanguage(currentLang === 'he' ? 'en' : 'he')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2px 8px', color: '#6b7280', fontSize: '10px', cursor: 'pointer' }}>
                {currentLang === 'he' ? '🇬🇧 EN' : '🇮🇱 עב'}
              </button>
            </div>

            {/* Split Layout: Mode selector + content (right) | Interests (left) */}
            <div className="flex gap-0 items-start" style={{ paddingBottom: '60px' }}>
              
              {/* Right Column: Search Mode */}
              <div className="flex-shrink-0 flex flex-col" style={{ width: rightColWidth + 'px' }}>
                {/* Map button - prominent */}
                <button
                  onClick={() => { 
                    setMapMode(formData.searchMode === 'radius' && formData.currentLat ? 'radius' : 'areas'); 
                    setShowMapModal(true); 
                  }}
                  className="w-full mb-2 py-1.5 rounded-lg text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', boxShadow: '0 2px 4px rgba(5,150,105,0.3)' }}
                >{t("wizard.showMap")}</button>

                {/* 3-way mode toggle: הכל / איזור / רדיוס */}
                <div className="flex bg-gray-200 rounded-lg p-0.5 mb-2">
                  <button
                    onClick={() => setFormData({...formData, searchMode: 'all'})}
                    className={`flex-1 py-1 rounded text-[9px] font-bold transition ${
                      formData.searchMode === 'all' ? 'bg-white shadow text-purple-600' : 'text-gray-500'
                    }`}
                  >{`🌏 ${t("form.allMode")}`}</button>
                  <button
                    onClick={() => setFormData({...formData, searchMode: 'area'})}
                    className={`flex-1 py-1 rounded text-[9px] font-bold transition ${
                      formData.searchMode === 'area' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                    }`}
                  >{t("form.areaMode")}</button>
                  <button
                    onClick={() => {
                      const source = formData.radiusSource || 'gps';
                      setFormData(prev => ({...prev, searchMode: 'radius'}));
                      if (source === 'gps' && !formData.currentLat) {
                        window.BKK.getValidatedGps(
                          (pos) => {
                            setFormData(prev => ({...prev, currentLat: pos.coords.latitude, currentLng: pos.coords.longitude, gpsLat: pos.coords.latitude, gpsLng: pos.coords.longitude, radiusSource: 'gps'}));
                          },
                          (reason) => {
                            setFormData(prev => ({...prev, searchMode: 'area'}));
                            showToast(reason === 'outside_city' ? t('toast.outsideCity') : reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'warning', 'sticky');
                          }
                        );
                      }
                    }}
                    className={`flex-1 py-1 rounded text-[9px] font-bold transition ${
                      formData.searchMode === 'radius' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                    }`}
                  >{t("form.radiusMode")}</button>
                </div>
                
                {formData.searchMode === 'all' ? (
                  <div style={{ padding: '8px', textAlign: 'center', color: '#7c3aed', fontSize: '11px', fontWeight: 'bold' }}>
                    {`🌏 ${t("general.all")} ${tLabel(window.BKK.selectedCity) || t('general.city')}`}
                  </div>
                ) : formData.searchMode === 'area' ? (
                  /* Area Mode - GRID layout */
                  <div>
                    <button
                      onClick={detectArea}
                      disabled={isLocating}
                      className={`w-full mb-1.5 py-1 rounded-lg text-[9px] font-bold border transition ${
                        isLocating 
                          ? 'bg-gray-100 text-gray-400 border-gray-200' 
                          : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {isLocating ? t('form.locating') : t('form.locateMe')}
                    </button>
                    <div className="border border-gray-200 rounded-lg p-1">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        {areaOptions.map(area => (
                          <button
                            key={area.id}
                            onClick={() => setFormData({...formData, area: area.id})}
                            style={{
                              border: formData.area === area.id ? '2px solid #3b82f6' : '1.5px solid #e5e7eb',
                              backgroundColor: formData.area === area.id ? '#dbeafe' : '#ffffff',
                              padding: '4px 2px',
                              borderRadius: '6px',
                              textAlign: 'center',
                              lineHeight: '1.1'
                            }}
                          >
                            <div style={{
                              fontWeight: '700',
                              fontSize: '10px',
                              color: formData.area === area.id ? '#1e40af' : '#374151',
                              wordBreak: 'break-word'
                            }}>{tLabel(area)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Radius Mode */
                  <div className="border border-blue-100 rounded-lg p-2 bg-blue-50/30 space-y-2">
                    {/* Radius slider */}
                    <div className="text-center">
                      <label className="font-medium text-[10px] block text-center mb-0.5">{t("form.searchRadius")}</label>
                      <div className="text-lg font-bold text-blue-600">{formData.radiusMeters}m</div>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={formData.radiusMeters}
                        onChange={(e) => setFormData({...formData, radiusMeters: parseInt(e.target.value)})}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: '#ea580c' }}
                      />
                      <div className="flex justify-between text-[8px] text-gray-400 mt-0.5">
                        <span>100m</span>
                        <span>2km</span>
                      </div>
                    </div>

                    {/* Source toggle: GPS vs My Place - NO coord clearing */}
                    <div className="flex bg-white rounded p-0.5 border border-blue-200">
                      <button
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            radiusSource: 'gps',
                            currentLat: prev.gpsLat || prev.currentLat,
                            currentLng: prev.gpsLng || prev.currentLng
                          }));
                        }}
                        className={`flex-1 py-1 rounded text-[9px] font-bold transition ${
                          formData.radiusSource === 'gps' ? 'bg-blue-500 text-white' : 'text-gray-500'
                        }`}
                      >📍 GPS</button>
                      <button
                        onClick={() => {
                          const savedPlace = formData.radiusPlaceId 
                            ? customLocations.find(l => l.id === formData.radiusPlaceId)
                            : null;
                          setFormData(prev => ({ 
                            ...prev, 
                            radiusSource: 'myplace',
                            currentLat: savedPlace?.lat || prev.currentLat,
                            currentLng: savedPlace?.lng || prev.currentLng
                          }));
                          if (formData.radiusPlaceName) {
                            setPlaceSearchQuery(formData.radiusPlaceName);
                          }
                        }}
                        className={`flex-1 py-1 rounded text-[9px] font-bold transition ${
                          formData.radiusSource === 'myplace' ? 'bg-blue-500 text-white' : 'text-gray-500'
                        }`}
                      >{t("general.myPlace")}</button>
                    </div>
                    
                    {formData.radiusSource === 'gps' ? (
                      /* GPS Mode */
                      <button
                        onClick={() => {
                          setIsLocating(true);
                          window.BKK.getValidatedGps(
                            (position) => {
                              const { latitude, longitude } = position.coords;
                              const lat = parseFloat(latitude.toFixed(6));
                              const lng = parseFloat(longitude.toFixed(6));
                              setFormData(prev => ({ 
                                ...prev, 
                                currentLat: lat, 
                                currentLng: lng,
                                gpsLat: lat,
                                gpsLng: lng
                              }));
                              showToast(t('form.locationDetectedShort'), 'success');
                              setIsLocating(false);
                            },
                            (reason) => {
                              setIsLocating(false);
                              setFormData(prev => ({...prev, searchMode: 'area'}));
                              if (reason === 'outside_city') showToast(t('toast.outsideCity'), 'warning', 'sticky');
                              else showToast(reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'error', 'sticky');
                            }
                          );
                        }}
                        disabled={isLocating}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition ${
                          isLocating ? 'bg-gray-300 text-gray-500' 
                          : formData.currentLat ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {isLocating ? t('form.locating') : formData.currentLat ? t('places.updateLocation') : t('places.findLocation')}
                      </button>
                    ) : (
                      /* My Place Mode */
                      <div className="space-y-1">
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={placeSearchQuery}
                            onChange={(e) => setPlaceSearchQuery(e.target.value)}
                            placeholder={t("form.searchMyPlace")}
                            className="w-full p-1.5 border border-blue-200 rounded-lg text-[10px] focus:border-blue-400 focus:outline-none"
                            dir={window.BKK.i18n.isRTL() ? "rtl" : "ltr"}
                            style={{ paddingLeft: '24px' }}
                          />
                          {(placeSearchQuery || formData.radiusPlaceId) && (
                            <button
                              onClick={() => {
                                setPlaceSearchQuery('');
                                setFormData(prev => ({ ...prev, radiusPlaceId: null, radiusPlaceName: '', currentLat: null, currentLng: null }));
                              }}
                              style={{ position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)', background: '#9ca3af', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title={t("general.clearSelection")}
                            >✕</button>
                          )}
                        </div>
                        <div className="max-h-48 overflow-y-auto bg-white rounded border border-gray-200">
                          {cityCustomLocations
                            .filter(loc => loc.lat && loc.lng && loc.status !== 'blacklist')
                            .filter(loc => !placeSearchQuery || loc.name.toLowerCase().includes(placeSearchQuery.toLowerCase()))
                            .slice(0, 30)
                            .map(loc => (
                              <button
                                key={loc.id}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    currentLat: loc.lat,
                                    currentLng: loc.lng,
                                    radiusPlaceId: loc.id,
                                    radiusPlaceName: loc.name
                                  }));
                                  setPlaceSearchQuery(loc.name);
                                }}
                                className={`w-full text-right p-1.5 text-[10px] border-b border-gray-100 hover:bg-blue-50 transition ${
                                  formData.radiusPlaceId === loc.id ? 'bg-blue-100 font-bold' : ''
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="truncate">{loc.name}</span>
                                </div>
                              </button>
                            ))
                          }
                          {cityCustomLocations.filter(loc => loc.lat && loc.lng && loc.status !== 'blacklist').length === 0 && (
                            <div className="p-2 text-center text-[10px] text-gray-400">{t("places.noPlacesWithCoords")}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Coordinates display - compact, no overflow */}
                    {formData.currentLat && (
                      <div className="bg-white rounded p-1 text-[8px] font-mono text-gray-500 text-center leading-relaxed" style={{ wordBreak: 'break-all' }}>
                        {formData.currentLat}, {formData.currentLng}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drag Handle */}
              <div
                className="flex-shrink-0 cursor-col-resize flex items-center justify-center hover:bg-gray-200 transition mx-1 rounded"
                style={{ width: '10px', minHeight: '200px', touchAction: 'none' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startWidth = rightColWidth;
                  const isRtl = true;
                  const onMove = (ev) => {
                    const diff = isRtl ? (startX - ev.clientX) : (ev.clientX - startX);
                    const newWidth = Math.min(250, Math.max(100, startWidth + diff));
                    setRightColWidth(newWidth);
                  };
                  const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                  };
                  document.addEventListener('mousemove', onMove);
                  document.addEventListener('mouseup', onUp);
                }}
                onTouchStart={(e) => {
                  const startX = e.touches[0].clientX;
                  const startWidth = rightColWidth;
                  const isRtl = true;
                  const onMove = (ev) => {
                    ev.preventDefault();
                    const diff = isRtl ? (startX - ev.touches[0].clientX) : (ev.touches[0].clientX - startX);
                    const newWidth = Math.min(250, Math.max(100, startWidth + diff));
                    setRightColWidth(newWidth);
                  };
                  const onUp = () => {
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend', onUp);
                  };
                  document.addEventListener('touchmove', onMove, { passive: false });
                  document.addEventListener('touchend', onUp);
                }}
              >
                <div className="w-1 h-8 bg-gray-300 rounded-full"></div>
              </div>

              {/* Left Column: Interests */}
              <div className="flex-1 min-w-0 flex flex-col">
                <label className="font-medium text-xs mb-1.5 block">{t("form.whatInterests")}</label>
                <div className="grid grid-cols-3 gap-2 border border-gray-200 rounded-lg p-2">
                {allInterestOptions.filter(option => {
                  if (!option || !option.id) return false;
                  const valid = isInterestValid(option.id);
                  const scopeOk = !(option.scope === 'local' && option.cityId && option.cityId !== selectedCityId);
                  const statusOk = interestStatus[option.id] !== false;
                  const isCustom = option.id?.startsWith?.('custom_') || option.custom;
                  if (debugMode) {
                    if (!valid || !scopeOk || !statusOk) {
                    }
                  }
                  if (!valid) return false;
                  if (!scopeOk) return false;
                  return statusOk;
                }).map(option => {
                  const tooltip = interestTooltips[option.id] || tLabel(option);
                  const customInterest = cityCustomInterests.find(ci => ci.id === option.id);
                  const isCustom = !!customInterest;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleInterest(option.id)}
                      title={tooltip}
                      style={{
                        border: formData.interests.includes(option.id) ? '2px solid #3b82f6' : '1.5px solid #e5e7eb',
                        backgroundColor: formData.interests.includes(option.id) ? '#eff6ff' : '#ffffff',
                        boxShadow: formData.interests.includes(option.id) ? '0 2px 4px rgba(59, 130, 246, 0.15)' : 'none',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      className="p-1.5 rounded-lg text-xs"
                    >
                      <div className="text-lg mb-1">{option.icon?.startsWith?.('data:') ? <img src={option.icon} alt="" className="w-6 h-6 object-contain mx-auto" /> : option.icon}</div>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '10px',
                        color: formData.interests.includes(option.id) ? '#1e40af' : '#374151',
                        wordBreak: 'break-word',
                        lineHeight: '1.2',
                        maxHeight: '2.4em',
                        overflow: 'hidden'
                      }}>{tLabel(option)}</div>
                    </button>
                  );
                })}
              </div>
              </div>
              {/* End of Left Column */}
              
            </div>
            {/* End of Split Layout */}

            {/* Generate Button - sticky at bottom for mobile */}
            <div style={{
              position: 'sticky',
              bottom: '20px',
              zIndex: 20,
              marginTop: '20px'
            }}>
              <button
                onClick={generateRoute}
                disabled={!isDataLoaded || formData.interests.length === 0 || (formData.searchMode === 'radius' && !formData.currentLat)}
                style={{ width: '100%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                  opacity: (!isDataLoaded || formData.interests.length === 0 || (formData.searchMode === 'radius' && !formData.currentLat)) ? 0.5 : 1
                }}
              >
                {!isDataLoaded ? `⏳ ${t('general.loading')}...` : isGenerating ? t('general.searching') : `🔍 ${t('wizard.findPlaces')} (${formData.maxStops})`}
              </button>
              <button
                onClick={() => showHelpFor('searchLogic')}
                className="bg-white text-blue-600 hover:bg-blue-50 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow border border-blue-200"
                title={t("help.searchLogic.title")}
              >
                ?
              </button>
            </div>
            
            {formData.interests.length === 0 && (
              <p className="text-center text-gray-500 text-xs">{t("form.selectAtLeastOneInterest")}</p>
            )}
            {formData.searchMode === 'radius' && !formData.currentLat && formData.interests.length > 0 && (
              <p className="text-center text-blue-500 text-xs font-medium">{t("form.useGpsForRadius")}</p>
            )}

            </>)}

            {/* Manual mode header — shown in wizard manual mode */}
            {wizardMode && routeChoiceMade === 'manual' && route && (
              <div className="text-center pb-2">
                <h3 className="text-sm font-bold text-purple-700">🛠️ {t('wizard.manualMode')}</h3>
                <p className="text-[10px] text-gray-500">{t('wizard.manualDesc')}</p>
              </div>
            )}

            {/* Show stops list ONLY after route is calculated */}
            {route && (
              <div id="route-results" className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mt-4" dir={window.BKK.i18n.isRTL() ? "rtl" : "ltr"}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-blue-900 text-sm">{`${t("route.places")} - ${route.areaName}`} ({route.stops.length}):</h3>
                  <button
                    onClick={() => showHelpFor('placesListing')}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                  >{t("general.help")}</button>
                </div>
                {/* Normal stop list grouped by interest */}
                <div className="max-h-96 overflow-y-auto" style={{ contain: 'content' }}>
                  {(() => {
                    const groupedStops = {};
                    let stopCounter = 0;
                    
                    route.stops.forEach((stop, i) => {
                      const interests = stop.interests || [];
                      interests.forEach(interest => {
                        if (!groupedStops[interest]) {
                          groupedStops[interest] = [];
                        }
                        groupedStops[interest].push({ ...stop, originalIndex: i, displayNumber: stopCounter + 1 });
                      });
                      stopCounter++;
                    });
                    
                    return Object.entries(groupedStops)
                      .filter(([interest]) => interest === '_manual' || formData.interests.includes(interest))
                      .map(([interest, stops]) => {
                      const isManualGroup = interest === '_manual';
                      const interestObj = isManualGroup ? { id: '_manual', label: t('general.addedManually'), icon: '📍' } : interestMap[interest];
                      if (!interestObj) return null;
                      
                      const filteredStops = isManualGroup 
                        ? stops.filter(s => !s.interests || s.interests.length === 0 || (s.interests.length === 1 && s.interests[0] === '_manual'))
                        : stops;
                      if (filteredStops.length === 0) return null;
                      
                      return (
                        <div key={interest} className="bg-white rounded-lg p-2 border border-gray-200">
                          {/* Interest header with fetch-more button */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="font-bold text-xs text-gray-700 flex items-center gap-1">
                              <span style={{ fontSize: '14px' }}>{interestObj.icon?.startsWith?.('data:') ? <img src={interestObj.icon} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain', display: 'inline' }} /> : interestObj.icon}</span>
                              <span>{tLabel(interestObj)} ({filteredStops.length})</span>
                            </div>
                            {!isManualGroup && (
                            <button
                              onClick={async () => {
                                await fetchMoreForInterest(interest);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                              title={`${t("route.moreFromCategory")} ${tLabel(interestObj)}`}
                            >
                              {t("general.more")}
                            </button>
                            )}
                          </div>
                          
                          {/* Stops in this interest */}
                          <div className="space-y-1.5">
                            {filteredStops.map((stop) => {
                              const hasValidCoords = stop.lat && stop.lng && stop.lat !== 0 && stop.lng !== 0;
                              const isDisabled = isStopDisabled(stop);
                              const isCustom = stop.custom;
                              const isAddedLater = stop.addedLater;
                              const isStartPoint = hasValidCoords && startPointCoords?.lat === stop.lat && startPointCoords?.lng === stop.lng;
                              
                              return (
                                <div key={stop.originalIndex} className="p-1.5 rounded border relative" style={{ 
                                  borderColor: isDisabled ? '#d1d5db' : isStartPoint ? '#e5e7eb' : !hasValidCoords ? '#ef4444' : isAddedLater ? '#60a5fa' : '#e5e7eb',
                                  borderWidth: isAddedLater ? '2px' : '1px',
                                  borderStyle: isAddedLater ? 'dashed' : 'solid',
                                  backgroundColor: isDisabled ? '#f9fafb' : !hasValidCoords ? '#fef2f2' : isAddedLater ? '#eff6ff' : '#fafafa',
                                  opacity: isDisabled ? 0.45 : 1,
                                  transition: 'opacity 0.2s'
                                }}>
                                  {/* Action buttons - positioned based on language direction */}
                                  <div style={{ position: 'absolute', top: '2px', display: 'flex', gap: '2px', ...(window.BKK.i18n.isRTL() ? { left: '2px' } : { right: '2px' }) }}>
                                    {/* Set as start point */}
                                    {hasValidCoords && !isDisabled && (
                                      <button
                                        onClick={() => {
                                          const newStart = { lat: stop.lat, lng: stop.lng, address: stop.name };
                                          setStartPointCoords(newStart);
                                          startPointCoordsRef.current = newStart; // Update ref immediately
                                          setFormData(prev => ({...prev, startPoint: stop.name || `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`}));
                                          if (route?.optimized) {
                                            setRoute(prev => prev ? {...prev, optimized: false} : prev);
                                          }
                                          showToast(`📌 ${stop.name} — ${t("route.startPoint")}`, 'success');
                                        }}
                                        className={`text-[9px] px-1 py-0.5 rounded ${
                                          startPointCoords?.lat === stop.lat && startPointCoords?.lng === stop.lng
                                            ? 'bg-green-600 text-white ring-1 ring-green-400'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                        title={t("form.setStartPoint")}
                                      >
                                        📌
                                      </button>
                                    )}
                                    {/* Pause/Resume button */}
                                    {!(hasValidCoords && startPointCoords?.lat === stop.lat && startPointCoords?.lng === stop.lng) && (
                                    <button
                                      onClick={() => toggleStopActive(stop.originalIndex)}
                                      className={`text-[9px] px-1 py-0.5 rounded ${isDisabled ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}
                                      title={isDisabled ? t('route.returnPlace') : t('route.skipPlace')}
                                    >
                                      {isDisabled ? '▶️' : '⏸️'}
                                    </button>
                                    )}
                                    {/* Remove button for manually added stops */}
                                    {stop.manuallyAdded && (
                                      <button
                                        onClick={() => {
                                          setManualStops(prev => prev.filter(ms => ms.name !== stop.name));
                                          setRoute(prev => prev ? {
                                            ...prev,
                                            stops: prev.stops.filter((_, idx) => idx !== stop.originalIndex)
                                          } : prev);
                                          showToast(`🗑️ ${stop.name} ${t("toast.removedFromRoute")}`, 'info');
                                        }}
                                        className="text-[9px] px-1 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
                                        title={t("route.removeFromRoute")}
                                      >
                                        🗑️
                                      </button>
                                    )}
                                    
                                    {!isCustom && !wizardMode && (
                                      (() => {
                                        const placeId = stop.id || stop.name;
                                        const isAdding = addingPlaceIds.includes(placeId);
                                        const existingLoc = customLocations.find(loc => 
                                          loc.name.toLowerCase().trim() === stop.name.toLowerCase().trim()
                                        );
                                        
                                        if (existingLoc) {
                                          return (
                                            <button
                                              onClick={() => existingLoc.locked && !isUnlocked ? openReviewDialog(existingLoc) : handleEditLocation(existingLoc)}
                                              className="text-[9px] px-1 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                                              title={existingLoc.locked && !isUnlocked ? t("general.viewOnly") : t("places.editAddedToList")}
                                            >
                                              {existingLoc.locked && !isUnlocked ? '👁️' : '✏️'}
                                            </button>
                                          );
                                        }
                                        
                                        return (
                                          <button
                                            onClick={() => addGooglePlaceToCustom(stop)}
                                            disabled={isAdding}
                                            className={`text-[9px] px-1 py-0.5 rounded ${
                                              isAdding 
                                                ? 'bg-gray-300 text-gray-500 cursor-wait' 
                                                : 'bg-purple-500 text-white hover:bg-purple-600'
                                            }`}
                                            title={t("route.addToMyList")}
                                          >
                                            {isAdding ? '...' : '+'}
                                          </button>
                                        );
                                      })()
                                    )}
                                    
                                    {/* Review button for locked custom places - visible to all */}
                                    {isCustom && (() => {
                                      const cl = customLocations.find(loc => loc.name === stop.name);
                                      if (!cl?.locked) {
                                        const interests = stop.interests || [];
                                        const interestLocked = interests.some(iId => {
                                          const iObj = allInterestOptions.find(o => o.id === iId);
                                          return iObj?.locked;
                                        });
                                        if (!interestLocked) return null;
                                      }
                                      return (
                                        <button
                                          onClick={() => openReviewDialog(cl || stop)}
                                          className="text-[9px] px-1 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600"
                                          title={t("reviews.title")}
                                        >{(() => {
                                          const pk = ((cl || stop).name || '').replace(/[.#$/\\[\]]/g, '_');
                                          const ra = reviewAverages[pk];
                                          return ra ? `⭐${ra.avg.toFixed(1)}` : '⭐';
                                        })()}</button>
                                      );
                                    })()}
                                    {/* Edit button for custom places - admin or unlocked only */}
                                    {isCustom && !wizardMode && (() => {
                                      const cl = customLocations.find(loc => loc.name === stop.name);
                                      if (cl?.locked && !isUnlocked) return null; // locked, non-admin: no edit
                                      return (
                                        <button
                                          onClick={() => { if (cl) handleEditLocation(cl); }}
                                          className="text-[9px] px-1 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                                          title={t("general.edit")}
                                        >✏️</button>
                                      );
                                    })()}
                                  </div>
                                  
                                  <a
                                    href={window.BKK.getGoogleMapsUrl(stop)}
                                    target="city_explorer_map"
                                    rel={hasValidCoords ? "noopener noreferrer" : undefined}
                                    className={`block hover:bg-gray-100 transition ${window.BKK.i18n.isRTL() ? 'pr-2' : 'pl-2'}`}
                                    onClick={(e) => {
                                      if (!hasValidCoords) {
                                        e.preventDefault();
                                        showToast(t('places.editNoCoordsHint'), 'warning');
                                      }
                                    }}
                                  >
                                    <div className="font-bold text-[11px] flex items-center gap-1" style={{
                                      color: isDisabled ? '#9ca3af' : hasValidCoords ? '#2563eb' : '#dc2626',
                                      textDecoration: isDisabled ? 'line-through' : 'none',
                                      flexWrap: 'wrap'
                                    }}>
                                      {route?.optimized && !isDisabled && hasValidCoords && (
                                        <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                                          {window.BKK.stopLabel(stop.originalIndex)}
                                        </span>
                                      )}
                                      {!hasValidCoords && (
                                        <span title={t("places.noCoordinates")} style={{ fontSize: '11px' }}>
                                          ❗
                                        </span>
                                      )}
                                      <span>{stop.name}</span>
                                      {isStartPoint && (
                                        <span className="text-[8px] bg-green-600 text-white px-1 py-0.5 rounded font-bold">{t("general.start")}</span>
                                      )}
                                      {stop.detectedArea && formData.searchMode === 'radius' && (
                                        <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold">
                                          {tLabel(areaMap[stop.detectedArea]) || stop.detectedArea}
                                        </span>
                                      )}
                                      {stop.distFromCenter != null && formData.searchMode === 'radius' && (
                                        <span className="text-[8px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-bold">
                                          {stop.distFromCenter}m
                                        </span>
                                      )}
                                      {stop.outsideArea && (
                                        <span className="text-orange-500" title={t("places.outsideArea")} style={{ fontSize: '10px' }}>
                                          🔺
                                        </span>
                                      )}
                                      {isAddedLater && (!wizardMode || routeChoiceMade === 'manual') && (
                                        <span className="text-blue-500 font-bold" title={t("general.addedViaMore")} style={{ fontSize: '9px' }}>{`+${t('general.more')}`}</span>
                                      )}
                                      {/* Camera icon for custom locations with image */}
                                      {isCustom && stop.uploadedImage && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setModalImage(stop.uploadedImage);
                                            setShowImageModal(true);
                                          }}
                                          className="hover:scale-110 transition bg-blue-100 hover:bg-blue-200 rounded px-0.5"
                                          title={t("general.clickForImage")}
                                          style={{ fontSize: '11px', cursor: 'pointer' }}
                                        >
                                          🖼️
                                        </button>
                                      )}
                                    </div>
                                    <div className="text-[10px]" style={{
                                      color: hasValidCoords ? '#6b7280' : '#991b1b'
                                    }}>
                                      {hasValidCoords ? stop.description : t('places.noCoordinatesWarning')}
                                    </div>
                                    {stop.todayHours && (
                                      <div className="text-[9px]" style={{ color: stop.openNow ? '#059669' : '#dc2626' }}>
                                        🕐 {stop.openNow ? t('general.openStatus') : t('general.closedStatus')} · {stop.todayHours}
                                      </div>
                                    )}
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                
                <div className="mt-3 space-y-1" style={{ position: 'relative' }}>
                  {/* Row 1: Map & Plan + Hamburger */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      const openMap = (gpsStart) => {
                        const result = recomputeForMap(gpsStart || null, undefined, true);
                        if (result) {
                          const activeForMap = result.optimized.filter(s => s.lat && s.lng);
                          setMapStops(activeForMap);
                        } else {
                          const activeStops = route.stops.filter((s) => {
                            const isActive = !isStopDisabled(s);
                            const hasValidCoords = s.lat && s.lng && s.lat !== 0 && s.lng !== 0;
                            return isActive && hasValidCoords;
                          });
                          if (activeStops.length === 0) { showToast(t('places.noPlacesWithCoords'), 'warning'); return; }
                          setMapStops(activeStops);
                        }
                        setMapMode('stops');
                        setShowMapModal(true);
                      };
                      if (!startPointCoordsRef.current && !formData.currentLat && navigator.geolocation) {
                        window.BKK.getValidatedGps(
                          (pos) => {
                            const gpsStart = { lat: pos.coords.latitude, lng: pos.coords.longitude, address: t('wizard.myLocation') };
                            setFormData(prev => ({...prev, currentLat: pos.coords.latitude, currentLng: pos.coords.longitude}));
                            openMap(gpsStart);
                          },
                          (reason) => {
                            showToast(reason === 'outside_city' ? t('toast.outsideCity') : reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'warning', 'sticky');
                            openMap(null);
                          },
                        );
                      } else {
                        openMap(null);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flex: 1, height: '42px', backgroundColor: '#f59e0b', color: 'white',
                      borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
                      border: 'none', cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {`${t("route.showStopsOnMap")} (${route.stops.filter(s => !isStopDisabled(s) && s.lat && s.lng).length})`}
                  </button>
                  <button
                    onClick={() => setShowRouteMenu(!showRouteMenu)}
                    style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      border: '1px solid #e5e7eb', background: showRouteMenu ? '#f3f4f6' : 'rgba(255,255,255,0.9)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', color: '#6b7280', flexShrink: 0
                    }}
                  >
                    ☰
                  </button>
                  </div>

                  {/* Hamburger dropdown menu */}
                  {showRouteMenu && (
                    <div>
                    <div onClick={() => setShowRouteMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} />
                    <div style={{
                      position: 'absolute', left: 0, right: 0, bottom: '48px', zIndex: 50,
                      background: 'white', borderRadius: '12px', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
                      border: '1px solid #e5e7eb', overflow: 'hidden',
                      direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr'
                    }}>
                      {[
                        { icon: '+', label: t('route.addManualStop').replace('➕ ', ''), action: () => { setShowRouteMenu(false); setShowManualAddDialog(true); } },
                        { icon: '≡', label: t('route.reorderStops'), action: () => { setShowRouteMenu(false); reorderOriginalStopsRef.current = route?.stops ? [...route.stops] : null; setShowRoutePreview(true); }, disabled: !route?.optimized },
                        { icon: '✦', label: t('route.helpMePlan'), action: () => {
                          setShowRouteMenu(false);
                          const result = runSmartPlan({});
                          if (result) showToast(`✦ ${result.optimized.length} ${t('route.stops')}`, 'success');
                        }},
                        { icon: '↗', label: t('general.shareRoute'), action: () => {
                          setShowRouteMenu(false);
                          if (!route?.optimized) return;
                          const activeStops = (route.stops || []).filter(s => {
                            const isActive = !isStopDisabled(s);
                            const hasCoords = s.lat && s.lng && s.lat !== 0 && s.lng !== 0;
                            return isActive && hasCoords;
                          });
                          const hasStart = startPointCoords && startPointCoords.lat && startPointCoords.lng;
                          const origin = hasStart ? `${startPointCoords.lat},${startPointCoords.lng}` : activeStops.length > 0 ? `${activeStops[0].lat},${activeStops[0].lng}` : '';
                          const stopsForUrl = hasStart ? activeStops : activeStops.slice(1);
                          const isCirc = routeType === 'circular';
                          const urls = window.BKK.buildGoogleMapsUrls(stopsForUrl, origin, isCirc, googleMaxWaypoints);
                          const routeName = route.name || t('route.myRoute');
                          const mapUrl = urls.length > 0 ? urls[0].url : '';
                          if (!mapUrl) return;
                          const mapLinks = urls.map((u, i) => urls.length === 1 ? u.url : `(${u.part}/${u.total}) ${u.url}`).join('\n');
                          const shareText = `🗺️ ${routeName}\n📍 ${route.areaName || ''}\n🎯 ${activeStops.length} stops\n${routeType === 'circular' ? t('route.circularRoute') : t('route.linearDesc')}\n\n${activeStops.map((s, i) => `${window.BKK.stopLabel(i)}. ${s.name}`).join('\n')}\n\n🗺️ Google Maps:\n${mapLinks}`;
                          if (navigator.share) { navigator.share({ title: routeName, text: shareText }); }
                          else { navigator.clipboard.writeText(shareText); showToast(t('route.routeCopied'), 'success'); }
                        }, disabled: !route?.optimized },
                        { icon: route.name ? '✓' : '⬇', label: route.name ? `${t('route.savedAs')} ${route.name}` : t('route.saveRoute'), action: () => {
                          setShowRouteMenu(false);
                          if (!route.name && route?.optimized) quickSaveRoute();
                        }, disabled: !route?.optimized || !!route.name },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={item.action}
                          disabled={item.disabled}
                          style={{
                            width: '100%', padding: '10px 14px', border: 'none', borderBottom: idx < 4 ? '1px solid #f3f4f6' : 'none',
                            background: 'white', cursor: item.disabled ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            fontSize: '13px', fontWeight: '500', color: item.disabled ? '#9ca3af' : '#374151',
                            textAlign: window.BKK.i18n.isRTL() ? 'right' : 'left'
                          }}
                        >
                          <span style={{ fontSize: '14px', flexShrink: 0, width: '22px', textAlign: 'center', fontWeight: 'bold', color: item.disabled ? '#d1d5db' : '#6b7280' }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                    </div>
                  )}

                  {/* Row 2: Open in Google Maps */}
                  {(() => {
                    const activeStops = route?.optimized ? route.stops.filter((stop) => {
                      return !isStopDisabled(stop) && stop.lat && stop.lng && stop.lat !== 0 && stop.lng !== 0;
                    }) : [];
                    const hasStartPoint = startPointCoords && startPointCoords.lat && startPointCoords.lng;
                    const origin = hasStartPoint
                      ? `${startPointCoords.lat},${startPointCoords.lng}`
                      : activeStops.length > 0 ? `${activeStops[0].lat},${activeStops[0].lng}` : '';
                    const stopsForUrls = hasStartPoint ? activeStops : activeStops.slice(1);
                    const isCircular = routeType === 'circular';
                    const urls = route?.optimized && activeStops.length > 0
                      ? window.BKK.buildGoogleMapsUrls(stopsForUrls, origin, isCircular, googleMaxWaypoints)
                      : [];

                    return urls.length <= 1 ? (
                      <button
                        id="open-google-maps-btn"
                        disabled={!route?.optimized}
                        style={{
                          width: '100%', height: '42px', backgroundColor: route?.optimized ? '#2563eb' : '#d1d5db',
                          color: route?.optimized ? 'white' : '#9ca3af', textAlign: 'center',
                          borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
                          border: 'none', boxShadow: route?.optimized ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : 'none',
                          cursor: route?.optimized ? 'pointer' : 'not-allowed'
                        }}
                        onClick={() => {
                          if (!route?.optimized) { showToast(t('route.calcRoutePrevious'), 'warning'); return; }
                          if (activeStops.length === 0) { showToast(t('places.noPlacesWithCoords'), 'warning'); return; }
                          const mapUrl = urls.length === 1 ? urls[0].url : (activeStops.length === 1 && !hasStartPoint ? window.BKK.getGoogleMapsUrl(activeStops[0]) : '#');
                          if (mapUrl.length > 2000) showToast(`${t('toast.urlTooLong')} (${mapUrl.length})`, 'warning');
                          else if (isCircular) showToast(t('route.circularDesc'), 'info');
                          startActiveTrail(activeStops, formData.interests, formData.area);
                          showToast(`📸 ${t('trail.started')}`, 'success');
                          window.open(mapUrl, 'city_explorer_map');
                        }}
                      >
                        {`📍 ${t('route.openRouteInGoogle')}`}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px' }}>
                      {urls.map((urlInfo, idx) => (
                        <button
                          key={idx}
                          id={idx === 0 ? "open-google-maps-btn" : undefined}
                          onClick={() => {
                            if (urlInfo.url.length > 2000) showToast(`${t('toast.urlTooLong')} (${urlInfo.url.length})`, 'warning');
                            if (idx === 0) startActiveTrail(activeStops, formData.interests, formData.area);
                            window.open(urlInfo.url, 'city_explorer_map');
                          }}
                          style={{
                            flex: 1, height: '42px',
                            backgroundColor: idx === 0 ? '#2563eb' : '#1d4ed8',
                            color: 'white', textAlign: 'center',
                            borderRadius: '12px', fontWeight: 'bold', fontSize: '12px',
                            border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                            cursor: 'pointer'
                          }}
                        >
                          {`📍 ${t('route.openRoutePartN').replace('{n}', urlInfo.part).replace('{total}', urlInfo.total)}`}
                        </button>
                      ))}
                      </div>
                    );
                  })()}

                  {/* Time-of-day: auto-detected, no UI toggle needed */}

                  {/* Hint text */}
                  {route?.optimized && (
                    <p style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', marginTop: '4px', marginBottom: '2px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                      {t("route.routeActionsHint")}
                    </p>
                  )}

                  </div>
                </div>
            )}
          </div>
        )}

        {/* Saved Routes View */}
        {/* Search View */}
        {currentView === 'search' && (
          <div className="view-fade-in bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{`🔍 ${t("places.searchResults")}`}</h2>
              <button
                onClick={() => setCurrentView('myPlaces')}
                className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-300 flex items-center gap-1"
              >
                ← Back
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder={t("places.searchByNameHint")}
                value={searchQuery}
                className="w-full p-3 border-3 border-gray-300 rounded-xl text-base focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                style={{ textAlign: window.BKK.i18n.isRTL() ? 'right' : 'left', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchQuery(query);
                  
                  if (!query.trim()) {
                    setSearchResults([]);
                    return;
                  }
                  
                  const queryLower = query.toLowerCase();
                  const results = customLocations.filter(loc => 
                    loc.name.toLowerCase().includes(queryLower) ||
                    (loc.description && loc.description.toLowerCase().includes(queryLower)) ||
                    (loc.notes && loc.notes.toLowerCase().includes(queryLower))
                  );
                  setSearchResults(results);
                }}
              />
            </div>
            
            {/* Search Results */}
            {searchQuery && searchResults.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-bold">{`${searchResults.length} results found:`}</p>
                {searchResults.map(loc => (
                  <div
                    key={loc.id}
                    className="bg-gradient-to-r from-green-50 to-teal-50 border-3 border-green-400 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                          <span>{loc.name}</span>
                          {loc.outsideArea && (
                            <span 
                              className="text-orange-500" 
                              title={t("places.outsideArea")}
                              style={{ fontSize: '16px' }}
                            >
                              🔺
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-green-700 mt-1">{loc.description || t('general.noDescription')}</p>
                        {loc.notes && (
                          <p className="text-xs text-green-600 mt-1 italic">💭 {loc.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleEditLocation(loc)}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-bold"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                    
                    {/* Image Preview */}
                    {loc.uploadedImage && (
                      <img 
                        src={loc.uploadedImage} 
                        alt={loc.name}
                        className="w-full max-h-32 object-contain rounded-lg mt-2 cursor-pointer border-2 border-green-300"
                        onClick={() => {
                          setModalImage(loc.uploadedImage);
                          setShowImageModal(true);
                        }}
                      />
                    )}
                    
                    {/* Interests Tags */}
                    {loc.interests && loc.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {loc.interests.map(intId => {
                          const interest = interestMap[intId];
                          return interest ? (
                            <span key={intId} className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                              {interest.icon?.startsWith?.('data:') ? <img src={interest.icon} alt="" className="w-3.5 h-3.5 object-contain inline" /> : interest.icon} {tLabel(interest)}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🔍</div>
                <p className="font-bold">{t("places.noResultsFor")} "{searchQuery}"</p>
                <p className="text-sm mt-2">{t("general.tryDifferentSearch")}</p>/p>
              </div>
            ) : locationsLoading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <p className="text-gray-500 text-sm">{t("general.loading")}</p>
              </div>
            ) : cityCustomLocations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📍</div>
                <p className="font-bold">{t("places.noPlacesInCity", {cityName: tLabel(window.BKK.selectedCity) || t('places.thisCity')})}</p>
                <p className="text-sm mt-2">{t("places.addPlace")}</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🔍</div>
                <p className="font-bold">{t("general.startTypingToSearch")}</p>
                <p className="text-sm mt-2">{`${cityCustomLocations.length} ${t("route.places")} - ${tLabel(window.BKK.selectedCity) || t('places.thisCity')}`}</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'saved' && (
          <div className="view-fade-in bg-white rounded-xl shadow-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{`🗺️ ${t("nav.saved")}`}</h2>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {citySavedRoutes.length}
                </span>
                <button
                  onClick={() => showHelpFor('saved')}
                  className="text-gray-400 hover:text-blue-500 text-sm"
                  title={t("general.help")}
                style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}>{t("general.help")}</button>
              </div>
              <div className="flex items-center gap-2">
                {/* Sort toggle */}
                <div className="flex bg-gray-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setRoutesSortBy('area')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${routesSortBy === 'area' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                  >{t("places.byArea")}</button>
                  <button
                    onClick={() => setRoutesSortBy('name')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${routesSortBy === 'name' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                  >{t("places.byName")}</button>
                </div>
              </div>
            </div>
            
            {citySavedRoutes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-gray-600 mb-3 text-sm">{t("places.noSavedRoutesInCity", {cityName: tLabel(window.BKK.selectedCity) || t('places.thisCity')})}</p>
                <button
                  onClick={() => setCurrentView('form')}
                  className="bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-700"
                >{t("route.newRoute")}</button>
              </div>
            ) : (
              <div className="space-y-1">
                {(() => {
                  const sorted = [...citySavedRoutes].sort((a, b) => {
                    if (routesSortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'he');
                    return (a.areaName || '').localeCompare(b.areaName || '', 'he');
                  });
                  
                  let lastGroup = null;
                  return sorted.map(savedRoute => {
                    const groupKey = routesSortBy === 'area' ? (savedRoute.areaName || t('general.noArea')) : null;
                    const showGroupHeader = routesSortBy === 'area' && groupKey !== lastGroup;
                    if (showGroupHeader) lastGroup = groupKey;
                    
                    const routeInterestIds = [...new Set((savedRoute.stops || []).flatMap(s => s.interests || []))];
                    
                    return (
                      <React.Fragment key={savedRoute.id}>
                        {showGroupHeader && (
                          <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded mt-2 mb-1">
                            📍 {groupKey}
                          </div>
                        )}
                        <div
                          className={`flex items-center justify-between gap-2 rounded-lg p-2 border border-gray-200 bg-white hover:bg-blue-50 cursor-pointer`}
                          style={{ overflow: 'hidden' }}
                          onClick={() => loadSavedRoute(savedRoute)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-medium text-sm truncate">{savedRoute.name}</span>
                              {savedRoute.locked && isUnlocked && <span title={t("general.locked")} style={{ fontSize: '11px' }}>🔒</span>}
                              {routeInterestIds.slice(0, 5).map((intId, idx) => {
                                const obj = interestMap[intId];
                                if (!obj?.icon) return null;
                                return <span key={idx} title={obj.label} style={{ fontSize: '12px' }}>{renderIcon(obj.icon, '14px')}</span>;
                              })}
                              <span className="text-[10px] text-gray-400 flex-shrink-0">{savedRoute.stops?.length || 0} stops</span>
                            </div>
                            {savedRoute.notes && (
                              <div className="text-[10px] text-gray-500 mt-0.5" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>📝 {savedRoute.notes}</div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRoute({...savedRoute});
                              setRouteDialogMode('edit');
                              setShowRouteDialog(true);
                            }}
                            className="text-xs px-1 py-0.5 rounded hover:bg-blue-100 flex-shrink-0"
                            title={savedRoute.locked && !isUnlocked ? t("general.viewOnly") : t("places.detailsEdit")}
                          >{savedRoute.locked && !isUnlocked ? '👁️' : '✏️'}</button>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

                {/* My Content View */}
        {/* My Content View - Compact Design */}
        {currentView === 'myPlaces' && (
          <div className="view-fade-in bg-white rounded-xl shadow-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold">{`📍 ${t("nav.myPlaces")}`}</h2>
              <button
                onClick={() => showHelpFor('myPlaces')}
                className="text-gray-400 hover:text-blue-500 text-sm"
                title={t("general.help")}
              >
                {t("general.help")}
              </button>
              {isUnlocked && customLocations.length > 1 && (
                <button
                  onClick={scanAllDuplicates}
                  style={{ marginLeft: 'auto', padding: '5px 12px', fontSize: '11px', fontWeight: 'bold', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}
                >🔍 {t('dedup.scanButton')}</button>
              )}
            </div>
            
            {/* Custom Locations Section - Tabbed */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {/* Group by toggle */}
                  <div className="flex bg-gray-200 rounded-lg p-0.5">
                    <button
                      onClick={() => setPlacesGroupBy('interest')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${placesGroupBy === 'interest' ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}
                    >
                      {t("places.byInterest")}
                    </button>
                    <button
                      onClick={() => setPlacesGroupBy('area')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${placesGroupBy === 'area' ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}
                    >
                      {t("places.byArea")}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView('search')}
                    className="text-blue-500 hover:text-blue-700 text-xl"
                    title={t("places.searchResults")}
                  >
                    🔍
                  </button>
                  <button
                    onClick={() => {
                      const initLocation = {
                        name: '', description: '', notes: '',
                        area: formData.area,
                        areas: formData.area ? [formData.area] : [],
                        interests: [],
                        lat: null, lng: null, mapsUrl: '', address: '',
                        uploadedImage: null, imageUrls: [],
                        nearestStop: null, gpsLoading: true
                      };
                      setNewLocation(initLocation);
                      setShowQuickCapture(true);
                      if (navigator.geolocation) {
                        window.BKK.getValidatedGps(
                          (pos) => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            const detected = window.BKK.getAreasForCoordinates(lat, lng);
                            const areaUpdates = detected.length > 0 ? { areas: detected, area: detected[0] } : {};
                            setNewLocation(prev => ({...prev, lat, lng, gpsLoading: false, ...areaUpdates}));
                          },
                          (reason) => {
                            setNewLocation(prev => ({...prev, gpsLoading: false, gpsBlocked: true}));
                            showToast(reason === 'outside_city' ? t('toast.outsideCity') : reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'warning', 'sticky');
                          }
                        );
                      }
                    }}
                    className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-600"
                  >
                    {`📸 ${t("places.addFromCamera")}`}
                  </button>
                  <button
                    onClick={() => setShowAddLocationDialog(true)}
                    className="bg-teal-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-teal-600"
                  >
                    {`✏️ ${t("places.addManually")}`}
                  </button>
                </div>
              </div>

              {/* 3 Tabs: Drafts / Ready / Skipped */}
              <div className="flex mb-2 border-b border-gray-200">
                <button
                  onClick={() => setPlacesTab('drafts')}
                  className={`flex-1 py-2 text-sm font-bold text-center border-b-2 transition-all ${
                    placesTab === 'drafts' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {`✏️ ${t("places.drafts")} (${groupedPlaces.draftsCount})`}
                </button>
                <button
                  onClick={() => setPlacesTab('ready')}
                  className={`flex-1 py-2 text-sm font-bold text-center border-b-2 transition-all ${
                    placesTab === 'ready' ? 'border-green-500 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {`🔒 ${t("places.ready")} (${groupedPlaces.readyCount})`}
                </button>
                <button
                  onClick={() => setPlacesTab('skipped')}
                  className={`flex-1 py-2 text-sm font-bold text-center border-b-2 transition-all ${
                    placesTab === 'skipped' ? 'border-red-500 text-red-700 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {`🚫 ${t("places.skipped")} (${groupedPlaces.blacklistCount})`}
                </button>
              </div>
              
              {/* Pending locations waiting for sync */}
              {pendingLocations.filter(l => (l.cityId || 'bangkok') === selectedCityId).length > 0 && (
                <div style={{ background: '#fff7ed', border: '2px dashed #fb923c', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#c2410c' }}>
                        {`☁️ ${pendingLocations.filter(l => (l.cityId || 'bangkok') === selectedCityId).length} ${t('toast.pendingSync')}`}
                      </span>
                      <div style={{ fontSize: '10px', color: '#9a3412', marginTop: '2px' }}>
                        {pendingLocations.filter(l => (l.cityId || 'bangkok') === selectedCityId).map(l => l.name).join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={() => syncPendingItems()}
                      disabled={!firebaseConnected}
                      style={{ padding: '4px 10px', background: firebaseConnected ? '#f97316' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: firebaseConnected ? 'pointer' : 'not-allowed' }}
                    >
                      {`🔄 ${t('toast.syncNow')}`}
                    </button>
                  </div>
                </div>
              )}
              
              {locationsLoading ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <p className="text-gray-500 text-sm">{t("general.loading")}</p>
                </div>
              ) : (groupedPlaces.sortedKeys.length === 0 && groupedPlaces.ungrouped.length === 0) ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">{placesTab === 'drafts' ? '✏️' : placesTab === 'ready' ? '🔒' : '🚫'}</div>
                  <p className="text-gray-600 text-sm">
                    {placesTab === 'drafts' ? t("places.noPlacesInCity", {cityName: tLabel(window.BKK.selectedCity) || t('places.thisCity')})
                     : placesTab === 'ready' ? t("places.noPlacesInCity", {cityName: tLabel(window.BKK.selectedCity) || t('places.thisCity')})
                     : t("places.noPlacesInCity", {cityName: tLabel(window.BKK.selectedCity) || t('places.thisCity')})}
                  </p>
                </div>
              ) : (
                <div className="max-h-[55vh] overflow-y-auto" style={{ contain: 'content' }}>
                  {groupedPlaces.sortedKeys.map(key => {
                    const locs = groupedPlaces.groups[key];
                    const obj = placesGroupBy === 'interest' 
                      ? (interestMap[key] || customInterests?.find(ci => ci.id === key))
                      : areaMap[key];
                    const groupLabel = obj ? tLabel(obj) : key;
                    const groupIcon = placesGroupBy === 'interest' ? (obj?.icon || '🏷️') : '📍';
                    const canEdit = placesTab === 'drafts' || isUnlocked;
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg overflow-hidden mb-1.5">
                        <div className="bg-gray-100 px-2 py-1 flex items-center gap-1 text-xs font-bold text-gray-700">
                          <span>{groupIcon?.startsWith?.('data:') ? <img src={groupIcon} alt="" className="w-4 h-4 object-contain inline" /> : groupIcon}</span>
                          <span>{groupLabel}</span>
                          <span className="text-gray-400 font-normal">({locs.length})</span>
                        </div>
                        <div className="p-1">
                          {locs.map(loc => {
                            const mapUrl = (() => { const u = window.BKK.getGoogleMapsUrl(loc); return u === '#' ? null : u; })();
                            return (
                              <div key={loc.id}
                                className={`flex items-center justify-between gap-2 border-2 rounded p-1.5 mb-0.5 ${
                                  placesTab === 'skipped' ? 'border-red-200 bg-red-50' :
                                  isLocationValid(loc) ? "border-gray-200 bg-white" : "border-red-400 bg-red-50"
                                }`}
                                style={{ contain: 'layout style' }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {mapUrl ? (
                                      <a href={mapUrl} target="city_explorer_map" rel="noopener noreferrer"
                                        className="font-medium text-sm text-blue-600 truncate"
                                      >{loc.name}</a>
                                    ) : (
                                      <span className="font-medium text-sm truncate">{loc.name}</span>
                                    )}
                                    {loc.locked && isUnlocked && <span title={t("general.locked")} style={{ fontSize: '12px' }}>🔒</span>}
                                    {loc.outsideArea && <span className="text-orange-500 text-xs" title={t("general.outsideBoundary")}>🔺</span>}
                                    {loc.missingCoordinates && <span className="text-red-500 text-xs" title={t("general.noLocation")}>⚠️</span>}
                                    {!isLocationValid(loc) && <span className="text-red-500 text-[9px]" title={t("places.missingDetailsLong")}>❌</span>}
                                    {placesGroupBy === 'area' && loc.interests?.map((int, idx) => {
                                      const obj2 = interestMap[int];
                                      return obj2?.icon ? <span key={idx} title={obj2.label} style={{ fontSize: '13px' }}>{obj2.icon}</span> : null;
                                    })}
                                    {placesGroupBy === 'interest' && (loc.areas || [loc.area]).filter(Boolean).map((aId, idx) => (
                                      <span key={idx} className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded">{(areaMap[aId] || {}).label || aId}</span>
                                    ))}
                                  </div>
                                </div>
                                <button onClick={() => handleEditLocation(loc)}
                                  className="text-xs px-1 py-0.5 rounded"
                                  title={canEdit ? t("places.detailsEdit") : t("general.viewOnly")}>{canEdit ? "✏️" : "👁️"}</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {groupedPlaces.ungrouped.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden mb-1.5">
                      <div className="bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500">
                        {t("places.noInterest")} ({groupedPlaces.ungrouped.length})
                      </div>
                      <div className="p-1">
                        {groupedPlaces.ungrouped.map(loc => {
                          const mapUrl = (() => { const u = window.BKK.getGoogleMapsUrl(loc); return u === '#' ? null : u; })();
                          const canEdit = placesTab === 'drafts' || isUnlocked;
                          return (
                            <div key={loc.id}
                              className={`flex items-center justify-between gap-2 border-2 rounded p-1.5 mb-0.5 ${isLocationValid(loc) ? "border-gray-200 bg-white" : "border-red-400 bg-red-50"}`}
                              style={{ contain: 'layout style' }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {mapUrl ? (
                                    <a href={mapUrl} target="city_explorer_map" rel="noopener noreferrer"
                                      className="font-medium text-sm text-blue-600 truncate"
                                    >{loc.name}</a>
                                  ) : (
                                    <span className="font-medium text-sm truncate">{loc.name}</span>
                                  )}
                                  {loc.locked && isUnlocked && <span title={t("general.locked")} style={{ fontSize: '12px' }}>🔒</span>}
                                  {!isLocationValid(loc) && <span className="text-red-500 text-[9px]" title={t("places.missingDetails")}>❌</span>}
                                </div>
                              </div>
                              <button onClick={() => handleEditLocation(loc)}
                                className="text-xs px-1 py-0.5 rounded"
                                title={canEdit ? t("places.detailsEdit") : t("general.viewOnly")}>{canEdit ? "✏️" : "👁️"}</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* My Interests View */}
        {currentView === 'myInterests' && (
          <div className="view-fade-in bg-white rounded-xl shadow-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">🏷️ {t("nav.myInterests")}</h2>
                <button onClick={() => showHelpFor('myInterests')} className="text-blue-400 hover:text-blue-600 text-sm" title={t("general.help")}style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}>{t("general.help")}</button>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  {(window.BKK.interestOptions || []).length + (window.BKK.uncoveredInterests || []).length + (cityCustomInterests || []).length} {t("general.total")}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={resetInterestStatusToDefault}
                  className="bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-300"
                  title={t("interests.resetToDefault")}
                >
                  {t("interests.resetToDefault")}
                </button>
                <button
                  onClick={() => {
                    setEditingCustomInterest(null);
                    setNewInterest({ label: '', labelEn: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, locked: false, builtIn: false });
                    setShowAddInterestDialog(true);
                  }}
                  className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-600"
                >
                  {t("interests.addInterest")}
                </button>
              </div>
            </div>
            
            {/* Unified Interest List */}
            {(() => {
              const openInterestDialog = (interest, isCustom = false) => {
                const config = interestConfig[interest.id] || {};
                setEditingCustomInterest(isCustom ? interest : { ...interest, builtIn: true });
                setNewInterest({
                  id: interest.id,
                  label: interest.label || interest.name || '',
                  labelEn: config.labelEnOverride || config.labelOverrideEn || interest.labelEn || '',
                  icon: interest.icon || '📍',
                  searchMode: config.textSearch ? 'text' : 'types',
                  types: (config.types || []).join(', '),
                  textSearch: config.textSearch || '',
                  blacklist: (config.blacklist || []).join(', '),
                  privateOnly: interest.privateOnly || false,
                  locked: interest.locked || false,
                  builtIn: !isCustom,
                  scope: config.scope || interest.scope || 'global',
                  cityId: config.cityId || interest.cityId || '',
                  category: config.category || interest.category || 'attraction',
                  weight: config.weight || interest.weight || ({'attraction':3,'break':1,'meal':1,'experience':1,'shopping':2,'nature':2}[config.category || interest.category || 'attraction'] || 2),
                  minStops: config.minStops != null ? config.minStops : (interest.minStops != null ? interest.minStops : 1),
                  maxStops: config.maxStops || interest.maxStops || 10,
                  routeSlot: config.routeSlot || interest.routeSlot || 'any',
                  minGap: config.minGap || interest.minGap || 1,
                  bestTime: config.bestTime || interest.bestTime || 'anytime',
                  dedupRelated: config.dedupRelated || interest.dedupRelated || []
                });
                setShowAddInterestDialog(true);
              };
              
              const renderInterestRow = (interest, isCustom = false, isActive = true) => {
                const isValid = isInterestValid(interest.id);
                const effectiveActive = isValid ? isActive : false; // Invalid always inactive
                const borderClass = !effectiveActive ? 'border border-gray-300 bg-gray-50 opacity-60'
                  : isCustom ? (isValid ? 'border border-gray-200 bg-white' : 'border-2 border-red-400 bg-red-50')
                  : (isValid ? 'border border-gray-200 bg-white' : 'border-2 border-red-400 bg-red-50');
                
                return (
                  <div key={interest.id} className={`flex items-center justify-between gap-2 rounded-lg p-2 ${borderClass}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{interest.icon?.startsWith?.('data:') ? <img src={interest.icon} alt="" className="w-5 h-5 object-contain" /> : interest.icon}</span>
                      <span className={`font-medium text-sm truncate ${!effectiveActive ? 'text-gray-500' : ''}`}>{tLabel(interest)}</span>
                      {isCustom && <span className="text-[10px] bg-purple-200 text-purple-800 px-1 py-0.5 rounded flex-shrink-0">{t("general.custom")}</span>}
                      {!isValid && <span className="text-red-500 text-xs flex-shrink-0" title={t("interests.missingSearchConfig")}>⚠️</span>}
                      {interest.locked && isUnlocked && <span title={t("general.locked")} style={{ fontSize: '11px' }} className="flex-shrink-0">🔒</span>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {/* Toggle button */}
                      <button
                        onClick={() => toggleInterestStatus(interest.id)}
                        disabled={!isValid}
                        className={`text-[10px] px-2 py-1 rounded font-bold transition ${
                          !isValid ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : effectiveActive ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={!isValid ? t('interests.interestInvalid') : effectiveActive ? t('general.disable') : t('general.enable')}
                      >
                        {effectiveActive ? t('general.disable') : t('general.enableAlt')}
                      </button>
                      <button
                        onClick={() => openInterestDialog(interest, isCustom)}
                        className="text-xs px-1 py-0.5 rounded flex-shrink-0"
                        title={interest.locked && !isUnlocked ? t("general.viewOnly") : t("places.detailsEdit")}
                      >{interest.locked && !isUnlocked ? '👁️' : '✏️'}</button>
                    </div>
                  </div>
                );
              };
              
              const overriddenBuiltIn = interestOptions.map(i => {
                const cfg = interestConfig[i.id];
                if (!cfg) return i;
                return { ...i, label: cfg.labelOverride || i.label, icon: cfg.iconOverride || i.icon, locked: cfg.locked !== undefined ? cfg.locked : i.locked };
              });
              const overriddenUncovered = uncoveredInterests.map(i => {
                const cfg = interestConfig[i.id];
                if (!cfg) return i;
                return { ...i, label: cfg.labelOverride || i.label, icon: cfg.iconOverride || i.icon, locked: cfg.locked !== undefined ? cfg.locked : i.locked };
              });
              const activeBuiltIn = overriddenBuiltIn.filter(i => isInterestValid(i.id) && interestStatus[i.id] !== false);
              const activeUncovered = overriddenUncovered.filter(i => isInterestValid(i.id) && interestStatus[i.id] === true);
              const activeCustom = cityCustomInterests.filter(i => isInterestValid(i.id) && interestStatus[i.id] !== false);
              const inactiveBuiltIn = overriddenBuiltIn.filter(i => !isInterestValid(i.id) || interestStatus[i.id] === false);
              const inactiveUncovered = overriddenUncovered.filter(i => !isInterestValid(i.id) || interestStatus[i.id] !== true);
              const inactiveCustom = cityCustomInterests.filter(i => !isInterestValid(i.id) || interestStatus[i.id] === false);
              
              return (
                <>
                  {/* Active Interests */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-green-700 mb-2">
                      {t("interests.activeInterests")} ({activeBuiltIn.length + activeUncovered.length + activeCustom.length})
                    </h3>
                    <div className="space-y-1">
                      {activeBuiltIn.map(i => renderInterestRow(i, false, true))}
                      {activeUncovered.map(i => renderInterestRow(i, false, true))}
                      {activeCustom.map(i => renderInterestRow(i, true, true))}
                    </div>
                  </div>
                  
                  {/* Inactive Interests */}
                  {(inactiveBuiltIn.length + inactiveUncovered.length + inactiveCustom.length) > 0 && (
                    <div className="mb-2">
                      <h3 className="text-sm font-bold text-gray-500 mb-2">
                        ⏸️ Disabled interests ({inactiveBuiltIn.length + inactiveUncovered.length + inactiveCustom.length})
                      </h3>
                      <div className="space-y-1">
                        {inactiveBuiltIn.map(i => renderInterestRow(i, false, false))}
                        {inactiveUncovered.map(i => renderInterestRow(i, false, false))}
                        {inactiveCustom.map(i => renderInterestRow(i, true, false))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Settings View - Compact Design */}
        {currentView === 'settings' && (
          <div className="view-fade-in bg-white rounded-xl shadow-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold">{t("settings.title")}</h2>
              <button
                onClick={() => showHelpFor('settings')}
                className="text-gray-400 hover:text-blue-500 text-sm"
                title={t("general.help")}
              >
                {t("general.help")}
              </button>
            </div>
            
            {/* Settings Sub-Tabs */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSettingsTab('cities')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                  settingsTab === 'cities' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >{`🌍 ${t('settings.citiesAndAreas')}`}</button>
              <button
                onClick={() => setSettingsTab('general')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                  settingsTab === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >{`⚙️ ${t('settings.generalSettings')}`}</button>
              {isUnlocked && (
              <button
                onClick={() => setSettingsTab('sysparams')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                  settingsTab === 'sysparams' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >{`🔧 ${t('sysParams.tabTitle')}`}</button>
              )}
            </div>

            {/* ===== CITIES & AREAS TAB ===== */}
            {settingsTab === 'cities' && (<div>

            {/* City & Area Management */}
            <div className="mb-3">
              <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-400 rounded-lg p-2">
                <h3 className="text-sm font-bold text-gray-800 mb-2">{`🌍 ${t("settings.title")}`}</h3>
                
                {/* City selector dropdown + selected city details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <select
                    value={selectedCityId}
                    onChange={(e) => switchCity(e.target.value, true)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '2px solid #e11d48', fontSize: '13px', fontWeight: 'bold', color: '#e11d48', background: '#fef2f2', cursor: 'pointer', minWidth: '140px' }}
                  >
                    {Object.values(window.BKK.cities || {}).map(city => (
                      <option key={city.id} value={city.id}>{city.icon} {tLabel(city)}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowAddCityDialog(true)}
                    style={{ padding: '5px 10px', borderRadius: '8px', border: '1.5px dashed #d1d5db', background: 'white', cursor: 'pointer', fontSize: '11px', color: '#6b7280' }}
                  >➕ {t('settings.addCity')}</button>
                </div>
                
                {/* Selected city info bar */}
                {(() => {
                  const city = window.BKK.selectedCity;
                  if (!city) return null;
                  const isActive = city.active !== false;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '6px 10px', background: isActive ? '#ecfdf5' : '#fef2f2', borderRadius: '8px', border: `1px solid ${isActive ? '#a7f3d0' : '#fecaca'}`, flexWrap: 'wrap' }}>
                      {isUnlocked ? (
                        <React.Fragment>
                          <input type="text" value={city.icon || '📍'}
                            onChange={(e) => { city.icon = e.target.value; if (window.BKK.cityRegistry[city.id]) window.BKK.cityRegistry[city.id].icon = e.target.value; setCityModified(true); setCityEditCounter(c => c + 1); }}
                            style={{ width: '42px', fontSize: '18px', textAlign: 'center', padding: '2px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff' }}
                          />
                          <button onClick={() => setIconPickerConfig({ description: city.nameEn || city.name || '', callback: (emoji) => { city.icon = emoji; if (window.BKK.cityRegistry[city.id]) window.BKK.cityRegistry[city.id].icon = emoji; setCityModified(true); setCityEditCounter(c => c + 1); }, suggestions: [], loading: false })}
                            style={{ fontSize: '10px', padding: '2px 4px', border: '1px dashed #f59e0b', borderRadius: '4px', background: '#fffbeb', cursor: 'pointer', color: '#d97706', fontWeight: 'bold' }}
                          >✨</button>
                          <input type="text" value={city.name || ''}
                            onChange={(e) => { city.name = e.target.value; if (window.BKK.cityRegistry[city.id]) window.BKK.cityRegistry[city.id].name = e.target.value; setCityModified(true); setCityEditCounter(c => c + 1); }}
                            style={{ width: '70px', fontSize: '12px', padding: '2px 4px', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 'bold' }}
                            placeholder="HE"
                          />
                          <input type="text" value={city.nameEn || ''}
                            onChange={(e) => { city.nameEn = e.target.value; if (window.BKK.cityRegistry[city.id]) window.BKK.cityRegistry[city.id].nameEn = e.target.value; setCityModified(true); setCityEditCounter(c => c + 1); }}
                            style={{ width: '70px', fontSize: '12px', padding: '2px 4px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            placeholder="EN"
                          />
                        </React.Fragment>
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{city.icon} {tLabel(city)}</span>
                      )}
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>{city.areas?.length || 0} {t('general.areas')} · {city.interests?.length || 0} {t('nav.myInterests')}</span>
                          <button onClick={() => {
                            city.active = !isActive;
                            try { const s = JSON.parse(localStorage.getItem('city_active_states') || '{}'); s[city.id] = city.active; localStorage.setItem('city_active_states', JSON.stringify(s)); } catch(e) {}
                            showToast(tLabel(city) + (city.active ? ' ✓' : ' ✗'), 'info');
                            setFormData(prev => ({...prev}));
                          }} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}
                          >{isActive ? `▶️ ${t('general.active')}` : `⏸️ ${t('general.inactive')}`}</button>
                          <button onClick={() => { window.BKK.exportCityFile(city); showToast(`📥 city-${city.id}.js`, 'success'); setCityModified(false); }}
                            style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', background: 'white', color: '#6b7280' }}
                          >📥 {t('settings.exportCity')}</button>
                          {Object.keys(window.BKK.cities || {}).length > 1 && (
                            <button onClick={async () => {
                              const pw = prompt(t('settings.enterPasswordToRemove'));
                              if (pw === null) return;
                              if (adminPassword) {
                                const hashedInput = await window.BKK.hashPassword(pw);
                                if (hashedInput !== adminPassword && pw !== adminPassword) { showToast(t('settings.wrongPassword'), 'error'); return; }
                              }
                              if (!confirm(`⚠️ ${t('general.remove')} ${tLabel(city)}?`)) return;
                              const otherCity = Object.keys(window.BKK.cities || {}).find(id => id !== city.id);
                              if (otherCity) switchCity(otherCity, true);
                              window.BKK.unloadCity(city.id);
                              try { const s = JSON.parse(localStorage.getItem('city_active_states') || '{}'); delete s[city.id]; localStorage.setItem('city_active_states', JSON.stringify(s)); } catch(e) {}
                              showToast(`${tLabel(city)} ${t('general.removed')}`, 'info');
                              setCityModified(false);
                              setFormData(prev => ({...prev}));
                            }} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #fecaca', cursor: 'pointer', background: '#fef2f2', color: '#ef4444' }}
                            >🗑️ {t('general.remove')}</button>
                          )}
                    </div>
                  );
                })()}

                {/* Theme Editor - Color + Icons */}
                {isUnlocked && window.BKK.selectedCity && (() => {
                  const city = window.BKK.selectedCity;
                  if (!city.theme) city.theme = { color: '#e11d48', iconLeft: '🏙️', iconRight: '🗺️' };
                  const theme = city.theme;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>🎨</span>
                      <input type="color" value={theme.color || '#e11d48'}
                        onChange={(e) => { 
                          city.theme.color = e.target.value;
                          setCityModified(true); setCityEditCounter(c => c + 1);
                        }}
                        style={{ width: '28px', height: '22px', border: 'none', cursor: 'pointer', borderRadius: '4px', padding: 0 }}
                      />
                      <input type="text" value={theme.iconLeft || ''} placeholder="◀"
                        onChange={(e) => {
                          city.theme.iconLeft = e.target.value;
                          setCityModified(true); setCityEditCounter(c => c + 1);
                        }}
                        style={{ width: '36px', fontSize: '14px', textAlign: 'center', padding: '2px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                      <button onClick={() => setIconPickerConfig({ description: (city.nameEn || city.name || '') + ' left side icon', callback: (emoji) => { city.theme.iconLeft = emoji; setCityModified(true); setCityEditCounter(c => c + 1); }, suggestions: [], loading: false })}
                        style={{ fontSize: '8px', padding: '1px 3px', border: '1px dashed #f59e0b', borderRadius: '3px', background: '#fffbeb', cursor: 'pointer', color: '#d97706' }}
                      >✨</button>
                      <div style={{ width: '60px', height: '22px', borderRadius: '6px', background: theme.color || '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: '9px', fontWeight: 'bold' }}>{tLabel(city)}</span>
                      </div>
                      <button onClick={() => setIconPickerConfig({ description: (city.nameEn || city.name || '') + ' right side icon', callback: (emoji) => { city.theme.iconRight = emoji; setCityModified(true); setCityEditCounter(c => c + 1); }, suggestions: [], loading: false })}
                        style={{ fontSize: '8px', padding: '1px 3px', border: '1px dashed #f59e0b', borderRadius: '3px', background: '#fffbeb', cursor: 'pointer', color: '#d97706' }}
                      >✨</button>
                      <input type="text" value={theme.iconRight || ''} placeholder="▶"
                        onChange={(e) => {
                          city.theme.iconRight = e.target.value;
                          setCityModified(true); setCityEditCounter(c => c + 1);
                        }}
                        style={{ width: '36px', fontSize: '14px', textAlign: 'center', padding: '2px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
                  );
                })()}

                {/* Modified indicator + actions */}
                {cityModified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '6px 10px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                    <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 'bold' }}>⚠️ {t('settings.unsavedChanges')}</span>
                    <button onClick={() => { 
                      const city = window.BKK.selectedCity;
                      if (city) { window.BKK.exportCityFile(city); showToast(`📥 city-${city.id}.js`, 'success'); setCityModified(false); }
                    }} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#f59e0b', color: 'white', fontWeight: 'bold' }}
                    >📥 {t('settings.exportCity')}</button>
                  </div>
                )}

                {/* City Day/Night Hours */}
                {isUnlocked && window.BKK.selectedCity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', padding: '8px 10px', background: 'linear-gradient(to right, #faf5ff, #fdf2f8)', borderRadius: '8px', border: '2px solid #c084fc', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#7c3aed' }}>🌅 {t('settings.dayNightHours')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>☀️</label>
                    {(() => {
                      const val = window.BKK.dayStartHour ?? 6;
                      const update = (v) => {
                        const clamped = Math.min(23, Math.max(0, v));
                        window.BKK.dayStartHour = clamped;
                        const city = window.BKK.selectedCity;
                        if (city) city.dayStartHour = clamped;
                        if (isFirebaseAvailable && database && isUnlocked) {
                          database.ref(`settings/cityOverrides/${selectedCityId}/dayStartHour`).set(clamped);
                        }
                        setFormData(prev => ({...prev}));
                      };
                      return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <button onClick={() => update(val - 1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: val <= 0 ? '#e5e7eb' : '#7c3aed', color: val <= 0 ? '#9ca3af' : 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>{val}</span>
                        <button onClick={() => update(val + 1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: val >= 23 ? '#e5e7eb' : '#7c3aed', color: val >= 23 ? '#9ca3af' : 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      );
                    })()}
                    <label style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>🌙</label>
                    {(() => {
                      const val = window.BKK.nightStartHour ?? 17;
                      const update = (v) => {
                        const clamped = Math.min(23, Math.max(0, v));
                        window.BKK.nightStartHour = clamped;
                        const city = window.BKK.selectedCity;
                        if (city) city.nightStartHour = clamped;
                        if (isFirebaseAvailable && database && isUnlocked) {
                          database.ref(`settings/cityOverrides/${selectedCityId}/nightStartHour`).set(clamped);
                        }
                        setFormData(prev => ({...prev}));
                      };
                      return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <button onClick={() => update(val - 1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: val <= 0 ? '#e5e7eb' : '#7c3aed', color: val <= 0 ? '#9ca3af' : 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>{val}</span>
                        <button onClick={() => update(val + 1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: val >= 23 ? '#e5e7eb' : '#7c3aed', color: val >= 23 ? '#9ca3af' : 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      );
                    })()}
                  </div>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                    {`☀️ ${String(window.BKK.dayStartHour ?? 6).padStart(2,'0')}:00–${String(window.BKK.nightStartHour ?? 17).padStart(2,'0')}:00`}
                    {` 🌙 ${String(window.BKK.nightStartHour ?? 17).padStart(2,'0')}:00–${String(window.BKK.dayStartHour ?? 6).padStart(2,'0')}:00`}
                  </span>
                </div>
                )}

                {/* Add Area + Show Map buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px' }}>
                  <button onClick={() => {
                    setShowSettingsMap(!showSettingsMap);
                    if (!showSettingsMap) {
                      setTimeout(() => {
                        const container = document.getElementById('settings-all-areas-map');
                        if (!container || !window.L) return;
                        container.innerHTML = '';
                        container._leaflet_id = null;
                        const city = window.BKK.selectedCity;
                        if (!city) return;
                        const coords = window.BKK.areaCoordinates || {};
                        const areas = city.areas || [];
                        const cityCenter = city.center || window.BKK.activeCityData?.center || { lat: 0, lng: 0 };
                        const map = L.map(container).setView([cityCenter.lat, cityCenter.lng], 12);
                        L.tileLayer(window.BKK.getTileUrl(), { attribution: '© OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
                        const colorPalette = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7', '#14b8a6', '#e11d48', '#84cc16', '#0ea5e9', '#d946ef', '#f43f5e'];
                        const allCircles = [];
                        mapMarkersRef.current = [];
                        areas.forEach((area, i) => {
                          const c = coords[area.id];
                          if (!c) return;
                          const color = colorPalette[i % colorPalette.length];
                          const circle = L.circle([c.lat, c.lng], { radius: c.radius, color, fillColor: color, fillOpacity: 0.15, weight: 2 }).addTo(map);
                          allCircles.push(circle);
                          const marker = L.marker([c.lat, c.lng], { draggable: false, title: tLabel(area) }).addTo(map);
                          marker.bindTooltip(tLabel(area), { permanent: true, direction: 'top', className: 'area-label-tooltip', offset: [0, -10] });
                          marker._areaId = area.id;
                          marker._circle = circle;
                          marker._area = area;
                          marker._coords = c;
                          marker.on('dragend', () => {
                            const pos = marker.getLatLng();
                            const newLat = Math.round(pos.lat * 10000) / 10000;
                            const newLng = Math.round(pos.lng * 10000) / 10000;
                            area.lat = newLat; area.lng = newLng;
                            c.lat = newLat; c.lng = newLng;
                            circle.setLatLng(pos);
                          });
                          mapMarkersRef.current.push(marker);
                        });
                        if (allCircles.length > 0) {
                          const group = L.featureGroup(allCircles);
                          map.fitBounds(group.getBounds().pad(0.1));
                        }
                        window._settingsMap = map;
                        setTimeout(() => map.invalidateSize(), 200);
                      }, 300);
                    } else {
                      try { if (window._settingsMap) { window._settingsMap.off(); window._settingsMap.remove(); } } catch(e) {}
                      window._settingsMap = null;
                      setMapEditMode(false);
                      mapMarkersRef.current = [];
                    }
                  }} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', border: '1.5px solid #3b82f6', cursor: 'pointer', background: showSettingsMap ? '#3b82f6' : '#eff6ff', color: showSettingsMap ? 'white' : '#2563eb', fontWeight: 'bold' }}
                  >{showSettingsMap ? '✕' : '🗺️'} {t('wizard.allAreasMap')}</button>
                  <button onClick={() => {
                    const city = window.BKK.selectedCity;
                    if (!city) return;
                    const name = prompt(t('settings.newAreaName'));
                    if (!name || !name.trim()) return;
                    const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
                    if (city.areas.some(a => a.id === id)) { showToast(t('settings.areaExists'), 'warning'); return; }
                    const newArea = { id, label: name.trim(), labelEn: name.trim(), desc: '', descEn: '', lat: city.center?.lat || 0, lng: city.center?.lng || 0, radius: 2000, size: 'medium', safety: 'safe' };
                    city.areas.push(newArea);
                    window.BKK.areaCoordinates[id] = { lat: newArea.lat, lng: newArea.lng, radius: newArea.radius, distanceMultiplier: city.distanceMultiplier || 1.2, size: 'medium', safety: 'safe' };
                    window.BKK.areaOptions.push({ id, label: newArea.label, labelEn: newArea.labelEn, desc: '', descEn: '' });
                    setCityModified(true); setCityEditCounter(c => c + 1);
                    showToast(`➕ ${name.trim()}`, 'success');
                    setFormData(prev => ({...prev}));
                  }} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', border: '1.5px dashed #d1d5db', cursor: 'pointer', background: 'white', color: '#6b7280' }}
                  >➕ {t('settings.addArea')}</button>
                </div>

                {/* All areas map */}
                {showSettingsMap && (
                  <div style={{ marginBottom: '8px' }}>
                    <div id="settings-all-areas-map" style={{ height: '450px', borderRadius: '8px', border: `2px solid ${mapEditMode ? '#ef4444' : '#3b82f6'}`, transition: 'border-color 0.3s' }}></div>
                    <div className="flex gap-2 mt-2 justify-center">
                      {!mapEditMode ? (
                        <button onClick={() => {
                          setMapEditMode(true);
                          mapOriginalPositions.current = {};
                          mapMarkersRef.current.forEach(m => {
                            const ll = m.getLatLng();
                            mapOriginalPositions.current[m._areaId] = { lat: ll.lat, lng: ll.lng };
                            m.dragging.enable();
                          });
                        }} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-white">
                          ✏️ {t('general.editMap')}
                        </button>
                      ) : (
                        <>
                          <button onClick={() => {
                            setMapEditMode(false);
                            mapMarkersRef.current.forEach(m => {
                              m.dragging.disable();
                            });
                            setCityModified(true); setCityEditCounter(c => c + 1);
                            setFormData(prev => ({...prev}));
                            showToast(t('general.mapSaved'), 'success');
                          }} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-green-500 text-white">
                            ✅ {t('general.confirm')}
                          </button>
                          <button onClick={() => {
                            setMapEditMode(false);
                            const coords = window.BKK.areaCoordinates || {};
                            mapMarkersRef.current.forEach(m => {
                              const orig = mapOriginalPositions.current[m._areaId];
                              if (orig) {
                                m.setLatLng([orig.lat, orig.lng]);
                                m._circle.setLatLng([orig.lat, orig.lng]);
                                m._area.lat = Math.round(orig.lat * 10000) / 10000;
                                m._area.lng = Math.round(orig.lng * 10000) / 10000;
                                m._coords.lat = Math.round(orig.lat * 10000) / 10000;
                                m._coords.lng = Math.round(orig.lng * 10000) / 10000;
                              }
                              m.dragging.disable();
                            });
                            showToast(t('general.cancel'), 'info');
                          }} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gray-400 text-white">
                            ✕ {t('general.cancel')}
                          </button>
                        </>
                      )}
                    </div>
                    {mapEditMode && (
                      <p className="text-center text-[10px] text-red-500 mt-1 font-bold">{t('general.dragToMove')}</p>
                    )}
                  </div>
                )}

                {/* Areas list for selected city */}
                <div style={{ overflowY: 'auto', maxHeight: editingArea ? 'none' : '350px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px' }}>
                  {/* Build combined list: whole city + areas */}
                  {(() => {
                    const city = window.BKK.selectedCity;
                    if (!city) return null;
                    const wholeCityItem = { id: '__whole_city__', label: t('general.allCity'), labelEn: 'Whole City', desc: '', descEn: '', lat: city.center?.lat || 0, lng: city.center?.lng || 0, radius: city.allCityRadius || 15000, safety: 'safe', isWholeCity: true };
                    const allItems = [wholeCityItem, ...(city.areas || [])];
                    
                    return allItems.map((area, i) => {
                      const isEditing = editingArea?.id === area.id;
                      const safetyColors = { safe: '#22c55e', caution: '#f59e0b', danger: '#ef4444' };
                      const safetyLabels = { safe: t('general.safeArea'), caution: t('general.caution'), danger: t('general.dangerArea') };
                      const areaCoord = window.BKK.areaCoordinates?.[area.id] || {};
                      
                      return (
                        <div key={area.id} style={{ padding: '5px 6px', borderBottom: i < allItems.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: '11px', background: area.isWholeCity ? '#fefce8' : 'transparent' }}>
                          {/* Area header row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 'bold', flex: 1, color: '#1f2937' }}>{area.isWholeCity ? '🌐 ' : ''}{tLabel(area)}</span>
                            <span style={{ fontSize: '9px', color: '#6b7280' }}>{area.radius}m</span>
                            {!area.isWholeCity && (
                              <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '4px', background: safetyColors[area.safety || 'safe'] + '20', color: safetyColors[area.safety || 'safe'], fontWeight: 'bold' }}>
                                {safetyLabels[area.safety || 'safe']}
                              </span>
                            )}
                            {!area.isWholeCity && !isEditing && (
                              <button onClick={() => {
                                const newName = prompt(t('settings.renameArea'), tLabel(area));
                                if (!newName || !newName.trim() || newName.trim() === tLabel(area)) return;
                                area.label = newName.trim();
                                area.labelEn = newName.trim();
                                const ao = window.BKK.areaOptions?.find(a => a.id === area.id);
                                if (ao) { ao.label = area.label; ao.labelEn = area.labelEn; }
                                setCityModified(true); setCityEditCounter(c => c + 1);
                                showToast(`✏️ ${newName.trim()}`, 'success');
                                setFormData(prev => ({...prev}));
                              }} style={{ fontSize: '8px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                              title={t('settings.renameArea')}>✏️</button>
                            )}
                            {!area.isWholeCity && !isEditing && (
                              <button onClick={() => {
                                if (!confirm(`${t('general.remove')} ${tLabel(area)}?`)) return;
                                const city = window.BKK.selectedCity;
                                if (!city) return;
                                city.areas = city.areas.filter(a => a.id !== area.id);
                                delete window.BKK.areaCoordinates[area.id];
                                window.BKK.areaOptions = window.BKK.areaOptions.filter(a => a.id !== area.id);
                                setCityModified(true); setCityEditCounter(c => c + 1);
                                showToast(`🗑️ ${tLabel(area)}`, 'info');
                                setFormData(prev => ({...prev}));
                              }} style={{ fontSize: '8px', color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                              title={t('general.remove')}>🗑️</button>
                            )}
                            {!isEditing && (
                              <button
                                onClick={() => {
                                  try { if (window._editMap) { window._editMap.off(); window._editMap.remove(); } } catch(e) {}
                                  window._editMap = null; window._editCircle = null; window._editMarker = null;
                                  window._editOriginal = { lat: area.lat, lng: area.lng, radius: area.radius, safety: area.safety, distanceMultiplier: area.distanceMultiplier };
                                  setEditingArea(area);
                                  setTimeout(() => {
                                    const container = document.getElementById(`area-edit-map-${area.id}`);
                                    if (!container || !window.L) return;
                                    container.innerHTML = '';
                                    container._leaflet_id = null;
                                    const zoom = area.isWholeCity ? 11 : 13;
                                    const map = L.map(container).setView([area.lat, area.lng], zoom);
                                    L.tileLayer(window.BKK.getTileUrl(), { attribution: '© OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
                                    const color = area.isWholeCity ? '#eab308' : '#10b981';
                                    const circle = L.circle([area.lat, area.lng], { radius: area.radius, color: color, fillOpacity: 0.15, weight: 2 }).addTo(map);
                                    const marker = L.marker([area.lat, area.lng], { draggable: true }).addTo(map);
                                    marker.on('dragend', () => {
                                      const pos = marker.getLatLng();
                                      area.lat = Math.round(pos.lat * 10000) / 10000;
                                      area.lng = Math.round(pos.lng * 10000) / 10000;
                                      if (area.isWholeCity) { city.center = { lat: area.lat, lng: area.lng }; }
                                      else { const ac = window.BKK.areaCoordinates?.[area.id]; if (ac) { ac.lat = area.lat; ac.lng = area.lng; } }
                                      circle.setLatLng(pos);
                                      setFormData(prev => ({...prev}));
                                    });
                                    window._editMap = map; window._editCircle = circle; window._editMarker = marker;
                                    map.fitBounds(circle.getBounds().pad(0.3));
                                    setTimeout(() => { map.invalidateSize(); map.fitBounds(circle.getBounds().pad(0.3)); }, 100);
                                    setTimeout(() => { map.invalidateSize(); map.fitBounds(circle.getBounds().pad(0.3)); }, 400);
                                    setTimeout(() => { map.invalidateSize(); }, 800);
                                    setTimeout(() => { const el = document.getElementById(`area-edit-map-${area.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 500);
                                  }, 300);
                                }}
                                style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#2563eb', cursor: 'pointer' }}
                              >✏️ {t('general.edit')}</button>
                            )}
                          </div>
                          {/* Read-only desc */}
                          {!isEditing && <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '1px' }}>{tDesc(area)}</div>}
                          
                          {/* Edit mode */}
                          {isEditing && (
                            <div style={{ marginTop: '8px', border: '2px solid #3b82f6', borderRadius: '8px', padding: '8px', background: '#f0f9ff' }}>
                              <div id={`area-edit-map-${area.id}`} style={{ height: '400px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '8px' }}></div>
                              <div className="flex items-center gap-3 flex-wrap mb-2">
                                <label className="text-[9px] text-gray-600 flex items-center gap-1">
                                  {t('settings.radius')}:
                                  <input type="range" min={area.isWholeCity ? '5000' : '500'} max={area.isWholeCity ? '30000' : '10000'} step="100" value={area.radius}
                                    onChange={(e) => {
                                      const v = parseInt(e.target.value);
                                      area.radius = v;
                                      if (area.isWholeCity) { city.allCityRadius = v; }
                                      else { const ac = window.BKK.areaCoordinates?.[area.id]; if (ac) ac.radius = v; }
                                      if (window._editCircle) window._editCircle.setRadius(v);
                                      setFormData(prev => ({...prev}));
                                    }}
                                    style={{ width: '100px' }}
                                  />
                                  <span className="font-bold">{area.radius}m</span>
                                </label>
                                {!area.isWholeCity && (
                                  <label className="text-[9px] text-gray-600 flex items-center gap-1">
                                    {t('general.multiplier')}:
                                    {(() => {
                                      const val = area.distanceMultiplier || city.distanceMultiplier || 1.2;
                                      const set = (v) => { const clamped = Math.round(Math.max(0.5, Math.min(5, v)) * 10) / 10; area.distanceMultiplier = clamped; const ac = window.BKK.areaCoordinates?.[area.id]; if (ac) ac.distanceMultiplier = clamped; setFormData(prev => ({...prev})); };
                                      return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        <button onClick={() => set(val - 0.1)} style={{ width: '20px', height: '20px', borderRadius: '4px', border: 'none', background: '#e5e7eb', color: '#374151', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>−</button>
                                        <span style={{ minWidth: '26px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }}>{val.toFixed(1)}</span>
                                        <button onClick={() => set(val + 0.1)} style={{ width: '20px', height: '20px', borderRadius: '4px', border: 'none', background: '#e5e7eb', color: '#374151', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>+</button>
                                      </div>
                                      );
                                    })()}
                                  </label>
                                )}
                                {!area.isWholeCity && (
                                  <select value={area.safety || 'safe'} style={{ fontSize: '9px', padding: '1px 2px', border: '1px solid #d1d5db', borderRadius: '4px', color: safetyColors[area.safety || 'safe'] }}
                                    onChange={(e) => { area.safety = e.target.value; const ac = window.BKK.areaCoordinates?.[area.id]; if (ac) ac.safety = area.safety; setFormData(prev => ({...prev})); }}
                                  >
                                    {['safe','caution','danger'].map(s => <option key={s} value={s}>{safetyLabels[s]}</option>)}
                                  </select>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    try { if (window._editMap) { window._editMap.off(); window._editMap.remove(); } } catch(e) {}
                                    window._editMap = null;
                                    setEditingArea(null);
                                    setCityModified(true); setCityEditCounter(c => c + 1);
                                    showToast(`✓ ${tLabel(area)}`, 'success');
                                  }}
                                  className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600"
                                >✓ {t('general.save')}</button>
                                <button
                                  onClick={() => {
                                    const orig = window._editOriginal;
                                    if (orig) {
                                      area.lat = orig.lat; area.lng = orig.lng; area.radius = orig.radius; area.safety = orig.safety; area.distanceMultiplier = orig.distanceMultiplier;
                                      if (area.isWholeCity) { city.center = { lat: orig.lat, lng: orig.lng }; city.allCityRadius = orig.radius; }
                                      else { const ac = window.BKK.areaCoordinates?.[area.id]; if (ac) { ac.lat = orig.lat; ac.lng = orig.lng; ac.radius = orig.radius; ac.safety = orig.safety; ac.distanceMultiplier = orig.distanceMultiplier; } }
                                    }
                                    try { if (window._editMap) { window._editMap.off(); window._editMap.remove(); } } catch(e) {}
                                    window._editMap = null;
                                    setEditingArea(null);
                                    setFormData(prev => ({...prev}));
                                  }}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300"
                                >✕ {t('general.cancel')}</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            </div>)}

            {/* ===== GENERAL SETTINGS TAB ===== */}
            {settingsTab === 'general' && (<div>

            {/* Language */}
            <div className="mb-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2">
                <h3 className="text-sm font-bold text-gray-800 mb-2">🌐 {t('settings.language')}</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Object.entries((window.BKK.i18n && window.BKK.i18n.languages) || {}).map(([langId, langInfo]) => (
                    <button
                      key={langId}
                      onClick={() => switchLanguage(langId)}
                      style={{
                        padding: '5px 14px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                        border: currentLang === langId ? '2px solid #3b82f6' : '1.5px solid #e5e7eb',
                        background: currentLang === langId ? '#eff6ff' : 'white',
                        color: currentLang === langId ? '#2563eb' : '#6b7280',
                        transition: 'all 0.2s'
                      }}
                    >{langInfo.flag} {langInfo.name}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Refresh Data Button */}
            <div className="mb-3">
              <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border-2 border-cyan-400 rounded-xl p-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">{`🔄 ${t("settings.refreshData")}`}</h3>
                <p className="text-xs text-gray-600 mb-2">
                  {t("settings.refreshDescription")}
                </p>
                <button
                  onClick={refreshAllData}
                  disabled={isRefreshing}
                  className={`w-full py-2 px-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${
                    isRefreshing 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-cyan-500 text-white hover:bg-cyan-600 active:bg-cyan-700'
                  }`}
                >
                  <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                  <span>{isRefreshing ? t('general.refreshing') : t('settings.refreshData')}</span>
                </button>
                <div className="mt-2 text-[10px] text-gray-500 flex flex-wrap gap-1">
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">{`📍 ${t("nav.myPlaces")}`}</span>
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">{`🏷️ ${t("general.interestsHeader")}`}</span>
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">{`💾 ${t("nav.saved")}`}</span>
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">{`⚙️ ${t("general.searchSettings")}`}</span>
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">{`👑 ${t("general.permissions")}`}</span>
                </div>
              </div>
            </div>
            
            {/* Debug Mode Toggle */}
            <div className="mb-4">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-400 rounded-xl p-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">{t("general.debugMode")}</h3>
                <p className="text-xs text-gray-600 mb-2">
                  Show activity log for debugging (console F12)
                </p>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debugMode}
                    onChange={(e) => setDebugMode(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-gray-400"
                  />
                  <span className="text-sm font-bold">
                    {debugMode ? t('toast.debugOn') : t('toast.debugOff')}
                  </span>
                </label>
                
                {debugMode && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Filter by category:</p>
                    <div className="flex flex-wrap gap-1">
                      {['all', 'api', 'firebase', 'sync', 'route', 'interest', 'location', 'migration'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => toggleDebugCategory(cat)}
                          className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                            debugCategories.includes(cat) || (cat !== 'all' && debugCategories.includes('all'))
                              ? 'bg-gray-700 text-white' 
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Import/Export Section */}
            
            {/* Admin Management - Password Based (Admin Only) */}
            {isCurrentUserAdmin && (
            <div className="mb-4">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-xl p-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">{t("general.adminManagement")}</h3>
                
                {/* Current Device Info */}
                <div className="text-xs bg-white rounded-lg p-2 border border-red-200 mb-3">
                  <strong>{t("general.currentDevice")}:</strong> {localStorage.getItem('bangkok_user_id')?.slice(-12) || 'N/A'}
                  <br />
                  <strong>{t("general.status")}:</strong> 
                  <span className="text-green-600 font-bold"> 🔓 {t("general.open")}</span>
                </div>
                
                {/* Password Section - Secure */}
                <div className="mb-3">
                  <label className="text-xs font-bold text-gray-700 block mb-1">🔑 {adminPassword ? t('settings.changePassword') : t('settings.setNewPassword')}</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder={adminPassword ? t('settings.newPasswordPlaceholder') : t('settings.setPassword')}
                      className="flex-1 p-2 border rounded text-sm"
                    />
                    <button
                      onClick={async () => {
                        if (isFirebaseAvailable && database) {
                          try {
                            if (newAdminPassword.trim()) {
                              const hashed = await window.BKK.hashPassword(newAdminPassword.trim());
                              await database.ref('settings/adminPassword').set(hashed);
                              setAdminPassword(hashed);
                              showToast(t('toast.passwordSaved'), 'success');
                            } else {
                              await database.ref('settings/adminPassword').set('');
                              setAdminPassword('');
                              showToast(t('toast.passwordRemoved'), 'warning');
                            }
                            setNewAdminPassword('');
                          } catch (err) {
                            showToast(t('toast.saveError'), 'error');
                          }
                        }
                      }}
                      className="px-3 py-2 bg-green-500 text-white rounded text-sm font-bold"
                    >
                      {t("general.save")}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {adminPassword ? t('settings.systemProtected') : t('settings.noPassword')}
                  </p>
                </div>
                
                {/* Admin Users List */}
                <div className="mb-3">
                  <label className="text-xs font-bold text-gray-700 block mb-1">{t("general.adminUsers")} ({adminUsers.length}):</label>
                  <div className="bg-white border rounded-lg max-h-32 overflow-y-auto">
                    {adminUsers.length === 0 ? (
                      <div className="p-2 text-xs text-gray-500 text-center">{t("general.noRegisteredUsers")}</div>
                    ) : (
                      adminUsers.map((user, idx) => (
                        <div key={user.userId} className="flex justify-between items-center p-2 border-b last:border-b-0 text-xs">
                          <div>
                            <span className="font-mono">{user.oderId?.slice(-12) || 'Unknown'}</span>
                            {user.oderId === localStorage.getItem('bangkok_user_id') && (
                              <span className="text-green-600 mr-1">({t("general.you")})</span>
                            )}
                            <br />
                            <span className="text-gray-500">{user.addedAt ? new Date(user.addedAt).toLocaleDateString('he-IL') : ''}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (isFirebaseAvailable && database) {
                                database.ref(`settings/adminUsers/${user.oderId}`).remove()
                                  .then(() => showToast(t('toast.userRemoved'), 'success'))
                                  .catch(() => showToast(t('general.error'), 'error'));
                              }
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded text-[10px]"
                          >
                            {t("general.remove")}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Access Stats Button */}
                <button
                  onClick={async () => {
                    try {
                      const db = (typeof window.firebase !== 'undefined' && window.firebase.apps?.length) ? window.firebase.database() : null;
                      if (!db) { showToast('No database', 'error'); return; }
                      const snap = await db.ref('accessStats').once('value');
                      const data = snap.val();
                      if (data) setAccessStats(data);
                      else showToast('No access stats yet', 'info');
                    } catch (e) { showToast('Error: ' + e.message, 'error'); }
                  }}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  📊 {t("settings.accessStats") || "Access Stats"}
                </button>
                
                {accessStats && (
                  <div className="bg-blue-50 rounded-lg p-3 mt-2 text-sm">
                    <div className="font-bold mb-2">📊 {t("settings.totalVisits") || "Total visits"}: {accessStats.total || 0}</div>
                    {accessStats.weekly && Object.entries(accessStats.weekly).sort((a,b) => b[0].localeCompare(a[0])).slice(0, 8).map(([week, countries]) => (
                      <div key={week} className="mb-1">
                        <span className="font-medium text-xs text-blue-700">{week}:</span>
                        <span className="text-xs mr-2">
                          {Object.entries(countries).filter(([c]) => c !== 'unknown' || countries[c] > 0).map(([cc, count]) => {
                            const flag = cc === 'IL' ? '🇮🇱' : cc === 'TH' ? '🇹🇭' : cc === 'US' ? '🇺🇸' : cc === 'unknown' ? '❓' : `${cc}`;
                            return `${flag}${count}`;
                          }).join(' ')}
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={() => setAccessStats(null)}
                      className="text-xs text-blue-500 underline mt-1"
                    >{t("general.close") || "Close"}</button>
                  </div>
                )}
                
                {/* Feedback Viewer Button */}
                <button
                  onClick={() => {
                    markFeedbackAsSeen();
                    setShowFeedbackList(true);
                  }}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-purple-600 flex items-center justify-center gap-2 mt-2"
                >
                  💬 Feedback ({feedbackList.length})
                  {hasNewFeedback && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">{t("general.new")}</span>}
                </button>
              </div>
            </div>
            )}
            
            <div className="mb-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-xl p-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">{t("general.importExport")}</h3>
                <p className="text-xs text-gray-600 mb-2">
                  Save and transfer data between devices
                </p>
                
                <div className="space-y-2">
                  {/* Export Button */}
                  <button
                    onClick={() => {
                      try {
                        const activeCount = Object.values(interestStatus).filter(Boolean).length;
                        
                        const data = {
                          customInterests: customInterests,
                          customLocations: customLocations,
                          savedRoutes: savedRoutes,
                          interestConfig: interestConfig,
                          interestStatus: interestStatus,
                          interestCounters: interestCounters,
                          systemParams: systemParams,
                          exportDate: new Date().toISOString(),
                          version: window.BKK.VERSION || '3.5'
                        };
                        
                        const dataStr = JSON.stringify(data, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        const dateStr = new Date().toISOString().split('T')[0];
                        link.download = `bangkok-data-${dateStr}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                        
                        showToast(`${t("toast.fileDownloaded")} (${customInterests.length} ${t("interests.customCount")}, ${activeCount} ${t("interests.activeCount")}, ${customLocations.length} ${t("route.places")}ת, ${savedRoutes.length} מסלולים)`, 'success');
                      } catch (error) {
                        console.error('[EXPORT] Error:', error);
                        showToast(t('toast.exportError'), 'error');
                      }
                    }}
                    className="w-full bg-blue-500 text-white py-2 px-3 rounded-lg font-bold hover:bg-blue-600 transition text-sm flex items-center justify-center gap-2"
                  >
                    <span>{t("general.exportAll")}</span>
                    <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">
                      {customInterests.length + customLocations.length + savedRoutes.length}
                    </span>
                  </button>
                  
                  {/* Import Button */}
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const data = JSON.parse(event.target.result);
                            
                            if (!data.customInterests && !data.customLocations && !data.savedRoutes) {
                              showToast(t('toast.invalidFileNoData'), 'error');
                              return;
                            }
                            
                            setImportedData(data);
                            setShowImportDialog(true);
                          } catch (error) {
                            console.error('[IMPORT] Error:', error);
                            showToast(t('toast.fileReadError'), 'error');
                          }
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }}
                      id="importData"
                      className="hidden"
                    />
                    <label
                      htmlFor="importData"
                      className="block w-full bg-green-500 text-white py-2 px-3 rounded-lg font-bold hover:bg-green-600 transition text-sm text-center cursor-pointer"
                    >
                      📥 Import from file
                    </label>
                  </div>
                  
                  {/* Info Box */}
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-2 text-[10px]">
                    <p className="text-blue-900 font-bold mb-1">{`💡 ${t('general.uses')}:`}</p>
                    <ul className="text-blue-800 space-y-0.5 mr-3">
                      <li>{t("general.transferDevices")}</li>
                      <li>{t("general.dataBackup")}</li>
                      <li>{t("general.shareWithFriends")}</li>
                    </ul>
                  </div>
                  
                  {/* Firebase Cleanup (Admin only) */}
                  {isUnlocked && (
                    <div className="mt-3 border-t border-red-200 pt-3">
                      <p className="text-xs font-bold text-red-700 mb-2">🔧 Firebase Admin Tools</p>
                      <div className="space-y-2">
                        <button
                          onClick={async () => {
                            if (!window.confirm('Clean up stale _verify nodes and check database sizes?')) return;
                            try {
                              showToast('🔧 Running cleanup...', 'info');
                              const result = await window.BKK.cleanupFirebase(database);
                              if (result) {
                                const msg = `Cleaned ${result.verifyRemoved} _verify nodes. ` + 
                                  (result.nodes || []).map(n => `${n.node}: ${n.count} entries (~${n.sizeKB}KB)`).join(', ');
                                showToast(`✅ ${msg}`, 'success', 'sticky');
                              }
                            } catch (e) {
                              showToast(`❌ Cleanup failed: ${e.message}`, 'error');
                            }
                          }}
                          className="w-full bg-red-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-red-600 transition"
                        >
                          🧹 Clean _verify nodes + check sizes
                        </button>
                        <button
                          onClick={() => {
                            if (!window.confirm('Mark migration as completed? Only use if data is already in per-city structure.')) return;
                            localStorage.setItem('locations_migrated_v2', 'true');
                            showToast('✅ Migration marked as completed', 'success');
                          }}
                          className="w-full bg-orange-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-orange-600 transition"
                        >
                          ✅ Mark migration done (skip re-run)
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Delete ALL old accessLog entries? (replaced by accessStats)')) return;
                            try {
                              await database.ref('accessLog').remove();
                              showToast('✅ Old accessLog deleted', 'success');
                            } catch (e) {
                              showToast(`❌ Failed: ${e.message}`, 'error');
                            }
                          }}
                          className="w-full bg-yellow-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-yellow-600 transition"
                        >
                          🗑️ Delete old accessLog data
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            </div>)}

            {/* ===== SYSTEM PARAMS TAB ===== */}
            {settingsTab === 'sysparams' && isUnlocked && (<div>
            {(() => {
              const sections = [
                { title: t('sysParams.sectionApp'), icon: '📱', color: '#3b82f6', params: [
                  { key: 'maxStops', label: t('sysParams.maxStops'), desc: t('sysParams.maxStopsDesc'), min: 3, max: 30, step: 1, type: 'int' },
                  { key: 'fetchMoreCount', label: t('sysParams.fetchMore'), desc: t('sysParams.fetchMoreDesc'), min: 1, max: 10, step: 1, type: 'int' },
                  { key: 'googleMaxWaypoints', label: t('sysParams.maxWaypoints'), desc: t('sysParams.maxWaypointsDesc'), min: 5, max: 25, step: 1, type: 'int' },
                  { key: 'defaultRadius', label: t('sysParams.defaultRadius'), desc: t('sysParams.defaultRadiusDesc'), min: 100, max: 5000, step: 100, type: 'int' },
                ]},
                { title: t('sysParams.sectionDedup'), icon: '🔍', color: '#8b5cf6', params: [
                  { key: 'dedupRadiusMeters', label: t('sysParams.dedupRadius'), desc: t('sysParams.dedupRadiusDesc'), min: 10, max: 200, step: 10, type: 'int' },
                  { key: 'dedupGoogleEnabled', label: t('sysParams.dedupGoogle'), desc: t('sysParams.dedupGoogleDesc'), min: 0, max: 1, step: 1, type: 'int' },
                  { key: 'dedupCustomEnabled', label: t('sysParams.dedupCustom'), desc: t('sysParams.dedupCustomDesc'), min: 0, max: 1, step: 1, type: 'int' },
                ]},
                { title: t('sysParams.sectionAlgo'), icon: '🧮', color: '#f59e0b', params: [
                  { key: 'trailTimeoutHours', label: t('sysParams.trailTimeout'), desc: t('sysParams.trailTimeoutDesc'), min: 1, max: 48, step: 1, type: 'int' },
                  { key: 'defaultInterestWeight', label: t('sysParams.defaultWeight'), desc: t('sysParams.defaultWeightDesc'), min: 1, max: 10, step: 1, type: 'int' },
                  { key: 'maxContentPasses', label: t('sysParams.maxPasses'), desc: t('sysParams.maxPassesDesc'), min: 1, max: 20, step: 1, type: 'int' },
                  { key: 'timeScoreMatch', label: t('sysParams.timeMatch'), desc: t('sysParams.timeMatchDesc'), min: 0, max: 10, step: 1, type: 'int' },
                  { key: 'timeScoreAnytime', label: t('sysParams.timeAnytime'), desc: t('sysParams.timeAnytimeDesc'), min: 0, max: 10, step: 1, type: 'int' },
                  { key: 'timeScoreConflict', label: t('sysParams.timeConflict'), desc: t('sysParams.timeConflictDesc'), min: 0, max: 10, step: 1, type: 'int' },
                  { key: 'timeConflictPenalty', label: t('sysParams.timePenalty'), desc: t('sysParams.timePenaltyDesc'), min: 0, max: 20, step: 1, type: 'int' },
                  { key: 'slotEarlyThreshold', label: t('sysParams.earlyThreshold'), desc: t('sysParams.earlyThresholdDesc'), min: 0.1, max: 0.9, step: 0.05, type: 'float' },
                  { key: 'slotLateThreshold', label: t('sysParams.lateThreshold'), desc: t('sysParams.lateThresholdDesc'), min: 0.1, max: 0.9, step: 0.05, type: 'float' },
                  { key: 'slotEndThreshold', label: t('sysParams.endThreshold'), desc: t('sysParams.endThresholdDesc'), min: 0.1, max: 0.9, step: 0.05, type: 'float' },
                  { key: 'slotPenaltyMultiplier', label: t('sysParams.slotPenalty'), desc: t('sysParams.slotPenaltyDesc'), min: 1, max: 20, step: 1, type: 'int' },
                  { key: 'slotEndPenaltyMultiplier', label: t('sysParams.endPenalty'), desc: t('sysParams.endPenaltyDesc'), min: 1, max: 20, step: 1, type: 'int' },
                  { key: 'gapPenaltyMultiplier', label: t('sysParams.gapPenalty'), desc: t('sysParams.gapPenaltyDesc'), min: 1, max: 20, step: 1, type: 'int' },
                ]},
              ];
              const updateParam = (key, val, type) => {
                const parsed = type === 'float' ? parseFloat(val) : parseInt(val);
                if (isNaN(parsed)) return;
                const updated = { ...systemParams, [key]: parsed };
                window.BKK.systemParams = updated;
                setSystemParams(updated);
                if (isFirebaseAvailable && database) {
                  database.ref(`settings/systemParams/${key}`).set(parsed);
                }
                if (key === 'maxStops') setFormData(prev => ({...prev, maxStops: parsed}));
                if (key === 'fetchMoreCount') setFormData(prev => ({...prev, fetchMoreCount: parsed}));
                if (key === 'googleMaxWaypoints') setGoogleMaxWaypoints(parsed);
                if (key === 'defaultRadius') window.BKK._defaultRadius = parsed;
              };
              const resetAll = () => {
                const defaults = { ...window.BKK._defaultSystemParams };
                window.BKK.systemParams = defaults;
                setSystemParams(defaults);
                setFormData(prev => ({...prev, maxStops: defaults.maxStops, fetchMoreCount: defaults.fetchMoreCount}));
                setGoogleMaxWaypoints(defaults.googleMaxWaypoints);
                window.BKK._defaultRadius = defaults.defaultRadius;
                if (isFirebaseAvailable && database) {
                  database.ref('settings/systemParams').set(defaults);
                }
                showToast(t('sysParams.resetDone'), 'success');
              };
              const renderRow = (p) => {
                const def = window.BKK._defaultSystemParams[p.key];
                const isDefault = systemParams[p.key] === def;
                const isToggle = p.min === 0 && p.max === 1 && p.step === 1;
                return (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: isDefault ? '#f9fafb' : '#fffbeb', borderRadius: '8px', border: '1px solid #e5e7eb', borderLeft: isDefault ? '1px solid #e5e7eb' : '4px solid #f59e0b' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>{p.label}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{p.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isToggle ? (
                      <button onClick={() => updateParam(p.key, systemParams[p.key] ? 0 : 1, 'int')}
                        style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer',
                          background: systemParams[p.key] ? '#22c55e' : '#ef4444', color: 'white' }}>
                        {systemParams[p.key] ? '✓ ON' : '✗ OFF'}
                      </button>
                    ) : (() => {
                      const step = p.step || 1;
                      const val = systemParams[p.key];
                      const isEditing = editingParamKey === p.key;
                      return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => {
                                const parsed = p.type === 'float' ? parseFloat(editingParamVal) : parseInt(editingParamVal);
                                if (!isNaN(parsed)) updateParam(p.key, Math.max(p.min, Math.min(p.max, parsed)), p.type);
                                setEditingParamKey(null);
                              }}
                              style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#22c55e', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                            <input type="text" inputMode="decimal" autoFocus
                              value={editingParamVal}
                              onChange={(e) => setEditingParamVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const parsed = p.type === 'float' ? parseFloat(editingParamVal) : parseInt(editingParamVal);
                                  if (!isNaN(parsed)) updateParam(p.key, Math.max(p.min, Math.min(p.max, parsed)), p.type);
                                  setEditingParamKey(null);
                                } else if (e.key === 'Escape') { setEditingParamKey(null); }
                              }}
                              style={{ width: '55px', padding: '4px', fontSize: '15px', fontWeight: 'bold', border: '2px solid #3b82f6', borderRadius: '8px', textAlign: 'center', outline: 'none' }}
                            />
                            <button onClick={() => setEditingParamKey(null)}
                              style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✗</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => updateParam(p.key, Math.max(p.min, val - step), p.type)}
                              style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: val <= p.min ? '#e5e7eb' : '#3b82f6', color: val <= p.min ? '#9ca3af' : 'white', fontSize: '16px', fontWeight: 'bold', cursor: val <= p.min ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              disabled={val <= p.min}>−</button>
                            <span onClick={() => { setEditingParamKey(p.key); setEditingParamVal(p.type === 'float' ? val.toFixed(1) : String(val)); }}
                              style={{ minWidth: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#374151', cursor: 'pointer', padding: '2px 4px', borderRadius: '6px', border: '1px dashed #d1d5db' }}>{p.type === 'float' ? val.toFixed(1) : val}</span>
                            <button onClick={() => updateParam(p.key, Math.min(p.max, val + step), p.type)}
                              style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: val >= p.max ? '#e5e7eb' : '#3b82f6', color: val >= p.max ? '#9ca3af' : 'white', fontSize: '16px', fontWeight: 'bold', cursor: val >= p.max ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              disabled={val >= p.max}>+</button>
                          </>
                        )}
                      </div>
                      );
                    })()}
                    {!isDefault && (
                      <button onClick={() => updateParam(p.key, def, p.type)} title={`Default: ${def}`}
                        style={{ padding: '3px 6px', fontSize: '9px', fontWeight: 'bold', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ↩ {def}
                      </button>
                    )}
                  </div>
                </div>
                );
              };
              return (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-500">{t('sysParams.subtitle')}</p>
                {sections.map(sec => (
                  <details key={sec.title} open>
                    <summary style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', color: 'white', background: sec.color }}>
                      {sec.icon} {sec.title}
                    </summary>
                    <div className="space-y-2 mt-2">
                      {sec.params.map(p => renderRow(p))}
                    </div>
                  </details>
                ))}
                <button onClick={resetAll}
                  className="w-full py-1.5 bg-gray-500 text-white rounded-lg text-xs font-bold hover:bg-gray-600">
                  🔄 {t('sysParams.resetAll')}
                </button>
              </div>
              );
            })()}
            </div>)}
            
          </div>
        )}

        {/* Footer — minimal during active trail */}
        {activeTrail ? (
          <div className="text-center py-2 mt-2">
            <span style={{ fontSize: '9px', color: '#d1d5db' }}>🐾 FouFou v{window.BKK.VERSION}</span>
          </div>
        ) : (
        <div className="text-center py-3 mt-4 border-t border-gray-200">
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
            FouFou — City Trail Generator 🍜🏛️🎭
          </div>
          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '6px' }}>
            Local picks + Google spots. Choose your vibe, follow the trail
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const shareData = { title: 'FouFou', text: t('settings.appDescription'), url: window.location.href };
                if (navigator.share) { navigator.share(shareData).catch(() => {}); }
                else { try { navigator.clipboard.writeText(window.location.href); showToast(t('route.linkCopied'), 'success'); } catch(e) { showToast(window.location.href, 'info'); } }
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: '#9ca3af' }}
            >{`📤 ${t("general.share")}`}</button>
            <span style={{ color: '#d1d5db', fontSize: '9px' }}>·</span>
            <span 
              style={{ fontSize: '9px', color: '#9ca3af', cursor: 'default', userSelect: 'none' }}
              onTouchStart={(e) => { e.currentTarget._lp = setTimeout(() => { if (isUnlocked) { setCurrentView('settings'); } else { setShowVersionPasswordDialog(true); } }, 2000); }}
              onTouchEnd={(e) => { clearTimeout(e.currentTarget._lp); }}
              onMouseDown={(e) => { e.currentTarget._lp = setTimeout(() => { if (isUnlocked) { setCurrentView('settings'); } else { setShowVersionPasswordDialog(true); } }, 2000); }}
              onMouseUp={(e) => { clearTimeout(e.currentTarget._lp); }}
              onMouseLeave={(e) => { clearTimeout(e.currentTarget._lp); }}
            >v{window.BKK.VERSION}</span>
            <span style={{ color: '#d1d5db', fontSize: '9px' }}>·</span>
            <span style={{ fontSize: '9px', color: '#9ca3af' }}>© Eitan Fisher</span>
            <span style={{ color: '#d1d5db', fontSize: '9px' }}>·</span>
            <button onClick={() => { if (window.confirm(t('general.confirmRefresh'))) applyUpdate(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: '#9ca3af' }}>{`🔄 ${t("general.refresh")}`}</button>
          </div>
        </div>
        )}

      {/* Leaflet Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: mapMode === 'stops' ? '0' : '12px' }}>
          <div className="bg-white shadow-2xl w-full" style={{ 
            maxWidth: mapMode === 'stops' ? '100%' : '42rem',
            maxHeight: mapMode === 'stops' ? '100%' : '90vh',
            height: mapMode === 'stops' ? '100%' : 'auto',
            borderRadius: mapMode === 'stops' ? '0' : '12px',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >✕</button>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">
                  {mapMode === 'areas' ? t('wizard.allAreasMap') : mapMode === 'stops' ? `${t('route.showStopsOnMap')} (${mapStops.length})` : t('form.searchRadius')}
                </h3>
              </div>
              {mapMode !== 'stops' && (
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setMapMode('areas')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mapMode === 'areas' ? 'bg-blue-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >{t("general.areas")}</button>
                <button
                  onClick={() => {
                    if (!formData.currentLat) {
                      showToast(t('form.useGpsForRadius'), 'warning');
                      return;
                    }
                    setMapMode('radius');
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mapMode === 'radius' ? 'bg-rose-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'
                  } ${!formData.currentLat ? 'opacity-30' : ''}`}
                  title={!formData.currentLat ? t('form.needGpsFirst') : t('form.showSearchRadius')}
                >{`📍 ${t("form.radiusMode")}`}</button>
              </div>
              )}
            </div>
            <div id="leaflet-map-container" style={{ flex: 1, minHeight: mapMode === 'stops' ? '0' : '350px', maxHeight: mapMode === 'stops' ? 'none' : '70vh' }}></div>
            {/* Footer */}
            <div className="border-t" style={{ background: mapMode === 'stops' ? '#f8fafc' : 'white' }}>
              {mapMode === 'stops' ? (
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Row 1: Route type toggle — auto-recomputes */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                      <button 
                        onClick={() => {
                          setRouteType('linear');
                          routeTypeRef.current = 'linear'; // Update ref immediately
                          const result = recomputeForMap(null, 'linear', true);
                          if (result && window._mapStopsOrderRef) {
                            window._mapStopsOrderRef.current = result.optimized;
                          }
                          setTimeout(() => { if (window._mapRedrawLine) window._mapRedrawLine(); }, 100);
                        }}
                        style={{ padding: '8px 16px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          background: routeType === 'linear' ? '#3b82f6' : 'white', color: routeType === 'linear' ? 'white' : '#6b7280'
                        }}
                      >↔ {t('route.linear')}</button>
                      <button 
                        onClick={() => {
                          setRouteType('circular');
                          routeTypeRef.current = 'circular'; // Update ref immediately
                          const result = recomputeForMap(null, 'circular', true);
                          if (result && window._mapStopsOrderRef) {
                            window._mapStopsOrderRef.current = result.optimized;
                          }
                          setTimeout(() => { if (window._mapRedrawLine) window._mapRedrawLine(); }, 100);
                        }}
                        style={{ padding: '8px 16px', border: 'none', borderLeft: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          background: routeType === 'circular' ? '#3b82f6' : 'white', color: routeType === 'circular' ? 'white' : '#6b7280'
                        }}
                      >⭕ {t('route.circular')}</button>
                    </div>
                  </div>
                  {/* Hint + Close */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: '9px', color: '#9ca3af', textAlign: 'center' }}>{t('route.tapStopForStart')}</span>
                    <button
                      onClick={() => setShowMapModal(false)}
                      style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: '#374151', color: 'white', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >{t('general.close')}</button>
                  </div>
                </div>
              ) : (
              <p className="text-[9px] text-gray-400 p-2 text-center">
                {mapMode === 'areas' 
                  ? `${(window.BKK.areaOptions || []).length} ${t('general.areas')}` 
                  : `${formData.radiusMeters}m - ${formData.radiusPlaceName || t('form.currentLocation')}`
                }
              </p>
              )}
            </div>
          </div>
        </div>
      )}

        {/* === DIALOGS (from dialogs.js) === */}


        {/* Add/Edit Location Dialog - REDESIGNED */}
        {(showAddLocationDialog || showEditLocationDialog) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl">
              
              {/* Header - Compact */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">
                    {showEditLocationDialog ? t('places.editPlace') : t('places.addPlace')}
                  </h3>
                  <button
                    onClick={() => showHelpFor('addLocation')}
                    className="bg-white text-purple-600 hover:bg-purple-100 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                    title={t("general.help")}
                  >
                    ?
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowAddLocationDialog(false);
                    setShowEditLocationDialog(false);
                    setEditingLocation(null);
                    setNewLocation({ 
                      name: '', description: '', notes: '', area: formData.area, interests: [], 
                      lat: null, lng: null, mapsUrl: '', address: '', uploadedImage: null, imageUrls: []
                    });
                  }}
                  className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              {/* Content - Scrollable - COMPACT */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                <div style={{ position: 'relative' }}>
                {showEditLocationDialog && editingLocation?.locked && !isUnlocked && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.3)', pointerEvents: 'all' }} 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.activeElement?.blur(); }}
                    onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); document.activeElement?.blur(); }}
                  />
                )}
                
                {/* Row 1: Name + Area */}
                <div className="space-y-2">
                  {/* Name - full width, buttons below */}
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {t("places.placeName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLocation.name}
                      readOnly={showEditLocationDialog && editingLocation?.locked && !isUnlocked}
                      onFocus={(e) => { if (showEditLocationDialog && editingLocation?.locked && !isUnlocked) e.target.blur(); }}
                      onChange={(e) => {
                        setNewLocation({...newLocation, name: e.target.value});
                        setLocationSearchResults(null);
                        if (e.target.value.trim()) {
                          const exists = customLocations.find(loc => 
                            loc.name.toLowerCase() === e.target.value.trim().toLowerCase() &&
                            (!editingLocation || loc.id !== editingLocation.id)
                          );
                          if (exists) showToast(t('places.nameExists'), 'warning');
                        }
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && newLocation.name?.trim()) { e.preventDefault(); searchPlacesByName(newLocation.name); } }}
                      placeholder={t("places.placeName")}
                      className="w-full p-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500"
                      style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                      autoFocus={!showEditLocationDialog}
                    />
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <button
                        onClick={() => searchPlacesByName(newLocation.name)}
                        disabled={!newLocation.name?.trim()}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${newLocation.name?.trim() ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >🔍 {t("form.searchPlaceGoogle")}</button>
                      <button
                        onClick={() => {
                          const interestId = (newLocation.interests || [])[0];
                          if (!interestId) {
                            showToast(t('form.selectAtLeastOneInterest'), 'warning');
                            return;
                          }
                          const result = window.BKK.generateLocationName(
                            interestId, newLocation.lat, newLocation.lng,
                            interestCounters, allInterestOptions, areaOptions
                          );
                          if (result.name) {
                            setNewLocation({...newLocation, name: result.name});
                            showToast(`🏷️ ${result.name}`, 'success');
                          }
                        }}
                        disabled={!(newLocation.interests || []).length}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${(newLocation.interests || []).length ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >🏷️ {t("places.autoName")}</button>
                    </div>
                    {/* Search Results Dropdown */}
                    {locationSearchResults !== null && (
                      <div style={{ marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', background: 'white' }}>
                        {locationSearchResults.length === 0 ? (
                          <p style={{ textAlign: 'center', padding: '8px', color: '#9ca3af', fontSize: '11px' }}>{t("general.searching")}...</p>
                        ) : locationSearchResults.map((result, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const detected = window.BKK.getAreasForCoordinates(result.lat, result.lng);
                              const areaUpdates = detected.length > 0 ? { areas: detected, area: detected[0] } : {};
                              setNewLocation({
                                ...newLocation,
                                name: result.name,
                                lat: result.lat, lng: result.lng,
                                address: result.address,
                                mapsUrl: `https://maps.google.com/?q=${result.lat},${result.lng}`,
                                googlePlaceId: result.googlePlaceId,
                                ...areaUpdates
                              });
                              setLocationSearchResults(null);
                              showToast(`✅ ${result.name} ${t("toast.selectedPlace")}${detected.length > 0 ? ` (${detected.length} ${t("toast.detectedAreas")})` : ''}`, 'success');
                            }}
                            style={{ width: '100%', textAlign: window.BKK.i18n.isRTL() ? 'right' : 'left', padding: '6px 10px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: 'none', border: 'none', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                            onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.target.style.background = 'none'}
                          >
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937' }}>{result.name}</div>
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>{result.address}{result.rating ? ` ⭐ ${result.rating}` : ''}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Areas - full width multi-select */}
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("general.areas")}</label>
                    <div className="grid grid-cols-6 gap-1 p-1.5 bg-gray-50 rounded-lg overflow-y-auto border-2 border-gray-300" style={{ maxHeight: '120px' }}>
                      {areaOptions.map(area => {
                        const isSelected = (newLocation.areas || [newLocation.area]).includes(area.id);
                        return (
                          <button
                            key={area.id}
                            onClick={() => {
                              const current = newLocation.areas || (newLocation.area ? [newLocation.area] : []);
                              const updated = current.includes(area.id)
                                ? current.filter(a => a !== area.id)
                                : [...current, area.id];
                              if (updated.length === 0) return;
                              setNewLocation({...newLocation, areas: updated, area: updated[0]});
                            }}
                            className={`p-1 rounded text-[8px] font-bold transition-all text-center ${
                              isSelected
                                ? 'bg-purple-500 text-white shadow-md'
                                : 'bg-white text-gray-500 hover:bg-gray-100'
                            }`}
                            style={{ lineHeight: '1.1' }}
                          >
                            <div>{tLabel(area)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Interests - Compact Grid */}
                <div>
                  <label className="block text-xs font-bold mb-1">{t("general.interestsHeader")}</label>
                  <div className="grid grid-cols-6 gap-1.5 p-2 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                    {allInterestOptions.filter(option => interestStatus[option.id] !== false || (newLocation.interests || []).includes(option.id)).map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          const current = newLocation.interests || [];
                          const isAdding = !current.includes(option.id);
                          const updatedInterests = isAdding
                            ? [...current, option.id]
                            : current.filter(i => i !== option.id);
                          
                          const updates = { ...newLocation, interests: updatedInterests };
                          
                          if (isAdding && !newLocation.name.trim()) {
                            const lat = newLocation.lat;
                            const lng = newLocation.lng;
                            const result = window.BKK.generateLocationName(
                              option.id, lat, lng,
                              interestCounters, allInterestOptions, areaOptions
                            );
                            if (result.name) {
                              updates.name = result.name;
                              if (lat && lng && (!newLocation.areas || newLocation.areas.length === 0 || (newLocation.areas.length === 1 && newLocation.areas[0] === formData.area))) {
                                const detected = window.BKK.getAreasForCoordinates(lat, lng);
                                if (detected.length > 0) {
                                  updates.areas = detected;
                                  updates.area = detected[0];
                                }
                              }
                            }
                          }
                          
                          setNewLocation(updates);
                        }}
                        className={`p-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          (newLocation.interests || []).includes(option.id)
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-white border border-gray-300 hover:border-purple-300'
                        }`}
                        title={tLabel(option)}
                      >
                        <span className="text-lg block">{option.icon?.startsWith?.('data:') ? <img src={option.icon} alt="" className="w-5 h-5 object-contain mx-auto" /> : option.icon}</span>
                        <span className="text-[7px] block truncate leading-tight mt-0.5">{tLabel(option)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image - with Camera & EXIF GPS */}
                <div>
                  <label className="block text-xs font-bold mb-1">{`📷 ${t("general.image")}`}</label>
                  {newLocation.uploadedImage ? (
                    <div className="relative">
                      <img 
                        src={newLocation.uploadedImage} 
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-purple-300 cursor-pointer hover:opacity-90"
                        onClick={() => {
                          setModalImage(newLocation.uploadedImage);
                          setShowImageModal(true);
                        }}
                      />
                      {!(showEditLocationDialog && editingLocation?.locked && !isUnlocked) && (
                      <button
                        onClick={() => setNewLocation({...newLocation, uploadedImage: null})}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold hover:bg-red-600"
                      >
                        ✕
                      </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {/* Camera button */}
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await window.BKK.openCamera();
                          if (!result) return;
                          const compressed = await window.BKK.compressImage(result.dataUrl);
                          setNewLocation(prev => ({...prev, uploadedImage: compressed}));
                          const locName = newLocation.label?.en || newLocation.label?.he || 'photo';
                          const safeName = locName.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_').slice(0, 30);
                          window.BKK.saveImageToDevice(result.dataUrl, `foufou_${safeName}_${Date.now()}.jpg`);
                          const gps = await window.BKK.extractGpsFromImage(result.file);
                          if (gps && (!newLocation.lat || !newLocation.lng)) {
                            const updates = { uploadedImage: compressed, lat: gps.lat, lng: gps.lng };
                            const detected = window.BKK.getAreasForCoordinates(gps.lat, gps.lng);
                            if (detected.length > 0) {
                              updates.areas = detected;
                              updates.area = detected[0];
                            }
                            setNewLocation(prev => ({...prev, ...updates}));
                            showToast('📍 ' + t('general.gpsExtracted'), 'success');
                          }
                        }}
                        className="flex-1 p-3 border-2 border-dashed border-green-400 rounded-lg text-center cursor-pointer hover:bg-green-50"
                      >
                        <span className="text-2xl">📸</span>
                        <div className="text-xs text-green-700 mt-1 font-bold">{t('general.takePhoto')}</div>
                      </button>
                      {/* Gallery upload */}
                      <label className="flex-1 p-3 border-2 border-dashed border-purple-300 rounded-lg text-center cursor-pointer hover:bg-purple-50 block">
                        <span className="text-2xl">🖼️</span>
                        <div className="text-xs text-gray-600 mt-1">{t("general.clickToUpload")}</div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const compressed = await window.BKK.compressImage(reader.result);
                              setNewLocation(prev => ({...prev, uploadedImage: compressed}));
                              const gps = await window.BKK.extractGpsFromImage(file);
                              if (gps && (!newLocation.lat || !newLocation.lng)) {
                                const updates = { uploadedImage: compressed, lat: gps.lat, lng: gps.lng };
                                const detected = window.BKK.getAreasForCoordinates(gps.lat, gps.lng);
                                if (detected.length > 0) {
                                  updates.areas = detected;
                                  updates.area = detected[0];
                                }
                                setNewLocation(prev => ({...prev, ...updates}));
                                showToast('📍 ' + t('general.gpsExtracted'), 'success');
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Description + Notes */}
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-xs font-bold mb-1">{`📝 ${t("places.description")}`}</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newLocation.description || ''}
                        onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                        placeholder={t("places.description")}
                        className="flex-1 p-2 text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500"
                        style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                      />
                      {window.BKK.speechSupported && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isRecording) {
                              if (stopRecordingRef.current) stopRecordingRef.current();
                              stopRecordingRef.current = null;
                              setIsRecording(false);
                            } else {
                              setIsRecording(true);
                              const stop = window.BKK.startSpeechToText({
                                maxDuration: 10000,
                                onResult: (text) => {
                                  setNewLocation(prev => ({...prev, description: text}));
                                },
                                onEnd: () => { setIsRecording(false); stopRecordingRef.current = null; },
                                onError: (error) => {
                                  setIsRecording(false); stopRecordingRef.current = null;
                                  if (error === 'not-allowed') showToast('🎤 ' + t('speech.micPermissionDenied'), 'error');
                                }
                              });
                              stopRecordingRef.current = stop;
                            }
                          }}
                          style={{
                            width: '34px', height: '34px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                            background: isRecording ? '#ef4444' : '#f3f4f6', color: isRecording ? 'white' : '#6b7280',
                            fontSize: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: isRecording ? 'pulse 1s ease-in-out infinite' : 'none',
                            boxShadow: isRecording ? '0 0 0 3px rgba(239,68,68,0.3)' : 'none'
                          }}
                          title={isRecording ? t('speech.stopRecording') : t('speech.startRecording')}
                        >
                          {isRecording ? '⏹️' : '🎤'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{`💭 ${t("places.notes")}`}</label>
                    <textarea
                      value={newLocation.notes || ''}
                      onChange={(e) => setNewLocation({...newLocation, notes: e.target.value})}
                      placeholder={t("places.notes")}
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:border-purple-500"
                      style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr', minHeight: '50px' }}
                      rows="2"
                    />
                  </div>
                </div>

                {/* Address + Coordinates + GPS */}
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-2">
                  <div className="mb-1.5">
                    <label className="block text-xs font-bold mb-1">{`🏠 ${t("places.address")}`}</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newLocation.address || ''}
                        onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                        placeholder={t("places.address")}
                        className="flex-1 p-1.5 text-xs border border-gray-300 rounded-lg focus:border-purple-500"
                        style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                      />
                      <button
                        onClick={() => geocodeAddress(newLocation.address || newLocation.name)}
                        disabled={!newLocation.address?.trim() && !newLocation.name?.trim()}
                        style={{
                          padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: (newLocation.address?.trim() || newLocation.name?.trim()) ? 'pointer' : 'not-allowed',
                          background: (newLocation.address?.trim() || newLocation.name?.trim()) ? '#8b5cf6' : '#d1d5db', color: 'white', fontSize: '14px', flexShrink: 0
                        }}
                        title={t("form.searchByAddress")}
                      >🏠</button>
                    </div>
                  </div>
                  
                  <label className="block text-xs font-bold mb-1">{`📍 ${t("general.coordinates")}`}</label>
                  
                  {/* Lat/Lng Inputs with GPS button */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', width: '100%' }}>
                    <input
                      type="number"
                      step="0.000001"
                      value={newLocation.lng || ''}
                      onChange={(e) => setNewLocation({...newLocation, lng: parseFloat(e.target.value) || null})}
                      placeholder="Lng"
                      className="p-1.5 text-xs border border-gray-300 rounded-lg"
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0 }}>⇄</span>
                    <input
                      type="number"
                      step="0.000001"
                      value={newLocation.lat || ''}
                      onChange={(e) => setNewLocation({...newLocation, lat: parseFloat(e.target.value) || null})}
                      placeholder="Lat"
                      className="p-1.5 text-xs border border-gray-300 rounded-lg"
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <button
                      onClick={getCurrentLocation}
                      style={{
                        padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        background: '#22c55e', color: 'white', fontSize: '14px', flexShrink: 0
                      }}
                      title={t("form.gps")}
                    >📍</button>
                  </div>
                </div>

                {/* Google + Lock + Actions — compact */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1.5" style={{ position: 'relative', zIndex: 15 }}>
                  {/* Row 1: Open in Google + Google Info + Lock toggle */}
                  <div className="flex gap-1.5 items-center">
                    {newLocation.lat && newLocation.lng ? (
                      <a
                        href={window.BKK.getGoogleMapsUrl(newLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 text-center"
                      >
                        🗺️ {t("general.openInGoogle")}
                      </a>
                    ) : (
                      <button disabled className="flex-1 py-1.5 bg-gray-300 text-gray-500 rounded-lg text-xs font-bold cursor-not-allowed">
                        🗺️ {t("general.openInGoogleNoCoords")}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setGooglePlaceInfo(null);
                        fetchGooglePlaceInfo(newLocation);
                      }}
                      disabled={!newLocation.name?.trim() || loadingGoogleInfo}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        newLocation.name?.trim() && !loadingGoogleInfo
                          ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      🔍 {loadingGoogleInfo ? '...' : t('places.googleInfo')}
                    </button>
                    {isUnlocked && (
                      <button type="button"
                        onClick={() => setNewLocation({...newLocation, locked: !newLocation.locked})}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${newLocation.locked ? 'border-gray-600 bg-gray-600 text-white' : 'border-gray-300 bg-white text-gray-400'}`}
                      >
                        {newLocation.locked ? '🔒' : '🔓'}
                      </button>
                    )}
                  </div>
                  
                  {/* Google Place Info Results */}
                  {googlePlaceInfo && !googlePlaceInfo.notFound && (
                    <div className="text-xs space-y-1 bg-white rounded p-2 border border-indigo-200" style={{ direction: 'ltr' }}>
                      <div>
                        <span className="font-bold text-indigo-700">Found:</span>
                        <span className="ml-1">{googlePlaceInfo.name}</span>
                      </div>
                      <div>
                        <span className="font-bold text-indigo-700">Primary Type:</span>
                        <span className="ml-1 bg-indigo-200 px-2 py-0.5 rounded">
                          {googlePlaceInfo.primaryTypeDisplayName || googlePlaceInfo.primaryType || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-indigo-700">All Types:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {googlePlaceInfo.types.map((type, idx) => (
                            <span key={idx} className="bg-gray-200 px-2 py-0.5 rounded text-[10px]">{type}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-indigo-700">Rating:</span>
                        <span className="ml-1">⭐ {googlePlaceInfo.rating?.toFixed(1) || 'N/A'} ({googlePlaceInfo.ratingCount || 0})</span>
                      </div>
                    </div>
                  )}
                  
                  {googlePlaceInfo && googlePlaceInfo.notFound && (
                    <div className="text-xs text-red-600 bg-white rounded p-2 border border-red-200">
                      ❌ Place not found on Google for: "{googlePlaceInfo.searchQuery}"
                    </div>
                  )}

                  {/* Row 2: Skip + Delete (edit mode only) */}
                  {showEditLocationDialog && editingLocation && !(editingLocation.locked && !isUnlocked) && (
                    <div className="flex gap-1.5 pt-1 border-t border-gray-200">
                      {editingLocation.status === 'blacklist' ? (
                        <button
                          onClick={() => {
                            toggleLocationStatus(editingLocation.id);
                            setShowEditLocationDialog(false);
                            setEditingLocation(null);
                          }}
                          className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600"
                        >
                          ✅ {t("general.restoreActive")}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            toggleLocationStatus(editingLocation.id);
                            setShowEditLocationDialog(false);
                            setEditingLocation(null);
                          }}
                          className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600"
                        >
                          🚫 {t('route.skipPermanently')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          showConfirm(`${t("general.deletePlace")} "${editingLocation.name}"?`, () => {
                            deleteCustomLocation(editingLocation.id);
                            setShowEditLocationDialog(false);
                            setEditingLocation(null);
                          });
                        }}
                        className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                      >
                        🗑️ {t("general.deletePlace")}
                      </button>
                    </div>
                  )}
                </div>

                </div>{/* close inner wrapper */}

              </div>
              
              {/* Footer */}
              {(() => {
                const isLockedPlace = showEditLocationDialog && editingLocation?.locked && !isUnlocked;
                return (
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
                {isLockedPlace ? (
                  <>
                    <div className="flex-1 py-2.5 px-3 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1">
                      🔒 {t("general.readOnly")}
                    </div>
                  </>
                ) : (
                <button
                  onClick={() => {
                    if (!newLocation.name || !newLocation.name.trim()) {
                      showToast(t('places.enterPlaceName'), 'warning');
                      return;
                    }
                    if (!newLocation.interests || newLocation.interests.length === 0) {
                      showToast(t('form.selectAtLeastOneInterest'), 'warning');
                      return;
                    }
                    const exists = customLocations.find(loc => 
                      loc.name.toLowerCase() === newLocation.name.trim().toLowerCase() &&
                      (!editingLocation || loc.id !== editingLocation.id)
                    );
                    if (exists) {
                      showToast(`⚠️ ${t('places.placeExists')}`, 'warning');
                    }
                    if (showEditLocationDialog) {
                      updateCustomLocation(false);
                    } else {
                      saveWithDedupCheck(false);
                    }
                  }}
                  disabled={!newLocation.name?.trim()}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    newLocation.name?.trim()
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {showEditLocationDialog ? t('general.update') : t('general.add')}
                </button>
                )}
                <button
                  onClick={() => {
                    setShowAddLocationDialog(false);
                    setShowEditLocationDialog(false);
                    setEditingLocation(null);
                    setNewLocation({ 
                      name: '', description: '', notes: '', area: formData.area, areas: [formData.area], interests: [], 
                      lat: null, lng: null, mapsUrl: '', address: '', uploadedImage: null, imageUrls: []
                    });
                  }}
                  className="px-5 py-2.5 rounded-lg bg-gray-400 text-white text-sm font-bold hover:bg-gray-500"
                >
                  {`✕ ${t("general.close")}`}
                </button>
              </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* Unified Interest Dialog - Add / Edit / Config */}
        {showAddInterestDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">{editingCustomInterest ? `${newInterest.icon?.startsWith?.('data:') ? '' : newInterest.icon} ${newInterest.label}` : t('interests.addInterest')}</h3>
                  {editingCustomInterest && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${newInterest.builtIn ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}`}>
                      {newInterest.builtIn ? t('general.system') : t('general.private')}
                    </span>
                  )}
                  {!editingCustomInterest && (
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">{t("general.private")}</span>
                  )}
                  <button
                    onClick={() => showHelpFor('addInterest')}
                    className="bg-white text-purple-600 hover:bg-purple-100 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                    title={t("general.help")}
                  >?</button>
                </div>
                <button
                  onClick={() => {
                    setShowAddInterestDialog(false);
                    setNewInterest({ label: '', labelEn: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, locked: false, scope: 'global', category: 'attraction', weight: 3, minStops: 1, maxStops: 10, routeSlot: 'any', minGap: 1, bestTime: 'anytime', dedupRelated: [] });
                    setEditingCustomInterest(null);
                  }}
                  className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
                >✕</button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <div style={{ position: 'relative' }}>
                {editingCustomInterest?.locked && !isUnlocked && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                )}
                {/* Name + Icon row */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <label className="block text-xs font-bold mb-1">{t("interests.interestName")} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newInterest.label}
                      onChange={(e) => setNewInterest({...newInterest, label: e.target.value})}
                      placeholder={t("interests.exampleTypes")}
                      className="w-full p-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500"
                      style={{ direction: 'rtl' }}
                      disabled={newInterest.builtIn && !isUnlocked}
                      autoFocus={!newInterest.builtIn}
                    />
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">🇬🇧</span>
                      <input
                        type="text"
                        value={newInterest.labelEn || ''}
                        onChange={(e) => setNewInterest({...newInterest, labelEn: e.target.value})}
                        placeholder={t("interests.englishName")}
                        className="flex-1 p-1.5 text-xs border border-gray-300 rounded-lg focus:border-purple-500"
                        style={{ direction: 'ltr' }}
                        disabled={newInterest.builtIn && !isUnlocked}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("general.icon")}</label>
                    {newInterest.icon && newInterest.icon.startsWith('data:') ? (
                      <div className="relative">
                        <img src={newInterest.icon} alt="icon" className="w-full h-10 object-contain rounded-lg border-2 border-gray-300 bg-white" />
                        <button
                          onClick={() => setNewInterest({...newInterest, icon: '📍'})}
                          className="absolute -top-1 -right-1 bg-gray-600 text-white rounded-full w-3.5 h-3.5 text-[8px] font-bold flex items-center justify-center leading-none"
                        >✕</button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={newInterest.icon}
                        onChange={(e) => {
                          const firstEmoji = [...e.target.value][0] || '';
                          setNewInterest({...newInterest, icon: firstEmoji});
                        }}
                        placeholder="📍"
                        className="w-full p-2 text-xl border-2 border-gray-300 rounded-lg text-center"
                        disabled={newInterest.builtIn && !isUnlocked}
                      />
                    )}
                    {(!newInterest.builtIn || isUnlocked) && (
                      <label className="block w-full mt-1 p-1 border border-dashed border-gray-300 rounded text-center cursor-pointer hover:bg-gray-50 text-[9px] text-gray-500">
                        📁 File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const compressed = await window.BKK.compressIcon(file, 64);
                              if (compressed) {
                                setNewInterest({...newInterest, icon: compressed});
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                    {(!newInterest.builtIn || isUnlocked) && (
                      <button
                        onClick={() => setIconPickerConfig({ description: newInterest.label || '', callback: (emoji) => setNewInterest(prev => ({...prev, icon: emoji})), suggestions: [], loading: false })}
                        className="block w-full mt-1 p-1 border border-dashed border-orange-300 rounded text-center cursor-pointer hover:bg-orange-50 text-[9px] text-orange-600 font-bold"
                      >✨ {t('emoji.suggest')}</button>
                    )}
                  </div>
                </div>
                </div>{/* close inner wrapper */}

                {/* Manual toggle (custom only) + Scope (all interests) */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 space-y-2">
                  {/* Manual toggle - only for custom interests */}
                  {!newInterest.builtIn && (
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => setNewInterest({...newInterest, privateOnly: !newInterest.privateOnly})}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${newInterest.privateOnly ? 'border-purple-500 bg-purple-500 text-white shadow-md' : 'border-gray-300 bg-white text-gray-500 hover:border-purple-300'}`}
                    >
                      {newInterest.privateOnly ? '✏️' : '○'} {t("interests.privateInterest")}
                    </button>
                    <span className="text-[9px] text-gray-500">{newInterest.privateOnly ? t("interests.myPlacesOnly") : t("interests.searchesGoogle")}</span>
                  </div>
                  )}
                  
                  {/* Scope: global / local */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-800">🌍</span>
                    <select
                      value={newInterest.scope || 'global'}
                      onChange={(e) => setNewInterest({...newInterest, scope: e.target.value, cityId: e.target.value === 'local' ? selectedCityId : ''})}
                      className="p-1 text-xs border rounded flex-1"
                    >
                      <option value="global">{t('interests.scopeGlobal')}</option>
                      <option value="local">{t('interests.scopeLocal')}</option>
                    </select>
                    {newInterest.scope === 'local' && (
                      <select
                        value={newInterest.cityId || selectedCityId}
                        onChange={(e) => setNewInterest({...newInterest, cityId: e.target.value})}
                        className="p-1 text-xs border rounded"
                      >
                        {Object.values(window.BKK.cities || {}).map(city => (
                          <option key={city.id} value={city.id}>{city.icon} {tLabel(city)}</option>
                        ))}
                      </select>
                    )}
                  </div>

                </div>

                {/* Route planning config — spacious layout */}
                <div style={{ background: '#faf5ff', border: '2px solid #e9d5ff', borderRadius: '12px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '10px' }}>{'🗺️ ' + t('interests.routePlanning')}</label>
                  
                  {/* Category */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('interests.category')}:</label>
                    <select
                      value={newInterest.category || 'attraction'}
                      onChange={(e) => {
                        const cat = e.target.value;
                        const defaults = {
                          attraction: { weight: 3, minStops: 1, maxStops: 10, routeSlot: 'any', minGap: 1, bestTime: 'day' },
                          break:      { weight: 1, minStops: 1, maxStops: 2, routeSlot: 'bookend', minGap: 3, bestTime: 'anytime' },
                          meal:       { weight: 1, minStops: 1, maxStops: 2, routeSlot: 'middle', minGap: 3, bestTime: 'anytime' },
                          experience: { weight: 1, minStops: 1, maxStops: 3, routeSlot: 'any', minGap: 1, bestTime: 'anytime' },
                          shopping:   { weight: 2, minStops: 1, maxStops: 5, routeSlot: 'early', minGap: 2, bestTime: 'day' },
                          nature:     { weight: 2, minStops: 1, maxStops: 5, routeSlot: 'early', minGap: 1, bestTime: 'day' }
                        };
                        const d = defaults[cat] || defaults.attraction;
                        setNewInterest({...newInterest, category: cat, weight: d.weight, minStops: d.minStops, maxStops: d.maxStops, routeSlot: d.routeSlot, minGap: d.minGap, bestTime: d.bestTime});
                      }}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white' }}
                    >
                      <option value="attraction">{t('interests.catAttraction')}</option>
                      <option value="break">{t('interests.catBreak')}</option>
                      <option value="meal">{t('interests.catMeal')}</option>
                      <option value="experience">{t('interests.catExperience')}</option>
                      <option value="shopping">{t('interests.catShopping')}</option>
                      <option value="nature">{t('interests.catNature')}</option>
                    </select>
                  </div>
                  
                  {/* Best Time + Route Slot — side by side */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('interests.bestTime')}:</label>
                      <select
                        value={newInterest.bestTime || 'anytime'}
                        onChange={(e) => setNewInterest({...newInterest, bestTime: e.target.value})}
                        style={{ width: '100%', padding: '7px 8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white' }}
                      >
                        <option value="anytime">{t('interests.timeAnytime')}</option>
                        <option value="day">{t('interests.timeDay')}</option>
                        <option value="night">{t('interests.timeNight')}</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('interests.routeSlot')}:</label>
                      <select
                        value={newInterest.routeSlot || 'any'}
                        onChange={(e) => setNewInterest({...newInterest, routeSlot: e.target.value})}
                        style={{ width: '100%', padding: '7px 8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white' }}
                      >
                        <option value="any">{t('interests.slotAny')}</option>
                        <option value="bookend">{t('interests.slotBookend')}</option>
                        <option value="early">{t('interests.slotEarly')}</option>
                        <option value="middle">{t('interests.slotMiddle')}</option>
                        <option value="late">{t('interests.slotLate')}</option>
                        <option value="end">{t('interests.slotEnd')}</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Weight + Min — side by side */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    {[
                      { label: t('interests.weight'), key: 'weight', val: newInterest.weight || 2, min: 1, max: 5 },
                      { label: t('interests.minStops'), key: 'minStops', val: newInterest.minStops != null ? newInterest.minStops : 1, min: 0, max: 10 }
                    ].map(item => (
                      <div key={item.key} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: '8px', padding: '6px 10px', border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{item.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button type="button" onClick={() => setNewInterest({...newInterest, [item.key]: Math.max(item.min, item.val - 1)})}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#e5e7eb', color: '#374151', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >−</button>
                          <span style={{ width: '20px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold' }}>{item.val}</span>
                          <button type="button" onClick={() => setNewInterest({...newInterest, [item.key]: Math.min(item.max, item.val + 1)})}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#e5e7eb', color: '#374151', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Max + Gap — side by side */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { label: t('interests.maxStopsLabel'), key: 'maxStops', val: newInterest.maxStops || 10, min: 1, max: 15 },
                      { label: t('interests.minGap'), key: 'minGap', val: newInterest.minGap || 1, min: 1, max: 5 }
                    ].map(item => (
                      <div key={item.key} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: '8px', padding: '6px 10px', border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{item.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button type="button" onClick={() => setNewInterest({...newInterest, [item.key]: Math.max(item.min, item.val - 1)})}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#e5e7eb', color: '#374151', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >−</button>
                          <span style={{ width: '20px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold' }}>{item.val}</span>
                          <button type="button" onClick={() => setNewInterest({...newInterest, [item.key]: Math.min(item.max, item.val + 1)})}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#e5e7eb', color: '#374151', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related interests for dedup */}
                {isUnlocked && (
                <div style={{ padding: '8px 14px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '4px' }}>🔗 {t('interests.dedupRelated')}</div>
                  <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '6px' }}>{t('interests.dedupRelatedDesc')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {allInterestOptions.filter(o => o.id !== (editingCustomInterest?.id || newInterest.id) && interestStatus[o.id] !== false).map(o => {
                      const sel = (newInterest.dedupRelated || []).includes(o.id);
                      return (
                        <button key={o.id} type="button"
                          onClick={() => {
                            const cur = newInterest.dedupRelated || [];
                            setNewInterest({...newInterest, dedupRelated: sel ? cur.filter(x => x !== o.id) : [...cur, o.id]});
                          }}
                          style={{ padding: '2px 6px', fontSize: '9px', fontWeight: 'bold', borderRadius: '6px', border: sel ? '2px solid #8b5cf6' : '1px solid #e5e7eb', background: sel ? '#ede9fe' : 'white', color: sel ? '#6d28d9' : '#9ca3af', cursor: 'pointer' }}
                        >{o.icon?.startsWith?.('data:') ? '📍' : (o.icon || '📍')} {tLabel(o)}</button>
                      );
                    })}
                  </div>
                </div>
                )}

                {/* Counter for auto-naming — only in edit mode + admin */}
                {editingCustomInterest && isUnlocked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', direction: 'rtl' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>{t('interests.nextNumber')}:</span>
                  {(() => {
                    const val = (interestCounters[editingCustomInterest.id] || 0) + 1;
                    const update = (v) => {
                      const newCounter = Math.max(0, v - 1);
                      if (isFirebaseAvailable && database) {
                        database.ref(`cities/${selectedCityId}/interestCounters/${editingCustomInterest.id}`).set(newCounter);
                      }
                    };
                    return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <button type="button" onClick={() => update(Math.max(1, val - 1))}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: val <= 1 ? '#e5e7eb' : '#6b7280', color: val <= 1 ? '#9ca3af' : 'white', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold' }}>{val}</span>
                      <button type="button" onClick={() => update(val + 1)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#6b7280', color: 'white', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    );
                  })()}
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>({tLabel(editingCustomInterest)} · {tLabel(window.BKK.selectedCity)} #{(interestCounters[editingCustomInterest.id] || 0) + 1})</span>
                </div>
                )}

                {/* Search Configuration */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3" style={{ opacity: (!newInterest.builtIn && newInterest.privateOnly) ? 0.4 : 1, pointerEvents: (!newInterest.builtIn && newInterest.privateOnly) ? 'none' : 'auto' }}>
                  <label className="block text-xs font-bold mb-2 text-blue-800">{`🔍 ${t("general.searchSettings")}`}
                    {(!newInterest.builtIn && newInterest.privateOnly) && <span className="text-[9px] text-gray-500 font-normal ml-2">({t("interests.myPlacesOnly")})</span>}
                  </label>
                  
                  <div className="mb-2">
                    <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>{`${t("general.searchMode")}:`}</label>
                    <select
                      value={newInterest.searchMode || 'types'}
                      onChange={(e) => setNewInterest({...newInterest, searchMode: e.target.value})}
                      className="w-full p-1.5 text-sm border rounded"
                      style={{ direction: 'ltr' }}
                    >
                      <option value="types">{t('interests.categorySearch')}</option>
                      <option value="text">{t('interests.textSearch')}</option>
                    </select>
                  </div>
                  
                  {newInterest.searchMode === 'text' ? (
                    <div className="mb-2">
                      <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>{`${t('interests.textQuery')}:`}</label>
                      <input
                        type="text"
                        value={newInterest.textSearch || ''}
                        onChange={(e) => setNewInterest({...newInterest, textSearch: e.target.value})}
                        placeholder="e.g., street art"
                        className="w-full p-1.5 text-sm border rounded"
                        style={{ direction: 'ltr' }}
                      />
                      <p className="text-[9px] text-gray-500 mt-0.5" style={{ direction: 'ltr' }}>
                        Searches: "[query] [area] {window.BKK.cityNameForSearch || 'City'}"
                      </p>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>{`${t('interests.placeTypes')}:`}</label>
                      <input
                        type="text"
                        value={newInterest.types || ''}
                        onChange={(e) => setNewInterest({...newInterest, types: e.target.value})}
                        placeholder="e.g., movie_theater, museum"
                        className="w-full p-1.5 text-sm border rounded"
                        style={{ direction: 'ltr' }}
                      />
                      <p className="text-[9px] text-gray-500 mt-0.5" style={{ direction: 'ltr' }}>
                        <a href="https://developers.google.com/maps/documentation/places/web-service/place-types" target="_blank" className="text-blue-500 underline">{t('interests.seeTypesList')}</a>
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>{`${t('interests.blacklistWords')}:`}</label>
                    <input
                      type="text"
                      value={newInterest.blacklist || ''}
                      onChange={(e) => setNewInterest({...newInterest, blacklist: e.target.value})}
                      placeholder="e.g., cannabis, massage"
                      className="w-full p-1.5 text-sm border rounded"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                </div>

                {/* Status toggle - locked (admin only) */}
                {isUnlocked && (
                <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <button type="button"
                    onClick={() => setNewInterest({...newInterest, locked: !newInterest.locked})}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${newInterest.locked ? 'border-gray-600 bg-gray-600 text-white' : 'border-gray-300 bg-white text-gray-400'}`}
                  >
                    {newInterest.locked ? '🔒' : '🔓'}
                  </button>
                </div>
                )}

                {/* Actions: Enable/Disable + Delete (edit mode only) - hidden for locked non-admin */}
                {editingCustomInterest && !(editingCustomInterest.locked && !isUnlocked) && (
                  <div className="border-t border-red-200 bg-red-50 px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          toggleInterestStatus(editingCustomInterest.id);
                          setShowAddInterestDialog(false);
                          setEditingCustomInterest(null);
                        }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                          interestStatus[editingCustomInterest.id] === false 
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {interestStatus[editingCustomInterest.id] === false ? t('general.enable') : t('general.disable')}
                      </button>
                      {(!newInterest.builtIn || isUnlocked) && (
                        <button
                          onClick={() => {
                            const msg = newInterest.builtIn 
                              ? `${t('interests.deleteBuiltIn')} "${newInterest.label}"?`
                              : `${t('interests.deleteCustom')} "${newInterest.label}"?`;
                            showConfirm(msg, () => {
                              if (newInterest.builtIn) {
                                toggleInterestStatus(editingCustomInterest.id);
                                if (isFirebaseAvailable && database) {
                                  database.ref(`settings/interestConfig/${editingCustomInterest.id}`).remove();
                                }
                                showToast(t('interests.builtInRemoved'), 'success');
                              } else {
                                deleteCustomInterest(editingCustomInterest.id);
                              }
                              setShowAddInterestDialog(false);
                              setEditingCustomInterest(null);
                            });
                          }}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                        >
                          🗑️ {t("general.deleteInterest")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
                {(() => {
                  const isLockedInterest = editingCustomInterest?.locked && !isUnlocked;
                  return isLockedInterest ? (
                    <div className="flex-shrink-0 py-2.5 px-3 bg-yellow-100 text-yellow-800 rounded-lg text-[11px] font-bold text-center flex items-center">
                      🔒 View only
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!newInterest.label.trim()) return;
                        if (window._savingInterest) return;
                        window._savingInterest = true;
                        
                        const searchConfig = {};
                        if (newInterest.searchMode === 'text' && newInterest.textSearch) {
                          searchConfig.textSearch = newInterest.textSearch.trim();
                        } else if (newInterest.types) {
                          searchConfig.types = newInterest.types.split(',').map(t => t.trim()).filter(t => t);
                        }
                        if (newInterest.blacklist) {
                          searchConfig.blacklist = newInterest.blacklist.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
                        }
                        
                        if (editingCustomInterest) {
                          const interestId = editingCustomInterest.id;
                          
                          if (newInterest.builtIn) {
                            const configData = { ...searchConfig };
                            configData.scope = newInterest.scope || 'global';
                            configData.cityId = newInterest.scope === 'local' ? (newInterest.cityId || selectedCityId) : '';
                            configData.category = newInterest.category || 'attraction';
                            configData.weight = newInterest.weight || 3;
                            configData.minStops = newInterest.minStops != null ? newInterest.minStops : 1;
                            configData.maxStops = newInterest.maxStops || 10;
                            configData.routeSlot = newInterest.routeSlot || 'any';
                            configData.minGap = newInterest.minGap || 1;
                            configData.bestTime = newInterest.bestTime || 'anytime';
                            configData.dedupRelated = newInterest.dedupRelated || [];
                            if (isUnlocked) {
                              configData.labelOverride = newInterest.label.trim();
                              configData.labelEnOverride = (newInterest.labelEn || '').trim();
                              configData.iconOverride = newInterest.icon || '';
                              configData.locked = newInterest.locked || false;
                            }
                            if (isFirebaseAvailable && database) {
                              database.ref(`settings/interestConfig/${interestId}`).set(configData);
                            } else {
                              setInterestConfig(prev => ({...prev, [interestId]: configData}));
                            }
                          } else {
                            const updatedInterest = {
                              ...editingCustomInterest,
                              label: newInterest.label.trim(),
                              labelEn: (newInterest.labelEn || '').trim(),
                              name: newInterest.label.trim(),
                              icon: newInterest.icon || '📍',
                              privateOnly: newInterest.privateOnly || false,
                              locked: newInterest.locked || false,
                              scope: newInterest.scope || 'global',
                              cityId: newInterest.scope === 'local' ? (newInterest.cityId || selectedCityId) : '',
                              category: newInterest.category || 'attraction',
                              weight: newInterest.weight || 3,
                              minStops: newInterest.minStops != null ? newInterest.minStops : 1,
                              maxStops: newInterest.maxStops || 10,
                              routeSlot: newInterest.routeSlot || 'any',
                              minGap: newInterest.minGap || 1,
                              bestTime: newInterest.bestTime || 'anytime', dedupRelated: newInterest.dedupRelated || []
                            };
                            delete updatedInterest.builtIn;
                            
                            if (isFirebaseAvailable && database) {
                              database.ref(`customInterests/${editingCustomInterest.firebaseId || interestId}`).update(updatedInterest);
                              if (Object.keys(searchConfig).length > 0) {
                                database.ref(`settings/interestConfig/${interestId}`).set(searchConfig);
                              }
                            } else {
                              const updated = customInterests.map(ci => ci.id === interestId ? updatedInterest : ci);
                              setCustomInterests(updated);
                              localStorage.setItem('bangkok_custom_interests', JSON.stringify(updated));
                            }
                          }
                          
                          showToast(t('interests.interestUpdated'), 'success');
                          setShowAddInterestDialog(false);
                          setNewInterest({ label: '', labelEn: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, locked: false, scope: 'global', category: 'attraction', weight: 3, minStops: 1, maxStops: 10, routeSlot: 'any', minGap: 1, bestTime: 'anytime', dedupRelated: [] });
                          setEditingCustomInterest(null);
                          window._savingInterest = false;
                          return;
                        } else {
                          const dupCheck = customInterests.find(i => 
                            i.label?.toLowerCase().trim() === newInterest.label.toLowerCase().trim() ||
                            i.name?.toLowerCase().trim() === newInterest.label.toLowerCase().trim()
                          );
                          if (dupCheck) {
                            showToast(`⚠️ "${newInterest.label}" ${t('interests.alreadyExists')}`, 'warning');
                            window._savingInterest = false;
                            return;
                          }
                          const interestId = 'custom_' + Date.now();
                          const newInterestData = {
                            id: interestId,
                            label: newInterest.label.trim(),
                            labelEn: (newInterest.labelEn || '').trim(),
                            name: newInterest.label.trim(),
                            icon: newInterest.icon || '📍',
                            custom: true,
                            privateOnly: newInterest.privateOnly || false,
                            locked: newInterest.locked || false,
                            scope: newInterest.scope || 'global',
                            cityId: newInterest.scope === 'local' ? (newInterest.cityId || selectedCityId) : '',
                            category: newInterest.category || 'attraction',
                            weight: newInterest.weight || 3,
                              minStops: newInterest.minStops != null ? newInterest.minStops : 1,
                              maxStops: newInterest.maxStops || 10,
                              routeSlot: newInterest.routeSlot || 'any',
                              minGap: newInterest.minGap || 1,
                              bestTime: newInterest.bestTime || 'anytime', dedupRelated: newInterest.dedupRelated || []
                          };
                          
                          setShowAddInterestDialog(false);
                          setNewInterest({ label: '', labelEn: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, locked: false, scope: 'global', category: 'attraction', weight: 3, minStops: 1, maxStops: 10, routeSlot: 'any', minGap: 1, bestTime: 'anytime', dedupRelated: [] });
                          setEditingCustomInterest(null);
                          
                          recentlyAddedRef.current.set(interestId, Date.now());
                          setCustomInterests(prev => {
                            if (prev.some(i => i.id === interestId)) return prev;
                            return [...prev, newInterestData];
                          });
                          
                          setInterestStatus(prev => ({ ...prev, [interestId]: true }));
                          
                          if (isFirebaseAvailable && database) {
                            database.ref(`customInterests/${interestId}`).set(newInterestData)
                              .then(() => {
                                recentlyAddedRef.current.delete(interestId);
                                showToast(`✅ ${newInterestData.label} — ${t('interests.interestAdded')}`, 'success');
                                database.ref(`customInterests/${interestId}`).once('value').then(snap => {
                                  if (!snap.val()) {
                                    console.error(`[INTEREST-SAVE] ⚠️ VERIFICATION FAILED — saved but read-back is null! Server may have rejected the write.`);
                                    showToast(`⚠️ "${newInterestData.label}" may not have been saved to server`, 'warning', 'sticky');
                                  } else {
                                  }
                                });
                              })
                              .catch(e => {
                                console.error(`[INTEREST-SAVE] FAILED: ${interestId}`, e);
                                showToast(`❌ ${t('toast.saveError')}: ${e.message}`, 'error', 'sticky');
                                saveToPendingInterest(newInterestData, searchConfig);
                              });
                            const userId = localStorage.getItem('bangkok_user_id') || 'unknown';
                            database.ref(`users/${userId}/interestStatus/${interestId}`).set(true).catch(() => {});
                            database.ref(`settings/interestStatus/${interestId}`).set(true).catch(() => {});
                            if (Object.keys(searchConfig).length > 0) {
                              database.ref(`settings/interestConfig/${interestId}`).set(searchConfig)
                                .catch(e => console.error(`[INTEREST-SAVE] Config FAILED: ${interestId}`, e));
                            }
                          } else {
                            const updated = [...customInterests, newInterestData];
                            setCustomInterests(updated);
                            localStorage.setItem('bangkok_custom_interests', JSON.stringify(updated));
                            showToast(`✅ ${newInterestData.label} — ${t('interests.interestAdded')}`, 'success');
                          }
                          window._savingInterest = false;
                          return; // Skip the setShow/setNew below since we already did it
                        }
                        
                        setShowAddInterestDialog(false);
                        setNewInterest({ label: '', labelEn: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, locked: false, scope: 'global', category: 'attraction', weight: 3, minStops: 1, maxStops: 10, routeSlot: 'any', minGap: 1, bestTime: 'anytime', dedupRelated: [] });
                        setEditingCustomInterest(null);
                        window._savingInterest = false;
                      }}
                      disabled={!newInterest.label?.trim()}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        newInterest.label?.trim()
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {editingCustomInterest ? t('general.update') : t('general.add')}
                    </button>
                  );
                })()}
                <button
                  onClick={() => {
                    setShowAddInterestDialog(false);
                    setNewInterest({ label: '', labelEn: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, locked: false, scope: 'global', category: 'attraction', weight: 3, minStops: 1, maxStops: 10, routeSlot: 'any', minGap: 1, bestTime: 'anytime', dedupRelated: [] });
                    setEditingCustomInterest(null);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                >
                  {`✓ ${t("general.close")}`}
                </button>
              </div>

            </div>
          </div>
        )}

      {/* Route Dialog */}
      {showRouteDialog && editingRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{routeDialogMode === 'add' ? t('route.addSavedRoute') : t('route.editSavedRoute')}</h3>
              </div>
              <button
                onClick={() => { setShowRouteDialog(false); setEditingRoute(null); }}
                className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
              >✕</button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div style={{ position: 'relative' }}>
              {editingRoute?.locked && !isUnlocked && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              )}
              {/* Route info */}
              <div className="bg-blue-50 rounded-lg p-3 space-y-1.5">
                {/* Area */}
                <div className="text-xs text-gray-700">
                  <span className="font-bold">{`📍 ${t('general.area')}:`}</span> {editingRoute.areaName || t('general.noArea')}
                </div>
                {/* Interests */}
                {(() => {
                  const ids = [...new Set((editingRoute.stops || []).flatMap(s => s.interests || []))];
                  return ids.length > 0 && (
                    <div className="flex gap-1 flex-wrap items-center">
                      <span className="text-xs font-bold text-gray-700">{`🏷️ ${t('general.interestsHeader')}:`}</span>
                      {ids.map((intId, idx) => {
                        const obj = allInterestOptions.find(o => o.id === intId);
                        return obj ? (
                          <span key={idx} className="text-[10px] bg-white px-1.5 py-0.5 rounded" title={obj.label}>
                            {obj.icon?.startsWith?.('data:') ? <img src={obj.icon} alt="" className="w-3.5 h-3.5 object-contain inline" /> : obj.icon} {obj.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  );
                })()}
                {/* Circular / Linear */}
                <div className="text-xs text-gray-700">
                  <span className="font-bold">{`🔀 ${t("route.routeType")}:`}</span> {editingRoute.circular ? t('route.circularRoute') : t('route.linearRoute')}
                </div>
                {/* Start point */}
                <div className="text-xs text-gray-700">
                  <span className="font-bold">{`🚩 ${t("route.startPoint")}:`}</span> {editingRoute.startPoint || editingRoute.startPointCoords?.address || t('form.startPointFirst')}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold mb-1">{t("general.routeName")}</label>
                <input
                  type="text"
                  value={editingRoute.name || ''}
                  onChange={(e) => setEditingRoute({...editingRoute, name: e.target.value})}
                  className="w-full p-2 text-sm border-2 border-blue-300 rounded-lg"
                  style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                  disabled={editingRoute.locked && !isUnlocked}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold mb-1">{`💬 ${t('general.notesLabel')}`}</label>
                <textarea
                  value={editingRoute.notes || ''}
                  onChange={(e) => setEditingRoute({...editingRoute, notes: e.target.value})}
                  placeholder={t("places.notes")}
                  className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg h-16 resize-none"
                  style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                  disabled={editingRoute.locked && !isUnlocked}
                />
              </div>

              {/* Stops list */}
              <div>
                <label className="block text-xs font-bold mb-1">{t("general.stopsCount")} ({editingRoute.stops?.length || 0})</label>
                <div className="max-h-32 overflow-y-auto space-y-0.5">
                  {(editingRoute.stops || []).map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400">{window.BKK.stopLabel(idx)}.</span>
                      <span className="font-medium truncate">{stop.name}</span>
                      {stop.rating && <span className="text-yellow-600">⭐{stop.rating}</span>}
                    </div>
                  ))}
                </div>
              </div>
              </div>{/* close inner wrapper */}

              {/* Status toggle - locked (admin only) */}
              {isUnlocked && (
              <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                <button type="button"
                  onClick={() => setEditingRoute({...editingRoute, locked: !editingRoute.locked})}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${editingRoute.locked ? 'border-gray-600 bg-gray-600 text-white shadow-md' : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'}`}
                >
                  {editingRoute.locked ? '🔒' : '○'} {t("general.locked")}
                </button>
              </div>
              )}

              {/* Actions: Open Route + Delete */}
              <div className="px-4 py-2 border-t border-gray-200" style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      loadSavedRoute(editingRoute);
                      setShowRouteDialog(false);
                      setEditingRoute(null);
                    }}
                    className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
                    style={{ fontSize: '15px' }}
                  >
                    📍 {t("general.openRoute")}
                  </button>
                  {!(editingRoute.locked && !isUnlocked) && (
                    <button
                      onClick={() => {
                        showConfirm(`${t("general.deleteRoute")} "${editingRoute.name}"?`, () => {
                          deleteRoute(editingRoute.id);
                          setShowRouteDialog(false);
                          setEditingRoute(null);
                        });
                      }}
                      style={{ width: '42px', height: '42px', borderRadius: '8px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      title={t("general.deleteRoute")}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
              {(() => {
                const isLockedRoute = editingRoute.locked && !isUnlocked;
                return (
                  <>
                    {!isLockedRoute && (
                      <button
                        onClick={() => {
                          updateRoute(editingRoute.id, {
                            name: editingRoute.name,
                            notes: editingRoute.notes,
                            locked: editingRoute.locked
                          });
                          setShowRouteDialog(false);
                          setEditingRoute(null);
                        }}
                        className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600"
                      >
                        💾 {t('general.update') || 'Update'}
                      </button>
                    )}
                    <button
                      onClick={() => { setShowRouteDialog(false); setEditingRoute(null); }}
                      className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                    >
                      {`✓ ${t("general.close")}`}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Stop Dialog */}
      {showManualAddDialog && (() => {
        const searchManualPlace = async () => {
          const input = document.getElementById('manual-stop-input');
          const resultsDiv = document.getElementById('manual-stop-results');
          const q = input?.value?.trim();
          if (!q || !resultsDiv) return;
          
          resultsDiv.innerHTML = '<p style="text-align:center;color:#9ca3af;font-size:12px;padding:8px">{t("general.searching")}...</p>';
          
          try {
            const result = await window.BKK.geocodeAddress(q);
            if (result) {
              const display = result.displayName || result.address || q;
              resultsDiv.innerHTML = '';
              const btn = document.createElement('button');
              btn.className = 'w-full p-3 text-right bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition';
              btn.style.direction = 'rtl';
              btn.innerHTML = `<div style="font-weight:bold;font-size:14px;color:#6d28d9">📍 ${display}</div><div style="font-size:10px;color:#6b7280;margin-top:2px">${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}</div>`;
              btn.onclick = () => {
                const newStop = {
                  name: display,
                  lat: result.lat,
                  lng: result.lng,
                  description: `⭐ N/A`,
                  address: result.address || display,
                  duration: 45,
                  interests: ['_manual'],
                  manuallyAdded: true,
                  googlePlace: false,
                  rating: 0,
                  ratingCount: 0
                };
                
                const isDup = route?.stops?.some(s => s.name.toLowerCase().trim() === newStop.name.toLowerCase().trim());
                if (isDup) {
                  showToast(`"${display}" ${t("places.alreadyInRoute")}`, 'warning');
                  return;
                }
                
                setManualStops(prev => [...prev, newStop]);
                
                if (route) {
                  setRoute(prev => prev ? {
                    ...prev,
                    stops: [...prev.stops, newStop],
                    optimized: false
                  } : prev);
                }
                
                showToast(`➕ ${display} ${t("interests.added")}`, 'success');
                
                const inp = document.getElementById('manual-stop-input');
                if (inp) inp.value = '';
                resultsDiv.innerHTML = '<p style="text-align:center;color:#16a34a;font-size:12px;padding:8px">✅ Added! You can add more or close</p>';
              };
              resultsDiv.appendChild(btn);
            } else {
              resultsDiv.innerHTML = '<p style="text-align:center;color:#ef4444;font-size:12px;padding:8px">❌ No results found</p>';
            }
          } catch (err) {
            console.error('[MANUAL_ADD] Search error:', err);
            resultsDiv.innerHTML = '<p style="text-align:center;color:#ef4444;font-size:12px;padding:8px">❌ Search error</p>';
          }
        };
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
                <h3 className="text-sm font-bold">{t("route.addManualStop")}</h3>
                <button
                  onClick={() => setShowManualAddDialog(false)}
                  className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              {/* Search input */}
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    id="manual-stop-input"
                    type="text"
                    onKeyDown={(e) => { if (e.key === 'Enter') searchManualPlace(); }}
                    placeholder={t("form.typeAddressAlt")}
                    className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm"
                    style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                    autoFocus
                  />
                  <button
                    onClick={searchManualPlace}
                    className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap bg-purple-500 text-white hover:bg-purple-600"
                  >
                    {`🔍 ${t('general.search')}`}
                  </button>
                </div>
                
                <p className="text-[11px] text-gray-500">
                  {t('general.searchAndAddHint')}
                </p>
                
                {manualStops.length > 0 && (
                  <div className="text-[11px] text-purple-600 font-bold">
                    {`📍 ${manualStops.length} ${t('general.placesAddedManually')}`}
                  </div>
                )}
                
                {/* Results container */}
                <div id="manual-stop-results" className="space-y-2 max-h-60 overflow-y-auto"></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Address Search Dialog */}
      {showAddressDialog && (() => {
        const searchAddress = async () => {
          const input = document.getElementById('addr-search-input');
          const resultsDiv = document.getElementById('addr-search-results');
          const q = input?.value?.trim();
          if (!q || !resultsDiv) return;
          
          resultsDiv.innerHTML = '<p style="text-align:center;color:#9ca3af;font-size:12px;padding:8px">{t("general.searching")}...</p>';
          
          try {
            const result = await window.BKK.geocodeAddress(q);
            if (result) {
              const addr = result.address || result.displayName || q;
              const display = result.displayName || result.address || q;
              resultsDiv.innerHTML = '';
              const btn = document.createElement('button');
              btn.className = 'w-full p-3 text-right bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition';
              btn.style.direction = 'rtl';
              btn.innerHTML = `<div style="font-weight:bold;font-size:14px;color:#166534">📍 ${display}</div><div style="font-size:10px;color:#6b7280;margin-top:2px">${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}</div>`;
              btn.onclick = () => {
                setFormData(prev => ({ ...prev, startPoint: display }));
                setStartPointCoords({ lat: result.lat, lng: result.lng, address: display });
                if (route?.optimized) setRoute(prev => prev ? {...prev, optimized: false} : prev);
                showToast(`✅ ${display}`, 'success');
                setShowAddressDialog(false);
              };
              resultsDiv.appendChild(btn);
            } else {
              resultsDiv.innerHTML = '<p style="text-align:center;color:#ef4444;font-size:12px;padding:8px">❌ No results found</p>';
            }
          } catch (err) {
            console.error('[ADDRESS_DIALOG] Search error:', err);
            resultsDiv.innerHTML = '<p style="text-align:center;color:#ef4444;font-size:12px;padding:8px">❌ Search error</p>';
          }
        };
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
                <h3 className="text-sm font-bold">{`📍 ${t("form.searchAddress")}`}</h3>
                <button
                  onClick={() => setShowAddressDialog(false)}
                  className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              {/* Search input */}
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    id="addr-search-input"
                    type="text"
                    onKeyDown={(e) => { if (e.key === 'Enter') searchAddress(); }}
                    placeholder={t("form.typeAddress")}
                    className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm"
                    style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                    autoFocus
                  />
                  <button
                    onClick={searchAddress}
                    className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap bg-green-500 text-white hover:bg-green-600"
                  >
                    {`🔍 ${t('general.search')}`}
                  </button>
                </div>
                
                <p className="text-[11px] text-gray-500">
                  💡 Enter full address, hotel name, train station, or any place in {tLabel(window.BKK.selectedCity) || t('general.city')}
                </p>
                
                {/* Results container */}
                <div id="addr-search-results" className="space-y-2 max-h-60 overflow-y-auto"></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Image Modal */}
      {showImageModal && modalImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4"
          onClick={() => { setShowImageModal(false); setModalImage(null); }}
        >
          <button
            onClick={() => { setShowImageModal(false); setModalImage(null); }}
            className="absolute top-4 right-4 bg-white bg-opacity-90 text-black rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold shadow-lg hover:bg-opacity-100 z-10"
          >✕</button>
          <img src={modalImage} alt="enlarged" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}

      {/* Help Dialog */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>ℹ️</span>
                {helpContent[helpContext]?.title || t('general.help')}
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
              >✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-700" style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr', textAlign: window.BKK.i18n.isRTL() ? 'right' : 'left' }}>
              {helpContent[helpContext]?.content.split('\n').map((line, i) => {
                const renderBold = (text) => {
                  const parts = text.split(/\*\*(.*?)\*\*/g);
                  return parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part);
                };
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <h4 key={i} className="font-bold text-gray-900 mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                } else if (line.startsWith('• ')) {
                  return <p key={i} style={{ marginInlineStart: '12px' }} className="mb-0.5">• {renderBold(line.substring(2))}</p>;
                } else if (line.trim() === '') {
                  return <div key={i} className="h-2" />;
                }
                return <p key={i} className="mb-1">{renderBold(line)}</p>;
              })}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 text-sm"
              >{t('general.close')} ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 max-w-sm w-full shadow-2xl">
            <p className="text-sm text-gray-800 mb-4 text-center font-medium">{confirmConfig.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  if (confirmConfig.onConfirm) confirmConfig.onConfirm();
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
              >
                {t('general.confirm')}
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400"
              >
                {t('general.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification - Subtle */}
      {/* Feedback Dialog */}
      {showFeedbackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-sm shadow-2xl">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-3 rounded-t-2xl sm:rounded-t-xl flex justify-between items-center">
              <h3 className="text-base font-bold">{`💬 ${t("settings.sendFeedback")}`}</h3>
              <button onClick={() => { setShowFeedbackDialog(false); setFeedbackText(''); }} className="text-white opacity-70 hover:opacity-100 text-xl leading-none">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                {[
                  { id: 'bug', label: t('general.bug'), color: 'red' },
                  { id: 'idea', label: t('general.idea'), color: 'yellow' },
                  { id: 'general', label: t('general.generalFeedback'), color: 'blue' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFeedbackCategory(cat.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      feedbackCategory === cat.id
                        ? cat.color === 'red' ? 'bg-red-100 border-2 border-red-400 text-red-700'
                        : cat.color === 'yellow' ? 'bg-yellow-100 border-2 border-yellow-400 text-yellow-700'
                        : 'bg-blue-100 border-2 border-blue-400 text-blue-700'
                        : 'bg-gray-100 border-2 border-transparent text-gray-500'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t("settings.feedbackPlaceholder")}
                className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm resize-none focus:border-blue-400 focus:outline-none"
                rows={4}
                autoFocus
                dir={window.BKK.i18n.isRTL() ? "rtl" : "ltr"}
              />
              
              <button
                onClick={submitFeedback}
                disabled={!feedbackText.trim()}
                className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${
                  feedbackText.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                📨 Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List Dialog (Admin Only) */}
      {showFeedbackList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-t-xl flex justify-between items-center">
              <h3 className="text-base font-bold">{`💬 Feedback (`}{feedbackList.length})</h3>
              <div className="flex items-center gap-2">
                {feedbackList.length > 0 && (
                  <button
                    onClick={() => {
                      showConfirm(t('settings.deleteAllFeedback'), () => {
                        if (isFirebaseAvailable && database) {
                          database.ref('feedback').remove().then(() => {
                            setFeedbackList([]);
                            showToast(t('toast.allFeedbackDeleted'), 'success');
                          });
                        }
                      });
                    }}
                    className="text-white opacity-70 hover:opacity-100 text-sm"
                    title={t("general.deleteAll")}
                  >
                    🗑️
                  </button>
                )}
                <button onClick={() => setShowFeedbackList(false)} className="text-white opacity-70 hover:opacity-100 text-xl leading-none">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3">
              {feedbackList.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm">{t("general.noRegisteredUsers")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {feedbackList.map((item) => (
                    <div key={item.firebaseId} className={`p-3 rounded-lg border-2 transition-all ${
                      item.resolved ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-300'
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {item.category === 'bug' ? '🐛' : item.category === 'idea' ? '💡' : '💭'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">{item.userId?.slice(-8)}</span>
                          <span className="text-[10px] text-gray-400">{`From: ${item.currentView || '?'}`}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleFeedbackResolved(item)}
                            className={`text-sm px-1 ${item.resolved ? 'opacity-50' : ''}`}
                            title={item.resolved ? t('places.markUnhandled') : t('places.markHandled')}
                          >
                            {item.resolved ? '↩️' : '✅'}
                          </button>
                          <button
                            onClick={() => deleteFeedback(item)}
                            className="text-sm px-1 opacity-50 hover:opacity-100"
                            title={t("general.delete")}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.text}</p>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {item.date ? new Date(item.date).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Dialog */}
      {showImportDialog && importedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-t-xl">
              <h3 className="text-base font-bold">{`📥 ${t('general.importExport')}`}</h3>
            </div>
            <div className="p-4 space-y-3">
              {importedData.exportDate && (
                <p className="text-xs text-gray-500 text-center">
                  {`Date: ${new Date(importedData.exportDate).toLocaleDateString()}`}
                  {importedData.version && ` | v${importedData.version}`}
                </p>
              )}
              
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>{`🏷️ ${t('interests.customCount')}`}</span>
                  <span className="font-bold text-purple-600">{(importedData.customInterests || []).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{`📍 ${t("nav.myPlaces")}`}</span>
                  <span className="font-bold text-blue-600">{(importedData.customLocations || []).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{`🗺️ ${t("nav.saved")}`}</span>
                  <span className="font-bold text-blue-600">{(importedData.savedRoutes || []).length}</span>
                </div>
                {importedData.interestConfig && (
                  <div className="flex justify-between text-sm">
                    <span>{`⚙️ ${t("general.searchSettings")}`}</span>
                    <span className="font-bold text-gray-600">{Object.keys(importedData.interestConfig).length}</span>
                  </div>
                )}
                {importedData.interestStatus && (
                  <div className="flex justify-between text-sm">
                    <span>{`✅ ${t('interests.interestStatus')}`}</span>
                    <span className="font-bold text-gray-600">{Object.keys(importedData.interestStatus).length}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2">
                <p className="text-xs text-yellow-800">
                  💡 Existing items won't be overwritten. Only new items will be added.
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleImportMerge}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition text-sm"
                >
                  ✅ {t("general.importFromFile")}
                </button>
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportedData(null);
                  }}
                  className="flex-1 py-2.5 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add City Dialog */}
      {showAddCityDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" style={{ maxHeight: '90vh', overflow: 'auto' }}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 rounded-t-xl flex justify-between items-center">
              <h3 className="text-base font-bold">{`🌍 ${t('settings.addCity')}`}</h3>
              <button onClick={() => { setShowAddCityDialog(false); setAddCityInput(''); setAddCitySearchStatus(''); setAddCityFound(null); setAddCityGenerated(null); }} className="text-white text-lg font-bold">✕</button>
            </div>
            <div className="p-4">
                  <div className="space-y-4">
                    {/* Search input */}
                    <div className="flex gap-2">
                      <input
                        type="text" value={addCityInput} onChange={(e) => setAddCityInput(e.target.value)}
                        placeholder={t('settings.enterCityName')}
                        className="flex-1 p-2 border-2 border-gray-300 rounded-lg text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') {
                          const doSearch = async () => {
                            if (!addCityInput.trim()) return;
                            setAddCitySearchStatus('searching');
                            setAddCityFound(null);
                            setAddCityGenerated(null);
                            try {
                              const resp = await fetch(window.BKK.GOOGLE_PLACES_TEXT_SEARCH_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': window.BKK.GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.viewport,places.id' },
                                body: JSON.stringify({ textQuery: addCityInput + ' city', languageCode: 'en' })
                              });
                              const data = await resp.json();
                              if (data.places && data.places.length > 0) {
                                const place = data.places[0];
                                const cityName = place.displayName?.text || addCityInput;
                                const lat = place.location?.latitude;
                                const lng = place.location?.longitude;
                                if (lat && lng) {
                                  const cityId = cityName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                  if (window.BKK.cities[cityId]) {
                                    setAddCitySearchStatus('error');
                                    showToast(t('settings.cityAlreadyExists'), 'warning');
                                    return;
                                  }
                                  setAddCityFound({ name: cityName, lat, lng, address: place.formattedAddress, id: cityId, viewport: place.viewport });
                                  setAddCitySearchStatus('found');
                                } else { setAddCitySearchStatus('error'); }
                              } else { setAddCitySearchStatus('error'); }
                            } catch (err) { console.error('[ADD CITY] Search error:', err); setAddCitySearchStatus('error'); }
                          };
                          doSearch();
                        }}}
                      />
                      <button onClick={async () => {
                            if (!addCityInput.trim()) return;
                            setAddCitySearchStatus('searching');
                            setAddCityFound(null);
                            setAddCityGenerated(null);
                            try {
                              const resp = await fetch(window.BKK.GOOGLE_PLACES_TEXT_SEARCH_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': window.BKK.GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.viewport,places.id' },
                                body: JSON.stringify({ textQuery: addCityInput + ' city', languageCode: 'en' })
                              });
                              const data = await resp.json();
                              if (data.places && data.places.length > 0) {
                                const place = data.places[0];
                                const cityName = place.displayName?.text || addCityInput;
                                const lat = place.location?.latitude;
                                const lng = place.location?.longitude;
                                if (lat && lng) {
                                  const cityId = cityName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                  if (window.BKK.cities[cityId]) {
                                    setAddCitySearchStatus('error');
                                    showToast(t('settings.cityAlreadyExists'), 'warning');
                                    return;
                                  }
                                  setAddCityFound({ name: cityName, lat, lng, address: place.formattedAddress, id: cityId, viewport: place.viewport });
                                  setAddCitySearchStatus('found');
                                } else { setAddCitySearchStatus('error'); }
                              } else { setAddCitySearchStatus('error'); }
                            } catch (err) { console.error('[ADD CITY] Search error:', err); setAddCitySearchStatus('error'); }
                      }} disabled={!addCityInput.trim() || addCitySearchStatus === 'searching'}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 disabled:opacity-50"
                      >{addCitySearchStatus === 'searching' ? '...' : `🔍 ${t('general.search')}`}</button>
                    </div>

                    {/* Search result */}
                    {addCitySearchStatus === 'error' && (
                      <p className="text-sm text-red-500 text-center">{t('settings.cityNotFound')}</p>
                    )}
                    
                    {addCitySearchStatus === 'found' && addCityFound && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                        <p className="font-bold text-lg">{addCityFound.name}</p>
                        <p className="text-xs text-gray-500">{addCityFound.address}</p>
                        <p className="text-xs text-gray-400 mt-1">{addCityFound.lat.toFixed(4)}, {addCityFound.lng.toFixed(4)}</p>
                        <button onClick={async () => {
                          if (!addCityFound) return;
                          setAddCitySearchStatus('generating');
                          try {
                            const areasResp = await fetch(window.BKK.GOOGLE_PLACES_TEXT_SEARCH_URL, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': window.BKK.GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.location,places.types,places.formattedAddress' },
                              body: JSON.stringify({ textQuery: `popular neighborhoods districts areas in ${addCityFound.name}`, languageCode: 'en', maxResultCount: 10 })
                            });
                            const areasData = await areasResp.json();
                            const areas = [];
                            const seen = new Set();
                            if (areasData.places) {
                              areasData.places.forEach((p, i) => {
                                const areaName = p.displayName?.text || `Area ${i+1}`;
                                const areaId = areaName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                if (seen.has(areaId) || !p.location) return;
                                seen.add(areaId);
                                areas.push({ id: areaId, label: areaName, labelEn: areaName, desc: p.formattedAddress || '', descEn: p.formattedAddress || '', lat: p.location.latitude, lng: p.location.longitude, radius: 2000, size: 'medium', safety: 'safe' });
                              });
                            }
                            if (areas.length === 0) {
                              areas.push({ id: 'center', label: 'Center', labelEn: 'Center', desc: 'City center', descEn: 'City center', lat: addCityFound.lat, lng: addCityFound.lng, radius: 3000, size: 'large', safety: 'safe' });
                            }
                            const defaultInterests = [
                              { id: 'food', label: 'אוכל', labelEn: 'Food', icon: '🍜' },
                              { id: 'cafes', label: 'קפה', labelEn: 'Coffee', icon: '☕' },
                              { id: 'culture', label: 'תרבות', labelEn: 'Culture', icon: '🎭' },
                              { id: 'history', label: 'היסטוריה', labelEn: 'History', icon: '🏛️' },
                              { id: 'parks', label: 'פארקים', labelEn: 'Parks', icon: '🌳' },
                              { id: 'shopping', label: 'קניות', labelEn: 'Shopping', icon: '🛍️' },
                              { id: 'nightlife', label: 'לילה', labelEn: 'Nightlife', icon: '🌃' },
                              { id: 'galleries', label: 'גלריות', labelEn: 'Galleries', icon: '🖼️' },
                              { id: 'markets', label: 'שווקים', labelEn: 'Markets', icon: '🏪' },
                              { id: 'graffiti', label: 'גרפיטי', labelEn: 'Street Art', icon: '🎨' },
                              { id: 'beaches', label: 'חופים', labelEn: 'Beaches', icon: '🏖️' },
                              { id: 'architecture', label: 'ארכיטקטורה', labelEn: 'Architecture', icon: '🏗️' }
                            ];
                            const defaultPlaceTypes = {
                              food: ['restaurant', 'meal_takeaway'], cafes: ['cafe', 'coffee_shop'],
                              culture: ['performing_arts_theater', 'cultural_center', 'museum'], history: ['historical_landmark', 'museum'],
                              parks: ['park', 'national_park'], shopping: ['shopping_mall', 'store'],
                              nightlife: ['bar', 'night_club'], galleries: ['art_gallery', 'museum'],
                              markets: ['market'], graffiti: ['art_gallery'], beaches: ['beach'], architecture: ['historical_landmark']
                            };
                            let allCityRadius = 15000;
                            if (addCityFound.viewport) {
                              const vp = addCityFound.viewport;
                              if (vp.high && vp.low) {
                                const latDiff = Math.abs(vp.high.latitude - vp.low.latitude);
                                const lngDiff = Math.abs(vp.high.longitude - vp.low.longitude);
                                allCityRadius = Math.round(Math.max(latDiff, lngDiff) * 111000 / 2);
                              }
                            }
                            const newCity = {
                              id: addCityFound.id, name: addCityFound.name, nameEn: addCityFound.name,
                              country: addCityFound.address?.split(',').pop()?.trim() || '',
                              icon: '📍', secondaryIcon: '🏙️', active: false, distanceMultiplier: 1.2,
                              center: { lat: addCityFound.lat, lng: addCityFound.lng },
                              allCityRadius, areas, interests: defaultInterests,
                              interestToGooglePlaces: defaultPlaceTypes,
                              textSearchInterests: { graffiti: 'street art' },
                              uncoveredInterests: [], interestTooltips: {}
                            };
                            setAddCityGenerated(newCity);
                            setAddCitySearchStatus('done');
                          } catch (err) {
                            console.error('[ADD CITY] Generate error:', err);
                            setAddCitySearchStatus('error');
                            showToast(t('general.error'), 'error');
                          }
                        }}
                          className="mt-3 px-6 py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600"
                        >{`🏗️ ${t('settings.generateCity')}`}</button>
                      </div>
                    )}

                    {addCitySearchStatus === 'generating' && (
                      <div className="text-center py-4">
                        <div className="text-2xl animate-spin inline-block">🌍</div>
                        <p className="text-sm text-gray-500 mt-2">{t('settings.generatingCity')}</p>
                      </div>
                    )}

                    {addCitySearchStatus === 'done' && addCityGenerated && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="font-bold text-center mb-2">{addCityGenerated.icon} {addCityGenerated.nameEn}</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>📍 {addCityGenerated.areas.length} {t('general.areas')}: {addCityGenerated.areas.map(a => a.labelEn).join(', ')}</p>
                          <p>⭐ {addCityGenerated.interests.length} {t('nav.interests')}</p>
                          <p>🔍 {t('settings.radius')}: {addCityGenerated.allCityRadius}m</p>
                        </div>
                        <p className="text-[10px] text-amber-600 mt-2 text-center">{t('settings.cityStartsInactive')}</p>
                        <button onClick={() => {
                          if (!addCityGenerated) return;
                          window.BKK.cities[addCityGenerated.id] = addCityGenerated;
                          window.BKK.cityData[addCityGenerated.id] = addCityGenerated;
                          window.BKK.cityRegistry[addCityGenerated.id] = {
                            id: addCityGenerated.id, name: addCityGenerated.name, nameEn: addCityGenerated.nameEn,
                            country: addCityGenerated.country, icon: addCityGenerated.icon, file: `city-${addCityGenerated.id}.js`
                          };
                          try {
                            const customCities = JSON.parse(localStorage.getItem('custom_cities') || '{}');
                            customCities[addCityGenerated.id] = addCityGenerated;
                            localStorage.setItem('custom_cities', JSON.stringify(customCities));
                          } catch(e) { console.error('Failed to save city:', e); }
                          window.BKK.exportCityFile(addCityGenerated);
                          showToast(`✓ ${addCityGenerated.nameEn} ${t('settings.cityAdded')}`, 'success');
                          setShowAddCityDialog(false);
                          setAddCityInput(''); setAddCitySearchStatus(''); setAddCityFound(null); setAddCityGenerated(null);
                          switchCity(addCityGenerated.id);
                          setFormData(prev => ({...prev}));
                        }}
                          className="mt-3 w-full py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600"
                        >{`✓ ${t('settings.addCityConfirm')}`}</button>
                      </div>
                    )}
                  </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Long-Press Password Dialog (does NOT add to admin list) */}
      {showVersionPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-t-xl">
              <h3 className="text-base font-bold">{`🔒 ${t("settings.lockedSettings")}`}</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600 text-center">{t("settings.enterPassword")}</p>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={t("settings.password")}
                className="w-full p-3 border rounded-lg text-center text-lg"
                autoFocus
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const hashedInput = await window.BKK.hashPassword(passwordInput);
                    if (hashedInput === adminPassword || passwordInput === adminPassword) {
                      const userId = localStorage.getItem('bangkok_user_id');
                      const userName = localStorage.getItem('bangkok_user_name') || 'Unknown';
                      if (isFirebaseAvailable && database && userId) {
                        if (passwordInput === adminPassword && hashedInput !== adminPassword) {
                          database.ref('settings/adminPassword').set(hashedInput);
                          setAdminPassword(hashedInput);
                        }
                        database.ref(`settings/adminUsers/${userId}`).set({
                          addedAt: new Date().toISOString(),
                          name: userName
                        });
                      }
                      setIsUnlocked(true);
                      setIsCurrentUserAdmin(true);
                      localStorage.setItem('bangkok_is_admin', 'true');
                      setShowVersionPasswordDialog(false);
                      setPasswordInput('');
                      setCurrentView('settings');
                      showToast('🔓', 'success');
                    } else {
                      showToast(t('settings.wrongPassword'), 'error');
                      setPasswordInput('');
                    }
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const hashedInput = await window.BKK.hashPassword(passwordInput);
                    if (hashedInput === adminPassword || passwordInput === adminPassword) {
                      const userId = localStorage.getItem('bangkok_user_id');
                      const userName = localStorage.getItem('bangkok_user_name') || 'Unknown';
                      if (isFirebaseAvailable && database && userId) {
                        if (passwordInput === adminPassword && hashedInput !== adminPassword) {
                          database.ref('settings/adminPassword').set(hashedInput);
                          setAdminPassword(hashedInput);
                        }
                        database.ref(`settings/adminUsers/${userId}`).set({
                          addedAt: new Date().toISOString(),
                          name: userName
                        });
                      }
                      setIsUnlocked(true);
                      setIsCurrentUserAdmin(true);
                      localStorage.setItem('bangkok_is_admin', 'true');
                      setShowVersionPasswordDialog(false);
                      setPasswordInput('');
                      setCurrentView('settings');
                      showToast('🔓', 'success');
                    } else {
                      showToast(t('settings.wrongPassword'), 'error');
                      setPasswordInput('');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-blue-500 text-white hover:bg-blue-600"
                >{t("general.ok")}</button>
                <button
                  onClick={() => { setShowVersionPasswordDialog(false); setPasswordInput(''); }}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                >{t("general.cancel")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-t-xl">
              <h3 className="text-base font-bold">{`🔒 ${t("settings.lockedSettings")}`}</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600 text-center">{t("settings.enterPassword")}</p>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={t("settings.password")}
                className="w-full p-3 border rounded-lg text-center text-lg"
                autoFocus
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const hashedInput = await window.BKK.hashPassword(passwordInput);
                    if (hashedInput === adminPassword || passwordInput === adminPassword) {
                      const userId = localStorage.getItem('bangkok_user_id');
                      const userName = localStorage.getItem('bangkok_user_name') || 'Unknown';
                      if (isFirebaseAvailable && database) {
                        if (passwordInput === adminPassword && hashedInput !== adminPassword) {
                          database.ref('settings/adminPassword').set(hashedInput);
                          setAdminPassword(hashedInput);
                        }
                        database.ref(`settings/adminUsers/${userId}`).set({
                          addedAt: new Date().toISOString(),
                          name: userName
                        }).then(() => {
                          setIsUnlocked(true);
                          setIsCurrentUserAdmin(true);
                          localStorage.setItem('bangkok_is_admin', 'true');
                          setShowPasswordDialog(false);
                          setPasswordInput('');
                          setCurrentView('settings');
                          showToast(t('route.openedSuccess'), 'success');
                        });
                      }
                    } else {
                      showToast(t('settings.wrongPassword'), 'error');
                      setPasswordInput('');
                    }
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const hashedInput = await window.BKK.hashPassword(passwordInput);
                    if (hashedInput === adminPassword || passwordInput === adminPassword) {
                      const userId = localStorage.getItem('bangkok_user_id');
                      const userName = localStorage.getItem('bangkok_user_name') || 'Unknown';
                      if (isFirebaseAvailable && database) {
                        if (passwordInput === adminPassword && hashedInput !== adminPassword) {
                          database.ref('settings/adminPassword').set(hashedInput);
                          setAdminPassword(hashedInput);
                        }
                        database.ref(`settings/adminUsers/${userId}`).set({
                          addedAt: new Date().toISOString(),
                          name: userName
                        }).then(() => {
                          setIsUnlocked(true);
                          setIsCurrentUserAdmin(true);
                          localStorage.setItem('bangkok_is_admin', 'true');
                          setShowPasswordDialog(false);
                          setPasswordInput('');
                          setCurrentView('settings');
                          showToast(t('route.openedSuccess'), 'success');
                        });
                      }
                    } else {
                      showToast(t('settings.wrongPassword'), 'error');
                      setPasswordInput('');
                    }
                  }}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium"
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPasswordInput('');
                  }}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Emoji Picker Dialog */}
            {iconPickerConfig && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
                    <h3 className="text-sm font-bold">✨ {t('emoji.suggestTitle')}</h3>
                    <button onClick={() => setIconPickerConfig(null)} className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center">✕</button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={iconPickerConfig.description || ''}
                        onChange={(e) => setIconPickerConfig({...iconPickerConfig, description: e.target.value})}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && iconPickerConfig.description?.trim()) {
                            setIconPickerConfig(prev => ({...prev, loading: true, suggestions: []}));
                            window.BKK.suggestEmojis(iconPickerConfig.description).then(emojis => {
                              setIconPickerConfig(prev => prev ? {...prev, suggestions: emojis, loading: false} : null);
                            });
                          }
                        }}
                        placeholder={t('emoji.describePlaceholder')}
                        className="flex-1 p-2 text-sm border-2 border-orange-300 rounded-lg focus:border-orange-500"
                        style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (!iconPickerConfig.description?.trim()) return;
                          setIconPickerConfig(prev => ({...prev, loading: true, suggestions: []}));
                          window.BKK.suggestEmojis(iconPickerConfig.description).then(emojis => {
                            setIconPickerConfig(prev => prev ? {...prev, suggestions: emojis, loading: false} : null);
                          });
                        }}
                        disabled={iconPickerConfig.loading || !iconPickerConfig.description?.trim()}
                        className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-50"
                      >
                        {iconPickerConfig.loading ? '...' : '🔍'}
                      </button>
                    </div>
                    
                    {iconPickerConfig.loading && (
                      <div className="text-center text-gray-500 text-sm py-4">{t('emoji.searching')}...</div>
                    )}
                    
                    {iconPickerConfig.suggestions?.length > 0 && (
                      <React.Fragment>
                        <div className="flex flex-wrap justify-center gap-2">
                          {iconPickerConfig.suggestions.map((emoji, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                if (iconPickerConfig.callback) iconPickerConfig.callback(emoji);
                                setIconPickerConfig(prev => prev ? {...prev, selected: emoji} : null);
                              }}
                              className={`text-3xl p-3 rounded-xl border-2 transition-all cursor-pointer ${iconPickerConfig.selected === emoji ? 'border-orange-500 bg-orange-100 ring-2 ring-orange-300' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50'}`}
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 justify-center pt-1">
                          <button
                            onClick={() => {
                              if (!iconPickerConfig.description?.trim()) return;
                              setIconPickerConfig(prev => ({...prev, loading: true, suggestions: [], selected: null}));
                              window.BKK.suggestEmojis(iconPickerConfig.description).then(emojis => {
                                setIconPickerConfig(prev => prev ? {...prev, suggestions: emojis, loading: false} : null);
                              });
                            }}
                            className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 border border-gray-300"
                          >🔄 {t('emoji.moreOptions')}</button>
                          <button
                            onClick={() => setIconPickerConfig(null)}
                            className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600"
                          >✓ {t('emoji.done')}</button>
                        </div>
                      </React.Fragment>
                    )}
                    
                    {!iconPickerConfig.loading && (!iconPickerConfig.suggestions || iconPickerConfig.suggestions.length === 0) && (
                      <p className="text-center text-xs text-gray-400">{t('emoji.typeAndSearch')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {toastMessage && (
        <div
          onClick={() => setToastMessage(null)}
          dir={window.BKK.i18n.isRTL() ? 'rtl' : 'ltr'}
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            left: '10px',
            maxWidth: '400px',
            margin: '0 auto',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: toastMessage.type === 'error' ? '#fecaca' : toastMessage.type === 'warning' ? '#fde68a' : toastMessage.type === 'info' ? '#dbeafe' : '#bbf7d0',
            border: `1px solid ${toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'warning' ? '#f59e0b' : toastMessage.type === 'info' ? '#3b82f6' : '#22c55e'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 9999,
            animation: 'slideDown 0.15s ease-out',
            cursor: toastMessage.sticky ? 'pointer' : 'default',
            direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr',
            textAlign: window.BKK.i18n.isRTL() ? 'right' : 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>
              {toastMessage.type === 'error' ? '❌' : toastMessage.type === 'warning' ? '⚠️' : toastMessage.type === 'info' ? 'ℹ️' : '✅'}
            </span>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
              {toastMessage.message}
            </div>
            {toastMessage.sticky && (
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280', cursor: 'pointer', flexShrink: 0 }}>✕</span>
            )}
          </div>
        </div>
      )}

      {/* === PLACE REVIEW DIALOG === */}
      {reviewDialog && (() => {
        const avgRating = reviewDialog.reviews.length > 0 
          ? (reviewDialog.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewDialog.reviews.filter(r => r.rating > 0).length || 0).toFixed(1)
          : null;
        const visitorId = window.BKK.visitorId || 'anonymous';
        
        const handleClose = () => {
          if (reviewDialog.hasChanges) {
            if (window.confirm(t('reviews.unsavedChanges'))) {
              saveReview();
            } else {
              setReviewDialog(null);
            }
          } else {
            setReviewDialog(null);
          }
        };
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={handleClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-3 border-b bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                  <div className="text-center flex-1">
                    <h3 className="font-bold text-base text-gray-800">{reviewDialog.place.name}</h3>
                    {reviewDialog.place.description && (
                      <p className="text-[10px] text-gray-500">{reviewDialog.place.description}</p>
                    )}
                    {avgRating && avgRating !== 'NaN' && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="text-amber-500 text-sm">{'★'.repeat(Math.round(parseFloat(avgRating)))}</span>
                        <span className="text-xs text-gray-600 font-bold">{avgRating}</span>
                        <span className="text-[10px] text-gray-400">({reviewDialog.reviews.filter(r => r.rating > 0).length})</span>
                      </div>
                    )}
                  </div>
                  <div style={{ width: '24px' }}></div>
                </div>
              </div>
              
              {/* My Review Section */}
              <div className="p-3 border-b bg-blue-50">
                <h4 className="text-xs font-bold text-blue-700 mb-2">⭐ {t('reviews.myReview')}</h4>
                {/* Star Rating */}
                <div className="flex gap-1 mb-2 justify-center">
                  {[1,2,3,4,5].map(star => (
                    <button key={star}
                      onClick={() => setReviewDialog(prev => ({...prev, myRating: star, hasChanges: true}))}
                      style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: star <= reviewDialog.myRating ? '#f59e0b' : '#d1d5db' }}
                    >★</button>
                  ))}
                </div>
                {/* Text */}
                <textarea
                  value={reviewDialog.myText}
                  onChange={(e) => setReviewDialog(prev => ({...prev, myText: e.target.value, hasChanges: true}))}
                  placeholder={t('reviews.writeReview')}
                  rows={2}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', resize: 'vertical' }}
                ></textarea>
              </div>
              
              {/* All Reviews */}
              <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: '40vh' }}>
                <h4 className="text-xs font-bold text-gray-500 mb-2">{t('reviews.allReviews')} ({reviewDialog.reviews.length})</h4>
                {reviewDialog.reviews.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">{t('reviews.noReviews')}</p>
                ) : (
                  reviewDialog.reviews.map((review, idx) => {
                    const isMe = review.odvisitorId === visitorId;
                    return (
                      <div key={idx} className={`p-2 rounded-lg mb-2 ${isMe ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-gray-700">{isMe ? '👤 ' + review.userName : review.userName}</span>
                            {review.rating > 0 && <span className="text-amber-500 text-xs">{'★'.repeat(review.rating)}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-gray-400">{new Date(review.timestamp).toLocaleDateString()}</span>
                            {isMe && (
                              <button onClick={deleteMyReview} className="text-red-400 hover:text-red-600 text-xs" title={t('reviews.deleteReview')}>🗑️</button>
                            )}
                          </div>
                        </div>
                        {review.text && <p className="text-xs text-gray-600">{review.text}</p>}
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Footer Buttons */}
              <div className="p-3 border-t flex gap-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-bold text-sm text-gray-600 hover:bg-gray-50"
                >{t('reviews.cancel')}</button>
                <button
                  onClick={saveReview}
                  disabled={reviewDialog.myRating === 0 && !reviewDialog.myText.trim()}
                  className="flex-1 px-4 py-2 rounded-lg font-bold text-sm text-white"
                  style={{ background: (reviewDialog.myRating > 0 || reviewDialog.myText.trim()) ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#d1d5db', cursor: (reviewDialog.myRating > 0 || reviewDialog.myText.trim()) ? 'pointer' : 'not-allowed' }}
                >⭐ {t('reviews.save')}</button>
              </div>
            </div>
          </div>
        );
      })()}

        {/* ===== QUICK CAPTURE DIALOG (Light) ===== */}
        {showQuickCapture && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ overflow: 'auto' }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>📸 {t('trail.capturePlace')}</span>
                <button onClick={() => setShowQuickCapture(false)} style={{ color: 'white', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '12px 16px', flex: 1 }}>
                {/* Nearest stop indicator */}
                {newLocation.gpsLoading && (
                  <div style={{ padding: '6px 10px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '8px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                    📍 {t('trail.detectingLocation')}...
                  </div>
                )}
                {newLocation.nearestStop && !newLocation.gpsLoading && (
                  <div style={{ padding: '6px 10px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '8px', fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                      {String.fromCharCode(65 + newLocation.nearestStop.idx)}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t('trail.nearStop')} <b>{newLocation.nearestStop.name}</b>
                    </span>
                    <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0 }}>
                      {newLocation.nearestStop.dist < 1000 ? `${newLocation.nearestStop.dist}m` : `${(newLocation.nearestStop.dist/1000).toFixed(1)}km`}
                    </span>
                  </div>
                )}
                {!newLocation.nearestStop && !newLocation.gpsLoading && newLocation.lat && (
                  <div style={{ padding: '6px 10px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '8px', fontSize: '11px', color: '#16a34a', textAlign: 'center' }}>
                    📍 GPS ✓
                  </div>
                )}
                {newLocation.gpsBlocked && (
                  <div style={{ padding: '6px 10px', background: '#fef3c7', borderRadius: '8px', marginBottom: '8px', fontSize: '11px', color: '#92400e', textAlign: 'center' }}>
                    📍 {t('trail.gpsBlocked')}
                  </div>
                )}
                {newLocation.uploadedImage ? (
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <img src={newLocation.uploadedImage} alt="" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '12px' }} />
                    <button
                      onClick={() => setNewLocation(prev => ({...prev, uploadedImage: null, lat: null, lng: null}))}
                      style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', fontSize: '14px', cursor: 'pointer' }}
                    >✕</button>
                    {newLocation.lat && newLocation.lng && (
                      <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', color: '#22c55e', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                        📍 GPS ✓
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      const result = await window.BKK.openCamera();
                      if (!result) return;
                      const compressed = await window.BKK.compressImage(result.dataUrl);
                      const updates = { uploadedImage: compressed };
                      const gps = await window.BKK.extractGpsFromImage(result.file);
                      if (gps && gps.lat !== 0 && gps.lng !== 0) {
                        updates.lat = gps.lat;
                        updates.lng = gps.lng;
                        const detected = window.BKK.getAreasForCoordinates(gps.lat, gps.lng);
                        if (detected.length > 0) { updates.areas = detected; updates.area = detected[0]; }
                      }
                      setNewLocation(prev => ({...prev, ...updates}));
                      window.BKK.saveImageToDevice(result.dataUrl, `foufou_quick_${Date.now()}.jpg`);
                    }}
                    style={{ width: '100%', padding: '24px', border: '2px dashed #22c55e', borderRadius: '12px', background: '#f0fdf4', cursor: 'pointer', textAlign: 'center', marginBottom: '10px' }}
                  >
                    <span style={{ fontSize: '40px', display: 'block' }}>📸</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a' }}>{t('general.takePhoto')}</span>
                  </button>
                )}

                {/* Optional description — right after photo */}
                <div style={{ marginBottom: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newLocation.description || ''}
                    onChange={(e) => setNewLocation(prev => ({...prev, description: e.target.value}))}
                    placeholder={`📝 ${t("places.description")} (${t("general.optional")})`}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                  />
                  {window.BKK.speechSupported && (
                    <button
                      onClick={() => {
                        if (isRecording) {
                          if (stopRecordingRef.current) stopRecordingRef.current();
                          stopRecordingRef.current = null;
                          setIsRecording(false);
                        } else {
                          setIsRecording(true);
                          const stop = window.BKK.startSpeechToText({
                            maxDuration: 10000,
                            onResult: (text, isFinal) => {
                              setNewLocation(prev => ({...prev, description: text}));
                            },
                            onEnd: (finalText) => {
                              setIsRecording(false);
                              stopRecordingRef.current = null;
                            },
                            onError: (error) => {
                              setIsRecording(false);
                              stopRecordingRef.current = null;
                              if (error === 'not-allowed') {
                                showToast('🎤 ' + t('speech.micPermissionDenied'), 'error');
                              }
                            }
                          });
                          stopRecordingRef.current = stop;
                        }
                      }}
                      style={{
                        width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: isRecording ? '#ef4444' : '#f3f4f6',
                        color: isRecording ? 'white' : '#6b7280',
                        fontSize: '18px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: isRecording ? 'pulse 1s ease-in-out infinite' : 'none',
                        boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.3)' : 'none'
                      }}
                      title={isRecording ? t('speech.stopRecording') : t('speech.startRecording')}
                    >
                      {isRecording ? '⏹️' : '🎤'}
                    </button>
                  )}
                </div>

                {/* Interest Selection — pick one */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>{t('trail.whatDidYouSee')}</div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {allInterestOptions.filter(option => interestStatus[option.id] !== false).map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          const updates = { ...newLocation, interests: [option.id] };
                          const result = window.BKK.generateLocationName(
                            option.id, newLocation.lat, newLocation.lng,
                            interestCounters, allInterestOptions, areaOptions
                          );
                          if (result.name) updates.name = result.name;
                          setNewLocation(updates);
                          if (activeTrail) {
                            const updatedTrail = { ...activeTrail, lastInterest: option.id };
                            setActiveTrail(updatedTrail);
                            localStorage.setItem('foufou_active_trail', JSON.stringify(updatedTrail));
                          }
                        }}
                        className={`p-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          (newLocation.interests || []).includes(option.id)
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-white border border-gray-300'
                        }`}
                      >
                        <span className="text-lg block">{option.icon?.startsWith?.('data:') ? <img src={option.icon} alt="" className="w-5 h-5 object-contain mx-auto" /> : option.icon}</span>
                        <span className="text-[7px] block truncate leading-tight mt-0.5">{tLabel(option)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-generated name (info only) */}
                {newLocation.name && (
                  <div style={{ padding: '6px 10px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', color: '#6b7280' }}>
                    📝 {newLocation.name}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowQuickCapture(false)}
                    style={{
                      padding: '14px 20px', border: 'none', borderRadius: '12px',
                      fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                      background: '#fee2e2', color: '#dc2626'
                    }}
                  >
                    {t('general.cancel')}
                  </button>
                  <button
                    onClick={() => {
                      if (!newLocation.uploadedImage) {
                        showToast('📸 ' + t('trail.photoRequired'), 'warning');
                        return;
                      }
                      if (!newLocation.interests || newLocation.interests.length === 0) {
                        const defaultInterest = activeTrail?.interests?.[0] || 'spotted';
                        newLocation.interests = [defaultInterest];
                      }
                      if (!newLocation.name.trim()) {
                        const result = window.BKK.generateLocationName(
                          newLocation.interests[0], newLocation.lat, newLocation.lng,
                          interestCounters, allInterestOptions, areaOptions
                        );
                        newLocation.name = result?.name || ('Spotted #' + Date.now().toString().slice(-4));
                      }
                      saveWithDedupCheck(true, true);
                    }}
                    disabled={!newLocation.uploadedImage}
                    style={{
                      flex: 1, padding: '14px', border: 'none', borderRadius: '12px',
                      fontSize: '16px', fontWeight: 'bold',
                      cursor: newLocation.uploadedImage ? 'pointer' : 'not-allowed',
                      background: newLocation.uploadedImage ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#e5e7eb',
                      color: newLocation.uploadedImage ? 'white' : '#9ca3af',
                      boxShadow: newLocation.uploadedImage ? '0 4px 15px rgba(34,197,94,0.4)' : 'none'
                    }}
                  >
                    {`✅ ${t('trail.saveAndContinue')}`}
                  </button>
                </div>
              </div>
          </div>
        )}

        {/* Reorder Stops Dialog */}
        {showRoutePreview && route?.stops && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={() => { setRoute(prev => prev ? { ...prev, stops: reorderOriginalStopsRef.current || prev.stops } : prev); setShowRoutePreview(false); }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }} />
            <div style={{ position: 'relative', width: '92%', maxWidth: '420px', maxHeight: '85vh', background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b21a8' }}>{'≡ ' + t('route.reorderStops')}</span>
                <button onClick={() => { setRoute(prev => prev ? { ...prev, stops: reorderOriginalStopsRef.current || prev.stops } : prev); setShowRoutePreview(false); }}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280', padding: '0 4px' }}>✕</button>
              </div>
              
              {/* Scrollable stop list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                {(() => {
                  const activeStops = route.stops.filter(s => !isStopDisabled(s));
                  const moveStop = (fromActiveIdx, toActiveIdx) => {
                    if (toActiveIdx < 0 || toActiveIdx >= activeStops.length) return;
                    const activeIndices = route.stops.map((s, i) => ({ s, i })).filter(x => !isStopDisabled(x.s));
                    const newStops = [...route.stops];
                    const fromOrig = activeIndices[fromActiveIdx].i;
                    const [moved] = newStops.splice(fromOrig, 1);
                    const updatedActiveIndices = newStops.map((s, i) => ({ s, i })).filter(x => !isStopDisabled(x.s));
                    const targetPos = toActiveIdx < updatedActiveIndices.length ? updatedActiveIndices[toActiveIdx].i : newStops.length;
                    newStops.splice(targetPos, 0, moved);
                    setRoute(prev => ({ ...prev, stops: newStops }));
                  };
                  return activeStops.map((stop, idx) => (
                    <div key={stop.name + idx}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '4px', background: 'white', borderRadius: '10px', border: '2px solid #e5e7eb' }}
                    >
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', 
                        background: idx === 0 ? '#22c55e' : idx === activeStops.length - 1 ? '#ef4444' : '#8b5cf6',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                      }}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 'bold', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stop.name}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                        <button
                          onClick={() => moveStop(idx, idx - 1)}
                          disabled={idx === 0}
                          style={{ width: '28px', height: '24px', borderRadius: '4px', border: 'none', cursor: idx === 0 ? 'default' : 'pointer',
                            background: idx === 0 ? '#f3f4f6' : '#ede9fe', color: idx === 0 ? '#d1d5db' : '#7c3aed',
                            fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >▲</button>
                        <button
                          onClick={() => moveStop(idx, idx + 1)}
                          disabled={idx === activeStops.length - 1}
                          style={{ width: '28px', height: '24px', borderRadius: '4px', border: 'none', cursor: idx === activeStops.length - 1 ? 'default' : 'pointer',
                            background: idx === activeStops.length - 1 ? '#f3f4f6' : '#ede9fe', color: idx === activeStops.length - 1 ? '#d1d5db' : '#7c3aed',
                            fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >▼</button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Footer: Update + Cancel */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const orig = reorderOriginalStopsRef.current;
                    const curr = route.stops;
                    const changed = orig && curr && (orig.length !== curr.length || orig.some((s, i) => s.name !== curr[i]?.name));
                    setShowRoutePreview(false);
                    if (changed) {
                      setRoute(prev => prev ? { ...prev, optimized: false } : prev);
                      showToast(t('route.orderUpdated'), 'success');
                    }
                  }}
                  style={{ flex: 1, padding: '10px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {t('general.update')}
                </button>
                <button
                  onClick={() => {
                    setRoute(prev => prev ? { ...prev, stops: reorderOriginalStopsRef.current || prev.stops } : prev);
                    setShowRoutePreview(false);
                  }}
                  style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {t('general.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Dedup Results Dialog */}
        {bulkDedupResults && bulkDedupResults.length > 0 && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', maxWidth: '440px', width: '100%', maxHeight: '85vh', overflow: 'auto', padding: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>🔍 {t('dedup.title')} ({bulkDedupResults.length})</h3>
                <button onClick={() => setBulkDedupResults(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
              </div>
              
              {bulkDedupResults.map((cluster, ci) => {
                const allPlaces = [cluster.loc, ...cluster.matches];
                return (
                <div key={ci} style={{ marginBottom: '12px', padding: '10px', background: '#fefce8', border: '2px solid #eab308', borderRadius: '12px' }}>
                  <div style={{ fontSize: '9px', color: '#92400e', fontWeight: 'bold', marginBottom: '6px', textAlign: 'center' }}>
                    {allPlaces.length} {t('route.places')} · {cluster.matches[0]?._distance || 0}m
                  </div>
                  {allPlaces.map((loc, li) => {
                    const interest = allInterestOptions.find(o => loc.interests?.includes(o.id));
                    const icon = interest?.icon?.startsWith?.('data:') ? '📍' : (interest?.icon || '📍');
                    return (
                    <div key={li} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', marginBottom: '4px', background: 'white', borderRadius: '8px', border: '1px solid #fde68a', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
                      <span style={{ fontSize: '16px' }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</div>
                        <div style={{ fontSize: '9px', color: '#9ca3af' }}>{loc.description || loc.area || ''}</div>
                      </div>
                      <button
                        onClick={() => mergeDedupLocations(allPlaces.find(p => p.id !== loc.id)?.id || cluster.loc.id, loc.id)}
                        style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        🗑️
                      </button>
                    </div>
                    );
                  })}
                </div>
                );
              })}
              
              <button onClick={() => setBulkDedupResults(null)}
                style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #6b7280, #4b5563)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>
                {t('dedup.close')}
              </button>
            </div>
          </div>
        )}




      </div>
    </div>
  );
};

// Wait for Firebase, then init and render
window.__firebaseReady.then(function(sdkLoaded) {
  if (sdkLoaded) initFirebase();
  window.addEventListener('beforeunload', function(e) { e.preventDefault(); e.returnValue = ''; return ''; });
  window.BKK._navHistory = [];
  window.BKK._historyDepth = 0;
  window.BKK.pushNavState = function(state) {
    var last = window.BKK._navHistory[window.BKK._navHistory.length - 1];
    if (last && last.view === state.view && last.wizardStep === state.wizardStep && last.wizardMode === state.wizardMode) return;
    window.BKK._navHistory.push(state);
    window.BKK._historyDepth++;
    window.history.pushState({ appNav: true, depth: window.BKK._historyDepth }, '', window.location.href);
  };
  window.BKK.getNavBack = function() {
    if (window.BKK._navHistory.length > 1) { window.BKK._navHistory.pop(); return window.BKK._navHistory[window.BKK._navHistory.length - 1]; }
    return null;
  };
  window.addEventListener('popstate', function(e) {
    window.BKK._historyDepth = Math.max(0, window.BKK._historyDepth - 1);
    var prev = window.BKK.getNavBack();
    if (prev) window.dispatchEvent(new CustomEvent('app-nav-back', { detail: prev }));
    while (window.BKK._historyDepth < 2) { window.BKK._historyDepth++; window.history.pushState({ appNav: true, depth: window.BKK._historyDepth, cushion: true }, '', window.location.href); }
  });
  window.history.replaceState({ appNav: true, depth: 0 }, '', window.location.href);
  window.history.pushState({ appNav: true, depth: 1, cushion: true }, '', window.location.href);
  window.history.pushState({ appNav: true, depth: 2, cushion: true }, '', window.location.href);
  window.BKK._historyDepth = 2;
  ReactDOM.createRoot(document.getElementById('root')).render(<FouFouApp />);
});
