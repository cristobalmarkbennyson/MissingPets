# Missing Pets Location Forum - Architecture

- Initiative Slug: `2026-06-09-missing-pets-location-forum`
- Artifact: `Architecture`
- Status: `Approved`
- Related Artifacts:
  - `2026-06-09-missing-pets-location-forum.reqs.md`
  - `2026-06-09-missing-pets-location-forum.ux.md`
  - `2026-06-09-missing-pets-location-forum.prototype.html`
  - `2026-06-09-missing-pets-location-forum.plan.md`
- Last Updated: `2026-06-09`

## Architecture Summary

`MissingPets` should be implemented as a web-first, service-backed application with a React/Vite single-page frontend, ASP.NET Core Web API backend, PostgreSQL with PostGIS for geospatial queries, blob/object storage for pet photos, and Google Maps for location picking and place search.

The repository is currently greenfield, so the implementation plan may introduce the project layout. The architecture intentionally avoids native mobile delivery in v1 while keeping API and data contracts reusable for future mobile clients.

## System Elements

- `ARC-001` Web frontend: React SPA built with Vite and TypeScript. Owns routes, client state, form validation, browser geolocation requests, Google Maps JavaScript integration, and calls to backend APIs.
- `ARC-002` Backend API: ASP.NET Core Web API. Owns persistence, validation, distance search, anonymous management token issuance/verification, comments, messages, abuse reports, and upload coordination.
- `ARC-003` Database: PostgreSQL with PostGIS. Owns posts, coordinates, comments, messages, abuse reports, anonymous management tokens, and moderation state.
- `ARC-004` Photo storage: S3-compatible or Azure Blob-style object storage. Owns original and display-ready pet photo objects. V1 may use local development storage with the same abstraction.
- `ARC-005` Maps provider: Google Maps JavaScript API for map picker and Places/Geocoding where needed.
- `ARC-006` Test projects: NUnit for backend unit/integration tests and Playwright for end-to-end browser flows.

## Recommended Repository Layout

- `src/MissingPets.Web/`: React/Vite frontend.
- `src/MissingPets.Api/`: ASP.NET Core Web API.
- `src/MissingPets.Api.Tests/`: NUnit unit and integration tests for backend behavior.
- `tests/MissingPets.E2E/`: Playwright browser tests for approved UX surfaces and workflows.
- `docs/exec-plans/active/`: planning artifacts and prototype.

## Frontend Routes

- `INT-UI-001` `/`: Nearby feed, location prompt overlay, search and filter controls. Traces to `UX-001`, `UX-002`, `UX-003`.
- `INT-UI-002` `/posts/new`: Full-page anonymous create-post flow with required photos and map picker. Traces to `UX-004`, `UX-005`.
- `INT-UI-003` `/posts/:postId`: Post detail with gallery, approximate map, comments, message/contact form entry, and report action. Traces to `UX-006`, `UX-007`, `UX-008`, `UX-010`.
- `INT-UI-004` `/posts/:postId/manage`: Anonymous management route requiring a token or code. Traces to `UX-009`.

## API Contracts

### `INT-API-001` Nearby Feed Search

`GET /api/posts?lat={lat}&lng={lng}&radiusKm=10&type=Dog&status=Missing&sort=Nearest`

Response:

```json
{
  "items": [
    {
      "id": "post_123",
      "petName": "Luna",
      "petType": "Dog",
      "status": "Missing",
      "approximateArea": "Poblacion, Makati",
      "distanceKm": 2.4,
      "createdAt": "2026-06-09T08:00:00Z",
      "primaryPhotoUrl": "https://storage.example/pets/post_123/photo_1.jpg",
      "definingFeatureSummary": "Cream Shih Tzu with pink collar."
    }
  ]
}
```

### `INT-API-002` Create Post

`POST /api/posts`

Request:

```json
{
  "petName": "Luna",
  "petType": "Dog",
  "accessories": "Pink collar with bell",
  "definingFeatures": "Cream Shih Tzu with small limp.",
  "lastSeen": {
    "lat": 14.5653,
    "lng": 121.0318,
    "humanReadable": "Poblacion, Makati"
  },
  "photoUploadIds": ["upload_1"],
  "contactPreference": {
    "allowMessages": true
  }
}
```

Response:

```json
{
  "postId": "post_123",
  "managementToken": "opaque-private-token",
  "managementUrl": "/posts/post_123/manage?token=opaque-private-token"
}
```

### `INT-API-003` Post Detail

`GET /api/posts/{postId}?viewerLat={lat}&viewerLng={lng}`

Response includes full post details, photo URLs, approximate public map center/area, distance from viewer when available, and current status.

### `INT-API-004` Comments

- `GET /api/posts/{postId}/comments`
- `POST /api/posts/{postId}/comments`

Comments are public, anonymous by default, and reportable.

### `INT-API-005` Messages

`POST /api/posts/{postId}/messages`

Messages are post-attached contact submissions, not real-time chat. V1 stores messages server-side and may notify the poster only if a contact delivery channel is later configured.

### `INT-API-006` Anonymous Management

- `GET /api/posts/{postId}/management?token={token}`
- `PATCH /api/posts/{postId}/management?token={token}`

Allows status changes and any approved limited edits for the original anonymous poster.

### `INT-API-007` Abuse Reports

`POST /api/reports`

Reports may target posts, comments, or messages and must record target type, target id, reason, optional details, timestamp, and requester metadata available to the server.

## Data Model

- `ARC-DATA-001` `posts`: id, pet_name, pet_type, accessories, defining_features, status, last_seen_geography, last_seen_human_readable, public_area_label, created_at, updated_at, moderation_state.
- `ARC-DATA-002` `post_photos`: id, post_id, object_key, display_url, sort_order, created_at, scan_state.
- `ARC-DATA-003` `comments`: id, post_id, body, anonymous_display_name, moderation_state, created_at.
- `ARC-DATA-004` `messages`: id, post_id, body, sender_contact, moderation_state, created_at.
- `ARC-DATA-005` `management_tokens`: id, post_id, token_hash, expires_at nullable, created_at, last_used_at.
- `ARC-DATA-006` `abuse_reports`: id, target_type, target_id, reason, details, requester_ip_hash nullable, created_at, review_state.

## Geospatial Behavior

- `ARC-GEO-001` Store precise last-seen coordinates as PostGIS geography/point values for distance filtering and sorting.
- `ARC-GEO-002` Feed queries must filter using `radiusKm`, defaulted by the frontend to `10`.
- `ARC-GEO-003` Public detail responses should return approximate map display data, not necessarily the exact stored coordinates.
- `ARC-GEO-004` Manual location search should provide coordinates equivalent to browser geolocation for querying.

## Security And Privacy

- `ARC-SEC-001` Anonymous posting does not mean unaudited posting; validate input, rate-limit write endpoints, and retain minimal abuse metadata.
- `ARC-SEC-002` Management tokens must be opaque, high entropy, stored hashed, and only shown immediately after post creation.
- `ARC-SEC-003` Public APIs must not expose management tokens or precise private coordinates unless explicitly approved later.
- `ARC-SEC-004` Photo upload must restrict file type, size, and count.
- `ARC-SEC-005` Messaging and comments must include spam/abuse controls even if moderation tooling starts minimal.

## Configuration

- `CFG-001` `ConnectionStrings__MissingPetsDb`
- `CFG-002` `GoogleMaps__BrowserApiKey`
- `CFG-003` `Storage__Provider`
- `CFG-004` `Storage__ConnectionString` or provider equivalent
- `CFG-005` `Storage__PhotoContainer`
- `CFG-006` `Cors__AllowedOrigins`
- `CFG-007` `Moderation__RateLimitPolicy`

## Test Strategy

- `TEST-001` Backend unit tests with NUnit cover validators, radius query parameter handling, management token hashing/verification, public-location approximation, and API mapping.
- `TEST-002` Backend integration tests with NUnit cover PostgreSQL/PostGIS search behavior, post creation, comments, messages, management updates, and abuse reports.
- `TEST-003` Playwright end-to-end tests cover all primary UX routes: nearby feed, location fallback, filters, create post, post detail, comments, message form, report flow, and anonymous management.
- `TEST-004` Prototype visual findings should guide responsive checks: mobile modals and controls must not overflow narrow viewports.

## Architecture Decisions

- `DEC-ARC-001` Use a real backend from the start because anonymous posting, photos, comments, messaging, abuse reports, management tokens, and distance search require durable server-side state.
- `DEC-ARC-002` Use PostgreSQL with PostGIS because geospatial radius search is central to feed behavior.
- `DEC-ARC-003` Use ASP.NET Core Web API for a clear service boundary and future mobile API reuse.
- `DEC-ARC-004` Use React/Vite for the initial web application.
- `DEC-ARC-005` Use Google Maps for last-seen pin selection, matching the approved requirements.
- `DEC-ARC-006` Keep v1 messaging as post-attached contact submissions, not real-time chat.

## Acceptance Criteria

- [ ] `AC-ARC-001` Architecture defines a React/Vite web frontend, ASP.NET Core Web API backend, PostgreSQL/PostGIS database, object storage for photos, and Google Maps integration. Traces to `ARC-001`, `ARC-002`, `ARC-003`, `ARC-004`, `ARC-005`, `F-001`, `F-007`, `F-008`.
- [ ] `AC-ARC-002` Architecture defines concrete frontend routes for feed, create post, post detail, and anonymous management. Traces to `INT-UI-001`, `INT-UI-002`, `INT-UI-003`, `INT-UI-004`, `UX-001`, `UX-004`, `UX-006`, `UX-009`.
- [ ] `AC-ARC-003` Architecture defines API contracts for nearby feed search, create post, post detail, comments, messages, management, and abuse reports. Traces to `INT-API-001`, `INT-API-002`, `INT-API-003`, `INT-API-004`, `INT-API-005`, `INT-API-006`, `INT-API-007`.
- [ ] `AC-ARC-004` Architecture defines geospatial behavior that uses precise coordinates for search and approximate location data for public display. Traces to `ARC-GEO-001`, `ARC-GEO-002`, `ARC-GEO-003`, `DEC-003`, `DEC-UX-005`.
- [ ] `AC-ARC-005` Architecture defines anonymous management token handling without user accounts. Traces to `ARC-SEC-002`, `INT-API-006`, `UX-009`, `DEC-002`.
- [ ] `AC-ARC-006` Architecture defines unit, integration, and Playwright end-to-end coverage expectations across the approved UX surfaces. Traces to `TEST-001`, `TEST-002`, `TEST-003`, `UX-001`, `UX-002`, `UX-003`, `UX-004`, `UX-005`, `UX-006`, `UX-007`, `UX-008`, `UX-009`, `UX-010`.

## Mini-Model Readiness Audit

- `AUD-001` UX surfaces have concrete route or modal/component ownership through `INT-UI-001` to `INT-UI-004`.
- `AUD-002` Backend service boundaries and storage ownership are named through `ARC-002`, `ARC-003`, and `ARC-004`.
- `AUD-003` API contracts define operative payload shapes for the high-risk workflows.
- `AUD-004` Test layers, locations, and expected coverage are named.
- `AUD-005` The repository is greenfield, so the implementation plan must create the listed project layout before feature work begins.
