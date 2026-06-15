# Real Maps Last-Seen Pin - Implementation

- Initiative Slug: `2026-06-15-real-maps-last-seen-pin`
- Artifact: `Implementation`
- Status: `Complete`
- Related Artifacts:
  - `2026-06-15-real-maps-last-seen-pin.plan.md`
  - `2026-06-09-missing-pets-location-forum.reqs.md`
  - `2026-06-09-missing-pets-location-forum.ux.md`
  - `2026-06-09-missing-pets-location-forum.architecture.md`
  - `2026-06-09-missing-pets-location-forum.impl.md`
- Last Updated: `2026-06-15`

## Execution Summary

- Current Phase: Complete.
- Completed Phases: `Phase 1`, `Phase 2`, `Phase 3`, `Phase 4`.
- Incomplete Phases: None.
- Major Outcome: `/posts/new` now has a Google Maps-backed last-seen picker with no-key fallback, explicit pin confirmation, create-payload protection, updated docs, and Playwright coverage.
- Plan Deviations: Plan status was `Draft`, but the user explicitly requested execution on `2026-06-15`. Live Google Maps verification with a real key was not run because no `VITE_GOOGLE_MAPS_BROWSER_API_KEY` was present in this environment.

## Active Phase Lock

- Active Phase: Complete.
- Allowed Acceptance Criteria: `AC-MAP-001` through `AC-MAP-018` completed.
- Forbidden Pull-Forward Work: No backend schema, public exact-coordinate display, account requirement, native mobile work, moderation console work, or unrelated feed search change was introduced.
- Prior Phase Verification Required Before This Phase: All phase verification listed below passed except live-key manual verification, which is recorded as an open risk.
- Next Phase Unlock Evidence: Not applicable.
- Resume / Compaction Checkpoint:
  - Last plan reread: `2026-06-15 00:00 local`
  - Last implementation artifact reread: Updated after completion.
  - Last phase guard result: Manual pass. Script unavailable because both `py` and `python` are unavailable in this shell.
- Boundary Decision: Complete.

## Phase Ledger

### `Phase 1 - Maps Configuration And Loader`

- Status: Complete.
- Acceptance Criteria:
  - `AC-MAP-001` Complete - `VITE_GOOGLE_MAPS_BROWSER_API_KEY` is read by `GoogleMapsLoader.ts`; no key value is committed.
  - `AC-MAP-002` Complete - `GoogleMapsLoader.ts` loads `maps`, `places`, and `geocoding` libraries only when a browser key is configured.
  - `AC-MAP-003` Complete - No-key fallback behavior is user-visible through the picker.
  - `AC-MAP-004` Complete - Root and web READMEs document real-key and fallback behavior.
- Files Changed:
  - `src/MissingPets.Web/package.json`
  - `src/MissingPets.Web/package-lock.json`
  - `src/MissingPets.Web/src/maps/GoogleMapsLoader.ts`
  - `src/MissingPets.Web/tsconfig.app.json`
  - `README.md`
  - `src/MissingPets.Web/README.md`
- Tests Added Or Updated: None in this phase.
- Verification:
  - `npm install @googlemaps/js-api-loader` - Pass.
  - `npm run build` in `src/MissingPets.Web` - Pass after type config fix.
- Notes:
  - Added `google.maps` to `tsconfig.app.json` because the project restricts ambient types.

### `Phase 2 - Real Last-Seen Pin Picker`

- Status: Complete.
- Acceptance Criteria:
  - `AC-MAP-005` Complete - `LastSeenMapPicker` is embedded in `/posts/new` and keeps create as a full page.
  - `AC-MAP-006` Complete - Live path supports Places search, map click, marker drag, reverse geocoding, and React state updates.
  - `AC-MAP-007` Complete - Selected pin starts unconfirmed and must be confirmed before publish.
  - `AC-MAP-008` Complete - Loading, provider unavailable, no-result, geocode fallback, and no-key states are represented.
  - `AC-MAP-009` Complete - Exact-coordinate privacy note remains in the create flow.
  - `AC-MAP-010` Complete - Feed/detail `MapPanel` approximate display was left unchanged.
- Files Changed:
  - `src/MissingPets.Web/src/maps/LastSeenMapPicker.tsx`
  - `src/MissingPets.Web/src/maps/mapTypes.ts`
  - `src/MissingPets.Web/src/App.tsx`
  - `src/MissingPets.Web/src/App.css`
- Tests Added Or Updated:
  - `tests/MissingPets.E2E/tests/phase5-integration.spec.ts`
  - `tests/MissingPets.E2E/tests/phase6-browser-evidence.spec.ts`
- Verification:
  - `npm run build` in `src/MissingPets.Web` - Pass.
  - `npm test` in `tests/MissingPets.E2E` - Pass; fallback picker exercised.
- Notes:
  - `VER-MAP-006` live-provider manual verification was deferred because no browser API key was configured.

### `Phase 3 - Create Payload Safety And Privacy Preservation`

- Status: Complete.
- Acceptance Criteria:
  - `AC-MAP-011` Complete - Publish is blocked before pin confirmation.
  - `AC-MAP-012` Complete - E2E intercept asserts `POST /api/posts` uses confirmed BGC fallback coordinates and label.
  - `AC-MAP-013` Complete - Backend validation tests still pass unchanged.
  - `AC-MAP-014` Complete - E2E still asserts exact selected coordinates are absent from public detail UI.
- Files Changed:
  - `src/MissingPets.Web/src/App.tsx`
  - `tests/MissingPets.E2E/tests/phase5-integration.spec.ts`
  - `tests/MissingPets.E2E/tests/phase6-browser-evidence.spec.ts`
- Tests Added Or Updated:
  - Updated Phase 5 Playwright journey to assert blocked publish before confirmation, no upload ticket before confirmation, no create-post request before confirmation, and chosen payload coordinates after confirmation.
  - Updated Phase 6 Playwright evidence journey to confirm fallback pins before publishing.
- Verification:
  - `dotnet test MissingPets.sln -c Release` - Pass, 14 tests.
  - `npm test` in `tests/MissingPets.E2E` - Pass, 2 tests.

### `Phase 4 - Evidence, Documentation, And Release Readiness`

- Status: Complete.
- Acceptance Criteria:
  - `AC-MAP-015` Complete - Docs describe real Google Maps key setup and no-key fallback.
  - `AC-MAP-016` Complete - Phase 6 Playwright screenshots were regenerated, including `/posts/new` desktop and mobile picker states.
  - `AC-MAP-017` Complete - This implementation evidence records files, commands, outcomes, risks, and live-key status.
  - `AC-MAP-018` Complete - Existing full-app Playwright journeys pass.
- Files Changed:
  - `README.md`
  - `src/MissingPets.Web/README.md`
  - `docs/exec-plans/active/2026-06-15-real-maps-last-seen-pin.impl.md`
  - `docs/exec-plans/active/phase6-*.png`
- Tests Added Or Updated:
  - `tests/MissingPets.E2E/tests/phase5-integration.spec.ts`
  - `tests/MissingPets.E2E/tests/phase6-browser-evidence.spec.ts`
- Verification:
  - `npm run build` in `src/MissingPets.Web` - Pass.
  - `dotnet test MissingPets.sln -c Release` - Pass, 14 tests.
  - `npm test` in `tests/MissingPets.E2E` - Pass, 2 tests.
  - Secret scan for `AIza` and committed key-like values - Pass; only placeholder docs references found.

## Mini-Model Execution Audit Results

- Phase: All phases.
- Result: Executable Without Significant Inference.
- Missing Or Ambiguous Detail: Live Google Maps manual verification requires a real browser key, which is an external prerequisite already identified by the plan.
- Resolution: Implemented live-provider code path and verified no-key fallback path automatically; recorded live-key verification as an open risk.
- Affected Acceptance Criteria: `AC-MAP-005`, `AC-MAP-006`, `AC-MAP-016`, `AC-MAP-017`.

## Implementation Decisions

- `DEC-IMPL-001` Use `@googlemaps/js-api-loader` functional API (`setOptions` and `importLibrary`) instead of deprecated `Loader`. Rationale: The installed package marks `Loader` deprecated and the functional API supports explicit library loading. Traces to `ARC-005`, `AC-MAP-002`.
- `DEC-IMPL-002` Keep deterministic no-key fallback place search to Makati, BGC, and Quezon City through the existing local place set. Rationale: This preserves stable local Playwright coverage without live Google calls. Traces to `AC-MAP-003`, `AC-MAP-008`, `TEST-003`.
- `DEC-IMPL-003` Keep feed/detail maps on the existing approximate `MapPanel`. Rationale: The plan explicitly protects public approximate map behavior. Traces to `DEC-UX-005`, `ARC-GEO-003`, `AC-MAP-010`.

## Change Map

### Product Code

- `src/MissingPets.Web/src/App.tsx` - Added pin confirmation state, publish gate, and `LastSeenMapPicker` integration.
- `src/MissingPets.Web/src/App.css` - Added Google/fallback map picker layout styles.
- `src/MissingPets.Web/src/maps/GoogleMapsLoader.ts` - Added browser key handling and Maps/Places/Geocoding loader.
- `src/MissingPets.Web/src/maps/LastSeenMapPicker.tsx` - Added live Google Maps picker and deterministic fallback picker.
- `src/MissingPets.Web/src/maps/mapTypes.ts` - Added shared pin type.
- `src/MissingPets.Web/tsconfig.app.json` - Added `google.maps` ambient types.

### Tests

- `tests/MissingPets.E2E/tests/phase5-integration.spec.ts` - Added blocked-publish and create payload assertions.
- `tests/MissingPets.E2E/tests/phase6-browser-evidence.spec.ts` - Updated publish journeys to confirm pins and regenerate evidence.

### Data, Config, Scripts, Or Docs

- `src/MissingPets.Web/package.json` - Added `@googlemaps/js-api-loader`.
- `src/MissingPets.Web/package-lock.json` - Lockfile update.
- `README.md` - Documented `VITE_GOOGLE_MAPS_BROWSER_API_KEY` and fallback behavior.
- `src/MissingPets.Web/README.md` - Documented web app configuration.
- `docs/exec-plans/active/2026-06-15-real-maps-last-seen-pin.plan.md` - Checked off completed criteria.
- `docs/exec-plans/active/phase6-*.png` - Regenerated browser evidence.

### Routes, APIs, Components, Or Contracts

- `/posts/new` - Last-seen picker is an embedded section in the create flow.
- `POST /api/posts` - No API shape change; frontend now sends confirmed pin state only.
- `/` and `/posts/:postId` - Public approximate map display remains unchanged.

## Regression And Contract Log

- `REG-MAP-001` Initial Phase 1 build failed because `google.maps` ambient types were unavailable.
  - Exposed By: `npm run build` in `src/MissingPets.Web`.
  - Contract Risk: Build configuration.
  - Root Cause: Implementation/configuration; `tsconfig.app.json` restricted ambient types to `vite/client`.
  - Fix: Added `google.maps` to `compilerOptions.types`.
  - Manual Watch Area: Ensure future map files build under the same TypeScript configuration.

## Verification Evidence

- `VER-MAP-001` `npm install @googlemaps/js-api-loader` - Pass.
  - Scope: Phase-required dependency install.
  - Evidence: Added 2 packages, 0 vulnerabilities.
  - Traces to: `AC-MAP-002`.
- `VER-MAP-002` `npm run build` in `src/MissingPets.Web` - Pass.
  - Scope: Phase-required frontend build.
  - Evidence: Vite production build completed.
  - Traces to: `AC-MAP-001`, `AC-MAP-003`, `AC-MAP-005` through `AC-MAP-010`, `AC-MAP-018`.
- `VER-MAP-003` README review and secret scan - Pass.
  - Scope: Documentation and no-secret review.
  - Evidence: Search found no `AIza` values and only placeholder `VITE_GOOGLE_MAPS_BROWSER_API_KEY` docs examples.
  - Traces to: `AC-MAP-004`, `AC-MAP-015`, `AC-MAP-017`.
- `VER-MAP-004` `dotnet test MissingPets.sln -c Release` - Pass.
  - Scope: Backend integration/unit suite.
  - Evidence: 14 passed.
  - Traces to: `AC-MAP-013`, `AC-MAP-014`, `AC-MAP-018`.
- `VER-MAP-005` `npm test` in `tests/MissingPets.E2E` - Pass.
  - Scope: Full Playwright suite.
  - Evidence: 2 passed; confirms blocked publish, no pre-confirm upload/create request, selected BGC payload, public coordinate privacy, and regenerated screenshots.
  - Traces to: `AC-MAP-011`, `AC-MAP-012`, `AC-MAP-014`, `AC-MAP-016`, `AC-MAP-018`.
- `VER-MAP-006` Live Google Maps browser-key manual verification - Deferred.
  - Scope: Live provider path.
  - Evidence: No `VITE_GOOGLE_MAPS_BROWSER_API_KEY` was configured in this environment.
  - Traces to: `AC-MAP-005`, `AC-MAP-006`, `AUD-MAP-006`.

## Sub-Agent Coordination And Findings

- Suitability Decision: Do not use sub-agents.
- Rationale: Sub-agent review could be useful for this plan, but the available multi-agent tool only permits spawning when the user explicitly asks for sub-agents or delegation.
- Tool Availability: Available but not authorized by the tool's usage constraints.
- Work Packets: None.
- Findings: None.
- Primary Reconciliation: Primary agent performed local inspection, implementation, and verification.

## Process Cleanup

- Started Processes:
  - `npm test` in `tests/MissingPets.E2E` - Playwright web servers were managed by the Playwright config.
- Cleanup Result:
  - No long-running process remains from this task.

## Open Risks And Follow-Up

- Live Google Maps provider path should be manually verified with `VITE_GOOGLE_MAPS_BROWSER_API_KEY` configured and Maps JavaScript API, Places, and Geocoding enabled.

