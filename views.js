
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
        boxShadow: `0 2px 8px ${c}33`,
        position: 'relative'
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
          {/* Hamburger menu button - right in RTL, left in LTR */}
          <button
            onClick={() => setShowHeaderMenu(prev => !prev)}
            style={{
              position: 'absolute',
              [currentLang === 'he' ? 'right' : 'left']: '0',
              background: showHeaderMenu ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: '50%',
              width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '13px', color: 'white',
              transition: 'background 0.2s'
            }}
            title={t("general.menu")}
          >☰</button>
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
        {/* Header hamburger dropdown menu */}
        {showHeaderMenu && (<>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowHeaderMenu(false)} />
          <div style={{
            position: 'absolute', top: '100%', [currentLang === 'he' ? 'right' : 'left']: '0',
            background: 'white', borderRadius: '12px', marginTop: '4px', padding: '4px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)', zIndex: 50, minWidth: '150px'
          }}>
            {[
              { icon: '🗺️', label: t('nav.route'), view: 'form' },
              { icon: '💾', label: t('nav.saved'), view: 'saved', count: citySavedRoutes.length },
              { icon: '⭐', label: t('nav.favorites'), view: 'myPlaces', count: cityCustomLocations.filter(l => l.status !== 'blacklist').length },
              { icon: '🏷️', label: t('nav.myInterests'), view: 'myInterests', count: allInterestOptions.filter(o => {
                const aStatus = o.adminStatus || 'active';
                if (aStatus === 'hidden') return false;
                if (aStatus === 'draft' && !isUnlocked) return false;
                if (o.scope === 'local' && o.cityId && o.cityId !== selectedCityId) return false;
                if (!isInterestValid(o.id)) return false;
                const status = interestStatus[o.id];
                if (o.uncovered) return status === true;
                return status !== false;
              }).length },
              { icon: '⚙️', label: t('settings.title'), view: 'settings' },
            ].map(item => (
              <button
                key={item.view}
                onClick={() => {
                  if (item.view === 'settings' && !isAdmin) {
                    // Only admin can access settings
                    showToast(t('auth.needAdmin') || 'נדרשת הרשאת מנהל', 'warning');
                    setShowHeaderMenu(false);
                    return;
                  }
                  setCurrentView(item.view);
                  setShowHeaderMenu(false);
                  window.scrollTo(0, 0);
                }}
                style={{
                  width: '100%', textAlign: currentLang === 'he' ? 'right' : 'left',
                  background: currentView === item.view ? '#f3f4f6' : 'transparent',
                  border: 'none', borderRadius: '8px', padding: '8px 12px',
                  color: '#374151', fontSize: '13px', fontWeight: currentView === item.view ? '700' : '500',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'background 0.15s'
                }}
              >
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                <span>{item.label}{item.count > 0 ? ` (${item.count})` : ''}</span>
              </button>
            ))}
            {/* Divider + Auth button */}
            <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 8px' }}></div>
            <button
              onClick={() => { setShowLoginDialog(true); setShowHeaderMenu(false); }}
              style={{
                width: '100%', textAlign: currentLang === 'he' ? 'right' : 'left',
                background: 'transparent', border: 'none', borderRadius: '8px', padding: '8px 12px',
                color: '#374151', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <span style={{ fontSize: '15px' }}>{authUser ? '👤' : '🔑'}</span>
              <span>{authUser ? (authUser.displayName || authUser.email || (t('auth.anonymous') || 'אנונימי')) : (t('auth.signIn') || 'התחבר')}</span>
              {authUser && <span style={{ fontSize: '9px', marginRight: 'auto', marginLeft: '4px', padding: '1px 5px', borderRadius: '4px', background: isAdmin ? '#fef2f2' : isEditor ? '#f3e8ff' : '#f3f4f6', color: isAdmin ? '#dc2626' : isEditor ? '#7c3aed' : '#9ca3af' }}>{isAdmin ? 'Admin' : isEditor ? 'Editor' : ''}{roleOverride !== null ? ' 🎭' : ''}</span>}
            </button>
            {isRealAdmin && (
              <button
                onClick={() => { setShowUserManagement(true); authLoadAllUsers(); setShowHeaderMenu(false); }}
                style={{
                  width: '100%', textAlign: currentLang === 'he' ? 'right' : 'left',
                  background: 'transparent', border: 'none', borderRadius: '8px', padding: '8px 12px',
                  color: '#374151', fontSize: '13px', fontWeight: '500',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <span style={{ fontSize: '15px' }}>👥</span>
                <span>{t('auth.userManagement') || 'ניהול משתמשים'}</span>
              </button>
            )}
          </div>
        </>)}
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
        {activeTrail && currentView === 'form' && (
          <div className="view-fade-in">
            {/* Compact header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <button onClick={() => switchLanguage(currentLang === 'he' ? 'en' : 'he')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2px 8px', color: '#6b7280', fontSize: '10px', cursor: 'pointer' }}>
                {currentLang === 'he' ? '🇬🇧 EN' : '🇮🇱 עב'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>🐾 {t('trail.activeTitle')}</span>
                <button onClick={() => showHelpFor('activeTrail')} style={{ background: 'none', border: 'none', fontSize: '11px', cursor: 'pointer', color: '#3b82f6', marginInlineStart: '4px', textDecoration: 'underline' }}>{t('general.help')}</button>
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
                  {`📍 ${t('trail.stops')} (${activeTrail.stops.length - skippedTrailStops.size}/${activeTrail.stops.length})`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {(() => {
                    // Build sequential letter map: only active stops get letters
                    const trailLetterMap = {};
                    let tLetterIdx = 0;
                    activeTrail.stops.forEach((_, idx) => {
                      if (!skippedTrailStops.has(idx)) {
                        trailLetterMap[idx] = String.fromCharCode(65 + tLetterIdx);
                        tLetterIdx++;
                      }
                    });
                    return activeTrail.stops.slice(0, 12).map((stop, idx) => {
                    const isSkipped = skippedTrailStops.has(idx);
                    const letter = trailLetterMap[idx] || '';
                    const isFavorite = customLocations.find(cl => cl.name === stop.name || (cl.lat && stop.lat && Math.abs(cl.lat - stop.lat) < 0.0001 && Math.abs(cl.lng - stop.lng) < 0.0001));
                    const pk = (stop.name || '').replace(/[.#$/\\[\]]/g, '_');
                    const ra = isFavorite ? reviewAverages[pk] : null;
                    return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px',
                      background: isSkipped ? '#fef2f2' : '#f9fafb', borderRadius: '6px', fontSize: '11px',
                      opacity: isSkipped ? 0.5 : 1
                    }}>
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: isSkipped ? '#fecaca' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', fontWeight: 'bold', color: isSkipped ? '#dc2626' : '#6b7280', flexShrink: 0
                      }}>{letter}</span>
                      <span
                        onClick={() => {
                          if (isSkipped) return;
                          if (isFavorite) { handleEditLocation(isFavorite); }
                          else if (stop.lat && stop.lng) {
                            const url = window.BKK.getGoogleMapsUrl(stop);
                            if (url && url !== '#') window.open(url, '_blank');
                          }
                        }}
                        style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: isSkipped ? '#9ca3af' : '#2563eb',
                          cursor: isSkipped ? 'default' : 'pointer',
                          textDecoration: isSkipped ? 'line-through' : 'underline',
                          textDecorationStyle: isSkipped ? 'solid' : 'dotted'
                        }}>
                        {stop.name}
                      </span>
                      {/* Photo icon for favorites with image */}
                      {!isSkipped && isFavorite && isFavorite.uploadedImage && (
                        <button
                          onClick={() => { setModalImage(isFavorite.uploadedImage); setShowImageModal(true); }}
                          style={{ background: '#eff6ff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 2px', fontSize: '12px', flexShrink: 0 }}
                          title={t('general.clickForImage')}
                        >🖼️</button>
                      )}
                      {/* Star + rating */}
                      {!isSkipped && (
                        <button
                          onClick={() => {
                            if (isFavorite) { openReviewDialog(isFavorite); }
                            else {
                              const googleRating = stop.description && stop.description.match(/⭐\s*([\d.]+)\s*\((\d+)/);
                              const ratingInfo = googleRating ? `\n${t('trail.googleRating')}: ⭐ ${googleRating[1]} (${googleRating[2]} ${t('reviews.title')})` : '';
                              showConfirm(t('trail.addGoogleToFavorites').replace('{name}', stop.name) + ratingInfo, () => {
                                addGooglePlaceToCustom(stop).then(result => {
                                  if (result !== false) {
                                    setTimeout(() => {
                                      const added = customLocations.find(cl => cl.name.toLowerCase().trim() === stop.name.toLowerCase().trim()) ||
                                        customLocations.find(cl => cl.lat && stop.lat && Math.abs(cl.lat - stop.lat) < 0.0001 && Math.abs(cl.lng - stop.lng) < 0.0001);
                                      if (added) handleEditLocation(added);
                                    }, 500);
                                  }
                                });
                              });
                            }
                          }}
                          style={{
                            background: isFavorite ? 'none' : 'rgba(234,179,8,0.15)',
                            border: isFavorite ? 'none' : '1px dashed #eab308',
                            borderRadius: '4px', cursor: 'pointer', padding: '0 3px',
                            fontSize: isFavorite ? '11px' : '14px', flexShrink: 0,
                            color: isFavorite ? (ra ? '#f59e0b' : '#9ca3af') : '#eab308',
                            whiteSpace: 'nowrap'
                          }}
                          title={isFavorite ? t('trail.ratePlace') : t('trail.addToFavorites')}
                        >{isFavorite ? (ra ? `⭐ ${ra.avg.toFixed(1)} (${ra.count})` : '⭐') : '☆'}</button>
                      )}
                      <button
                        onClick={() => {
                          setSkippedTrailStops(prev => {
                            const next = new Set(prev);
                            if (next.has(idx)) next.delete(idx); else next.add(idx);
                            return next;
                          });
                        }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                          fontSize: '12px', flexShrink: 0, color: isSkipped ? '#22c55e' : '#dc2626'
                        }}
                        title={isSkipped ? t('trail.unskip') : t('trail.skip')}
                      >{isSkipped ? '▶️' : '⏸️'}</button>
                    </div>
                    );
                    });
                  })()}
                  {activeTrail.stops.length > 12 && (
                    <div style={{ fontSize: '9px', color: '#9ca3af', padding: '3px 6px' }}>
                      +{activeTrail.stops.length - 12}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              {/* Where Am I button */}
              <button
                onClick={() => {
                  if (!activeTrail.stops?.length) { showToast(t('trail.noStopsYet'), 'warning'); return; }
                  showToast(`📍 ${t('trail.locating')}...`, 'info');
                  if (navigator.geolocation) {
                    window.BKK.getValidatedGps(
                      (pos) => {
                        setMapUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
                        setMapStops(activeTrail.stops);
                        setMapSkippedStops(new Set(skippedTrailStops));
                        setMapMode('stops');
                        setShowMapModal(true);
                      },
                      () => {
                        // Even without GPS, show the stops on map
                        setMapUserLocation(null);
                        setMapStops(activeTrail.stops);
                        setMapSkippedStops(new Set(skippedTrailStops));
                        setMapMode('stops');
                        setShowMapModal(true);
                      }
                    );
                  } else {
                    setMapUserLocation(null);
                    setMapStops(activeTrail.stops);
                    setMapSkippedStops(new Set(skippedTrailStops));
                    setMapMode('stops');
                    setShowMapModal(true);
                  }
                }}
                style={{
                  flex: 1, padding: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white',
                  border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {`📍 ${t('trail.whereAmI')}`}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  // Reopen Google Maps with active (non-skipped) stops
                  const activeStops = activeTrail.stops?.filter((_, i) => !skippedTrailStops.has(i));
                  if (activeStops?.length >= 2) {
                    const coords = activeStops.map(s => `${s.lat},${s.lng}`).join('/');
                    window.open(`https://www.google.com/maps/dir//${coords}/data=!4m2!4m1!3e2`, 'city_explorer_map');
                  } else {
                    showToast(t('trail.needTwoStops'), 'warning');
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
        {!activeTrail && currentView === 'form' && (
          <div className={wizardStep < 3 ? "view-fade-in" : ""}>
            {/* Wizard Header — shown on all steps */}
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              {/* Step indicators + language toggle */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <button onClick={() => switchLanguage(currentLang === 'he' ? 'en' : 'he')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2px 8px', color: '#6b7280', fontSize: '10px', cursor: 'pointer' }}>
                  {currentLang === 'he' ? '🇬🇧 EN' : '🇮🇱 עב'}
                </button>
                <div style={{ width: '8px' }} />
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
            {/* Step 2: Choose Area (was step 1) */}
            {wizardStep === 2 && (
              <div className="bg-white rounded-xl shadow-lg p-3">
                {/* Breadcrumb: back to interests */}
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
                  >⭐ {formData.interests.slice(0, 3).map(id => {
                    const opt = allInterestOptions.find(o => o.id === id);
                    return opt ? (opt.icon || '') : '';
                  }).join(' ')}{formData.interests.length > 3 ? ` +${formData.interests.length - 3}` : ''} ({formData.interests.length})</span>
                </div>
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
                        // Switch tab immediately
                        setFormData({...formData, searchMode: 'radius', radiusMeters: formData.radiusMeters || 500});
                        // Then request GPS async
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

                {/* Generate + Map buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    onClick={() => {
                      setMapMode('favorites');
                      setMapFavArea(formData.searchMode === 'areas' && formData.area ? formData.area : null);
                      setMapFocusPlace(null);
                      setMapFavFilter(formData.interests.length > 0 ? new Set(formData.interests) : new Set());
                      setMapBottomSheet(null);
                      setMapReturnPlace(null);
                      setShowMapModal(true);
                    }}
                    style={{
                      padding: '14px 16px', borderRadius: '12px', border: '2px solid #c084fc',
                      cursor: 'pointer', background: 'white', color: '#7c3aed', fontSize: '15px', fontWeight: 'bold'
                    }}
                  >🗺️</button>
                  <button
                    onClick={() => { generateRoute(); setRouteChoiceMade(null); setWizardStep(3); window.scrollTo(0, 0); }}
                    disabled={!isDataLoaded || formData.interests.length === 0 || (formData.searchMode === 'radius' ? !formData.currentLat : (formData.searchMode === 'areas' && !formData.area))}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                      cursor: (isDataLoaded && formData.interests.length > 0 && (formData.searchMode === 'radius' ? formData.currentLat : true)) ? 'pointer' : 'not-allowed',
                      background: (isDataLoaded && formData.interests.length > 0 && (formData.searchMode === 'radius' ? formData.currentLat : true)) ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#d1d5db',
                      color: 'white', fontSize: '16px', fontWeight: 'bold',
                      boxShadow: (isDataLoaded && formData.interests.length > 0) ? '0 4px 6px rgba(37,99,235,0.3)' : 'none'
                    }}
                  >{isDataLoaded ? `🔍 ${t('wizard.findPlaces')} (${formData.maxStops})` : `⏳ ${t('general.loading')}...`}</button>
                </div>
              </div>
            )}

            {/* Step 1: Choose Interests (was step 2) */}
            {wizardStep === 1 && (
              <div className="bg-white rounded-xl shadow-lg p-3">
                <h2 style={{ textAlign: 'center', fontSize: '17px', fontWeight: 'bold', marginBottom: '2px' }}>{`⭐ ${t("wizard.step2Title")}`}</h2>
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>{t("wizard.step2Subtitle")}</p>
                
                {/* Interest Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                  {allInterestOptions.filter(option => {
                    // Admin status: hidden=never in wizard, draft=admin only
                    const aStatus = option.adminStatus || 'active';
                    if (aStatus === 'hidden') return false;
                    if (aStatus === 'draft' && !isUnlocked) return false;
                    const status = interestStatus[option.id];
                    if (option.uncovered) return status === true;
                    if (option.scope === 'local' && option.cityId && option.cityId !== selectedCityId) return false;
                    return status !== false;
                  }).map(option => {
                    const isSelected = formData.interests.includes(option.id);
                    const isDraft = (option.adminStatus || 'active') === 'draft';
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
                          border: isSelected ? '2px solid #2563eb' : isDraft ? '2px dashed #f59e0b' : '2px solid #e5e7eb',
                          background: isSelected ? '#eff6ff' : isDraft ? '#fffbeb' : 'white',
                          position: 'relative'
                        }}
                      >
                        {isDraft && <span style={{ position: 'absolute', top: '2px', right: '4px', fontSize: '8px' }}>🟡</span>}
                        <div style={{ fontSize: '22px', marginBottom: '2px' }}>{option.icon?.startsWith?.('data:') ? <img src={option.icon} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', display: 'inline' }} /> : option.icon}</div>
                        <div style={{ fontWeight: '700', fontSize: '11px', color: isSelected ? '#1e40af' : '#374151', wordBreak: 'break-word' }}>{tLabel(option)}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Next + Map buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    onClick={() => {
                      setMapMode('favorites');
                      setMapFavArea(null);
                      setMapFocusPlace(null);
                      setMapFavFilter(formData.interests.length > 0 ? new Set(formData.interests) : new Set());
                      setMapBottomSheet(null);
                      setMapReturnPlace(null);
                      setShowMapModal(true);
                    }}
                    style={{
                      padding: '14px 16px', borderRadius: '12px', border: '2px solid #c084fc',
                      cursor: 'pointer', background: 'white', color: '#7c3aed', fontSize: '15px', fontWeight: 'bold'
                    }}
                  >🗺️</button>
                  <button
                    onClick={() => { setWizardStep(2); window.scrollTo(0, 0); }}
                    disabled={formData.interests.length === 0}
                    style={{
                      flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                      cursor: formData.interests.length > 0 ? 'pointer' : 'not-allowed',
                      background: formData.interests.length > 0 ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#d1d5db',
                      color: 'white', fontSize: '16px', fontWeight: 'bold',
                      boxShadow: formData.interests.length > 0 ? '0 4px 6px rgba(37,99,235,0.3)' : 'none'
                    }}
                  >{t("general.next")}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Step 3 = results */}
        
        {/* FAB: Quick Capture — draggable, available when no active trail */}
        {!activeTrail && !showQuickCapture && !showAddLocationDialog && !showEditLocationDialog && (() => {
          const pos = fabPos || { right: 16, bottom: 80 };
          const style = fabPos 
            ? { position: 'fixed', left: pos.left + 'px', top: pos.top + 'px', zIndex: 1000 }
            : { position: 'fixed', right: pos.right + 'px', bottom: pos.bottom + 'px', zIndex: 1000 };
          
          const onStart = (clientX, clientY, el) => {
            const rect = el.getBoundingClientRect();
            fabDragRef.current = { dragging: true, startX: clientX, startY: clientY, offsetX: clientX - rect.left, offsetY: clientY - rect.top, moved: false };
          };
          const onMove = (clientX, clientY) => {
            if (!fabDragRef.current.dragging) return;
            const dx = Math.abs(clientX - fabDragRef.current.startX);
            const dy = Math.abs(clientY - fabDragRef.current.startY);
            if (dx > 5 || dy > 5) fabDragRef.current.moved = true;
            if (fabDragRef.current.moved) {
              const newPos = {
                left: Math.max(0, Math.min(window.innerWidth - 48, clientX - fabDragRef.current.offsetX)),
                top: Math.max(0, Math.min(window.innerHeight - 48, clientY - fabDragRef.current.offsetY))
              };
              setFabPos(newPos);
            }
          };
          const onEnd = () => {
            if (fabDragRef.current.moved && fabPos) {
              try { localStorage.setItem('foufou_fab_pos', JSON.stringify(fabPos)); } catch(e) {}
            }
            fabDragRef.current.dragging = false;
          };
          const openCapture = () => {
            if (fabDragRef.current.moved) return;
            const initLocation = {
              name: '', description: '', notes: '',
              area: formData.area || 'chinatown',
              areas: formData.areas?.length > 0 ? formData.areas : [formData.area || 'chinatown'],
              interests: formData.interests?.length > 0 ? formData.interests.slice(0, 1) : [],
              lat: null, lng: null, mapsUrl: '', address: '',
              uploadedImage: null, imageUrls: [], gpsLoading: true
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
                  setNewLocation(prev => ({ ...prev, lat, lng, gpsLoading: false, ...areaUpdates }));
                },
                (reason) => {
                  setNewLocation(prev => ({...prev, gpsLoading: false, gpsBlocked: true}));
                  showToast(reason === 'outside_city' ? t('toast.outsideCity') : reason === 'denied' ? t('toast.locationNoPermission') : t('toast.noGpsSignal'), 'warning', 'sticky');
                }
              );
            }
          };
          return (
            <div
              onMouseDown={(e) => onStart(e.clientX, e.clientY, e.currentTarget)}
              onMouseMove={(e) => onMove(e.clientX, e.clientY)}
              onMouseUp={onEnd}
              onMouseLeave={onEnd}
              onTouchStart={(e) => { const t = e.touches[0]; onStart(t.clientX, t.clientY, e.currentTarget); }}
              onTouchMove={(e) => { const t = e.touches[0]; onMove(t.clientX, t.clientY); e.preventDefault(); }}
              onTouchEnd={onEnd}
              onClick={openCapture}
              style={{
                ...style,
                width: '46px', height: '46px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white', boxShadow: '0 4px 12px rgba(34,197,94,0.5)',
                fontSize: '20px', cursor: 'grab', userSelect: 'none', touchAction: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title={t('trail.capturePlace')}
            >📸</div>
          );
        })()}



        {/* Back to route — visible on non-form tabs */}
        {!activeTrail && currentView !== 'form' && (
          <div style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '4px' }}>
            <button
              onClick={() => { setCurrentView('form'); window.scrollTo(0, 0); }}
              style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '4px 14px', color: '#6b7280', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
            >
              {`← ${t('general.backToRoute')}`}
            </button>
          </div>
        )}

        {/* Wizard Step 3: breadcrumb with back link */}
        {wizardStep === 3 && !isGenerating && !activeTrail && currentView === 'form' && (
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
            >⭐ {formData.interests.slice(0, 3).map(id => {
              const opt = allInterestOptions.find(o => o.id === id);
              return opt ? tLabel(opt) : id;
            }).join(', ')}{formData.interests.length > 3 ? ` +${formData.interests.length - 3}` : ''}</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span
              onClick={() => { setWizardStep(2); setRoute(null); setRouteChoiceMade(null); setCurrentView('form'); window.scrollTo(0, 0); }}
              style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#d1d5db' }}
            >📍 {(() => {
              if (formData.searchMode === 'all') return t('wizard.allCity');
              if (formData.searchMode === 'radius') return `${t('general.nearMe')} (${formData.radiusMeters >= 1000 ? `${formData.radiusMeters/1000}km` : `${formData.radiusMeters}m`})`;
              const area = (window.BKK.areaOptions || []).find(a => a.id === formData.area);
              return area ? tLabel(area) : '';
            })()}</span>
          </div>
        )}

        {/* Wizard Step 3: Loading spinner while generating */}
        {wizardStep === 3 && isGenerating && currentView === 'form' && (
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
        {wizardStep === 3 && !isGenerating && route && route.stops?.length > 0 && !activeTrail && !route.optimized && routeChoiceMade === null && currentView === 'form' && (
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
        {currentView === 'form' && !activeTrail && wizardStep === 3 && (routeChoiceMade === 'manual' || route?.optimized) && (
          <div className="view-fade-in bg-white rounded-xl shadow-lg p-3 space-y-3">

            {/* Manual mode header — shown in wizard manual mode */}
            {routeChoiceMade === 'manual' && route && (
              <div className="text-center pb-2">
                <h3 className="text-sm font-bold text-purple-700">🛠️ {t('wizard.manualMode')}  <button onClick={() => showHelpFor('manualMode')} style={{ background: 'none', border: 'none', fontSize: '11px', cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}>{t('general.help')}</button></h3>
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
                    // Build sequential letter map: only active stops get letters
                    const activeLetterMap = {};
                    let letterIdx = 0;
                    route.stops.forEach((stop, i) => {
                      if (!isStopDisabled(stop)) {
                        activeLetterMap[i] = window.BKK.stopLabel(letterIdx);
                        letterIdx++;
                      }
                    });
                    
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
                      .filter(([interest]) => {
                        if (interest === '_manual') return true;
                        if (!formData.interests.includes(interest)) return false;
                        // Safety: don't show groups for hidden/draft/disabled/wrong-city interests
                        const opt = allInterestOptions.find(o => o.id === interest);
                        if (!opt) return false;
                        const aStatus = opt.adminStatus || 'active';
                        if (aStatus === 'hidden') return false;
                        if (aStatus === 'draft' && !isUnlocked) return false;
                        if (opt.scope === 'local' && opt.cityId && opt.cityId !== selectedCityId) return false;
                        const status = interestStatus[interest];
                        if (opt.uncovered) return status === true;
                        return status !== false;
                      })
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
                                      {route?.optimized && !isDisabled && hasValidCoords && activeLetterMap[stop.originalIndex] && (
                                        <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                                          {activeLetterMap[stop.originalIndex]}
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
                                      {isAddedLater && routeChoiceMade === 'manual' && (
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
                                    {/* FouFou rating — custom places only, clickable if has reviews */}
                                    {isCustom && (() => {
                                      const pk = (stop.name || '').replace(/[.#$/\\[\]]/g, '_');
                                      const ra = reviewAverages[pk];
                                      const cl = customLocations.find(loc => loc.name === stop.name);
                                      return (
                                        <div
                                          onClick={ra ? (e) => { e.preventDefault(); e.stopPropagation(); openReviewDialog(cl || stop); } : undefined}
                                          style={{ fontSize: '10px', color: ra ? '#f59e0b' : '#9ca3af', marginTop: '2px', cursor: ra ? 'pointer' : 'default' }}
                                        >
                                          ⭐ {ra ? `${ra.avg.toFixed(1)} (${ra.count})` : t('reviews.notYetRated')}
                                        </div>
                                      );
                                    })()}
                                  </a>
                                  {/* Debug info popup — admin + debug mode only */}
                                  {/* Add to favorites row — Google places only */}
                                  {!isCustom && !isDisabled && (() => {
                                    const existingLoc = customLocations.find(loc => loc.name.toLowerCase().trim() === stop.name.toLowerCase().trim());
                                    if (existingLoc) return <div style={{ fontSize: '9px', color: '#22c55e', padding: '2px 8px' }}>✅ {t('nav.favorites')}</div>;
                                    const placeId = stop.id || stop.name;
                                    const isAdding = addingPlaceIds.includes(placeId);
                                    return (
                                      <button
                                        onClick={(e) => { e.preventDefault(); addGooglePlaceToCustom(stop); }}
                                        disabled={isAdding}
                                        style={{
                                          width: '100%', padding: '3px 8px', marginTop: '2px',
                                          background: isAdding ? '#e5e7eb' : '#f3e8ff', border: '1px dashed #a855f7',
                                          borderRadius: '6px', fontSize: '10px', fontWeight: '600',
                                          color: isAdding ? '#9ca3af' : '#7c3aed', cursor: isAdding ? 'wait' : 'pointer',
                                          textAlign: 'center'
                                        }}
                                      >
                                        {isAdding ? '...' : `⭐ ${t('route.addToMyList')}`}
                                      </button>
                                    );
                                  })()}
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
                        // Always show ALL stops on map — disabled ones rendered dimmed
                        const allStops = route.stops.filter(s => s.lat && s.lng && s.lat !== 0 && s.lng !== 0);
                        if (allStops.length === 0) { showToast(t('places.noPlacesWithCoords'), 'warning'); return; }
                        setMapStops(allStops);
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
                          if (!authUser || authUser.isAnonymous) { setShowLoginDialog(true); return; }
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
                        { icon: route.name ? '✓' : '⬇', label: route.name ? `${t('route.savedAs')} ${route.name}` : ((!authUser || authUser.isAnonymous) ? (t('auth.loginToSave') || 'התחבר כדי לשמור') : t('route.saveRoute')), action: () => {
                          if (!authUser || authUser.isAnonymous) { setShowLoginDialog(true); return; }
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
                          width: '100%', height: '48px', 
                          background: route?.optimized ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : '#d1d5db',
                          color: route?.optimized ? '#15803d' : '#9ca3af', textAlign: 'center',
                          borderRadius: '14px', fontWeight: 'bold', fontSize: '15px',
                          border: route?.optimized ? '2px solid #22c55e' : '2px solid #d1d5db',
                          boxShadow: route?.optimized ? '0 4px 6px -1px rgba(34, 197, 94, 0.3)' : 'none',
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
                        {`🚀 ${t('route.openRouteInGoogle')}`}
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
              <h2 className="text-lg font-bold">{`⭐ ${t("nav.favorites")}`}</h2>
              <button
                onClick={() => showHelpFor('myPlaces')}
                className="text-gray-400 hover:text-blue-500 text-sm"
                title={t("general.help")}
              >
                {t("general.help")}
              </button>
              {isUnlocked && customLocations.length > 1 && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => scanAllDuplicates(false)}
                    style={{ padding: '5px 10px', fontSize: '10px', fontWeight: 'bold', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}
                    title={t('dedup.scanByInterest')}
                  >🔍 {t('dedup.scanButton')}</button>
                  <button
                    onClick={() => scanAllDuplicates(true)}
                    style={{ padding: '5px 10px', fontSize: '10px', fontWeight: 'bold', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}
                    title={t('dedup.scanByCoords')}
                  >📐 {t('dedup.scanCoordsButton')}</button>
                </div>
              )}
            </div>
            
            {/* Custom Locations Section - Tabbed */}
            <div className="mb-4">
              {/* Row 1: Group by + Search */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '6px', flexWrap: 'wrap' }}>
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
                  {/* Favorites map button */}
                  <button
                    onClick={() => { setMapMode('favorites'); setMapFavArea(null); setMapFocusPlace(null); setMapFavFilter(new Set()); setMapBottomSheet(null); setShowMapModal(true); }}
                    style={{ padding: '2px 8px', borderRadius: '8px', border: '1px solid #c084fc', background: '#f3e8ff', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', color: '#7c3aed', whiteSpace: 'nowrap' }}
                    title={t("wizard.showMap")}
                  >🗺️</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1', minWidth: '120px', maxWidth: '200px' }}>
                  <input
                    type="text"
                    placeholder={`🔍 ${t("places.searchByNameHint")}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '4px 10px', border: '1px solid #d1d5db',
                      borderRadius: '8px', width: '100%', fontSize: '16px',
                      textAlign: window.BKK.i18n.isRTL() ? 'right' : 'left',
                      direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#9ca3af', padding: '0', flexShrink: 0 }}
                    >✕</button>
                  )}
                </div>
              </div>
              {/* Row 2: Action buttons */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
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
                                {(loc.uploadedImage || (loc.imageUrls && loc.imageUrls.length > 0)) && (
                                  <button onClick={() => { setModalImage(loc.uploadedImage || loc.imageUrls[0]); setShowImageModal(true); }}
                                    style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', flexShrink: 0, opacity: 0.6 }}
                                    title={t("general.viewImage") || "תמונה"}>🖼️</button>
                                )}
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
                              {(loc.uploadedImage || (loc.imageUrls && loc.imageUrls.length > 0)) && (
                                <button onClick={() => { setModalImage(loc.uploadedImage || loc.imageUrls[0]); setShowImageModal(true); }}
                                  style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', flexShrink: 0, opacity: 0.6 }}
                                  title={t("general.viewImage") || "תמונה"}>🖼️</button>
                              )}
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
                {isEditor && (
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
                )}
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
              
              // Render a single interest row with toggle button
              const renderInterestRow = (interest, isCustom = false, isActive = true) => {
                const isValid = isInterestValid(interest.id);
                const effectiveActive = isValid ? isActive : false; // Invalid always inactive
                const aStatus = interest.adminStatus || (interestConfig[interest.id]?.adminStatus) || 'active';
                const isDraft = aStatus === 'draft';
                const isHidden = aStatus === 'hidden';
                const borderClass = isHidden ? 'border-2 border-red-300 bg-red-50 opacity-50'
                  : isDraft ? 'border-2 border-amber-300 bg-amber-50'
                  : !effectiveActive ? 'border border-gray-300 bg-gray-50 opacity-60'
                  : isCustom ? (isValid ? 'border border-gray-200 bg-white' : 'border-2 border-red-400 bg-red-50')
                  : (isValid ? 'border border-gray-200 bg-white' : 'border-2 border-red-400 bg-red-50');
                
                return (
                  <div key={interest.id} className={`flex items-center justify-between gap-2 rounded-lg p-2 ${borderClass}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{interest.icon?.startsWith?.('data:') ? <img src={interest.icon} alt="" className="w-5 h-5 object-contain" /> : interest.icon}</span>
                      <span className={`font-medium text-sm truncate ${isHidden ? 'text-red-400 line-through' : isDraft ? 'text-amber-700' : !effectiveActive ? 'text-gray-500' : ''}`}>{tLabel(interest)}</span>
                      {isCustom && <span className="text-[10px] bg-purple-200 text-purple-800 px-1 py-0.5 rounded flex-shrink-0">{t("general.custom")}</span>}
                      {!isValid && <span className="text-red-500 text-xs flex-shrink-0" title={t("interests.missingSearchConfig")}>⚠️</span>}
                      {interest.locked && isUnlocked && <span title={t("general.locked")} style={{ fontSize: '11px' }} className="flex-shrink-0">🔒</span>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {/* Admin status cycle — admin only */}
                      {isUnlocked && (
                        <button
                          onClick={(e) => { e.stopPropagation(); cycleAdminStatus(interest.id); }}
                          style={{
                            fontSize: '9px', padding: '1px 4px', borderRadius: '4px',
                            background: isHidden ? '#fee2e2' : isDraft ? '#fef3c7' : '#dcfce7',
                            border: `1px solid ${isHidden ? '#fca5a5' : isDraft ? '#fcd34d' : '#86efac'}`,
                            cursor: 'pointer', lineHeight: '14px'
                          }}
                          title={`Status: ${aStatus} (click to cycle)`}
                        >{isHidden ? '🔴' : isDraft ? '🟡' : '🟢'}</button>
                      )}
                      {/* Default flag toggle — admin only */}
                      {isUnlocked && (() => {
                        const cfg = interestConfig[interest.id] || {};
                        const builtInDefault = interestOptions.some(i => i.id === interest.id);
                        const isDefault = cfg.defaultEnabled !== undefined ? cfg.defaultEnabled : builtInDefault;
                        return (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleDefaultEnabled(interest.id); }}
                            style={{
                              fontSize: '9px', padding: '1px 4px', borderRadius: '4px',
                              background: isDefault ? '#dbeafe' : '#f3f4f6',
                              color: isDefault ? '#1d4ed8' : '#9ca3af',
                              border: `1px solid ${isDefault ? '#93c5fd' : '#d1d5db'}`,
                              cursor: 'pointer', lineHeight: '14px'
                            }}
                            title={isDefault ? 'Default: ON (click to change)' : 'Default: OFF (click to change)'}
                          >{isDefault ? '🔵' : '⚪'}</button>
                        );
                      })()}
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
                      {isEditor && (
                      <button
                        onClick={() => openInterestDialog(interest, isCustom)}
                        className="text-xs px-1 py-0.5 rounded flex-shrink-0"
                        title={interest.locked && !isUnlocked ? t("general.viewOnly") : t("places.detailsEdit")}
                      >{interest.locked && !isUnlocked ? '👁️' : '✏️'}</button>
                      )}
                    </div>
                  </div>
                );
              };
              
              // Collect active and inactive - apply config overrides to built-in
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
              const activeBuiltIn = overriddenBuiltIn.filter(i => {
                const as = (interestConfig[i.id]?.adminStatus) || 'active';
                return as === 'active' && isInterestValid(i.id) && interestStatus[i.id] !== false;
              });
              const activeUncovered = overriddenUncovered.filter(i => {
                const as = (interestConfig[i.id]?.adminStatus) || 'active';
                return as === 'active' && isInterestValid(i.id) && interestStatus[i.id] === true;
              });
              const activeCustom = cityCustomInterests.filter(i => {
                const as = (interestConfig[i.id]?.adminStatus) || 'active';
                return as === 'active' && isInterestValid(i.id) && interestStatus[i.id] !== false;
              });
              const inactiveBuiltIn = overriddenBuiltIn.filter(i => {
                const as = (interestConfig[i.id]?.adminStatus) || 'active';
                return as === 'active' && (!isInterestValid(i.id) || interestStatus[i.id] === false);
              });
              const inactiveUncovered = overriddenUncovered.filter(i => {
                const as = (interestConfig[i.id]?.adminStatus) || 'active';
                return as === 'active' && (!isInterestValid(i.id) || interestStatus[i.id] !== true);
              });
              const inactiveCustom = cityCustomInterests.filter(i => {
                const as = (interestConfig[i.id]?.adminStatus) || 'active';
                return as === 'active' && (!isInterestValid(i.id) || interestStatus[i.id] === false);
              });
              // Admin-only: draft and hidden interests
              const allForAdmin = [...overriddenBuiltIn, ...overriddenUncovered, ...cityCustomInterests];
              const draftInterests = allForAdmin.filter(i => (interestConfig[i.id]?.adminStatus) === 'draft');
              const hiddenInterests = allForAdmin.filter(i => (interestConfig[i.id]?.adminStatus) === 'hidden');
              
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
                    <div className="mb-4">
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
                  
                  {/* Draft Interests — admin only */}
                  {isUnlocked && draftInterests.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-amber-600 mb-2">
                        🟡 Draft ({draftInterests.length})
                      </h3>
                      <div className="space-y-1">
                        {draftInterests.map(i => renderInterestRow(i, !!i.custom, !!interestStatus[i.id]))}
                      </div>
                    </div>
                  )}
                  
                  {/* Hidden Interests — admin only */}
                  {isUnlocked && hiddenInterests.length > 0 && (
                    <div className="mb-2">
                      <h3 className="text-sm font-bold text-red-500 mb-2">
                        🔴 Hidden ({hiddenInterests.length})
                      </h3>
                      <div className="space-y-1">
                        {hiddenInterests.map(i => renderInterestRow(i, !!i.custom, false))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Settings View - Compact Design */}
        {currentView === 'settings' && isAdmin && (
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
                onClick={() => setSettingsTab('general')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                  settingsTab === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >{`⚙️ ${t('settings.generalSettings')}`}</button>
              <button
                onClick={() => setSettingsTab('cities')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                  settingsTab === 'cities' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >{`🌍 ${t('settings.citiesAndAreas')}`}</button>
              {isAdmin && (
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
                              showConfirm(`⚠️ ${t('general.remove')} ${tLabel(city)}?`, () => {
                              const otherCity = Object.keys(window.BKK.cities || {}).find(id => id !== city.id);
                              if (otherCity) switchCity(otherCity, true);
                              window.BKK.unloadCity(city.id);
                              try { const s = JSON.parse(localStorage.getItem('city_active_states') || '{}'); delete s[city.id]; localStorage.setItem('city_active_states', JSON.stringify(s)); } catch(e) {}
                              showToast(`${tLabel(city)} ${t('general.removed')}`, 'info');
                              setCityModified(false);
                              setFormData(prev => ({...prev}));
                              });
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
                                showConfirm(`${t('general.remove')} ${tLabel(area)}?`, () => {
                                const city = window.BKK.selectedCity;
                                if (!city) return;
                                city.areas = city.areas.filter(a => a.id !== area.id);
                                delete window.BKK.areaCoordinates[area.id];
                                window.BKK.areaOptions = window.BKK.areaOptions.filter(a => a.id !== area.id);
                                setCityModified(true); setCityEditCounter(c => c + 1);
                                showToast(`🗑️ ${tLabel(area)}`, 'info');
                                setFormData(prev => ({...prev}));
                                });
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
            
            {/* Search Debug Log Panel */}
            {debugMode && searchDebugLog.length > 0 && (
              <div className="mb-4">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-amber-400 rounded-xl p-3">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 className="text-base font-bold text-amber-800">🔍 Search Debug Log ({searchDebugLog.length})</h3>
                    <button onClick={() => { searchDebugLogRef.current = []; setSearchDebugLog([]); }} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: '#fecaca', border: 'none', color: '#991b1b', cursor: 'pointer' }}>Clear</button>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', fontSize: '11px', direction: 'ltr', textAlign: 'left' }}>
                    {[...searchDebugLog].reverse().map((entry, idx) => (
                      <div key={idx} style={{ 
                        marginBottom: '8px', padding: '8px', borderRadius: '8px',
                        background: entry.message.includes('🔍') ? '#eff6ff' : entry.message.includes('📊') ? '#f0fdf4' : entry.message.includes('✅ FINAL') ? '#fefce8' : entry.message.includes('❌') ? '#fef2f2' : 'white',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#1e3a5f', marginBottom: '4px' }}>
                          {entry.message}
                        </div>
                        {entry.data && typeof entry.data === 'object' && (
                          <div style={{ fontSize: '10px', color: '#4b5563' }}>
                            {/* Search params */}
                            {entry.data.interest && (<div><b>Interest:</b> {entry.data.interest} ({entry.data.interestId})</div>)}
                            {entry.data.query && (<div><b>Query:</b> {entry.data.query}</div>)}
                            {entry.data.placeTypes && (<div><b>Types:</b> {Array.isArray(entry.data.placeTypes) ? entry.data.placeTypes.join(', ') : entry.data.placeTypes}</div>)}
                            {entry.data.blacklist && entry.data.blacklist.length > 0 && (<div><b>Blacklist:</b> {entry.data.blacklist.join(', ')}</div>)}
                            {entry.data.radius && (<div><b>Center:</b> {entry.data.center} | <b>Radius:</b> {entry.data.radius}</div>)}
                            
                            {/* Results summary */}
                            {entry.data.total !== undefined && (<div style={{ marginTop: '4px' }}><b>Google returned:</b> {entry.data.total} | <b>Kept:</b> {entry.data.kept} | <b>Blacklist:</b> -{entry.data.blacklistFiltered} | <b>Type:</b> -{entry.data.typeFiltered} | <b>Relevance:</b> -{entry.data.relevanceFiltered}</div>)}
                            
                            {/* Per-place details */}
                            {entry.data.places && (
                              <div style={{ marginTop: '4px' }}>
                                {entry.data.places.map((p, pi) => (
                                  <div key={pi} style={{ 
                                    padding: '2px 4px', marginTop: '2px', borderRadius: '4px', fontSize: '10px',
                                    background: p.status?.includes('✅') ? '#dcfce7' : '#fee2e2'
                                  }}>
                                    <span style={{ fontWeight: 'bold' }}>{p.status}</span> {p.name} — ⭐{p.rating} ({p.reviews}) — {p.primaryType}
                                    {p.reason && (<span style={{ color: '#991b1b' }}> | {p.reason}</span>)}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Final places list */}
                            {entry.data.finalPlaces && (
                              <div style={{ marginTop: '4px' }}>
                                <b>Final:</b> {entry.data.finalPlaces.join(' | ')}
                              </div>
                            )}
                            {entry.data.removed && (<div><b>Removed:</b> blacklist:{entry.data.removed.blacklist} type:{entry.data.removed.type} relevance:{entry.data.removed.relevance} distance:{entry.data.removed.distance}</div>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
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
                          // Interest auto-naming counters
                          interestCounters: interestCounters,
                          // System parameters (algorithm tuning)
                          systemParams: systemParams,
                          // Metadata
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
            {settingsTab === 'sysparams' && isAdmin && (<div>
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
                // Live-apply app settings
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
              onTouchStart={(e) => {}}
              onTouchEnd={(e) => {}}
              onMouseDown={(e) => {}}
              onMouseUp={(e) => { clearTimeout(e.currentTarget._lp); }}
              onMouseLeave={(e) => { clearTimeout(e.currentTarget._lp); }}
            >v{window.BKK.VERSION}</span>
            <span style={{ color: '#d1d5db', fontSize: '9px' }}>·</span>
            <span style={{ fontSize: '9px', color: '#9ca3af' }}>© Eitan Fisher</span>
            <span style={{ color: '#d1d5db', fontSize: '9px' }}>·</span>
            <button onClick={() => { showConfirm(t('general.confirmRefresh'), () => applyUpdate()); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: '#9ca3af' }}>{`🔄 ${t("general.refresh")}`}</button>
          </div>
        </div>
        )}


      {/* Leaflet Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: (mapMode === 'stops' || mapMode === 'favorites') ? '0' : '12px' }}>
          <div className="bg-white shadow-2xl w-full" style={{ 
            maxWidth: (mapMode === 'stops' || mapMode === 'favorites') ? '100%' : '42rem',
            maxHeight: (mapMode === 'stops' || mapMode === 'favorites') ? '100%' : '90vh',
            height: (mapMode === 'stops' || mapMode === 'favorites') ? '100%' : 'auto',
            borderRadius: (mapMode === 'stops' || mapMode === 'favorites') ? '0' : '12px',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <button
                onClick={() => {
                  const returnPlace = mapReturnPlace;
                  setShowMapModal(false); setMapUserLocation(null); setMapSkippedStops(new Set()); setMapBottomSheet(null); setShowFavMapFilter(false); setMapFavFilter(new Set()); setMapFavArea(null); setMapFocusPlace(null); setMapReturnPlace(null);
                  if (returnPlace) { setTimeout(() => handleEditLocation(returnPlace), 100); }
                }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >✕</button>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">
                  {mapMode === 'areas' ? t('wizard.allAreasMap') : mapMode === 'stops' ? `${t('route.showStopsOnMap')} (${mapStops.length})` : mapMode === 'favorites' ? `⭐ ${t('nav.favorites')}` : t('form.searchRadius')}
                </h3>
                {mapMode === 'stops' && (<button onClick={() => showHelpFor('mapPlanning')} style={{ background: 'none', border: 'none', fontSize: '11px', cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}>{t('general.help')}</button>)}
                {mapMode === 'favorites' && (<button onClick={() => showHelpFor('favoritesMap')} style={{ background: 'none', border: 'none', fontSize: '11px', cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}>{t('general.help')}</button>)}
              </div>
              {mapMode !== 'stops' && mapMode !== 'favorites' && (
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
              {mapMode === 'favorites' && (() => {
                const activeCount = customLocations.filter(loc => {
                  if (loc.status === 'blacklist' || !loc.lat || !loc.lng) return false;
                  if (window.BKK.systemParams?.showDraftsOnMap === false && !loc.locked) return false;
                  if (mapFavArea) { const la = loc.areas || (loc.area ? [loc.area] : []); if (!la.includes(mapFavArea)) return false; }
                  if (mapFavFilter.size > 0) { if (!(loc.interests || []).some(i => mapFavFilter.has(i))) return false; }
                  return true;
                }).length;
                const areaLabel = mapFavArea ? tLabel((window.BKK.areaOptions || []).find(a => a.id === mapFavArea)) : '';
                return (
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'normal' }}>
                    {activeCount} {t('nav.favorites')}{areaLabel ? ` · ${areaLabel}` : ''}{mapFavFilter.size > 0 ? ` · ${mapFavFilter.size} ${t('general.interests') || 'תחומים'}` : ''}
                  </span>
                );
              })()}
            </div>
            {/* Map container with floating elements */}
            <div style={{ flex: 1, position: 'relative', minHeight: (mapMode === 'stops' || mapMode === 'favorites') ? '0' : '350px', maxHeight: (mapMode === 'stops' || mapMode === 'favorites') ? 'none' : '70vh' }}>
              <div id="leaflet-map-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}></div>
              {/* Floating filter button — favorites mode */}
              {mapMode === 'favorites' && !showFavMapFilter && (
                <button
                  onClick={() => setShowFavMapFilter(true)}
                  style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000, padding: '8px 14px', borderRadius: '20px', background: (mapFavFilter.size > 0 || mapFavArea) ? '#7c3aed' : 'white', color: (mapFavFilter.size > 0 || mapFavArea) ? 'white' : '#374151', border: '2px solid ' + ((mapFavFilter.size > 0 || mapFavArea) ? '#7c3aed' : '#d1d5db'), boxShadow: '0 2px 10px rgba(0,0,0,0.2)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >🔍 {t('general.filter') || 'סינון'}{(mapFavFilter.size > 0 || mapFavArea) ? ' ●' : ''}</button>
              )}
              {/* Filter dialog overlay — favorites mode */}
              {mapMode === 'favorites' && showFavMapFilter && (() => {
                const allInts = window.BKK.interestOptions || [];
                const usedInterests = new Set();
                customLocations.forEach(loc => { if (loc.lat && loc.lng && loc.status !== 'blacklist') (loc.interests || []).forEach(i => usedInterests.add(i)); });
                const relevant = allInts.filter(i => usedInterests.has(i.id));
                const areas = window.BKK.areaOptions || [];
                // Count per area
                const areaCounts = {};
                customLocations.forEach(loc => {
                  if (!loc.lat || !loc.lng || loc.status === 'blacklist') return;
                  (loc.areas || [loc.area]).filter(Boolean).forEach(a => { areaCounts[a] = (areaCounts[a] || 0) + 1; });
                });
                return (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
                    onClick={() => { setShowFavMapFilter(false); setMapFavFilter(new Set(mapFavFilter)); /* force refresh */ }}>
                    <div style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', background: 'white', borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,0.2)', overflow: 'hidden', direction: 'rtl' }}
                      onClick={e => e.stopPropagation()}>
                      {/* Filter header */}
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '15px' }}>🔍 {t('general.filter') || 'סינון מפה'}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setMapFavFilter(new Set()); setMapFavArea(null); setMapFocusPlace(null); }}
                            style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f3f4f6', cursor: 'pointer', fontWeight: 'bold', color: '#6b7280' }}>{t('general.clearAll') || 'נקה הכל'}</button>
                          <button onClick={() => { setShowFavMapFilter(false); setMapFavFilter(new Set(mapFavFilter)); }}
                            style={{ fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
                        </div>
                      </div>
                      <div style={{ padding: '12px 16px', overflowY: 'auto', maxHeight: '60vh' }}>
                        {/* Area filter */}
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>📍 {t('general.areas')}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            <button onClick={() => { setMapFavArea(null); setMapFocusPlace(null); }}
                              style={{ padding: '4px 10px', borderRadius: '8px', border: !mapFavArea ? '2px solid #3b82f6' : '1px solid #d1d5db', background: !mapFavArea ? '#dbeafe' : 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', color: !mapFavArea ? '#1e40af' : '#6b7280' }}>{t('general.allCity') || 'הכל'}</button>
                            {areas.map(a => {
                              const cnt = areaCounts[a.id] || 0;
                              const isSel = mapFavArea === a.id;
                              return (
                                <button key={a.id} onClick={() => { setMapFavArea(isSel ? null : a.id); setMapFocusPlace(null); }}
                                  style={{ padding: '4px 8px', borderRadius: '8px', border: isSel ? '2px solid #3b82f6' : '1px solid #d1d5db', background: isSel ? '#dbeafe' : 'white', fontSize: '11px', fontWeight: isSel ? 'bold' : 'normal', cursor: 'pointer', color: isSel ? '#1e40af' : '#374151', opacity: cnt === 0 ? 0.4 : 1 }}>
                                  {tLabel(a)} <span style={{ fontSize: '9px', color: '#9ca3af' }}>({cnt})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {/* Interest filter */}
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>🎨 {t('general.interests') || 'תחומים'}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            <button onClick={() => setMapFavFilter(new Set())}
                              style={{ padding: '4px 10px', borderRadius: '8px', border: mapFavFilter.size === 0 ? '2px solid #7c3aed' : '1px solid #d1d5db', background: mapFavFilter.size === 0 ? '#f3e8ff' : 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', color: mapFavFilter.size === 0 ? '#7c3aed' : '#6b7280' }}>{t('general.all') || 'הכל'}</button>
                            {relevant.map(int => {
                              const color = window.BKK.getInterestColor(int.id, allInts);
                              const isOn = mapFavFilter.size === 0 || mapFavFilter.has(int.id);
                              return (
                                <button key={int.id}
                                  onClick={() => {
                                    if (mapFavFilter.size === 0) { setMapFavFilter(new Set([int.id])); }
                                    else if (mapFavFilter.has(int.id) && mapFavFilter.size === 1) { setMapFavFilter(new Set()); }
                                    else if (mapFavFilter.has(int.id)) { const n = new Set(mapFavFilter); n.delete(int.id); setMapFavFilter(n); }
                                    else { setMapFavFilter(new Set([...mapFavFilter, int.id])); }
                                  }}
                                  style={{ padding: '4px 8px', borderRadius: '8px', border: `2px solid ${isOn ? color : '#e5e7eb'}`, background: isOn ? color + '15' : '#f9fafb', fontSize: '11px', cursor: 'pointer', opacity: isOn ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <span style={{ fontSize: '14px' }}>{int.icon}</span>
                                  <span style={{ fontWeight: isOn ? 'bold' : 'normal', color: isOn ? color : '#9ca3af' }}>{tLabel(int)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {/* Status filter */}
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>📋 {t('general.status') || 'סטטוס'}</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={window.BKK.systemParams?.showDraftsOnMap !== false}
                                onChange={e => { window.BKK.systemParams.showDraftsOnMap = e.target.checked; setMapFavFilter(new Set(mapFavFilter)); }}
                                style={{ accentColor: '#7c3aed' }} />
                              {t('places.showDrafts') || 'הצג טיוטות'}
                            </label>
                          </div>
                        </div>
                        {/* Place search/focus */}
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>🔎 {t('places.searchPlace') || 'חפש מקום'}</div>
                          {(() => {
                            const sd = window.BKK.systemParams?.showDraftsOnMap !== false;
                            const searchable = customLocations.filter(l => l.lat && l.lng && l.status !== 'blacklist' && (sd || l.locked));
                            return (
                              <div>
                                <input
                                  type="text"
                                  placeholder={t('places.searchPlaceholder') || 'הקלד שם מקום...'}
                                  id="fav-map-place-search"
                                  onChange={e => {
                                    const q = e.target.value.trim().toLowerCase();
                                    const list = document.getElementById('fav-map-place-results');
                                    if (list) list.style.display = q.length >= 2 ? 'block' : 'none';
                                    if (list) {
                                      const items = list.querySelectorAll('[data-name]');
                                      items.forEach(item => {
                                        item.style.display = item.dataset.name.toLowerCase().includes(q) ? 'block' : 'none';
                                      });
                                    }
                                  }}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', marginBottom: '4px' }}
                                />
                                <div id="fav-map-place-results" style={{ display: 'none', maxHeight: '120px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fafafa' }}>
                                  {searchable.map(loc => {
                                    const pi = (loc.interests || [])[0];
                                    const color = pi ? window.BKK.getInterestColor(pi, allInts) : '#9ca3af';
                                    return (
                                      <button key={loc.id || loc.name} data-name={loc.name}
                                        onClick={() => {
                                          setMapFocusPlace({ id: loc.id, lat: loc.lat, lng: loc.lng, name: loc.name });
                                          setShowFavMapFilter(false);
                                          setMapFavFilter(new Set(mapFavFilter)); // force refresh
                                        }}
                                        style={{ display: 'block', width: '100%', textAlign: 'right', padding: '5px 10px', border: 'none', borderBottom: '1px solid #f3f4f6', background: 'none', cursor: 'pointer', fontSize: '11px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', marginLeft: '4px' }}></span>
                                        {loc.name}
                                        {loc.locked && <span style={{ fontSize: '8px', color: '#16a34a', marginRight: '4px' }}>✅</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                                {mapFocusPlace && (
                                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #fbbf24' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', flex: 1 }}>📍 {mapFocusPlace.name}</span>
                                    <button onClick={() => { setMapFocusPlace(null); }}
                                      style={{ fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#92400e' }}>✕</button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        {/* Color legend */}
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>🎨 {t('general.legend') || 'מקרא צבעים'}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {relevant.map(int => {
                              const color = window.BKK.getInterestColor(int.id, allInts);
                              return (
                                <div key={int.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block', border: '1px solid ' + color }}></span>
                                  <span style={{ color: '#6b7280' }}>{int.icon} {tLabel(int)}</span>
                                </div>
                              );
                            })}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9ca3af', display: 'inline-block', opacity: 0.5 }}></span>
                              <span style={{ color: '#9ca3af' }}>{t('places.draft') || 'טיוטה'} ({t('general.transparent') || 'שקוף'})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}></span>
                              <span style={{ color: '#9ca3af' }}>📍 {t('form.currentLocation')}</span>
                            </div>
                          </div>
                        </div>
                        {/* Tip text */}
                        <div style={{ marginTop: '12px', padding: '8px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          <div style={{ fontSize: '10px', color: '#166534', lineHeight: 1.5 }}>
                            💡 <b>{t('general.tip') || 'טיפ'}:</b> {t('map.favTip') || 'ריכוז נקודות באזור מסוים מעיד שהאזור עשיר בתכנים. סנן לפי תחום כדי לראות במה מתאפיין כל אזור ולתכנן מסלול ממוקד.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {/* GPS location button — floating */}
              {mapMode === 'favorites' && (
                <button
                  onClick={() => {
                    if (mapUserLocation) {
                      // Already have location — just center map on it
                      if (leafletMapRef?.current) {
                        leafletMapRef.current.setView([mapUserLocation.lat, mapUserLocation.lng], 15, { animate: true });
                      }
                      return;
                    }
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        pos => {
                          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
                          setMapUserLocation(loc);
                          // Center map on new location
                          if (leafletMapRef?.current) {
                            leafletMapRef.current.setView([loc.lat, loc.lng], 15, { animate: true });
                          }
                        },
                        () => showToast('📍 GPS unavailable', 'warning'),
                        { enableHighAccuracy: true, timeout: 8000 }
                      );
                    }
                  }}
                  style={{ position: 'absolute', bottom: mapBottomSheet ? '130px' : '16px', right: '12px', zIndex: 1000, width: '40px', height: '40px', borderRadius: '50%', background: mapUserLocation ? '#3b82f6' : 'white', color: mapUserLocation ? 'white' : '#374151', border: '2px solid #d1d5db', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={t('form.currentLocation')}
                >📍</button>
              )}
              {/* Bottom sheet — favorites mode marker info */}
              {mapMode === 'favorites' && mapBottomSheet && (() => {
                const loc = mapBottomSheet;
                const intLabels = (loc.interests || []).map(i => {
                  const opt = (window.BKK.interestOptions || []).find(o => o.id === i);
                  return opt ? (opt.icon + ' ' + tLabel(opt)) : i;
                }).join(', ');
                const areaLabels = (loc.areas || [loc.area]).filter(Boolean).map(aId => {
                  const a = (window.BKK.areaOptions || []).find(o => o.id === aId);
                  return a ? tLabel(a) : aId;
                }).join(', ');
                const hasImg = loc.uploadedImage || (loc.imageUrls && loc.imageUrls.length > 0);
                const imgSrc = loc.uploadedImage || (loc.imageUrls ? loc.imageUrls[0] : null);
                return (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000, background: 'white', borderTop: '2px solid #e5e7eb', borderRadius: '12px 12px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', padding: '10px 14px', direction: 'rtl' }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      {hasImg && (
                        <img src={imgSrc} alt=""
                          onClick={() => { setModalImage(imgSrc); setShowImageModal(true); }}
                          style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', flexShrink: 0, border: '1px solid #e5e7eb' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>{loc.name}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>📍 {areaLabels}</div>
                        {intLabels && <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{intLabels}</div>}
                        {loc.locked && <span style={{ fontSize: '9px', background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>✅ {t('places.ready') || 'מוכן'}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={() => { const u = window.BKK.getGoogleMapsUrl(loc); if (u && u !== '#') window.open(u, '_blank'); }}
                        style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🗺️ {t('route.navigate') || 'נווט'}</button>
                      <button onClick={() => { setMapReturnPlace(null); setShowMapModal(false); setMapBottomSheet(null); handleEditLocation(loc); }}
                        style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ {t('places.detailsEdit') || 'ערוך'}</button>
                      <button onClick={() => setMapBottomSheet(null)}
                        style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f3f4f6', fontSize: '12px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Footer */}
            {mapMode !== 'favorites' && (
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
                      onClick={() => { setShowMapModal(false); setMapUserLocation(null); setMapSkippedStops(new Set()); }}
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
            )}
          </div>
        </div>
      )}

        {/* Debug Search Log - Floating Badge */}
        {debugMode && (searchDebugLog.length > 0 || debugSessions.length > 0) && currentView === 'form' && !showSearchDebugPanel && (
          <button
            onClick={() => setShowSearchDebugPanel(true)}
            style={{
              position: 'fixed', bottom: '140px', left: '12px', zIndex: 40,
              background: '#f59e0b', color: 'white', border: 'none', borderRadius: '20px',
              padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            🔍 {searchDebugLog.filter(e => e.message.includes('📊')).length + debugSessions.length}
          </button>
        )}

        {/* Debug Search Log - Full Screen Modal */}
        {showSearchDebugPanel && (() => {
          return (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#1e40af', color: 'white', flexShrink: 0 }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '14px' }}>🔍 Debug ({debugSessions.length} sessions{debugFlagged.size > 0 ? ` · ${debugFlagged.size}🚩` : ''})</h3>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {debugFlagged.size > 0 && <button onClick={exportFlaggedStops} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: '#f59e0b', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>🚩 Copy {debugFlagged.size}</button>}
                <button onClick={exportDebugSessions} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: '#2563eb', border: 'none', color: 'white', cursor: 'pointer' }}>📋 All</button>
                <button onClick={clearDebugSessions} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: '#dc2626', border: 'none', color: 'white', cursor: 'pointer' }}>🗑️</button>
                <button onClick={() => setShowSearchDebugPanel(false)} style={{ fontSize: '22px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', padding: '0 8px' }}>✕</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', direction: 'ltr', textAlign: 'left' }}>
              {debugSessions.length > 0 ? debugSessions.slice(-10).reverse().map((sess) => {
                const sessLogs = searchDebugLog.filter(e => e.runId && e.runId === sess.runId);
                return (
                <div key={sess.id} style={{ marginBottom: '12px', background: 'white', borderRadius: '10px', border: '1px solid #bfdbfe', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ padding: '8px 12px', background: '#dbeafe', fontSize: '12px', fontWeight: 'bold', color: '#1e3a5f' }}>
                    {sess.time} — {sess.areaName || sess.area} ({sess.searchMode}{sess.radiusMeters ? ` ${sess.radiusMeters}m` : ''}) — {sess.interests.map(i => i.label).join(', ')} — {sess.stops.length} stops
                  </div>
                  {(sess.stops || []).map((st, i) => {
                    const d = st._debug;
                    const searchTypes = d?.placeTypes || [];
                    const googleTypes = d?.googleTypes || [];
                    const matchedTypes = googleTypes.filter(t => searchTypes.includes(t));
                    const unmatchedGoogle = googleTypes.filter(t => !searchTypes.includes(t));
                    const flagKey = `${sess.id}:${i}`;
                    const isFlagged = debugFlagged.has(flagKey);
                    return (
                      <div key={i} style={{ padding: '8px 12px', borderTop: '1px solid #e5e7eb', fontSize: '11px', background: isFlagged ? '#fef3c7' : 'transparent', borderLeft: isFlagged ? '4px solid #f59e0b' : '4px solid transparent' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline', marginBottom: '4px' }}>
                          <button onClick={() => toggleDebugFlag(flagKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontSize: '14px', lineHeight: 1, opacity: isFlagged ? 1 : 0.3 }} title={isFlagged ? 'Unflag' : 'Flag for investigation'}>🚩</button>
                          <span style={{ fontWeight: 'bold', color: '#6b7280', minWidth: '14px' }}>{i + 1}.</span>
                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{st.custom ? '📌' : '🌐'} {st.name}</span>
                          <span style={{ color: '#6b7280' }}>⭐{st.rating || '?'} ({st.ratingCount || '?'})</span>
                          {d?.rank && <span style={{ color: '#9ca3af', fontSize: '10px' }}>#{d.rank}/{d.totalFromGoogle}</span>}
                        </div>
                        {d && (
                          <div style={{ fontSize: '10px', lineHeight: '1.8', paddingLeft: '24px' }}>
                            <div>
                              <span style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', color: '#1e40af' }}>{d.interestLabel}</span>
                              {d.searchType === 'text' && <span style={{ marginLeft: '4px', background: '#f3e8ff', padding: '1px 6px', borderRadius: '3px', color: '#7c3aed' }}>🔤 "{d.query}"</span>}
                              {d.primaryType && <span style={{ marginLeft: '4px', color: '#6b7280' }}>primary: <b>{d.primaryType}</b></span>}
                            </div>
                            {d.searchType === 'category' && searchTypes.length > 0 && (
                              <div style={{ marginTop: '3px' }}>
                                <span style={{ color: '#6b7280', fontWeight: 'bold' }}>Search: </span>
                                {searchTypes.map((t, ti) => (
                                  <span key={ti} style={{ display: 'inline-block', margin: '1px 2px', padding: '0 4px', borderRadius: '3px', fontSize: '9px', background: matchedTypes.includes(t) ? '#dcfce7' : '#f3f4f6', color: matchedTypes.includes(t) ? '#166534' : '#9ca3af', fontWeight: matchedTypes.includes(t) ? 'bold' : 'normal', border: `1px solid ${matchedTypes.includes(t) ? '#86efac' : '#e5e7eb'}` }}>{matchedTypes.includes(t) ? '✓ ' : ''}{t}</span>
                                ))}
                              </div>
                            )}
                            {googleTypes.length > 0 && (
                              <div style={{ marginTop: '2px' }}>
                                <span style={{ color: '#6b7280', fontWeight: 'bold' }}>Google: </span>
                                {matchedTypes.map((t, ti) => (
                                  <span key={'m'+ti} style={{ display: 'inline-block', margin: '1px 2px', padding: '0 4px', borderRadius: '3px', fontSize: '9px', background: '#dcfce7', color: '#166534', fontWeight: 'bold', border: '1px solid #86efac' }}>✓ {t}</span>
                                ))}
                                {unmatchedGoogle.map((t, ti) => (
                                  <span key={'u'+ti} style={{ display: 'inline-block', margin: '1px 2px', padding: '0 4px', borderRadius: '3px', fontSize: '9px', background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb' }}>{t}</span>
                                ))}
                              </div>
                            )}
                            {d.blacklist && d.blacklist.length > 0 && (
                              <div style={{ marginTop: '2px' }}>
                                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Blacklist: </span>
                                <span style={{ color: '#dc2626' }}>{d.blacklist.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {st.address && <div style={{ fontSize: '9px', color: '#9ca3af', paddingLeft: '24px', marginTop: '2px' }}>{st.address}</div>}
                      </div>
                    );
                  })}
                  {sessLogs.length > 0 && (
                    <details style={{ borderTop: '2px solid #fcd34d' }}>
                      <summary style={{ cursor: 'pointer', padding: '6px 12px', background: '#fef9c3', fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>
                        📊 API Log ({sessLogs.length})
                      </summary>
                      <div style={{ padding: '6px', fontSize: '10px', background: '#fffbeb' }}>
                        {sessLogs.map((entry, idx) => (
                          <div key={idx} style={{ marginBottom: '4px', padding: '4px 6px', borderRadius: '4px', background: entry.message.includes('🔍') ? '#dbeafe' : entry.message.includes('📊') ? '#dcfce7' : entry.message.includes('✅') ? '#fef9c3' : entry.message.includes('❌') ? '#fee2e2' : 'white', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontWeight: 'bold', color: '#1e3a5f', fontSize: '10px' }}>{entry.message}</div>
                            {entry.data && typeof entry.data === 'object' && (
                              <div style={{ color: '#374151', lineHeight: '1.3', marginTop: '2px' }}>
                                {entry.data.interest && (<div><b>Interest:</b> {entry.data.interest}</div>)}
                                {entry.data.placeTypes && (<div><b>Types:</b> {Array.isArray(entry.data.placeTypes) ? entry.data.placeTypes.join(', ') : entry.data.placeTypes}</div>)}
                                {entry.data.blacklist && entry.data.blacklist.length > 0 && (<div style={{color:'#dc2626'}}><b>BL:</b> {entry.data.blacklist.join(', ')}</div>)}
                                {entry.data.total !== undefined && (<div><b>Google:</b> {entry.data.total} → Kept:{entry.data.kept} BL:-{entry.data.blacklistFiltered} Type:-{entry.data.typeFiltered} Rel:-{entry.data.relevanceFiltered}</div>)}
                                {entry.data.places && entry.data.places.map((p, pi) => (
                                  <div key={pi} style={{ padding: '1px 4px', marginTop: '1px', borderRadius: '3px', background: p.status?.includes('✅') ? '#dcfce7' : '#fee2e2', borderLeft: `2px solid ${p.status?.includes('✅') ? '#22c55e' : '#ef4444'}`, fontSize: '9px' }}>
                                    {p.status} {p.name} — ⭐{p.rating} ({p.reviews}) — {p.primaryType}{p.reason ? ` | ${p.reason}` : ''}
                                  </div>
                                ))}
                                {entry.data.finalPlaces && (<div><b>Final:</b> {entry.data.finalPlaces.join(' | ')}</div>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>No sessions yet — generate a route with debug mode on</div>
              )}
              {(() => {
                const sessionRunIds = new Set(debugSessions.map(s => s.runId).filter(Boolean));
                const orphanLogs = searchDebugLog.filter(e => !e.runId || !sessionRunIds.has(e.runId));
                if (orphanLogs.length === 0) return null;
                return (
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ cursor: 'pointer', padding: '8px 12px', background: '#f3f4f6', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', color: '#6b7280', border: '1px solid #d1d5db' }}>
                      📊 Other API Logs ({orphanLogs.length})
                    </summary>
                    <div style={{ padding: '8px', fontSize: '10px', marginTop: '4px' }}>
                      {[...orphanLogs].reverse().map((entry, idx) => (
                        <div key={idx} style={{ marginBottom: '4px', padding: '4px 6px', borderRadius: '4px', background: entry.message.includes('🔍') ? '#dbeafe' : entry.message.includes('📊') ? '#dcfce7' : 'white', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontWeight: 'bold', color: '#1e3a5f', fontSize: '10px' }}>{new Date(entry.ts).toLocaleTimeString()} — {entry.message}</div>
                          {entry.data && typeof entry.data === 'object' && (
                            <div style={{ color: '#374151', lineHeight: '1.3' }}>
                              {entry.data.interest && (<div><b>Interest:</b> {entry.data.interest}</div>)}
                              {entry.data.total !== undefined && (<div><b>Google:</b> {entry.data.total} → Kept:{entry.data.kept}</div>)}
                              {entry.data.places && entry.data.places.map((p, pi) => (
                                <div key={pi} style={{ padding: '1px 4px', borderRadius: '3px', background: p.status?.includes('✅') ? '#dcfce7' : '#fee2e2', borderLeft: `2px solid ${p.status?.includes('✅') ? '#22c55e' : '#ef4444'}`, fontSize: '9px' }}>
                                  {p.status} {p.name} — ⭐{p.rating} — {p.primaryType}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })()}
            </div>
          </div>
          );
        })()}

        {/* Floating role impersonation badge */}
        {isRealAdmin && roleOverride !== null && (
          <div style={{
            position: 'fixed', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 45, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white',
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', userSelect: 'none'
          }}
            onClick={() => { setRoleOverride(null); showToast('👑 Admin', 'info'); }}
          >
            <span>🎭</span>
            <span>{roleOverride === 0 ? 'Regular' : 'Editor'}</span>
            <span style={{ fontSize: '10px', opacity: 0.8 }}>tap to exit</span>
          </div>
        )}

        {/* === DIALOGS (from dialogs.js) === */}
