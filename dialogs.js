        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
                <h3 className="text-base font-bold">💾 שמור מסלול</h3>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setRouteName('');
                    setRouteNotes('');
                  }}
                  className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1">שם המסלול <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="לדוגמה: טיול ראשון בבנקוק"
                    className="w-full p-2 text-sm border-2 border-green-300 rounded-lg focus:border-green-500"
                    style={{ direction: 'rtl' }}
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold mb-1">הערות (אופציונלי)</label>
                  <textarea
                    value={routeNotes}
                    onChange={(e) => setRouteNotes(e.target.value)}
                    placeholder="תיאור קצר, טיפים, או הערות לעצמך..."
                    className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:border-green-500 resize-none"
                    style={{ direction: 'rtl' }}
                    rows={2}
                  />
                </div>
                
                {/* Route summary */}
                <div className="bg-gray-100 rounded-lg p-2 text-xs text-gray-600">
                  <div>📍 {route?.stops?.length || 0} תחנות</div>
                  <div>🗺️ {route?.areaName || ''}</div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
                <button
                  onClick={saveRoute}
                  disabled={!routeName.trim()}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    routeName.trim()
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  💾 שמור
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setRouteName('');
                    setRouteNotes('');
                  }}
                  className="px-5 py-2.5 rounded-lg bg-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-400"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Location Dialog - REDESIGNED */}
        {(showAddLocationDialog || showEditLocationDialog) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl">
              
              {/* Header - Compact */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">
                    {showEditLocationDialog ? 'ערוך מקום' : 'הוסף מקום'}
                  </h3>
                  <button
                    onClick={() => showHelpFor('addLocation')}
                    className="bg-white text-purple-600 hover:bg-purple-100 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                    title="עזרה"
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
                
                {/* Row 1: Name + Area */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Name - 2 columns */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold mb-1">
                      שם <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => {
                        setNewLocation({...newLocation, name: e.target.value});
                        if (e.target.value.trim()) {
                          const exists = customLocations.find(loc => 
                            loc.name.toLowerCase() === e.target.value.trim().toLowerCase() &&
                            (!editingLocation || loc.id !== editingLocation.id)
                          );
                          if (exists) showToast('שם זה כבר קיים', 'warning');
                        }
                      }}
                      placeholder="שם המקום"
                      className="w-full p-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500"
                      style={{ direction: 'rtl' }}
                      autoFocus
                    />
                  </div>
                  
                  {/* Area - 1 column */}
                  <div>
                    <label className="block text-xs font-bold mb-1">איזור</label>
                    <select
                      value={newLocation.area}
                      onChange={(e) => setNewLocation({...newLocation, area: e.target.value})}
                      className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500"
                      style={{ direction: 'rtl' }}
                    >
                      {areaOptions.map(area => (
                        <option key={area.id} value={area.id}>{area.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Interests - Compact Grid */}
                <div>
                  <label className="block text-xs font-bold mb-1">תחומי עניין</label>
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
                        <span className="text-lg block">{option.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description - NEW */}
                <div>
                  <label className="block text-xs font-bold mb-1">📝 תיאור</label>
                  <input
                    type="text"
                    value={newLocation.description || ''}
                    onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                    placeholder="תיאור קצר של המקום"
                    className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500"
                    style={{ direction: 'rtl' }}
                  />
                </div>

                {/* Image - Compact */}
                <div>
                  <label className="block text-xs font-bold mb-1">📷 תמונה</label>
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
                      <div className="text-xs text-gray-600 mt-1">לחץ להעלאה</div>
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
                  <label className="block text-xs font-bold mb-1">🔗 קישורים</label>
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
                      + קישור
                    </button>
                  </div>
                </div>

                {/* Row 2: Address + Maps Link */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1">🏠 כתובת</label>
                    <input
                      type="text"
                      value={newLocation.address || ''}
                      onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                      placeholder="כתובת"
                      className="w-full p-1.5 text-xs border border-gray-300 rounded-lg focus:border-purple-500"
                      style={{ direction: 'rtl' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">🔗 קישור Maps</label>
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
                  <label className="block text-xs font-bold mb-1.5">📍 קואורדינטות</label>
                  
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
                      title="חפש לפי שם המקום"
                    >
                      <span className="text-sm">🔤</span>
                      <span>שם</span>
                    </button>
                    <button
                      onClick={() => geocodeAddress(newLocation.address)}
                      disabled={!newLocation.address?.trim()}
                      className={`p-1.5 rounded-lg text-[9px] font-bold flex flex-col items-center ${
                        newLocation.address?.trim()
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title="חפש לפי כתובת"
                    >
                      <span className="text-sm">🏠</span>
                      <span>כתובת</span>
                    </button>
                    <button
                      onClick={() => parseMapsUrl(newLocation.mapsUrl)}
                      disabled={!newLocation.mapsUrl?.trim()}
                      className={`p-1.5 rounded-lg text-[9px] font-bold flex flex-col items-center ${
                        newLocation.mapsUrl?.trim()
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title="חלץ מקישור"
                    >
                      <span className="text-sm">🔗</span>
                      <span>קישור</span>
                    </button>
                    <button
                      onClick={getCurrentLocation}
                      className="p-1.5 rounded-lg text-[9px] font-bold bg-green-500 text-white hover:bg-green-600 flex flex-col items-center"
                      title="השתמש ב-GPS"
                    >
                      <span className="text-sm">📍</span>
                      <span>מיקום</span>
                    </button>
                  </div>
                </div>

                {/* Open in Google + Google Info */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                  <div className="flex gap-2">
                    {newLocation.lat && newLocation.lng ? (
                      <a
                        href={newLocation.address?.trim() 
                          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newLocation.address.trim())}`
                          : `https://www.google.com/maps/search/?api=1&query=${newLocation.lat},${newLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 text-center"
                      >
                        🗺️ פתח בגוגל
                      </a>
                    ) : (
                      <button disabled className="flex-1 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-bold cursor-not-allowed">
                        🗺️ פתח בגוגל (אין קואורדינטות)
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
                      {loadingGoogleInfo ? '⏳ טוען...' : '🔎 מידע מגוגל'}
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
                      ❌ המקום לא נמצא ב-Google עבור: "{googlePlaceInfo.searchQuery}"
                    </div>
                  )}
                </div>

                {/* Notes - Compact */}
                <div>
                  <label className="block text-xs font-bold mb-1">💭 הערות</label>
                  <textarea
                    value={newLocation.notes || ''}
                    onChange={(e) => setNewLocation({...newLocation, notes: e.target.value})}
                    placeholder="הערות..."
                    className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:border-purple-500"
                    style={{ direction: 'rtl', minHeight: '50px' }}
                    rows="2"
                  />
                </div>

                {/* Status toggles */}
                <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newLocation.inProgress || false}
                      onChange={(e) => setNewLocation({...newLocation, inProgress: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-xs">🛠️ בעבודה</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newLocation.locked || false}
                      onChange={(e) => setNewLocation({...newLocation, locked: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-xs">🔒 נעול</span>
                  </label>
                </div>

                {/* Actions: Skip permanently + Delete (edit mode only) */}
                {showEditLocationDialog && editingLocation && (
                  <div className="border-t border-red-200 bg-red-50 px-4 py-2">
                    {!(editingLocation.locked && !isUnlocked) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            toggleLocationStatus(editingLocation.id);
                            setShowEditLocationDialog(false);
                            setEditingLocation(null);
                          }}
                          className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600"
                        >
                          🚫 דלג לצמיתות
                        </button>
                        <button
                          onClick={() => {
                            showConfirm(`למחוק את "${editingLocation.name}"?`, () => {
                              deleteCustomLocation(editingLocation.id);
                              setShowEditLocationDialog(false);
                              setEditingLocation(null);
                            });
                          }}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                        >
                          🗑️ מחק מקום
                        </button>
                      </div>
                    )}
                    {editingLocation.locked && !isUnlocked && (
                      <div className="text-center text-xs text-yellow-700">🔒 מקום נעול - פעולות חסומות</div>
                    )}
                  </div>
                )}

              </div>
              
              {/* Footer - Compact */}
              {(() => {
                const isLockedPlace = showEditLocationDialog && editingLocation?.locked && !isUnlocked;
                return (
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
                {isLockedPlace ? (
                  <div className="flex-1 py-2.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-bold text-center">
                    🔒 מקום נעול - צפייה בלבד
                  </div>
                ) : (
                <button
                  onClick={() => {
                    if (!newLocation.name || !newLocation.name.trim()) {
                      showToast('אנא הזן שם למקום', 'warning');
                      return;
                    }
                    if (!newLocation.interests || newLocation.interests.length === 0) {
                      showToast('אנא בחר לפחות תחום עניין אחד', 'warning');
                      return;
                    }
                    const exists = customLocations.find(loc => 
                      loc.name.toLowerCase() === newLocation.name.trim().toLowerCase() &&
                      (!editingLocation || loc.id !== editingLocation.id)
                    );
                    if (exists) {
                      showToast('מקום עם שם זה כבר קיים', 'error');
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
                  {showEditLocationDialog ? '💾 עדכן' : '➕ הוסף'}
                </button>
                )}
                <button
                  onClick={() => {
                    // Save if there's valid content, then close
                    if (newLocation.name?.trim() && newLocation.interests?.length > 0) {
                      const exists = customLocations.find(loc => 
                        loc.name.toLowerCase() === newLocation.name.trim().toLowerCase() &&
                        (!editingLocation || loc.id !== editingLocation.id)
                      );
                      if (!exists) {
                        if (showEditLocationDialog) {
                          updateCustomLocation(true); // Save and close
                        } else {
                          addCustomLocation(true); // Save and close
                        }
                        return;
                      }
                    }
                    // Just close if nothing to save or invalid
                    setShowAddLocationDialog(false);
                    setShowEditLocationDialog(false);
                    setEditingLocation(null);
                    setNewLocation({ 
                      name: '', description: '', notes: '', area: formData.area, interests: [], 
                      lat: null, lng: null, mapsUrl: '', address: '', uploadedImage: null, imageUrls: []
                    });
                  }}
                  className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                >
                  ✓ סגור
                </button>
              </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* Add Custom Interest Dialog */}
        {showAddInterestDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">{editingCustomInterest ? '✏️ ערוך תחום עניין' : 'הוסף תחום עניין'}</h3>
                  <button
                    onClick={() => showHelpFor('addInterest')}
                    className="bg-white text-purple-600 hover:bg-purple-100 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                    title="עזרה"
                  >
                    ?
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowAddInterestDialog(false);
                    setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '' });
                    setEditingCustomInterest(null);
                  }}
                  className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold mb-1">שם התחום <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newInterest.label}
                    onChange={(e) => setNewInterest({...newInterest, label: e.target.value})}
                    placeholder="לדוגמה: בתי קולנוע"
                    className="w-full p-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500"
                    style={{ direction: 'rtl' }}
                    autoFocus
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-xs font-bold mb-1">אייקון</label>
                  <input
                    type="text"
                    value={newInterest.icon}
                    onChange={(e) => {
                      const value = e.target.value;
                      const firstEmoji = [...value][0] || '';
                      setNewInterest({...newInterest, icon: firstEmoji});
                    }}
                    placeholder="📍"
                    className="w-full p-2 text-xl border-2 border-gray-300 rounded-lg focus:border-purple-500 text-center"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 text-center" style={{ direction: 'ltr' }}>
                    Emoji (🎨 🏛️), Unicode, single char
                  </p>
                </div>

                {/* Search Configuration */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <label className="block text-xs font-bold mb-2 text-blue-800">🔍 הגדרות חיפוש</label>
                  
                  {/* Search Mode */}
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
                  
                  {/* Types or Text Query */}
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
                        Searches: "[query] [area] Bangkok"
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
                  
                  {/* Blacklist */}
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
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
                {editingCustomInterest ? (
                  /* Edit mode */
                  <>
                    <button
                      onClick={() => {
                        if (newInterest.label.trim()) {
                          const interestId = editingCustomInterest.id || editingCustomInterest.firebaseId;
                          
                          // Prepare interest data
                          const updatedInterest = {
                            ...editingCustomInterest,
                            label: newInterest.label.trim(),
                            name: newInterest.label.trim(),
                            icon: newInterest.icon || '📍'
                          };
                          
                          // Prepare search config
                          const searchConfig = {};
                          if (newInterest.searchMode === 'text' && newInterest.textSearch) {
                            searchConfig.textSearch = newInterest.textSearch.trim();
                          } else if (newInterest.types) {
                            searchConfig.types = newInterest.types.split(',').map(t => t.trim()).filter(t => t);
                          }
                          if (newInterest.blacklist) {
                            searchConfig.blacklist = newInterest.blacklist.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
                          }
                          
                          if (isFirebaseAvailable && database) {
                            // Save interest
                            database.ref(`customInterests/${editingCustomInterest.firebaseId || interestId}`).update(updatedInterest);
                            // Save search config
                            if (Object.keys(searchConfig).length > 0) {
                              database.ref(`settings/interestConfig/${interestId}`).set(searchConfig);
                            }
                            showToast('התחום עודכן!', 'success');
                          } else {
                            const updated = customInterests.map(ci => ci.id === interestId ? updatedInterest : ci);
                            setCustomInterests(updated);
                            localStorage.setItem('bangkok_custom_interests', JSON.stringify(updated));
                            showToast('התחום עודכן!', 'success');
                          }
                          
                          setShowAddInterestDialog(false);
                          setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '' });
                          setEditingCustomInterest(null);
                        }
                      }}
                      disabled={!newInterest.label.trim()}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        newInterest.label.trim()
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      💾 שמור
                    </button>
                    <button
                      onClick={() => {
                        setShowAddInterestDialog(false);
                        setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '' });
                        setEditingCustomInterest(null);
                      }}
                      className="px-5 py-2.5 rounded-lg bg-gray-400 text-white text-sm font-bold hover:bg-gray-500"
                    >
                      ביטול
                    </button>
                  </>
                ) : (
                  /* Add mode */
                  <>
                    <button
                      onClick={() => {
                        if (newInterest.label.trim()) {
                          // Create new interest with search config
                          const interestId = 'custom_' + Date.now();
                          const newInterestData = {
                            id: interestId,
                            label: newInterest.label.trim(),
                            name: newInterest.label.trim(),
                            icon: newInterest.icon || '📍'
                          };
                          
                          // Prepare search config
                          const searchConfig = {};
                          if (newInterest.searchMode === 'text' && newInterest.textSearch) {
                            searchConfig.textSearch = newInterest.textSearch.trim();
                          } else if (newInterest.types) {
                            searchConfig.types = newInterest.types.split(',').map(t => t.trim()).filter(t => t);
                          }
                          if (newInterest.blacklist) {
                            searchConfig.blacklist = newInterest.blacklist.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
                          }
                          
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
                          
                          showToast('התחום נוסף!', 'success');
                          setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '' });
                        }
                      }}
                      disabled={!newInterest.label.trim()}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        newInterest.label.trim()
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      ➕ הוסף
                    </button>
                    <button
                      onClick={() => {
                        setShowAddInterestDialog(false);
                        setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '' });
                      }}
                      className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                    >
                      ✓ סגור
                    </button>
                  </>
                )}
              </div>
              
            </div>
          </div>
        )}
      
      {/* Import Confirmation Dialog */}
      {showImportDialog && importedData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-t-2xl">
              <h3 className="text-xl font-bold">📥 ייבוא נתונים</h3>
              <p className="text-xs text-blue-100 mt-1">גרסה: {importedData.version || '1.0'}</p>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Current State */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                <div className="font-bold text-gray-800 text-sm mb-1">📊 מצב נוכחי:</div>
                <div className="text-xs text-gray-700 space-y-0.5">
                  <div>• {customInterests.length} תחומי עניין</div>
                  <div>• {customLocations.length} מקומות</div>
                  <div>• {savedRoutes.length} מסלולים שמורים</div>
                </div>
              </div>
              
              {/* Import File Data */}
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                <div className="font-bold text-blue-800 text-sm mb-1">📥 בקובץ:</div>
                <div className="text-xs text-blue-700 space-y-0.5">
                  <div>• {importedData.customInterests?.length || 0} תחומים מותאמים</div>
                  <div>• {importedData.interestConfig ? Object.keys(importedData.interestConfig).length : 0} הגדרות חיפוש</div>
                  <div>• {importedData.interestStatus ? Object.values(importedData.interestStatus).filter(Boolean).length : 0} תחומים פעילים</div>
                  <div>• {importedData.customLocations?.length || 0} מקומות</div>
                  <div>• {importedData.savedRoutes?.length || 0} מסלולים שמורים</div>
                </div>
              </div>
              
              {/* Info */}
              <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                <div className="text-xs text-green-800">
                  <div className="font-bold mb-1">💡 איך הייבוא עובד:</div>
                  <ul className="space-y-0.5 mr-3">
                    <li>• פריטים חדשים <strong>יתווספו</strong></li>
                    <li>• כפילויות (לפי שם) <strong>ידולגו</strong></li>
                    <li>• תחומים חסרים <strong>ייווצרו אוטומטית</strong></li>
                    <li>• <strong>שום דבר לא יימחק</strong></li>
                  </ul>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleImportMerge}
                  className="flex-1 bg-blue-500 text-white py-2.5 px-3 rounded-lg font-bold hover:bg-blue-600 transition text-sm"
                >
                  ✓ ייבא
                </button>
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportedData(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2.5 px-3 rounded-lg font-bold hover:bg-gray-400 transition text-sm"
                >
                  ✕ בטל
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      
      {/* Stop Info Dialog - shows selection criteria */}
      {showStopInfoDialog && selectedStopInfo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowStopInfoDialog(false)}
        >
          <div 
            className="bg-white rounded-xl w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-2.5 rounded-t-xl flex justify-between items-center">
              <h3 className="text-sm font-bold">ⓘ מידע על בחירת המקום</h3>
              <button onClick={() => setShowStopInfoDialog(false)} className="text-white hover:text-gray-200 text-lg leading-none">✕</button>
            </div>
            <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto text-sm">
              {/* Name + source + rating in compact header */}
              <div>
                <div className="font-bold text-base text-gray-800">{selectedStopInfo.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedStopInfo.custom ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                    {selectedStopInfo.custom ? '📍 שלי' : '🌐 Google'}
                  </span>
                  {selectedStopInfo.rating > 0 && (
                    <span className="text-xs text-gray-500">⭐ {selectedStopInfo.rating.toFixed(1)} ({selectedStopInfo.ratingCount || 0})</span>
                  )}
                </div>
              </div>
              
              {/* Interests + search config merged */}
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-xs font-bold text-gray-600 mb-1.5">🏷️ תחום + חיפוש:</div>
                {selectedStopInfo.interests && selectedStopInfo.interests.length > 0 ? (
                  selectedStopInfo.interests.map((interest, idx) => {
                    const interestObj = allInterestOptions.find(opt => opt.id === interest);
                    const config = interestConfig[interest] || {};
                    return (
                      <div key={idx} className="bg-white rounded border border-gray-200 p-2 mb-1.5 last:mb-0">
                        <div className="flex items-center gap-1 mb-1">
                          <span>{interestObj?.icon}</span>
                          <span className="font-bold text-gray-700">{interestObj?.label || interest}</span>
                        </div>
                        <div className="text-[11px] text-gray-500" style={{ direction: 'ltr' }}>
                          {config.textSearch ? (
                            <span>Text: "{config.textSearch}"</span>
                          ) : (
                            <span>Types: {(config.types || []).join(', ') || 'default'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-gray-400 text-xs">לא צוינו תחומי עניין</span>
                )}
              </div>
              
              {/* Blacklist words - always show */}
              <div className="bg-red-50 rounded-lg p-2.5">
                <div className="text-xs font-bold text-red-700 mb-1">🚫 מילות סינון:</div>
                {(() => {
                  const allBlacklistWords = (selectedStopInfo.interests || []).flatMap(interest => {
                    const config = interestConfig[interest] || {};
                    return (config.blacklist || []);
                  });
                  const uniqueWords = [...new Set(allBlacklistWords)];
                  if (uniqueWords.length === 0) return <span className="text-gray-400 text-xs">אין מילות סינון לתחום זה</span>;
                  return (
                    <div className="flex flex-wrap gap-1" style={{ direction: 'ltr' }}>
                      {uniqueWords.map((word, idx) => (
                        <span key={idx} className="bg-white border border-red-200 text-red-600 px-1.5 py-0.5 rounded text-[11px]">{word}</span>
                      ))}
                    </div>
                  );
                })()}
              </div>
              
              {/* Google Place Types - compact */}
              {selectedStopInfo.googleTypes && selectedStopInfo.googleTypes.length > 0 && (
                <div className="bg-green-50 rounded-lg p-2.5" style={{ direction: 'ltr' }}>
                  <div className="text-xs font-bold text-green-700 mb-1" style={{ direction: 'rtl' }}>🏷️ קטגוריות Google:</div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {selectedStopInfo.primaryType && (
                      <span className="bg-green-600 text-white px-1.5 py-0.5 rounded text-[11px] font-bold">{selectedStopInfo.primaryType}</span>
                    )}
                    {selectedStopInfo.googleTypes.filter(t => t !== selectedStopInfo.primaryType).map((type, idx) => (
                      <span key={idx} className="bg-white border border-green-200 text-green-700 px-1.5 py-0.5 rounded text-[11px]">{type}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowStopInfoDialog(false)}
                className="w-full py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
              >סגור</button>
            </div>
          </div>
        </div>
      )}

      {/* Interest Config Dialog */}
      {showInterestConfigDialog && editingInterestConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-t-xl sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold">
                  {editingInterestConfig.icon} {editingInterestConfig.label} - הגדרות חיפוש
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showHelpFor('interestConfig')}
                    className="bg-white text-blue-600 hover:bg-blue-50 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                    title="עזרה"
                  >?</button>
                  <button
                  onClick={() => {
                    setShowInterestConfigDialog(false);
                    setEditingInterestConfig(null);
                  }}
                  className="text-white hover:text-gray-200"
                >✕</button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4" style={{ direction: 'ltr' }}>
              {/* Current Config Display */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="font-bold text-gray-700 mb-2">Current Configuration:</div>
                {editingInterestConfig.config.textSearch ? (
                  <div className="mb-2">
                    <span className="text-blue-600 font-medium">Text Search:</span>
                    <span className="ml-2">"{editingInterestConfig.config.textSearch}"</span>
                  </div>
                ) : (
                  <div className="mb-2">
                    <span className="text-green-600 font-medium">Place Types:</span>
                    <div className="ml-2 text-xs text-gray-600">
                      {(editingInterestConfig.config.types || []).join(', ') || 'None defined'}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-red-600 font-medium">Blacklist Words:</span>
                  <div className="ml-2 text-xs text-gray-600">
                    {(editingInterestConfig.config.blacklist || []).join(', ') || 'None'}
                  </div>
                </div>
              </div>
              
              {/* Edit Section */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Search Mode:
                  </label>
                  <select
                    value={editingInterestConfig.config.textSearch ? 'text' : 'types'}
                    onChange={(e) => {
                      const newConfig = { ...editingInterestConfig.config };
                      if (e.target.value === 'text') {
                        newConfig.textSearch = newConfig.textSearch || '';
                        delete newConfig.types;
                      } else {
                        delete newConfig.textSearch;
                        newConfig.types = newConfig.types || [];
                      }
                      setEditingInterestConfig({
                        ...editingInterestConfig,
                        config: newConfig
                      });
                    }}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="types">Category Search (types)</option>
                    <option value="text">Text Search (query)</option>
                  </select>
                </div>
                
                {editingInterestConfig.config.textSearch !== undefined ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Text Search Query:
                    </label>
                    <input
                      type="text"
                      value={editingInterestConfig.config.textSearch || ''}
                      onChange={(e) => {
                        setEditingInterestConfig({
                          ...editingInterestConfig,
                          config: {
                            ...editingInterestConfig.config,
                            textSearch: e.target.value
                          }
                        });
                      }}
                      placeholder="e.g., street art"
                      className="w-full p-2 border rounded text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Will search: "[query] [area] Bangkok"
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Place Types (comma separated):
                    </label>
                    <input
                      type="text"
                      value={(editingInterestConfig.config.types || []).join(', ')}
                      onChange={(e) => {
                        const types = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                        setEditingInterestConfig({
                          ...editingInterestConfig,
                          config: {
                            ...editingInterestConfig.config,
                            types
                          }
                        });
                      }}
                      placeholder="e.g., art_gallery, museum"
                      className="w-full p-2 border rounded text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      <a href="https://developers.google.com/maps/documentation/places/web-service/place-types" target="_blank" className="text-blue-500 underline">
                        See available types
                      </a>
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Blacklist Words (comma separated):
                  </label>
                  <input
                    type="text"
                    value={(editingInterestConfig.config.blacklist || []).join(', ')}
                    onChange={(e) => {
                      const blacklist = e.target.value.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
                      setEditingInterestConfig({
                        ...editingInterestConfig,
                        config: {
                          ...editingInterestConfig.config,
                          blacklist
                        }
                      });
                    }}
                    placeholder="e.g., cannabis, weed, massage"
                    className="w-full p-2 border rounded text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Places with these words in name will be filtered out
                  </p>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    // Save to Firebase
                    if (isFirebaseAvailable && database) {
                      const configToSave = { ...editingInterestConfig.config };
                      database.ref(`settings/interestConfig/${editingInterestConfig.id}`).set(configToSave)
                        .then(() => {
                          showToast('Configuration saved!', 'success');
                          setShowInterestConfigDialog(false);
                          setEditingInterestConfig(null);
                        })
                        .catch(err => {
                          console.error('Error saving config:', err);
                          showToast('Error saving', 'error');
                        });
                    } else {
                      // Update local state only
                      setInterestConfig(prev => ({
                        ...prev,
                        [editingInterestConfig.id]: editingInterestConfig.config
                      }));
                      showToast('Configuration updated (local only)', 'success');
                      setShowInterestConfigDialog(false);
                      setEditingInterestConfig(null);
                    }
                  }}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600"
                >
                  💾 Save
                </button>
                <button
                  onClick={() => {
                    setShowInterestConfigDialog(false);
                    setEditingInterestConfig(null);
                  }}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
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
                אישור
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification - Subtle */}
      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-t-xl">
              <h3 className="text-base font-bold">🔒 הגדרות נעולות</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600 text-center">הזן סיסמה לפתיחת ההגדרות</p>
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="סיסמה"
                className="w-full p-3 border rounded-lg text-center text-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Check password
                    if (passwordInput === adminPassword) {
                      const userId = localStorage.getItem('bangkok_user_id');
                      const userName = localStorage.getItem('bangkok_user_name') || 'Unknown';
                      // Add to admin list
                      if (isFirebaseAvailable && database) {
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
                          showToast('נפתח בהצלחה!', 'success');
                        });
                      }
                    } else {
                      showToast('סיסמה שגויה', 'error');
                      setPasswordInput('');
                    }
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Check password
                    if (passwordInput === adminPassword) {
                      const userId = localStorage.getItem('bangkok_user_id');
                      const userName = localStorage.getItem('bangkok_user_name') || 'Unknown';
                      // Add to admin list
                      if (isFirebaseAvailable && database) {
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
                          showToast('נפתח בהצלחה!', 'success');
                        });
                      }
                    } else {
                      showToast('סיסמה שגויה', 'error');
                      setPasswordInput('');
                    }
                  }}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium"
                >
                  אישור
                </button>
                <button
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPasswordInput('');
                  }}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium"
                >
                  ביטול
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

