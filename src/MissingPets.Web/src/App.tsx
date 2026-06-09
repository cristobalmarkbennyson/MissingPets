import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import './App.css'

type PetStatus = 'Missing' | 'Found'
type ModalState = 'message' | 'report' | null
type LoadState = 'idle' | 'loading' | 'error'

type LocationState = {
  label: string
  lat: number
  lng: number
  source: 'default' | 'browser' | 'manual'
}

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

type UploadTicket = {
  uploadId: string
  displayUrl: string
  fileName: string
}

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
  const [uploads, setUploads] = useState<UploadTicket[]>([])
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

  function allowBrowserLocation() {
    if (!navigator.geolocation) {
      setPermissionState('Browser geolocation is unsupported. Choose manually.')
      return
    }

    setPermissionState('Requesting browser location...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          label: 'Your current area',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: 'browser',
        })
        setPermissionState('Location granted.')
        setLocationModalOpen(false)
      },
      () => setPermissionState('Location denied. Choose manually to keep browsing.'),
      { enableHighAccuracy: false, timeout: 7000 },
    )
  }

  function useManualLocation() {
    const key = Object.keys(manualPlaces).find((place) => manualLocation.toLowerCase().includes(place))
    setLocation(key ? manualPlaces[key] : { ...defaultLocation, label: manualLocation || defaultLocation.label, source: 'manual' })
    setPermissionState('Manual location selected.')
    setLocationModalOpen(false)
  }

  async function uploadSamplePhoto() {
    setUploadError('')
    try {
      const ticket = await requestJson<{ uploadId: string; displayUrl: string }>('/api/photo-uploads', {
        method: 'POST',
        body: JSON.stringify({ fileName: `pet-photo-${uploads.length + 1}.jpg`, contentType: 'image/jpeg', sizeBytes: 420000 }),
      })
      setUploads((items) => [...items, { ...ticket, fileName: `pet-photo-${itemsLabel(items.length + 1)}.jpg` }].slice(0, 6))
    } catch (error) {
      setUploadError((error as Error).message)
    }
  }

  function updatePin(placeLabel: string) {
    const key = Object.keys(manualPlaces).find((place) => placeLabel.toLowerCase().includes(place))
    setSelectedPin(key ? manualPlaces[key] : { ...defaultLocation, label: placeLabel || defaultLocation.label, source: 'manual' })
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const petName = String(data.get('petName') ?? '').trim()
    const petType = String(data.get('petType') ?? '').trim()
    const accessories = String(data.get('accessories') ?? '').trim()
    const features = String(data.get('features') ?? '').trim()

    if (!petName || !features || uploads.length === 0) {
      setCreateError('Pet name, defining features, and at least one uploaded photo are required.')
      setCreateMessage('')
      return
    }

    setIsPublishing(true)
    setCreateError('')
    try {
      const result = await requestJson<{ postId: string; managementToken: string; managementUrl: string }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          petName,
          petType,
          accessories,
          definingFeatures: features,
          lastSeen: { lat: selectedPin.lat, lng: selectedPin.lng, humanReadable: selectedPin.label },
          photoUploadIds: uploads.map((upload) => upload.uploadId),
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
          />
        )}
        {isCreate && (
          <CreatePostSurface
            uploads={uploads}
            createMessage={createMessage}
            createError={createError}
            uploadError={uploadError}
            mapError={mapError}
            selectedPin={selectedPin}
            isPublishing={isPublishing}
            onUpload={uploadSamplePhoto}
            onSubmit={submitCreate}
            onCancel={() => navigate('/')}
            onToggleMapError={() => setMapError((value) => !value)}
            onPinChange={updatePin}
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

function itemsLabel(index: number) {
  return String(index).padStart(2, '0')
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
              <PetPhoto label={`${post.petType} photo`} src={photoUrl(post.primaryPhotoUrl)} />
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
  uploads: UploadTicket[]
  createMessage: string
  createError: string
  uploadError: string
  mapError: boolean
  selectedPin: LocationState
  isPublishing: boolean
  onUpload: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onToggleMapError: () => void
  onPinChange: (label: string) => void
}) {
  return (
    <form className="form-panel" onSubmit={props.onSubmit} aria-label="Create missing pet post">
      <h1>Create missing-pet post</h1>
      <p>Anonymous posting is supported. Save the private management code shown after publishing.</p>
      <div className="upload-grid">
        {props.uploads.map((upload) => <PetPhoto key={upload.uploadId} label={upload.fileName} src={photoUrl(upload.displayUrl)} />)}
        {props.uploads.length < 6 && <button className="upload-tile" type="button" onClick={props.onUpload}>Add sample pet photo</button>}
      </div>
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
      <section className="map-section" aria-label="Google Maps last-seen pin picker">
        <div className="card-head">
          <h2>Last-seen pin</h2>
          <button className="ghost" type="button" onClick={props.onToggleMapError}>
            {props.mapError ? 'Show map' : 'Show map error'}
          </button>
        </div>
        <label>
          <span>Place search</span>
          <input defaultValue={props.selectedPin.label} onBlur={(event) => props.onPinChange(event.target.value)} />
        </label>
        {props.mapError ? <div className="map-error">Map provider unavailable. Place search can be retried.</div> : <MapPanel lat={props.selectedPin.lat} lng={props.selectedPin.lng} />}
        <div className="success-box">Pin selected for {props.selectedPin.label}.</div>
        <p>Exact coordinates are saved for search. Public display uses an approximate area.</p>
      </section>
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
}) {
  if (props.state === 'loading') return <StatusPanel title="Loading post" text="Fetching the report and comments." />
  if (props.state === 'error' || !props.post) return <StatusPanel title="Post unavailable" text={props.error || 'This post could not be found.'} danger />
  const post = props.post

  return (
    <section className="detail-grid" aria-label="Post detail">
      <article className="detail-main">
        <button className="ghost fit" type="button" onClick={props.onBack}>Back to feed</button>
        <div className="gallery">
          {post.photos.map((photo) => <PetPhoto key={photo.id} label="Pet photo" src={photoUrl(photo.displayUrl)} />)}
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
