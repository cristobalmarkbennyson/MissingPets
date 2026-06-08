import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type PetStatus = 'Missing' | 'Found'

type PetPost = {
  id: string
  name: string
  type: string
  status: PetStatus
  distanceKm: number
  area: string
  createdLabel: string
  features: string
  accessories: string
  photos: string[]
  colorA: string
  colorB: string
}

type ModalState = 'message' | 'report' | null

const samplePosts: PetPost[] = [
  {
    id: 'luna',
    name: 'Luna',
    type: 'Dog',
    status: 'Missing',
    distanceKm: 2.4,
    area: 'Poblacion, Makati',
    createdLabel: '2h ago',
    features: 'Cream Shih Tzu with pink collar and a small limp.',
    accessories: 'Pink collar with bell',
    photos: ['Dog photo', 'Second angle'],
    colorA: '#0f766e',
    colorB: '#f59e0b',
  },
  {
    id: 'miso',
    name: 'Miso',
    type: 'Cat',
    status: 'Missing',
    distanceKm: 4.7,
    area: 'BGC, Taguig',
    createdLabel: '5h ago',
    features: 'Gray tabby with yellow eyes and a missing tip on the right ear.',
    accessories: 'None seen',
    photos: ['Cat photo', 'Side view'],
    colorA: '#334155',
    colorB: '#38bdf8',
  },
  {
    id: 'kiwi',
    name: 'Kiwi',
    type: 'Bird',
    status: 'Missing',
    distanceKm: 8.1,
    area: 'San Antonio, Makati',
    createdLabel: 'Yesterday',
    features: 'Green lovebird with orange face and silver leg band.',
    accessories: 'Silver leg band',
    photos: ['Bird photo'],
    colorA: '#16a34a',
    colorB: '#f97316',
  },
  {
    id: 'bruno',
    name: 'Bruno',
    type: 'Dog',
    status: 'Found',
    distanceKm: 9.8,
    area: 'Guadalupe Viejo',
    createdLabel: '2d ago',
    features: 'Brown aspin with red harness, very friendly.',
    accessories: 'Red harness',
    photos: ['Dog photo'],
    colorA: '#92400e',
    colorB: '#facc15',
  },
]

function getPath() {
  return window.location.pathname
}

function App() {
  const [path, setPath] = useState(getPath())
  const [locationModalOpen, setLocationModalOpen] = useState(() => path === '/')
  const [manualLocation, setManualLocation] = useState('Makati, Metro Manila')
  const [radius, setRadius] = useState(10)
  const [typeFilter, setTypeFilter] = useState('Any')
  const [statusFilter, setStatusFilter] = useState<PetStatus | 'Any'>('Missing')
  const [sort, setSort] = useState('Nearest')
  const [modal, setModal] = useState<ModalState>(null)
  const [reportedTarget, setReportedTarget] = useState('post')
  const [comments, setComments] = useState(['Saw a similar dog near Kalayaan Ave around 4 PM.'])
  const [commentText, setCommentText] = useState('')
  const [createSubmitted, setCreateSubmitted] = useState(false)
  const [createError, setCreateError] = useState('')
  const [mapError, setMapError] = useState(false)
  const [managedStatus, setManagedStatus] = useState<PetStatus>('Missing')

  const activePost = useMemo(() => {
    const match = path.match(/^\/posts\/([^/]+)/)
    return samplePosts.find((post) => post.id === match?.[1]) ?? samplePosts[0]
  }, [path])

  const feedPosts = useMemo(() => {
    let posts = samplePosts.filter((post) => post.distanceKm <= radius)
    if (typeFilter !== 'Any') posts = posts.filter((post) => post.type === typeFilter)
    if (statusFilter !== 'Any') posts = posts.filter((post) => post.status === statusFilter)
    if (sort === 'Newest') posts = [...posts].reverse()
    return posts
  }, [radius, sort, statusFilter, typeFilter])

  function navigate(nextPath: string) {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
    setLocationModalOpen(nextPath === '/' && locationModalOpen)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openReport(target: string) {
    setReportedTarget(target)
    setModal('report')
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!data.get('petName') || !data.get('features')) {
      setCreateError('Pet name and defining features are required.')
      setCreateSubmitted(false)
      return
    }

    setCreateError('')
    setCreateSubmitted(true)
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (commentText.trim()) {
      setComments((items) => [...items, commentText.trim()])
      setCommentText('')
    }
  }

  const isCreate = path === '/posts/new'
  const isManage = /^\/posts\/[^/]+\/manage$/.test(path)
  const isDetail = /^\/posts\/[^/]+$/.test(path) && path !== '/posts/new' && !isManage

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
            location={manualLocation}
            radius={radius}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            sort={sort}
            onRadiusChange={setRadius}
            onTypeChange={setTypeFilter}
            onStatusChange={setStatusFilter}
            onSortChange={setSort}
            onNavigate={navigate}
            onReport={openReport}
          />
        )}
        {isCreate && (
          <CreatePostSurface
            createSubmitted={createSubmitted}
            createError={createError}
            mapError={mapError}
            onSubmit={submitCreate}
            onCancel={() => navigate('/')}
            onToggleMapError={() => setMapError((value) => !value)}
          />
        )}
        {isDetail && (
          <PostDetailSurface
            post={activePost}
            comments={comments}
            commentText={commentText}
            onCommentTextChange={setCommentText}
            onSubmitComment={submitComment}
            onBack={() => navigate('/')}
            onMessage={() => setModal('message')}
            onManage={() => navigate(`/posts/${activePost.id}/manage`)}
            onReport={openReport}
          />
        )}
        {isManage && (
          <ManagementSurface
            post={activePost}
            status={managedStatus}
            onStatusChange={setManagedStatus}
            onViewPost={() => navigate(`/posts/${activePost.id}`)}
          />
        )}
      </main>

      {locationModalOpen && (
        <LocationSurface
          location={manualLocation}
          onLocationChange={setManualLocation}
          onClose={() => setLocationModalOpen(false)}
        />
      )}
      {modal === 'message' && <MessageModal onClose={() => setModal(null)} />}
      {modal === 'report' && <ReportModal target={reportedTarget} onClose={() => setModal(null)} />}
    </div>
  )
}

type FeedProps = {
  posts: PetPost[]
  location: string
  radius: number
  typeFilter: string
  statusFilter: PetStatus | 'Any'
  sort: string
  onRadiusChange: (value: number) => void
  onTypeChange: (value: string) => void
  onStatusChange: (value: PetStatus | 'Any') => void
  onSortChange: (value: string) => void
  onNavigate: (path: string) => void
  onReport: (target: string) => void
}

function FeedSurface(props: FeedProps) {
  return (
    <section className="feed-shell" aria-label="Nearby missing pets feed">
      <div className="filters" aria-label="Search and filter controls">
        <label>
          <span>Search location</span>
          <input value={props.location} readOnly />
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
          {props.posts.length === 0 && (
            <section className="panel empty">
              <h1>No matching nearby posts</h1>
              <p>Try a wider radius or a different pet type.</p>
            </section>
          )}
          {props.posts.map((post) => (
            <article className="pet-card" key={post.id}>
              <PetPhoto post={post} label={post.photos[0]} />
              <div>
                <div className="card-head">
                  <h2>{post.name}</h2>
                  <StatusChip status={post.status} />
                </div>
                <div className="chips">
                  <span>{post.type}</span>
                  <span>{post.distanceKm} km away</span>
                  <span>{post.createdLabel}</span>
                </div>
                <p><strong>Last seen:</strong> approx. {post.area}</p>
                <p>{post.features}</p>
                <div className="row-actions">
                  <button type="button" onClick={() => props.onNavigate(`/posts/${post.id}`)}>Open post</button>
                  <button className="ghost" type="button" onClick={() => props.onReport('post')}>Report</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <aside className="side-panel">
          <h1>Near {props.location.split(',')[0]}</h1>
          <p>Showing active reports within the selected radius. Public maps show approximate last-seen areas.</p>
          <MapPanel />
        </aside>
      </div>
    </section>
  )
}

type CreateProps = {
  createSubmitted: boolean
  createError: string
  mapError: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onToggleMapError: () => void
}

function CreatePostSurface(props: CreateProps) {
  return (
    <form className="form-panel" onSubmit={props.onSubmit} aria-label="Create missing pet post">
      <h1>Create missing-pet post</h1>
      <p>Anonymous posting is supported. Save the private management code shown after publishing.</p>
      <div className="upload-grid">
        <div>Required pet photo</div>
        <div>Add another photo</div>
        <div>Add another photo</div>
      </div>
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
        <label className="wide">
          <span>Last seen location</span>
          <input name="lastSeen" defaultValue="Poblacion, Makati" />
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
          <input defaultValue="Poblacion, Makati" />
        </label>
        {props.mapError ? <div className="map-error">Map provider unavailable. Place search can be retried.</div> : <MapPanel />}
        <div className="success-box">Pin selected for Poblacion, Makati.</div>
        <p>Exact coordinates are saved for search. Public display uses an approximate area.</p>
      </section>
      {props.createError && <p className="error-text">{props.createError}</p>}
      {props.createSubmitted && <div className="success-box">Post ready. Private management code: MP-7K4Q.</div>}
      <div className="row-actions end">
        <button className="secondary" type="button" onClick={props.onCancel}>Cancel</button>
        <button type="submit">Publish post</button>
      </div>
    </form>
  )
}

type DetailProps = {
  post: PetPost
  comments: string[]
  commentText: string
  onCommentTextChange: (value: string) => void
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
  onMessage: () => void
  onManage: () => void
  onReport: (target: string) => void
}

function PostDetailSurface(props: DetailProps) {
  return (
    <section className="detail-grid" aria-label="Post detail">
      <article className="detail-main">
        <button className="ghost fit" type="button" onClick={props.onBack}>Back to feed</button>
        <div className="gallery">
          {props.post.photos.map((photo) => <PetPhoto key={photo} post={props.post} label={photo} />)}
        </div>
        <div className="card-head">
          <div>
            <h1>{props.post.name}</h1>
            <p>{props.post.type} last seen approx. {props.post.area}</p>
          </div>
          <StatusChip status={props.post.status} />
        </div>
        <p><strong>Accessories:</strong> {props.post.accessories}</p>
        <p><strong>Defining features:</strong> {props.post.features}</p>
        <section className="comments" aria-label="Comments">
          <h2>Comments</h2>
          {props.comments.map((comment, index) => (
            <article className="comment" key={`${comment}-${index}`}>
              <strong>Anonymous helper</strong>
              <p>{comment}</p>
              <button className="ghost fit" type="button" onClick={() => props.onReport('comment')}>Report</button>
            </article>
          ))}
          <form onSubmit={props.onSubmitComment}>
            <label>
              <span>Add comment</span>
              <textarea value={props.commentText} onChange={(event) => props.onCommentTextChange(event.target.value)} />
            </label>
            <button type="submit">Post comment</button>
          </form>
        </section>
      </article>
      <aside className="side-panel">
        <h2>Approximate last-seen area</h2>
        <MapPanel />
        <p>Exact coordinates are used for search. Public display is softened for privacy.</p>
        <button type="button" onClick={props.onMessage}>Message poster</button>
        <button className="secondary" type="button" onClick={props.onManage}>Manage with private code</button>
        <button className="ghost" type="button" onClick={() => props.onReport('post')}>Report post</button>
      </aside>
    </section>
  )
}

function ManagementSurface(props: {
  post: PetPost
  status: PetStatus
  onStatusChange: (value: PetStatus) => void
  onViewPost: () => void
}) {
  return (
    <section className="form-panel" aria-label="Anonymous post management">
      <h1>Manage {props.post.name}'s report</h1>
      <p>This view is available through the private management link or code created after posting.</p>
      <div className="success-box">Management token accepted.</div>
      <label>
        <span>Status</span>
        <select value={props.status} onChange={(event) => props.onStatusChange(event.target.value as PetStatus)}>
          <option>Missing</option>
          <option>Found</option>
        </select>
      </label>
      <div className="row-actions end">
        <button className="secondary" type="button" onClick={props.onViewPost}>View public post</button>
        <button type="button">Save status</button>
      </div>
    </section>
  )
}

function LocationSurface(props: {
  location: string
  onLocationChange: (value: string) => void
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Location permission">
      <section className="modal">
        <h1>Find missing pets near you</h1>
        <p>Allow access or choose manually.</p>
        <label>
          <span>Manual location</span>
          <input value={props.location} onChange={(event) => props.onLocationChange(event.target.value)} />
        </label>
        <div className="row-actions end stack-mobile">
          <button className="secondary" type="button" onClick={props.onClose}>Use manual location</button>
          <button type="button" onClick={props.onClose}>Allow location</button>
        </div>
      </section>
    </div>
  )
}

function MessageModal(props: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Message poster">
      <form className="modal" onSubmit={(event) => { event.preventDefault(); props.onClose() }}>
        <h1>Message the poster</h1>
        <p>This sends a post-attached contact message, not a real-time chat.</p>
        <label>
          <span>Your contact info</span>
          <input placeholder="Phone or email" />
        </label>
        <label>
          <span>Message</span>
          <textarea placeholder="I may have seen this pet near..." />
        </label>
        <div className="row-actions end stack-mobile">
          <button className="secondary" type="button" onClick={props.onClose}>Cancel</button>
          <button type="submit">Send message</button>
        </div>
      </form>
    </div>
  )
}

function ReportModal(props: { target: string; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Report abuse">
      <form className="modal" onSubmit={(event) => { event.preventDefault(); props.onClose() }}>
        <h1>Report {props.target}</h1>
        <label>
          <span>Reason</span>
          <select>
            <option>Spam or fake post</option>
            <option>Unsafe content</option>
            <option>Harassment</option>
            <option>Inappropriate photo</option>
          </select>
        </label>
        <label>
          <span>Details</span>
          <textarea />
        </label>
        <div className="row-actions end stack-mobile">
          <button className="secondary" type="button" onClick={props.onClose}>Cancel</button>
          <button className="danger" type="submit">Submit report</button>
        </div>
      </form>
    </div>
  )
}

function PetPhoto({ post, label }: { post: PetPost; label: string }) {
  return (
    <div className="pet-photo" style={{ '--photo-a': post.colorA, '--photo-b': post.colorB } as React.CSSProperties}>
      <span>{label}</span>
    </div>
  )
}

function StatusChip({ status }: { status: PetStatus }) {
  return <span className={`status ${status.toLowerCase()}`}>{status}</span>
}

function MapPanel() {
  return (
    <div className="map-panel" aria-label="Approximate map">
      <span className="pin" />
    </div>
  )
}

export default App
