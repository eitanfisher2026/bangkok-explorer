# FouFou — City Trail Generator - Claude Development Context

**Tagline:** Local picks + Google spots. Choose your vibe, follow the trail 🍜🏛️🎭

## Version: 3.8.58 (Mar 14, 2026)

## Live: https://eitanfisher2026.github.io/FouFou/

---

## ⚡ MOST RECENT SESSION SUMMARY (Mar 7–14, 2026) — v3.8.13 → v3.8.54

### Architecture & Packaging
- **ZIP name**: `github-upload-vX_Y_ZZ.zip` (single zip, includes both GitHub files and CLAUDE_CONTEXT.md)
- **Build baseline balance**: `app-code.js: () +0  {} -3  [] -2` — verify after every change
- **Working dir**: `/tmp/project/` (extract zip here)

### localStorage Cleanup (v3.8.27)
- All `bangkok_*` keys renamed to `foufou_*`: `foufou_preferences`, `foufou_route_type`, `foufou_right_col_width`, `foufou_debug_*`, `foufou_last_log_time`, `foufou_last_seen_feedback`, `foufou_visitor_id/name`
- Dead localStorage removed: `bangkok_custom_locations`, `bangkok_custom_interests`, `bangkok_interest_status`, `bangkok_is_admin`, `bangkok_user_id`
- All localStorage fallback `else { ... }` blocks removed from: locations load, interests load, interest status load, saved routes load, refreshAllData
- `saveRoutesToStorage` simplified to no-op (Firebase handles everything)
- `pendingLocations`/`pendingInterests` still in-memory state (offline queue) but no longer persisted to localStorage
- `bangkok_user_id` replaced everywhere with `authUser?.uid`
- `bangkok_is_admin` removed — use `isAdmin` state directly

### System Routes (v3.8.28–3.8.29)
- 4 system routes added to `city-bangkok.js` as `window.BKK.cityData.bangkok.systemRoutes`
- `seedSystemRoutes(database)` function seeds them to Firebase `cities/bangkok/routes` once (idempotent, checks by `id` field, flag `foufou_sys_routes_seeded_bangkok`)
- System routes have `system: true, locked: true` — shown with ⭐ amber background, no delete button
- Called from migration useEffect alongside `migrateLocationsToPerCity`

### Bug Fixes (v3.8.30)
- `addGooglePlaceToCustom`: `const locationToAdd` → `let locationToAdd` (was causing TypeError on `sanitizeMapsUrl` reassignment)
- Custom interests with `cityId` now filtered correctly in `cityCustomInterests` (respects cityId regardless of scope field)
- Custom interests default to OFF for new users (undefined status = disabled for `custom_*` IDs)

### Hint/Documentation System Fixes (v3.8.31–3.8.33)
- `renderStepHeader` redesigned: compact (13px, padding 6px), buttons removed — hint buttons moved to `renderContextHint`
- `renderContextHint` must be called separately after `renderStepHeader` for each screen
- `renderContextHint` calls needed: `hint_area` (step 2), `hint_interests` (step 1), `hint_choice` (step 3), `hint_manual` (manual mode header), `hint_route_menu` (near hamburger)
- `saveAndTranslateHint` fixed: now uses current language as source (not hardcoded `he`), translates to other language
- `window.BKK.i18n.t()` does not exist — correct function is `window.t()`

### UX / Wizard Changes (v3.8.34)
- **Intermediate screen removed**: After "מצא מקומות" → auto-jump directly to manual mode (`routeChoiceMade = 'manual'` via setTimeout 0)
- **Friendly stats toast** after route generation: shows interest breakdown in same order as results screen, custom/google count from actual `route.stops`, sticky (click anywhere to dismiss)
- **Doc buttons (📷 camera+gallery)** added in manual mode header and next to hamburger — LATER REPLACED with ℹ hint buttons

### UI Polish (v3.8.38–3.8.52)
- **ℹ hint buttons**: dark gray (`#374151`, border `#d1d5db`, bg `#f9fafb`) everywhere — not blue
- **Skip/Unskip buttons**: orange pill (`#ea580c`, bg `#fff7ed`, border `#fed7aa`) → restored on unskip to green. Uses `t('trail.skip')`/`t('trail.unskip')` for i18n
- **⭐ Add to favorites**: teal/emerald pill (`#059669`, bg `#f0fdf4`, border `#6ee7b7`) — was purple
- **"הוסף למועדפים"**: compact inline pill, not full-width button
- **Toast UI**: backdrop overlay closes on click anywhere, ✕ in top-left corner (RTL), each line styled separately (header bold, last line gray)
- **Hamburger menu**: ✕ close button at top
- **"עזור לי לתכנן"**: admin-only in hamburger menu (always uses `skipSmartSelect: true`)

### Auto-Reoptimize (v3.8.53)
- `scheduleReoptimize()`: debounced 600ms, always `skipSmartSelect: true` (never cuts stops)
- Triggers: startPointCoords change, fetchMoreForInterest, disabledStops change (skip/unskip), manual stop added
- Spinner overlay on stops list during reoptimize (`isReoptimizing` state)
- `scheduleReoptimize` defined BEFORE `findSmartStart` (avoids TDZ issues with useEffects that call it)

### hint_route_menu
- New hint ID `hint_route_menu` for the ℹ button next to hamburger
- Separate from `hint_manual` (which explains the manual mode screen)
- `renderContextHint('hint_route_menu')` placed near `renderContextHint('hint_manual')`

### Active Trail Hints (v3.8.54)
- `hint_trail` hint ID added to active trail header
- `renderContextHint('hint_trail')` added after trail description text

---

## ⚠️ CRITICAL RULES (accumulated over all sessions)

### Syntax Safety
- **Single quotes in JSX attributes** cause Babel parse errors — use double quotes or avoid apostrophes
- **Literal `\n` in template literals** — use `"\\n"` not actual newline character
- **`const` → `let`** when reassigning (e.g. `locationToAdd = sanitizeMapsUrl(...)`)
- **`window.BKK.i18n.t()` does NOT exist** — use `window.t()` or the React `t` function from scope
- Always run build + balance check after changes

### Google Place ID / mapsUrl (RECURRING BUG — BROKEN 3+ TIMES)
1. NEVER assign to `googlePlaceId` without validating `/^(ChIJ|EiI|GhIJ)/`
2. NEVER use `loc.placeId` directly — may be a Firebase key
3. `getGoogleMapsUrl()` in utils.js = SINGLE source of truth for Google URLs
4. `sanitizeMapsUrl()` must run before every Firebase save

### Hooks
- Hooks MUST be at component level — never inside IIFE or nested functions in JSX
- `scheduleReoptimize` must be defined before any `useEffect` that calls it

---

## Architecture

Single-page React app (in-browser Babel). Files split for dev, combined by `build.py`.

```
Source files:
  config.js              ← Firebase config, city loading, visitor tracking
  utils.js               ← Pure functions: distance, sorting, dedup, scoring
  app-logic.js           ← React state, Firebase sync, route generation, handlers
  views.js               ← JSX views: wizard steps, route results, map
  dialogs.js             ← JSX dialogs: location edit, route dialog, toast, confirm
  i18n.js                ← Translations (Hebrew/English)
  app-data.js            ← Generated: i18n + city data + config + utils (~194KB)
  app-code.js            ← Generated: JSX app (~800KB)
  index.html             ← Tiny splash shell (~11KB)

City data:
  city-bangkok.js        ← Areas, interests, system routes, seedSystemRoutes()
  city-gushdan.js
  city-singapore.js
  city-malaga.js
```

## Packaging
```bash
VERSION=$(python3 -c "import re; s=open('config.js').read(); print(re.search(r\"VERSION\s*=\s*'([^']+)'\", s).group(1).replace('.','_'))")
zip github-upload-v${VERSION}.zip \
  index.html app-data.js app-code.js \
  i18n.js config.js utils.js app-logic.js views.js dialogs.js \
  city-bangkok.js city-gushdan.js city-singapore.js city-malaga.js \
  _source-template.html _app-code-template.js build.py README.md .nojekyll \
  CLAUDE_CONTEXT.md manifest.json favicon.ico version.json \
  icon-16x16.png icon-32x32.png icon-180x180.png icon-192x192.png icon-512x512.png
```

## Build & Verify
```bash
python3 build.py
python3 -c "
with open('app-code.js') as f: c = f.read()
p=c.count('(')-c.count(')'); b=c.count('{')-c.count('}'); k=c.count('[')-c.count(']')
print(f'Balance: () {p:+d}  {{}} {b:+d}  [] {k:+d}')
# Baseline: () +0  {} -3  [] -2
"
```

## Firebase Structure
```
cities/{cityId}/locations/{id}    ← shared locations
cities/{cityId}/routes/{id}       ← saved routes (+ system routes: system:true, locked:true)
cities/{cityId}/interestCounters/ ← auto-naming
customInterests/{id}              ← custom interest objects
settings/interestConfig/{id}      ← search config + overrides per interest
settings/interestStatus/{id}      ← admin default enabled/disabled
settings/adminUsers/              ← legacy admin list
users/{uid}/interestStatus/{id}   ← per-user overrides
users/{uid}/role                  ← 0=regular, 1=editor, 2=admin
helpContent/{sectionId}/{lang}    ← hint/documentation text (he/en)
accessLog/{id}                    ← visitor logs
feedback/{id}                     ← user feedback
```

## Key State (app-logic.js)
| State | Purpose |
|-------|---------|
| `route` | Current generated route (stops, optimized, startPointCoords) |
| `formData` | area, interests, searchMode, maxStops, startPoint... |
| `routeType` | 'circular' \| 'linear' → saved to `foufou_route_type` |
| `routeChoiceMade` | null \| 'manual' — null triggers auto-jump to manual |
| `disabledStops` | lowercase stop names that are skipped |
| `isReoptimizing` | true during debounced auto-reoptimize |
| `startPointCoords` | { lat, lng, address } — change triggers auto-reoptimize |
| `authUser` | Firebase auth user |
| `isAdmin` / `isEditor` | role >= 2 / >= 1 |
| `openHintPopup` | currently open hint popup ID |
| `hintEditId` | hint being edited (admin) |
| `helpOverrides` | Firebase helpContent keyed by sectionId → { he, en } |

## Hint/Documentation System
- `renderStepHeader(icon, title, subtitle, hintId)` — compact header, ✏️ + ℹ + 🔈 buttons inline
- `renderContextHint(hintId)` — renders popup + edit textarea (must be called separately!)
- Hint IDs used: `hint_interests`, `hint_area`, `hint_choice`, `hint_manual`, `hint_route_menu`, `hint_trail`
- `getHelpSection(sectionId)` — reads from `helpOverrides[id][currentLang]` or base i18n
- `saveAndTranslateHint(id, text)` — saves to current lang, translates to other lang

## Auto-Reoptimize Flow
```
scheduleReoptimize()  ←  triggers: startPointCoords change, fetchMore, skip/unskip, manual add
    ↓ debounce 600ms
runSmartPlan({ skipSmartSelect: true })
    ↓ never cuts stops, just reorders
optimizeStopOrder(selected, autoStart, isCircular)
    ↓ nearest neighbor + 2-opt + content-aware
setRoute(newRoute with optimized: true)
```

## UI Color System
| Element | Color |
|---------|-------|
| ℹ hint button | `#374151` gray, border `#d1d5db` |
| ⏸ skip | `#ea580c` orange, bg `#fff7ed` |
| ▶ unskip | `#059669` green, bg `#f0fdf4` |
| ⭐ add to favorites | `#059669` teal, bg `#f0fdf4` |
| 🗺️ map button | `#6d28d9` purple, bg `faf5ff→ede9fe` |
| 🚀 yalla button | `#15803d` green, bg `f0fdf4→dcfce7` |
| system routes | amber bg `#fef3c7`, border `#fde68a` |

## localStorage Keys (current — all foufou_*)
| Key | Purpose |
|-----|---------|
| `foufou_preferences` | form defaults (hours, area, interests) |
| `foufou_route_type` | 'circular' \| 'linear' |
| `foufou_right_col_width` | desktop split view width |
| `foufou_debug_mode/categories/sessions/flagged` | admin debug |
| `foufou_last_log_time/last_seen_feedback` | rate limiting |
| `foufou_active_trail` | active trail session |
| `foufou_fab_pos` | FAB position |
| `foufou_hint_*` | hint visit counts |
| `foufou_tts_voice` | TTS voice selection |
| `foufou_visitor_id/name` | analytics |
| `foufou_sys_routes_seeded_{cityId}` | one-time seed flag |
| `city_explorer_lang` | UI language |
| `city_explorer_city` | last selected city |
| `city_active_states` | city enabled/disabled |
| `custom_cities` | user-added cities |
| `locations_migrated_v2` | one-time migration flag |
| `cleanup_inprogress_done` | one-time cleanup flag |

## System Routes (Bangkok)
Defined in `city-bangkok.js` as `window.BKK.cityData.bangkok.systemRoutes[]`:
1. `sys_bkk_chinatown_loop` — Chinatown loop (circular, 4h)
2. `sys_bkk_four_communities` — 4 communities by river (linear, 5h)
3. `sys_bkk_nang_loeng` — Nang Loeng old Bangkok (circular, 2h)
4. `sys_bkk_bang_krachao` — Bang Krachao green lung (circular, 4h)

Seeded by `window.BKK.seedSystemRoutes(database)` — idempotent, checks existing by `id` field.

