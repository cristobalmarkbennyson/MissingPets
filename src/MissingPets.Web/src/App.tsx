import './App.css'

type RouteReservation = {
  path: string
  label: string
  tracesTo: string
}

const routeReservations: RouteReservation[] = [
  { path: '/', label: 'Nearby Feed', tracesTo: 'UX-001, UX-002, UX-003' },
  { path: '/posts/new', label: 'Create Missing-Pet Post', tracesTo: 'UX-004, UX-005' },
  { path: '/posts/:postId', label: 'Post Detail', tracesTo: 'UX-006, UX-007, UX-008, UX-010' },
  { path: '/posts/:postId/manage', label: 'Anonymous Post Management', tracesTo: 'UX-009' },
]

function currentRouteLabel(pathname: string) {
  if (pathname === '/') return 'Nearby Feed'
  if (pathname === '/posts/new') return 'Create Missing-Pet Post'
  if (/^\/posts\/[^/]+\/manage$/.test(pathname)) return 'Anonymous Post Management'
  if (/^\/posts\/[^/]+$/.test(pathname)) return 'Post Detail'
  return 'Route Not Found'
}

function App() {
  const activeRoute = currentRouteLabel(window.location.pathname)

  return (
    <main className="app-shell">
      <section className="scaffold-panel" aria-labelledby="app-title">
        <p className="eyebrow">Phase 1 scaffold</p>
        <h1 id="app-title">MissingPets</h1>
        <p>
          Web route boundaries are reserved for the approved feed, create-post,
          post-detail, and anonymous-management UX surfaces.
        </p>
        <div className="active-route" aria-label="Current route">
          <span>Current route</span>
          <strong>{activeRoute}</strong>
        </div>
      </section>

      <section className="route-list" aria-label="Reserved routes">
        {routeReservations.map((route) => (
          <article className="route-card" key={route.path}>
            <code>{route.path}</code>
            <h2>{route.label}</h2>
            <p>Traces to {route.tracesTo}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
