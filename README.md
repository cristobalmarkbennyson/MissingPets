# MissingPets

MissingPets is a web-first missing-pet forum planned around location-aware nearby posts, anonymous posting, pet photos, comments, simple post-attached messaging, and Google Maps last-seen pinning.

The current implementation has completed Phase 1 scaffold and Phase 2 database/domain foundation. Later phases add APIs, UX surfaces, Google Maps, photo storage, and full verification.

## Project Layout

- `src/MissingPets.Web/` - React/Vite/TypeScript frontend.
- `src/MissingPets.Api/` - ASP.NET Core Web API.
- `src/MissingPets.Api.Tests/` - NUnit backend smoke/unit/integration test project.
- `tests/MissingPets.E2E/` - Playwright E2E test project.
- `docs/exec-plans/active/` - approved planning artifacts and prototype.

## Required Tooling

- .NET SDK 8.0 or compatible.
- Node.js LTS with npm.
- PostgreSQL with PostGIS is required for Phase 2 and later database verification.

## Environment Variables

The scaffold includes placeholders for:

- `ConnectionStrings__MissingPetsDb`
- `GoogleMaps__BrowserApiKey`
- `Storage__Provider`
- `Storage__ConnectionString`
- `Storage__PhotoContainer`
- `Cors__AllowedOrigins`
- `Moderation__RateLimitPolicy`

Local defaults are documented in `src/MissingPets.Api/appsettings.json`. The current local development connection targets the workspace-local PostgreSQL/PostGIS runtime on port `55432`:

```text
Host=localhost;Port=55432;Database=missingpets;Username=postgres
```

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
dotnet run --project src\MissingPets.Api\MissingPets.Api.csproj
```

Health endpoint:

```text
GET http://localhost:5000/health
```

## Run The Web App

```powershell
$env:PATH='C:\Program Files\nodejs;'+$env:PATH
cd src\MissingPets.Web
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

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
& 'C:\Program Files\nodejs\npm.cmd' test
```

## Prototype

The approved single-file prototype is available at:

```text
docs/exec-plans/active/2026-06-09-missing-pets-location-forum.prototype.html
```
