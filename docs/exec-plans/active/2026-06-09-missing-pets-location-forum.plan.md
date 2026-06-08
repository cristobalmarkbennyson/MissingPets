# Missing Pets Location Forum - Plan

- Initiative Slug: `2026-06-09-missing-pets-location-forum`
- Artifact: `Plan`
- Status: `Approved`
- Related Artifacts:
  - `2026-06-09-missing-pets-location-forum.reqs.md`
  - `2026-06-09-missing-pets-location-forum.ux.md`
  - `2026-06-09-missing-pets-location-forum.prototype.html`
  - `2026-06-09-missing-pets-location-forum.architecture.md`
- Last Updated: `2026-06-09`

## Execution Protocol

This plan is mandatory execution guidance for implementation.

- Phases must be executed strictly in the order listed.
- A later phase must not begin until the current phase is complete and its acceptance criteria and verification steps have passed.
- The implementing agent must not pull work forward from later phases unless explicitly listed as current-phase prerequisite work.
- If a phase is blocked by ambiguity, missing prerequisites, failed verification, or conflicting upstream artifacts, stop and escalate.
- After context compaction, a new session, or any resume, re-read this plan and any implementation evidence artifact before editing files, checking off criteria, or advancing phases.
- Acceptance criteria start unchecked. Change `[ ]` to `[x]` only after implementation is complete and linked verification evidence has passed.
- Deferred, skipped, blocked, or partially complete acceptance criteria must remain unchecked and be explained in implementation notes.
- Maintain a running implementation evidence file at `docs/exec-plans/active/2026-06-09-missing-pets-location-forum.impl.md`.

## High-Level Phase Summary

This summary is descriptive for planning collaborators. The detailed phases below are the source of implementation instructions.

- `PLN-001` Scaffold the greenfield solution with frontend, backend, test projects, configuration, and local run documentation.
- `PLN-002` Build the database foundation with PostgreSQL/PostGIS schema, migrations, entity models, and geospatial query tests.
- `PLN-003` Implement backend APIs for posts, photos, feed search, comments, messages, anonymous management, and abuse reports.
- `PLN-004` Implement the approved React UX surfaces and route boundaries without collapsing them into one screen.
- `PLN-005` Integrate Google Maps behavior, photo upload/display behavior, privacy-aware public map display, and responsive checks.
- `PLN-006` Complete automated verification across NUnit unit tests, NUnit integration tests, and Playwright end-to-end journeys.

## Phase 1 - Greenfield Solution Scaffold

### Phase Lock

- Allowed Acceptance Criteria: `AC-PLN-001` through `AC-PLN-004`.
- Forbidden Pull-Forward Work: No database migrations beyond placeholder wiring, no production API behavior, no full UI implementation, no Google Maps integration.
- Unlock Evidence: Solution builds, frontend starts, backend starts, test projects execute empty or smoke tests.
- Resume Checks: Re-read plan, requirements, UX, architecture, and verify the repo remains greenfield or compatible with the scaffold.

### Scope

Create the initial repository structure:

- `src/MissingPets.Web/`
- `src/MissingPets.Api/`
- `src/MissingPets.Api.Tests/`
- `tests/MissingPets.E2E/`

Use React/Vite/TypeScript for the frontend and ASP.NET Core Web API for the backend. Add local configuration placeholders for PostgreSQL, Google Maps, storage, CORS, and moderation/rate-limit settings.

### Acceptance Criteria

- [x] `AC-PLN-001` Scaffold `src/MissingPets.Web/` as a React/Vite/TypeScript app with routes reserved for `/`, `/posts/new`, `/posts/:postId`, and `/posts/:postId/manage`. Traces to `ARC-001`, `INT-UI-001`, `INT-UI-002`, `INT-UI-003`, `INT-UI-004`.
- [x] `AC-PLN-002` Scaffold `src/MissingPets.Api/` as an ASP.NET Core Web API with health endpoint and configuration binding for `CFG-001` through `CFG-007`. Traces to `ARC-002`, `CFG-001`, `CFG-002`, `CFG-003`, `CFG-004`, `CFG-005`, `CFG-006`, `CFG-007`.
- [x] `AC-PLN-003` Scaffold `src/MissingPets.Api.Tests/` with NUnit and `tests/MissingPets.E2E/` with Playwright. Traces to `ARC-006`, `TEST-001`, `TEST-002`, `TEST-003`.
- [x] `AC-PLN-004` Add local run documentation covering frontend, backend, tests, required environment variables, and current prototype path. Traces to `AUD-005`.

### Verification

- `VER-PLN-001` Run backend build and health endpoint smoke test. Traces to `AC-PLN-002`.
- `VER-PLN-002` Run frontend build or typecheck. Traces to `AC-PLN-001`.
- `VER-PLN-003` Run NUnit and Playwright smoke tests. Traces to `AC-PLN-003`.

### Stop Conditions

- Stop if the selected .NET or Node toolchain cannot be identified or installed locally.
- Stop if existing repo files conflict with the required project layout.

## Phase 2 - Database And Domain Foundation

### Phase Lock

- Allowed Acceptance Criteria: `AC-PLN-005` through `AC-PLN-010`.
- Forbidden Pull-Forward Work: No frontend feature implementation, no full API controllers beyond testable persistence seams.
- Unlock Evidence: Migrations apply locally, domain services pass unit tests, geospatial integration tests pass.
- Resume Checks: Confirm Phase 1 criteria are checked with evidence before editing schema or persistence code.

### Scope

Implement data model and persistence for posts, photos, comments, messages, management tokens, and abuse reports. Add PostGIS-enabled geospatial distance search using precise coordinates while preserving approximate public display fields.

### Acceptance Criteria

- [ ] `AC-PLN-005` Implement database schema for `posts`, `post_photos`, `comments`, `messages`, `management_tokens`, and `abuse_reports`. Traces to `ARC-DATA-001`, `ARC-DATA-002`, `ARC-DATA-003`, `ARC-DATA-004`, `ARC-DATA-005`, `ARC-DATA-006`.
- [ ] `AC-PLN-006` Implement precise last-seen coordinate storage with PostGIS geography/point support and indexes suitable for radius search. Traces to `ARC-GEO-001`, `ARC-GEO-002`, `DATA-003`.
- [ ] `AC-PLN-007` Implement public approximate location fields or mapping service output so APIs can avoid exposing precise coordinates by default. Traces to `ARC-GEO-003`, `DEC-003`, `DEC-UX-005`.
- [ ] `AC-PLN-008` Implement management token generation, hashing, verification, and persistence. Traces to `ARC-SEC-002`, `DEC-002`, `UX-009`.
- [ ] `AC-PLN-009` Implement domain validation for required pet photo, pet name, pet type, defining features, and last-seen location. Traces to `F-006`, `F-007`, `DATA-001`, `DATA-002`.
- [ ] `AC-PLN-010` Add NUnit unit and integration tests for validators, token behavior, schema persistence, and radius search. Traces to `TEST-001`, `TEST-002`.

### Verification

- `VER-PLN-004` Apply migrations against a local PostgreSQL/PostGIS database. Traces to `AC-PLN-005`, `AC-PLN-006`.
- `VER-PLN-005` Run NUnit unit tests for validators and management tokens. Traces to `AC-PLN-008`, `AC-PLN-009`.
- `VER-PLN-006` Run NUnit integration tests proving nearby search respects `radiusKm`, sorting, status filter, and type filter. Traces to `AC-PLN-006`, `AC-PLN-010`.

### Stop Conditions

- Stop if local PostgreSQL/PostGIS cannot be made available.
- Stop if the chosen ORM/provider cannot express the required geospatial query without unsafe raw SQL or untested behavior.

## Phase 3 - Backend API And Storage

### Phase Lock

- Allowed Acceptance Criteria: `AC-PLN-011` through `AC-PLN-018`.
- Forbidden Pull-Forward Work: No React route implementation except minimal API contract fixtures if needed for tests.
- Unlock Evidence: API contract tests pass and photo storage abstraction works in local development.
- Resume Checks: Confirm Phase 2 migrations and integration tests are passing before adding controllers.

### Scope

Implement the approved API contracts and photo storage abstraction. Include validation, public response shaping, rate-limit hooks, and abuse-report persistence.

### Acceptance Criteria

- [ ] `AC-PLN-011` Implement `GET /api/posts` nearby feed search with `lat`, `lng`, `radiusKm`, `type`, `status`, and `sort` query parameters. Traces to `INT-API-001`, `F-001`, `F-004`, `F-013`, `UX-001`, `UX-003`.
- [ ] `AC-PLN-012` Implement `POST /api/posts` anonymous post creation with required photo upload references and management token response. Traces to `INT-API-002`, `F-005`, `F-006`, `F-007`, `F-008`, `UX-004`, `UX-005`.
- [ ] `AC-PLN-013` Implement photo upload/storage API or presigned/local upload flow with file type, size, and count limits. Traces to `ARC-004`, `ARC-SEC-004`, `DATA-002`.
- [ ] `AC-PLN-014` Implement `GET /api/posts/{postId}` with full detail, photos, approximate public map data, status, and distance when viewer coordinates are supplied. Traces to `INT-API-003`, `UX-006`.
- [ ] `AC-PLN-015` Implement comments endpoints for listing and anonymous submission. Traces to `INT-API-004`, `F-010`, `UX-007`.
- [ ] `AC-PLN-016` Implement message/contact form endpoint as post-attached submissions, not real-time chat. Traces to `INT-API-005`, `F-011`, `DEC-UX-003`, `UX-008`.
- [ ] `AC-PLN-017` Implement anonymous management endpoints for token-gated status changes. Traces to `INT-API-006`, `F-012`, `WF-007`, `UX-009`.
- [ ] `AC-PLN-018` Implement abuse report endpoint for posts, comments, and messages. Traces to `INT-API-007`, `F-014`, `UX-010`.

### Verification

- `VER-PLN-007` Run API integration tests for feed search, create post, detail, comments, messages, management, and reports. Traces to `AC-PLN-011` through `AC-PLN-018`.
- `VER-PLN-008` Verify create-post response never exposes token hashes and public detail never exposes precise private coordinates unless explicitly intended. Traces to `ARC-SEC-002`, `ARC-SEC-003`, `AC-PLN-014`, `AC-PLN-017`.
- `VER-PLN-009` Verify invalid photo metadata, missing required fields, invalid token, and invalid report payloads return clear validation errors. Traces to `AC-PLN-012`, `AC-PLN-013`, `AC-PLN-017`, `AC-PLN-018`.

### Stop Conditions

- Stop if photo storage cannot be abstracted for local development and production-like configuration.
- Stop if anonymous management would require accounts or weaken token security.

## Phase 4 - React UX Surfaces

### Phase Lock

- Allowed Acceptance Criteria: `AC-PLN-019` through `AC-PLN-028`.
- Forbidden Pull-Forward Work: No native mobile work, no full moderation console, no real-time chat, no unrelated social features.
- Unlock Evidence: All approved UX surfaces are represented in distinct routes, embedded sections, modals, or drawers and pass browser checks.
- Resume Checks: Re-read UX artifact and prototype before editing UI to prevent UX surface collapse.

### UX Surface Inventory

- `UX-001` Nearby Feed maps to route `/`.
- `UX-002` Location Permission And Manual Location maps to overlay/panel on `/`.
- `UX-003` Search And Filter Controls maps to embedded filter section on `/`, mobile drawer allowed.
- `UX-004` Create Missing-Pet Post maps to route `/posts/new`.
- `UX-005` Google Maps Last-Seen Pin Picker maps to embedded map section or mobile full-screen step within `/posts/new`.
- `UX-006` Post Detail maps to route `/posts/:postId`.
- `UX-007` Comments maps to embedded section on `/posts/:postId`.
- `UX-008` Message Or Contact Form maps to modal/drawer launched from `/posts/:postId`.
- `UX-009` Anonymous Post Management maps to route `/posts/:postId/manage`.
- `UX-010` Report Abuse maps to modal/drawer launched from feed, detail, comments, or message contexts.

### Acceptance Criteria

- [ ] `AC-PLN-019` Implement nearby feed route `/` with feed cards, approximate area, distance, status, primary photo, and create-post entry; it must not contain full create, comments, messaging, or moderation queue. Traces to `UX-001`, `INT-UI-001`, `F-001`.
- [ ] `AC-PLN-020` Implement location permission overlay/manual fallback on `/`, including denied/unsupported states and manual location confirmation; it must not require accounts. Traces to `UX-002`, `F-002`, `F-003`, `CON-001`.
- [ ] `AC-PLN-021` Implement search/filter controls with `10 km` default radius and configurable radius/type/status/recency behavior. Traces to `UX-003`, `F-004`, `F-013`.
- [ ] `AC-PLN-022` Implement `/posts/new` full-page create flow with required photos, pet details, privacy note, validation states, publish success, and management-link/code display; it must not be a modal. Traces to `UX-004`, `F-005`, `F-006`, `F-007`.
- [ ] `AC-PLN-023` Implement Google Maps last-seen pin picker inside create flow with place search, draggable/selected pin, and map API error state. Traces to `UX-005`, `F-008`, `ARC-005`.
- [ ] `AC-PLN-024` Implement `/posts/:postId` detail route with photo gallery, pet details, approximate map area, status, comments entry, message entry, and report action. Traces to `UX-006`, `INT-UI-003`.
- [ ] `AC-PLN-025` Implement comments section as embedded post-detail content with empty/loading/error/submitting states. Traces to `UX-007`, `F-010`.
- [ ] `AC-PLN-026` Implement message/contact form as modal or drawer, not real-time chat and not a global inbox. Traces to `UX-008`, `F-011`, `DEC-UX-003`.
- [ ] `AC-PLN-027` Implement `/posts/:postId/manage` token/code-based anonymous management route for status changes. Traces to `UX-009`, `F-012`.
- [ ] `AC-PLN-028` Implement report-abuse modal/drawer for posts, comments, and message contexts; it must not include a full moderation queue. Traces to `UX-010`, `F-014`.

### Verification

- `VER-PLN-010` Run frontend typecheck/build. Traces to `AC-PLN-019` through `AC-PLN-028`.
- `VER-PLN-011` Use browser checks at desktop and mobile widths to verify no text/control overlap, especially permission and report/message modals. Traces to `TEST-004`, `AC-PLN-020`, `AC-PLN-026`, `AC-PLN-028`.
- `VER-PLN-012` Verify each UX surface remains distinct and excluded workflows are absent from the wrong surfaces. Traces to `AC-PLN-019` through `AC-PLN-028`.

### Stop Conditions

- Stop if one page/component starts owning multiple primary UX surfaces without the UX artifact allowing it.
- Stop if the create flow is collapsed into a modal.
- Stop if message/contact is implemented as real-time chat or global inbox.

## Phase 5 - Maps, Photos, Privacy, And UX Integration

### Phase Lock

- Allowed Acceptance Criteria: `AC-PLN-029` through `AC-PLN-034`.
- Forbidden Pull-Forward Work: No native mobile apps, no automated pet matching, no payment/reward features.
- Unlock Evidence: End-to-end browser flows work against the backend with realistic seeded data and configured maps/storage behavior.
- Resume Checks: Confirm Phase 4 route boundaries remain intact before integrating cross-surface behaviors.

### Scope

Connect frontend surfaces to backend APIs, Google Maps, photo upload/display, precise search coordinates, approximate public display, and anonymous management flows.

### Acceptance Criteria

- [ ] `AC-PLN-029` Wire browser geolocation and manual location selection to feed API queries using `lat`, `lng`, and radius. Traces to `UX-001`, `UX-002`, `INT-API-001`, `ARC-GEO-002`.
- [ ] `AC-PLN-030` Wire Google Maps selected pin to create-post payload and persist precise coordinates server-side. Traces to `UX-005`, `INT-API-002`, `ARC-GEO-001`.
- [ ] `AC-PLN-031` Wire photo upload and display from create flow through object storage to feed/detail views. Traces to `UX-004`, `UX-006`, `INT-API-002`, `INT-API-003`, `ARC-004`.
- [ ] `AC-PLN-032` Ensure public feed/detail map data displays approximate location while distance search still uses precise coordinates. Traces to `DEC-003`, `DEC-UX-005`, `ARC-GEO-003`.
- [ ] `AC-PLN-033` Wire comments, message/contact form, management status update, and report abuse UI to backend APIs. Traces to `UX-007`, `UX-008`, `UX-009`, `UX-010`, `INT-API-004`, `INT-API-005`, `INT-API-006`, `INT-API-007`.
- [ ] `AC-PLN-034` Add user-visible loading, empty, validation, denied-permission, API error, upload error, and map error states for all affected surfaces. Traces to `AC-UX-006`, `UX-001` through `UX-010`.

### Verification

- `VER-PLN-013` Run integration tests covering API payloads produced by the frontend fixtures or equivalent contract tests. Traces to `AC-PLN-029` through `AC-PLN-033`.
- `VER-PLN-014` Run browser checks for create post, map pin selection, photo upload, feed update, detail display, comment, message, report, and management update. Traces to `AC-PLN-029` through `AC-PLN-034`.
- `VER-PLN-015` Verify exact coordinates are absent from public UI/API responses intended for display while distance values remain correct. Traces to `AC-PLN-032`.

### Stop Conditions

- Stop if Google Maps keys or storage configuration are unavailable and no local mock mode exists.
- Stop if public UI must expose exact coordinates to satisfy current implementation.

## Phase 6 - Full Verification And Release Readiness

### Phase Lock

- Allowed Acceptance Criteria: `AC-PLN-035` through `AC-PLN-040`.
- Forbidden Pull-Forward Work: No new features beyond fixing defects found by planned verification.
- Unlock Evidence: All required automated tests pass, browser evidence is captured, and implementation evidence is complete.
- Resume Checks: Re-run or inspect latest verification evidence before marking final criteria complete.

### Acceptance Criteria

- [ ] `AC-PLN-035` NUnit unit tests cover validators, token generation/verification, response mapping, radius parameter handling, and public-location approximation. Traces to `TEST-001`.
- [ ] `AC-PLN-036` NUnit integration tests cover schema, PostGIS radius search, post creation, photo metadata, comments, messages, management updates, and abuse reports. Traces to `TEST-002`.
- [ ] `AC-PLN-037` Playwright E2E tests cover feed-first location prompt, manual fallback, filters, create post, post detail, comments, message/contact form, report abuse, and anonymous management. Traces to `TEST-003`, `UX-001` through `UX-010`.
- [ ] `AC-PLN-038` Desktop and mobile browser evidence proves controls and text do not overflow or collide, including modals/drawers and form-heavy routes. Traces to `TEST-004`.
- [ ] `AC-PLN-039` Documentation explains local setup for PostgreSQL/PostGIS, Google Maps key, storage configuration, API, frontend, and test commands. Traces to `CFG-001` through `CFG-007`.
- [ ] `AC-PLN-040` Implementation evidence file records completed phases, commands run, test outcomes, screenshots or browser evidence, unresolved risks, and any deferred criteria left unchecked. Traces to Execution Protocol.

### Verification

- `VER-PLN-016` Run full backend unit and integration suite. Traces to `AC-PLN-035`, `AC-PLN-036`.
- `VER-PLN-017` Run full Playwright suite against the local app. Traces to `AC-PLN-037`.
- `VER-PLN-018` Capture desktop and mobile browser evidence for feed, create, detail, message/report modal, and management route. Traces to `AC-PLN-038`.
- `VER-PLN-019` Review documentation and implementation evidence for completeness. Traces to `AC-PLN-039`, `AC-PLN-040`.

### Stop Conditions

- Stop if E2E tests can pass while any approved UX surface is missing or collapsed into an unrelated screen.
- Stop if public location privacy behavior cannot be verified.
- Stop if failed tests are unrelated but unresolved; report them clearly instead of marking criteria complete.

## Explicit Exclusions

- Native mobile applications remain out of scope for this implementation plan. Traces to `OOS-001`, `ASM-007`.
- Mandatory user accounts remain out of scope. Traces to `OOS-002`, `ASM-002`.
- Real-time chat and global inbox are out of scope for v1. Traces to `DEC-UX-003`, `INT-API-005`.
- Automated pet image recognition, payments, rewards, and complex moderation console are out of scope. Traces to `OOS-004`, `OOS-005`, `OOS-006`.

## Mini-Model Readiness Audit

- `AUD-PLN-001` UX surfaces have concrete route/modal/component mappings in Phase 4.
- `AUD-PLN-002` API contracts and schema ownership are defined in the Architecture artifact and referenced by plan acceptance criteria.
- `AUD-PLN-003` Test layers identify where tests live and what each layer must prove.
- `AUD-PLN-004` Phase locks forbid UX collapse, native mobile scope creep, account requirements, real-time chat, and unrelated social features.
- `AUD-PLN-005` The repo is greenfield, and Phase 1 names the first project directories to create.
- `AUD-PLN-006` No known blocker remains that should prevent implementation by a lighter-weight coding agent.
