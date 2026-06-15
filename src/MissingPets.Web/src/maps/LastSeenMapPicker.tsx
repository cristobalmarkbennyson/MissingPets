import { useEffect, useRef, useState } from 'react'
import { googleMapsFallbackMessage, loadGoogleMapsLibraries } from './GoogleMapsLoader'
import type { LastSeenPin } from './mapTypes'

type LoadState = 'idle' | 'loading' | 'loaded' | 'fallback' | 'error'

type LastSeenMapPickerProps = {
  value: LastSeenPin
  defaultCenter: LastSeenPin
  confirmed: boolean
  providerUnavailable: boolean
  fallbackPlaces: Record<string, LastSeenPin>
  onDraftChange: (pin: LastSeenPin) => void
  onConfirm: (pin: LastSeenPin) => void
  onToggleProviderUnavailable: () => void
}

function labelForCoordinates(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function resolveFallbackPlace(label: string, places: Record<string, LastSeenPin>) {
  const normalized = label.toLowerCase()
  const key = Object.keys(places).find((place) => normalized.includes(place))
  return key ? places[key] : undefined
}

function draftPin(pin: LastSeenPin, label = pin.label): LastSeenPin {
  return { label, lat: pin.lat, lng: pin.lng, source: 'map' }
}

export function LastSeenMapPicker(props: LastSeenMapPickerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [searchText, setSearchText] = useState(props.value.label)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setSearchText(props.value.label)
  }, [props.value.label])

  useEffect(() => {
    if (props.providerUnavailable) {
      setLoadState('error')
      setMessage('Map provider unavailable. Place search can be retried.')
      return
    }

    let isCancelled = false
    setLoadState('loading')
    setMessage('Loading Google Maps...')

    loadGoogleMapsLibraries()
      .then((result) => {
        if (isCancelled) return

        if (result.status === 'unconfigured') {
          setLoadState('fallback')
          setMessage(result.message)
          return
        }

        if (!mapElementRef.current || !searchInputRef.current) return

        const position = { lat: props.value.lat, lng: props.value.lng }
        const map = new result.libraries.maps.Map(mapElementRef.current, {
          center: position,
          zoom: 15,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
        })
        const marker = new google.maps.Marker({
          map,
          position,
          draggable: true,
          title: 'Last-seen pin',
        })
        const geocoder = new result.libraries.geocoding.Geocoder()
        const autocomplete = new result.libraries.places.Autocomplete(searchInputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
        })

        mapRef.current = map
        markerRef.current = marker
        geocoderRef.current = geocoder

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          const latLng = event.latLng
          if (!latLng) return
          updateFromCoordinates(latLng.lat(), latLng.lng(), geocoder)
        })

        marker.addListener('dragend', () => {
          const latLng = marker.getPosition()
          if (!latLng) return
          updateFromCoordinates(latLng.lat(), latLng.lng(), geocoder)
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const location = place.geometry?.location
          if (!location) {
            setMessage('No place results found. Try a more specific address or move the pin on the map.')
            return
          }

          const nextPin = draftPin({
            label: place.formatted_address || place.name || labelForCoordinates(location.lat(), location.lng()),
            lat: location.lat(),
            lng: location.lng(),
            source: 'map',
          })
          marker.setPosition({ lat: nextPin.lat, lng: nextPin.lng })
          map.panTo({ lat: nextPin.lat, lng: nextPin.lng })
          props.onDraftChange(nextPin)
          setMessage('Pin moved from place search. Confirm this last-seen location before publishing.')
        })

        setLoadState('loaded')
        setMessage('Search for a place, click the map, or drag the pin.')
      })
      .catch((error: Error) => {
        if (isCancelled) return
        setLoadState('error')
        setMessage(error.message || 'Google Maps could not be loaded. Use local fallback or retry.')
      })

    return () => {
      isCancelled = true
    }
  }, [props.providerUnavailable])

  useEffect(() => {
    const position = { lat: props.value.lat, lng: props.value.lng }
    markerRef.current?.setPosition(position)
    mapRef.current?.panTo(position)
  }, [props.value.lat, props.value.lng])

  function updateFromCoordinates(lat: number, lng: number, geocoder: google.maps.Geocoder) {
    const fallbackLabel = labelForCoordinates(lat, lng)
    markerRef.current?.setPosition({ lat, lng })
    mapRef.current?.panTo({ lat, lng })
    props.onDraftChange({ label: fallbackLabel, lat, lng, source: 'map' })
    setMessage('Resolving address for the moved pin...')

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const label = status === 'OK' && results?.[0]?.formatted_address ? results[0].formatted_address : fallbackLabel
      props.onDraftChange({ label, lat, lng, source: 'map' })
      setMessage(status === 'OK' ? 'Pin moved. Confirm this last-seen location before publishing.' : 'Pin moved. Address lookup failed, so coordinates will be used as the label.')
    })
  }

  function searchFallbackPlace() {
    const match = resolveFallbackPlace(searchText, props.fallbackPlaces)
    if (!match) {
      setLoadState(props.providerUnavailable ? 'error' : 'fallback')
      setMessage('No local fallback result found. Try Makati, BGC, or Quezon City.')
      return
    }

    props.onDraftChange(draftPin(match))
    setLoadState(props.providerUnavailable ? 'error' : 'fallback')
    setMessage('Local fallback pin selected. Confirm this last-seen location before publishing.')
  }

  function resetPin() {
    props.onDraftChange(draftPin(props.defaultCenter))
    setMessage('Pin reset to the current search area. Confirm it only if this is the last-seen location.')
  }

  const isFallbackMode = loadState === 'fallback' || loadState === 'error'

  return (
    <section className="map-picker" aria-label="Google Maps last-seen pin picker">
      <div className="card-head">
        <h2>Last-seen pin</h2>
        <button className="ghost" type="button" onClick={props.onToggleProviderUnavailable}>
          {props.providerUnavailable ? 'Show map' : 'Show map error'}
        </button>
      </div>
      <label>
        <span>Place search</span>
        <input ref={searchInputRef} value={searchText} onChange={(event) => setSearchText(event.target.value)} />
      </label>
      {isFallbackMode && (
        <div className="row-actions">
          <button className="secondary" type="button" onClick={searchFallbackPlace}>
            Search local fallback
          </button>
          <button className="ghost" type="button" onClick={resetPin}>
            Reset pin
          </button>
        </div>
      )}
      <div className={`google-map ${isFallbackMode ? 'local-fallback' : ''}`} ref={mapElementRef} aria-label="Last-seen map">
        {isFallbackMode && (
          <>
            <span className="pin" />
            <span className="map-label">{props.value.lat.toFixed(2)}, {props.value.lng.toFixed(2)}</span>
          </>
        )}
      </div>
      {message && <div className={loadState === 'loaded' || props.confirmed ? 'success-box' : 'map-error'}>{message || googleMapsFallbackMessage()}</div>}
      <div className={props.confirmed ? 'success-box' : 'map-error'}>
        {props.confirmed ? `Confirmed last-seen location: ${props.value.label}.` : `Selected pin: ${props.value.label}. Confirm this pin before publishing.`}
      </div>
      <p>Exact coordinates are saved for search. Public display uses an approximate area.</p>
      <div className="row-actions end stack-mobile">
        <button className="secondary" type="button" onClick={resetPin}>
          Reset pin
        </button>
        <button type="button" onClick={() => props.onConfirm(draftPin(props.value))}>
          Confirm last-seen location
        </button>
      </div>
    </section>
  )
}
