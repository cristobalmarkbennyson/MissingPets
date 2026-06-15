# Real Maps Last-Seen Pin - Plan

- Initiative Slug: `2026-06-15-real-maps-last-seen-pin`
- Artifact: `Plan`
- Status: `Draft`
- Related Artifacts:
  - `2026-06-09-missing-pets-location-forum.reqs.md`
  - `2026-06-09-missing-pets-location-forum.ux.md`
  - `2026-06-09-missing-pets-location-forum.architecture.md`
  - `2026-06-09-missing-pets-location-forum.plan.md`
  - `2026-06-09-missing-pets-location-forum.impl.md`
- Last Updated: `2026-06-15`

## Purpose

Replace the create-post last-seen location mock with a real Google Maps pinpoint picker so posters can choose the actual last-seen area instead of implicitly publishing the current hardcoded default location. The backend already accepts precise `lastSeen.lat`, `lastSeen.lng`, and `lastSeen.humanReadable`, so this follow-on plan focuses on frontend maps integration, configuration, and browser verification.

## Upstream Traceability

- `F-008` requires Google Maps pinpointing for poster-selected last-seen location.
- `WF-003` requires the poster to pin the last-seen location before publishing.
- `UX-005` defines the Google Maps last-seen pin picker as an embedded map section or mobile full-screen step within `/posts/new`.
- `ARC-001` assigns Google Maps JavaScript integration to the React frontend.
- `ARC-005` defines Google Maps JavaScript API, Places, and Geocoding as the maps provider.
- `INT-API-002` already accepts create-post payloads with `lastSeen.lat`, `lastSeen.lng`, and `lastSeen.humanReadable`.
- `DEC-UX-005` and `ARC-GEO-003` require public display to remain approximate even when precise coordinates are stored for search.

## Current Implementation Findings

- `src/MissingPets.Web/src/App.tsx` defines `defaultLocation` as Makati and initializes both feed search and `selectedPin` from it.
- `manualPlaces` only supports Makati, BGC, and Quezon City.
- `updatePin()` resolves text against `manualPlaces`; unknown input falls back to `defaultLocation` coordinates with the typed label.
- `MapPanel` is a CSS mock and never calls Google Maps.
- `/posts/new` publishes `selectedPin` directly, so unknown place text can submit Makati coordinates with a custom label.
- `README.md` says production should provide a real Google Maps browser API key, but the Vite frontend currently has no map loader or browser-exposed key path.

## Execution Protocol

- Execute phases strictly in order.
- Do not begin a later phase until the current phase's acceptance criteria and verification steps pass.
- Change `[ ]` to `[x]` only after implementation is complete and linked verification evidence has passed.
- If Google Maps configuration, API loading, Places behavior, or privacy guidance conflicts with upstream artifacts, stop and escalate instead of guessing.
- After context compaction or a resumed session, re-read this plan and `2026-06-09-missing-pets-location-forum.impl.md` before editing files or checking criteria.
- Preserve the approved UX boundary: `UX-005` remains an embedded map picker inside `/posts/new`; do not move post creation into a modal or mix public detail-map behavior into the create picker.

## High-Level Phase Summary

This summary is descriptive for planning collaborators. The detailed phases below are the source of implementation instructions.

- `PLN-MAP-001` Add browser-safe Google Maps configuration and a loader with local mock fallback for development and tests.
- `PLN-MAP-002` Replace the create-post map mock with a real pin picker that supports place search, click-to-place, drag-to-adjust, reverse geocoding, and explicit confirmation.
- `PLN-MAP-003` Protect the create-post payload from default-coordinate leakage and preserve approximate public display behavior.
- `PLN-MAP-004` Update automated tests, documentation, and browser evidence for real-map and no-key fallback paths.

## Phase 1 - Maps Configuration And Loader

### Phase Lock

- Allowed Acceptance Criteria: `AC-MAP-001` through `AC-MAP-004`.
- Forbidden Pull-Forward Work: Do not replace the create-post UI yet; do not alter backend geospatial schema or public detail responses.
- Unlock Evidence: Frontend builds with the maps loader dependency and can render a no-key fallback without runtime failure.
- Resume Checks: Confirm existing create-post flow still publishes with the current mock before replacing behavior in Phase 2.

### Scope

Add frontend configuration and provider-loading code for Google Maps JavaScript API while preserving the existing no-key local development/test path.

Concrete touchpoints:

- `src/MissingPets.Web/package.json`
- `src/MissingPets.Web/package-lock.json`
- `src/MissingPets.Web/src/App.tsx`
- Optional new files under `src/MissingPets.Web/src/maps/`
- `src/MissingPets.Web/README.md`
- `README.md`

Preferred dependency:

- `@googlemaps/js-api-loader`

Configuration:

- Add `VITE_GOOGLE_MAPS_BROWSER_API_KEY` for the Vite browser bundle.
- Keep no-key behavior available as a controlled local fallback, but label it as fallback/mock mode, not production behavior.
- Do not rely on `GoogleMaps__BrowserApiKey` being readable by the Vite browser bundle unless a backend client-config endpoint is explicitly added in this phase.

### Acceptance Criteria

- [x] `AC-MAP-001` Add a browser maps API key configuration path for the React/Vite frontend without hardcoding secrets. Traces to `ARC-001`, `ARC-005`, `CFG-002`.
- [x] `AC-MAP-002` Add a Google Maps JavaScript loader seam that loads Maps, Places, and Geocoding capabilities only when a browser key is configured. Traces to `ARC-005`, `UX-005`.
- [x] `AC-MAP-003` Preserve deterministic no-key fallback behavior for local tests, with user-visible map-unavailable messaging when real maps cannot load. Traces to `UX-005`, `AC-PLN-034`.
- [x] `AC-MAP-004` Document the frontend maps key and clarify that production real maps require `VITE_GOOGLE_MAPS_BROWSER_API_KEY`. Traces to `CFG-002`, `AC-PLN-039`.

### Verification

- `VER-MAP-001` Run `npm install` in `src/MissingPets.Web` if the loader dependency is added, then verify `package-lock.json` is updated. Traces to `AC-MAP-002`.
- `VER-MAP-002` Run `npm run build` in `src/MissingPets.Web` with no maps key configured and confirm no TypeScript or bundling failures. Traces to `AC-MAP-001`, `AC-MAP-003`.
- `VER-MAP-003` Review README changes and confirm no real API key value is committed. Traces to `AC-MAP-004`.

### Stop Conditions

- Stop if the chosen loader requires exposing non-browser-safe credentials.
- Stop if local no-key fallback cannot coexist with Playwright verification.
- Stop if implementation would require backend schema changes for this phase.

## Phase 2 - Real Last-Seen Pin Picker

### Phase Lock

- Allowed Acceptance Criteria: `AC-MAP-005` through `AC-MAP-010`.
- Forbidden Pull-Forward Work: Do not change feed search behavior or public detail-map approximation except where needed to avoid shared component regressions.
- Unlock Evidence: `/posts/new` lets a poster choose, move, and confirm a real map pin, and the selected coordinates in React state reflect the chosen point.
- Resume Checks: Confirm Phase 1 build passed and no-key fallback still renders before replacing `MapPanel` usage in create flow.

### Scope

Replace the current `Place search` text-only mock inside `CreatePostSurface` with a dedicated last-seen picker component.

Concrete touchpoints:

- `src/MissingPets.Web/src/App.tsx`
- `src/MissingPets.Web/src/App.css`
- Optional new files:
  - `src/MissingPets.Web/src/maps/GoogleMapsLoader.ts`
  - `src/MissingPets.Web/src/maps/LastSeenMapPicker.tsx`
  - `src/MissingPets.Web/src/maps/mapTypes.ts`

Required picker behavior:

- Initialize from the current viewer/manual location if available, otherwise from `defaultLocation`, but mark the pin as unconfirmed until the poster selects or confirms it.
- Render a Google map when the key loads.
- Support place search/autocomplete or equivalent Places search.
- Support clicking the map to move the pin.
- Support dragging the marker to refine the pin.
- Reverse geocode moved coordinates into a human-readable location when possible.
- Let the poster confirm the last-seen pin before publishing.
- Show loading and error states for map script loading, Places failure, and Geocoding failure.
- Keep mobile layout usable without text/control overlap.

### Acceptance Criteria

- [x] `AC-MAP-005` [Surface `UX-005`] Implement the last-seen picker as an embedded component in `/posts/new` with Google map, search, selected marker, and confirmation action; it must not become a separate post-creation route or modal on desktop. Traces to `UX-004`, `UX-005`, `F-008`, `ARC-005`.
- [x] `AC-MAP-006` [Surface `UX-005`] Allow posters to set the pin by Places search, map click, and marker drag, with React state updated to the selected `lat`, `lng`, and `humanReadable` value. Traces to `UX-005`, `WF-003`, `INT-API-002`.
- [x] `AC-MAP-007` [Surface `UX-005`] Make the default map center a starting context only; publishing must require an explicitly confirmed selected pin. Traces to `WF-003`, `DATA-001`, `AC-PLN-030`.
- [x] `AC-MAP-008` [Surface `UX-005`] Display map loading, provider unavailable, no place result, and reverse-geocode fallback states without blocking the rest of the create form. Traces to `UX-005`, `AC-PLN-034`.
- [x] `AC-MAP-009` [Surface `UX-005`] Preserve the privacy note that exact coordinates are stored for search and public display is approximate. Traces to `DEC-UX-005`, `ARC-GEO-003`.
- [x] `AC-MAP-010` Keep feed and detail `MapPanel` approximate display behavior unchanged unless a separate upstream decision approves real public map rendering. Traces to `UX-006`, `DEC-UX-005`, `ARC-GEO-003`.

### Verification

- `VER-MAP-004` Run `npm run build` in `src/MissingPets.Web`. Traces to `AC-MAP-005` through `AC-MAP-010`.
- `VER-MAP-005` With no API key, open `/posts/new` and verify the fallback state is clear, the create form remains usable, and publish is blocked until a valid confirmed fallback/manual pin exists. Traces to `AC-MAP-003`, `AC-MAP-007`, `AC-MAP-008`.
- `VER-MAP-006` With a valid `VITE_GOOGLE_MAPS_BROWSER_API_KEY`, open `/posts/new`, search for a place, move or drag the pin, confirm it, and verify the selected summary changes away from the default coordinates when a non-default place is chosen. Traces to `AC-MAP-005`, `AC-MAP-006`, `AC-MAP-007`.
- `VER-MAP-007` Check desktop and mobile widths for the create form and map picker; verify controls do not overlap and the map remains operable. Traces to `AC-MAP-005`, `AC-MAP-008`.

### Stop Conditions

- Stop if the Google Maps API key is unavailable for real-provider manual verification and the task owner requires proof against the live provider before proceeding.
- Stop if Places or Geocoding API enablement is missing from the configured Google Cloud project.
- Stop if product direction changes to show exact public post coordinates.

## Phase 3 - Create Payload Safety And Privacy Preservation

### Phase Lock

- Allowed Acceptance Criteria: `AC-MAP-011` through `AC-MAP-014`.
- Forbidden Pull-Forward Work: Do not introduce account requirements, moderation console work, native mobile work, or unrelated feed-location search changes.
- Unlock Evidence: Create-post payloads use the confirmed real pin and public detail responses remain approximate.
- Resume Checks: Confirm Phase 2 picker state distinguishes unconfirmed default center from confirmed selected pin.

### Scope

Wire the confirmed picker state into `submitCreate()` and strengthen tests/guards so default coordinates are not submitted under arbitrary typed labels.

Concrete touchpoints:

- `src/MissingPets.Web/src/App.tsx`
- `src/MissingPets.Api.Tests/Api/MissingPetsApiIntegrationTests.cs`
- `tests/MissingPets.E2E/tests/phase5-integration.spec.ts`
- `tests/MissingPets.E2E/tests/phase6-browser-evidence.spec.ts`

Required behavior:

- `submitCreate()` must reject publish attempts when no confirmed last-seen pin exists.
- The create payload must use the confirmed picker coordinates and human-readable label.
- Unknown free-text place names must not silently submit `defaultLocation` coordinates.
- Public detail and feed views must continue to avoid exposing exact private coordinates in user-visible content.

### Acceptance Criteria

- [x] `AC-MAP-011` Require a confirmed last-seen pin before `POST /api/posts` is called from `/posts/new`. Traces to `UX-005`, `WF-003`, `DATA-001`.
- [x] `AC-MAP-012` Ensure create-post payload `lastSeen` values come from the confirmed picker state, not from `defaultLocation` or arbitrary text fallback. Traces to `INT-API-002`, `ARC-GEO-001`, `AC-PLN-030`.
- [x] `AC-MAP-013` Preserve backend validation for required last-seen coordinates and do not weaken `PetPostValidator` expectations. Traces to `DATA-001`, `AC-PLN-009`.
- [x] `AC-MAP-014` Preserve public approximate map behavior in feed/detail UI and API responses after creating a post with a real selected pin. Traces to `DEC-003`, `DEC-UX-005`, `ARC-GEO-003`, `AC-PLN-032`.

### Verification

- `VER-MAP-008` Add or update Playwright coverage to assert publish is blocked before pin confirmation and no photo upload ticket is requested during that blocked publish attempt. Traces to `AC-MAP-011`.
- `VER-MAP-009` Add or update Playwright coverage to create a post with a non-default confirmed pin and assert the intercepted `POST /api/posts` payload uses the chosen coordinates and label. Traces to `AC-MAP-012`.
- `VER-MAP-010` Run `dotnet test MissingPets.sln -c Release` and confirm backend location validation/public-location tests still pass. Traces to `AC-MAP-013`, `AC-MAP-014`.
- `VER-MAP-011` Run `npm test` in `tests/MissingPets.E2E` and confirm no public exact-coordinate assertions regress. Traces to `AC-MAP-014`.

### Stop Conditions

- Stop if the frontend cannot reliably distinguish confirmed pin state from default map center state.
- Stop if E2E tests require live Google Maps network calls in CI without an available key.
- Stop if public UI starts exposing exact coordinates to satisfy test convenience.

## Phase 4 - Evidence, Documentation, And Release Readiness

### Phase Lock

- Allowed Acceptance Criteria: `AC-MAP-015` through `AC-MAP-018`.
- Forbidden Pull-Forward Work: No new maps features beyond fixing defects found by planned verification.
- Unlock Evidence: Build, backend tests, E2E tests, documentation, and browser evidence are complete.
- Resume Checks: Confirm Phases 1 through 3 criteria are checked with passing evidence before final documentation.

### Scope

Finish test evidence, update docs, and record follow-on implementation results.

Concrete touchpoints:

- `README.md`
- `src/MissingPets.Web/README.md`
- `docs/exec-plans/active/2026-06-09-missing-pets-location-forum.impl.md`
- Browser evidence images under `docs/exec-plans/active/` if captured by Playwright or manual review.

### Acceptance Criteria

- [x] `AC-MAP-015` Documentation explains how to run the app with real Google Maps and how no-key fallback behaves locally. Traces to `CFG-002`, `AC-MAP-001`, `AC-MAP-003`.
- [x] `AC-MAP-016` Playwright or browser evidence covers `/posts/new` map picker at desktop and mobile widths. Traces to `UX-005`, `TEST-003`, `TEST-004`.
- [x] `AC-MAP-017` Implementation evidence records files changed, commands run, pass/fail outcomes, unresolved risks, and whether live Google Maps verification used a real key. Traces to `AC-PLN-040`.
- [x] `AC-MAP-018` Existing full-app behavior remains intact: feed location prompt, create post, detail view, comments, message, report, and management tests pass. Traces to `UX-001` through `UX-010`, `TEST-003`.

### Verification

- `VER-MAP-012` Run `npm run build` in `src/MissingPets.Web`. Traces to `AC-MAP-018`.
- `VER-MAP-013` Run `dotnet test MissingPets.sln -c Release`. Traces to `AC-MAP-018`.
- `VER-MAP-014` Run `npm test` in `tests/MissingPets.E2E`. Traces to `AC-MAP-016`, `AC-MAP-018`.
- `VER-MAP-015` Capture or update desktop and mobile browser evidence for `/posts/new` map picker. Traces to `AC-MAP-016`.
- `VER-MAP-016` Review docs and implementation evidence for completeness and no committed secrets. Traces to `AC-MAP-015`, `AC-MAP-017`.

### Stop Conditions

- Stop if tests only prove the old hardcoded/manual mock path.
- Stop if documentation implies production can use no-key mock mode for real pinning.
- Stop if a real API key is required for release signoff but was not available during verification.

## Mini-Model Readiness Audit

- `AUD-MAP-001` Repo touchpoints are named for frontend app code, optional map helper files, E2E tests, backend tests, and docs.
- `AUD-MAP-002` UX surface mapping is explicit: `UX-005` remains an embedded component inside `/posts/new`.
- `AUD-MAP-003` The plan distinguishes real provider behavior from no-key fallback behavior.
- `AUD-MAP-004` Acceptance criteria prevent default-coordinate leakage and preserve public approximate display.
- `AUD-MAP-005` Verification identifies build, backend test, E2E, desktop/mobile browser evidence, and live-key manual verification expectations.
- `AUD-MAP-006` Known unresolved dependency: live Google Maps verification requires a valid browser API key with Maps JavaScript API, Places, and Geocoding enabled.
