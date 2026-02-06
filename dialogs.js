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
                        className="w-full h-24 object-cover rounded-lg border-2 border-purple-300"
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
                    {newLocation.lat && newLocation.lng && (
                      <a
                        href={`https://www.google.com/maps?q=${newLocation.lat},${newLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-[9px] font-bold bg-orange-500 text-white hover:bg-orange-600 flex flex-col items-center"
                        title="בדוק על המפה"
                      >
                        <span className="text-sm">🗺️</span>
                        <span>בדוק</span>
                      </a>
                    )}
                  </div>
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

              </div>
              
              {/* Footer - Compact */}
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
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
                      updateCustomLocation(false); // Save but don't close
                    } else {
                      addCustomLocation(false); // Save but don't close (resets form for new entry)
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
                  <h3 className="text-base font-bold">הוסף תחום עניין</h3>
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
                    setNewInterest({ label: '', icon: '📍', baseCategory: '' });
                  }}
                  className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
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

                <div>
                  <label className="block text-xs font-bold mb-1">אייקון (אימוג'י)</label>
                  <input
                    type="text"
                    value={newInterest.icon}
                    onChange={(e) => setNewInterest({...newInterest, icon: e.target.value})}
                    placeholder="📍"
                    maxLength="2"
                    className="w-full p-2 text-xl border-2 border-gray-300 rounded-lg focus:border-purple-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">תחום בסיס <span className="text-red-500">*</span></label>
                  <select
                    value={newInterest.baseCategory || ''}
                    onChange={(e) => setNewInterest({...newInterest, baseCategory: e.target.value})}
                    className="w-full p-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500"
                    style={{ direction: 'rtl' }}
                  >
                    <option value="">-- בחר תחום בסיס --</option>
                    {interestOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-600">לחץ על <strong>?</strong> בכותרת להסבר מפורט</span>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2" style={{ direction: 'rtl' }}>
                <button
                  onClick={() => {
                    if (newInterest.label.trim() && newInterest.baseCategory) {
                      addCustomInterest();
                      // Reset for another entry but stay open
                      setNewInterest({ label: '', icon: '📍', baseCategory: '' });
                    }
                  }}
                  disabled={!newInterest.label.trim() || !newInterest.baseCategory}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    newInterest.label.trim() && newInterest.baseCategory
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ➕ הוסף
                </button>
                <button
                  onClick={() => {
                    if (newInterest.label.trim() && newInterest.baseCategory) {
                      addCustomInterest();
                    }
                    setShowAddInterestDialog(false);
                    setNewInterest({ label: '', icon: '📍', baseCategory: '' });
                  }}
                  className="px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                >
                  ✓ סגור
                </button>
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
                  <div>• {importedData.customInterests?.length || 0} תחומי עניין</div>
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
      
      {/* Location Detail Modal - Full details for custom locations */}
      {showLocationDetailModal && selectedLocation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowLocationDetailModal(false);
            setSelectedLocation(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-bold">📍 פרטי המקום</h3>
              <button
                onClick={() => {
                  setShowLocationDetailModal(false);
                  setSelectedLocation(null);
                }}
                className="bg-white text-purple-600 rounded-full w-8 h-8 font-bold hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Image */}
              {selectedLocation.uploadedImage && (
                <div className="relative">
                  <img 
                    src={selectedLocation.uploadedImage} 
                    alt={selectedLocation.name}
                    className="w-full h-64 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                    onClick={() => {
                      setModalImage(selectedLocation.uploadedImage);
                      setShowImageModal(true);
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    👆 לחץ להגדלה
                  </div>
                </div>
              )}
              
              {/* Image URLs */}
              {selectedLocation.imageUrls && selectedLocation.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedLocation.imageUrls.filter(url => url).map((url, idx) => (
                    <a 
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-xs hover:underline truncate"
                    >
                      🔗 תמונה {idx + 1}
                    </a>
                  ))}
                </div>
              )}
              
              {/* Name */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {selectedLocation.name}
                  {selectedLocation.outsideArea && (
                    <span className="text-orange-500 text-lg" title="מחוץ לגבולות האזור">🔺</span>
                  )}
                </h2>
              </div>
              
              {/* Description */}
              {selectedLocation.description && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-blue-900 mb-1">📝 תיאור:</div>
                  <div className="text-sm text-gray-700">{selectedLocation.description}</div>
                </div>
              )}
              
              {/* Notes */}
              {selectedLocation.notes && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-yellow-900 mb-1">💭 הערות פרטיות:</div>
                  <div className="text-sm text-gray-700 italic">{selectedLocation.notes}</div>
                </div>
              )}
              
              {/* Area */}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-gray-700">🗺️ איזור:</span>
                <span className="bg-gray-200 px-3 py-1 rounded-full">
                  {areaOptions.find(a => a.id === selectedLocation.area)?.label || selectedLocation.area}
                </span>
              </div>
              
              {/* Interests Tags */}
              {selectedLocation.interests && selectedLocation.interests.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-gray-700 mb-2">🏷️ תחומי עניין:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.interests.map(intId => {
                      const interest = allInterestOptions.find(opt => opt.id === intId);
                      return interest ? (
                        <span key={intId} className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold">
                          {interest.icon} {interest.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {/* Location */}
              {selectedLocation.lat && selectedLocation.lng && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-green-900 mb-2">📍 מיקום:</div>
                  <div className="text-xs text-gray-600 mb-2 font-mono">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-green-500 text-white text-center py-2 rounded-lg font-bold hover:bg-green-600 transition"
                  >
                    🗺️ פתח ב-Google Maps
                  </a>
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t-2 border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingLocation(selectedLocation);
                    setNewLocation(selectedLocation);
                    setShowEditLocationDialog(true);
                    setShowLocationDetailModal(false);
                  }}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition"
                >
                  ✏️ ערוך מקום
                </button>
                <button
                  onClick={() => {
                    setShowLocationDetailModal(false);
                    setSelectedLocation(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition"
                >
                  ✕ סגור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Modal - Full screen image view */}
      {showImageModal && modalImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => {
            setShowImageModal(false);
            setModalImage(null);
          }}
        >
          <div className="relative max-w-4xl max-h-screen p-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
                setModalImage(null);
              }}
              className="absolute top-6 right-6 bg-white text-black rounded-full w-12 h-12 text-2xl font-bold z-10 shadow-lg hover:bg-gray-200"
            >
              ✕
            </button>
            <img 
              src={modalImage} 
              alt="Full view"
              className="max-w-full max-h-screen object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      
      {/* Access Log Modal (Admin Only) */}
      {showAccessLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-800">🔒 לוג כניסות</h2>
              <button
                onClick={() => setShowAccessLog(false)}
                className="text-2xl font-bold text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
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
            
            {/* Footer with clear button */}
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
      
      {/* Confirm Dialog (replaces browser confirm) */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-base font-bold text-gray-800 mb-3 text-center">
              אישור מחיקה
            </h3>
            <p className="text-sm text-gray-700 text-center mb-5">
              {confirmConfig.message}
            </p>
            <div className="flex gap-2" style={{ direction: 'rtl' }}>
              <button
                onClick={() => {
                  if (confirmConfig.onConfirm) {
                    confirmConfig.onConfirm();
                  }
                  setShowConfirmDialog(false);
                  setConfirmConfig({ message: '', onConfirm: null });
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600"
              >
                מחק
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmConfig({ message: '', onConfirm: null });
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>❓</span>
                {helpContent[helpContext]?.title || 'עזרה'}
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-xl hover:bg-white hover:bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-700" style={{ direction: 'rtl' }}>
              {helpContent[helpContext]?.content.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <h4 key={i} className="font-bold text-gray-900 mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                } else if (line.startsWith('**')) {
                  const parts = line.split('**');
                  return (
                    <p key={i} className="mb-1">
                      <strong>{parts[1]}</strong>{parts[2]}
                    </p>
                  );
                } else if (line.startsWith('• ')) {
                  const text = line.substring(2);
                  if (text.includes('**')) {
                    const parts = text.split('**');
                    return (
                      <p key={i} className="mr-3 mb-0.5">
                        • <strong>{parts[1]}</strong>{parts[2] || ''}
                      </p>
                    );
                  }
                  return <p key={i} className="mr-3 mb-0.5">• {text}</p>;
                } else if (line.trim() === '') {
                  return <div key={i} className="h-2" />;
                }
                return <p key={i} className="mb-1">{line}</p>;
              })}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 text-sm"
              >
                הבנתי ✓
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification - Subtle */}
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
