# Create Pin Defaults To User Location - Plan

- Initiative Slug: `2026-06-15-create-pin-defaults-to-user-location`
- Artifact: `Plan`
- Status: `Draft`
- Related Artifacts:
  - `2026-06-09-missing-pets-location-forum.reqs.md`
  - `2026-06-09-missing-pets-location-forum.ux.md`
  - `2026-06-09-missing-pets-location-forum.architecture.md`
  - `2026-06-15-real-maps-last-seen-pin.plan.md`
  - `2026-06-15-browser-location-permission.plan.md`
- Last Updated: `2026-06-15`

## Objective

Make the `/posts/new` last-seen pin start from the user's currently set search location, whether that location came from browser geolocation or manual selection, while preserving the existing requirement that the poster must explicitly confirm the last-seen pin before publishing.

This plan is intentionally narrow. It does not add a new map provider, change backend geospatial storage, expose exact public coordinates, or redesign the create-post page.

## Upstream Traceability

- `F-001` Location-aware feed uses the viewer's current or manually selected location.
- `F-002` First-time location prompt can set the viewer location from browser geolocation.
- `F-003` Manual location fallback can set the viewer location without browser permission.
- `F-008` Google Maps pinpointing lets the poster choose the last-seen location.
- `WF-003` Create anonymous missing-pet post requires pinning the last-seen location before publishing.
- `DATA-001` Pet posts include last-seen coordinates and human-readable location.
- `DATA-004` Viewer location may come from browser geolocation or manual selection.
- `UX-002` Location permission and manual location overlay owns user location selection.
- `UX-004` `/posts/new` owns the full create-post flow.
- `UX-005` The Google Maps last-seen pin picker is embedded in `/posts/new`.
- `ARC-001` React/Vite owns frontend routes, browser geolocation, client state, and Google Maps integration.
- `ARC-GEO-001` Precise last-seen coordinates are stored for search.
- `ARC-GEO-003` Public detail responses remain approximate.
- `INT-API-002` `POST /api/posts` accepts `lastSeen.lat`, `lastSeen.lng`, and `lastSeen.humanReadable`.

## Current Implementation Findings

- `src/MissingPets.Web/src/App.tsx` stores the viewer/search location in `location`.
- `allowBrowserLocation()` updates `location` after a granted browser geolocation result.
- `useManualLocation()` updates `location` from known manual places or typed fallback text.
- `selectedPin` is initialized once from `defaultLocation`, not from the current `location`.
- `/posts/new` passes `searchLocation={location}` to `CreatePostSurface`, and `CreatePostSurface` passes it to `LastSeenMapPicker` as `defaultCenter`.
- `LastSeenMapPicker.resetPin()` already uses `props.defaultCenter`, so reset is close to the desired behavior.
- Initial render still shows `selectedPin`, so entering create after changing the user location can show the old default pin until the user resets or searches.
- `submitCreate()` already blocks publishing until `pinConfirmed` is true, and this behavior must remain.
- Existing Playwright coverage verifies confirmation is required and fallback BGC coordinates are posted, but it does not verify that the create pin initially defaults to the user's set location.

## Resolved Decisions

- `DEC-CPL-001` "User's location" means the active frontend `location` state used by feed and detail distance calculations, regardless of whether it came from browser geolocation or manual selection.
- `DEC-CPL-002` Opening `/posts/new` should seed `selectedPin` from `location` and mark the pin unconfirmed.
- `DEC-CPL-003` Changing the user location while on `/posts/new` should update the unconfirmed starter pin only when the poster has not already edited or confirmed a last-seen pin.
- `DEC-CPL-004` Reset pin should continue to reset to the active `location` and clear confirmation.
- `DEC-CPL-005` The poster must still confirm the pin before publish; defaulting to user location is a starting point, not implicit consent that the pet was last seen there.

## Execution Protocol

- Phases must be executed strictly in the order listed.
- A later phase must not begin until the current phase is completed and its acceptance criteria and verification steps have passed.
- Do not pull work forward from later phases unless the current phase explicitly marks it as a prerequisite.
- If current frontend state cannot distinguish a starter pin from a poster-edited pin without guessing, stop and add an explicit state flag before changing map behavior.
- After context compaction, a new session, or any resume from a long-running implementation, re-read this plan and `2026-06-15-real-maps-last-seen-pin.impl.md` before editing, checking off criteria, or advancing phases.
- Unchecked acceptance criteria are the implementation checklist. Change `[ ]` to `[x]` only after the implementation is complete and linked verification evidence has passed.
- Preserve the approved UX boundary: `UX-005` remains an embedded map section inside `/posts/new`; do not move pin selection into a separate desktop route or unrelated modal.

## High-Level Phase Summary

This summary is descriptive for planning collaborators. The detailed phase sections are the implementation instructions.

- `PLN-CPL-001` Add explicit create-pin seeding state so the map starts at the active user location and does not overwrite user edits.
- `PLN-CPL-002` align the map picker reset and messaging with "current search location" behavior while keeping confirmation mandatory.
- `PLN-CPL-003` Add Playwright coverage for manual and browser-derived user locations seeding the create pin, plus regression checks for publish confirmation and payload privacy.

## Phase 1 - Create Pin Seeding State

### Entry Criteria

- Read this plan, `2026-06-15-real-maps-last-seen-pin.plan.md`, and the current `src/MissingPets.Web/src/App.tsx` create/location state.
- Confirm the worktree state with `git status --short` and do not overwrite unrelated user edits.

### Phase Lock

- Allowed Acceptance Criteria: `AC-CPL-001` through `AC-CPL-005`.
- Forbidden Pull-Forward Work: Do not edit backend APIs, database models, public detail map behavior, Google Maps loader configuration, photo upload flow, comments, messaging, reports, or management.
- Next-Phase Unlock Evidence: `/posts/new` initial pin state derives from active `location` and remains unconfirmed.
- Resume / Compaction Checks: Re-read the `location`, `selectedPin`, `pinConfirmed`, `updatePin()`, `confirmPin()`, `navigate()`, and `isCreate` logic before continuing.

### Implementation Notes

- Primary touchpoint: `src/MissingPets.Web/src/App.tsx`.
- Add the smallest state needed to distinguish:
  - a starter pin seeded from `location`;
  - an unconfirmed poster-edited draft pin;
  - a confirmed poster-selected pin.
- Suggested approach:
  - Track whether the current create pin has been manually touched, for example `const [pinTouched, setPinTouched] = useState(false)`.
  - When navigation enters `/posts/new`, seed `selectedPin` from `location`, clear `pinConfirmed`, and clear `pinTouched`.
  - When `location` changes while `isCreate` is true and the poster has not touched or confirmed the pin, update `selectedPin` to the new `location`.
  - In `updatePin()`, set `selectedPin`, clear `pinConfirmed`, and set `pinTouched` true.
  - In `confirmPin()`, set `selectedPin`, set `pinConfirmed` true, and set `pinTouched` true.
  - On successful publish or cancel away from `/posts/new`, do not preserve a stale confirmed pin for the next create flow.
- Avoid a broad form reset unless needed for correctness. This feature is only about the last-seen pin default.
- Treat a browser location label like `Current location near 14.55030, 121.05030` as valid starter context.

### Acceptance Criteria

- [x] `AC-CPL-001` [Surface `UX-004`, `UX-005`] Opening `/posts/new` seeds the visible selected last-seen pin from the active `location` state rather than hardcoded `defaultLocation`. Traces to `DEC-CPL-001`, `DEC-CPL-002`, `UX-004`, `UX-005`, `ARC-001`.
- [x] `AC-CPL-002` [Surface `UX-005`] The seeded pin is unconfirmed and publish remains blocked until the poster confirms the last-seen location. Traces to `DEC-CPL-005`, `WF-003`, `DATA-001`, `UX-005`.
- [x] `AC-CPL-003` [Surface `UX-002`, `UX-005`] If the user changes their active location while on `/posts/new` before touching the pin, the starter pin updates to the new active location. Traces to `DEC-CPL-001`, `DEC-CPL-003`, `UX-002`, `UX-005`.
- [x] `AC-CPL-004` [Surface `UX-005`] If the poster has moved, searched, or confirmed the pin, later user-location changes must not silently overwrite that draft or confirmed last-seen pin. Traces to `DEC-CPL-003`, `DEC-CPL-005`, `UX-005`.
- [x] `AC-CPL-005` [Surface `UX-005`] Returning to `/posts/new` for a new post does not reuse a stale confirmed pin from a previous post attempt. Traces to `DEC-CPL-002`, `DEC-CPL-005`, `UX-004`, `UX-005`.

### Verification

- `VER-CPL-001` Run `npm run build` in `src/MissingPets.Web` and confirm TypeScript accepts the new state flow. Traces to `AC-CPL-001` through `AC-CPL-005`.
- `VER-CPL-002` Manually select manual location `BGC, Taguig`, navigate to `/posts/new`, and verify the selected pin summary starts at `BGC, Taguig` but still requires confirmation before publish. Traces to `AC-CPL-001`, `AC-CPL-002`.
- `VER-CPL-003` On `/posts/new`, open `Change location`, choose `Quezon City`, and verify an untouched starter pin updates to `Quezon City`. Then move/search the pin, change location again, and verify the edited draft pin is not overwritten. Traces to `AC-CPL-003`, `AC-CPL-004`.

### Stop Conditions

- Stop if the implementation would need to infer whether a pin was user-edited from coordinates or labels alone.
- Stop if the change would auto-confirm the user's location as last-seen without an explicit confirmation action.
- Stop if the change requires backend schema or API payload changes.

## Phase 2 - Picker Reset And User-Facing State Alignment

### Entry Criteria

- Phase 1 acceptance criteria and `VER-CPL-001` have passed.
- Confirm `LastSeenMapPicker` still receives `defaultCenter={props.searchLocation}` from `CreatePostSurface`.

### Phase Lock

- Allowed Acceptance Criteria: `AC-CPL-006` through `AC-CPL-009`.
- Forbidden Pull-Forward Work: Do not add new map provider behavior, live-key requirements, public exact-coordinate display, or unrelated visual redesign.
- Next-Phase Unlock Evidence: Reset and selected-pin messaging consistently reflect the active user location when appropriate.
- Resume / Compaction Checks: Re-read `src/MissingPets.Web/src/maps/LastSeenMapPicker.tsx` before editing it.

### Implementation Notes

- Touchpoints:
  - `src/MissingPets.Web/src/App.tsx`
  - `src/MissingPets.Web/src/maps/LastSeenMapPicker.tsx`
  - `src/MissingPets.Web/src/App.css` only if existing layout states become cramped.
- `LastSeenMapPicker.resetPin()` already calls `props.onDraftChange(draftPin(props.defaultCenter))`; ensure the parent treats this as a user-touched draft and clears confirmation.
- Keep the visible privacy note: exact coordinates are saved for search and public display is approximate.
- Keep no-key fallback behavior for tests and local development.
- If copy is adjusted, keep it short and action-oriented. Avoid adding explanatory blocks that make `/posts/new` feel like documentation.

### Acceptance Criteria

- [x] `AC-CPL-006` [Surface `UX-005`] Reset pin uses the active user/search location as the map starter location and clears confirmation. Traces to `DEC-CPL-004`, `DEC-CPL-005`, `UX-005`.
- [x] `AC-CPL-007` [Surface `UX-005`] Map picker summary text makes it clear that the seeded/reset pin is selected but unconfirmed until the poster confirms it. Traces to `DEC-CPL-005`, `WF-003`, `UX-005`.
- [x] `AC-CPL-008` [Surface `UX-005`] No-key fallback mode continues to support local fallback place search and confirmation without live Google Maps. Traces to `F-008`, `ARC-005`, `UX-005`.
- [x] `AC-CPL-009` [Surface `UX-004`, `UX-005`] Create form layout remains usable on desktop and mobile after any messaging or state changes, with no overlapping controls. Traces to `UX-004`, `UX-005`, `TEST-004`.

### Verification

- `VER-CPL-004` Run `npm run build` in `src/MissingPets.Web`. Traces to `AC-CPL-006` through `AC-CPL-009`.
- `VER-CPL-005` With no Google Maps key configured, manually verify `/posts/new` shows the fallback map state, starts from the active user location, resets to that same location, and still requires confirmation. Traces to `AC-CPL-006`, `AC-CPL-008`.
- `VER-CPL-006` Browser-check `/posts/new` at desktop and mobile widths and verify selected-pin, reset, confirm, and publish controls do not overlap. Traces to `AC-CPL-009`.

### Stop Conditions

- Stop if reset behavior conflicts with the explicit-confirmation requirement.
- Stop if live Google Maps behavior and local fallback behavior diverge in what payload gets submitted after confirmation.

## Phase 3 - Automated Coverage And Regression Verification

### Entry Criteria

- Phases 1 and 2 acceptance criteria and verification steps have passed.
- The app can run under the existing Playwright configuration.

### Phase Lock

- Allowed Acceptance Criteria: `AC-CPL-010` through `AC-CPL-015`.
- Forbidden Pull-Forward Work: Do not expand test scope into unrelated feature redesign, provider-key mocking, backend persistence changes, or new test frameworks.
- Next-Phase Unlock Evidence: New E2E tests and existing regression tests pass or blockers are recorded.
- Resume / Compaction Checks: Re-read `tests/MissingPets.E2E/tests/phase5-integration.spec.ts`, `tests/MissingPets.E2E/tests/browser-location-permission.spec.ts`, and `tests/MissingPets.E2E/playwright.config.ts` before editing tests.

### Implementation Notes

- Touchpoints:
  - `tests/MissingPets.E2E/tests/phase5-integration.spec.ts`
  - `tests/MissingPets.E2E/tests/browser-location-permission.spec.ts` or a new focused spec under `tests/MissingPets.E2E/tests/`
  - `src/MissingPets.Web/src/App.tsx` only for defects found by tests.
- Add focused Playwright coverage for:
  - Manual location selected before create seeds the create pin.
  - Browser geolocation granted before create seeds the create pin with granted coordinates or fallback current-location label.
  - Publish remains blocked before confirmation.
  - Confirmed payload uses the seeded location when the poster confirms without moving the pin.
  - Poster-edited pin is not overwritten by a later active-location change.
- Tests should run in no-key fallback mode and must not depend on live Google Maps network calls.
- Existing Phase 5 create journey should continue to prove non-default fallback BGC payload behavior.

### Acceptance Criteria

- [x] `AC-CPL-010` Add Playwright coverage where manual location `BGC, Taguig` is selected, `/posts/new` opens with the selected pin at `BGC, Taguig`, and publish is blocked until confirmation. Traces to `AC-CPL-001`, `AC-CPL-002`, `F-003`, `UX-002`, `UX-005`, `TEST-003`.
- [x] `AC-CPL-011` Add Playwright coverage where granted browser geolocation sets the active user location and `/posts/new` seeds the selected pin from those granted coordinates or fallback current-location label. Traces to `AC-CPL-001`, `F-002`, `DATA-004`, `UX-002`, `UX-005`, `TEST-003`.
- [x] `AC-CPL-012` Add Playwright coverage where confirming the seeded pin submits `POST /api/posts` with the active user location coordinates and label, without requiring an additional search/reset action. Traces to `AC-CPL-001`, `AC-CPL-002`, `INT-API-002`, `DATA-001`, `TEST-003`.
- [x] `AC-CPL-013` Add Playwright coverage proving a touched or confirmed last-seen pin is not overwritten by a later user-location change while still on `/posts/new`. Traces to `AC-CPL-004`, `DEC-CPL-003`, `UX-005`, `TEST-003`.
- [x] `AC-CPL-014` Existing create, feed, detail, comments, messaging, report, and management Playwright journeys still pass. Traces to `UX-001` through `UX-010`, `TEST-003`.
- [x] `AC-CPL-015` Backend tests remain green, proving no accidental API or public-location privacy regression. Traces to `ARC-GEO-001`, `ARC-GEO-003`, `INT-API-002`, `TEST-001`, `TEST-002`.

### Verification

- `VER-CPL-007` Run `npm test` in `tests/MissingPets.E2E` and confirm the new create-pin default tests plus existing journeys pass. Traces to `AC-CPL-010` through `AC-CPL-014`.
- `VER-CPL-008` Run `npm run build` in `src/MissingPets.Web` after test changes. Traces to `AC-CPL-014`.
- `VER-CPL-009` Run `dotnet test MissingPets.sln -c Release` and confirm backend behavior remains green. Traces to `AC-CPL-015`.
- `VER-CPL-010` Review test assertions to confirm they prove user-location seeding rather than only the old fallback search path. Traces to `AC-CPL-010`, `AC-CPL-011`, `AC-CPL-012`.

### Stop Conditions

- Stop if Playwright cannot reliably grant geolocation permission on the configured local origin.
- Stop if tests require a live Google Maps browser API key to verify this feature.
- Stop if a regression exposes precise last-seen coordinates in public feed or detail UI.

## Mini-Model Readiness Audit

- `AUD-CPL-001` UX surfaces are concrete: `/posts/new` create page, embedded `LastSeenMapPicker`, and `LocationSurface` overlay.
- `AUD-CPL-002` Repo touchpoints are named: `src/MissingPets.Web/src/App.tsx`, `src/MissingPets.Web/src/maps/LastSeenMapPicker.tsx`, and Playwright specs under `tests/MissingPets.E2E/tests/`.
- `AUD-CPL-003` The operative state contract is explicit: active `location` seeds `selectedPin`, the seed is unconfirmed, poster-touched pins are not overwritten, and publish still requires confirmation.
- `AUD-CPL-004` The plan distinguishes manual location, browser geolocation, local no-key fallback, reset behavior, and confirmed payload behavior.
- `AUD-CPL-005` Test layers and commands are explicit: web build, Playwright E2E, and `dotnet test MissingPets.sln -c Release`.
- `AUD-CPL-006` Acceptance criteria cannot pass by only preserving the old hardcoded `defaultLocation` or local fallback search behavior.

Result: This plan is ready for implementation by a lighter-weight model without requiring product, UX, architecture, or repository rediscovery.
