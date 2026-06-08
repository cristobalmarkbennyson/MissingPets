# Missing Pets Location Forum - UX

- Initiative Slug: `2026-06-09-missing-pets-location-forum`
- Artifact: `UX`
- Status: `Approved`
- Related Artifacts:
  - `2026-06-09-missing-pets-location-forum.reqs.md`
  - `2026-06-09-missing-pets-location-forum.ui.md`
  - `2026-06-09-missing-pets-location-forum.prototype.html`
  - `2026-06-09-missing-pets-location-forum.architecture.md`
  - `2026-06-09-missing-pets-location-forum.plan.md`
- Last Updated: `2026-06-09`

## UX Intent

The web app should open directly into a nearby missing-pets feed. First-time location access should feel like a focused permission step layered over the feed context, not a marketing landing page. Users who grant location access immediately see nearby reports. Users who deny or skip location access can manually choose an area and still use the app.

Posting should be anonymous, photo-led, and full-page. The create flow must give enough space for pet details, required photo upload, and Google Maps last-seen pinning. Messaging in v1 should be a simple post-attached contact form rather than real-time chat.

## Navigation Model

- `NAV-001` `/` opens the nearby feed and may trigger the location prompt overlay for first-time users.
- `NAV-002` `/location` or an embedded feed overlay supports manual location selection when geolocation is unavailable or skipped.
- `NAV-003` `/posts/new` opens the full-page create missing-pet post flow.
- `NAV-004` `/posts/{postId}` opens the post detail view.
- `NAV-005` `/posts/{postId}/manage?token=...` opens the anonymous post management view through a private link or code.
- `NAV-006` Comments are embedded on the post detail view.
- `NAV-007` Messaging uses a modal or drawer launched from the post detail view.
- `NAV-008` Report abuse uses a modal or drawer launched from feed cards, post detail, comments, or messages where applicable.

## UX Surfaces

### `UX-001` Nearby Feed

- Surface Type: Full page route at `/`.
- Primary Actor: Nearby viewer.
- Purpose: Let users scan missing-pet posts near their current or manually selected location.
- Primary Content: Feed cards with pet photo, pet name, pet type, approximate last-seen area, distance, time since posted, status, and key defining feature snippet.
- Primary Actions: Open post detail, adjust radius, filter by pet type/status/recency, create post, change search location.
- Secondary Actions: Report a post from a card.
- Required States: Empty nearby results, loading feed, location unknown, geolocation denied, query error, mobile stacked layout.
- Adjacent Surfaces: `UX-002`, `UX-003`, `UX-004`, `UX-005`, `UX-010`.
- Must Not Contain: Full create-post form, full comment thread, full message form, moderation queue.

### `UX-002` Location Permission And Manual Location

- Surface Type: Overlay or focused embedded panel owned by `/`, with optional route `/location` if implementation needs direct navigation.
- Primary Actor: First-time viewer.
- Purpose: Request browser location access and provide manual fallback.
- Primary Content: Location permission prompt, current permission state, manual place search, selected location summary.
- Primary Actions: Allow browser location, skip, search/select manual location, confirm selected location.
- Secondary Actions: Return to feed with last known/default location if available.
- Required States: Awaiting permission, granted, denied, browser unsupported, manual search loading, no place results, mobile.
- Adjacent Surfaces: `UX-001`.
- Must Not Contain: Pet post creation, comments, messaging, or account creation.

### `UX-003` Search And Filter Controls

- Surface Type: Embedded section on `UX-001`; may become a drawer on mobile.
- Primary Actor: Nearby viewer.
- Purpose: Narrow nearby results without leaving the feed.
- Primary Content: Radius selector defaulted to `10 km`, pet type filter, status filter, recency sort/filter.
- Primary Actions: Change radius, apply filters, clear filters.
- Secondary Actions: Change search location.
- Required States: Default filters, changed filters, applying filters, no matching results, mobile drawer/collapsed controls.
- Adjacent Surfaces: `UX-001`, `UX-002`.
- Must Not Contain: Freeform post creation, comment composer, message form.

### `UX-004` Create Missing-Pet Post

- Surface Type: Full page route at `/posts/new`.
- Primary Actor: Anonymous poster.
- Purpose: Publish a missing-pet report without requiring an account.
- Primary Content: Required photo upload, pet name, pet type, accessories, defining features, last-seen map picker entry, optional contact/messaging preferences, publish action, privacy note about approximate public location.
- Primary Actions: Add/remove photos, enter pet details, open/select map pin, publish post.
- Secondary Actions: Cancel and return to feed, preview approximate public location, review generated management-link expectations.
- Required States: Empty form, validation errors, photo upload progress/error, map pin missing, publish loading, publish success with private management link/code, mobile.
- Adjacent Surfaces: `UX-001`, `UX-005`, `UX-008`.
- Must Not Contain: Nearby feed results, existing post comments, moderation queue, mandatory account signup.

### `UX-005` Google Maps Last-Seen Pin Picker

- Surface Type: Embedded map section within `UX-004`; may use a full-screen mobile map step.
- Primary Actor: Anonymous poster.
- Purpose: Capture precise last-seen coordinates while communicating approximate public display.
- Primary Content: Google Map, draggable pin, place/address search, selected human-readable location, privacy note.
- Primary Actions: Search place, move pin, confirm last-seen location.
- Secondary Actions: Reset pin, return to post form.
- Required States: Map loading, map API error, place search no results, pin selected, mobile full-screen map step.
- Adjacent Surfaces: `UX-004`.
- Must Not Contain: Feed browsing, comment thread, messaging.

### `UX-006` Post Detail

- Surface Type: Full page route at `/posts/{postId}`.
- Primary Actor: Nearby viewer or helper/respondent.
- Purpose: Show all useful recovery details for a missing-pet report.
- Primary Content: Photo gallery, pet name, pet type, accessories, defining features, approximate last-seen map area, distance from viewer, status, timestamps, comments section, message/contact entry point, report action.
- Primary Actions: Add comment, open message/contact form, report post.
- Secondary Actions: Return to feed, share link if supported.
- Required States: Loading, not found, post removed, comments loading/error, message unavailable, mobile.
- Adjacent Surfaces: `UX-001`, `UX-007`, `UX-008`, `UX-010`.
- Must Not Contain: Full create-post form, feed filter panel as primary content, operator moderation console.

### `UX-007` Comments

- Surface Type: Embedded section on `UX-006`.
- Primary Actor: Helper/respondent.
- Purpose: Let viewers leave public sightings, clarifying questions, or useful updates.
- Primary Content: Comment list, anonymous display name or label, timestamp, comment composer, report-comment control.
- Primary Actions: Submit comment, report comment.
- Secondary Actions: Refresh comments if needed.
- Required States: Empty comments, submitting, validation error, submission failure, comment removed, mobile.
- Adjacent Surfaces: `UX-006`, `UX-010`.
- Must Not Contain: Private messaging thread, global comments feed, account signup requirement.

### `UX-008` Message Or Contact Form

- Surface Type: Modal or drawer launched from `UX-006`.
- Primary Actor: Helper/respondent.
- Purpose: Let viewers send a direct post-related message without implementing real-time chat in v1.
- Primary Content: Message text, optional sender contact field, post context summary, privacy/spam notice.
- Primary Actions: Send message, close/cancel.
- Secondary Actions: Report post if the message context appears unsafe.
- Required States: Empty form, validation error, sending, sent confirmation, send failure, messaging disabled, mobile full-screen drawer/modal.
- Adjacent Surfaces: `UX-006`.
- Must Not Contain: Real-time chat history, unrelated inbox, account signup requirement.

### `UX-009` Anonymous Post Management

- Surface Type: Full page route at `/posts/{postId}/manage?token=...` or equivalent code-based access flow.
- Primary Actor: Anonymous poster.
- Purpose: Let the original poster maintain the report without an account.
- Primary Content: Post summary, status control, management token/link explanation, limited edit controls if supported.
- Primary Actions: Mark missing/found, update selected post details if included in v1, copy/regenerate management link only if safe.
- Secondary Actions: Return to public post detail.
- Required States: Valid token, invalid/expired token, update loading, update error, updated success, mobile.
- Adjacent Surfaces: `UX-006`.
- Must Not Contain: Global account profile, other users' posts, moderation queue.

### `UX-010` Report Abuse

- Surface Type: Modal or drawer launched from feed cards, post detail, comments, or messages where applicable.
- Primary Actor: Nearby viewer, helper/respondent, or site operator intake.
- Purpose: Capture reports for spam, fake posts, unsafe content, harassment, or inappropriate media.
- Primary Content: Target content summary, reason selector, optional detail text, submit action.
- Primary Actions: Submit report, cancel.
- Secondary Actions: None required for v1.
- Required States: Empty form, validation error, submitting, submitted confirmation, submission failure, mobile modal/drawer.
- Adjacent Surfaces: `UX-001`, `UX-006`, `UX-007`, `UX-008`.
- Must Not Contain: Full moderation review queue, account management, post editing.

## Core UX Decisions

- `DEC-UX-001` The first screen is the nearby feed at `/`, with first-time location permission layered over the feed context.
- `DEC-UX-002` Users who deny location permission can manually select a location and still browse.
- `DEC-UX-003` Messaging in v1 is a post-attached contact form, not real-time chat.
- `DEC-UX-004` Creating a post is a full-page route because it includes required photos, detailed pet information, and Google Maps pinning.
- `DEC-UX-005` Public location display is approximate or softened even though exact coordinates are used for distance matching.
- `DEC-UX-006` The dedicated UI artifact is intentionally skipped for now; the Prototype should carry enough visual direction to validate layout and flow before Architecture.

## Acceptance Criteria

- [ ] `AC-UX-001` The UX defines a feed-first web experience with location permission and manual fallback available before or during feed use. Traces to `UX-001`, `UX-002`, `F-001`, `F-002`, `F-003`, `WF-001`.
- [ ] `AC-UX-002` The UX defines radius and filter controls with a `10 km` default and configurable values. Traces to `UX-003`, `F-004`, `F-013`, `WF-002`.
- [ ] `AC-UX-003` The UX defines anonymous post creation as a full-page flow with required photo upload and Google Maps last-seen pinning. Traces to `UX-004`, `UX-005`, `F-005`, `F-006`, `F-007`, `F-008`, `WF-003`.
- [ ] `AC-UX-004` The UX defines a post detail surface with photos, pet details, approximate location map, comments, messaging entry point, and report action. Traces to `UX-006`, `UX-007`, `UX-008`, `UX-010`, `WF-004`, `WF-005`, `WF-006`, `WF-008`.
- [ ] `AC-UX-005` The UX defines anonymous post management through a private link or code so posters can mark a pet as found without accounts. Traces to `UX-009`, `F-012`, `WF-007`, `DEC-002`.
- [ ] `AC-UX-006` Each primary UX surface includes required states, adjacent surfaces, and must-not-contain constraints to prevent collapsing unrelated workflows into one screen. Traces to `UX-001`, `UX-002`, `UX-003`, `UX-004`, `UX-005`, `UX-006`, `UX-007`, `UX-008`, `UX-009`, `UX-010`.
