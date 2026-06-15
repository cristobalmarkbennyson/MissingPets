# MissingPets

MissingPets is a web-first missing-pet forum with location-aware nearby posts, anonymous posting, pet photos, comments, simple post-attached messaging, abuse reports, anonymous management links, and Google Maps-style last-seen pinning.

The current implementation includes the ASP.NET Core API, PostgreSQL/PostGIS persistence, local photo-storage display, React/Vite web UX, and Playwright end-to-end coverage. Native mobile apps remain future scope.

## Project Layout

- `src/MissingPets.Web/` - React/Vite/TypeScript frontend.
- `src/MissingPets.Api/` - ASP.NET Core Web API.
- `src/MissingPets.Api.Tests/` - NUnit backend smoke/unit/integration test project.
- `tests/MissingPets.E2E/` - Playwright E2E test project.
- `docs/exec-plans/active/` - approved planning artifacts and prototype.

## Required Tooling

- .NET SDK 8.0 or compatible.
- Node.js LTS with npm.
- PostgreSQL with PostGIS.
- Playwright Chromium for browser verification.

## Environment Variables

The app reads these configuration keys:

- `ConnectionStrings__MissingPetsDb`
- `GoogleMaps__BrowserApiKey`
- `VITE_GOOGLE_MAPS_BROWSER_API_KEY`
- `Storage__Provider`
- `Storage__ConnectionString`
- `Storage__PhotoContainer`
- `Cors__AllowedOrigins`
- `Moderation__RateLimitPolicy`

Local defaults are documented in `src/MissingPets.Api/appsettings.json`. The current local development connection targets the workspace-local PostgreSQL/PostGIS runtime on port `55432`:

```text
Host=localhost;Port=55432;Database=missingpets;Username=postgres
```

Google Maps backend/server configuration is represented by `GoogleMaps__BrowserApiKey`. The React/Vite browser bundle reads `VITE_GOOGLE_MAPS_BROWSER_API_KEY` for the Maps JavaScript API. Do not commit real API key values.

When `VITE_GOOGLE_MAPS_BROWSER_API_KEY` is empty, the web app uses local map fallback mode so development and Playwright tests can run without a paid Maps key. Production real map pinning requires `VITE_GOOGLE_MAPS_BROWSER_API_KEY` with Maps JavaScript API, Places, and Geocoding enabled for the Google Cloud project.

Photo storage is configured through the `Storage__*` keys. Local development uses `Storage__Provider=Local` and serves deterministic local display images from `/local-photos/{uploadId}` after upload metadata is accepted.

## Local PostgreSQL/PostGIS Runtime

During Phase 2 execution, PostgreSQL 17 was installed and a workspace-local copy was created at `.local/postgresql17` with the OSGeo PostGIS 3.6 bundle overlaid. The `.local/` directory is ignored by git.

Start the local database:

```powershell
$pg=(Resolve-Path '.local\postgresql17').Path
& (Join-Path $pg 'bin\pg_ctl.exe') -D .local\pgdata -o "-p 55432" -l .local\postgres.log start
```

Stop it:

```powershell
$pg=(Resolve-Path '.local\postgresql17').Path
& (Join-Path $pg 'bin\pg_ctl.exe') -D .local\pgdata stop
```

## Run The API

```powershell
$env:PATH='C:\Program Files\dotnet;C:\Program Files\nodejs;'+$env:PATH
dotnet run --project src\MissingPets.Api\MissingPets.Api.csproj --no-launch-profile --urls http://127.0.0.1:5087
```

Health endpoint:

```text
GET http://127.0.0.1:5087/health
```

## Run The Web App

```powershell
$env:PATH='C:\Program Files\nodejs;'+$env:PATH
cd src\MissingPets.Web
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

The frontend defaults to `http://127.0.0.1:5087` for the API. Override it with `VITE_API_BASE_URL` when needed:

```powershell
$env:VITE_API_BASE_URL='http://127.0.0.1:5087'
$env:VITE_GOOGLE_MAPS_BROWSER_API_KEY='<browser-safe-google-maps-key>'
& 'C:\Program Files\nodejs\npm.cmd' run dev -- --host 127.0.0.1 --port 5173
```

Primary web routes:

- `/` - nearby feed with location prompt and filters.
- `/posts/new` - anonymous create-post flow with photo upload and last-seen map pin fallback when no browser Maps key is configured.
- `/posts/{postId}` - public post detail, comments, messaging, and report actions.
- `/posts/{postId}/manage?token=...` - private anonymous management link.

## Run Tests

Backend:

```powershell
$env:PATH='C:\Program Files\dotnet;'+$env:PATH
dotnet test MissingPets.sln
```

Frontend build:

```powershell
$env:PATH='C:\Program Files\nodejs;'+$env:PATH
cd src\MissingPets.Web
& 'C:\Program Files\nodejs\npm.cmd' run build
```

Playwright smoke:

```powershell
$env:PATH='C:\Program Files\nodejs;'+$env:PATH
cd tests\MissingPets.E2E
& 'C:\Program Files\nodejs\npx.cmd' playwright install chromium
& 'C:\Program Files\nodejs\npm.cmd' test
```

The Playwright config starts the API and Vite dev server automatically. Start the local PostgreSQL/PostGIS runtime before running backend or E2E tests.

## Prototype

The approved single-file prototype is available at:

```text
docs/exec-plans/active/2026-06-09-missing-pets-location-forum.prototype.html
```
