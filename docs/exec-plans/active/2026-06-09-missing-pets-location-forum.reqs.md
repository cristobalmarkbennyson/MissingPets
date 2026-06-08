# Missing Pets Location Forum - Requirements

- Initiative Slug: `2026-06-09-missing-pets-location-forum`
- Artifact: `Requirements`
- Status: `Approved`
- Related Artifacts:
  - `2026-06-09-missing-pets-location-forum.ux.md`
  - `2026-06-09-missing-pets-location-forum.ui.md`
  - `2026-06-09-missing-pets-location-forum.prototype.html`
  - `2026-06-09-missing-pets-location-forum.architecture.md`
  - `2026-06-09-missing-pets-location-forum.plan.md`
- Last Updated: `2026-06-09`

## Product Intent

`MissingPets` is a web-first, location-aware forum for reporting and discovering missing pets near a viewer. It should feel similar to a social feed: users browse nearby missing-pet posts, open details, comment or message, and create anonymous posts with photos and a map-pinned last-seen location.

The initial product is a web application. Future mobile apps should remain possible, but native mobile delivery is out of scope for the first implementation plan unless explicitly added later.

## Target Users

- `ACT-001` Anonymous poster: any person who wants to report a missing pet without creating an account.
- `ACT-002` Nearby viewer: any person browsing missing-pet reports near their current or chosen location.
- `ACT-003` Helper/respondent: any viewer who comments on or messages about a missing-pet post.
- `ACT-004` Moderator or site operator: an operational role that may be needed later for abuse reports, spam, unsafe content, or takedown workflows.

## Features

- `F-001` Location-aware feed: show missing-pet posts near the viewer, ranked or filtered by distance from the viewer's current or manually selected location.
- `F-002` First-time location prompt: ask first-time web users for browser location access and use the granted location to query nearby posts.
- `F-003` Manual location fallback: allow users who deny or skip browser location access to manually choose a search location.
- `F-004` Configurable search radius: default the feed radius to `10 km`, while allowing the viewer to adjust it.
- `F-005` Anonymous post creation: allow anyone to create a missing-pet post without requiring an account.
- `F-006` Pet report details: collect and display pet name, pet type, accessories, defining features, and last-seen location.
- `F-007` Photo support: require or strongly encourage pet photos in posts so viewers can identify the animal visually.
- `F-008` Google Maps pinpointing: allow the poster to choose the last-seen location using a Google Maps-based map pin.
- `F-009` Post detail view: provide a dedicated view for each missing-pet post with photos, details, last-seen location context, comments, and contact or messaging actions.
- `F-010` Comments: allow viewers to leave comments on posts.
- `F-011` Messaging: allow viewers to send a message to the poster or post contact channel.
- `F-012` Status management: allow a post to be marked as missing or found.
- `F-013` Search and filters: support filtering by pet type, distance, recency, and status.
- `F-014` Abuse and spam handling: provide at least a minimal way to report unsafe, fake, spam, or abusive posts/comments/messages.
- `F-015` Future mobile readiness: avoid web-only product decisions that would make later mobile app support unnecessarily difficult.

## Workflows

- `WF-001` Browse nearby posts: a viewer opens the app, grants or denies location access, and sees nearby missing-pet posts based on current or manually chosen location.
- `WF-002` Adjust feed radius: a viewer changes the search radius from the default `10 km` to another supported value and the feed refreshes accordingly.
- `WF-003` Create anonymous missing-pet post: a poster uploads pet photos, enters pet details, pins the last-seen location on Google Maps, and publishes without creating an account.
- `WF-004` View post details: a viewer opens a feed item and sees all pet details, photos, map context, comments, messaging entry points, and current status.
- `WF-005` Comment on a post: a viewer adds a comment to share possible sightings, clarifying questions, or useful information.
- `WF-006` Message about a post: a viewer sends a more direct/private response to the poster or post contact channel.
- `WF-007` Mark pet found: a poster or authorized post maintainer updates a missing-pet report status to found.
- `WF-008` Report abuse: a viewer reports a post, comment, or message for moderation.

## Data Requirements

- `DATA-001` Pet post fields must include pet name, pet type, accessories, defining features, last-seen coordinates, last-seen human-readable location, status, created timestamp, and updated timestamp.
- `DATA-002` Pet posts must support one or more pet photos.
- `DATA-003` Last-seen location must support distance-based querying against the viewer's location.
- `DATA-004` Viewer location may come from browser geolocation or manual selection.
- `DATA-005` Comments must be associated with a post and support anonymous authorship unless the authentication model changes later.
- `DATA-006` Messaging must be associated with a post and support anonymous sender behavior unless the authentication model changes later.
- `DATA-007` Abuse reports must record the target content, reason, timestamp, and enough operational context for moderation.

## Assumptions

- `ASM-001` The first release is a web application only.
- `ASM-002` Posting is anonymous; no account is required to publish a missing-pet report.
- `ASM-003` Browsing is public.
- `ASM-004` The default nearby radius is `10 km`.
- `ASM-005` Users can configure their search radius.
- `ASM-006` Google Maps is the intended mapping provider for last-seen location selection.
- `ASM-007` Future mobile apps are desired but not part of the first implementation.
- `ASM-008` Because posting, comments, and messaging are anonymous, moderation and abuse prevention are product requirements rather than optional polish.
- `ASM-009` Each published post should require at least one pet photo.
- `ASM-010` Anonymous posters should receive a private management link or code after posting so they can update the post or mark the pet as found without creating an account.
- `ASM-011` Distance queries may use precise last-seen coordinates, but the public map display should show an approximate location or softened pin area by default to reduce privacy risk.

## Constraints

- `CON-001` The app must handle denied browser location permission gracefully.
- `CON-002` The app must not require users to create an account before posting in the first release.
- `CON-003` Distance queries must be based on post last-seen coordinates, not poster home address or profile location.
- `CON-004` Google Maps usage requires API key management and provider-specific billing/runtime configuration.
- `CON-005` Photo upload and display must consider file size, storage cost, and inappropriate content risk.
- `CON-006` Public display of precise location data should be treated carefully because missing-pet reports may reveal sensitive home or neighborhood information.

## Out Of Scope For Initial Release

- `OOS-001` Native mobile applications.
- `OOS-002` Mandatory user accounts.
- `OOS-003` Full social-network features unrelated to missing-pet recovery.
- `OOS-004` Payments, rewards, or bounties.
- `OOS-005` Automated image recognition or pet matching.
- `OOS-006` Complex moderation console unless later added during architecture or plan refinement.

## Decisions

- `DEC-001` Pet photos are required for publishing an initial missing-pet post. This improves identification quality and discourages low-effort spam.
- `DEC-002` Anonymous post ownership is handled with a private management link or code issued after publishing. This supports status updates without mandatory accounts.
- `DEC-003` Public location display should be privacy-aware: use the precise last-seen coordinates for radius queries, but show an approximate public location or softened map area unless the product later decides otherwise.

## Open Questions

- `Q-002` What radius values should be available beyond the `10 km` default?
- `Q-004` Should messaging expose contact information, use an in-app relay, or use a post-specific contact form?
- `Q-006` What moderation level is acceptable for the first release: report-only, pre-moderation, spam filtering, or operator review queue?

## Success Criteria

- `SC-001` A first-time viewer can grant location permission and immediately see posts within the default `10 km` radius when matching posts exist.
- `SC-002` A viewer who denies location permission can still choose a location manually and browse nearby posts.
- `SC-003` A poster can create an anonymous missing-pet post with photos, required pet details, and a Google Maps-pinned last-seen location.
- `SC-004` A viewer can adjust the radius and see results update based on distance from the selected location.
- `SC-005` A viewer can open a post detail view, inspect photos and details, and comment or message.
- `SC-006` A post can be marked found so users can distinguish active missing reports from resolved reports.
- `SC-007` Users can report abusive or unsafe content.

## Acceptance Criteria

- [ ] `AC-REQ-001` The approved requirements define anonymous posting, required photo support, comments, messaging, configurable radius with `10 km` default, Google Maps last-seen pinning, and web-first scope. Traces to `F-001`, `F-004`, `F-005`, `F-007`, `F-008`, `F-010`, `F-011`, `ASM-001`, `ASM-009`.
- [ ] `AC-REQ-002` The approved requirements define both browser geolocation and manual location fallback behavior. Traces to `F-002`, `F-003`, `WF-001`, `CON-001`.
- [ ] `AC-REQ-003` The approved requirements define the minimum pet post data needed for distance queries and post display. Traces to `F-006`, `DATA-001`, `DATA-002`, `DATA-003`.
- [ ] `AC-REQ-004` The approved requirements identify moderation, privacy, and anonymous-post ownership as risk-bearing areas that must be handled in UX and architecture. Traces to `F-014`, `CON-006`, `DEC-002`, `DEC-003`, `Q-006`.
