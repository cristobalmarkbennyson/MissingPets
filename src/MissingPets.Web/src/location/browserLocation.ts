import { loadGoogleMapsLibraries } from '../maps/GoogleMapsLoader'
import type { LastSeenPin } from '../maps/mapTypes'

export type BrowserLocationSuccess = LastSeenPin & {
  source: 'browser'
}

export type BrowserLocationFailureCode = 'unsupported' | 'insecure' | 'denied' | 'timeout' | 'unknown'

export type BrowserLocationFailure = {
  ok: false
  code: BrowserLocationFailureCode
  message: string
}

export type BrowserLocationResult =
  | {
      ok: true
      location: BrowserLocationSuccess
      reverseGeocoded: boolean
    }
  | BrowserLocationFailure

function fallbackLabel(lat: number, lng: number) {
  return `Current location near ${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function geolocationFailure(error: GeolocationPositionError): BrowserLocationFailure {
  if (error.code === error.PERMISSION_DENIED) {
    return {
      ok: false,
      code: 'denied',
      message: 'Location permission was denied. Choose manually to keep browsing.',
    }
  }

  if (error.code === error.TIMEOUT) {
    return {
      ok: false,
      code: 'timeout',
      message: 'Location request timed out. Try again or choose manually.',
    }
  }

  return {
    ok: false,
    code: 'unknown',
    message: 'Could not read your location. Try again or choose manually.',
  }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject: (error: GeolocationPositionError) => void) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 5 * 60 * 1000,
      timeout: 20000,
    })
  })
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const maps = await loadGoogleMapsLibraries()
  if (maps.status !== 'loaded') return null

  const geocoder = new maps.libraries.geocoding.Geocoder()

  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]?.formatted_address) {
        resolve(results[0].formatted_address)
        return
      }

      resolve(null)
    })
  })
}

export async function requestBrowserLocation(): Promise<BrowserLocationResult> {
  if (!navigator.geolocation) {
    return {
      ok: false,
      code: 'unsupported',
      message: 'Browser geolocation is unsupported. Choose manually to keep browsing.',
    }
  }

  if (window.isSecureContext === false) {
    return {
      ok: false,
      code: 'insecure',
      message: 'Browser location requires localhost, 127.0.0.1, or HTTPS. Open the app from a secure local address or choose manually.',
    }
  }

  try {
    const position = await getCurrentPosition()
    const lat = position.coords.latitude
    const lng = position.coords.longitude
    let label = fallbackLabel(lat, lng)
    let reverseGeocoded = false

    try {
      const geocodedLabel = await reverseGeocode(lat, lng)
      if (geocodedLabel) {
        label = geocodedLabel
        reverseGeocoded = true
      }
    } catch {
      reverseGeocoded = false
    }

    return {
      ok: true,
      location: { label, lat, lng, source: 'browser' },
      reverseGeocoded,
    }
  } catch (error) {
    return geolocationFailure(error as GeolocationPositionError)
  }
}
