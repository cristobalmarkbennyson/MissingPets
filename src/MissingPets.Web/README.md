# MissingPets Web

React/Vite frontend for the MissingPets web app.

## Configuration

- `VITE_API_BASE_URL` sets the ASP.NET Core API base URL. It defaults to `http://127.0.0.1:5087`.
- `VITE_GOOGLE_MAPS_BROWSER_API_KEY` enables the Google Maps JavaScript API in the browser bundle.

Do not commit real Google Maps API keys. Production real map pinning requires a browser-safe Google Maps key with Maps JavaScript API, Places, and Geocoding enabled.

When `VITE_GOOGLE_MAPS_BROWSER_API_KEY` is empty, the app runs in local map fallback mode for development and Playwright tests.

## Local Development

```powershell
$env:VITE_API_BASE_URL='http://127.0.0.1:5087'
$env:VITE_GOOGLE_MAPS_BROWSER_API_KEY='<browser-safe-google-maps-key>'
& 'C:\Program Files\nodejs\npm.cmd' run dev -- --host 127.0.0.1 --port 5173
```

Omit `VITE_GOOGLE_MAPS_BROWSER_API_KEY` to use local fallback mode.

## Commands

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
& 'C:\Program Files\nodejs\npm.cmd' run lint
```
