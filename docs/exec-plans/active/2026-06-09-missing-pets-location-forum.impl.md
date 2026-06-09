# Missing Pets Location Forum - Implementation

- Initiative Slug: `2026-06-09-missing-pets-location-forum`
- Artifact: `Implementation`
- Status: `Complete`
- Last Updated: `2026-06-09`

## Execution Summary

- Current Phase: `Complete`
- Completed Phases: `Phase 1`, `Phase 2`, `Phase 3`, `Phase 4`, `Phase 5`, `Phase 6`.
- Incomplete Phases: None.
- Major Outcome: Scaffold, database/domain foundation, backend API contracts, React UX surfaces, API-backed frontend integration, and release-readiness verification are implemented and verified.
- Plan Deviations: None. Phase 2 used a workspace-local PostgreSQL/PostGIS runtime because `Program Files` PostGIS installation required elevation.

## Active Phase Lock

- Active Phase: None; all plan phases complete.
- Allowed Acceptance Criteria: None.
- Forbidden Pull-Forward Work: No new features beyond fixing defects found by planned verification.
- Prior Phase Verification Required Before This Phase: Phases 1-5 criteria checked and verification passed.
- Next Phase Unlock Evidence: Not applicable.
- Resume / Compaction Checkpoint:
  - Last plan reread: `2026-06-09`
  - Last implementation artifact reread: `2026-06-09`
  - Last phase guard result: Manual pass. Python/py remain unavailable, so `phase_guard.py` could not run. Manual review identifies no incomplete phase after Phase 6 completion.
- Boundary Decision: Plan complete.

## Phase Ledger

### Phase 1 - Greenfield Solution Scaffold

- Status: Complete.
- Acceptance Criteria: `AC-PLN-001` through `AC-PLN-004` complete.
- Verification: backend build/health, frontend build, NUnit, and Playwright smoke passed.

### Phase 2 - Database And Domain Foundation

- Status: Complete.
- Acceptance Criteria: `AC-PLN-005` through `AC-PLN-010` complete.
- Verification: migrations applied, schema/PostGIS checks passed, validator/token/radius tests passed.

### Phase 3 - Backend API And Storage

- Status: Complete.
- Acceptance Criteria: `AC-PLN-011` through `AC-PLN-018` complete.
- Files Changed: `src/MissingPets.Api/Api/`, `src/MissingPets.Api/Storage/`, `src/MissingPets.Api.Tests/Api/`.
- Verification: `dotnet test MissingPets.sln` passed 12 backend tests, including feed, create, detail, comments, messages, management, reports, invalid payloads, token privacy, and public approximate map data.

### Phase 4 - React UX Surfaces

- Status: Complete.
- Acceptance Criteria: `AC-PLN-019` through `AC-PLN-028` complete.
- Files Changed: `src/MissingPets.Web/src/App.tsx`, `src/MissingPets.Web/src/App.css`, `src/MissingPets.Web/src/index.css`.
- Verification: `npm run build`, `dotnet test MissingPets.sln`, `npm test` smoke passed; desktop/mobile screenshots captured under `docs/exec-plans/active/phase4-*.png`.
- Notes: Fixed `/posts/new` route overlap and mobile detail clipping before checking criteria.

### Phase 5 - Maps, Photos, Privacy, And UX Integration

- Status: Complete.
- Acceptance Criteria: `AC-PLN-029` through `AC-PLN-034` complete.
- Files Changed:
  - `src/MissingPets.Api/Program.cs` - CORS policy and local photo display endpoint.
  - `src/MissingPets.Api/appsettings.json` - local Vite origins for CORS.
  - `src/MissingPets.Web/src/App.tsx` - API-backed feed, create, detail, comments, message, report, management, geolocation/manual location, map pin, upload ticket, and user-visible state wiring.
  - `src/MissingPets.Web/src/App.css` - upload tile, photo image, disabled, and approximate map label styling.
  - `tests/MissingPets.E2E/playwright.config.ts` - backend/frontend web servers.
  - `tests/MissingPets.E2E/tests/phase5-integration.spec.ts` - API-backed browser journey.
- Verification:
  - `dotnet dotnet-ef database update --project src\MissingPets.Api\MissingPets.Api.csproj --startup-project src\MissingPets.Api\MissingPets.Api.csproj` - Pass, database already current.
  - `dotnet test MissingPets.sln` - Pass, 12 backend tests.
  - `npm run build` in `src/MissingPets.Web` - Pass.
  - `npm test` in `tests/MissingPets.E2E` - Pass, 1 Playwright journey.
- Notes:
  - Google Maps remains in approved local mock mode; selected pin coordinates are sent to create-post and persisted by the backend.
  - Public UI displays approximate area/rounded map labels. E2E asserts exact selected pin coordinates are absent from public page text while distance display remains available.
  - Playwright Chromium was installed locally because package restore did not include browser binaries.

### Phase 6 - Full Verification And Release Readiness

- Status: Complete.
- Acceptance Criteria: `AC-PLN-035` through `AC-PLN-040` complete.
- Files Changed:
  - `README.md` - current local setup, Google Maps mock/key, storage, API, frontend, routes, and test commands.
  - `src/MissingPets.Api.Tests/Api/MissingPetsApiIntegrationTests.cs` - invalid-radius API contract coverage.
  - `tests/MissingPets.E2E/playwright.config.ts` - serial E2E workers for shared local DB stability.
  - `tests/MissingPets.E2E/tests/phase5-integration.spec.ts` - filter coverage and stable repeated-run assertion.
  - `tests/MissingPets.E2E/tests/phase6-browser-evidence.spec.ts` - desktop/mobile screenshot evidence journey.
  - `docs/exec-plans/active/phase6-*.png` - browser evidence screenshots.
- Verification:
  - `dotnet test MissingPets.sln` - Pass, 13 backend tests.
  - `npm run build` in `src/MissingPets.Web` - Pass.
  - `npm test` in `tests/MissingPets.E2E` - Pass, 2 Playwright tests.
- Browser Evidence:
  - `phase6-feed-location-desktop.png`
  - `phase6-create-empty-desktop.png`
  - `phase6-detail-desktop.png`
  - `phase6-message-modal-desktop.png`
  - `phase6-report-modal-desktop.png`
  - `phase6-management-desktop.png`
  - `phase6-feed-mobile.png`
  - `phase6-create-mobile.png`
  - `phase6-detail-mobile.png`
  - `phase6-message-modal-mobile.png`

## Mini-Model Execution Audit Results

- Phase: `Phase 6`
- Result: Executable Without Significant Inference.
- Missing Or Ambiguous Detail: None identified.
- Resolution: Phase 6 verified existing coverage, added narrow radius/filter/screenshot evidence where gaps were found, and updated docs.
- Affected Acceptance Criteria: `AC-PLN-035` through `AC-PLN-040`.

## Implementation Decisions

- `DEC-IMPL-001` Sub-agents were not spawned. Rationale: the available multi-agent tool requires explicit user authorization to spawn.
- `DEC-IMPL-002` Use `npm.cmd` in PowerShell commands because PowerShell execution policy blocks `npm.ps1`.
- `DEC-IMPL-003` Use a workspace-local PostgreSQL/PostGIS runtime at `.local/postgresql17` and port `55432` for verification.
- `DEC-IMPL-004` Serve deterministic local SVG photo placeholders from `/local-photos/{uploadId}` so local upload tickets have browser-visible display URLs without changing the storage abstraction.
- `DEC-IMPL-005` Preserve freshly issued management tokens in React state across internal navigation unless a new query-string token overrides them.

## Change Map

### Product Code

- `src/MissingPets.Api/` - API, data, domain, storage, local photo display, CORS.
- `src/MissingPets.Web/src/` - React UX surfaces, API integration, styling.

### Tests

- `src/MissingPets.Api.Tests/` - Unit, integration, and API contract tests.
- `tests/MissingPets.E2E/` - Playwright API-backed Phase 5 journey.
- `docs/exec-plans/active/phase6-*.png` - final desktop/mobile browser evidence.

### Data, Config, Scripts, Or Docs

- `.config/dotnet-tools.json` - Local `dotnet-ef`.
- `.gitignore` - Local runtime/download/build ignores.
- `README.md` - Tooling and local PostgreSQL/PostGIS runtime notes.
- `docs/exec-plans/active/2026-06-09-missing-pets-location-forum.plan.md` - Phases 1-5 checked.
- `docs/exec-plans/active/2026-06-09-missing-pets-location-forum.impl.md` - This evidence.

## Regression And Contract Log

- `REG-001` Initial API health smoke did not respond on expected port. Fixed by using `--no-launch-profile --urls http://localhost:5087`.
- `REG-002` EF projection used C# range syntax that expression trees cannot translate. Fixed with `Substring`.
- `REG-003` `/posts/new` also rendered detail content. Fixed by excluding `/posts/new` from detail-route matching.
- `REG-004` Mobile detail text clipped at viewport edge. Fixed with viewport containment and mobile layout adjustments.
- `REG-005` `dotnet test MissingPets.sln` failed when PostGIS on `localhost:55432` was stopped. Restarted workspace-local PostGIS and reran successfully.
- `REG-006` Playwright failed because Chromium binaries were missing after package restore. Ran `npx playwright install chromium` and reran successfully.
- `REG-007` Playwright exposed a management-token navigation regression after create. Internal navigation cleared the in-memory token on URLs without a `token` query; fixed by preserving the existing token unless a new query token is present.
- `REG-008` Full Playwright failed once because a manually started API probe was still listening on `127.0.0.1:5087`. Stopped the listener and reran.
- `REG-009` Full Playwright then exposed a repeated-run test isolation issue: previous local data created multiple `Phase Five Luna` feed cards. Set E2E workers to `1` and scoped the repeated-run assertion to the first matching card. No app behavior changed.

## Verification Evidence

- `VER-PLN-001` Phase 1 backend build and health smoke - Pass.
- `VER-PLN-002` Phase 1 frontend build - Pass.
- `VER-PLN-003` Phase 1 NUnit and Playwright smoke - Pass.
- `VER-PLN-004` Phase 2 migration apply - Pass.
- `VER-PLN-005` Phase 2 validator/token unit tests - Pass.
- `VER-PLN-006` Phase 2 PostGIS radius integration tests - Pass.
- `VER-PLN-007` Phase 3 API integration tests - Pass.
- `VER-PLN-008` Phase 3 token hash/private coordinate exposure checks - Pass through API tests.
- `VER-PLN-009` Phase 3 invalid payload checks - Pass through API tests.
- `VER-PLN-010` Phase 4 frontend build - Pass.
- `VER-PLN-011` Phase 4 desktop/mobile browser screenshots - Pass after fixes.
- `VER-PLN-012` Phase 4 UX surface boundary review - Pass after `/posts/new` route fix.
- `VER-PLN-013` Phase 5 frontend-produced API payload coverage - Pass through Playwright create, comment, message, report, and management calls plus backend API tests.
- `VER-PLN-014` Phase 5 browser checks - Pass through `npm test` in `tests/MissingPets.E2E`.
- `VER-PLN-015` Phase 5 public coordinate privacy - Pass through backend API tests and Playwright assertions.
- `VER-PLN-016` Phase 6 full backend unit and integration suite - Pass, `dotnet test MissingPets.sln`, 13 tests.
- `VER-PLN-017` Phase 6 full Playwright suite - Pass, `npm test` in `tests/MissingPets.E2E`, 2 tests.
- `VER-PLN-018` Phase 6 desktop/mobile browser evidence - Pass, screenshots captured under `docs/exec-plans/active/phase6-*.png` and representative mobile captures visually reviewed.
- `VER-PLN-019` Phase 6 documentation and implementation evidence review - Pass, `README.md` and this evidence updated.

## Sub-Agent Coordination And Findings

- Suitability Decision: Wanted but unavailable under current user authorization.
- Rationale: Phase 6 was broad enough that review sub-agents would have helped, but the multi-agent tool requires explicit user authorization.
- Tool Availability: Available but not usable without explicit user request.
- Work Packets: None.
- Findings: None.
- Primary Reconciliation: Proceeded locally and recorded the limitation.

## Process Cleanup

- Started Processes:
  - Workspace-local PostgreSQL/PostGIS on port `55432`.
  - Playwright-managed ASP.NET API server on `127.0.0.1:5087`.
  - Playwright-managed Vite dev server on `127.0.0.1:5173`.
  - Manual API probe on `127.0.0.1:5087`, stopped after conflict isolation.
- Cleanup Result:
  - Playwright-managed API and Vite servers stopped after test completion.
  - Workspace-local PostgreSQL/PostGIS server stopped with `pg_ctl`.
  - .NET build servers shut down.
  - Ports `5087` and `5173` are clear.

## Open Risks And Follow-Up

- No plan criteria remain unchecked.
- Google Maps remains local mock mode unless `GoogleMaps__BrowserApiKey` is configured for production.
- Local test database contains repeated E2E posts from repeated verification runs; this is acceptable for local dev but can be reset by recreating the database.
