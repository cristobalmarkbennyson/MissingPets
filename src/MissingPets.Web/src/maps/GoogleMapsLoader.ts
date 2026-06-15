import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

export type LoadedGoogleMapsLibraries = {
  maps: google.maps.MapsLibrary
  places: google.maps.PlacesLibrary
  geocoding: google.maps.GeocodingLibrary
}

export type GoogleMapsLoadResult =
  | {
      status: 'unconfigured'
      message: string
    }
  | {
      status: 'loaded'
      libraries: LoadedGoogleMapsLibraries
    }

const browserApiKey = (import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY ?? '').trim()
let optionsConfigured = false
let loadPromise: Promise<GoogleMapsLoadResult> | null = null

export function isGoogleMapsConfigured() {
  return browserApiKey.length > 0
}

export function googleMapsFallbackMessage() {
  return 'Google Maps key is not configured. Local map fallback mode is active for development and tests.'
}

export function loadGoogleMapsLibraries(): Promise<GoogleMapsLoadResult> {
  if (!isGoogleMapsConfigured()) {
    return Promise.resolve({ status: 'unconfigured', message: googleMapsFallbackMessage() })
  }

  if (!loadPromise) {
    if (!optionsConfigured) {
      setOptions({ key: browserApiKey, v: 'weekly' })
      optionsConfigured = true
    }

    loadPromise = Promise.all([
      importLibrary('maps'),
      importLibrary('places'),
      importLibrary('geocoding'),
    ]).then(([maps, places, geocoding]) => ({
      status: 'loaded',
      libraries: { maps, places, geocoding },
    }))
  }

  return loadPromise
}
