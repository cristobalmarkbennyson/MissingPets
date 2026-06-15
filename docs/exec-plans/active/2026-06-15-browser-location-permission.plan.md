# Browser Location Permission - Plan

- Initiative Slug: `2026-06-15-browser-location-permission`
- Artifact: `Plan`
- Status: `Draft`
- Related Artifacts:
  - `2026-06-09-missing-pets-location-forum.reqs.md`
  - `2026-06-09-missing-pets-location-forum.ux.md`
  - `2026-06-09-missing-pets-location-forum.architecture.md`
  - `2026-06-09-missing-pets-location-forum.impl.md`
- Last Updated: `2026-06-15`

## Objective

Fix the home-page `Allow location` path so clicking it at `http://127.0.0.1:5173/` invokes browser geolocation permission, uses granted browser coordinates as the feed search location, reverse geocodes those coordinates into a real place label when Google Maps is configured, and keeps manual fallback behavior intact.

## Upstream Traceability

- `F-001` Location-aware feed: nearby posts use current or chosen viewer location.
- `F-002` First-time location prompt: granted browser location queries nearby posts immediately.
- `F-003` Manual location fallback: denied or skipped browser location still allows manual browsing.
- `WF-001` Browse nearby posts: viewer opens the app, grants or denies location access, and sees nearby posts.
- `DATA-004` Viewer location may come from browser geolocation or manual selection.
- `CON-001` Denied browser location permission must be handled gracefully.
- `UX-001` Nearby feed surface at `/`.
- `UX-002` Location permission and manual fallback overlay owned by `/`.
- `ARC-001` React/Vite frontend owns browser geolocation requests and client state.
- `ARC-005` Google Maps JavaScript API supports Places/Geocoding where needed.
- `TEST-003` Playwright end-to-end tests cover location prompt and primary workflows.

## Resolved Decisions

- `DEC-BLOC-001` The supported local browser origin for this fix is `http://127.0.0.1:5173/`, which is a browser-trusted local origin for geolocation permission prompts.
- `DEC-BLOC-002` A granted browser location should display a real reverse-geocoded place label, not only `Your current area`, when Google Maps geocoding is configured.
- `DEC-BLOC-003` If Google Maps is not configured or reverse geocoding fails, the app may still use granted coordinates for feed search and should show a non-blocking fallback label such as `Current location near 14.56530, 121.03180`.
- `DEC-BLOC-004` This fix must not change create-post last-seen map behavior, backend geospatial contracts, public approximate-location privacy behavior, or manual fallback places.

## Execution Protocol

- Phases must be executed strictly in the order listed.
- A later phase must not begin until the current phase's acceptance criteria and verification steps have passed.
- Do not pull work forward from later phases unless the current phase explicitly marks it as a prerequisite.
- If browser geolocation behavior differs because the app is opened from a non-local or non-secure origin, stop and record the origin instead of masking the issue with test-only code.
- After context compaction or a resumed session, re-read this plan and `2026-06-09-missing-pets-location-forum.impl.md` before editing files or checking criteria.
- Acceptance criteria start unchecked and may only be checked after implementation is complete and linked verification evidence has passed.

## High-Level Phase Summary

This follow-on is intentionally small. Phase 1 isolates the frontend location service behavior and centralizes reverse geocoding so both success and fallback states are explicit. Phase 2 wires that service into the existing location permission modal without altering feed, create-post, detail, messaging, reporting, or management workflows. Phase 3 adds Playwright coverage for grant, denial/fallback, and reverse-geocode fallback behavior, then runs the existing verification surface.

## Phase 1 - Browser Location And Reverse-Geocode Helper

### Entry Criteria

- Existing approved artifacts listed above have been read.
- Existing location flow in `src/MissingPets.Web/src/App.tsx` and Google Maps loading flow in `src/MissingPets.Web/src/maps/GoogleMapsLoader.ts` have been inspected.

### Phase Lock

- Allowed Acceptance Criteria: `AC-BLOC-001` through `AC-BLOC-004`.
- Forbidden Pull-Forward Work: Do not edit the location modal UI, feed rendering, Playwright tests, API project, database model, or create-post map picker in this phase.
- Next-Phase Unlock Evidence: Helper code builds with `npm run build` or TypeScript check through the web build.
- Resume / Compaction Checks: Confirm helper files and exports before continuing to Phase 2.

### Implementation Notes

- Create a narrow helper under `src/MissingPets.Web/src/`, preferably `location/browserLocation.ts` or `maps/reverseGeocode.ts` if the existing maps folder is the cleaner local convention.
- The helper must request browser geolocation through `navigator.geolocation.getCurrentPosition`.
- The helper must reject or return typed failure details for:
  - `navigator.geolocation` unavailable.
  - insecure context when `window.isSecureContext === false`.
  - permission denied.
  - timeout or unknown geolocation error.
- The helper must use `loadGoogleMapsLibraries()` from `src/MissingPets.Web/src/maps/GoogleMapsLoader.ts` for reverse geocoding when configured.
- The helper must derive a stable fallback label from granted coordinates when Google Maps is unconfigured or geocoding fails.
- Do not create a new Google Maps loader, script tag, API key variable, or backend geocoding endpoint.

### Acceptance Criteria

- [x] `AC-BLOC-001` Add a typed browser-location result path that returns granted `lat`, `lng`, `label`, and `source: 'browser'` for frontend location state. Traces to `F-002`, `DATA-004`, `ARC-001`.
- [x] `AC-BLOC-002` Use the existing Google Maps loader for reverse geocoding and produce a real place label from `Geocoder.geocode({ location })` when Google Maps is configured and returns a formatted address. Traces to `DEC-BLOC-002`, `ARC-005`.
- [x] `AC-BLOC-003` Preserve coordinate-based feed search even if reverse geocoding is unconfigured or fails, with a user-readable fallback label that includes rounded coordinates. Traces to `DEC-BLOC-003`, `F-001`, `WF-001`.
- [x] `AC-BLOC-004` Return distinct user-facing failure messages for unsupported geolocation, insecure context, denied permission, timeout, and unknown failure without closing the modal. Traces to `CON-001`, `UX-002`.

### Verification

- `VER-BLOC-001` Run `npm run build` in `src/MissingPets.Web` and confirm TypeScript accepts the helper and existing map code. Traces to `AC-BLOC-001` through `AC-BLOC-004`.

### Stop Conditions

- Stop if Google Maps type imports or loader usage requires duplicating the existing loader.
- Stop if reverse geocoding would require exposing a new secret or backend endpoint.

## Phase 2 - Wire The Location Permission Modal

### Entry Criteria

- Phase 1 acceptance criteria and `VER-BLOC-001` pass.

### Phase Lock

- Allowed Acceptance Criteria: `AC-BLOC-005` through `AC-BLOC-008`.
- Forbidden Pull-Forward Work: Do not change feed card UI, create-post map picker behavior, backend APIs, manual place constants, or public approximate-location display.
- Next-Phase Unlock Evidence: Manual and browser-granted paths are both reachable in the running app.
- Resume / Compaction Checks: Re-read `allowBrowserLocation()` and `LocationSurface` before modifying modal state.

### Implementation Notes

- Update `allowBrowserLocation()` in `src/MissingPets.Web/src/App.tsx`.
- Keep the existing `LocationSurface` dialog and `Allow location` button label unless a small disabled/loading state is needed to prevent double-clicks.
- On click:
  - Set permission state to a requesting/loading message.
  - Invoke the Phase 1 helper.
  - On success, set `location` to the helper result, update permission state to granted, and close `locationModalOpen`.
  - On failure, keep the modal open and display the helper's failure message.
- The existing feed `useEffect` must remain the mechanism that reloads posts when `location` changes.
- Preserve `useManualLocation()` behavior exactly except for any type import needed by the helper.

### Acceptance Criteria

- [x] `AC-BLOC-005` [Surface `UX-002`] Clicking `Allow location` requests browser geolocation permission from `http://127.0.0.1:5173/` and does not silently fall back before the browser responds. Traces to `F-002`, `UX-002`, `DEC-BLOC-001`.
- [x] `AC-BLOC-006` [Surface `UX-001`, `UX-002`] After permission is granted, the modal closes, the feed search location changes to the granted browser location label, and the existing feed query reloads using granted `lat` and `lng`. Traces to `F-001`, `F-002`, `WF-001`, `UX-001`, `UX-002`.
- [x] `AC-BLOC-007` [Surface `UX-002`] If permission is denied, unsupported, insecure, timed out, or otherwise fails, the modal remains open and manual location remains available. Traces to `F-003`, `CON-001`, `UX-002`.
- [x] `AC-BLOC-008` The fix does not alter create-post last-seen pin selection, manual fallback places, detail location privacy, comments, messaging, reports, or management flows. Traces to `DEC-BLOC-004`, `UX-003` through `UX-010`.

### Verification

- `VER-BLOC-002` Run `npm run build` in `src/MissingPets.Web`. Traces to `AC-BLOC-005` through `AC-BLOC-008`.
- `VER-BLOC-003` Manually open `http://127.0.0.1:5173/`, click `Allow location`, grant browser permission, and verify the modal closes and the `Search location` input shows the reverse-geocoded or coordinate fallback current-location label. Traces to `AC-BLOC-005`, `AC-BLOC-006`.
- `VER-BLOC-004` Manually deny location permission in a fresh browser context and verify the modal remains open with manual fallback available. Traces to `AC-BLOC-007`.

### Stop Conditions

- Stop if the browser is not opened from `http://127.0.0.1:5173/`, `localhost`, HTTPS, or another geolocation-eligible origin.
- Stop if manual fallback stops closing the modal or updating feed location.

## Phase 3 - Automated Coverage And Regression Verification

### Entry Criteria

- Phase 2 acceptance criteria and verification pass.

### Phase Lock

- Allowed Acceptance Criteria: `AC-BLOC-009` through `AC-BLOC-012`.
- Forbidden Pull-Forward Work: Do not expand test scope into unrelated feature redesigns or backend schema/API changes.
- Next-Phase Unlock Evidence: All listed verification commands pass or documented pre-existing blockers are recorded.
- Resume / Compaction Checks: Re-read `tests/MissingPets.E2E/playwright.config.ts` and existing location assertions before editing tests.

### Implementation Notes

- Add or update Playwright tests under `tests/MissingPets.E2E/tests/`.
- Use Playwright browser context APIs:
  - `context.grantPermissions(['geolocation'])`
  - `context.setGeolocation({ latitude, longitude })`
- Intercept or observe `/api/posts?...` requests and assert they include the granted coordinates.
- Use a deterministic local test coordinate. Suggested coordinate: `{ latitude: 14.5503, longitude: 121.0503 }`.
- For reverse geocoding, tests may cover fallback label behavior when Google Maps is unconfigured, and helper/unit-like coverage may mock the geocoder only if the repository already supports such a seam without adding a large new test framework.
- Keep existing manual fallback E2E assertions.

### Acceptance Criteria

- [x] `AC-BLOC-009` Add Playwright coverage where browser geolocation is granted and the feed API query uses the granted coordinates after clicking `Allow location`. Traces to `F-001`, `F-002`, `WF-001`, `UX-001`, `UX-002`, `TEST-003`.
- [x] `AC-BLOC-010` Add Playwright coverage where browser geolocation is denied or unavailable and manual location fallback remains usable. Traces to `F-003`, `CON-001`, `UX-002`, `TEST-003`.
- [x] `AC-BLOC-011` Verify the Google Maps-unconfigured path still labels granted coordinates clearly and does not block feed search. Traces to `DEC-BLOC-003`, `ARC-005`, `TEST-003`.
- [x] `AC-BLOC-012` Existing Phase 5 and Phase 6 browser journeys still pass after the fix. Traces to `DEC-BLOC-004`, `UX-001` through `UX-010`, `TEST-003`.

### Verification

- `VER-BLOC-005` Run `npm test` in `tests/MissingPets.E2E` and confirm the browser-granted location test, denied/manual fallback test, and existing journeys pass. Traces to `AC-BLOC-009` through `AC-BLOC-012`.
- `VER-BLOC-006` Run `npm run build` in `src/MissingPets.Web` after test changes. Traces to `AC-BLOC-012`.
- `VER-BLOC-007` Run `dotnet test MissingPets.sln -c Release` and confirm backend location/feed tests remain green. Traces to `AC-BLOC-012`.

### Stop Conditions

- Stop if Playwright cannot grant geolocation permission on `http://127.0.0.1:5173/`.
- Stop if an existing local API or Vite process prevents test startup and cannot be identified as safe to reuse.
- Stop if E2E failures indicate unrelated backend/database setup issues; document the blocker rather than changing unrelated app behavior.

## Mini-Model Readiness Audit

- `AUD-BLOC-001` UX surfaces are concrete: `/` feed and the `LocationSurface` dialog in `src/MissingPets.Web/src/App.tsx`.
- `AUD-BLOC-002` Repo touchpoints are named: `App.tsx`, existing Google Maps loader, optional new frontend helper file, and Playwright tests.
- `AUD-BLOC-003` The reverse-geocoding provider is explicit: reuse `loadGoogleMapsLibraries()` and `google.maps.Geocoder`; no new provider or backend endpoint.
- `AUD-BLOC-004` Test locations and commands are explicit: `src/MissingPets.Web` build, `tests/MissingPets.E2E` Playwright, and `dotnet test MissingPets.sln -c Release`.
- `AUD-BLOC-005` Stop conditions cover insecure origin, provider duplication, and unrelated test infrastructure blockers.

Result: This plan is ready for implementation by a lighter-weight model without requiring product, UX, architecture, or repository rediscovery.
