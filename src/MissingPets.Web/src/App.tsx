import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import './App.css'
import { LastSeenMapPicker } from './maps/LastSeenMapPicker'
import type { LastSeenPin } from './maps/mapTypes'
import { requestBrowserLocation } from './location/browserLocation'

type PetStatus = 'Missing' | 'Found'
type ModalState = 'message' | 'report' | null
type LoadState = 'idle' | 'loading' | 'error'

type LocationState = LastSeenPin

type FeedPost = {
  id: string
  petName: string
  petType: string
  status: PetStatus
  approximateArea: string
  distanceKm: number
  createdAt: string
  primaryPhotoUrl?: string
  definingFeatureSummary: string
}

type PostDetail = {
  id: string
  petName: string
  petType: string
  accessories?: string
  definingFeatures: string
  status: PetStatus
  approximateArea: string
  approximateMap: { lat: number; lng: number }
  distanceKm?: number
  createdAt: string
  photos: { id: string; displayUrl: string; sortOrder: number }[]
}

type CommentDto = {
  id: string
  body: string
  anonymousDisplayName: string
  createdAt: string
}

type DraftPhoto = {
  id: string
  file: File
  fileName: string
  contentType: string
  sizeBytes: number
  previewUrl: string
}

const maxPhotoCount = 6
const maxPhotoSizeBytes = 8 * 1024 * 1024
const acceptedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
const acceptedPhotoExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'])

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5087').replace(/\/$/, '')
const defaultLocation: LocationState = { label: 'Makati, Metro Manila', lat: 14.5653, lng: 121.0318, source: 'default' }
const manualPlaces: Record<string, LocationState> = {
  makati: { label: 'Makati, Metro Manila', lat: 14.5653, lng: 121.0318, source: 'manual' },
  bgc: { label: 'BGC, Taguig', lat: 14.5503, lng: 121.0503, source: 'manual' },
  quezon: { label: 'Quezon City', lat: 14.676, lng: 121.0437, source: 'manual' },
}

function apiUrl(path: string) {
  return `${apiBase}${path}`
}

function photoUrl(url?: string) {
  if (!url) return undefined
  return url.startsWith('http') ? url : apiUrl(url)
}

function createDraftPhotoId() {
  return globalThis.crypto?.randomUUID?.() ?? `photo_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : ''
}

function contentTypeForPhoto(file: File) {
  if (file.type) return file.type
  const extension = getFileExtension(file.name)
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.gif') return 'image/gif'
  if (extension === '.heic') return 'image/heic'
  if (extension === '.heif') return 'image/heif'
  return ''
}

function isAcceptedPhoto(file: File) {
  const contentType = contentTypeForPhoto(file)
  return acceptedPhotoTypes.has(contentType) || acceptedPhotoExtensions.has(getFileExtension(file.name))
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

function getPath() {
  return window.location.pathname
}

function getQueryToken() {
  return new URLSearchParams(window.location.search).get('token') ?? ''
}

function App() {
  const [path, setPath] = useState(getPath())
  const [locationModalOpen, setLocationModalOpen] = useState(() => path === '/')
  const [location, setLocation] = useState<LocationState>(defaultLocation)
  const [manualLocation, setManualLocation] = useState(defaultLocation.label)
  const [permissionState, setPermissionState] = useState('Awaiting permission')
  const [radius, setRadius] = useState(10)
  const [typeFilter, setTypeFilter] = useState('Any')
  const [statusFilter, setStatusFilter] = useState<PetStatus | 'Any'>('Missing')
  const [sort, setSort] = useState('Nearest')
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [feedState, setFeedState] = useState<LoadState>('idle')
  const [feedError, setFeedError] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [reportedTarget, setReportedTarget] = useState<{ type: 'Post' | 'Comment' | 'Message'; id: string; label: string } | null>(null)
  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [detailState, setDetailState] = useState<LoadState>('idle')
  const [detailError, setDetailError] = useState('')
  const [comments, setComments] = useState<CommentDto[]>([])
  const [commentsState, setCommentsState] = useState<LoadState>('idle')
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [createMessage, setCreateMessage] = useState('')
  const [createError, setCreateError] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [selectedPin, setSelectedPin] = useState(defaultLocation)
  const [pinConfirmed, setPinConfirmed] = useState(false)
  const [pinTouched, setPinTouched] = useState(false)
  const [draftPhotos, setDraftPhotos] = useState<DraftPhoto[]>([])
  const draftPhotoUrlsRef = useRef<string[]>([])
  const wasCreateRef = useRef(false)
  const [uploadError, setUploadError] = useState('')
  const [managementToken, setManagementToken] = useState(getQueryToken())
  const [managedPost, setManagedPost] = useState<{ postId: string; petName: string; status: PetStatus } | null>(null)
  const [managementState, setManagementState] = useState<LoadState>('idle')
  const [managementError, setManagementError] = useState('')
  const [managementSuccess, setManagementSuccess] = useState('')

  const activePostId = useMemo(() => path.match(/^\/posts\/([^/]+)/)?.[1] ?? '', [path])
  const isCreate = path === '/posts/new'
  const isManage = /^\/posts\/[^/]+\/manage$/.test(path)
  const isDetail = /^\/posts\/[^/]+$/.test(path) && path !== '/posts/new' && !isManage

  useLayoutEffect(() => {
    const wasCreate = wasCreateRef.current
    wasCreateRef.current = isCreate

    if (!isCreate) return

    if (!wasCreate) {
      setSelectedPin(location)
      setPinConfirmed(false)
      setPinTouched(false)
      return
    }

    if (!pinTouched && !pinConfirmed) {
      setSelectedPin(location)
    }
  }, [isCreate, location, pinConfirmed, pinTouched])

  useEffect(() => {
    window.onpopstate = () => {
      setPath(getPath())
      const queryToken = getQueryToken()
      if (queryToken) setManagementToken(queryToken)
    }
    return () => {
      window.onpopstate = null
    }
  }, [])

  useEffect(() => {
    if (path !== '/') return
    const query = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radiusKm: String(radius),
      status: statusFilter,
      sort,
    })
    if (typeFilter !== 'Any') query.set('type', typeFilter)

    setFeedState('loading')
    setFeedError('')
    requestJson<{ items: FeedPost[] }>(`/api/posts?${query}`)
      .then((data) => {
        setFeedPosts(data.items)
        setFeedState('idle')
      })
      .catch((error: Error) => {
        setFeedError(error.message)
        setFeedState('error')
      })
  }, [location, path, radius, sort, statusFilter, typeFilter])

  useEffect(() => {
    if (!isDetail || !activePostId) return
    loadDetail(activePostId)
    loadComments(activePostId)
  }, [activePostId, isDetail, location.lat, location.lng])

  useEffect(() => {
    if (!isManage || !activePostId || !managementToken) {
      if (isManage && !managementToken) {
        setManagementError('Paste the private management token from the publish success message.')
      }
      return
    }

    setManagementState('loading')
    setManagementError('')
    requestJson<{ postId: string; petName: string; status: PetStatus }>(`/api/posts/${activePostId}/management?token=${encodeURIComponent(managementToken)}`)
      .then((data) => {
        setManagedPost(data)
        setManagementState('idle')
      })
      .catch((error: Error) => {
        setManagementError(error.message)
        setManagementState('error')
      })
  }, [activePostId, isManage, managementToken])

  function navigate(nextPath: string) {
    window.history.pushState({}, '', nextPath)
    setPath(getPath())
    const queryToken = getQueryToken()
    if (queryToken) setManagementToken(queryToken)
    if (nextPath === '/') setLocationModalOpen(false)
    if (nextPath === '/posts/new') {
      setSelectedPin(location)
      setPinConfirmed(false)
      setPinTouched(false)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function loadDetail(postId: string) {
    setDetailState('loading')
    setDetailError('')
    try {
      const query = `viewerLat=${location.lat}&viewerLng=${location.lng}`
      const data = await requestJson<PostDetail>(`/api/posts/${postId}?${query}`)
      setDetail(data)
      setDetailState('idle')
    } catch (error) {
      setDetailError((error as Error).message)
      setDetailState('error')
    }
  }

  async function loadComments(postId: string) {
    setCommentsState('loading')
    try {
      const data = await requestJson<CommentDto[]>(`/api/posts/${postId}/comments`)
      setComments(data)
      setCommentsState('idle')
    } catch {
      setCommentsState('error')
    }
  }

  function openReport(type: 'Post' | 'Comment' | 'Message', id: string, label: string) {
    setReportedTarget({ type, id, label })
    setModal('report')
  }

  async function allowBrowserLocation() {
    setPermissionState('Requesting browser location...')
    const result = await requestBrowserLocation()

    if (!result.ok) {
      setPermissionState(result.message)
      return
    }

    setLocation(result.location)
    setPermissionState(result.reverseGeocoded ? 'Location granted.' : 'Location granted. Address lookup unavailable, using coordinates.')
    setLocationModalOpen(false)
  }

  function useManualLocation() {
    const key = Object.keys(manualPlaces).find((place) => manualLocation.toLowerCase().includes(place))
    setLocation(key ? manualPlaces[key] : { ...defaultLocation, label: manualLocation || defaultLocation.label, source: 'manual' })
    setPermissionState('Manual location selected.')
    setLocationModalOpen(false)
  }

  useEffect(() => {
    return () => {
      draftPhotoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  function addDraftPhotos(files: FileList | File[]) {
    setUploadError('')
    const selectedFiles = Array.from(files)
    if (selectedFiles.length === 0) return

    setDraftPhotos((current) => {
      const availableSlots = maxPhotoCount - current.length
      const accepted: DraftPhoto[] = []
      const rejected: string[] = []

      selectedFiles.slice(0, Math.max(availableSlots, 0)).forEach((file) => {
        if (!isAcceptedPhoto(file)) {
          rejected.push(`${file.name} is not a supported image type.`)
          return
        }

        if (file.size <= 0 || file.size > maxPhotoSizeBytes) {
          rejected.push(`${file.name} must be between 1 byte and 8 MB.`)
          return
        }

        const previewUrl = URL.createObjectURL(file)
        draftPhotoUrlsRef.current.push(previewUrl)
        accepted.push({
          id: createDraftPhotoId(),
          file,
          fileName: file.name,
          contentType: contentTypeForPhoto(file),
          sizeBytes: file.size,
          previewUrl,
        })
      })

      if (selectedFiles.length > availableSlots) {
        rejected.push(`Only ${maxPhotoCount} photos can be added.`)
      }

      if (rejected.length > 0) {
        setUploadError(rejected.join(' '))
      }

      return [...current, ...accepted]
    })
  }

  function removeDraftPhoto(photoId: string) {
    setDraftPhotos((current) => {
      const photo = current.find((item) => item.id === photoId)
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl)
        draftPhotoUrlsRef.current = draftPhotoUrlsRef.current.filter((url) => url !== photo.previewUrl)
      }
      return current.filter((item) => item.id !== photoId)
    })
  }

  async function createUploadTickets(photos: DraftPhoto[]) {
    const uploadIds: string[] = []

    for (const photo of photos) {
      const formData = new FormData()
      formData.append('file', photo.file, photo.fileName)

      const response = await fetch(apiUrl('/api/photo-uploads'), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `Photo upload failed with ${response.status}`)
      }

      const ticket = (await response.json()) as { uploadId: string }
      uploadIds.push(ticket.uploadId)
    }

    return uploadIds
  }

  function resolvePhotoUrl(url?: string) {
    return photoUrl(url)
  }

  function updatePin(pin: LocationState) {
    setSelectedPin(pin)
    setPinConfirmed(false)
    setPinTouched(true)
  }

  function confirmPin(pin: LocationState) {
    setSelectedPin(pin)
    setPinConfirmed(true)
    setPinTouched(true)
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const petName = String(data.get('petName') ?? '').trim()
    const petType = String(data.get('petType') ?? '').trim()
    const accessories = String(data.get('accessories') ?? '').trim()
    const features = String(data.get('features') ?? '').trim()

    if (!petName || !features || draftPhotos.length === 0 || !pinConfirmed) {
      setCreateError(!pinConfirmed ? 'Confirm the last-seen pin before publishing.' : 'Pet name, defining features, and at least one uploaded photo are required.')
      setCreateMessage('')
      return
    }

    setIsPublishing(true)
    setCreateError('')
    setUploadError('')
    try {
      const photoUploadIds = await createUploadTickets(draftPhotos)
      const result = await requestJson<{ postId: string; managementToken: string; managementUrl: string }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          petName,
          petType,
          accessories,
          definingFeatures: features,
          lastSeen: { lat: selectedPin.lat, lng: selectedPin.lng, humanReadable: selectedPin.label },
          photoUploadIds,
          contactPreference: { allowMessages: true },
        }),
      })
      setCreateMessage(`Published. Private management link: ${result.managementUrl}`)
      setManagementToken(result.managementToken)
      setTimeout(() => navigate(`/posts/${result.postId}`), 900)
    } catch (error) {
      setCreateError((error as Error).message)
    } finally {
      setIsPublishing(false)
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!commentText.trim() || !detail) {
      setCommentError('Comment body is required.')
      return
    }

    setCommentError('')
    try {
      const comment = await requestJson<CommentDto>(`/api/posts/${detail.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentText, anonymousDisplayName: 'Anonymous helper' }),
      })
      setComments((items) => [...items, comment])
      setCommentText('')
    } catch (error) {
      setCommentError((error as Error).message)
    }
  }

  async function saveManagedStatus(status: PetStatus) {
    if (!activePostId || !managementToken) return
    setManagementSuccess('')
    try {
      const data = await requestJson<{ postId: string; petName: string; status: PetStatus }>(
        `/api/posts/${activePostId}/management?token=${encodeURIComponent(managementToken)}`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
      )
      setManagedPost(data)
      setManagementSuccess('Status updated.')
    } catch (error) {
      setManagementError((error as Error).message)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => navigate('/')}>
          <span>MP</span>
          MissingPets
        </button>
        <nav>
          <button className="secondary" type="button" onClick={() => setLocationModalOpen(true)}>
            Change location
          </button>
          <button type="button" onClick={() => navigate('/posts/new')}>
            Post missing pet
          </button>
        </nav>
      </header>

      <main>
        {path === '/' && (
          <FeedSurface
            posts={feedPosts}
            location={location}
            radius={radius}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            sort={sort}
            state={feedState}
            error={feedError}
            onRadiusChange={setRadius}
            onTypeChange={setTypeFilter}
            onStatusChange={setStatusFilter}
            onSortChange={setSort}
            onNavigate={navigate}
            onReport={(id) => openReport('Post', id, 'post')}
            resolvePhotoUrl={resolvePhotoUrl}
          />
        )}
        {isCreate && (
          <CreatePostSurface
            draftPhotos={draftPhotos}
            createMessage={createMessage}
            createError={createError}
            uploadError={uploadError}
            mapError={mapError}
            selectedPin={selectedPin}
            pinConfirmed={pinConfirmed}
            searchLocation={location}
            fallbackPlaces={manualPlaces}
            isPublishing={isPublishing}
            onPhotosSelected={addDraftPhotos}
            onRemovePhoto={removeDraftPhoto}
            onSubmit={submitCreate}
            onCancel={() => navigate('/')}
            onToggleMapError={() => setMapError((value) => !value)}
            onPinChange={updatePin}
            onPinConfirm={confirmPin}
          />
        )}
        {isDetail && (
          <PostDetailSurface
            post={detail}
            state={detailState}
            error={detailError}
            comments={comments}
            commentsState={commentsState}
            commentText={commentText}
            commentError={commentError}
            onCommentTextChange={setCommentText}
            onSubmitComment={submitComment}
            onBack={() => navigate('/')}
            onMessage={() => setModal('message')}
            onManage={() => navigate(`/posts/${activePostId}/manage${managementToken ? `?token=${encodeURIComponent(managementToken)}` : ''}`)}
            onReport={openReport}
            resolvePhotoUrl={resolvePhotoUrl}
          />
        )}
        {isManage && (
          <ManagementSurface
            token={managementToken}
            post={managedPost}
            state={managementState}
            error={managementError}
            success={managementSuccess}
            onTokenChange={setManagementToken}
            onStatusSave={saveManagedStatus}
            onViewPost={() => navigate(`/posts/${activePostId}`)}
          />
        )}
      </main>

      {locationModalOpen && (
        <LocationSurface
          location={manualLocation}
          permissionState={permissionState}
          onLocationChange={setManualLocation}
          onClose={useManualLocation}
          onAllow={allowBrowserLocation}
        />
      )}
      {modal === 'message' && detail && <MessageModal post={detail} onClose={() => setModal(null)} onReport={() => openReport('Post', detail.id, 'post')} />}
      {modal === 'report' && reportedTarget && <ReportModal target={reportedTarget} onClose={() => setModal(null)} />}
    </div>
  )
}

function FeedSurface(props: {
  posts: FeedPost[]
  location: LocationState
  radius: number
  typeFilter: string
  statusFilter: PetStatus | 'Any'
  sort: string
  state: LoadState
  error: string
  onRadiusChange: (value: number) => void
  onTypeChange: (value: string) => void
  onStatusChange: (value: PetStatus | 'Any') => void
  onSortChange: (value: string) => void
  onNavigate: (path: string) => void
  onReport: (postId: string) => void
  resolvePhotoUrl: (url?: string) => string | undefined
}) {
  return (
    <section className="feed-shell" aria-label="Nearby missing pets feed">
      <div className="filters" aria-label="Search and filter controls">
        <label>
          <span>Search location</span>
          <input value={props.location.label} readOnly />
        </label>
        <label>
          <span>Radius</span>
          <select value={props.radius} onChange={(event) => props.onRadiusChange(Number(event.target.value))}>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
          </select>
        </label>
        <label>
          <span>Pet type</span>
          <select value={props.typeFilter} onChange={(event) => props.onTypeChange(event.target.value)}>
            <option>Any</option>
            <option>Dog</option>
            <option>Cat</option>
            <option>Bird</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={props.statusFilter} onChange={(event) => props.onStatusChange(event.target.value as PetStatus | 'Any')}>
            <option>Missing</option>
            <option>Found</option>
            <option>Any</option>
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={props.sort} onChange={(event) => props.onSortChange(event.target.value)}>
            <option>Nearest</option>
            <option>Newest</option>
          </select>
        </label>
      </div>

      <div className="feed-grid">
        <div className="feed-list">
          {props.state === 'loading' && <StatusPanel title="Loading nearby posts" text="Querying reports near the selected location." />}
          {props.state === 'error' && <StatusPanel title="Could not load feed" text={props.error} danger />}
          {props.state !== 'loading' && props.posts.length === 0 && <StatusPanel title="No matching nearby posts" text="Try a wider radius or a different pet type." />}
          {props.posts.map((post) => (
            <article className="pet-card" key={post.id}>
              <PetPhoto label={`${post.petType} photo`} src={props.resolvePhotoUrl(post.primaryPhotoUrl)} />
              <div>
                <div className="card-head">
                  <h2>{post.petName}</h2>
                  <StatusChip status={post.status} />
                </div>
                <div className="chips">
                  <span>{post.petType}</span>
                  <span>{post.distanceKm.toFixed(1)} km away</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <p><strong>Last seen:</strong> approx. {post.approximateArea}</p>
                <p>{post.definingFeatureSummary}</p>
                <div className="row-actions">
                  <button type="button" onClick={() => props.onNavigate(`/posts/${post.id}`)}>Open post</button>
                  <button className="ghost" type="button" onClick={() => props.onReport(post.id)}>Report</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <aside className="side-panel">
          <h1>Near {props.location.label.split(',')[0]}</h1>
          <p>Showing active reports within {props.radius} km. Public maps show approximate last-seen areas.</p>
          <MapPanel />
        </aside>
      </div>
    </section>
  )
}

function CreatePostSurface(props: {
  draftPhotos: DraftPhoto[]
  createMessage: string
  createError: string
  uploadError: string
  mapError: boolean
  selectedPin: LocationState
  pinConfirmed: boolean
  searchLocation: LocationState
  fallbackPlaces: Record<string, LocationState>
  isPublishing: boolean
  onPhotosSelected: (files: FileList) => void
  onRemovePhoto: (photoId: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onToggleMapError: () => void
  onPinChange: (pin: LocationState) => void
  onPinConfirm: (pin: LocationState) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function selectPhotos(files: FileList | null) {
    if (!files) return
    props.onPhotosSelected(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form className="form-panel" onSubmit={props.onSubmit} aria-label="Create missing pet post">
      <h1>Create missing-pet post</h1>
      <p>Anonymous posting is supported. Save the private management code shown after publishing.</p>
      <div className="upload-grid">
        {props.draftPhotos.map((photo) => (
          <div className="draft-photo" key={photo.id}>
            <PetPhoto label={photo.fileName} src={photo.previewUrl} />
            <button className="ghost fit" type="button" onClick={() => props.onRemovePhoto(photo.id)}>Remove</button>
          </div>
        ))}
        {props.draftPhotos.length < maxPhotoCount && <button className="upload-tile" type="button" onClick={openFilePicker}>Upload pet photo</button>}
      </div>
      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        onChange={(event) => selectPhotos(event.target.files)}
        aria-label="Choose pet photos"
      />
      {props.uploadError && <p className="error-text">{props.uploadError}</p>}
      <div className="form-grid">
        <label>
          <span>Pet name</span>
          <input name="petName" placeholder="Luna" />
        </label>
        <label>
          <span>Pet type</span>
          <select name="petType">
            <option>Dog</option>
            <option>Cat</option>
            <option>Bird</option>
            <option>Other</option>
          </select>
        </label>
        <label className="wide">
          <span>Accessories</span>
          <input name="accessories" placeholder="Pink collar, bell, harness" />
        </label>
        <label className="wide">
          <span>Defining features</span>
          <textarea name="features" placeholder="White paws, scar near left ear, very shy" />
        </label>
      </div>
      <LastSeenMapPicker
        value={props.selectedPin}
        defaultCenter={props.searchLocation}
        confirmed={props.pinConfirmed}
        providerUnavailable={props.mapError}
        fallbackPlaces={props.fallbackPlaces}
        onDraftChange={props.onPinChange}
        onConfirm={props.onPinConfirm}
        onToggleProviderUnavailable={props.onToggleMapError}
      />
      {props.createError && <p className="error-text">{props.createError}</p>}
      {props.createMessage && <div className="success-box">{props.createMessage}</div>}
      <div className="row-actions end">
        <button className="secondary" type="button" onClick={props.onCancel}>Cancel</button>
        <button type="submit" disabled={props.isPublishing}>{props.isPublishing ? 'Publishing...' : 'Publish post'}</button>
      </div>
    </form>
  )
}

function PostDetailSurface(props: {
  post: PostDetail | null
  state: LoadState
  error: string
  comments: CommentDto[]
  commentsState: LoadState
  commentText: string
  commentError: string
  onCommentTextChange: (value: string) => void
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
  onMessage: () => void
  onManage: () => void
  onReport: (type: 'Post' | 'Comment' | 'Message', id: string, label: string) => void
  resolvePhotoUrl: (url?: string) => string | undefined
}) {
  if (props.state === 'loading') return <StatusPanel title="Loading post" text="Fetching the report and comments." />
  if (props.state === 'error' || !props.post) return <StatusPanel title="Post unavailable" text={props.error || 'This post could not be found.'} danger />
  const post = props.post

  return (
    <section className="detail-grid" aria-label="Post detail">
      <article className="detail-main">
        <button className="ghost fit" type="button" onClick={props.onBack}>Back to feed</button>
        <div className="gallery">
          {post.photos.map((photo) => <PetPhoto key={photo.id} label="Pet photo" src={props.resolvePhotoUrl(photo.displayUrl)} />)}
        </div>
        <div className="card-head">
          <div>
            <h1>{post.petName}</h1>
            <p>{post.petType} last seen approx. {post.approximateArea}</p>
          </div>
          <StatusChip status={post.status} />
        </div>
        <p><strong>Accessories:</strong> {post.accessories || 'None listed'}</p>
        <p><strong>Defining features:</strong> {post.definingFeatures}</p>
        <section className="comments" aria-label="Comments">
          <h2>Comments</h2>
          {props.commentsState === 'loading' && <p>Loading comments...</p>}
          {props.commentsState === 'error' && <p className="error-text">Could not load comments.</p>}
          {props.comments.length === 0 && props.commentsState !== 'loading' && <p>No public comments yet.</p>}
          {props.comments.map((comment) => (
            <article className="comment" key={comment.id}>
              <strong>{comment.anonymousDisplayName}</strong>
              <p>{comment.body}</p>
              <button className="ghost fit" type="button" onClick={() => props.onReport('Comment', comment.id, 'comment')}>Report</button>
            </article>
          ))}
          <form onSubmit={props.onSubmitComment}>
            <label>
              <span>Add comment</span>
              <textarea value={props.commentText} onChange={(event) => props.onCommentTextChange(event.target.value)} />
            </label>
            {props.commentError && <p className="error-text">{props.commentError}</p>}
            <button type="submit">Post comment</button>
          </form>
        </section>
      </article>
      <aside className="side-panel">
        <h2>Approximate last-seen area</h2>
        <MapPanel lat={post.approximateMap.lat} lng={post.approximateMap.lng} />
        <p>Exact coordinates are used for search. Public display is softened for privacy.</p>
        {post.distanceKm !== undefined && <p>{post.distanceKm.toFixed(1)} km from your selected location.</p>}
        <button type="button" onClick={props.onMessage}>Message poster</button>
        <button className="secondary" type="button" onClick={props.onManage}>Manage with private code</button>
        <button className="ghost" type="button" onClick={() => props.onReport('Post', post.id, 'post')}>Report post</button>
      </aside>
    </section>
  )
}

function ManagementSurface(props: {
  token: string
  post: { postId: string; petName: string; status: PetStatus } | null
  state: LoadState
  error: string
  success: string
  onTokenChange: (value: string) => void
  onStatusSave: (value: PetStatus) => void
  onViewPost: () => void
}) {
  const [draftStatus, setDraftStatus] = useState<PetStatus>('Missing')

  useEffect(() => {
    if (props.post) setDraftStatus(props.post.status)
  }, [props.post])

  return (
    <section className="form-panel" aria-label="Anonymous post management">
      <h1>Manage report</h1>
      <p>This view is available through the private management link or code created after posting.</p>
      <label>
        <span>Private management token</span>
        <input value={props.token} onChange={(event) => props.onTokenChange(event.target.value)} />
      </label>
      {props.state === 'loading' && <p>Checking token...</p>}
      {props.error && <p className="error-text">{props.error}</p>}
      {props.post && <div className="success-box">Management token accepted for {props.post.petName}.</div>}
      <label>
        <span>Status</span>
        <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as PetStatus)}>
          <option>Missing</option>
          <option>Found</option>
        </select>
      </label>
      {props.success && <div className="success-box">{props.success}</div>}
      <div className="row-actions end">
        <button className="secondary" type="button" onClick={props.onViewPost}>View public post</button>
        <button type="button" onClick={() => props.onStatusSave(draftStatus)}>Save status</button>
      </div>
    </section>
  )
}

function LocationSurface(props: {
  location: string
  permissionState: string
  onLocationChange: (value: string) => void
  onClose: () => void
  onAllow: () => void
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Location permission">
      <section className="modal">
        <h1>Find missing pets near you</h1>
        <p>Allow access or choose manually.</p>
        <div className="success-box">{props.permissionState}</div>
        <label>
          <span>Manual location</span>
          <input value={props.location} onChange={(event) => props.onLocationChange(event.target.value)} />
        </label>
        <div className="row-actions end stack-mobile">
          <button className="secondary" type="button" onClick={props.onClose}>Use manual location</button>
          <button type="button" onClick={props.onAllow}>Allow location</button>
        </div>
      </section>
    </div>
  )
}

function MessageModal(props: { post: PostDetail; onClose: () => void; onReport: () => void }) {
  const [senderContact, setSenderContact] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState<LoadState>('idle')
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!body.trim()) {
      setMessage('Message body is required.')
      return
    }

    setState('loading')
    try {
      await requestJson(`/api/posts/${props.post.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, senderContact }),
      })
      setState('idle')
      setMessage('Message sent.')
    } catch (error) {
      setState('error')
      setMessage((error as Error).message)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Message poster">
      <form className="modal" onSubmit={submit}>
        <h1>Message the poster</h1>
        <p>This sends a post-attached contact message, not a real-time chat.</p>
        <label>
          <span>Your contact info</span>
          <input value={senderContact} onChange={(event) => setSenderContact(event.target.value)} placeholder="Phone or email" />
        </label>
        <label>
          <span>Message</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="I may have seen this pet near..." />
        </label>
        {message && <div className={state === 'error' ? 'map-error' : 'success-box'}>{message}</div>}
        <div className="row-actions end stack-mobile">
          <button className="secondary" type="button" onClick={props.onClose}>Cancel</button>
          <button className="ghost" type="button" onClick={props.onReport}>Report post</button>
          <button type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Sending...' : 'Send message'}</button>
        </div>
      </form>
    </div>
  )
}

function ReportModal(props: { target: { type: 'Post' | 'Comment' | 'Message'; id: string; label: string }; onClose: () => void }) {
  const [reason, setReason] = useState('Spam or fake post')
  const [details, setDetails] = useState('')
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await requestJson('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ targetType: props.target.type, targetId: props.target.id, reason, details }),
      })
      setMessage('Report submitted.')
    } catch (error) {
      setMessage((error as Error).message)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Report abuse">
      <form className="modal" onSubmit={submit}>
        <h1>Report {props.target.label}</h1>
        <label>
          <span>Reason</span>
          <select value={reason} onChange={(event) => setReason(event.target.value)}>
            <option>Spam or fake post</option>
            <option>Unsafe content</option>
            <option>Harassment</option>
            <option>Inappropriate photo</option>
          </select>
        </label>
        <label>
          <span>Details</span>
          <textarea value={details} onChange={(event) => setDetails(event.target.value)} />
        </label>
        {message && <div className="success-box">{message}</div>}
        <div className="row-actions end stack-mobile">
          <button className="secondary" type="button" onClick={props.onClose}>Cancel</button>
          <button className="danger" type="submit">Submit report</button>
        </div>
      </form>
    </div>
  )
}

function StatusPanel(props: { title: string; text: string; danger?: boolean }) {
  return (
    <section className="panel empty">
      <h1>{props.title}</h1>
      <p className={props.danger ? 'error-text' : undefined}>{props.text}</p>
    </section>
  )
}

function PetPhoto({ label, src }: { label: string; src?: string }) {
  const [loaded, setLoaded] = useState(Boolean(src))
  return (
    <div className="pet-photo" style={{ '--photo-a': '#0f766e', '--photo-b': '#f59e0b' } as CSSProperties}>
      {src && <img className={loaded ? 'visible' : ''} src={src} alt={label} onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />}
      <span>{label}</span>
    </div>
  )
}

function StatusChip({ status }: { status: PetStatus }) {
  return <span className={`status ${status.toLowerCase()}`}>{status}</span>
}

function MapPanel({ lat, lng }: { lat?: number; lng?: number }) {
  return (
    <div className="map-panel" aria-label="Approximate map">
      <span className="pin" />
      {lat !== undefined && lng !== undefined && <span className="map-label">approx. {lat.toFixed(2)}, {lng.toFixed(2)}</span>}
    </div>
  )
}

export default App
