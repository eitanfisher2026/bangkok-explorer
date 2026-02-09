
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50" dir="rtl">
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bangkok Explorer 🇹🇭</h1>
          <div className="text-left">
            <span className="text-xs opacity-70 block">v{window.BKK.VERSION}</span>
            <span className="text-[8px] opacity-50">© 2026 Eitan Fisher</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-32">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-lg p-1.5 shadow">
          <button
            onClick={() => setCurrentView('form')}
            className={`flex-1 min-w-0 py-2 px-1 rounded-lg font-medium transition text-[10px] sm:text-xs leading-tight ${
              currentView === 'form' || currentView === 'route' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="truncate text-center">🗺️ מסלול</div>
          </button>
          <button
            onClick={() => setCurrentView('saved')}
            className={`flex-1 min-w-0 py-2 px-1 rounded-lg font-medium transition text-[10px] sm:text-xs leading-tight ${
              currentView === 'saved' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="truncate text-center">💾 {savedRoutes.length > 0 ? `(${savedRoutes.length})` : ''}</div>
          </button>
          <button
            onClick={() => setCurrentView('myPlaces')}
            className={`flex-1 min-w-0 py-2 px-1 rounded-lg font-medium transition text-[10px] sm:text-xs leading-tight ${
              currentView === 'myPlaces' || currentView === 'search' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="truncate text-center">📍 {customLocations.length > 0 ? `(${customLocations.length})` : ''}</div>
          </button>
          <button
            onClick={() => setCurrentView('myInterests')}
            className={`flex-1 min-w-0 py-2 px-1 rounded-lg font-medium transition text-[10px] sm:text-xs leading-tight ${
              currentView === 'myInterests' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="truncate text-center">🏷️ {Object.values(interestStatus).filter(Boolean).length > 0 ? `(${Object.values(interestStatus).filter(Boolean).length})` : ''}</div>
          </button>
          <button
            onClick={() => {
              if (isUnlocked || !adminPassword) {
                setCurrentView('settings');
              } else {
                setShowPasswordDialog(true);
              }
            }}
            className={`flex-1 min-w-0 py-2 px-1 rounded-lg font-medium transition text-[10px] sm:text-xs leading-tight ${
              currentView === 'settings' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="truncate text-center">{(isUnlocked || !adminPassword) ? '🔓' : '🔒'}</div>
          </button>
        </div>

        {/* Form View */}

        {/* === VIEWS (from views.js) === */}
        {currentView === 'form' && (
          <div className="bg-white rounded-xl shadow-lg p-3 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-base font-bold text-center">תכנן את הטיול</h2>
              <button
                onClick={() => showHelpFor('main')}
                className="text-gray-400 hover:text-blue-500 text-sm"
                title="עזרה"
              >
                ❓
              </button>
            </div>

            {/* Split Layout: Areas (right) | Interests (left) */}
            <div className="grid grid-cols-[95px_1fr] gap-3 items-start" style={{ paddingBottom: '60px' }}>
              
              {/* Right Column: Areas */}
              <div className="flex flex-col">
                <div className="flex items-center justify-center gap-1 mb-1.5">
                  <label className="font-medium text-xs block text-center">🗺️ איזור</label>
                  <button
                    onClick={detectArea}
                    disabled={isLocating}
                    className={`px-1 py-0.5 rounded text-[10px] ${isLocating ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                    title="זהה איזור לפי מיקום נוכחי"
                  >
                    {isLocating ? '⏳' : '📍'}
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-1.5">
                  <div className="space-y-1.5">
                    {areaOptions.map(area => (
                      <button
                        key={area.id}
                        onClick={() => setFormData({...formData, area: area.id})}
                        style={{
                          border: formData.area === area.id ? '3px solid #3b82f6' : '2px solid #d1d5db',
                          backgroundColor: formData.area === area.id ? '#dbeafe' : '#ffffff',
                          boxShadow: formData.area === area.id ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none'
                        }}
                        className="w-full p-1.5 rounded-lg text-xs"
                      >
                        <div className="text-base mb-0.5">{area.icon}</div>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '10px',
                          color: formData.area === area.id ? '#1e40af' : '#374151'
                        }}>{area.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Left Column: Interests */}
              <div className="flex flex-col">
                <label className="font-medium text-xs mb-1.5 block">⭐ מה מעניין?</label>
                <div className="grid grid-cols-3 gap-2 border border-gray-200 rounded-lg p-2">
                {allInterestOptions.filter(option => {
                  if (!option || !option.id) return false;
                  // Must be valid (have search config)
                  if (!isInterestValid(option.id)) return false;
                  // Custom interests always shown (if valid)
                  const isCustom = customInterests.some(ci => ci.id === option.id);
                  if (isCustom) return true;
                  // Built-in/uncovered shown only if active
                  return interestStatus[option.id] !== false;
                }).map(option => {
                  const tooltip = interestTooltips[option.id] || option.label;
                  const customInterest = customInterests.find(ci => ci.id === option.id);
                  const isCustom = !!customInterest;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleInterest(option.id)}
                      title={tooltip}
                      style={{
                        border: formData.interests.includes(option.id) ? '3px solid #f97316' : '2px solid #d1d5db',
                        backgroundColor: formData.interests.includes(option.id) ? '#fed7aa' : '#ffffff',
                        boxShadow: formData.interests.includes(option.id) ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : 'none',
                        position: 'relative'
                      }}
                      className="p-1.5 rounded-lg text-xs"
                    >
                      <div className="text-lg mb-1">{option.icon}</div>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '11px',
                        color: formData.interests.includes(option.id) ? '#c2410c' : '#374151'
                      }}>{option.label}</div>
                    </button>
                  );
                })}
              </div>
              {formData.interests.length > 0 && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#059669',
                  backgroundColor: '#d1fae5',
                  padding: '8px',
                  borderRadius: '8px'
                }}>
                  ✓ {formData.interests.length} נבחרו
                </div>
              )}
              </div>
              {/* End of Left Column */}
              
            </div>
            {/* End of Split Layout */}

            {/* Generate Button - sticky at bottom for mobile */}
            <div style={{
              position: 'sticky',
              bottom: '20px',
              zIndex: 100,
              marginTop: '20px'
            }}>
              <button
                onClick={generateRoute}
                disabled={formData.interests.length === 0}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                  opacity: formData.interests.length === 0 ? 0.5 : 1
                }}
              >
                {isGenerating ? 'מחפש...' : `🔍 מצא נקודות עניין (${formData.maxStops} מקומות)`}
              </button>
              <button
                onClick={() => showHelpFor('searchLogic')}
                className="bg-white text-blue-600 hover:bg-blue-50 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow border border-blue-200"
                title="איך המערכת מוצאת מקומות?"
              >
                ?
              </button>
            </div>
            
            {formData.interests.length === 0 && (
              <p className="text-center text-gray-500 text-xs">בחר לפחות תחום עניין אחד</p>
            )}

            {/* Show stops list ONLY after route is calculated */}
            {route && (
              <div id="route-results" className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mt-4" dir="rtl">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-blue-900 text-sm">מקומות ב{route.areaName} ({route.stops.length}):</h3>
                  <button
                    onClick={() => showHelpFor('placesListing')}
                    className="text-blue-400 hover:text-blue-600 text-sm"
                    title="עזרה"
                  >
                    ❓
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
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
                    
                    return Object.entries(groupedStops).map(([interest, stops]) => {
                      const interestObj = allInterestOptions.find(opt => opt.id === interest);
                      if (!interestObj) return null;
                      
                      return (
                        <div key={interest} className="bg-white rounded-lg p-2 border border-gray-200">
                          {/* Interest header with fetch-more button */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="font-bold text-xs text-gray-700 flex items-center gap-1">
                              <span style={{ fontSize: '14px' }}>{interestObj.icon}</span>
                              <span>{interestObj.label} ({stops.length})</span>
                            </div>
                            <button
                              onClick={async () => {
                                // Fetch more for this specific interest
                                await fetchMoreForInterest(interest);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                              title={`הוסף עוד ${interestObj.label}`}
                            >
                              + עוד
                            </button>
                          </div>
                          
                          {/* Stops in this interest */}
                          <div className="space-y-1.5">
                            {stops.map((stop) => {
                              const hasValidCoords = stop.lat && stop.lng && stop.lat !== 0 && stop.lng !== 0;
                              const stopId = stop.id || stop.originalIndex;
                              const isDisabled = disabledStops.includes(stopId);
                              const isCustom = stop.custom;
                              const isAddedLater = stop.addedLater;
                              
                              return (
                                <div key={stop.originalIndex} className="p-1.5 rounded border relative" style={{ 
                                  borderColor: !hasValidCoords ? '#ef4444' : isAddedLater ? '#60a5fa' : isDisabled ? '#9ca3af' : '#e5e7eb',
                                  borderWidth: isAddedLater ? '2px' : '1px',
                                  borderStyle: isAddedLater ? 'dashed' : 'solid',
                                  backgroundColor: !hasValidCoords ? '#fef2f2' : isAddedLater ? '#eff6ff' : isDisabled ? '#f3f4f6' : '#fafafa',
                                  opacity: isDisabled ? 0.6 : 1
                                }}>
                                  {/* Action buttons */}
                                  <div className="absolute top-0.5 left-0.5 flex gap-0.5">
                                    {/* Temporary skip button - toggles between active/paused */}
                                    <button
                                      onClick={() => toggleStopActive(stop.originalIndex)}
                                      className={`text-[9px] px-1 py-0.5 rounded ${isDisabled ? 'bg-yellow-500 text-white' : 'bg-gray-400 text-white'}`}
                                      title={isDisabled ? 'החזר למסלול' : 'דלג זמנית'}
                                    >
                                      {isDisabled ? '⏸️' : '✕'}
                                    </button>
                                    
                                    {(() => {
                                      // Check if this place is in blacklist
                                      const blacklisted = customLocations.find(loc => 
                                        loc.name.toLowerCase() === stop.name.toLowerCase() && 
                                        loc.status === 'blacklist'
                                      );
                                      
                                      if (blacklisted) {
                                        // Show GREEN undo button - removes from blacklist
                                        return (
                                          <button
                                            onClick={() => {
                                              deleteCustomLocation(blacklisted.id);
                                              showToast(`"${stop.name}" חזר לרשימה הרגילה`, 'success');
                                            }}
                                            className="text-[9px] px-1 py-0.5 rounded bg-green-500 text-white hover:bg-green-600"
                                            title="בטל דילוג קבוע"
                                          >
                                            ✅
                                          </button>
                                        );
                                      }
                                      
                                      // Show permanent skip button (for non-custom places, regardless of isDisabled)
                                      if (!isCustom) {
                                        return (
                                          <button
                                            onClick={() => skipPlacePermanently(stop)}
                                            className="text-[9px] px-1 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
                                            title="דלג לצמיתות"
                                          >
                                            🚫
                                          </button>
                                        );
                                      }
                                      
                                      return null;
                                    })()}
                                    
                                    {!isCustom && (
                                      (() => {
                                        const placeId = stop.id || stop.name;
                                        const isAdding = addingPlaceIds.includes(placeId);
                                        const existingLoc = customLocations.find(loc => 
                                          loc.name.toLowerCase().trim() === stop.name.toLowerCase().trim()
                                        );
                                        
                                        if (existingLoc) {
                                          // Place was added - show edit button
                                          return (
                                            <button
                                              onClick={() => handleEditLocation(existingLoc)}
                                              className="text-[9px] px-1 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                                              title="ערוך (נוסף לרשימה)"
                                            >
                                              ✏️
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
                                            title="הוסף לרשימה שלי"
                                          >
                                            {isAdding ? '...' : '+'}
                                          </button>
                                        );
                                      })()
                                    )}
                                    
                                    {isCustom && (
                                      <button
                                        onClick={() => {
                                          const customLoc = customLocations.find(loc => loc.name === stop.name);
                                          if (customLoc) {
                                            handleEditLocation(customLoc);
                                          }
                                        }}
                                        className="text-[9px] px-1 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                                        title="ערוך"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                  </div>
                                  
                                  <a
                                    href={hasValidCoords ? `https://www.google.com/maps/search/?api=1&query=${stop.address?.trim() ? encodeURIComponent(stop.address.trim()) : `${stop.lat},${stop.lng}`}` : '#'}
                                    target={hasValidCoords ? "_blank" : undefined}
                                    rel={hasValidCoords ? "noopener noreferrer" : undefined}
                                    className="block hover:bg-gray-100 transition pr-2"
                                    onClick={(e) => {
                                      if (!hasValidCoords) {
                                        e.preventDefault();
                                        showToast('למקום זה אין קואורדינטות. לחץ על ✏️ כדי לערוך.', 'warning');
                                      }
                                    }}
                                  >
                                    <div className="font-bold text-[11px] flex items-center gap-1" style={{
                                      color: hasValidCoords ? '#2563eb' : '#dc2626'
                                    }}>
                                      {!hasValidCoords && (
                                        <span title="אין קואורדינטות - לא יכלל במסלול" style={{ fontSize: '11px' }}>
                                          ❗
                                        </span>
                                      )}
                                      <span>{stop.name}</span>
                                      {/* Info icon - show selection criteria */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setSelectedStopInfo(stop);
                                          setShowStopInfoDialog(true);
                                        }}
                                        className="text-blue-500 hover:text-blue-700 ml-1"
                                        title="מידע על בחירת המקום"
                                        style={{ fontSize: '10px' }}
                                      >ⓘ</button>
                                      {stop.outsideArea && (
                                        <span className="text-orange-500" title="מקום מחוץ לגבולות האזור" style={{ fontSize: '10px' }}>
                                          🔺
                                        </span>
                                      )}
                                      {isCustom && (
                                        <span title="מקום שלי" style={{ fontSize: '11px' }}>🎖️</span>
                                      )}
                                      {isAddedLater && (
                                        <span className="text-blue-500 font-bold" title="נוסף ב+עוד" style={{ fontSize: '9px' }}>+עוד</span>
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
                                          className="hover:scale-110 transition"
                                          title="הצג תמונה"
                                          style={{ fontSize: '11px' }}
                                        >
                                          📷
                                        </button>
                                      )}
                                      {/* Interest icons */}
                                      {stop.interests?.map((int, idx) => {
                                        const intObj = allInterestOptions.find(opt => opt.id === int);
                                        return intObj?.icon ? (
                                          <span 
                                            key={idx}
                                            title={intObj.label}
                                            style={{ fontSize: '11px' }}
                                          >
                                            {intObj.icon}
                                          </span>
                                        ) : null;
                                      })}
                                    </div>
                                    <div className="text-[10px]" style={{
                                      color: hasValidCoords ? '#6b7280' : '#991b1b'
                                    }}>
                                      {hasValidCoords ? stop.description : '⚠️ חסרות קואורדינטות'}
                                    </div>
                                    {stop.todayHours && (
                                      <div className="text-[9px]" style={{ color: stop.openNow ? '#059669' : '#dc2626' }}>
                                        🕐 {stop.openNow ? 'פתוח' : 'סגור'} · {stop.todayHours}
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
                
                <div className="mt-3 space-y-2">
                  <a
                    href={(() => {
                      // Filter active stops with valid coordinates
                      const activeStops = route.stops.filter((s, i) => {
                        const isActive = !disabledStops.includes(s.id || i);
                        const hasValidCoords = s.lat && s.lng && s.lat !== 0 && s.lng !== 0;
                        return isActive && hasValidCoords;
                      });
                      
                      if (activeStops.length === 0) {
                        return '#';
                      }
                      
                      // Calculate center
                      const avgLat = activeStops.reduce((sum, s) => sum + s.lat, 0) / activeStops.length;
                      const avgLng = activeStops.reduce((sum, s) => sum + s.lng, 0) / activeStops.length;
                      
                      // Create search query with all active place names
                      const query = activeStops.map(s => s.name).join(' OR ');
                      
                      // Return search URL with active places
                      return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${avgLat},${avgLng},13z`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const activeStops = route.stops.filter((s, i) => {
                        const isActive = !disabledStops.includes(s.id || i);
                        const hasValidCoords = s.lat && s.lng && s.lat !== 0 && s.lng !== 0;
                        return isActive && hasValidCoords;
                      });
                      if (activeStops.length === 0) {
                        e.preventDefault();
                        showToast('אין מקומות עם קואורדינטות תקינות', 'warning');
                      }
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      textAlign: 'center',
                      padding: '10px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      fontSize: '14px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                      marginBottom: '4px'
                    }}
                  >
                    🗺️ הצג את כל המקומות על המפה
                  </a>
                  
                  
                  {/* URL limit note */}
                  <p style={{
                    fontSize: '10px',
                    color: '#6b7280',
                    textAlign: 'center',
                    marginBottom: '8px',
                    fontStyle: 'italic'
                  }}>
                    מגבלת טלפון: עד ~6 מקומות (250 תווים)
                  </p>
                  
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
                          onChange={() => setRouteType('circular')}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>מעגלי</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="routeType"
                          checked={routeType === 'linear'}
                          onChange={() => setRouteType('linear')}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>לינארי</span>
                      </label>
                    </div>
                    
                    {/* Start Point Input with GPS + validate buttons */}
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">📍 נקודת התחלה (אופציונלי)</label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={formData.startPoint}
                          onChange={(e) => {
                            setFormData({...formData, startPoint: e.target.value});
                            setStartPointCoords(null);
                          }}
                          placeholder="לדוגמה: BTS Asok, שם מלון..."
                          className="flex-1 p-1.5 border border-gray-300 rounded-lg text-xs"
                          style={{ direction: 'rtl' }}
                        />
                        <button
                          onClick={validateStartPoint}
                          disabled={isLocating || !formData.startPoint?.trim()}
                          className={`px-1.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                            isLocating || !formData.startPoint?.trim() ? 'bg-gray-300 text-gray-500' : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                          title="אמת כתובת"
                        >
                          🔍
                        </button>
                        <button
                          onClick={getMyLocation}
                          disabled={isLocating}
                          className={`px-1.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${isLocating ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                          title="מיקום נוכחי"
                        >
                          {isLocating ? '⏳' : '📍'}
                        </button>
                        {(formData.startPoint?.trim() || startPointCoords) && (
                          <button
                            onClick={() => {
                              setFormData({...formData, startPoint: ''});
                              setStartPointCoords(null);
                            }}
                            className="px-1.5 py-1.5 rounded-lg text-xs font-bold bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600"
                            title="נקה נקודת התחלה"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {startPointCoords ? (
                        <p style={{ fontSize: '10px', color: '#16a34a', marginTop: '3px', fontWeight: 'bold' }}>
                          ✅ נקודת התחלה נקלטה ({startPointCoords.lat.toFixed(4)}, {startPointCoords.lng.toFixed(4)})
                        </p>
                      ) : formData.startPoint?.trim() ? (
                        <p style={{ fontSize: '10px', color: '#d97706', marginTop: '3px' }}>
                          ⚠️ לחץ 🔍 לאימות הכתובת כדי שתשמש כנקודת התחלה במפה
                        </p>
                      ) : (
                        <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px', fontStyle: 'italic' }}>
                          💡 אם לא תבחר - המסלול יתחיל מהמקום הראשון
                        </p>
                      )}
                    </div>
                    
                    {/* Buttons row: Open in Google + Save */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                      {/* Open in Google Maps Button */}
                      <button
                        onClick={() => {
                          // Build Google Maps URL based on routeType
                          const activeStops = route.stops.filter((stop, i) => {
                            const isActive = !disabledStops.includes(stop.id || i);
                            const hasValidCoords = stop.lat && stop.lng && stop.lat !== 0 && stop.lng !== 0;
                            return isActive && hasValidCoords;
                          });
                          
                          if (activeStops.length === 0) {
                            showToast('אין מקומות עם קואורדינטות תקינות', 'warning');
                            return;
                          }

                          // Use startPointCoords as origin if available, otherwise first stop
                          const hasStartPoint = startPointCoords && startPointCoords.lat && startPointCoords.lng;
                          const origin = hasStartPoint 
                            ? `${startPointCoords.lat},${startPointCoords.lng}`
                            : `${activeStops[0].lat},${activeStops[0].lng}`;
                          // If using startPoint, all stops are waypoints; otherwise first stop is origin
                          const stopsForRoute = hasStartPoint ? activeStops : activeStops.slice(1);
                          let destination, waypointsStr, mapUrl;

                          if (activeStops.length === 1 && !hasStartPoint) {
                            // Single stop, no start point - just show location
                            mapUrl = `https://www.google.com/maps/search/?api=1&query=${activeStops[0].lat},${activeStops[0].lng}`;
                          } else {
                            // Multiple stops or has start point - create route
                            if (routeType === 'circular') {
                              destination = origin; // Return to start
                              waypointsStr = (hasStartPoint ? activeStops : activeStops.slice(1)).map(s => `${s.lat},${s.lng}`).join('|');
                            } else {
                              destination = `${activeStops[activeStops.length - 1].lat},${activeStops[activeStops.length - 1].lng}`;
                              const middleStops = hasStartPoint ? activeStops.slice(0, -1) : activeStops.slice(1, -1);
                              waypointsStr = middleStops.map(s => `${s.lat},${s.lng}`).join('|');
                            }
                            
                            mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
                            if (waypointsStr) mapUrl += `&waypoints=${waypointsStr}`;
                            mapUrl += '&travelmode=walking';
                          }

                          // Open in new tab
                          window.open(mapUrl, '_blank');
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#22c55e',
                          color: 'white',
                          textAlign: 'center',
                          padding: '10px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        🗺️ פתח מסלול בגוגל
                      </button>
                      
                      {/* Save Route Button - no background */}
                      {route.name ? (
                        <span
                          style={{
                            padding: '10px',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={`נשמר: ${route.name}`}
                        >
                          ✅
                        </span>
                      ) : (
                        <button
                          onClick={() => quickSaveRoute()}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '10px',
                            fontSize: '18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="שמור מסלול"
                        >
                          💾
                        </button>
                      )}
                    </div>
                    
                    {/* Waypoints limit note */}
                    <p style={{
                      fontSize: '10px',
                      color: '#6b7280',
                      textAlign: 'center',
                      marginTop: '4px',
                      fontStyle: 'italic'
                    }}>
                      מגבלת טלפון: עד 25 מקומות
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'route' && route && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <button
              onClick={() => setCurrentView('form')}
              style={getButtonStyle(false)}
              className="mb-4"
            >
              ← חזרה לטופס
            </button>

            {/* Save Route Button */}
            {!route.name && (
              <button
                onClick={() => quickSaveRoute()}
                className="w-full bg-purple-500 text-white py-3 rounded-lg font-bold hover:bg-purple-600 mb-4"
              >
                💾 שמור מסלול זה
              </button>
            )}

            {route.name && (
              <div className="bg-green-50 border-2 border-green-500 p-3 rounded-lg mb-4">
                <p className="text-green-800 font-medium">📌 {route.name}</p>
                {route.notes && (
                  <p className="text-xs text-green-700 mt-1">📝 {route.notes}</p>
                )}
                <p className="text-xs text-green-600">נשמר ב-{new Date(route.savedAt).toLocaleDateString('he-IL')}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold">{route.areaName} - {route.interestsText || 'כללי'}</h2>
              <button
                onClick={() => showHelpFor('route')}
                className="text-gray-400 hover:text-blue-500 text-sm"
                title="עזרה"
              >
                ❓
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              נקודת התחלה: {route.startPoint}
            </p>
            
            {/* Stats - show breakdown of place sources */}
            {route.stats && (route.stats.custom > 0 || route.stats.fetched > 0) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-3 mb-4">
                <div className="text-xs font-bold text-gray-700 mb-2">📊 מקורות המקומות:</div>
                <div className="flex gap-2 flex-wrap">
                  {route.stats.custom > 0 && (
                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      ⭐ {route.stats.custom} מותאמים אישית
                    </span>
                  )}
                  {route.stats.fetched > 0 && (
                    <span className={`text-white text-xs px-2 py-1 rounded-full font-bold ${
                      route.stats.source === 'static' ? 'bg-purple-600' : 'bg-green-600'
                    }`}>
                      {route.stats.source === 'static' ? '📚' : '🌐'} {route.stats.fetched} {route.stats.source === 'static' ? 'סטטי' : 'מ-Google API'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Errors display if any */}
            {route.errors && route.errors.length > 0 && (
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-xl">❌</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-800 mb-1">שגיאות בקבלת מקומות</p>
                    <div className="text-xs text-red-700 space-y-1">
                      {route.errors.map((err, i) => (
                        <div key={i}>• {err.interest}: {err.error}</div>
                      ))}
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      פרטים מלאים ב-Console (F12) - העתק ושלח לתיקון
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning if didn't reach requested max stops */}
            {route.incomplete && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-yellow-800 mb-1">
                      נמצאו {route.incomplete.found} מקומות במקום {route.incomplete.requested} המבוקשים
                    </p>
                    <p className="text-xs text-yellow-700">
                      {formData.interests.length === 1 
                        ? 'אין מספיק מקומות תואמים בתחום זה באזור הנבחר'
                        : 'לא נמצאו מספיק מקומות תואמים בחלק מתחומי העניין באזור הנבחר'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">תחנות ({route.stops.length}):</h3>
                <button
                  onClick={() => {
                    setNewLocation(prev => ({...prev, area: formData.area}));
                    setShowAddLocationDialog(true);
                  }}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600"
                >
                  ➕ הוסף מקום
                </button>
              </div>
              {route.stops.map((stop, i) => {
                const stopId = stop.id || i;
                const isDisabled = disabledStops.includes(stopId);
                const isCustom = stop.custom;
                const hasValidCoords = stop.lat && stop.lng && stop.lat !== 0 && stop.lng !== 0;
                
                // Determine source badge
                let sourceBadge = null;
                if (stop.custom) {
                  sourceBadge = { text: '🎖️ שלי', color: 'bg-purple-500', title: 'מקום מותאם אישית' };
                } else {
                  // Everything else is from Google Places
                  sourceBadge = { text: '🔍 Google', color: 'bg-blue-500', title: 'ממקומות Google Places' };
                }
                
                return (
                  <div key={i} className={`border-r-4 pr-3 py-2 ${isDisabled ? 'border-gray-300 opacity-50' : hasValidCoords ? 'border-orange-500' : 'border-red-500'}`}
                    style={{ backgroundColor: hasValidCoords ? 'transparent' : '#fef2f2' }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex gap-2 flex-1">
                        <div className={`rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0 ${isDisabled ? 'bg-gray-400 text-white' : hasValidCoords ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}`}>
                          {isDisabled ? '✕' : hasValidCoords ? i + 1 : '❗'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!hasValidCoords && (
                              <span 
                                title="אין קואורדינטות - לא יכלל במסלול"
                                style={{ fontSize: '14px', color: '#dc2626' }}
                              >
                                ❗
                              </span>
                            )}
                            <a
                              href={hasValidCoords ? `https://www.google.com/maps/search/?api=1&query=${stop.address?.trim() ? encodeURIComponent(stop.address.trim()) : `${stop.lat},${stop.lng}`}` : '#'}
                              target={hasValidCoords ? "_blank" : undefined}
                              rel={hasValidCoords ? "noopener noreferrer" : undefined}
                              className={`font-bold text-sm ${isDisabled ? 'line-through text-gray-500' : hasValidCoords ? 'text-blue-600 hover:text-blue-800' : 'text-red-600'}`}
                              onClick={(e) => {
                                if (!hasValidCoords) {
                                  e.preventDefault();
                                  showToast('למקום זה אין קואורדינטות. ערוך את המקום כדי להוסיף.', 'warning');
                                }
                              }}
                            >
                              {stop.name}
                            </a>
                            {/* Info icon - show selection criteria */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedStopInfo(stop);
                                setShowStopInfoDialog(true);
                              }}
                              className="text-blue-500 hover:text-blue-700 ml-1"
                              title="מידע על בחירת המקום"
                              style={{ fontSize: '12px' }}
                            >ⓘ</button>
                            {stop.outsideArea && (
                              <span 
                                className="text-orange-500" 
                                title="מקום מחוץ לגבולות האזור"
                                style={{ fontSize: '14px' }}
                              >
                                🔺
                              </span>
                            )}
                            {stop.interests && stop.interests.length > 0 && (
                              <>
                                {stop.interests.map((interest, idx) => {
                                  const interestObj = allInterestOptions.find(opt => opt.id === interest);
                                  return interestObj?.icon ? (
                                    <span 
                                      key={idx}
                                      title={interestObj.label}
                                      style={{ fontSize: '16px' }}
                                    >
                                      {interestObj.icon}
                                    </span>
                                  ) : null;
                                })}
                              </>
                            )}
                            {stop.custom ? (
                              <div className="relative group">
                                <button
                                  onClick={() => {
                                    const customLoc = customLocations.find(loc => loc.name === stop.name);
                                    if (customLoc) {
                                      handleEditLocation(customLoc);
                                    }
                                  }}
                                  className={`${sourceBadge.color} text-white text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer hover:opacity-80 transition`}
                                  title="לחץ לפרטים מלאים"
                                >
                                  {sourceBadge.text}
                                </button>
                                
                                {/* Hover Tooltip */}
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-64">
                                  <div className="bg-gray-900 text-white p-3 rounded-lg shadow-2xl text-xs">
                                    {stop.uploadedImage && (
                                      <img 
                                        src={stop.uploadedImage} 
                                        alt={stop.name}
                                        className="w-full h-24 object-cover rounded mb-2"
                                      />
                                    )}
                                    <div className="font-bold mb-1">{stop.name}</div>
                                    {stop.description && (
                                      <div className="text-gray-300 mb-1">{stop.description}</div>
                                    )}
                                    {stop.todayHours && (
                                      <div className="mb-1" style={{ color: stop.openNow ? '#34d399' : '#f87171' }}>
                                        🕐 {stop.openNow ? 'פתוח' : 'סגור'} · {stop.todayHours}
                                      </div>
                                    )}
                                    {stop.notes && (
                                      <div className="text-gray-400 italic">💭 {stop.notes}</div>
                                    )}
                                    <div className="text-gray-400 mt-2 text-[9px]">👆 לחץ לפרטים מלאים</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span 
                                className={`${sourceBadge.color} text-white text-[10px] px-2 py-0.5 rounded-full font-bold`}
                                title={sourceBadge.title}
                              >
                                {sourceBadge.text}
                              </span>
                            )}
                          </div>
                          <p className="text-xs" style={{
                            color: hasValidCoords ? '#4b5563' : '#991b1b'
                          }}>
                            {hasValidCoords ? stop.description : '⚠️ חסרות קואורדינטות - לא יכלל במסלול'}
                          </p>
                          {stop.todayHours && (
                            <p className="text-[10px]" style={{ color: stop.openNow ? '#059669' : '#dc2626' }}>
                              🕐 {stop.openNow ? 'פתוח' : 'סגור'} · {stop.todayHours}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {/* Temporary skip button */}
                        <button
                          onClick={() => toggleStopActive(i)}
                          className={`text-xs px-2 py-1 rounded ${isDisabled ? 'bg-yellow-500 text-white' : 'bg-gray-400 text-white'}`}
                          title={isDisabled ? 'החזר למסלול' : 'דלג זמנית'}
                        >
                          {isDisabled ? '⏸️' : '✕'}
                        </button>
                        
                        {(() => {
                          // Check if this place is in blacklist
                          const blacklisted = customLocations.find(loc => 
                            loc.name.toLowerCase() === stop.name.toLowerCase() && 
                            loc.status === 'blacklist'
                          );
                          
                          if (blacklisted) {
                            // Show GREEN undo button - removes from blacklist
                            return (
                              <button
                                onClick={() => {
                                  deleteCustomLocation(blacklisted.id);
                                  showToast(`"${stop.name}" חזר לרשימה הרגילה`, 'success');
                                }}
                                className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                                title="בטל דילוג קבוע"
                              >
                                ✅
                              </button>
                            );
                          }
                          
                          // Show permanent skip button (for non-custom places)
                          if (!isCustom) {
                            return (
                              <button
                                onClick={() => skipPlacePermanently(stop)}
                                className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                                title="דלג לצמיתות"
                              >
                                🚫
                              </button>
                            );
                          }
                          
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 mb-4">
              <a
                href={(() => {
                  // Filter active stops with valid coordinates
                  const activeStops = route.stops.filter((s, i) => {
                    const isActive = !disabledStops.includes(s.id || i);
                    const hasValidCoords = s.lat && s.lng && s.lat !== 0 && s.lng !== 0;
                    return isActive && hasValidCoords;
                  });
                  
                  if (activeStops.length === 0) {
                    return '#';
                  }
                  
                  // Calculate center
                  const avgLat = activeStops.reduce((sum, s) => sum + s.lat, 0) / activeStops.length;
                  const avgLng = activeStops.reduce((sum, s) => sum + s.lng, 0) / activeStops.length;
                  
                  // Create search query with all active place names
                  const query = activeStops.map(s => s.name).join(' OR ');
                  
                  // Return search URL with active places
                  return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${avgLat},${avgLng},13z`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  const activeStops = route.stops.filter((s, i) => {
                    const isActive = !disabledStops.includes(s.id || i);
                    const hasValidCoords = s.lat && s.lng && s.lat !== 0 && s.lng !== 0;
                    return isActive && hasValidCoords;
                  });
                  if (activeStops.length === 0) {
                    e.preventDefault();
                    showToast('אין מקומות עם קואורדינטות תקינות', 'warning');
                  }
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  fontSize: '14px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  marginBottom: '4px'
                }}
              >
                🗺️ הצג את כל המקומות על המפה
              </a>
              
              {/* URL limit note */}
              <p style={{
                fontSize: '10px',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '12px',
                fontStyle: 'italic'
              }}>
                מגבלת טלפון: עד ~6 מקומות (250 תווים)
              </p>

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
                      name="routeTypeExpanded"
                      checked={routeType === 'circular'}
                      onChange={() => setRouteType('circular')}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>מעגלי</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="routeTypeExpanded"
                      checked={routeType === 'linear'}
                      onChange={() => setRouteType('linear')}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>לינארי</span>
                  </label>
                </div>
                
                {/* Calculate Route Button */}
                <a
                  href={(() => {
                    // Build Google Maps URL based on routeType
                    const activeStops = route.stops.filter((stop, i) => {
                      const isActive = !disabledStops.includes(stop.id || i);
                      const hasValidCoords = stop.lat && stop.lng && stop.lat !== 0 && stop.lng !== 0;
                      return isActive && hasValidCoords;
                    });
                    
                    if (activeStops.length === 0) {
                      return '#';
                    }

                    // Use startPointCoords as origin if available
                    const hasStartPoint = startPointCoords && startPointCoords.lat && startPointCoords.lng;
                    const origin = hasStartPoint 
                      ? `${startPointCoords.lat},${startPointCoords.lng}`
                      : `${activeStops[0].lat},${activeStops[0].lng}`;
                    let destination, waypointsStr, mapUrl;

                    if (activeStops.length === 1 && !hasStartPoint) {
                      mapUrl = `https://www.google.com/maps/search/?api=1&query=${activeStops[0].lat},${activeStops[0].lng}`;
                    } else {
                      if (routeType === 'circular') {
                        destination = origin;
                        waypointsStr = (hasStartPoint ? activeStops : activeStops.slice(1)).map(s => `${s.lat},${s.lng}`).join('|');
                      } else {
                        destination = `${activeStops[activeStops.length - 1].lat},${activeStops[activeStops.length - 1].lng}`;
                        const middleStops = hasStartPoint ? activeStops.slice(0, -1) : activeStops.slice(1, -1);
                        waypointsStr = middleStops.map(s => `${s.lat},${s.lng}`).join('|');
                      }
                      
                      mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
                      if (waypointsStr) mapUrl += `&waypoints=${waypointsStr}`;
                      mapUrl += '&travelmode=walking';
                    }

                    return mapUrl;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    textAlign: 'center',
                    padding: '10px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: '14px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                    display: 'block',
                    marginBottom: '4px'
                  }}
                >
                  🗺️ פתח מסלול בגוגל
                </a>
                
                {/* Waypoints limit note */}
                <p style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  מגבלת טלפון: עד 25 מקומות
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Saved Routes View */}
        {/* Search View */}
        {currentView === 'search' && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">🔍 חיפוש במקומות שלי</h2>
              <button
                onClick={() => setCurrentView('myContent')}
                className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-300 flex items-center gap-1"
              >
                ← חזרה
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="חפש בשם, תיאור או הערות..."
                value={searchQuery}
                className="w-full p-3 border-3 border-gray-300 rounded-xl text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                style={{ textAlign: 'right', direction: 'rtl' }}
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
                <p className="text-sm text-gray-600 font-bold">נמצאו {searchResults.length} תוצאות:</p>
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
                              title="מקום מחוץ לגבולות האזור"
                              style={{ fontSize: '16px' }}
                            >
                              🔺
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-green-700 mt-1">{loc.description || 'אין תיאור'}</p>
                        {loc.notes && (
                          <p className="text-xs text-green-600 mt-1 italic">💭 {loc.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleEditLocation(loc)}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-bold"
                      >
                        ✏️ ערוך
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
                          const interest = allInterestOptions.find(opt => opt.id === intId);
                          return interest ? (
                            <span key={intId} className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                              {interest.icon} {interest.label}
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
                <p className="font-bold">לא נמצאו תוצאות עבור "{searchQuery}"</p>
                <p className="text-sm mt-2">נסה לחפש משהו אחר</p>
              </div>
            ) : customLocations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📍</div>
                <p className="font-bold">עדיין אין מקומות מותאמים אישית</p>
                <p className="text-sm mt-2">הוסף מקומות כדי לחפש בהם</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🔍</div>
                <p className="font-bold">התחל להקליד כדי לחפש</p>
                <p className="text-sm mt-2">יש לך {customLocations.length} מקומות מותאמים אישית</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'saved' && (
          <div className="bg-white rounded-xl shadow-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">🗺️ מסלולים שמורים</h2>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {savedRoutes.length}
                </span>
                <button
                  onClick={() => showHelpFor('saved')}
                  className="text-gray-400 hover:text-blue-500 text-sm"
                  title="עזרה"
                >❓</button>
              </div>
              <div className="flex items-center gap-2">
                {/* Sort toggle */}
                <div className="flex bg-gray-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setRoutesSortBy('area')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${routesSortBy === 'area' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                  >לפי איזור</button>
                  <button
                    onClick={() => setRoutesSortBy('name')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${routesSortBy === 'name' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                  >לפי שם</button>
                </div>
              </div>
            </div>
            
            {savedRoutes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-gray-600 mb-3 text-sm">עדיין אין מסלולים שמורים</p>
                <button
                  onClick={() => setCurrentView('form')}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-600"
                >צור מסלול חדש</button>
              </div>
            ) : (
              <div className="space-y-1">
                {(() => {
                  const sorted = [...savedRoutes].sort((a, b) => {
                    if (routesSortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'he');
                    return (a.areaName || '').localeCompare(b.areaName || '', 'he');
                  });
                  
                  let lastGroup = null;
                  return sorted.map(savedRoute => {
                    const groupKey = routesSortBy === 'area' ? (savedRoute.areaName || 'ללא איזור') : null;
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
                          onClick={() => loadSavedRoute(savedRoute)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-medium text-sm truncate">{savedRoute.name}</span>
                              {savedRoute.locked && <span title="נעול" style={{ fontSize: '11px' }}>🔒</span>}
                              {savedRoute.inProgress && <span title="בעבודה" style={{ fontSize: '12px' }}>🛠️</span>}
                              {routeInterestIds.slice(0, 5).map((intId, idx) => {
                                const obj = allInterestOptions.find(o => o.id === intId);
                                return obj?.icon ? <span key={idx} title={obj.label} style={{ fontSize: '12px' }}>{obj.icon}</span> : null;
                              })}
                              <span className="text-[10px] text-gray-400 flex-shrink-0">{savedRoute.stops?.length || 0} תחנות</span>
                            </div>
                            {savedRoute.notes && (
                              <div className="text-[10px] text-gray-500 truncate mt-0.5">📝 {savedRoute.notes}</div>
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
                            title="פרטים / ערוך"
                          >✏️</button>
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
          <div className="bg-white rounded-xl shadow-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold">📍 המקומות שלי</h2>
              <button
                onClick={() => showHelpFor('myPlaces')}
                className="text-gray-400 hover:text-blue-500 text-sm"
                title="עזרה"
              >
                ❓
              </button>
            </div>
            
            {/* Custom Locations Section - Split by status */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-bold">מקומות ({customLocations.length})</h3>
                <div className="flex items-center gap-2">
                  {/* Group by toggle */}
                  <div className="flex bg-gray-200 rounded-lg p-0.5">
                    <button
                      onClick={() => setPlacesGroupBy('interest')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${placesGroupBy === 'interest' ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}
                    >
                      לפי תחום
                    </button>
                    <button
                      onClick={() => setPlacesGroupBy('area')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${placesGroupBy === 'area' ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}
                    >
                      לפי איזור
                    </button>
                  </div>
                  <button
                    onClick={() => setCurrentView('search')}
                    className="text-blue-500 hover:text-blue-700 text-xl"
                    title="חיפוש"
                  >
                    🔍
                  </button>
                  <button
                    onClick={() => setShowAddLocationDialog(true)}
                    className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-600"
                  >
                    ➕ הוסף מקום
                  </button>
                </div>
              </div>
              
              {customLocations.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">📍</div>
                  <p className="text-gray-600 text-sm">עדיין אין מקומות מותאמים אישית</p>
                  <p className="text-xs text-gray-500 mt-1">לחץ "הוסף מקום" כדי ליצור</p>
                </div>
              ) : (
                <>
                  {/* Active Locations - Grouped */}
                  {(() => {
                    const activeLocations = customLocations.filter(loc => loc.status !== 'blacklist');
                    if (activeLocations.length === 0) return null;
                    
                    // Group locations
                    const groups = {};
                    const ungrouped = [];
                    
                    activeLocations.forEach(loc => {
                      if (placesGroupBy === 'interest') {
                        const interests = loc.interests || [];
                        if (interests.length === 0) {
                          ungrouped.push(loc);
                        } else {
                          interests.forEach(int => {
                            if (!groups[int]) groups[int] = [];
                            groups[int].push(loc);
                          });
                        }
                      } else {
                        // Group by area
                        const area = loc.area || 'unknown';
                        if (!groups[area]) groups[area] = [];
                        groups[area].push(loc);
                      }
                    });
                    
                    // Sort groups
                    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
                      if (placesGroupBy === 'interest') {
                        const aObj = allInterestOptions.find(o => o.id === a);
                        const bObj = allInterestOptions.find(o => o.id === b);
                        return (aObj?.label || a).localeCompare(bObj?.label || b, 'he');
                      } else {
                        const aObj = areaOptions.find(o => o.id === a);
                        const bObj = areaOptions.find(o => o.id === b);
                        return (aObj?.label || a).localeCompare(bObj?.label || b, 'he');
                      }
                    });
                    
                    // Sort locations within each group by the secondary dimension
                    const sortWithin = (locs) => {
                      return [...locs].sort((a, b) => {
                        if (placesGroupBy === 'interest') {
                          // Sort by area within interest group
                          const aArea = areaOptions.find(o => o.id === a.area)?.label || '';
                          const bArea = areaOptions.find(o => o.id === b.area)?.label || '';
                          return aArea.localeCompare(bArea, 'he') || a.name.localeCompare(b.name, 'he');
                        } else {
                          // Sort by interest within area group
                          const aInt = (a.interests?.[0]) || '';
                          const bInt = (b.interests?.[0]) || '';
                          return aInt.localeCompare(bInt) || a.name.localeCompare(b.name, 'he');
                        }
                      });
                    };
                    
                    // Render a single location row
                    const renderLocationRow = (loc) => {
                      const mapUrl = loc.address?.trim() 
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address.trim())}`
                        : (loc.lat && loc.lng) 
                          ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
                          : null;
                      const canEdit = !loc.locked || isUnlocked;
                      return (
                      <div
                        key={loc.id}
                        className="flex items-center justify-between gap-2 border border-emerald-300 rounded p-1.5 bg-emerald-50 hover:bg-emerald-100"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            {mapUrl ? (
                              <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                                className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                              >{loc.name}</a>
                            ) : (
                              <span className="font-medium text-sm truncate">{loc.name}</span>
                            )}
                            {loc.locked && <span title="נעול" style={{ fontSize: '12px' }}>🔒</span>}
                            {loc.inProgress && <span className="text-orange-600" title="בעבודה" style={{ fontSize: '14px' }}>🛠️</span>}
                            {loc.outsideArea && <span className="text-orange-500 text-xs" title="מחוץ לגבולות">🔺</span>}
                            {loc.missingCoordinates && <span className="text-red-500 text-xs" title="אין מיקום">⚠️</span>}
                            {placesGroupBy === 'area' && loc.interests?.map((int, idx) => {
                              const obj = allInterestOptions.find(o => o.id === int);
                              return obj?.icon ? <span key={idx} title={obj.label} style={{ fontSize: '13px' }}>{obj.icon}</span> : null;
                            })}
                            {placesGroupBy === 'interest' && loc.area && (
                              <span className="text-[10px] bg-gray-200 text-gray-600 px-1 rounded">{areaOptions.find(a => a.id === loc.area)?.label || loc.area}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <button onClick={() => handleEditLocation(loc)}
                            className="text-xs px-1 py-0.5 rounded hover:bg-blue-100"
                            title="פרטים / ערוך">✏️</button>
                        </div>
                      </div>
                    );
                    };
                    
                    return (
                      <div className="mb-3">
                        <h4 className="text-sm font-bold text-green-700 mb-2">
                          ✅ מקומות כלולים ({activeLocations.length})
                        </h4>
                        <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                          {sortedGroupKeys.map(key => {
                            const locs = sortWithin(groups[key]);
                            let groupLabel, groupIcon;
                            if (placesGroupBy === 'interest') {
                              const obj = allInterestOptions.find(o => o.id === key);
                              groupLabel = obj?.label || key;
                              groupIcon = obj?.icon || '🏷️';
                            } else {
                              const obj = areaOptions.find(o => o.id === key);
                              groupLabel = obj?.label || key;
                              groupIcon = '📍';
                            }
                            return (
                              <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-2 py-1 flex items-center gap-1 text-xs font-bold text-gray-700">
                                  <span>{groupIcon}</span>
                                  <span>{groupLabel}</span>
                                  <span className="text-gray-400 font-normal">({locs.length})</span>
                                </div>
                                <div className="space-y-0.5 p-1">
                                  {locs.map(renderLocationRow)}
                                </div>
                              </div>
                            );
                          })}
                          {ungrouped.length > 0 && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500">
                                ללא תחום ({ungrouped.length})
                              </div>
                              <div className="space-y-0.5 p-1">
                                {sortWithin(ungrouped).map(renderLocationRow)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Blacklisted Locations - Collapsible */}
                  {(() => {
                    const blacklistedLocations = customLocations.filter(loc => loc.status === 'blacklist');
                    
                    return blacklistedLocations.length > 0 && (
                      <div className="border-2 border-red-300 rounded-lg p-2 bg-red-50">
                        <button
                          onClick={() => setShowBlacklistLocations(!showBlacklistLocations)}
                          className="w-full flex items-center justify-between text-sm font-bold text-red-700 hover:text-red-900"
                        >
                          <span className="flex items-center gap-1">
                            <span>{showBlacklistLocations ? '▼' : '◀'}</span>
                            <span>🚫 מקומות שמדלגים עליהם ({blacklistedLocations.length})</span>
                          </span>
                          <span className="text-[10px] text-red-600">
                            {showBlacklistLocations ? 'הסתר' : 'הצג'}
                          </span>
                        </button>
                        
                        {showBlacklistLocations && (
                          <div className="space-y-1 mt-2 max-h-40 overflow-y-auto">
                            {blacklistedLocations.map(loc => {
                              const mapUrl = loc.address?.trim() 
                                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address.trim())}`
                                : (loc.lat && loc.lng) 
                                  ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
                                  : null;
                              return (
                              <div
                                key={loc.id}
                                className="flex items-center justify-between gap-2 border border-red-300 rounded p-1.5 bg-white hover:bg-red-50"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {mapUrl ? (
                                      <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                                        className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                                      >{loc.name}</a>
                                    ) : (
                                      <span className="font-medium text-sm truncate">{loc.name}</span>
                                    )}
                                    {loc.locked && <span title="נעול" style={{ fontSize: '12px' }}>🔒</span>}
                                    {loc.interests?.map((int, idx) => {
                                      const obj = allInterestOptions.find(o => o.id === int);
                                      return obj?.icon ? <span key={idx} title={obj.label} style={{ fontSize: '13px' }}>{obj.icon}</span> : null;
                                    })}
                                  </div>
                                </div>
                                <div className="flex gap-0.5">
                                  <button onClick={() => handleEditLocation(loc)}
                                    className="text-xs px-1 py-0.5 rounded hover:bg-blue-100"
                                    title="פרטים / ערוך">✏️</button>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

          </div>
        )}

        {/* My Interests View */}
        {currentView === 'myInterests' && (
          <div className="bg-white rounded-xl shadow-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">🏷️ התחומים שלי</h2>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  {Object.values(interestStatus).filter(Boolean).length} פעילים
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingCustomInterest(null);
                  setNewInterest({ label: '', icon: '📍', searchMode: 'types', types: '', textSearch: '', blacklist: '', inProgress: true, locked: false, builtIn: false });
                  setShowAddInterestDialog(true);
                }}
                className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-600"
              >
                ➕ הוסף תחום
              </button>
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
                  icon: interest.icon || '📍',
                  searchMode: config.textSearch ? 'text' : 'types',
                  types: (config.types || []).join(', '),
                  textSearch: config.textSearch || '',
                  blacklist: (config.blacklist || []).join(', '),
                  inProgress: interest.inProgress || false,
                  locked: interest.locked || false,
                  builtIn: !isCustom
                });
                setShowAddInterestDialog(true);
              };
              
              // Render a single interest row
              const renderInterestRow = (interest, isCustom = false, isActive = true) => {
                const isValid = isInterestValid(interest.id);
                const borderClass = !isActive ? 'border border-gray-300 bg-gray-50 opacity-60'
                  : isCustom ? (isValid ? 'border-2 border-purple-400 bg-purple-50' : 'border-2 border-red-400 bg-red-50')
                  : (isValid ? 'border border-green-300 bg-green-50' : 'border-2 border-red-400 bg-red-50');
                
                return (
                  <div key={interest.id} className={`flex items-center justify-between gap-2 rounded-lg p-2 ${borderClass}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{interest.icon}</span>
                      <span className={`font-medium text-sm truncate ${!isActive ? 'text-gray-500' : ''}`}>{interest.label || interest.name}</span>
                      {isCustom && <span className="text-[10px] bg-purple-200 text-purple-800 px-1 py-0.5 rounded flex-shrink-0">מותאם</span>}
                      {!isValid && <span className="text-red-500 text-xs flex-shrink-0" title="חסר הגדרות חיפוש">⚠️</span>}
                      {interest.inProgress && <span className="text-orange-600 flex-shrink-0" title="בעבודה" style={{ fontSize: '12px' }}>🛠️</span>}
                      {interest.locked && <span title="נעול" style={{ fontSize: '11px' }} className="flex-shrink-0">🔒</span>}
                    </div>
                    <button
                      onClick={() => openInterestDialog(interest, isCustom)}
                      className="text-xs px-1 py-0.5 rounded hover:bg-blue-100 flex-shrink-0"
                      title="פרטים / ערוך"
                    >✏️</button>
                  </div>
                );
              };
              
              // Collect active and inactive
              const activeBuiltIn = interestOptions.filter(i => interestStatus[i.id] !== false);
              const activeUncovered = uncoveredInterests.filter(i => interestStatus[i.id] === true);
              const activeCustom = customInterests.filter(i => interestStatus[i.id] !== false);
              const inactiveBuiltIn = interestOptions.filter(i => interestStatus[i.id] === false);
              const inactiveUncovered = uncoveredInterests.filter(i => interestStatus[i.id] !== true);
              const inactiveCustom = customInterests.filter(i => interestStatus[i.id] === false);
              
              return (
                <>
                  {/* Active Interests */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-green-700 mb-2">
                      ✅ תחומים פעילים ({activeBuiltIn.length + activeUncovered.length + activeCustom.length})
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
                        ⏸️ תחומים לא פעילים ({inactiveBuiltIn.length + inactiveUncovered.length + inactiveCustom.length})
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
          <div className="bg-white rounded-xl shadow-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold">הגדרות</h2>
              <button
                onClick={() => showHelpFor('settings')}
                className="text-gray-400 hover:text-blue-500 text-sm"
                title="עזרה"
              >
                ❓
              </button>
            </div>
            
            {/* Max Stops Setting */}
            <div className="mb-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-2">
                <h3 className="text-sm font-bold text-gray-800 mb-1">📍 מספר מקומות במסלול</h3>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxStops}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 10;
                    setFormData({...formData, maxStops: Math.min(100, Math.max(1, val))});
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
                <h3 className="text-sm font-bold text-gray-800 mb-1">➕ מקומות נוספים ב"מצא עוד"</h3>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.fetchMoreCount || 3}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 5;
                    setFormData({...formData, fetchMoreCount: Math.min(100, Math.max(1, val))});
                  }}
                  className="w-20 p-1 border-2 border-green-300 rounded text-center font-bold text-sm"
                  placeholder="5"
                />
                <span className="text-[10px] text-gray-500 mr-2">(1-100)</span>
              </div>
            </div>
            
            {/* Refresh Data Button */}
            <div className="mb-3">
              <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border-2 border-cyan-400 rounded-xl p-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">🔄 רענון נתונים</h3>
                <p className="text-xs text-gray-600 mb-2">
                  טען מחדש את כל הנתונים מ-Firebase: תחומים, מקומות, מסלולים והגדרות
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
                  <span>{isRefreshing ? 'מרענן...' : 'רענן את כל הנתונים'}</span>
                </button>
                <div className="mt-2 text-[10px] text-gray-500 flex flex-wrap gap-1">
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">📍 מקומות</span>
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">🏷️ תחומים</span>
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">💾 מסלולים</span>
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">⚙️ הגדרות חיפוש</span>
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded">👑 הרשאות</span>
                </div>
              </div>
            </div>
            
            {/* Debug Mode Toggle */}
            <div className="mb-4">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-400 rounded-xl p-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">🔧 מצב Debug</h3>
                <p className="text-xs text-gray-600 mb-2">
                  הצג לוג של פעולות לאיתור בעיות
                </p>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debugMode}
                    onChange={(e) => setDebugMode(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-gray-400"
                  />
                  <span className="text-sm font-bold">
                    {debugMode ? '✅ Debug מופעל' : '❌ Debug כבוי'}
                  </span>
                </label>
                
                {debugMode && (
                  <div className="mt-2 text-xs text-gray-600">
                    פאנל Debug יופיע בתחתית המסך
                  </div>
                )}
              </div>
            </div>
            
            {/* Import/Export Section */}
            
            {/* Admin Management - Password Based */}
            <div className="mb-4">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-xl p-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">👑 ניהול Admin</h3>
                
                {/* Current Device Info */}
                <div className="text-xs bg-white rounded-lg p-2 border border-red-200 mb-3">
                  <strong>מכשיר נוכחי:</strong> {localStorage.getItem('bangkok_user_id')?.slice(-12) || 'N/A'}
                  <br />
                  <strong>סטטוס:</strong> 
                  <span className="text-green-600 font-bold"> 🔓 פתוח</span>
                </div>
                
                {/* Password Section */}
                <div className="mb-3">
                  <label className="text-xs font-bold text-gray-700 block mb-1">🔑 סיסמת מערכת:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adminPassword}
                      onChange={(e) => {
                        const newPw = e.target.value;
                        setAdminPassword(newPw);
                      }}
                      placeholder="ללא סיסמה = גישה פתוחה"
                      className="flex-1 p-2 border rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        if (isFirebaseAvailable && database) {
                          database.ref('settings/adminPassword').set(adminPassword)
                            .then(() => showToast('סיסמה נשמרה!', 'success'))
                            .catch(() => showToast('שגיאה בשמירה', 'error'));
                        }
                      }}
                      className="px-3 py-2 bg-green-500 text-white rounded text-sm font-bold"
                    >
                      שמור
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {adminPassword ? '🔒 מערכת מוגנת בסיסמה' : '🔓 ללא סיסמה - גישה פתוחה לכולם'}
                  </p>
                </div>
                
                {/* Admin Users List */}
                <div className="mb-3">
                  <label className="text-xs font-bold text-gray-700 block mb-1">👥 משתמשי Admin ({adminUsers.length}):</label>
                  <div className="bg-white border rounded-lg max-h-32 overflow-y-auto">
                    {adminUsers.length === 0 ? (
                      <div className="p-2 text-xs text-gray-500 text-center">אין משתמשים רשומים</div>
                    ) : (
                      adminUsers.map((user, idx) => (
                        <div key={user.userId} className="flex justify-between items-center p-2 border-b last:border-b-0 text-xs">
                          <div>
                            <span className="font-mono">{user.oderId?.slice(-12) || 'Unknown'}</span>
                            {user.oderId === localStorage.getItem('bangkok_user_id') && (
                              <span className="text-green-600 mr-1">(אתה)</span>
                            )}
                            <br />
                            <span className="text-gray-500">{user.addedAt ? new Date(user.addedAt).toLocaleDateString('he-IL') : ''}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (isFirebaseAvailable && database) {
                                database.ref(`settings/adminUsers/${user.oderId}`).remove()
                                  .then(() => showToast('משתמש הוסר', 'success'))
                                  .catch(() => showToast('שגיאה', 'error'));
                              }
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded text-[10px]"
                          >
                            הסר
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Access Log Button */}
                <button
                  onClick={() => {
                    markLogsAsSeen();
                    setShowAccessLog(true);
                  }}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  📋 צפה בלוג כניסות
                  {hasNewEntries && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">חדש!</span>}
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-xl p-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">💾 ייבוא וייצוא</h3>
                <p className="text-xs text-gray-600 mb-2">
                  שמור והעבר נתונים בין מכשירים
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
                          version: '2.6'
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
                        
                        showToast(`הקובץ הורד! (${customInterests.length} תחומים מותאמים, ${activeCount} פעילים, ${customLocations.length} מקומות, ${savedRoutes.length} מסלולים)`, 'success');
                      } catch (error) {
                        console.error('[EXPORT] Error:', error);
                        showToast('שגיאה בייצוא', 'error');
                      }
                    }}
                    className="w-full bg-blue-500 text-white py-2 px-3 rounded-lg font-bold hover:bg-blue-600 transition text-sm flex items-center justify-center gap-2"
                  >
                    <span>📤 ייצא הכל</span>
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
                            
                            if (!data.customInterests || !data.customLocations) {
                              showToast('קובץ לא תקין', 'error');
                              return;
                            }
                            
                            setImportedData(data);
                            setShowImportDialog(true);
                          } catch (error) {
                            console.error('[IMPORT] Error:', error);
                            showToast('שגיאה בקריאת הקובץ', 'error');
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
                      📥 ייבא מקובץ
                    </label>
                  </div>
                  
                  {/* Info Box */}
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-2 text-[10px]">
                    <p className="text-blue-900 font-bold mb-1">💡 שימושים:</p>
                    <ul className="text-blue-800 space-y-0.5 mr-3">
                      <li>• העברה בין Claude ל-GitHub</li>
                      <li>• גיבוי נתונים</li>
                      <li>• שיתוף עם חברים</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Share App Section */}
            <div className="mt-3">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-400 rounded-lg p-3">
                <h3 className="text-sm font-bold text-gray-800 mb-2">📤 שתף את האפליקציה</h3>
                <p className="text-xs text-gray-600 mb-3">
                  אהבת את האפליקציה? שתף עם חברים!
                </p>
                
                <button
                  onClick={() => {
                    const shareData = {
                      title: 'Bangkok Explorer 🗺️',
                      text: 'אפליקציה חכמה לתכנון טיולים בבנגקוק! מצא מקומות מעניינים ובנה מסלול מותאם אישית 🌏',
                      url: window.location.href
                    };
                    
                    // Try native share API (mobile)
                    if (navigator.share) {
                      navigator.share(shareData)
                        .then(() => showToast('תודה על השיתוף!', 'success'))
                        .catch((err) => {
                          if (err.name !== 'AbortError') {
                            console.error('Share error:', err);
                          }
                        });
                    } else {
                      // Fallback - reliable copy method
                      try {
                        const textArea = document.createElement('textarea');
                        textArea.value = window.location.href;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        textArea.style.top = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        
                        const successful = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        if (successful) {
                          showToast('הקישור הועתק ללוח!', 'success');
                        } else {
                          // Show toast with URL
                          showToast('העתק: ' + window.location.href, 'info');
                        }
                      } catch (err) {
                        console.error('Copy error:', err);
                        // Show toast with URL
                        showToast('העתק: ' + window.location.href, 'info');
                      }
                    }
                  }}
                  className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg font-bold hover:bg-orange-600 transition text-sm flex items-center justify-center gap-2"
                >
                  <span>📤</span>
                  <span>שתף עם חברים</span>
                </button>
              </div>
            </div>
            
            {/* Admin Access Log Section */}
            <div className="mt-4 pt-3 border-t border-gray-200 text-center">
              {/* Admin Access Log Button */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    setShowAccessLog(true);
                    markLogsAsSeen();
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    hasNewEntries 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'bg-gray-400 text-white shadow-md'
                  }`}
                >
                  🔒 לוג כניסות
                  {hasNewEntries && (
                    <span className="mr-1">🔔</span>
                  )}
                </button>
                
                {/* Admin Status */}
                <div className="text-[9px] text-gray-400 mt-1 flex items-center justify-center gap-2">
                  {accessLogs.length > 0 ? (
                    <span>👑 Admin Mode - {accessLogs.length} כניסות</span>
                  ) : (
                    <span>אין כניסות עדיין</span>
                  )}
                  
                  {/* Clear Log Button */}
                  {accessLogs.length > 0 && (
                    <button
                      onClick={() => {
                        showConfirm('למחוק את כל לוג הכניסות? פעולה זו בלתי הפיכה.', () => {
                          database.ref('accessLog').remove();
                          localStorage.setItem('bangkok_last_seen', Date.now().toString());
                          setAccessLogs([]);
                            setHasNewEntries(false);
                            showToast('הלוג נוקה', 'success');
                          });
                        }}
                        className="text-red-500 hover:text-red-700 text-lg p-1"
                        title="מחק לוג כניסות"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
            </div>
          </div>
        )}

        {/* === DIALOGS (from dialogs.js) === */}
