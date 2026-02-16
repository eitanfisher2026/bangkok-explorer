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
                  <div style={{ position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.3)' }} />
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
                        style={{ direction: 'rtl' }}
                        autoFocus
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
                            style={{ width: '100%', textAlign: 'right', padding: '6px 10px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: 'none', border: 'none', direction: 'rtl' }}
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
                      >{`📍 Auto-detect`}</button>
                      <label className="text-xs font-bold">Areas</label>
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
                  <label className="block text-xs font-bold mb-1">Interests</label>
                  <div className="grid grid-cols-6 gap-1.5 p-2 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                    {allInterestOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          const current = newLocation.interests || [];
                          setNewLocation({
                            ...newLocation,
                            interests: current.includes(option.id)
                              ? current.filter(i => i !== option.id)
                              : [...current, option.id]
                          });
                        }}
                        className={`p-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          (newLocation.interests || []).includes(option.id)
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-white border border-gray-300 hover:border-purple-300'
                        }`}
                        title={option.label}
                      >
                        <span className="text-lg block">{option.icon?.startsWith?.('data:') ? <img src={option.icon} alt="" className="w-5 h-5 object-contain mx-auto" /> : option.icon}</span>
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
                    style={{ direction: 'rtl' }}
                  />
                </div>

                {/* Image - Compact */}
                <div>
                  <label className="block text-xs font-bold mb-1">📷 Image</label>
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
                      <button
                        onClick={() => setNewLocation({...newLocation, uploadedImage: null})}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full p-3 border-2 border-dashed border-purple-300 rounded-lg text-center cursor-pointer hover:bg-purple-50">
                      <span className="text-2xl">📸</span>
                      <div className="text-xs text-gray-600 mt-1">Click to upload</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setNewLocation({...newLocation, uploadedImage: reader.result});
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Links - Compact */}
                <div>
                  <label className="block text-xs font-bold mb-1">🔗 Links</label>
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
                      + Link
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
                      style={{ direction: 'rtl' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">🔗 Maps link</label>
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
                  <label className="block text-xs font-bold mb-1.5">📍 Coordinates</label>
                  
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
                      <span>Name</span>
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
                      <span>Link</span>
                    </button>
                    <button
                      onClick={getCurrentLocation}
                      className="p-1.5 rounded-lg text-[9px] font-bold bg-green-500 text-white hover:bg-green-600 flex flex-col items-center"
                      title={t("form.gps")}
                    >
                      <span className="text-sm">📍</span>
                      <span>Location</span>
                    </button>
                  </div>
                </div>

                {/* Open in Google + Google Info */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
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
                    style={{ direction: 'rtl', minHeight: '50px' }}
                    rows="2"
                  />
                </div>
                </div>{/* close inner wrapper */}

                {/* Status toggles - only show if not locked for non-admin */}
                {!(showEditLocationDialog && editingLocation?.locked && !isUnlocked) && (
                <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newLocation.inProgress || false}
                      onChange={(e) => setNewLocation({...newLocation, inProgress: e.target.checked})}
                      className="rounded" style={{ accentColor: "#7c3aed", width: "16px", height: "16px" }}
                    />
                    <span className="text-xs">{t("general.inProgress")}</span>
                  </label>
                  {isUnlocked && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!newLocation.locked}
                        onChange={(e) => setNewLocation({...newLocation, locked: e.target.checked})}
                        className="rounded" style={{ accentColor: "#7c3aed", width: "16px", height: "16px" }}
                      />
                      <span className="text-xs">{t("general.locked")}</span>
                    </label>
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
                          🚫 Skip permanently
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
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
                {isLockedPlace ? (
                  <>
                    {newLocation.lat && newLocation.lng && (
                      <a
                        href={window.BKK.getGoogleMapsUrl(newLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 rounded-lg text-sm font-bold text-center bg-green-500 text-white hover:bg-green-600"
                      >
                        {t("general.openInGoogle")}
                      </a>
                    )}
                    <div className="flex-shrink-0 py-2.5 px-3 bg-yellow-100 text-yellow-800 rounded-lg text-[11px] font-bold text-center flex items-center">
                      🔒 View only
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
                      showToast(t('places.placeExists'), 'error');
                      return;
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
                  className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                >
                  ✓ Close
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
                    setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: false, inProgress: false, locked: false });
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
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Icon</label>
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
                  </div>
                </div>

                {/* Search Configuration */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <label className="block text-xs font-bold mb-2 text-blue-800">🔍 Search settings</label>
                  
                  <div className="mb-2">
                    <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>Search Mode:</label>
                    <select
                      value={newInterest.searchMode || 'types'}
                      onChange={(e) => setNewInterest({...newInterest, searchMode: e.target.value})}
                      className="w-full p-1.5 text-sm border rounded"
                      style={{ direction: 'ltr' }}
                    >
                      <option value="types">Category Search (types)</option>
                      <option value="text">Text Search (query)</option>
                    </select>
                  </div>
                  
                  {newInterest.searchMode === 'text' ? (
                    <div className="mb-2">
                      <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>Text Query:</label>
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
                      <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>Place Types (comma separated):</label>
                      <input
                        type="text"
                        value={newInterest.types || ''}
                        onChange={(e) => setNewInterest({...newInterest, types: e.target.value})}
                        placeholder="e.g., movie_theater, museum"
                        className="w-full p-1.5 text-sm border rounded"
                        style={{ direction: 'ltr' }}
                      />
                      <p className="text-[9px] text-gray-500 mt-0.5" style={{ direction: 'ltr' }}>
                        <a href="https://developers.google.com/maps/documentation/places/web-service/place-types" target="_blank" className="text-blue-500 underline">See types list</a>
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-1" style={{ direction: 'ltr' }}>Blacklist Words (comma separated):</label>
                    <input
                      type="text"
                      value={newInterest.blacklist || ''}
                      onChange={(e) => setNewInterest({...newInterest, blacklist: e.target.value})}
                      placeholder="e.g., cannabis, massage"
                      className="w-full p-1.5 text-sm border rounded"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                  
                  {/* Private Only toggle - only for custom interests */}
                  {!newInterest.builtIn && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newInterest.privateOnly || false}
                        onChange={(e) => setNewInterest({...newInterest, privateOnly: e.target.checked})}
                        className="rounded" style={{ accentColor: "#7c3aed", width: "16px", height: "16px" }}
                      />
                      <span className="text-xs font-bold text-blue-800">🔒 Private interest</span>
                      <span className="text-[9px] text-gray-500">— My places only, no Google</span>
                    </label>
                  </div>
                  )}
                </div>
                </div>{/* close inner wrapper */}

                {/* Status toggles - hidden for locked non-admin */}
                {!(editingCustomInterest?.locked && !isUnlocked) && (
                <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newInterest.inProgress || false}
                      onChange={(e) => setNewInterest({...newInterest, inProgress: e.target.checked})}
                      className="rounded" style={{ accentColor: "#7c3aed", width: "16px", height: "16px" }}
                    />
                    <span className="text-xs">{t("general.inProgress")}</span>
                  </label>
                  {isUnlocked && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!newInterest.locked}
                        onChange={(e) => setNewInterest({...newInterest, locked: e.target.checked})}
                        className="rounded" style={{ accentColor: "#7c3aed", width: "16px", height: "16px" }}
                      />
                      <span className="text-xs">{t("general.locked")}</span>
                    </label>
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
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
                {(() => {
                  const isLockedInterest = editingCustomInterest?.locked && !isUnlocked;
                  return isLockedInterest ? (
                    <div className="flex-shrink-0 py-2.5 px-3 bg-yellow-100 text-yellow-800 rounded-lg text-[11px] font-bold text-center flex items-center">
                      🔒 View only
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!newInterest.label.trim()) return;
                        
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
                              locked: newInterest.locked || false
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
                          // ADD MODE
                          const interestId = 'custom_' + Date.now();
                          const newInterestData = {
                            id: interestId,
                            label: newInterest.label.trim(),
                            name: newInterest.label.trim(),
                            icon: newInterest.icon || '📍',
                            privateOnly: newInterest.privateOnly || false,
                            inProgress: newInterest.inProgress || false,
                            locked: newInterest.locked || false,
                            cityId: selectedCityId
                          };
                          
                          if (isFirebaseAvailable && database) {
                            database.ref(`customInterests/${interestId}`).set(newInterestData);
                            if (Object.keys(searchConfig).length > 0) {
                              database.ref(`settings/interestConfig/${interestId}`).set(searchConfig);
                            }
                          } else {
                            const updated = [...customInterests, newInterestData];
                            setCustomInterests(updated);
                            localStorage.setItem('bangkok_custom_interests', JSON.stringify(updated));
                          }
                          
                          showToast(t('interests.interestAdded'), 'success');
                        }
                        
                        setShowAddInterestDialog(false);
                        setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: false, inProgress: false, locked: false });
                        setEditingCustomInterest(null);
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
                    setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', privateOnly: false, inProgress: false, locked: false });
                    setEditingCustomInterest(null);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                >
                  ✓ Close
                </button>
              </div>

            </div>
          </div>
        )}

            {/* Access Log Dialog */}
      {showAccessLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-800">🔒 Access Log</h2>
              <button
                onClick={() => setShowAccessLog(false)}
                className="text-2xl font-bold text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {accessLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-2">📭</p>
                  <p>{t("general.noRegisteredUsers")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accessLogs.map((log, index) => {
                    const date = new Date(log.timestamp);
                    const isNew = log.timestamp > parseInt(localStorage.getItem('bangkok_last_seen') || '0');
                    
                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg border-2 ${
                          isNew ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isNew && <span className="text-red-500 font-bold">🆕</span>}
                              <span className="font-bold text-sm">
                                {`User #${log.userId.slice(-8)}`}
                              </span>
                              {log.country && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                  {log.countryCode === 'IL' ? '🇮🇱' : log.countryCode === 'TH' ? '🇹🇭' : '🌍'} {log.country}
                                </span>
                              )}
                            </div>
                            {(log.city || log.region) && (
                              <div className="text-xs text-indigo-600 mt-1 font-medium">
                                📍 {[log.city, log.region].filter(Boolean).join(', ')}
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-1">
                              📅 {date.toLocaleDateString('he-IL', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })}
                              {' '}
                              🕐 {date.toLocaleTimeString('he-IL', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {log.browser && (
                                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                  🌐 {log.browser}
                                </span>
                              )}
                              {log.os && (
                                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                  {log.os === 'iPhone' || log.os === 'iPad' || log.os === 'Android' ? '📱' : '💻'} {log.os}
                                </span>
                              )}
                              {log.screenSize && (
                                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                  📐 {log.screenSize}
                                </span>
                              )}
                              {log.language && (
                                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                  🗣️ {log.language}
                                </span>
                              )}
                            </div>
                            {(log.isp || log.ip) && (
                              <div className="text-[10px] text-gray-400 mt-1">
                                {log.isp && <span>🏢 {log.isp}</span>}
                                {log.ip && <span className="mr-2">  IP: {log.ip}</span>}
                              </div>
                            )}
                            {!log.country && log.userAgent && (
                              <div className="text-[10px] text-gray-400 mt-1 truncate">
                                {log.userAgent}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  {`Total: ${accessLogs.length}`}
                  {hasNewEntries && (
                    <span className="text-red-600 font-bold mr-2">
                      • New entries
                    </span>
                  )}
                </div>
                {accessLogs.length > 0 && (
                  <button
                    onClick={() => {
                      showConfirm(t('settings.deleteAllConfirm'), () => {
                        if (isFirebaseAvailable && database) {
                          database.ref('accessLog').remove()
                            .then(() => {
                              setAccessLogs([]);
                              setHasNewEntries(false);
                              localStorage.setItem('bangkok_last_seen', Date.now().toString());
                              showToast(t('toast.logCleared'), 'success');
                            })
                            .catch(err => {
                              console.error('[ACCESS LOG] Clear error:', err);
                              showToast(t('toast.logClearError'), 'error');
                            });
                        }
                      });
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition"
                  >
                    🗑️ {t("general.clearLog")}
                  </button>
                )}
              </div>
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
                  <span className="font-bold">📍 Area:</span> {editingRoute.areaName || t('general.noArea')}
                </div>
                {/* Interests */}
                {(() => {
                  const ids = [...new Set((editingRoute.stops || []).flatMap(s => s.interests || []))];
                  return ids.length > 0 && (
                    <div className="flex gap-1 flex-wrap items-center">
                      <span className="text-xs font-bold text-gray-700">🏷️ Interests:</span>
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
                <label className="block text-xs font-bold mb-1">Route name</label>
                <input
                  type="text"
                  value={editingRoute.name || ''}
                  onChange={(e) => setEditingRoute({...editingRoute, name: e.target.value})}
                  className="w-full p-2 text-sm border-2 border-blue-300 rounded-lg"
                  style={{ direction: 'rtl' }}
                  disabled={editingRoute.locked && !isUnlocked}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold mb-1">💬 Notes</label>
                <textarea
                  value={editingRoute.notes || ''}
                  onChange={(e) => setEditingRoute({...editingRoute, notes: e.target.value})}
                  placeholder={t("places.notes")}
                  className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg h-16 resize-none"
                  style={{ direction: 'rtl' }}
                  disabled={editingRoute.locked && !isUnlocked}
                />
              </div>

              {/* Stops list */}
              <div>
                <label className="block text-xs font-bold mb-1">{t("general.stopsCount")} ({editingRoute.stops?.length || 0})</label>
                <div className="max-h-32 overflow-y-auto space-y-0.5">
                  {(editingRoute.stops || []).map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400">{idx + 1}.</span>
                      <span className="font-medium truncate">{stop.name}</span>
                      {stop.rating && <span className="text-yellow-600">⭐{stop.rating}</span>}
                    </div>
                  ))}
                </div>
              </div>
              </div>{/* close inner wrapper */}

              {/* Share buttons - always available */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const shareText = `🗺️ ${editingRoute.name}\n📍 ${editingRoute.areaName}\n🎯 ${editingRoute.stops?.length || 0} stops\n${editingRoute.circular ? t('route.circularRoute') : t('route.linearDesc')}\n\nstops:\n${(editingRoute.stops || []).map((s, i) => `${i+1}. ${s.name}${s.address ? ' - ' + s.address : ''}`).join('\n')}`;
                    if (navigator.share) {
                      navigator.share({ title: editingRoute.name, text: shareText });
                    } else {
                      navigator.clipboard.writeText(shareText);
                      showToast(t('route.routeCopied'), 'success');
                    }
                  }}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600"
                >
                  📤 {t("general.shareRoute")}
                </button>
                <button
                  onClick={() => {
                    const pois = (editingRoute.stops || []).map((s, i) => {
                      let line = `${i+1}. ${s.name}`;
                      if (s.address) line += `\n   📍 ${s.address}`;
                      if (s.description) line += `\n   ${s.description}`;
                      if (s.todayHours) line += `\n   🕐 ${s.todayHours}`;
                      if (s.rating) line += `\n   ⭐ ${s.rating}`;
                      const mapsUrl = (() => { const u = window.BKK.getGoogleMapsUrl(s); return u === '#' ? '' : u; })();
                      if (mapsUrl) line += `\n   🗺️ ${mapsUrl}`;
                      return line;
                    }).join('\n\n');
                    const text = `📍 POI - ${editingRoute.name}\n${'─'.repeat(30)}\n\n${pois}`;
                    if (navigator.share) {
                      navigator.share({ title: `POI - ${editingRoute.name}`, text });
                    } else {
                      navigator.clipboard.writeText(text);
                      showToast(t('route.pointsCopied'), 'success');
                    }
                  }}
                  className="flex-1 py-2 bg-indigo-500 text-white rounded-lg text-sm font-bold hover:bg-indigo-600"
                >
                  📋 {t("general.sharePoi")}
                </button>
              </div>

              {/* Status toggles - hidden for locked non-admin */}
              {!(editingRoute.locked && !isUnlocked) && (
              <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRoute.inProgress || false}
                    onChange={(e) => setEditingRoute({...editingRoute, inProgress: e.target.checked})}
                    className="rounded" style={{ accentColor: "#7c3aed", width: "16px", height: "16px" }}
                  />
                  <span className="text-xs">{t("general.inProgress")}</span>
                </label>
                {isUnlocked && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingRoute.locked}
                      onChange={(e) => setEditingRoute({...editingRoute, locked: e.target.checked})}
                      className="rounded" style={{ accentColor: "#7c3aed", width: "16px", height: "16px" }}
                    />
                    <span className="text-xs">{t("general.locked")}</span>
                  </label>
                )}
              </div>
              )}

              {/* Actions: Delete - hidden for locked non-admin */}
              {!(editingRoute.locked && !isUnlocked) && (
              <div className="border-t border-red-200 bg-red-50 px-4 py-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      showConfirm(`{t("general.deleteRoute")} "${editingRoute.name}"?`, () => {
                        deleteRoute(editingRoute.id);
                        setShowRouteDialog(false);
                        setEditingRoute(null);
                      });
                    }}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                  >
                    🗑️ {t("general.deleteRoute")}
                  </button>
                </div>
              </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
              {(() => {
                const isLockedRoute = editingRoute.locked && !isUnlocked;
                return (
                  <>
                    {isLockedRoute ? (
                      <>
                        <button
                          onClick={() => {
                            loadSavedRoute(editingRoute);
                            setShowRouteDialog(false);
                            setEditingRoute(null);
                          }}
                          className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600"
                        >
                          📍 {t("general.openRoute")}
                        </button>
                        <div className="flex-shrink-0 py-2.5 px-3 bg-yellow-100 text-yellow-800 rounded-lg text-[11px] font-bold text-center">
                          🔒 View only
                        </div>
                      </>
                    ) : (
                      <>
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
                          💾 Update
                        </button>
                        <button
                          onClick={() => {
                            loadSavedRoute(editingRoute);
                            setShowRouteDialog(false);
                            setEditingRoute(null);
                          }}
                          className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600"
                        >
                          📍 {t("general.openRoute")}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setShowRouteDialog(false); setEditingRoute(null); }}
                      className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                    >
                      ✓ Close
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
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" style={{ direction: 'rtl' }}>
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
                    style={{ direction: 'rtl' }}
                    autoFocus
                  />
                  <button
                    onClick={searchManualPlace}
                    className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap bg-purple-500 text-white hover:bg-purple-600"
                  >
                    🔍 Search
                  </button>
                </div>
                
                <p className="text-[11px] text-gray-500">
                  💡 Search and click to add to route. You can add multiple places.
                </p>
                
                {manualStops.length > 0 && (
                  <div className="text-[11px] text-purple-600 font-bold">
                    {`📍 ${manualStops.length} places added manually`}
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
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" style={{ direction: 'rtl' }}>
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
                    style={{ direction: 'rtl' }}
                    autoFocus
                  />
                  <button
                    onClick={searchAddress}
                    className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap bg-green-500 text-white hover:bg-green-600"
                  >
                    🔍 Search
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
                dir="rtl"
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
              <h3 className="text-base font-bold">📥 Import data</h3>
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
                  <span>🏷️ Custom interests</span>
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
                    <span>⚙️ Search settings</span>
                    <span className="font-bold text-gray-600">{Object.keys(importedData.interestConfig).length}</span>
                  </div>
                )}
                {importedData.interestStatus && (
                  <div className="flex justify-between text-sm">
                    <span>✅ Interest status</span>
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

      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-t-xl">
              <h3 className="text-base font-bold">🔒 Locked settings</h3>
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

            {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            left: '10px',
            maxWidth: '350px',
            margin: '0 auto',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: toastMessage.type === 'error' ? '#fecaca' : toastMessage.type === 'warning' ? '#fde68a' : toastMessage.type === 'info' ? '#dbeafe' : '#bbf7d0',
            border: `1px solid ${toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'warning' ? '#f59e0b' : toastMessage.type === 'info' ? '#3b82f6' : '#22c55e'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 9999,
            animation: 'slideDown 0.15s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px' }}>
              {toastMessage.type === 'error' ? '✗' : toastMessage.type === 'warning' ? '!' : toastMessage.type === 'info' ? 'ℹ' : '✓'}
            </span>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
              {toastMessage.message}
            </div>
          </div>
        </div>
      )}

