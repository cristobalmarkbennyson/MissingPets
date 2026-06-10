# Run Whole System - Plan

- Initiative Slug: `2026-06-10-run-whole-system`
- Artifact: `Plan`
- Status: `Approved`
- Related Artifacts:
  - `2026-06-09-missing-pets-location-forum.reqs.md`
  - `2026-06-09-missing-pets-location-forum.ux.md`
  - `2026-06-09-missing-pets-location-forum.architecture.md`
  - `2026-06-09-missing-pets-location-forum.plan.md`
  - `2026-06-09-missing-pets-location-forum.impl.md`
- Last Updated: `2026-06-10`

## Current Understanding

The missing-pets location forum implementation is complete. This plan defines how to run the whole local system end to end from the existing workspace:

- workspace-local PostgreSQL/PostGIS on port `55432`
- ASP.NET Core API on `http://127.0.0.1:5087`
- React/Vite web app on `http://127.0.0.1:5173`
- backend NUnit tests and Playwright browser verification

Native mobile apps, production deployment, real Google Maps key provisioning, and cloud object storage provisioning are not part of this local run plan.

## Execution Protocol

- Execute phases strictly in order.
- Do not start the API until PostgreSQL/PostGIS is confirmed running.
- Do not start the web app until the API health endpoint responds.
- Do not run Playwright until the database, API, and web app prerequisites are satisfied.
- If a port is already occupied, identify the owning process before changing ports. Keep API and web ports aligned with `tests/MissingPets.E2E/playwright.config.ts`.
- Leave acceptance criteria unchecked until the command or verification named by the criterion has passed in the current run.
- Record any failed command, port conflict, database startup issue, or browser verification issue before retrying.

## Phase Summary

- `RUN-001` Verify local tooling and repo state before launching services.
- `RUN-002` Start PostgreSQL/PostGIS and apply migrations.
- `RUN-003` Start the API and verify health/API readiness.
- `RUN-004` Start the web app and verify primary routes in a browser.
- `RUN-005` Run automated backend, frontend, and Playwright verification.
- `RUN-006` Shut down manually started services cleanly.

## Phase 1 - Tooling And Workspace Readiness

### Scope

Confirm required tools and dependencies are available before starting services.

### Commands

```powershell
$env:PATH='C:\Program Files\dotnet;C:\Program Files\nodejs;'+$env:PATH
dotnet --version
& 'C:\Program Files\nodejs\node.exe' --version
& 'C:\Program Files\nodejs\npm.cmd' --version
git status --short
```

### Acceptance Criteria

- [x] `AC-RUN-001` .NET SDK and Node/npm are available from the local shell. Traces to `RUN-001`.
- [x] `AC-RUN-002` The workspace has no unexpected uncommitted changes that would affect running, testing, or interpreting results. Traces to `RUN-001`.
- [x] `AC-RUN-003` `src/MissingPets.Web/node_modules` and `tests/MissingPets.E2E/node_modules` are installed or can be restored with `npm install`. Traces to `RUN-001`.

### Verification

- `VER-RUN-001` Tool version commands complete without shell errors. Traces to `AC-RUN-001`.
- `VER-RUN-002` If dependencies are missing, run `npm install` in `src/MissingPets.Web` and `tests/MissingPets.E2E`. Traces to `AC-RUN-003`.

### Stop Conditions

- Stop if .NET SDK 8-compatible tooling is unavailable.
- Stop if Node/npm are unavailable from `C:\Program Files\nodejs`.
- Stop if dependency restore fails.

## Phase 2 - Database Runtime And Migrations

### Scope

Start the workspace-local PostgreSQL/PostGIS runtime and apply Entity Framework migrations to the `missingpets` database.

### Commands

```powershell
$pg=(Resolve-Path '.local\postgresql17').Path
& (Join-Path $pg 'bin\pg_ctl.exe') -D .local\pgdata -o "-p 55432" -l .local\postgres.log start
dotnet tool restore
dotnet dotnet-ef database update --project src\MissingPets.Api\MissingPets.Api.csproj --startup-project src\MissingPets.Api\MissingPets.Api.csproj
```

### Acceptance Criteria

- [x] `AC-RUN-004` PostgreSQL/PostGIS starts from `.local/postgresql17` using data directory `.local/pgdata` and port `55432`. Traces to `RUN-002`.
- [x] `AC-RUN-005` EF migrations apply successfully against `Host=localhost;Port=55432;Database=missingpets;Username=postgres`. Traces to `RUN-002`.

### Verification

- `VER-RUN-003` `pg_ctl.exe` reports the server started or is already running. Traces to `AC-RUN-004`.
- `VER-RUN-004` `dotnet dotnet-ef database update` exits successfully. Traces to `AC-RUN-005`.

### Stop Conditions

- Stop if `.local/postgresql17` or `.local/pgdata` is missing.
- Stop if port `55432` is already bound by an unrelated process.
- Stop if PostGIS extension support is unavailable.

## Phase 3 - API Runtime

### Scope

Run the ASP.NET Core API using local development configuration and verify health.

### Commands

```powershell
$env:PATH='C:\Program Files\dotnet;'+$env:PATH
$env:ASPNETCORE_ENVIRONMENT='Development'
dotnet run --project src\MissingPets.Api\MissingPets.Api.csproj --no-launch-profile --urls http://127.0.0.1:5087
```

Open a second shell for the health check:

```powershell
Invoke-WebRequest http://127.0.0.1:5087/health
```

### Acceptance Criteria

- [x] `AC-RUN-006` API starts on `http://127.0.0.1:5087` without database connection errors. Traces to `RUN-003`.
- [x] `AC-RUN-007` `GET /health` responds successfully. Traces to `RUN-003`.

### Verification

- `VER-RUN-005` API console logs show it is listening on `http://127.0.0.1:5087`. Traces to `AC-RUN-006`.
- `VER-RUN-006` `Invoke-WebRequest http://127.0.0.1:5087/health` returns an HTTP success response. Traces to `AC-RUN-007`.

### Stop Conditions

- Stop if the database is not running.
- Stop if port `5087` is occupied by an unrelated process.
- Stop if the API cannot read `ConnectionStrings__MissingPetsDb` or `appsettings.json`.

## Phase 4 - Web Runtime

### Scope

Run the Vite app and verify the primary browser routes backed by the local API.

### Commands

```powershell
$env:PATH='C:\Program Files\nodejs;'+$env:PATH
$env:VITE_API_BASE_URL='http://127.0.0.1:5087'
Set-Location src\MissingPets.Web
& 'C:\Program Files\nodejs\npm.cmd' run dev -- --host 127.0.0.1 --port 5173
```

### Acceptance Criteria

- [x] `AC-RUN-008` Vite starts on `http://127.0.0.1:5173`. Traces to `RUN-004`, `UX-001`.
- [x] `AC-RUN-009` Browser route `/` renders the nearby feed and location controls. Traces to `RUN-004`, `UX-001`, `UX-002`, `UX-003`.
- [x] `AC-RUN-010` Browser route `/posts/new` renders the create-post flow. Traces to `RUN-004`, `UX-004`, `UX-005`.
- [x] `AC-RUN-011` Browser route `/posts/{postId}` and `/posts/{postId}/manage?token=...` can be verified after a post exists. Traces to `RUN-004`, `UX-006`, `UX-007`, `UX-008`, `UX-009`, `UX-010`.

### Verification

- `VER-RUN-007` Open `http://127.0.0.1:5173/` and confirm feed UI loads without console-level API failures. Traces to `AC-RUN-008`, `AC-RUN-009`.
- `VER-RUN-008` Open `http://127.0.0.1:5173/posts/new` and confirm the create form, photo controls, and map pin mock load. Traces to `AC-RUN-010`.
- `VER-RUN-009` Create or use an existing post, then verify detail and management routes. Traces to `AC-RUN-011`.

### Stop Conditions

- Stop if API health is not passing.
- Stop if port `5173` is occupied by an unrelated process.
- Stop if the web app points to a different API base URL than `http://127.0.0.1:5087`.

## Phase 5 - Automated Verification

### Scope

Run the full test and build sequence that proves the local system works across backend, frontend, and browser layers.

### Commands

```powershell
$env:PATH='C:\Program Files\dotnet;'+$env:PATH
dotnet test MissingPets.sln
```

```powershell
$env:PATH='C:\Program Files\nodejs;'+$env:PATH
Set-Location src\MissingPets.Web
& 'C:\Program Files\nodejs\npm.cmd' run build
```

```powershell
$env:PATH='C:\Program Files\nodejs;'+$env:PATH
Set-Location tests\MissingPets.E2E
& 'C:\Program Files\nodejs\npx.cmd' playwright install chromium
& 'C:\Program Files\nodejs\npm.cmd' test
```

### Acceptance Criteria

- [x] `AC-RUN-012` Backend NUnit unit and integration tests pass. Traces to `RUN-005`, `TEST-001`, `TEST-002`.
- [x] `AC-RUN-013` Frontend TypeScript/Vite build passes. Traces to `RUN-005`.
- [x] `AC-RUN-014` Playwright tests pass against the local API and Vite app. Traces to `RUN-005`, `TEST-003`, `UX-001` through `UX-010`.

### Verification

- `VER-RUN-010` `dotnet test MissingPets.sln` exits successfully. Traces to `AC-RUN-012`.
- `VER-RUN-011` `npm run build` in `src/MissingPets.Web` exits successfully. Traces to `AC-RUN-013`.
- `VER-RUN-012` `npm test` in `tests/MissingPets.E2E` exits successfully. Traces to `AC-RUN-014`.

### Stop Conditions

- Stop if PostGIS is stopped before backend or Playwright tests.
- Stop if Playwright cannot start API or web because ports `5087` or `5173` are occupied by unrelated processes.
- Stop if tests fail in a way that could hide a real runtime defect.

## Phase 6 - Cleanup

### Scope

Stop manually started runtime processes and leave the workspace in a known state.

### Commands

Stop API and Vite with `Ctrl+C` in their shells. Then stop PostgreSQL/PostGIS:

```powershell
$pg=(Resolve-Path '.local\postgresql17').Path
& (Join-Path $pg 'bin\pg_ctl.exe') -D .local\pgdata stop
```

Optional port check:

```powershell
Get-NetTCPConnection -LocalPort 5087,5173,55432 -ErrorAction SilentlyContinue
```

### Acceptance Criteria

- [x] `AC-RUN-015` API and Vite dev server processes are stopped when no longer needed. Traces to `RUN-006`.
- [x] `AC-RUN-016` PostgreSQL/PostGIS is stopped if this was only a temporary local run. Traces to `RUN-006`.
- [x] `AC-RUN-017` Ports `5087`, `5173`, and `55432` are either clear or intentionally still owned by known local services. Traces to `RUN-006`.

### Verification

- `VER-RUN-013` `pg_ctl.exe stop` completes or reports no running server. Traces to `AC-RUN-016`.
- `VER-RUN-014` Port check shows no unexpected listeners. Traces to `AC-RUN-017`.

### Stop Conditions

- Stop and identify the owning process if a port remains bound unexpectedly.
- Do not terminate unrelated processes without confirming ownership.

## Open Questions

- `Q-RUN-001` Should this local run plan become the canonical README runbook, or remain a separate exec-plan artifact?
- `Q-RUN-002` Should a future implementation plan add one-command startup scripts for database, API, web, smoke checks, and cleanup?
- `Q-RUN-003` Should the local database be reset between Playwright runs, or is accumulating local test data acceptable for this workspace?

## Mini-Model Readiness Audit

- `AUD-RUN-001` Concrete repo touchpoints are named: `src/MissingPets.Api`, `src/MissingPets.Web`, `tests/MissingPets.E2E`, `.local/postgresql17`, `.local/pgdata`.
- `AUD-RUN-002` Required ports are named: `55432`, `5087`, and `5173`.
- `AUD-RUN-003` Commands are concrete PowerShell commands suitable for the current Windows workspace.
- `AUD-RUN-004` Verification steps identify exact commands and expected evidence.
- `AUD-RUN-005` Remaining open questions are operational improvements, not blockers for running the current system.
