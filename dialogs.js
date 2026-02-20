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
                      lat: null, lng: null, mapsUrl: '', address: '', uploadedImage: null, imageUrls: [], inProgress: true
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
                  {/* Name - full width with search */}
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
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
                        className="flex-1 p-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500"
                        style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                        autoFocus={!showEditLocationDialog}
                      />
                      <button
                        onClick={() => searchPlacesByName(newLocation.name)}
                        disabled={!newLocation.name?.trim()}
                        style={{
                          padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: newLocation.name?.trim() ? 'pointer' : 'not-allowed',
                          background: newLocation.name?.trim() ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#d1d5db', color: 'white', fontSize: '16px'
                        }}
                        title={t("form.searchPlaceGoogle")}
                      >🔍</button>
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
                              setNewLocation({
                                ...newLocation,
                                name: result.name,
                                lat: result.lat, lng: result.lng,
                                address: result.address,
                                mapsUrl: `https://maps.google.com/?q=${result.lat},${result.lng}`,
                                googlePlaceId: result.googlePlaceId
                              });
                              setLocationSearchResults(null);
                              showToast(`✅ ${result.name} ${t("toast.selectedPlace")}`, 'success');
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
                      <label className="text-xs font-bold">{t("general.areas")}</label>
                      <button
                        onClick={() => {
                          const lat = newLocation.lat;
                          const lng = newLocation.lng;
                          if (lat && lng) {
                            const detected = window.BKK.getAreasForCoordinates(lat, lng);
                            if (detected.length > 0) {
                              setNewLocation({...newLocation, areas: detected, area: detected[0]});
                              showToast(`${detected.length} ${t("toast.detectedAreas")}`, 'success');
                            } else {
                              showToast(t('places.locationNotInAnyArea'), 'warning');
                            }
                          } else {
                            showToast(t('places.needCoordsForAreas'), 'warning');
                          }
                        }}
                        className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 font-bold"
                      >{`📍 ${t('form.autoDetect')}`}</button>
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
                  <div className="grid grid-cols-6 gap-1.5 p-2 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                    {allInterestOptions.map(option => (
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

                {/* Description - NEW */}
                <div>
                  <label className="block text-xs font-bold mb-1">{`📝 ${t("places.description")}`}</label>
                  <input
                    type="text"
                    value={newLocation.description || ''}
                    onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                    placeholder={t("places.description")}
                    className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500"
                    style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                  />
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
                          // Save to device
                          const locName = newLocation.label?.en || newLocation.label?.he || 'photo';
                          const safeName = locName.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_').slice(0, 30);
                          window.BKK.saveImageToDevice(result.dataUrl, `foufou_${safeName}_${Date.now()}.jpg`);
                          // Extract GPS from camera photo
                          const gps = await window.BKK.extractGpsFromImage(result.file);
                          if (gps && (!newLocation.lat || !newLocation.lng)) {
                            const updates = { uploadedImage: compressed, lat: gps.lat, lng: gps.lng };
                            // Auto-detect areas from GPS
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
                              // Extract GPS from uploaded photo
                              const gps = await window.BKK.extractGpsFromImage(file);
                              if (gps && (!newLocation.lat || !newLocation.lng)) {
                                const updates = { uploadedImage: compressed, lat: gps.lat, lng: gps.lng };
                                // Auto-detect areas from GPS
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

                {/* Links - Compact */}
                <div>
                  <label className="block text-xs font-bold mb-1">{`🔗 ${t("general.links")}`}</label>
                  <div className="space-y-1">
                    {(newLocation.imageUrls || []).map((url, idx) => (
                      <div key={idx} className="flex gap-1">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const updated = [...(newLocation.imageUrls || [])];
                            updated[idx] = e.target.value;
                            setNewLocation({...newLocation, imageUrls: updated});
                          }}
                          placeholder="https://..."
                          className="flex-1 p-1.5 text-xs border border-gray-300 rounded-lg"
                        />
                        <button
                          onClick={() => {
                            const updated = (newLocation.imageUrls || []).filter((_, i) => i !== idx);
                            setNewLocation({...newLocation, imageUrls: updated});
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setNewLocation({...newLocation, imageUrls: [...(newLocation.imageUrls || []), '']})}
                      className="w-full p-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                    >
                      {`+ ${t("general.link")}`}
                    </button>
                  </div>
                </div>

                {/* Row 2: Address + Maps Link */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1">{`🏠 ${t("places.address")}`}</label>
                    <input
                      type="text"
                      value={newLocation.address || ''}
                      onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                      placeholder={t("places.address")}
                      className="w-full p-1.5 text-xs border border-gray-300 rounded-lg focus:border-purple-500"
                      style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{`🔗 ${t("general.mapsLink")}`}</label>
                    <input
                      type="text"
                      value={newLocation.mapsUrl || ''}
                      onChange={(e) => {
                        setNewLocation({...newLocation, mapsUrl: e.target.value});
                        parseMapsUrl(e.target.value);
                      }}
                      placeholder="Google Maps URL"
                      className="w-full p-1.5 text-xs border border-gray-300 rounded-lg focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Coordinates - SUPER COMPACT */}
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-2">
                  <label className="block text-xs font-bold mb-1.5">{`📍 ${t("general.coordinates")}`}</label>
                  
                  {/* Lat/Lng Inputs */}
                  <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                    <input
                      type="number"
                      step="0.000001"
                      value={newLocation.lat || ''}
                      onChange={(e) => setNewLocation({...newLocation, lat: parseFloat(e.target.value) || null})}
                      placeholder="Lat"
                      className="w-full p-1.5 text-xs border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      value={newLocation.lng || ''}
                      onChange={(e) => setNewLocation({...newLocation, lng: parseFloat(e.target.value) || null})}
                      placeholder="Lng"
                      className="w-full p-1.5 text-xs border border-gray-300 rounded-lg"
                    />
                  </div>

                  {/* Calculate Buttons - Row with labels */}
                  <div className="grid grid-cols-5 gap-1">
                    <button
                      onClick={() => geocodeByName(newLocation.name)}
                      disabled={!newLocation.name?.trim()}
                      className={`p-1.5 rounded-lg text-[9px] font-bold flex flex-col items-center ${
                        newLocation.name?.trim()
                          ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={t("form.searchByName")}
                    >
                      <span className="text-sm">🔤</span>
                      <span>{t("general.name")}</span>
                    </button>
                    <button
                      onClick={() => geocodeAddress(newLocation.address)}
                      disabled={!newLocation.address?.trim()}
                      className={`p-1.5 rounded-lg text-[9px] font-bold flex flex-col items-center ${
                        newLocation.address?.trim()
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={t("form.searchByAddress")}
                    >
                      <span className="text-sm">🏠</span>
                      <span>{t("places.address")}</span>
                    </button>
                    <button
                      onClick={() => parseMapsUrl(newLocation.mapsUrl)}
                      disabled={!newLocation.mapsUrl?.trim()}
                      className={`p-1.5 rounded-lg text-[9px] font-bold flex flex-col items-center ${
                        newLocation.mapsUrl?.trim()
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={t("form.extractFromLink")}
                    >
                      <span className="text-sm">🔗</span>
                      <span>{t("general.link")}</span>
                    </button>
                    <button
                      onClick={getCurrentLocation}
                      className="p-1.5 rounded-lg text-[9px] font-bold bg-green-500 text-white hover:bg-green-600 flex flex-col items-center"
                      title={t("form.gps")}
                    >
                      <span className="text-sm">📍</span>
                      <span>{t("general.location")}</span>
                    </button>
                  </div>
                </div>

                {/* Open in Google + Google Info */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2" style={{ position: 'relative', zIndex: 15 }}>
                  <div className="flex gap-2">
                    {newLocation.lat && newLocation.lng ? (
                      <a
                        href={window.BKK.getGoogleMapsUrl(newLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 text-center"
                      >
                        {t("general.openInGoogle")}
                      </a>
                    ) : (
                      <button disabled className="flex-1 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-bold cursor-not-allowed">
                        🗺️ {t("general.openInGoogleNoCoords")}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setGooglePlaceInfo(null);
                        fetchGooglePlaceInfo(newLocation);
                      }}
                      disabled={!newLocation.name?.trim() || loadingGoogleInfo}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                        newLocation.name?.trim() && !loadingGoogleInfo
                          ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loadingGoogleInfo ? t('general.loading') : t('places.googleInfo')}
                    </button>
                  </div>
                  
                  {/* Google Place Info Results */}
                  {googlePlaceInfo && !googlePlaceInfo.notFound && (
                    <div className="mt-2 text-xs space-y-1 bg-white rounded p-2 border border-indigo-200" style={{ direction: 'ltr' }}>
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
                    <div className="mt-2 text-xs text-red-600 bg-white rounded p-2 border border-red-200">
                      ❌ Place not found on Google for: "{googlePlaceInfo.searchQuery}"
                    </div>
                  )}
                </div>

                {/* Notes - Compact */}
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
                </div>{/* close inner wrapper */}

                {/* Status toggles - only show if not locked for non-admin */}
                {!(showEditLocationDialog && editingLocation?.locked && !isUnlocked) && (
                <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <button type="button"
                    onClick={() => setNewLocation({...newLocation, inProgress: !newLocation.inProgress})}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${newLocation.inProgress ? 'border-amber-500 bg-amber-500 text-white shadow-md' : 'border-gray-300 bg-white text-gray-500 hover:border-amber-300'}`}
                  >
                    {newLocation.inProgress ? '⏳' : '○'} {t("general.inProgress")}
                  </button>
                  {isUnlocked && (
                    <button type="button"
                      onClick={() => setNewLocation({...newLocation, locked: !newLocation.locked})}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${newLocation.locked ? 'border-gray-600 bg-gray-600 text-white shadow-md' : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'}`}
                    >
                      {newLocation.locked ? '🔒' : '○'} {t("general.locked")}
                    </button>
                  )}
                </div>
                )}

                {/* Actions: Skip permanently + Delete (edit mode only) - hidden for locked non-admin */}
                {showEditLocationDialog && editingLocation && !(editingLocation.locked && !isUnlocked) && (
                  <div className="border-t border-red-200 bg-red-50 px-4 py-2">
                    <div className="flex gap-2">
                      {editingLocation.status === 'blacklist' ? (
                        <button
                          onClick={() => {
                            const loc = customLocations.find(l => l.id === editingLocation.id);
                            if (loc && isFirebaseAvailable && database) {
                              database.ref(`customLocations/${loc.firebaseId || loc.id}`).update({ inProgress: true });
                            }
                            toggleLocationStatus(editingLocation.id);
                            setShowEditLocationDialog(false);
                            setEditingLocation(null);
                          }}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600"
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
                          className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600"
                        >
                          🚫 {t('route.skipPermanently')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          showConfirm(`Delete "${editingLocation.name}"?`, () => {
                            deleteCustomLocation(editingLocation.id);
                            setShowEditLocationDialog(false);
                            setEditingLocation(null);
                          });
                        }}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                      >
                        🗑️ {t("general.deletePlace")}
                      </button>
                    </div>
                  </div>
                )}

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
                      addCustomLocation(false);
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
                      lat: null, lng: null, mapsUrl: '', address: '', uploadedImage: null, imageUrls: [], inProgress: true
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
                    setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, inProgress: false, locked: false, scope: 'global' });
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
                      style={{ direction: window.BKK.i18n.isRTL() ? 'rtl' : 'ltr' }}
                      disabled={newInterest.builtIn && !isUnlocked}
                      autoFocus={!newInterest.builtIn}
                    />
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => setNewInterest({...newInterest, icon: reader.result});
                              reader.readAsDataURL(file);
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

                {/* Counter for auto-naming (#️⃣ Next: #7) — only in edit mode */}
                {editingCustomInterest && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-bold text-gray-600">#️⃣</span>
                  <span className="text-[10px] text-gray-500">Next #:</span>
                  <input
                    type="number"
                    min="0"
                    value={(interestCounters[editingCustomInterest.id] || 0) + 1}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      const newCounter = Math.max(0, val - 1);
                      if (isFirebaseAvailable && database) {
                        database.ref(`cities/${selectedCityId}/interestCounters/${editingCustomInterest.id}`).set(newCounter);
                      }
                    }}
                    className="w-16 p-1 text-xs border rounded text-center"
                  />
                  <span className="text-[9px] text-gray-400">({editingCustomInterest.labelEn || editingCustomInterest.label} {'{Area}'} #{(interestCounters[editingCustomInterest.id] || 0) + 1})</span>
                </div>
                )}

                {/* Status toggles - hidden for locked non-admin */}
                {!(editingCustomInterest?.locked && !isUnlocked) && (
                <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <button type="button"
                    onClick={() => setNewInterest({...newInterest, inProgress: !newInterest.inProgress})}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${newInterest.inProgress ? 'border-amber-500 bg-amber-500 text-white shadow-md' : 'border-gray-300 bg-white text-gray-500 hover:border-amber-300'}`}
                  >
                    {newInterest.inProgress ? '⏳' : '○'} {t("general.inProgress")}
                  </button>
                  {isUnlocked && (
                    <button type="button"
                      onClick={() => setNewInterest({...newInterest, locked: !newInterest.locked})}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${newInterest.locked ? 'border-gray-600 bg-gray-600 text-white shadow-md' : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'}`}
                    >
                      {newInterest.locked ? '🔒' : '○'} {t("general.locked")}
                    </button>
                  )}
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
                              ? `Delete system interest "${newInterest.label}" permanently?`
                              : `Delete custom interest "${newInterest.label}"?`;
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
                            const configData = { ...searchConfig };
                            configData.scope = newInterest.scope || 'global';
                            configData.cityId = newInterest.scope === 'local' ? (newInterest.cityId || selectedCityId) : '';
                            if (isUnlocked) {
                              configData.labelOverride = newInterest.label.trim();
                              configData.iconOverride = newInterest.icon || '';
                              configData.inProgress = newInterest.inProgress || false;
                              configData.locked = newInterest.locked || false;
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
                              name: newInterest.label.trim(),
                              icon: newInterest.icon || '📍',
                              privateOnly: newInterest.privateOnly || false,
                              inProgress: newInterest.inProgress || false,
                              locked: newInterest.locked || false,
                              scope: newInterest.scope || 'global',
                              cityId: newInterest.scope === 'local' ? (newInterest.cityId || selectedCityId) : ''
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
                        } else {
                          // ADD MODE - check for duplicate name
                          const dupCheck = customInterests.find(i => 
                            i.label?.toLowerCase().trim() === newInterest.label.toLowerCase().trim() ||
                            i.name?.toLowerCase().trim() === newInterest.label.toLowerCase().trim()
                          );
                          if (dupCheck) {
                            showToast(`⚠️ "${newInterest.label}" ${t('interests.alreadyExists')}`, 'warning');
                            return;
                          }
                          const interestId = 'custom_' + Date.now();
                          const newInterestData = {
                            id: interestId,
                            label: newInterest.label.trim(),
                            name: newInterest.label.trim(),
                            icon: newInterest.icon || '📍',
                            custom: true,
                            privateOnly: newInterest.privateOnly || false,
                            inProgress: newInterest.inProgress || false,
                            locked: newInterest.locked || false,
                            scope: newInterest.scope || 'global',
                            cityId: newInterest.scope === 'local' ? (newInterest.cityId || selectedCityId) : ''
                          };
                          
                          // Close dialog immediately
                          setShowAddInterestDialog(false);
                          setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, inProgress: false, locked: false, scope: 'global' });
                          setEditingCustomInterest(null);
                          
                          // Add to local state immediately so it shows in UI
                          setCustomInterests(prev => {
                            if (prev.some(i => i.id === interestId)) return prev;
                            return [...prev, newInterestData];
                          });
                          
                          // Save in background
                          if (isFirebaseAvailable && database) {
                            database.ref(`customInterests/${interestId}`).set(newInterestData)
                              .then(() => {
                                console.log(`[INTEREST-SAVE] Saved to Firebase: ${interestId}`);
                                showToast(`✅ ${newInterestData.label} — ${t('interests.interestAdded')}`, 'success');
                              })
                              .catch(e => {
                                console.error(`[INTEREST-SAVE] FAILED: ${interestId}`, e);
                                saveToPendingInterest(newInterestData, searchConfig);
                              });
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
                          return; // Skip the setShow/setNew below since we already did it
                        }
                        
                        setShowAddInterestDialog(false);
                        setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, inProgress: false, locked: false, scope: 'global' });
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
                    setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: true, inProgress: false, locked: false, scope: 'global' });
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

              {/* Status toggles - hidden for locked non-admin */}
              {!(editingRoute.locked && !isUnlocked) && (
              <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                <button type="button"
                  onClick={() => setEditingRoute({...editingRoute, inProgress: !editingRoute.inProgress})}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${editingRoute.inProgress ? 'border-amber-500 bg-amber-500 text-white shadow-md' : 'border-gray-300 bg-white text-gray-500 hover:border-amber-300'}`}
                >
                  {editingRoute.inProgress ? '⏳' : '○'} {t("general.inProgress")}
                </button>
                {isUnlocked && (
                  <button type="button"
                    onClick={() => setEditingRoute({...editingRoute, locked: !editingRoute.locked})}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${editingRoute.locked ? 'border-gray-600 bg-gray-600 text-white shadow-md' : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'}`}
                  >
                    {editingRoute.locked ? '🔒' : '○'} {t("general.locked")}
                  </button>
                )}
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
                        showConfirm(`{t("general.deleteRoute")} "${editingRoute.name}"?`, () => {
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
                            inProgress: editingRoute.inProgress,
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
                    stops: [...prev.stops, newStop]
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
            <p className="text-sm text-gray-800 mb-4 text-center font-medium">{confirmConfig.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  if (confirmConfig.onConfirm) confirmConfig.onConfirm();
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
              >
                OK
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400"
              >
                Cancel
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
                      setIsUnlocked(true);
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
                      setIsUnlocked(true);
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
                    // Support both hashed and legacy plaintext passwords
                    if (hashedInput === adminPassword || passwordInput === adminPassword) {
                      const userId = localStorage.getItem('bangkok_user_id');
                      const userName = localStorage.getItem('bangkok_user_name') || 'Unknown';
                      if (isFirebaseAvailable && database) {
                        // If password was plaintext, upgrade to hash
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
                    // Support both hashed and legacy plaintext passwords
                    if (hashedInput === adminPassword || passwordInput === adminPassword) {
                      const userId = localStorage.getItem('bangkok_user_id');
                      const userName = localStorage.getItem('bangkok_user_name') || 'Unknown';
                      if (isFirebaseAvailable && database) {
                        // If password was plaintext, upgrade to hash
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
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowQuickCapture(false); }}>
            <div className="bg-white rounded-t-2xl w-full max-w-lg shadow-2xl" style={{ maxHeight: '85vh', overflow: 'auto' }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', padding: '12px 16px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>📸 {t('trail.capturePlace')}</span>
                <button onClick={() => setShowQuickCapture(false)} style={{ color: 'white', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '12px 16px' }}>
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

                {/* Interest Selection — pick one */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>{t('trail.whatDidYouSee')}</div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {allInterestOptions.map(option => (
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

                {/* Save Button */}
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
                    addCustomLocation(true);
                    setShowQuickCapture(false);
                    showToast('✅ ' + t('trail.saved'), 'success');
                  }}
                  disabled={!newLocation.uploadedImage}
                  style={{
                    width: '100%', padding: '14px', border: 'none', borderRadius: '12px',
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
