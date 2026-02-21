
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
                  uploadedImage: null, imageUrls: [], inProgress: true,
                  nearestStop: null, gpsLoading: true
                };
                setNewLocation(initLocation);
                setShowQuickCapture(true);
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
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
                    () => {
                      setNewLocation(prev => ({...prev, gpsLoading: false, gpsBlocked: true}));
                    },
                    { enableHighAccuracy: true, timeout: 8000 }
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
                  // Reopen Google Maps with the route
                  if (activeTrail.stops?.length >= 2) {
                    const coords = activeTrail.stops.map(s => `${s.lat},${s.lng}`).join('/');
                    window.open(`https://www.google.com/maps/dir/${coords}`, 'city_explorer_map');
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
                <button onClick={() => { setWizardMode(false); localStorage.setItem('bangkok_wizard_mode', 'false'); }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline' }}>
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
                          if (step < 3) { setRoute(null); setCurrentView('form'); }
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
                
                {/* Map button */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
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
                
                {/* Radius - search near me */}
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setFormData({...formData, searchMode: 'radius', radiusMeters: 1000, currentLat: pos.coords.latitude, currentLng: pos.coords.longitude, radiusPlaceName: t('wizard.myLocation'), radiusSource: 'gps'});
                          showToast(t('wizard.locationFound'), 'success');
                        },
                        () => showToast(t('toast.locationInaccessible'), 'warning')
                      );
                    }
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr',
                    border: formData.searchMode === 'radius' ? '2px solid #2563eb' : '1.5px solid #e5e7eb',
                    background: formData.searchMode === 'radius' ? '#eff6ff' : 'white',
                    marginBottom: '4px', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#2563eb' }}>{`📍 ${t("general.nearMe")}`}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>GPS (1km)</div>
                </button>

                {/* Continue button */}
                <button
                  onClick={() => { setWizardStep(2); window.scrollTo(0, 0); }}
                  disabled={!formData.area && formData.searchMode !== 'radius'}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', cursor: formData.area || formData.searchMode === 'radius' ? 'pointer' : 'not-allowed',
                    background: formData.area || formData.searchMode === 'radius' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#d1d5db',
                    color: 'white', fontSize: '16px', fontWeight: 'bold', boxShadow: formData.area || formData.searchMode === 'radius' ? '0 4px 6px rgba(37,99,235,0.3)' : 'none'
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
                    if (formData.searchMode === 'radius') return t('form.radius');
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
                    onClick={() => { generateRoute(); setWizardStep(3); window.scrollTo(0, 0); }}
                    disabled={formData.interests.length === 0}
                    style={{
                      flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                      cursor: formData.interests.length > 0 ? 'pointer' : 'not-allowed',
                      background: formData.interests.length > 0 ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#d1d5db',
                      color: 'white', fontSize: '14px', fontWeight: 'bold',
                      boxShadow: formData.interests.length > 0 ? '0 4px 6px rgba(37,99,235,0.3)' : 'none'
                    }}
                  >{`🔍 ${t('wizard.findPlaces')} (${formData.maxStops})`}</button>
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
            className={`hidden sm:flex flex-1 min-w-0 py-1.5 px-1 rounded-lg font-medium transition text-[9px] sm:text-xs leading-tight ${
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

        {/* Wizard Step 3: breadcrumb with back link */}
        {wizardMode && wizardStep === 3 && !isGenerating && !activeTrail && (
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            fontSize: '11px', color: '#9ca3af', marginBottom: '6px', flexWrap: 'wrap'
          }}>
            <span
              onClick={() => { setWizardStep(2); setRoute(null); setCurrentView('form'); window.scrollTo(0, 0); }}
              style={{ cursor: 'pointer', color: '#3b82f6', fontWeight: '600', textDecoration: 'underline' }}
            >{currentLang === 'he' ? '→' : '←'} {t("general.back")}</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span
              onClick={() => { setWizardStep(1); setRoute(null); setCurrentView('form'); window.scrollTo(0, 0); }}
              style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#d1d5db' }}
            >📍 {(() => {
              if (formData.searchMode === 'all') return t('wizard.allCity');
              if (formData.searchMode === 'radius') return t('form.radius');
              const area = (window.BKK.areaOptions || []).find(a => a.id === formData.area);
              return area ? tLabel(area) : '';
            })()}</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span
              onClick={() => { setWizardStep(2); setRoute(null); setCurrentView('form'); window.scrollTo(0, 0); }}
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

        {/* QUICK LAUNCH — "Yalla" fast path, shown in wizard step 3 when route is loaded, hidden after manual config */}
        {wizardMode && wizardStep === 3 && !isGenerating && route && route.stops?.length > 0 && !activeTrail && !route.optimized && disabledStops.length === 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '14px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{`🐾 ${route.stops.length} ${t('wizard.placesFound')}`}</span>
            </div>

            {/* Yalla - quick go */}
            <button
              onClick={() => {
                const isCircular = formData.searchMode === 'radius';
                setRouteType(isCircular ? 'circular' : 'linear');
                let autoStart = null;
                if (formData.searchMode === 'radius' && formData.gpsLat && formData.gpsLng) {
                  autoStart = { lat: formData.gpsLat, lng: formData.gpsLng, address: t('wizard.myLocation') };
                } else {
                  const firstWithCoords = route.stops.find(s => s.lat && s.lng);
                  if (firstWithCoords) autoStart = { lat: firstWithCoords.lat, lng: firstWithCoords.lng, address: firstWithCoords.name };
                }
                if (!autoStart) { showToast(t('form.chooseStartBeforeCalc'), 'warning'); return; }
                setFormData(prev => ({...prev, startPoint: `${autoStart.lat},${autoStart.lng}`}));
                
                // Smart selection: pick best stops per interest based on category/maxStops
                const allStopsWithCoords = route.stops.filter(s => s.lat && s.lng);
                const { selected: smartStops, disabled: smartDisabled } = smartSelectStops(allStopsWithCoords, formData.interests);
                
                if (smartStops.length < 2) { showToast(t('places.noPlacesWithCoords'), 'warning'); return; }
                
                // Disable the stops that smartSelect didn't pick
                const newDisabled = smartDisabled.map(s => (s.name || '').toLowerCase().trim());
                setDisabledStops(newDisabled);
                
                // Optimize geographic order
                const optimized = optimizeStopOrder(smartStops, autoStart, isCircular);
                
                setRoute({ ...route, stops: [...optimized, ...smartDisabled], circular: isCircular, optimized: true, startPoint: autoStart.address, startPointCoords: autoStart });
                const urls = window.BKK.buildGoogleMapsUrls(
                  optimized.map(s => ({ lat: s.lat, lng: s.lng, name: s.name })),
                  `${autoStart.lat},${autoStart.lng}`, isCircular, window.BKK.googleMaxWaypoints || 12
                );
                startActiveTrail(optimized, formData.interests, formData.area);
                if (urls.length > 0) window.open(urls[0].url, 'city_explorer_map');
                showToast(`🚀 ${optimized.length} ${t('route.stops')} (${isCircular ? t('route.circular') : t('route.linear')})`, 'success');
              }}
              style={{
                width: '100%', padding: '14px', border: '2px solid #22c55e', borderRadius: '14px',
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#15803d',
                fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'start',
                direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr'
              }}
            >
              <span style={{ fontSize: '24px' }}>🚀</span>
              <div>
                <div>{t('wizard.yallaGo')}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'normal' }}>{t('wizard.yallaDesc')}</div>
              </div>
            </button>

            {/* Hint: scroll down for manual */}
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
              {t('wizard.orScrollToCustomize')}
              <span style={{ display: 'block', fontSize: '14px', marginTop: '2px' }}>↓</span>
            </div>
          </div>
        )}

        {/* Form View */}

        {/* === VIEWS (from views.js) === */}
        {currentView === 'form' && (!wizardMode || wizardStep === 3) && !activeTrail && (
          <div className="view-fade-in bg-white rounded-xl shadow-lg p-3 space-y-3">
            {/* Form inputs - hidden in wizard step 3 */}
            {!wizardMode && (<>
            {/* City selector for advanced mode */}
            {Object.values(window.BKK.cities || {}).filter(c => c.active !== false).length > 1 && (
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
                onClick={() => { setWizardMode(true); setWizardStep(1); localStorage.setItem('bangkok_wizard_mode', 'true'); setRoute(null); }}
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
                    onClick={() => setFormData({...formData, searchMode: 'radius'})}
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
                          // Restore GPS coords if available
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
                          // Restore place coords if available
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
                          if (!navigator.geolocation) {
                            showToast(t('toast.browserNoLocation'), 'error');
                            return;
                          }
                          setIsLocating(true);
                          navigator.geolocation.getCurrentPosition(
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
                            (error) => {
                              setIsLocating(false);
                              showToast(error.code === 1 ? t('places.noLocationPermission') : t('toast.locationUnavailable'), 'error');
                            },
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
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
                      console.log(`[INTEREST-FILTER] ${option.id} "${tLabel(option)}" HIDDEN: valid=${valid} scope=${option.scope||'global'}/${scopeOk} status=${interestStatus[option.id]}/${statusOk} privateOnly=${option.privateOnly}`);
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
                disabled={formData.interests.length === 0 || (formData.searchMode === 'radius' && !formData.currentLat)}
                style={{ width: '100%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                  opacity: (formData.interests.length === 0 || (formData.searchMode === 'radius' && !formData.currentLat)) ? 0.5 : 1
                }}
              >
                {isGenerating ? t('general.searching') : `🔍 ${t('wizard.findPlaces')} (${formData.maxStops})`}
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
                {/* Help link instead of inline legend */}
                {showRoutePreview ? (
                  /* FLAT ROUTE PREVIEW - Drag to reorder */
                  <div className="max-h-96 overflow-y-auto" style={{ contain: 'content' }}>
                    <div className="bg-purple-50 rounded-lg p-2 mb-2 text-center">
                      <span className="text-xs text-purple-700 font-bold">{"☰ " + t('route.reorderStops') + " — " + t('route.dragToReorder')}</span>
                    </div>
                    {(() => {
                      const activeStops = route.stops.filter(s => 
                        !disabledStops.includes((s.name || '').toLowerCase().trim())
                      );
                      return activeStops.map((stop, idx) => {
                        const hasValidCoords = stop.lat && stop.lng && stop.lat !== 0 && stop.lng !== 0;
                        const originalIdx = route.stops.indexOf(stop);
                        return (
                          <div key={originalIdx} 
                            draggable="true"
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', String(idx));
                              e.dataTransfer.effectAllowed = 'move';
                              e.currentTarget.style.opacity = '0.4';
                            }}
                            onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; }}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#8b5cf6'; }}
                            onDragLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                              const toIdx = idx;
                              if (fromIdx === toIdx) return;
                              const activeIndices = route.stops.map((s, i) => ({ s, i })).filter(x => !disabledStops.includes((x.s.name || '').toLowerCase().trim()));
                              const newStops = [...route.stops];
                              const fromOrig = activeIndices[fromIdx].i;
                              const [moved] = newStops.splice(fromOrig, 1);
                              const updatedActiveIndices = newStops.map((s, i) => ({ s, i })).filter(x => !disabledStops.includes((x.s.name || '').toLowerCase().trim()));
                              const targetPos = toIdx < updatedActiveIndices.length ? updatedActiveIndices[toIdx].i : newStops.length;
                              newStops.splice(targetPos, 0, moved);
                              setRoute(prev => ({ ...prev, stops: newStops }));
                            }}
                            className="flex items-center gap-2 p-2 mb-1 bg-white rounded-lg border-2 border-gray-200 cursor-grab active:cursor-grabbing transition-colors" 
                            style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                          >
                            {/* Drag handle + Stop number */}
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', 
                              background: idx === 0 ? '#22c55e' : idx === activeStops.length - 1 ? '#ef4444' : '#8b5cf6',
                              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '13px', fontWeight: 'bold', flexShrink: 0, cursor: 'grab'
                            }}>
                              {String.fromCharCode(65 + idx)}
                            </div>
                            
                            {/* Stop name as hyperlink to Google Maps */}
                            <div className="flex-1 min-w-0">
                              {hasValidCoords ? (
                                <a href={window.BKK.getGoogleMapsUrl(stop)} target="city_explorer_map" rel="noopener noreferrer"
                                  className="text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline truncate block"
                                  onClick={(e) => e.stopPropagation()}
                                >{stop.name}</a>
                              ) : (
                                <div className="text-sm font-bold text-gray-800 truncate">{stop.name}</div>
                              )}
                              {stop.description && <div className="text-[10px] text-gray-500 truncate">{stop.description}</div>}
                            </div>
                            
                            {/* Drag indicator */}
                            <span style={{ color: '#9ca3af', fontSize: '16px', flexShrink: 0, cursor: 'grab' }}>☰</span>
                          </div>
                        );
                      });
                    })()}
                    {/* Mini map showing route order */}
                    <div style={{ height: '200px', borderRadius: '8px', marginTop: '8px', border: '1px solid #e5e7eb' }}
                      ref={(el) => {
                        if (!el) return;
                        if (el._leafletMap) { el._leafletMap.remove(); el._leafletMap = null; }
                        const activeStops = route.stops.filter(s => !disabledStops.includes((s.name || '').toLowerCase().trim()) && s.lat && s.lng);
                        if (activeStops.length === 0) return;
                        setTimeout(() => {
                          try {
                            const L = window.L;
                            if (!L || !el.offsetHeight) return;
                            const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([activeStops[0].lat, activeStops[0].lng], 13);
                            L.tileLayer(window.BKK.getTileUrl(), { maxZoom: 18 }).addTo(map);
                            const colors = ['#3b82f6','#f59e0b','#ef4444','#10b981','#ec4899','#6366f1','#8b5cf6','#06b6d4','#f97316','#a855f7'];
                            const mkrs = [];
                            activeStops.forEach((stop, i) => {
                              const c = colors[i % colors.length];
                              mkrs.push(L.circleMarker([stop.lat, stop.lng], { radius: 8, color: c, fillColor: c, fillOpacity: 0.85, weight: 2 }).addTo(map));
                              L.marker([stop.lat, stop.lng], { icon: L.divIcon({ className: '', html: '<div style="font-size:8px;font-weight:bold;text-align:center;color:white;width:16px;height:16px;line-height:16px;border-radius:50%;background:'+c+';border:1.5px solid white;">'+window.BKK.stopLabel(i)+'</div>', iconSize:[16,16], iconAnchor:[8,8] }) }).addTo(map);
                            });
                            if (activeStops.length > 1) L.polyline(activeStops.map(s => [s.lat, s.lng]), { color: '#6366f1', weight: 2, opacity: 0.5, dashArray: '4,6' }).addTo(map);
                            if (mkrs.length > 0) map.fitBounds(L.featureGroup(mkrs).getBounds().pad(0.15));
                            el._leafletMap = map;
                          } catch(e) { console.error('[MINI-MAP]', e); }
                        }, 100);
                      }}
                    ></div>
                  </div>
                ) : (
                <div className="max-h-96 overflow-y-auto" style={{ contain: 'content' }}>
                  {(() => {
                    // Group stops by interest
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
                      
                      // For manual group, filter out stops that now have real interests
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
                                // Fetch more for this specific interest
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
                              const stopId = (stop.name || '').toLowerCase().trim();
                              const isDisabled = disabledStops.includes(stopId);
                              const isCustom = stop.custom;
                              const isAddedLater = stop.addedLater;
                              const isStartPoint = hasValidCoords && startPointCoords?.lat === stop.lat && startPointCoords?.lng === stop.lng;
                              
                              return (
                                <div key={stop.originalIndex} className="p-1.5 rounded border relative" style={{ 
                                  borderColor: isStartPoint ? '#e5e7eb' : !hasValidCoords ? '#ef4444' : isAddedLater ? '#60a5fa' : '#e5e7eb',
                                  borderWidth: isAddedLater ? '2px' : '1px',
                                  borderStyle: isAddedLater ? 'dashed' : 'solid',
                                  backgroundColor: !hasValidCoords ? '#fef2f2' : isAddedLater ? '#eff6ff' : '#fafafa'
                                }}>
                                  {/* Action buttons - positioned based on language direction */}
                                  <div style={{ position: 'absolute', top: '2px', display: 'flex', gap: '2px', ...(window.BKK.i18n.isRTL() ? { left: '2px' } : { right: '2px' }) }}>
                                    {/* Set as start point */}
                                    {hasValidCoords && !isDisabled && (
                                      <button
                                        onClick={() => {
                                          const displayText = stop.name || stop.description || `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`;
                                          setStartPointCoords({ lat: stop.lat, lng: stop.lng, address: stop.name });
                                          setFormData(prev => ({...prev, startPoint: displayText}));
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
                                          // Place was added - show edit/view button
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
                                        // Also check interest-level lock
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
                                      {isCustom && !wizardMode && (
                                        <span title={t("form.myPlace")} style={{ fontSize: '11px' }}>🎖️</span>
                                      )}
                                      {isAddedLater && !wizardMode && (
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
                )}
                
                <div className="mt-3 space-y-2">
                  {/* Add manual stop button */}
                  <button
                    onClick={() => setShowManualAddDialog(true)}
                    style={{ width: '100%',
                      height: '42px',
                      background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(20, 184, 166, 0.3)',
                      marginBottom: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t("route.addManualStop")}
                  </button>
                  
                  <button
                    onClick={() => {
                      const activeStops = route.stops.filter((s, i) => {
                        const isActive = !disabledStops.includes((s.name || '').toLowerCase().trim());
                        const hasValidCoords = s.lat && s.lng && s.lat !== 0 && s.lng !== 0;
                        return isActive && hasValidCoords;
                      });
                      if (activeStops.length === 0) {
                        showToast(t('places.noPlacesWithCoords'), 'warning');
                        return;
                      }
                      setMapStops(activeStops);
                      setMapMode('stops');
                      setShowMapModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '42px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                      marginBottom: '4px'
                    }}
                  >
                    {`${t("route.showStopsOnMap")} (${route.stops.filter(s => !disabledStops.includes((s.name || '').toLowerCase().trim()) && s.lat && s.lng).length})`}
                  </button>
                  
                  
                  {/* URL limit note */}
                  
                  {/* Route Type + Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Route Type Radio Buttons - Small and Simple */}
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '13px',
                      paddingRight: '4px'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="routeType"
                          checked={routeType === 'circular'}
                          onChange={() => {
                            setRouteType('circular');
                            if (route?.optimized) setRoute(prev => prev ? {...prev, optimized: false} : prev);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{t("route.circular")}</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="routeType"
                          checked={routeType === 'linear'}
                          onChange={() => {
                            setRouteType('linear');
                            if (route?.optimized) setRoute(prev => prev ? {...prev, optimized: false} : prev);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{t("general.linear")}</span>
                      </label>
                    </div>
                    
                    {/* Start Point + Calc Route + Google Maps - aligned grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label className="text-xs font-bold text-gray-700" style={{ textAlign: window.BKK.i18n.isRTL() ? 'right' : 'left' }}>{`📍 ${t("route.startPoint")}`}</label>
                      {/* Row 1: Start Point */}
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
                      <input
                        type="text"
                        value={formData.startPoint}
                        readOnly
                        onClick={() => setShowAddressDialog(true)}
                        placeholder={t("form.selectStartPoint")}
                        className="border border-gray-300 rounded-lg text-xs cursor-pointer hover:border-blue-400"
                        style={{ flex: 1, direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr', padding: '0 8px', height: '42px', backgroundColor: startPointCoords ? '#f0fdf4' : '#fff', minWidth: 0 }}
                      />
                      <button
                        onClick={() => {
                          if (formData.startPoint?.trim() || startPointCoords) {
                            setFormData({...formData, startPoint: ''});
                            setStartPointCoords(null);
                            if (route?.optimized) setRoute(prev => prev ? {...prev, optimized: false} : prev);
                          }
                        }}
                        style={{ width: '42px', height: '42px', borderRadius: '12px', border: 'none', backgroundColor: (formData.startPoint?.trim() || startPointCoords) ? '#ef4444' : '#e5e7eb', color: (formData.startPoint?.trim() || startPointCoords) ? 'white' : '#9ca3af', fontSize: '12px', fontWeight: 'bold', cursor: (formData.startPoint?.trim() || startPointCoords) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={t("general.clear")}
                      >
                        ✕
                      </button>
                      <button
                        onClick={() => setShowAddressDialog(true)}
                        style={{ width: '42px', height: '42px', borderRadius: '12px', border: 'none', backgroundColor: '#22c55e', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={t("form.searchAddress")}
                      >
                        🔍
                      </button>
                      <button
                        onClick={getMyLocation}
                        disabled={isLocating}
                        style={{ width: '42px', height: '42px', borderRadius: '12px', border: 'none', backgroundColor: isLocating ? '#d1d5db' : '#3b82f6', color: isLocating ? '#9ca3af' : 'white', fontSize: '14px', fontWeight: 'bold', cursor: isLocating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={t("form.findCurrentLocation")}
                      >
                        {isLocating ? '⏳' : '📍'}
                      </button>
                      </div>

                      {/* Row 1.5: Smart Select - "Help me plan" */}
                      {route.stops.length > 0 && !route.optimized && (
                      <button
                        onClick={() => {
                          const allStopsWithCoords = route.stops.filter(s => s.lat && s.lng);
                          if (allStopsWithCoords.length < 2) { showToast(t('places.noPlacesWithCoords'), 'warning'); return; }
                          const { selected, disabled } = smartSelectStops(allStopsWithCoords, formData.interests);
                          const newDisabled = disabled.map(s => (s.name || '').toLowerCase().trim());
                          setDisabledStops(newDisabled);
                          showToast(`🧠 ${t('route.smartSelected', { selected: selected.length, disabled: disabled.length })}`, 'success');
                        }}
                        style={{
                          width: '100%', height: '38px', borderRadius: '10px',
                          border: '2px solid #f59e0b', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                          color: '#b45309', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        🧠 {t('route.helpMePlan')}
                      </button>
                      )}

                      {/* Row 2: Calc Route + Reorder */}
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
                      <button
                        onClick={computeRoute}
                        disabled={!startPointCoords}
                        style={{
                          flex: 1,
                          height: '42px',
                          backgroundColor: startPointCoords ? '#7c3aed' : '#d1d5db',
                          color: startPointCoords ? 'white' : '#9ca3af',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          border: 'none',
                          boxShadow: startPointCoords ? '0 4px 6px rgba(124, 58, 237, 0.3)' : 'none',
                          cursor: startPointCoords ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {route?.optimized ? t('route.recalcRoute') : t('route.calcRoute')}
                      </button>
                      <button
                        onClick={() => setShowRoutePreview(!showRoutePreview)}
                        disabled={!route?.optimized}
                        style={{
                          height: '42px',
                          backgroundColor: showRoutePreview ? '#7c3aed' : route?.optimized ? '#a78bfa' : '#d1d5db',
                          color: route?.optimized ? 'white' : '#9ca3af',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          border: 'none',
                          cursor: route?.optimized ? 'pointer' : 'not-allowed',
                          whiteSpace: 'nowrap',
                          padding: '0 12px'
                        }}
                      >
                        {showRoutePreview ? `✓ ${t('route.backToList')}` : `☰ ${t('route.reorderStops')}`}
                      </button>
                      </div>

                      {/* Row 3: Google Maps + Save + Share */}
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', direction: window.BKK.i18n.isRTL() ? 'ltr' : 'rtl' }}>
                      <button
                        onClick={() => {
                          if (!route?.optimized) return;
                          const activeStops = (route.stops || []).filter(s => {
                            const isActive = !disabledStops.includes((s.name || '').toLowerCase().trim());
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
                          if (navigator.share) {
                            navigator.share({ title: routeName, text: shareText });
                          } else {
                            navigator.clipboard.writeText(shareText);
                            showToast(t('route.routeCopied'), 'success');
                          }
                        }}
                        style={{ width: '42px', height: '42px', borderRadius: '12px', border: 'none', background: route?.optimized ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#e5e7eb', color: route?.optimized ? 'white' : '#9ca3af', cursor: route?.optimized ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: route?.optimized ? '0 4px 6px rgba(37, 99, 235, 0.3)' : 'none' }}
                        title={t("general.shareRoute")}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={route?.optimized ? 'white' : '#9ca3af'}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={route?.optimized ? 'white' : '#9ca3af'} strokeWidth="2"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={route?.optimized ? 'white' : '#9ca3af'} strokeWidth="2"/></svg>
                      </button>
                      {route.name ? (
                        <button
                          disabled
                          style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#dcfce7', border: '2px solid #16a34a', fontSize: '16px', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title={`${t("route.savedAs")} ${route.name}`}
                        >
                          ✅
                        </button>
                      ) : (
                        <button
                          onClick={() => route?.optimized && quickSaveRoute()}
                          style={{ width: '42px', height: '42px', borderRadius: '12px', border: 'none', background: route?.optimized ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#e5e7eb', color: route?.optimized ? 'white' : '#9ca3af', cursor: route?.optimized ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: route?.optimized ? '0 4px 6px rgba(124, 58, 237, 0.3)' : 'none' }}
                          title={t("route.saveRoute")}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={route?.optimized ? 'white' : '#9ca3af'}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6v8M8 12l4 4 4-4" stroke={route?.optimized ? 'white' : '#9ca3af'} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      )}
                      {(() => {
                        const activeStops = route?.optimized ? route.stops.filter((stop) => {
                          const isActive = !disabledStops.includes((stop.name || '').toLowerCase().trim());
                          const hasValidCoords = stop.lat && stop.lng && stop.lat !== 0 && stop.lng !== 0;
                          return isActive && hasValidCoords;
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
                              flex: 1, height: '42px', backgroundColor: route?.optimized ? '#2563eb' : '#d1d5db',
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
                              // Save active trail before opening Google Maps
                              startActiveTrail(activeStops, formData.interests, formData.area);
                              showToast(`📸 ${t('trail.started')}`, 'success');
                              window.open(mapUrl, 'city_explorer_map');
                            }}
                          >
                            {`🗺️ ${t('route.openRouteInGoogle')}`}
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                          {urls.map((urlInfo, idx) => (
                            <button
                              key={idx}
                              id={idx === 0 ? "open-google-maps-btn" : undefined}
                              onClick={() => {
                                if (urlInfo.url.length > 2000) showToast(`${t('toast.urlTooLong')} (${urlInfo.url.length})`, 'warning');
                                // Save active trail on first part click
                                if (idx === 0) startActiveTrail(activeStops, formData.interests, formData.area);
                                window.open(urlInfo.url, 'city_explorer_map');
                              }}
                              style={{
                                flex: 1,
                                height: '42px',
                                backgroundColor: idx === 0 ? '#2563eb' : '#1d4ed8',
                                color: 'white', textAlign: 'center',
                                borderRadius: '12px', fontWeight: 'bold', fontSize: '12px',
                                border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                                cursor: 'pointer'
                              }}
                            >
                              {`🗺️ ${t('route.openRoutePartN').replace('{n}', urlInfo.part).replace('{total}', urlInfo.total)}`}
                            </button>
                          ))}
                          </div>
                        );
                      })()}
                      </div>
                    </div>
                    {!startPointCoords && (
                      <p style={{ fontSize: '10px', color: '#ef4444', textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}>
                        {`⬆️ ${t("form.chooseStartBeforeCalc")}`}
                      </p>
                    )}
                    {route?.optimized && (
                      <p style={{ fontSize: '10px', color: '#16a34a', textAlign: 'center', marginTop: '2px', marginBottom: '2px', fontWeight: 'bold' }}>
                        {`✅ ${t("route.routeCalculated")}`}
                      </p>
                    )}

                    </div>
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
                        className="w-full max-max-h-32 object-contain rounded-lg mt-2 cursor-pointer border-2 border-green-300"
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
                    
                    // Collect interest icons from route stops
                    const routeInterestIds = [...new Set((savedRoute.stops || []).flatMap(s => s.interests || []))];
                    
                    return (
                      <React.Fragment key={savedRoute.id}>
                        {showGroupHeader && (
                          <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded mt-2 mb-1">
                            📍 {groupKey}
                          </div>
                        )}
                        <div
                          className={`flex items-center justify-between gap-2 rounded-lg p-2 border ${
                            savedRoute.inProgress ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                          } hover:bg-blue-50 cursor-pointer`}
                          style={{ overflow: 'hidden' }}
                          onClick={() => loadSavedRoute(savedRoute)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-medium text-sm truncate">{savedRoute.name}</span>
                              {savedRoute.locked && isUnlocked && <span title={t("general.locked")} style={{ fontSize: '11px' }}>🔒</span>}
                              {savedRoute.inProgress && <span title={t("general.inProgress")} style={{ fontSize: '12px' }}>🛠️</span>}
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
            </div>
            
            {/* Custom Locations Section - Split by status */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-bold">{`${t("nav.myPlaces")} ${locationsLoading ? '(...)' : `(${cityCustomLocations.filter(l => l.status !== 'blacklist').length})`}`}</h3>
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
                        uploadedImage: null, imageUrls: [], inProgress: true,
                        nearestStop: null, gpsLoading: true
                      };
                      setNewLocation(initLocation);
                      setShowQuickCapture(true);
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            const detected = window.BKK.getAreasForCoordinates(lat, lng);
                            const areaUpdates = detected.length > 0 ? { areas: detected, area: detected[0] } : {};
                            setNewLocation(prev => ({...prev, lat, lng, gpsLoading: false, ...areaUpdates}));
                          },
                          () => setNewLocation(prev => ({...prev, gpsLoading: false, gpsBlocked: true})),
                          { enableHighAccuracy: true, timeout: 8000 }
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
              ) : cityCustomLocations.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">📍</div>
                  <p className="text-gray-600 text-sm">{t("places.noPlacesInCity", {cityName: tLabel(window.BKK.selectedCity) || t('places.thisCity')})}</p>
                  <p className="text-xs text-gray-500 mt-1">{t("places.addPlace")}</p>
                </div>
              ) : (
                <>
                  {/* Active Locations - Grouped (using memoized groupedPlaces) */}
                  {groupedPlaces.activeCount > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-bold text-green-700 mb-2">
                        {t("places.includedPlaces")} ({groupedPlaces.activeCount})
                      </h4>
                      <div className="max-h-[55vh] overflow-y-auto" style={{ contain: 'content' }}>
                        {groupedPlaces.sortedKeys.map(key => {
                          const locs = groupedPlaces.groups[key];
                          const obj = placesGroupBy === 'interest' 
                            ? (interestMap[key] || customInterests?.find(ci => ci.id === key))
                            : areaMap[key];
                          const groupLabel = obj ? tLabel(obj) : key;
                          const groupIcon = placesGroupBy === 'interest' ? (obj?.icon || '🏷️') : '📍';
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
                                          {loc.inProgress && <span className="text-orange-600" title={t("general.inProgress")} style={{ fontSize: '14px' }}>🛠️</span>}
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
                                        title={loc.locked && !isUnlocked ? t("general.viewOnly") : t("places.detailsEdit")}>{loc.locked && !isUnlocked ? "👁️" : "✏️"}</button>
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
                              No interest / manually added ({groupedPlaces.ungrouped.length})
                            </div>
                            <div className="p-1">
                              {groupedPlaces.ungrouped.map(loc => {
                                const mapUrl = (() => { const u = window.BKK.getGoogleMapsUrl(loc); return u === '#' ? null : u; })();
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
                                        {loc.inProgress && <span className="text-orange-600" title={t("general.inProgress")} style={{ fontSize: '14px' }}>🛠️</span>}
                                        {!isLocationValid(loc) && <span className="text-red-500 text-[9px]" title={t("places.missingDetails")}>❌</span>}
                                      </div>
                                    </div>
                                    <button onClick={() => handleEditLocation(loc)}
                                      className="text-xs px-1 py-0.5 rounded"
                                      title={loc.locked && !isUnlocked ? t("general.viewOnly") : t("places.detailsEdit")}>{loc.locked && !isUnlocked ? "👁️" : "✏️"}</button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Blacklisted Locations - Collapsible */}
                  {groupedPlaces.blacklistedLocations.length > 0 && (
                      <div className="border-2 border-red-300 rounded-lg p-2 bg-red-50">
                        <button
                          onClick={() => setShowBlacklistLocations(!showBlacklistLocations)}
                          className="w-full flex items-center justify-between text-sm font-bold text-red-700"
                        >
                          <span className="flex items-center gap-1">
                            <span>{showBlacklistLocations ? '▼' : '◀'}</span>
                            <span>{`🚫 ${t("places.skippedPlaces")} (`}{groupedPlaces.blacklistedLocations.length})</span>
                          </span>
                          <span className="text-[10px] text-red-600">
                            {showBlacklistLocations ? t('general.hide') : t('general.show')}
                          </span>
                        </button>
                        
                        {showBlacklistLocations && (
                          <div className="mt-2 max-h-40 overflow-y-auto">
                            {groupedPlaces.blacklistedLocations.map(loc => {
                              const mapUrl = (() => { const u = window.BKK.getGoogleMapsUrl(loc); return u === '#' ? null : u; })();
                              return (
                              <div
                                key={loc.id}
                                className="flex items-center justify-between gap-2 border border-red-300 rounded p-1.5 bg-white mb-0.5"
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
                                    {loc.interests?.map((int, idx) => {
                                      const obj = interestMap[int];
                                      return obj?.icon ? <span key={idx} title={obj.label} style={{ fontSize: '13px' }}>{obj.icon}</span> : null;
                                    })}
                                  </div>
                                </div>
                                <button onClick={() => handleEditLocation(loc)}
                                  className="text-xs px-1 py-0.5 rounded"
                                  title={loc.locked && !isUnlocked ? t("general.viewOnly") : t("places.detailsEdit")}>{loc.locked && !isUnlocked ? "👁️" : "✏️"}</button>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                  )}
                </>
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
                    setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, inProgress: false, locked: false, builtIn: false });
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
              // Helper to open interest dialog for editing
              const openInterestDialog = (interest, isCustom = false) => {
                const config = interestConfig[interest.id] || {};
                setEditingCustomInterest(isCustom ? interest : { ...interest, builtIn: true });
                setNewInterest({
                  id: interest.id,
                  label: tLabel(interest) || interest.name || '',
                  icon: interest.icon || '📍',
                  searchMode: config.textSearch ? 'text' : 'types',
                  types: (config.types || []).join(', '),
                  textSearch: config.textSearch || '',
                  blacklist: (config.blacklist || []).join(', '),
                  privateOnly: interest.privateOnly || false,
                  inProgress: interest.inProgress || false,
                  locked: interest.locked || false,
                  builtIn: !isCustom,
                  scope: config.scope || interest.scope || 'global',
                  cityId: config.cityId || interest.cityId || '',
                  category: config.category || interest.category || 'attraction',
                  weight: config.weight || interest.weight || ({'attraction':3,'break':1,'meal':1,'experience':1,'shopping':2,'nature':2}[config.category || interest.category || 'attraction'] || 2),
                  minStops: config.minStops != null ? config.minStops : (interest.minStops != null ? interest.minStops : 1)
                });
                setShowAddInterestDialog(true);
              };
              
              // Render a single interest row with toggle button
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
                      {interest.inProgress && <span className="text-orange-600 flex-shrink-0" title={t("general.inProgress")} style={{ fontSize: '12px' }}>🛠️</span>}
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
              
              // Collect active and inactive - apply config overrides to built-in
              const overriddenBuiltIn = interestOptions.map(i => {
                const cfg = interestConfig[i.id];
                if (!cfg) return i;
                return { ...i, label: cfg.labelOverride || i.label, icon: cfg.iconOverride || i.icon, inProgress: cfg.inProgress !== undefined ? cfg.inProgress : i.inProgress, locked: cfg.locked !== undefined ? cfg.locked : i.locked };
              });
              const overriddenUncovered = uncoveredInterests.map(i => {
                const cfg = interestConfig[i.id];
                if (!cfg) return i;
                return { ...i, label: cfg.labelOverride || i.label, icon: cfg.iconOverride || i.icon, inProgress: cfg.inProgress !== undefined ? cfg.inProgress : i.inProgress, locked: cfg.locked !== undefined ? cfg.locked : i.locked };
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
                        const cityCenter = city.center || { lat: 13.75, lng: 100.53 };
                        const map = L.map(container).setView([cityCenter.lat, cityCenter.lng], 12);
                        L.tileLayer(window.BKK.getTileUrl(), { attribution: '© OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
                        const colorPalette = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7', '#14b8a6', '#e11d48', '#84cc16', '#0ea5e9', '#d946ef', '#f43f5e'];
                        const allCircles = [];
                        areas.forEach((area, i) => {
                          const c = coords[area.id];
                          if (!c) return;
                          const color = colorPalette[i % colorPalette.length];
                          const circle = L.circle([c.lat, c.lng], { radius: c.radius, color, fillColor: color, fillOpacity: 0.15, weight: 2 }).addTo(map);
                          allCircles.push(circle);
                          const marker = L.marker([c.lat, c.lng], { draggable: true, title: tLabel(area) }).addTo(map);
                          marker.bindTooltip(tLabel(area), { permanent: true, direction: 'top', className: 'area-label-tooltip', offset: [0, -10] });
                          marker.on('dragend', () => {
                            const pos = marker.getLatLng();
                            const newLat = Math.round(pos.lat * 10000) / 10000;
                            const newLng = Math.round(pos.lng * 10000) / 10000;
                            area.lat = newLat; area.lng = newLng;
                            c.lat = newLat; c.lng = newLng;
                            circle.setLatLng(pos);
                            setCityModified(true); setCityEditCounter(c => c + 1);
                            setFormData(prev => ({...prev}));
                          });
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
                  <div id="settings-all-areas-map" style={{ height: '450px', borderRadius: '8px', border: '2px solid #3b82f6', marginBottom: '8px' }}></div>
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
                                  // Store original values for cancel
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
                                    <input type="number" step="0.1" value={area.distanceMultiplier || city.distanceMultiplier || 1.2}
                                      style={{ width: '40px', fontSize: '9px', padding: '1px 3px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                      onChange={(e) => { area.distanceMultiplier = parseFloat(e.target.value) || 1.2; const ac = window.BKK.areaCoordinates?.[area.id]; if (ac) ac.distanceMultiplier = area.distanceMultiplier; setFormData(prev => ({...prev})); }}
                                    />
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
                                    // Restore original values
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

            {/* Max Stops Setting */}
            <div className="mb-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-2">
                <h3 className="text-sm font-bold text-gray-800 mb-1">{`📍 ${t("settings.maxStops")}`}</h3>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxStops}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 12;
                    const clamped = Math.min(100, Math.max(1, val));
                    setFormData({...formData, maxStops: clamped});
                    try {
                      const database = window.BKK.database;
                      if (database && isUnlocked) database.ref('settings/maxStops').set(clamped);
                    } catch (err) { console.error('[SETTINGS] Error saving maxStops:', err); }
                  }}
                  className="w-20 p-1 border-2 border-blue-300 rounded text-center font-bold text-sm"
                  placeholder="10"
                />
                <span className="text-[10px] text-gray-500 mr-2">(1-100)</span>
              </div>
            </div>
            
            {/* Fetch More Count Setting - NEW */}
            <div className="mb-3">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-2">
                <h3 className="text-sm font-bold text-gray-800 mb-1">{`➕ ${t("route.moreFromCategory")}`}</h3>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.fetchMoreCount || 3}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 3;
                    const clamped = Math.min(100, Math.max(1, val));
                    setFormData({...formData, fetchMoreCount: clamped});
                    try {
                      const database = window.BKK.database;
                      if (database && isUnlocked) database.ref('settings/fetchMoreCount').set(clamped);
                    } catch (err) { console.error('[SETTINGS] Error saving fetchMoreCount:', err); }
                  }}
                  className="w-20 p-1 border-2 border-green-300 rounded text-center font-bold text-sm"
                  placeholder="5"
                />
                <span className="text-[10px] text-gray-500 mr-2">(1-100)</span>
              </div>
            </div>
            
            {/* Google Max Waypoints Setting (admin only) */}
            {isUnlocked && (
            <div className="mb-3">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400 rounded-lg p-2">
                <h3 className="text-sm font-bold text-gray-800 mb-1">{`🗺️ ${t("settings.googleMaxWaypoints")}`}</h3>
                <p className="text-[10px] text-gray-600 mb-1">{t("settings.googleMaxWaypointsDesc")}</p>
                <input
                  type="number"
                  min="4"
                  max="50"
                  value={googleMaxWaypoints}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 12;
                    const clamped = Math.min(50, Math.max(4, val));
                    setGoogleMaxWaypoints(clamped);
                    try {
                      const database = window.BKK.database;
                      if (database) database.ref('settings/googleMaxWaypoints').set(clamped);
                    } catch (err) { console.error('[SETTINGS] Error saving googleMaxWaypoints:', err); }
                  }}
                  className="w-20 p-1 border-2 border-orange-300 rounded text-center font-bold text-sm"
                  placeholder="12"
                />
                <span className="text-[10px] text-gray-500 mr-2">(4-50)</span>
              </div>
            </div>
            )}
            
            {/* Default Radius Setting */}
            <div className="mb-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-2">
                <h3 className="text-sm font-bold text-gray-800 mb-1">{`📍 ${t("settings.defaultRadius")}`}</h3>
                <p className="text-[10px] text-gray-600 mb-1">{t("settings.radiusDescription")}</p>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={formData.radiusMeters}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFormData({...formData, radiusMeters: val});
                    try {
                      const database = window.BKK.database;
                      if (database && isUnlocked) database.ref('settings/defaultRadius').set(val);
                    } catch (err) { console.error('[SETTINGS] Error saving defaultRadius:', err); }
                  }}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: '#ea580c' }}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-gray-400">100m</span>
                  <span className="text-sm font-bold text-blue-600">{formData.radiusMeters}m</span>
                  <span className="text-[10px] text-gray-400">2000m</span>
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
                        // Count active interests
                        const activeCount = Object.values(interestStatus).filter(Boolean).length;
                        
                        const data = {
                          // Custom interests created by user
                          customInterests: customInterests,
                          // Custom locations
                          customLocations: customLocations,
                          // Saved routes
                          savedRoutes: savedRoutes,
                          // Interest search configurations (types, textSearch, blacklist)
                          interestConfig: interestConfig,
                          // Interest active/inactive status
                          interestStatus: interestStatus,
                          // Metadata
                          exportDate: new Date().toISOString(),
                          version: window.BKK.VERSION || '2.8'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
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
            <div id="leaflet-map-container" style={{ flex: 1, minHeight: '350px', maxHeight: '70vh' }}></div>
            {/* Footer */}
            <div className="p-2 border-t text-center">
              <p className="text-[9px] text-gray-400">
                {mapMode === 'areas' 
                  ? `${(window.BKK.areaOptions || []).length} ${t('general.areas')}` 
                  : mapMode === 'stops'
                  ? `${mapStops.length} ${t('nav.myPlaces')} — ${t('route.clickForDetails')}`
                  : `${formData.radiusMeters}m - ${formData.radiusPlaceName || t('form.currentLocation')}`
                }
              </p>
            </div>
          </div>
        </div>
      )}

        {/* === DIALOGS (from dialogs.js) === */}
