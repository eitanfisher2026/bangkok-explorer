        {/* Dedup Confirmation Dialog */}
        {dedupConfirm && (() => {
          const { type, loc, match } = dedupConfirm;
          const interest = allInterestOptions.find(o => match.interests?.includes(o.id) || loc.interests?.includes(o.id));
          const icon = interest?.icon?.startsWith?.('data:') ? '📍' : (interest?.icon || '📍');
          return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 10200 }}>
            <div style={{ background: 'white', borderRadius: '16px', maxWidth: '380px', width: '100%', padding: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>{type === 'google' ? '🌐' : '📍'}</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937' }}>
                  {type === 'google' ? t('dedup.googleMatch') : t('dedup.customExists')}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{match._distance || 0}m</div>
              </div>
              
              {/* Match card */}
              <div style={{ background: '#fefce8', border: '2px solid #eab308', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                {/* Show saved image for custom matches */}
                {type === 'custom' && match.uploadedImage && (
                  <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', maxHeight: '140px' }}>
                    <img src={match.uploadedImage} alt={match.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#374151' }}>{match.name}</div>
                    {type === 'google' && match.rating && (
                      <div style={{ fontSize: '11px', color: '#92400e' }}>⭐ {match.rating.toFixed(1)} ({match.ratingCount || 0})</div>
                    )}
                    {match.address && <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{match.address}</div>}
                    {type === 'custom' && match.description && (
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>{match.description}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 3 action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => handleDedupConfirm('accept')}
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  ✅ {type === 'google' ? t('dedup.useThis') : t('dedup.alreadyExists')}
                </button>
                <button onClick={() => handleDedupConfirm('addNew')}
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  ➕ {t('dedup.addAsNew')}
                </button>
                <button onClick={() => handleDedupConfirm('cancel')}
                  style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 'bold', background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '10px', cursor: 'pointer' }}>
                  ✕ {t('general.cancel')}
                </button>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Add/Edit Location Dialog - REDESIGNED */}
        {(showAddLocationDialog || showEditLocationDialog) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2" style={{ zIndex: 10100 }}>
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
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
                      className="w-full p-2 border-2 border-purple-300 rounded-lg focus:border-purple-500"
                      style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr', fontSize: '16px' }}
                      autoFocus={!showEditLocationDialog}
                    />
                    {isUnlocked && showEditLocationDialog && (
                      <button type="button"
                        onClick={() => setNewLocation({...newLocation, dedupOk: !newLocation.dedupOk})}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${newLocation.dedupOk ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white text-gray-400'}`}
                        title="Duplicate OK"
                      >{newLocation.dedupOk ? '✓✓' : '✓'}</button>
                    )}
                    </div>
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
                              // Auto-detect areas from coordinates
                              const detected = window.BKK.getAreasForCoordinates(result.lat, result.lng);
                              const areaUpdates = detected.length > 0 ? { areas: detected, area: detected[0] } : {};
                              const updatedLoc = {
                                ...newLocation,
                                name: result.name,
                                lat: result.lat, lng: result.lng,
                                address: result.address,
                                googlePlaceId: result.googlePlaceId,
                                googlePlace: true,
                                ...areaUpdates
                              };
                              updatedLoc.mapsUrl = window.BKK.getGoogleMapsUrl(updatedLoc);
                              setNewLocation(updatedLoc);
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold">{t("general.areas")}</label>
                      {isUnlocked && newLocation.lat && newLocation.lng && (
                        <button
                          type="button"
                          onClick={() => {
                            const detected = window.BKK.getAreasForCoordinates(newLocation.lat, newLocation.lng);
                            if (detected.length > 0) {
                              setNewLocation({...newLocation, areas: detected, area: detected[0], outsideArea: false});
                              showToast(`📍 ${detected.length} אזורים זוהו`, 'success');
                            } else {
                              showToast('⚠️ לא נמצא אזור לקואורדינטות', 'warning');
                            }
                          }}
                          style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af', cursor: 'pointer', fontWeight: 'bold' }}
                        >📍 זהה אזור</button>
                      )}
                      {newLocation.lat && newLocation.lng && (
                        <button
                          type="button"
                          onClick={() => {
                            const locAreas = newLocation.areas || (newLocation.area ? [newLocation.area] : []);
                            setMapReturnPlace(editingLocation || null);
                            setShowEditLocationDialog(false);
                            setMapMode('favorites');
                            setMapFavRadius(null);
                            setMapFavArea(locAreas[0] || null);
                            setMapFocusPlace({ id: editingLocation?.id, lat: newLocation.lat, lng: newLocation.lng, name: newLocation.name });
                            setMapFavFilter(new Set());
                            setMapBottomSheet(null);
                            setShowMapModal(true);
                          }}
                          style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: '#f3e8ff', border: '1px solid #c084fc', color: '#7c3aed', cursor: 'pointer', fontWeight: 'bold' }}
                        >🗺️ {t('wizard.showMap') || 'מפה'}</button>
                      )}
                    </div>
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
                  <div className="grid grid-cols-6 gap-1.5 p-2 bg-gray-50 rounded-lg max-h-36 overflow-y-auto">
                    {allInterestOptions.filter(option => {
                      // Already tagged — always show
                      if ((newLocation.interests || []).includes(option.id)) return true;
                      // Filter by city scope only (location tagging shouldn't depend on enabled/adminStatus)
                      if (option.scope === 'local' && option.cityId && option.cityId !== selectedCityId) return false;
                      return true;
                    }).map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          const current = newLocation.interests || [];
                          const isAdding = !current.includes(option.id);
                          const updatedInterests = isAdding
                            ? [...current, option.id]
                            : current.filter(i => i !== option.id);
                          
                          const updates = { ...newLocation, interests: updatedInterests };
                          
                          // Auto-generate name when first interest selected and name is empty
                          if (isAdding && !newLocation.name.trim()) {
                            // Use lat/lng from current state (may have been set by camera/GPS)
                            const lat = newLocation.lat;
                            const lng = newLocation.lng;
                            const result = window.BKK.generateLocationName(
                              option.id, lat, lng,
                              interestCounters, allInterestOptions, areaOptions
                            );
                            if (result.name) {
                              updates.name = result.name;
                              // Auto-detect areas too if not already set
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
                        className={`p-1 rounded-lg text-[10px] font-bold transition-all ${
                          (newLocation.interests || []).includes(option.id)
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-white border border-gray-300 hover:border-purple-300'
                        }`}
                        title={tLabel(option)}
                      >
                        <span className="text-xl block" style={{ lineHeight: 1.2 }}>{option.icon?.startsWith?.('data:') ? <img src={option.icon} alt="" className="w-6 h-6 object-contain mx-auto" /> : option.icon}</span>
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
                        className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
                        style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr', fontSize: '16px' }}
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
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-purple-500"
                      style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr', minHeight: '50px', fontSize: '16px' }}
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
                        className="flex-1 p-1.5 border border-gray-300 rounded-lg focus:border-purple-500"
                        style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr', fontSize: '16px' }}
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

                {/* Google Maps URL */}
                {isUnlocked && (
                <div>
                  <label className="block text-xs font-bold mb-1">🔗 Google Maps URL</label>
                  <input
                    type="text"
                    value={newLocation.mapsUrl || ''}
                    onChange={(e) => setNewLocation({...newLocation, mapsUrl: e.target.value})}
                    placeholder="https://maps.google.com/..."
                    className="w-full p-1.5 border border-gray-300 rounded-lg"
                    style={{ direction: 'ltr', fontSize: '16px' }}
                  />
                </div>
                )}

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

                  {/* Metadata row — addedBy + addedAt (visible to all users) */}
                  {showEditLocationDialog && editingLocation && (editingLocation.addedBy || editingLocation.addedAt) && (
                    <div style={{ fontSize: '10px', color: '#9ca3af', padding: '4px 0', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {editingLocation.addedBy && <span>👤 {userNamesMap[editingLocation.addedBy] || editingLocation.addedBy.slice(0,8)}</span>}
                      {editingLocation.addedAt && <span>📅 {new Date(editingLocation.addedAt).toLocaleDateString()}</span>}
                      {editingLocation.fromGoogle && <span>🔍 Google</span>}
                    </div>
                  )}

                  {/* Row 2: Skip + Delete (edit mode only) — compact inline */}
                  {showEditLocationDialog && editingLocation && !(editingLocation.locked && !isUnlocked) && (
                    <div className="flex gap-1.5 pt-1 border-t border-gray-200">
                      {editingLocation.status === 'blacklist' ? (
                        <button
                          onClick={() => {
                            toggleLocationStatus(editingLocation.id);
                            setShowEditLocationDialog(false);
                            setEditingLocation(null);
                          }}
                          style={{ flex: 1, padding: '5px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #86efac', background: '#f0fdf4', color: '#166534' }}
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
                          style={{ flex: 1, padding: '5px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1e40af' }}
                        >
                          🚫 {t('route.skipPermanently')}
                        </button>
                      )}
                      {(isAdmin || (isEditor && !editingLocation.locked) || (editingLocation.addedBy && editingLocation.addedBy === authUser?.uid && !editingLocation.locked)) && (
                      <button
                        onClick={() => {
                          showConfirm(`${t("general.deletePlace")} "${editingLocation.name}"?`, () => {
                            deleteCustomLocation(editingLocation.id);
                            setShowEditLocationDialog(false);
                            setEditingLocation(null);
                          });
                        }}
                        style={{ flex: 1, padding: '5px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626' }}
                      >
                        🗑️ {t("general.deletePlace")}
                      </button>
                      )}
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
                      updateCustomLocation(true);
                    } else {
                      saveWithDedupCheck(true);
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
                  {`✕ ${t("general.cancel")}`}
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
                      className="w-full p-2 border-2 border-purple-300 rounded-lg focus:border-purple-500"
                      style={{ direction: 'rtl', fontSize: '16px' }}
                      
                      autoFocus={!editingCustomInterest}
                    />
                    <div className="flex items-center gap-1 mt-1" style={{ minWidth: 0 }}>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">🇬🇧</span>
                      <input
                        type="text"
                        value={newInterest.labelEn || ''}
                        onChange={(e) => setNewInterest({...newInterest, labelEn: e.target.value})}
                        placeholder={t("interests.englishName")}
                        className="flex-1 p-1.5 border border-gray-300 rounded-lg focus:border-purple-500"
                        style={{ direction: 'ltr', fontSize: '14px', minWidth: 0 }}
                        
                      />
                    </div>
                  </div>
                  <div style={{ overflow: 'hidden' }}>
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
                        
                      />
                    )}
                    {isEditor && (
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
                    {isEditor && (
                      <button
                        onClick={() => setIconPickerConfig({ description: newInterest.label || '', callback: (emoji) => setNewInterest(prev => ({...prev, icon: emoji})), suggestions: [], loading: false })}
                        className="block w-full mt-1 p-1 border border-dashed border-orange-300 rounded text-center cursor-pointer hover:bg-orange-50 text-[9px] text-orange-600 font-bold"
                      >✨ {t('emoji.suggest')}</button>
                    )}
                  </div>
                </div>
                {/* Color override for map markers — admin only */}
                {isUnlocked && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280' }}>{t('interests.mapColor') || 'צבע במפה:'}</span>
                    <input
                      type="color"
                      value={newInterest.color || window.BKK.getInterestColor(newInterest.id || '', window.BKK.interestOptions || [])}
                      onChange={e => setNewInterest({...newInterest, color: e.target.value})}
                      style={{ width: '28px', height: '22px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                    />
                    {newInterest.color && (
                      <button onClick={() => setNewInterest({...newInterest, color: ''})}
                        style={{ fontSize: '9px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>✕ auto</button>
                    )}
                    {newInterest.id && (
                      <button
                        onClick={() => {
                          setShowAddInterestDialog(false);
                          setMapMode('favorites');
                          setMapFavRadius(null);
                          setMapFavArea(null);
                          setMapFocusPlace(null);
                          setMapFavFilter(new Set([newInterest.id]));
                          setMapBottomSheet(null);
                          setMapReturnPlace(null);
                          setShowMapModal(true);
                        }}
                        style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: '#f3e8ff', border: '1px solid #c084fc', color: '#7c3aed', cursor: 'pointer', fontWeight: 'bold', marginRight: 'auto' }}
                      >🗺️ {t('wizard.showMap') || 'מפה'}</button>
                    )}
                  </div>
                )}
                </div>{/* close inner wrapper */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-2">
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

                {/* Group — for visual grouping in wizard */}
                {isUnlocked && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">📂 Group:</span>
                    <select
                      value={newInterest.group || ''}
                      onChange={(e) => setNewInterest({...newInterest, group: e.target.value})}
                      className="p-1 text-xs border rounded flex-1"
                      style={{ minWidth: 0 }}
                    >
                      <option value="">— none —</option>
                      {(() => {
                        const groups = new Set();
                        (allInterestOptions || []).forEach(i => { if (i.group) groups.add(i.group); });
                        (window.BKK.interestOptions || []).forEach(i => { if (i.group) groups.add(i.group); });
                        (window.BKK.uncoveredInterests || []).forEach(i => { if (i.group) groups.add(i.group); });
                        return [...groups].sort().map(g => <option key={g} value={g}>{g}</option>);
                      })()}
                    </select>
                    <input
                      value={newInterest.group || ''}
                      onChange={(e) => setNewInterest({...newInterest, group: e.target.value.trim().toLowerCase()})}
                      placeholder="or type new..."
                      className="p-1 text-xs border rounded"
                      style={{ width: '90px' }}
                    />
                  </div>
                </div>
                )}

                {/* Search Configuration — with manual toggle at top */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <label className="block text-xs font-bold mb-2 text-blue-800">{`🔍 ${t("general.searchSettings")}`}</label>
                  
                  {/* Manual/Google toggle */}
                  <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid #bfdbfe' }}>
                    <button type="button"
                      onClick={() => setNewInterest({...newInterest, privateOnly: !newInterest.privateOnly})}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${newInterest.privateOnly ? 'border-purple-500 bg-purple-500 text-white shadow-md' : 'border-green-500 bg-green-500 text-white shadow-md'}`}
                    >
                      {newInterest.privateOnly ? '✏️' : '🌐'} {newInterest.privateOnly ? t("interests.privateInterest") : t("interests.searchesGoogle")}
                    </button>
                    <span className="text-[9px] text-gray-500">{newInterest.privateOnly ? t("interests.myPlacesOnly") : t("interests.searchesGoogle")}</span>
                  </div>
                  
                  <div style={{ opacity: newInterest.privateOnly ? 0.3 : 1, pointerEvents: newInterest.privateOnly ? 'none' : 'auto' }}>
                  
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
                    <div className="mb-3">
                      <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>{`${t('interests.textQuery')}:`}</label>
                      <textarea
                        value={newInterest.textSearch || ''}
                        onChange={(e) => setNewInterest({...newInterest, textSearch: e.target.value})}
                        placeholder="e.g., street art, wine bar"
                        className="w-full p-2 text-sm border rounded"
                        style={{ direction: 'ltr', minHeight: '50px', fontSize: '14px', resize: 'vertical' }}
                        rows={2}
                      />
                      <p className="text-[9px] text-gray-500 mt-0.5" style={{ direction: 'ltr' }}>
                        Searches: "[query] [area] {window.BKK.cityNameForSearch || 'City'}"
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>{`${t('interests.placeTypes')}:`}</label>
                      <textarea
                        value={newInterest.types || ''}
                        onChange={(e) => setNewInterest({...newInterest, types: e.target.value})}
                        placeholder="e.g., movie_theater, museum, art_gallery"
                        className="w-full p-2 text-sm border rounded"
                        style={{ direction: 'ltr', minHeight: '50px', fontSize: '14px', resize: 'vertical' }}
                        rows={2}
                      />
                      <p className="text-[9px] text-gray-500 mt-0.5" style={{ direction: 'ltr' }}>
                        <a href="https://developers.google.com/maps/documentation/places/web-service/place-types" target="_blank" className="text-blue-500 underline">{t('interests.seeTypesList')}</a>
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>{`${t('interests.blacklistWords')}:`}</label>
                    <textarea
                      value={newInterest.blacklist || ''}
                      onChange={(e) => setNewInterest({...newInterest, blacklist: e.target.value})}
                      placeholder="e.g., cannabis, massage, tattoo, hostel"
                      className="w-full p-2 text-sm border rounded"
                      style={{ direction: 'ltr', minHeight: '40px', fontSize: '14px', resize: 'vertical' }}
                      rows={2}
                    />
                    <p className="text-[9px] text-gray-500 mt-0.5" style={{ direction: 'ltr' }}>
                      Places with these words in name will be filtered out
                    </p>
                  </div>
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
                {/* Admin: Status + Default + Place count */}
                {editingCustomInterest && isUnlocked && (() => {
                  const interestId = editingCustomInterest.id;
                  const cfg = interestConfig[interestId] || {};
                  const aStatus = cfg.adminStatus || 'active';
                  const builtInDefault = interestOptions.some(i => i.id === interestId);
                  const isDefault = cfg.defaultEnabled !== undefined ? cfg.defaultEnabled : builtInDefault;
                  const statusLabels = { active: '🟢 Active', draft: '🟡 Draft', hidden: '🔴 Hidden' };
                  const statusColors = { active: '#dcfce7', draft: '#fef3c7', hidden: '#fee2e2' };
                  const statusBorders = { active: '#86efac', draft: '#fcd34d', hidden: '#fca5a5' };
                  // Count places tagged with this interest
                  const cityLocs = (customLocations || []).filter(l => (l.cityId || 'bangkok') === selectedCityId && l.status !== 'blacklist');
                  const tagged = cityLocs.filter(l => (l.interests || []).includes(interestId));
                  const locked = tagged.filter(l => l.locked);
                  const withCoords = tagged.filter(l => l.lat && l.lng);
                  return (
                    <div style={{ display: 'flex', gap: '8px', padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Status</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {['active', 'draft', 'hidden'].map(s => (
                            <button key={s} type="button"
                              onClick={async () => {
                                if (aStatus === s) return;
                                const updCfg = { ...interestConfig, [interestId]: { ...cfg, adminStatus: s } };
                                setInterestConfig(updCfg);
                                if (isFirebaseAvailable && database) {
                                  try { await database.ref(`settings/interestConfig/${interestId}/adminStatus`).set(s); } catch(e) {}
                                }
                                const labels = { active: '🟢', draft: '🟡', hidden: '🔴' };
                                showToast(`${labels[s]} ${tLabel(editingCustomInterest) || interestId} → ${s}`, 'info');
                              }}
                              style={{
                                fontSize: '10px', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                                background: aStatus === s ? statusColors[s] : '#f1f5f9',
                                border: `1px solid ${aStatus === s ? statusBorders[s] : '#e2e8f0'}`,
                                fontWeight: aStatus === s ? 'bold' : 'normal',
                                opacity: aStatus === s ? 1 : 0.5
                              }}
                            >{statusLabels[s]}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Default</div>
                        <button type="button"
                          onClick={() => toggleDefaultEnabled(interestId)}
                          style={{
                            fontSize: '11px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer',
                            background: isDefault ? '#dbeafe' : '#f1f5f9',
                            border: `1px solid ${isDefault ? '#93c5fd' : '#e2e8f0'}`,
                            fontWeight: 'bold', color: isDefault ? '#1d4ed8' : '#94a3b8'
                          }}
                        >{isDefault ? '🔵 ON' : '⚪ OFF'}</button>
                      </div>
                      <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '8px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>⭐ Places</div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: tagged.length > 0 ? '#059669' : '#94a3b8' }}>
                          {tagged.length}{locked.length > 0 ? ` (${locked.length}🔒)` : ''}{tagged.length > 0 && withCoords.length < tagged.length ? ` · ${tagged.length - withCoords.length}❗` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
                      {isEditor && (() => {
                        const inUseCount = customLocations.filter(loc => (loc.interests || []).includes(editingCustomInterest?.id)).length;
                        const canDelete = isAdmin || inUseCount === 0;
                        return canDelete ? (
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
                        ) : (
                        <div className="flex-1 py-2 bg-gray-200 text-gray-500 rounded-lg text-xs font-bold text-center" title={`${inUseCount} ${t('route.places')}`}>
                          🔗 {t('auth.inUseBy') || `בשימוש ${inUseCount} מקומות`}
                        </div>
                        );
                      })()}
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
                        // Prevent double-click
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
                          // EDIT MODE
                          const interestId = editingCustomInterest.id;
                          
                          if (newInterest.builtIn) {
                            // Built-in interest - save search config + admin overrides to interestConfig
                            const existingConfig = interestConfig[interestId] || {};
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
                            configData.group = newInterest.group || '';
                            // Preserve admin flags that are set separately
                            if (existingConfig.defaultEnabled !== undefined) configData.defaultEnabled = existingConfig.defaultEnabled;
                            if (existingConfig.adminStatus) configData.adminStatus = existingConfig.adminStatus;
                            if (isUnlocked) {
                              configData.labelOverride = newInterest.label.trim();
                              configData.labelEnOverride = (newInterest.labelEn || '').trim();
                              configData.iconOverride = newInterest.icon || '';
                              configData.locked = newInterest.locked || false;
                              if (newInterest.color) configData.color = newInterest.color;
                            }
                            if (isFirebaseAvailable && database) {
                              database.ref(`settings/interestConfig/${interestId}`).set(configData);
                            } else {
                              setInterestConfig(prev => ({...prev, [interestId]: configData}));
                            }
                          } else {
                            // Custom interest - update in customInterests
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
                              bestTime: newInterest.bestTime || 'anytime', dedupRelated: newInterest.dedupRelated || [],
                              group: newInterest.group || '',
                              ...(newInterest.color ? { color: newInterest.color } : {})
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
                          // ADD MODE - check for duplicate name
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
                              bestTime: newInterest.bestTime || 'anytime', dedupRelated: newInterest.dedupRelated || [],
                              group: newInterest.group || '',
                              ...(newInterest.color ? { color: newInterest.color } : {})
                          };
                          
                          // Close dialog immediately
                          setShowAddInterestDialog(false);
                          setNewInterest({ label: '', labelEn: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, locked: false, scope: 'global', category: 'attraction', weight: 3, minStops: 1, maxStops: 10, routeSlot: 'any', minGap: 1, bestTime: 'anytime', dedupRelated: [] });
                          setEditingCustomInterest(null);
                          
                          // Add to local state immediately so it shows in UI
                          // Mark as recently added to protect from Firebase listener race condition
                          recentlyAddedRef.current.set(interestId, Date.now());
                          setCustomInterests(prev => {
                            if (prev.some(i => i.id === interestId)) return prev;
                            return [...prev, newInterestData];
                          });
                          
                          // Enable the new interest in interestStatus
                          setInterestStatus(prev => ({ ...prev, [interestId]: true }));
                          
                          // Save in background
                          if (isFirebaseAvailable && database) {
                            database.ref(`customInterests/${interestId}`).set(newInterestData)
                              .then(() => {
                                console.log(`[INTEREST-SAVE] Saved to Firebase: ${interestId}`);
                                recentlyAddedRef.current.delete(interestId);
                                showToast(`✅ ${newInterestData.label} — ${t('interests.interestAdded')}`, 'success');
                                // Verify: read back to confirm server actually persisted it
                                database.ref(`customInterests/${interestId}`).once('value').then(snap => {
                                  if (!snap.val()) {
                                    console.error(`[INTEREST-SAVE] ⚠️ VERIFICATION FAILED — saved but read-back is null! Server may have rejected the write.`);
                                    showToast(`⚠️ "${newInterestData.label}" may not have been saved to server`, 'warning', 'sticky');
                                  } else {
                                    console.log(`[INTEREST-SAVE] ✅ Verified on server: ${interestId}`);
                                  }
                                });
                              })
                              .catch(e => {
                                console.error(`[INTEREST-SAVE] FAILED: ${interestId}`, e);
                                showToast(`❌ ${t('toast.saveError')}: ${e.message}`, 'error', 'sticky');
                                saveToPendingInterest(newInterestData, searchConfig);
                              });
                            // Enable interest status in Firebase
                            const userId = localStorage.getItem('bangkok_user_id') || 'unknown';
                            database.ref(`users/${userId}/interestStatus/${interestId}`).set(true).catch(() => {});
                            // Also save admin-level status
                            database.ref(`settings/interestStatus/${interestId}`).set(true).catch(() => {});
                            if (Object.keys(searchConfig).length > 0) {
                              database.ref(`settings/interestConfig/${interestId}`).set(searchConfig)
                                .then(() => console.log(`[INTEREST-SAVE] Config saved: ${interestId}`))
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
                
                // Check duplicates against current route
                const isDup = route?.stops?.some(s => s.name.toLowerCase().trim() === newStop.name.toLowerCase().trim());
                if (isDup) {
                  showToast(`"${display}" ${t("places.alreadyInRoute")}`, 'warning');
                  return;
                }
                
                // Add to manualStops (session state)
                setManualStops(prev => [...prev, newStop]);
                
                // Add to current route if exists
                if (route) {
                  setRoute(prev => prev ? {
                    ...prev,
                    stops: [...prev.stops, newStop],
                    optimized: false
                  } : prev);
                }
                
                showToast(`➕ ${display} ${t("interests.added")}`, 'success');
                
                // Clear input for next add
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
                // Render inline **bold** anywhere in the line
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
            <p className="text-sm text-gray-800 mb-4 text-center font-medium" style={{ whiteSpace: 'pre-line' }}>{confirmConfig.message}</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ zIndex: 200 }}>
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
                📨 {t('settings.send')}
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
              <div className="p-3 border-t flex gap-2" style={{ direction: 'ltr' }}>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-bold text-sm text-gray-600 hover:bg-gray-50"
                >{t('reviews.cancel')}</button>
                <button
                  onClick={saveReview}
                  disabled={reviewDialog.myRating === 0 && !reviewDialog.myText.trim()}
                  className="flex-1 px-4 py-2 rounded-lg font-bold text-sm text-white"
                  style={{ background: (reviewDialog.myRating > 0 || reviewDialog.myText.trim()) ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#d1d5db', cursor: (reviewDialog.myRating > 0 || reviewDialog.myText.trim()) ? 'pointer' : 'not-allowed' }}
                >{t('reviews.save')} ⭐</button>
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
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                  />
                  {window.BKK.speechSupported && (
                    <button
                      onClick={() => {
                        if (isRecording) {
                          // Stop recording
                          if (stopRecordingRef.current) stopRecordingRef.current();
                          stopRecordingRef.current = null;
                          setIsRecording(false);
                        } else {
                          // Start recording
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
                    {allInterestOptions.filter(option => {
                      if (option.scope === 'local' && option.cityId && option.cityId !== selectedCityId) return false;
                      const aStatus = option.adminStatus || (interestConfig[option.id]?.adminStatus) || 'active';
                      if (aStatus === 'hidden') return false;
                      if (aStatus === 'draft' && !isUnlocked) return false;
                      return interestStatus[option.id] !== false;
                    }).map(option => (
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
                          // Remember last interest for next quick capture
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
                      // Default interest if none selected
                      if (!newLocation.interests || newLocation.interests.length === 0) {
                        const defaultInterest = activeTrail?.interests?.[0] || 'spotted';
                        newLocation.interests = [defaultInterest];
                      }
                      // Generate name if empty
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
                    // Check if order changed
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
        {(() => {
          const filtered = bulkDedupResults?.filter(cluster => {
            const all = [cluster.loc, ...cluster.matches];
            return !all.every(p => p.dedupOk);
          }) || [];
          return filtered.length > 0 && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '2px solid #eab308', background: 'linear-gradient(135deg, #fefce8, #fef9c3)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#92400e' }}>🔍 {t('dedup.title')} ({filtered.length})</h3>
              <button onClick={() => setBulkDedupResults(null)} style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #6b7280, #4b5563)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: 'white' }}>
                {t('dedup.close')} ✕
              </button>
            </div>
            
            {/* Scrollable content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
              {filtered.map((cluster, ci) => {
                const allPlaces = [cluster.loc, ...cluster.matches];
                return (
                <div key={ci} style={{ marginBottom: '16px', padding: '12px', background: '#fefce8', border: '2px solid #eab308', borderRadius: '14px' }}>
                  <div style={{ fontSize: '10px', color: '#92400e', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                    {allPlaces.length} {t('route.places')} · {cluster.matches[0]?._distance || 0}m
                  </div>
                  {allPlaces.map((loc, li) => {
                    const interest = allInterestOptions.find(o => loc.interests?.includes(o.id));
                    const icon = interest?.icon?.startsWith?.('data:') ? '📍' : (interest?.icon || '📍');
                    const mapsUrl = window.BKK.getGoogleMapsUrl(loc);
                    return (
                    <div key={li} style={{ marginBottom: '6px', background: 'white', borderRadius: '10px', border: '1px solid #fde68a', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
                        <span style={{ fontSize: '20px' }}>{icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div onClick={() => {
                              const fullLoc = customLocations.find(cl => cl.id === loc.id);
                              if (fullLoc) handleEditLocation(fullLoc);
                            }}
                            style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{loc.name}</div>
                          <div style={{ fontSize: '10px', color: '#9ca3af' }}>{loc.description || ''}</div>
                          {loc.address && <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>{loc.address}</div>}
                        </div>
                      </div>
                      {/* Action buttons row */}
                      <div style={{ display: 'flex', gap: '4px', padding: '0 8px 8px', direction: 'ltr' }}>
                        {mapsUrl && (
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '5px 10px', fontSize: '10px', fontWeight: 'bold', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            🗺️ Google Maps
                          </a>
                        )}
                        {loc.lat && loc.lng && (
                          <span style={{ padding: '5px 8px', fontSize: '9px', color: '#6b7280', background: '#f3f4f6', borderRadius: '6px' }}>
                            {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            showConfirm(`${t('dedup.confirmDelete')}\n\n${loc.name}`, () => {
                              mergeDedupLocations(allPlaces.find(p => p.id !== loc.id)?.id || cluster.loc.id, loc.id);
                            });
                          }}
                          style={{ marginLeft: 'auto', padding: '5px 12px', fontSize: '11px', fontWeight: 'bold', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          🗑️ {t('dedup.remove')}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
                );
              })}
            </div>
          </div>
        );})()}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LOGIN DIALOG */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showLoginDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '16px' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full" style={{ maxWidth: '380px', direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>🐾</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>FouFou</h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{t('auth.loginSubtitle') || 'התחבר כדי לשמור את ההתקדמות שלך'}</p>
            </div>

            {authUser ? (
              /* Already signed in — show profile */
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f0fdf4', borderRadius: '12px', marginBottom: '12px', border: '1px solid #bbf7d0' }}>
                  {authUser.photoURL && <img src={authUser.photoURL} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{authUser.displayName || authUser.email || (t('auth.anonymous') || 'אנונימי')}</div>
                    {authUser.email && <div style={{ fontSize: '11px', color: '#6b7280' }}>{authUser.email}</div>}
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                      {userRole === 2 ? '👑 Admin' : userRole === 1 ? '✏️ Editor' : '👤 ' + (t('auth.regular') || 'משתמש')}
                    </div>
                  </div>
                </div>
                {authUser.isAnonymous && (
                  <div style={{ padding: '10px', background: '#fef3c7', borderRadius: '8px', marginBottom: '10px', border: '1px solid #fbbf24' }}>
                    <div style={{ fontSize: '11px', color: '#92400e', marginBottom: '6px' }}>{t('auth.anonWarning') || '⚠️ חשבון אנונימי — אם תנקה cache הנתונים יאבדו. קשר לחשבון Google כדי לשמור.'}</div>
                    <button onClick={authLinkAnonymousToGoogle}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #f59e0b', background: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#92400e' }}>
                      🔗 {t('auth.linkGoogle') || 'קשר לחשבון Google'}
                    </button>
                  </div>
                )}
                <button onClick={authSignOut}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #fca5a5', background: '#fef2f2', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', color: '#dc2626' }}>
                  🚪 {t('auth.signOut') || 'התנתק'}
                </button>
                {/* Role Impersonation — real admin only */}
                {isRealAdmin && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '6px' }}>🎭 Test as different role:</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { role: null, label: '👑 Admin', desc: 'Real' },
                        { role: 1, label: '✏️ Editor', desc: '' },
                        { role: 0, label: '👤 Regular', desc: '' }
                      ].map(opt => {
                        const isActive = roleOverride === opt.role;
                        return (
                          <button key={String(opt.role)}
                            onClick={() => { setRoleOverride(opt.role); setShowLoginDialog(false); showToast(`🎭 ${opt.label}`, 'info'); }}
                            style={{ flex: 1, padding: '6px 4px', borderRadius: '6px', border: isActive ? '2px solid #7c3aed' : '1px solid #d1d5db', background: isActive ? '#ede9fe' : 'white', fontSize: '11px', fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', color: isActive ? '#7c3aed' : '#6b7280' }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not signed in — show login options */
              <div style={{ padding: '0 20px 20px' }}>
                {/* Google Sign-In */}
                <button onClick={authSignInGoogle}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', background: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {t('auth.continueGoogle') || 'המשך עם Google'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{t('auth.or') || 'או'}</span>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                </div>

                {/* Email login */}
                <div style={{ marginBottom: '8px' }}>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder={t('auth.email') || 'אימייל'}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', marginBottom: '6px', boxSizing: 'border-box' }} />
                  <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder={t('auth.password') || 'סיסמה'}
                    onKeyDown={e => { if (e.key === 'Enter') authSignInEmail(); }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <button onClick={authSignInEmail}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '4px' }}>
                  📧 {loginMode === 'register' ? (t('auth.register') || 'הרשם') : (t('auth.signIn') || 'התחבר')}
                </button>
                <button onClick={() => setLoginMode(loginMode === 'login' ? 'register' : 'login')}
                  style={{ width: '100%', padding: '4px', background: 'none', border: 'none', fontSize: '11px', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>
                  {loginMode === 'register' ? (t('auth.haveAccount') || 'כבר יש חשבון? התחבר') : (t('auth.noAccount') || 'אין חשבון? הירשם')}
                </button>

                {/* Error */}
                {loginError && (
                  <div style={{ marginTop: '8px', padding: '8px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '11px', color: '#dc2626' }}>
                    ⚠️ {loginError}
                  </div>
                )}

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{t('auth.orSkip') || 'או'}</span>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                </div>

                {/* Anonymous */}
                <button onClick={authSignInAnonymous}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '12px', cursor: 'pointer', color: '#6b7280' }}>
                  👻 {t('auth.continueAnonymous') || 'המשך בלי חשבון'}
                </button>
              </div>
            )}

            {/* Close */}
            <div style={{ padding: '0 20px 16px', textAlign: 'center' }}>
              <button onClick={() => { setShowLoginDialog(false); setLoginError(''); }}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: '#9ca3af', cursor: 'pointer' }}>
                {t('general.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* USER MANAGEMENT DIALOG (Admin Only) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showUserManagement && isRealAdmin && (() => {
        const roleLabels = ['👤 Regular', '✏️ Editor', '👑 Admin'];
        const roleColors = ['#6b7280', '#7c3aed', '#dc2626'];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '12px' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full" style={{ maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', direction: 'ltr' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '16px', margin: 0 }}>👥 User Management</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={authLoadAllUsers} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f3f4f6', cursor: 'pointer' }}>🔄</button>
                  <button onClick={() => setShowUserManagement(false)} style={{ fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                {allUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>Loading...</div>
                ) : allUsers.map(user => (
                  <div key={user.uid} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                    {user.photo && <img src={user.photo} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                    {!user.photo && <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email || user.uid.slice(0,12)}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>{user.email || 'anonymous'} · {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '?'}</div>
                    </div>
                    <select value={user.role || 0}
                      onChange={e => authUpdateUserRole(user.uid, parseInt(e.target.value))}
                      disabled={user.uid === authUser?.uid}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', fontWeight: 'bold', color: roleColors[user.role || 0], cursor: user.uid === authUser?.uid ? 'not-allowed' : 'pointer', opacity: user.uid === authUser?.uid ? 0.5 : 1 }}>
                      <option value={0}>👤 Regular</option>
                      <option value={1}>✏️ Editor</option>
                      <option value={2}>👑 Admin</option>
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                {allUsers.length} users · You cannot change your own role
              </div>
            </div>
          </div>
        );
      })()}
