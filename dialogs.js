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
                  {isUnlocked && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newLocation.locked || false}
                        onChange={(e) => setNewLocation({...newLocation, locked: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-xs">🔒 נעול</span>
                    </label>
                  )}
                </div>

                {/* Actions: Skip permanently + Delete (edit mode only) */}
                {showEditLocationDialog && editingLocation && (
                  <div className="border-t border-red-200 bg-red-50 px-4 py-2">
                    {!(editingLocation.locked && !isUnlocked) && (
                      <div className="flex gap-2">
                        {editingLocation.status === 'blacklist' ? (
                          <button
                            onClick={() => {
                              // Restore and mark as inProgress
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
                            ✅ החזר כמקום פעיל
                          </button>
                        ) : (
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
                        )}
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
                      lat: null, lng: null, mapsUrl: '', address: '', uploadedImage: null, imageUrls: [], inProgress: true
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

        {/* Unified Interest Dialog - Add / Edit / Config */}
        {showAddInterestDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">{editingCustomInterest ? `${newInterest.icon?.startsWith?.('data:') ? '' : newInterest.icon} ${newInterest.label}` : 'הוסף תחום עניין'}</h3>
                  {editingCustomInterest && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${newInterest.builtIn ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}`}>
                      {newInterest.builtIn ? '🏗️ מערכת' : '👤 אישי'}
                    </span>
                  )}
                  {!editingCustomInterest && (
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">👤 אישי</span>
                  )}
                  <button
                    onClick={() => showHelpFor('addInterest')}
                    className="bg-white text-purple-600 hover:bg-purple-100 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                    title="עזרה"
                  >?</button>
                </div>
                <button
                  onClick={() => {
                    setShowAddInterestDialog(false);
                    setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', inProgress: false, locked: false });
                    setEditingCustomInterest(null);
                  }}
                  className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
                >✕</button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {/* Name + Icon row */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <label className="block text-xs font-bold mb-1">שם התחום <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newInterest.label}
                      onChange={(e) => setNewInterest({...newInterest, label: e.target.value})}
                      placeholder="לדוגמה: בתי קולנוע"
                      className="w-full p-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500"
                      style={{ direction: 'rtl' }}
                      disabled={newInterest.builtIn}
                      autoFocus={!newInterest.builtIn}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">אייקון</label>
                    {newInterest.icon && newInterest.icon.startsWith('data:') ? (
                      <div className="relative">
                        <img src={newInterest.icon} alt="icon" className="w-full h-10 object-contain rounded-lg border-2 border-gray-300 bg-white" />
                        <button
                          onClick={() => setNewInterest({...newInterest, icon: '📍'})}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] font-bold"
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
                        disabled={newInterest.builtIn}
                      />
                    )}
                    {!newInterest.builtIn && (
                      <label className="block w-full mt-1 p-1 border border-dashed border-gray-300 rounded text-center cursor-pointer hover:bg-gray-50 text-[9px] text-gray-500">
                        📁 קובץ
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
                  <label className="block text-xs font-bold mb-2 text-blue-800">🔍 הגדרות חיפוש</label>
                  
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

                {/* Status toggles */}
                <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newInterest.inProgress || false}
                      onChange={(e) => setNewInterest({...newInterest, inProgress: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-xs">🛠️ בעבודה</span>
                  </label>
                  {isUnlocked && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newInterest.locked || false}
                        onChange={(e) => setNewInterest({...newInterest, locked: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-xs">🔒 נעול</span>
                    </label>
                  )}
                </div>

                {/* Actions: Enable/Disable + Delete (edit mode only) */}
                {editingCustomInterest && (
                  <div className="border-t border-red-200 bg-red-50 px-4 py-2">
                    {!(editingCustomInterest.locked && !isUnlocked) ? (
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
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {interestStatus[editingCustomInterest.id] === false ? '✅ הפעל' : '⏸️ השבת'}
                        </button>
                        {(!newInterest.builtIn || isUnlocked) && (
                          <button
                            onClick={() => {
                              const msg = newInterest.builtIn 
                                ? `⚠️ אתה עומד למחוק תחום מערכת "${newInterest.label}". פעולה זו תסיר אותו לצמיתות. להמשיך?`
                                : `אתה עומד למחוק תחום אישי "${newInterest.label}". להמשיך?`;
                              showConfirm(msg, () => {
                                if (newInterest.builtIn) {
                                  // For built-in: toggle off + remove config
                                  toggleInterestStatus(editingCustomInterest.id);
                                  if (isFirebaseAvailable && database) {
                                    database.ref(`settings/interestConfig/${editingCustomInterest.id}`).remove();
                                  }
                                  showToast('תחום מערכת הוסר', 'success');
                                } else {
                                  deleteCustomInterest(editingCustomInterest.id);
                                }
                                setShowAddInterestDialog(false);
                                setEditingCustomInterest(null);
                              });
                            }}
                            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                          >
                            🗑️ מחק תחום
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-yellow-700">🔒 תחום נעול - פעולות חסומות</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
                {(() => {
                  const isLockedInterest = editingCustomInterest?.locked && !isUnlocked;
                  return isLockedInterest ? (
                    <div className="flex-1 py-2.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-bold text-center">
                      🔒 תחום נעול - צפייה בלבד
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
                          
                          if (!newInterest.builtIn) {
                            // Custom interest - update name/icon too
                            const updatedInterest = {
                              ...editingCustomInterest,
                              label: newInterest.label.trim(),
                              name: newInterest.label.trim(),
                              icon: newInterest.icon || '📍',
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
                          } else {
                            // Built-in interest - save search config only
                            if (isFirebaseAvailable && database) {
                              database.ref(`settings/interestConfig/${interestId}`).set(searchConfig);
                            } else {
                              setInterestConfig(prev => ({...prev, [interestId]: searchConfig}));
                            }
                          }
                          
                          showToast('התחום עודכן!', 'success');
                        } else {
                          // ADD MODE
                          const interestId = 'custom_' + Date.now();
                          const newInterestData = {
                            id: interestId,
                            label: newInterest.label.trim(),
                            name: newInterest.label.trim(),
                            icon: newInterest.icon || '📍',
                            inProgress: newInterest.inProgress || false,
                            locked: newInterest.locked || false
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
                          
                          showToast('התחום נוסף!', 'success');
                        }
                        
                        setShowAddInterestDialog(false);
                        setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', inProgress: false, locked: false });
                        setEditingCustomInterest(null);
                      }}
                      disabled={!newInterest.label?.trim()}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        newInterest.label?.trim()
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {editingCustomInterest ? '💾 שמור' : '➕ הוסף'}
                    </button>
                  );
                })()}
                <button
                  onClick={() => {
                    setShowAddInterestDialog(false);
                    setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', inProgress: false, locked: false });
                    setEditingCustomInterest(null);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                >
                  ✓ סגור
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
              <h2 className="text-xl font-bold text-gray-800">🔒 לוג כניסות</h2>
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
                  <p>אין כניסות עדיין</p>
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
                                משתמש #{log.userId.slice(-8)}
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
                  סה"כ {accessLogs.length} כניסות
                  {hasNewEntries && (
                    <span className="text-red-600 font-bold mr-2">
                      • יש כניסות חדשות שלא נצפו
                    </span>
                  )}
                </div>
                {accessLogs.length > 0 && (
                  <button
                    onClick={() => {
                      showConfirm('למחוק את כל לוג הכניסות? פעולה זו בלתי הפיכה.', () => {
                        if (isFirebaseAvailable && database) {
                          database.ref('accessLog').remove()
                            .then(() => {
                              setAccessLogs([]);
                              setHasNewEntries(false);
                              localStorage.setItem('bangkok_last_seen', Date.now().toString());
                              showToast('הלוג נוקה', 'success');
                            })
                            .catch(err => {
                              console.error('[ACCESS LOG] Clear error:', err);
                              showToast('שגיאה בניקוי הלוג', 'error');
                            });
                        }
                      });
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition"
                  >
                    🗑️ נקה לוג
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
                <h3 className="text-base font-bold">{routeDialogMode === 'add' ? '🗺️ הוסף מסלול שמור' : '🗺️ ערוך מסלול שמור'}</h3>
              </div>
              <button
                onClick={() => { setShowRouteDialog(false); setEditingRoute(null); }}
                className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
              >✕</button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Route info */}
              <div className="bg-blue-50 rounded-lg p-3 space-y-1.5">
                {/* Area */}
                <div className="text-xs text-gray-700">
                  <span className="font-bold">📍 איזור:</span> {editingRoute.areaName || 'ללא איזור'}
                </div>
                {/* Interests */}
                {(() => {
                  const ids = [...new Set((editingRoute.stops || []).flatMap(s => s.interests || []))];
                  return ids.length > 0 && (
                    <div className="flex gap-1 flex-wrap items-center">
                      <span className="text-xs font-bold text-gray-700">🏷️ תחומים:</span>
                      {ids.map((intId, idx) => {
                        const obj = allInterestOptions.find(o => o.id === intId);
                        return obj ? (
                          <span key={idx} className="text-[10px] bg-white px-1.5 py-0.5 rounded" title={obj.label}>
                            {obj.icon} {obj.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  );
                })()}
                {/* Circular / Linear */}
                <div className="text-xs text-gray-700">
                  <span className="font-bold">🔀 סוג:</span> {editingRoute.circular ? '🔄 מעגלי' : '➡️ ליניארי'}
                </div>
                {/* Start point */}
                <div className="text-xs text-gray-700">
                  <span className="font-bold">🚩 נקודת התחלה:</span> {editingRoute.startPoint || editingRoute.startPointCoords?.address || 'המקום הראשון ברשימה'}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold mb-1">שם המסלול</label>
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
                <label className="block text-xs font-bold mb-1">💬 הערות</label>
                <textarea
                  value={editingRoute.notes || ''}
                  onChange={(e) => setEditingRoute({...editingRoute, notes: e.target.value})}
                  placeholder="הערות..."
                  className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg h-16 resize-none"
                  style={{ direction: 'rtl' }}
                  disabled={editingRoute.locked && !isUnlocked}
                />
              </div>

              {/* Stops list */}
              <div>
                <label className="block text-xs font-bold mb-1">תחנות ({editingRoute.stops?.length || 0})</label>
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

              {/* Share buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const shareText = `🗺️ ${editingRoute.name}\n📍 ${editingRoute.areaName}\n🎯 ${editingRoute.stops?.length || 0} תחנות\n${editingRoute.circular ? '🔄 מסלול מעגלי' : '➡️ מסלול ליניארי'}\n\nתחנות:\n${(editingRoute.stops || []).map((s, i) => `${i+1}. ${s.name}${s.address ? ' - ' + s.address : ''}`).join('\n')}`;
                    if (navigator.share) {
                      navigator.share({ title: editingRoute.name, text: shareText });
                    } else {
                      navigator.clipboard.writeText(shareText);
                      showToast('מסלול הועתק ללוח', 'success');
                    }
                  }}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600"
                >
                  📤 שתף מסלול
                </button>
                <button
                  onClick={() => {
                    const pois = (editingRoute.stops || []).map((s, i) => {
                      let line = `${i+1}. ${s.name}`;
                      if (s.address) line += `\n   📍 ${s.address}`;
                      if (s.description) line += `\n   ${s.description}`;
                      if (s.todayHours) line += `\n   🕐 ${s.todayHours}`;
                      if (s.rating) line += `\n   ⭐ ${s.rating}`;
                      const mapsUrl = s.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}` : (s.lat && s.lng ? `https://www.google.com/maps?q=${s.lat},${s.lng}` : '');
                      if (mapsUrl) line += `\n   🗺️ ${mapsUrl}`;
                      return line;
                    }).join('\n\n');
                    const text = `📍 נקודות עניין - ${editingRoute.name}\n${'─'.repeat(30)}\n\n${pois}`;
                    if (navigator.share) {
                      navigator.share({ title: `נקודות עניין - ${editingRoute.name}`, text });
                    } else {
                      navigator.clipboard.writeText(text);
                      showToast('נקודות העניין הועתקו ללוח', 'success');
                    }
                  }}
                  className="flex-1 py-2 bg-indigo-500 text-white rounded-lg text-sm font-bold hover:bg-indigo-600"
                >
                  📋 שתף נקודות עניין
                </button>
              </div>

              {/* Status toggles */}
              <div className="flex gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRoute.inProgress || false}
                    onChange={(e) => setEditingRoute({...editingRoute, inProgress: e.target.checked})}
                    className="rounded"
                    disabled={editingRoute.locked && !isUnlocked}
                  />
                  <span className="text-xs">🛠️ בעבודה</span>
                </label>
                {isUnlocked && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingRoute.locked || false}
                      onChange={(e) => setEditingRoute({...editingRoute, locked: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-xs">🔒 נעול</span>
                  </label>
                )}
              </div>

              {/* Actions: Delete */}
              <div className="border-t border-red-200 bg-red-50 px-4 py-2">
                {!(editingRoute.locked && !isUnlocked) ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        showConfirm(`למחוק את המסלול "${editingRoute.name}"?`, () => {
                          deleteRoute(editingRoute.id);
                          setShowRouteDialog(false);
                          setEditingRoute(null);
                        });
                      }}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                    >
                      🗑️ מחק מסלול
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-xs text-yellow-700">🔒 מסלול נעול - פעולות חסומות</div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
              {(() => {
                const isLockedRoute = editingRoute.locked && !isUnlocked;
                return (
                  <>
                    {isLockedRoute ? (
                      <div className="flex-1 py-2.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-bold text-center">
                        🔒 מסלול נעול - צפייה בלבד
                      </div>
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
                          💾 עדכן
                        </button>
                        <button
                          onClick={() => {
                            loadSavedRoute(editingRoute);
                            setShowRouteDialog(false);
                            setEditingRoute(null);
                          }}
                          className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600"
                        >
                          📍 פתח מסלול
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setShowRouteDialog(false); setEditingRoute(null); }}
                      className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                    >
                      ✓ סגור
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && modalImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4"
          onClick={() => { setShowImageModal(false); setModalImage(null); }}
        >
          <img src={modalImage} alt="enlarged" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}

      {/* Help Dialog */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>❓</span>
                {helpContent[helpContext]?.title || 'עזרה'}
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
              >✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-700" style={{ direction: 'rtl' }}>
              {helpContent[helpContext]?.content.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <h4 key={i} className="font-bold text-gray-900 mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                } else if (line.startsWith('**')) {
                  const parts = line.split('**');
                  return <p key={i} className="mb-1"><strong>{parts[1]}</strong>{parts[2]}</p>;
                } else if (line.startsWith('• ')) {
                  const text = line.substring(2);
                  if (text.includes('**')) {
                    const parts = text.split('**');
                    return <p key={i} className="mr-3 mb-0.5">• <strong>{parts[1]}</strong>{parts[2] || ''}</p>;
                  }
                  return <p key={i} className="mr-3 mb-0.5">• {text}</p>;
                } else if (line.trim() === '') {
                  return <div key={i} className="h-2" />;
                }
                return <p key={i} className="mb-1">{line}</p>;
              })}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 text-sm"
              >הבנתי ✓</button>
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

