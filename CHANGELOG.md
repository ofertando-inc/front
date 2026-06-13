# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Store autocomplete on the offer form: the free-text "store" field becomes a `StoreCombobox` that searches the store referential (`GET /stores`) and, for a new address, geocodes it (`GET /stores/geocode`) and find-or-creates the store (`POST /stores`) on selection — returning a `storeId`. Picking a store copies its name into the form and its city for local offers, and links the offer via the new optional `storeId`; verified stores are flagged in the dropdown. New `Offer.store` (`OfferStore`) and `CreateOfferDto.storeId`, zod schema + server form mapping, `createDeal.storeGeocodeGroup` / `storeVerified` / `storeSearching` keys in the three languages, and e2e coverage.
- Stores domain foundation for the post-MVP geo evolution: a `store` API client (`searchStores`, `getStore`, `createStore`, `geocode`) over the BFF with `StoreResponse` / `OfferStore` / `GeocodeSuggestion` / `CreateStoreDto` types, plus `store.not_found` / `geocoding.unavailable` error keys localized in Spanish, English, and French. Unit-tested (query/body shape, id encoding). No UI yet.

## [1.0.0] - 2026-06-12

### Added

- City autocomplete and validation on the offer form, backed by a bundled dataset of ~1,100 Colombian municipios (offline, no external API): a searchable `CityCombobox` (type "mede" → "Medellín", with the department shown to disambiguate homonyms) replaces the free-text city input for local offers. The city is validated against the list and normalized to its canonical form before submit (e.g. "medellin" → "Medellín"), with an `unknownCity` field error; online offers hide the city field entirely and ship a `Nacional` sentinel (switching an offer to local makes the city required). New `cities` helper (`normalizeCity` / `isKnownCity` / `searchCities`), unit-tested, plus schema and e2e coverage.
- Static Terms and Privacy pages (`/terms`, `/privacy`) with localized content (a shared `LegalArticle` component and a `legal` i18n namespace in the three languages), linked from the footer.
- Profile editing via `PATCH /users/me` (`updateMe` + an `UpdateMeDto`): an "Edit profile" modal on the profile page lets the user change their username, email and password. Only changed fields are sent (an empty new-password keeps the current one), changing the email or password requires the current password (mirrored client-side for instant feedback), and field-level errors are surfaced — `user.current_password_required` / `user.invalid_current_password` (new keys) on the current-password field, `user.username_taken` / `user.email_taken` on their fields — through `resolveAuthError`'s new `editProfile` context. The auth store gains a `setUser` so the header reflects the update immediately. New `auth.genericUpdateError` and `profile` form keys localized in the three languages; error mapping and an authenticated e2e cover it.
- Offer categories (many-to-many) end to end: a `Category` / `OfferCategory` type with the 12 frozen backend slugs, a `getCategories` API client (`GET /categories`, unit-tested), and a localized `categories` i18n namespace (es/en/fr) resolved by slug with a `categoryLabel` fallback to the backend name. Offers now carry `categories`, rendered as chips on the deal card; the listing gains a data-driven category filter (from the facets endpoint); and the create/edit form gains a required multi-select category picker (`categoryIds`, at least one) wired through the zod schema, the server form mapping, and both page loads, with a new `offer.invalid_category` error key localized in the three languages. Schema, API and an authenticated form e2e cover it.
- Data-driven listing filters from the backend facets endpoint (`GET /offers/facets`): the city dropdown now reflects the live catalogue with match counts (e.g. "Bogotá (12)") instead of a hardcoded list, and a new store filter is added alongside it. New `OfferFacets` / `FacetValue` / `CategoryFacet` types and a `getOfferFacets` API client function (unit-tested), plus `deals.filterStore` / `allStores` keys localized in Spanish, English, and French.
- Offer search and richer listing controls aligned with the backend's search contract: `GET /offers` now accepts `q` (case-insensitive search over title / description / store), `store`, `category`, and `includeExpired`, plus an `ending` sort (soonest to finish first). The global header search bar is wired to deep-link into `/deals?q=…`, the listing shows an active-search chip with a clear button and a localized result count from the new `total` field (`CountedPaginatedResult`), and the filter bar gains a "soonest to end" sort and an "hide expired" toggle. New `deals.sortEnding` / `hideExpired` / `resultsCount` / `searchResultsFor` / `clearSearch` keys localized in Spanish, English, and French. Query serialization unit-tested.
- Comment reporting: users can report a comment via a `CommentReportModal` (reasons `SPAM` / `ABUSE` / `OFF_TOPIC` / `MISINFORMATION` / `OTHER` plus an optional note), wired on every comment and reply that is not the viewer's own and not removed. Anonymous reporters are redirected to `/login`, and the action switches to a localized "reported" state after submitting. New `reportComment` / `getMyCommentReport` API client functions and a `comment.not_reportable` error key, all localized in Spanish, English, and French. Unit-tested.
- Moderator-hidden comments: `CommentResponse` now carries `hidden`, and the thread renders a distinct placeholder — "removed by the author" (`deleted`) vs "hidden by a moderator" (`hidden`) — while keeping the tombstone in place when it still has replies. Edit / delete / reply / report are all disabled on removed comments.
- E2E smoke coverage: an authenticated user reports a comment through the modal and sees the "reported" state, and a moderator-hidden comment shows its distinct placeholder.
- Admin moderation API and types (`CommentModerationSummary`, `ReportDetail`, `ReportStatus`, paginations) plus `listAdminComments`, `hideComment`, `dismissComment`, `restoreComment`, `listAdminCommentReports`, `listAdminOfferReports`, and `dismissOffer`. Unit-tested.
- Admin comment-moderation tab (`/admin/comments`): a paginated queue (most reported first) showing the comment, author, offer link, and report count, with hide / dismiss actions that drop the row from the queue and a lazy "view reports" expansion that lists each report's reason, note, reporter, and date.
- Decision actions on the admin offer-reports tab: each reported offer can be dismissed (reports cleared, offer returns to active) or disabled, both resolved per offer so every row of that offer leaves the now `PENDING`-only queue.
- E2E smoke coverage for the moderation queues: an admin dismisses an offer report and empties the queue, and lists the comment queue, expands a comment's report details, and hides it.
- Moderation summary API (`getModerationSummary` → `{ pendingComments, pendingOfferReports }`) feeding a shared store, plus an `/admin` dashboard with queue stat cards and sidebar count badges.

### Changed

- The offer detail "share" button now works instead of being a no-op: it opens the native share sheet where available and otherwise copies the offer link to the clipboard with an "Enlace copiado" confirmation (check icon). New `deal.shareCopied` key in the three languages.
- Reworked the global header: the primary navigation (Home / Explore) now sits next to the brand with the search bar centered and the account actions on the right, and the mobile menu was restructured into clear sections — search, navigation, account, language — separated by dividers. New `common.explore` key.
- Wired the profile "my comments" and "my votes" tabs to the backend (`GET /users/me/comments` and `/users/me/votes`, cursor-paginated) via a new `getMyComments` / `getMyVotes` API client and `MyComment` / `MyVote` types. Each tab lazy-loads on first open and lists the activity linking to its offer — comments show the content, date, score, reply count, an `(edited)` marker and a moderator-hidden indicator; votes show the up/down direction and the offer's current score — with a "load more" button and localized empty/error states. Replaces the previous "coming soon" placeholders (the now-dead `profile.comingSoon` key was removed and the empty-votes copy refreshed). API and an authenticated e2e cover it.
- Wired the profile stat cards to real data from `GET /users/me/stats` (`getMyStats` + a `UserStats` type): the "offers" and "comments" counters now show the backend totals instead of a placeholder `0` and the loaded-page length, and the reputation card was removed along with its now-dead `profile.reputation` i18n key. E2E asserts the rendered counts and the absence of the reputation card.
- Redesigned the `/admin` panel into a dashboard with a sidebar (Overview / Offers / Reports / Comments): `/admin` is now an overview with stat cards and quick links, the offers management page moved to `/admin/offers`, the nav carries live count badges from the moderation summary, and the queue tables were refined (subtle elevation, hover rows, tabular-number counts, clamped comment content).
- New product-wide design foundations ("Mercado vibrante" direction): self-hosted Bricolage Grotesque (display) and Hanken Grotesk (body) fonts, a warm cream background with charcoal text, and `heat` / `savings` colour scales added to the theme. Headings now use the display font. The global header, footer, and error page were restyled to the warmer palette (frosted warm header, gradient brand mark, cream search fields).
- Redesigned the home page in the "Mercado vibrante" direction: a two-column hero on a warm gradient-mesh background (live-community eyebrow with a pulsing dot, display headline, comfortable-measure subtitle, pill CTAs, and a floating decorative deal cluster with subtle motion that respects `prefers-reduced-motion`), gradient icon tiles on the "hot deals" (heat) and "recently added" (primary) section headers, and pill-style popular-store chips with a hover lift. New `home.heroEyebrow` key localized in Spanish, English, and French.
- Redesigned the deals listing and the shared deal card in the "Mercado vibrante" direction: warm rounded cards with the Bricolage display title, a hover lift, and pill type tags; a flame on hot deals (score over 100°) in the vote panel; the listing header now pairs a gradient icon tile with the display title; and a warmer empty state. The filter bar became compact warm pills (city / type / sort segmented control / period) — fixing the stray "Choose option …" placeholder and showing translated online/local type labels.

### Removed

- The non-functional "Popular stores" section on the home page and the placeholder "Contact" footer link, along with their now-dead `home.popularStoresTitle` / `footer.contact` i18n keys and the `MOCK_POPULAR_STORES` sample data.

### Fixed

- Restored the pointer cursor on enabled buttons (Tailwind v4's reset no longer sets it by default), so every clickable button shows the hand cursor again.

## [0.7.0] - 2026-06-01

### Added

- Comment domain types (`CommentResponse` with a nullable `content` tombstone, `replyTo`, `score`, `userVote`, `PaginatedComments`, `CreateCommentDto`, `UpdateCommentDto`, `CommentVoteResponse`) and the `comment.not_found` / `comment.forbidden` / `comment.offer_not_commentable` error keys with localized messages in Spanish, English, and French. `Offer` now carries `commentCount`.
- Comments API client (`src/lib/api/comments.ts`) exposing `listComments`, `listReplies`, `createComment`, `updateComment`, and `deleteComment`, with cursor pagination, id encoding, and a `comment` context for `resolveOfferError`. Unit tested for query/body shape, id encoding, and error propagation.
- Comment thread on the offer detail page replacing the previous mock list: a localized `comments` namespace, a `CommentThread` that loads paginated root comments and posts new ones (anonymous posters are redirected to `/login`), `CommentItem` rendering with author, locale-aware date, `(edited)` marker, and a `[deleted]` tombstone placeholder, and a `💬 commentCount` indicator on the detail header and on every `DealCard`.
- One-level flat threading via `CommentNode`: lazy-loaded, paginated replies shown oldest-first, inline reply composer, author/admin inline edit and delete (with tombstone-or-remove handling driven by the DELETE response), and replies to a reply (the reply targets that comment's id and the backend flattens it under the root, with an "in reply to @user" label rendered from `replyTo`). A thread with a single reply shows it by default; threads with two or more stay collapsed behind a "view replies" toggle.
- Up/down voting on comments (same contract as offer votes): `voteComment` / `removeCommentVote` on `/comments/:id/votes`, and an optimistic arrows-and-score control on every comment and reply that highlights the viewer's vote, flips on the opposite arrow, removes the vote on the active arrow, and redirects anonymous voters to `/login`.
- E2E smoke coverage for the comment thread: anonymous visitors see the thread and a tombstone placeholder and are redirected to `/login` when they try to post or vote, and an authenticated user can post a comment and toggle a vote on it.

## [0.6.0] - 2026-05-31

### Added

- `isOfferExpired(offer)` helper applying the backend's OR-date rule: an offer is treated as expired when its status is `EXPIRED` or its `endDate` is in the past, so a slightly lagging status never shows a stale "live" offer. Unit-tested across status, past/future dates, the exact boundary, and unparseable dates.
- Expired offers (now returned publicly by the backend) render greyed out on the listing and detail pages, driven by `isOfferExpired` rather than the raw status.

### Changed

- Vote and report controls are proactively disabled on the offer detail page when the offer is expired, with a localized tooltip on the report button, instead of relying solely on the backend's `vote.offer_not_voteable` / `report.offer_not_reportable` rejection.
- The home page hot-deals and recent-deals rows now exclude expired offers: they over-fetch, drop anything expired by the OR-date rule, then trim to the display count, keeping the curated rows full of live deals while `/deals` still shows expired offers greyed.

### Fixed

- Offer create/edit now sends `startDate` / `endDate` as ISO 8601 UTC. New `localInputToUtcIso` / `utcIsoToLocalInput` helpers convert the naive `datetime-local` picker value in the browser (correct timezone and DST), the `OfferForm` rewrites the outgoing payload on submit and re-localizes the pickers if server validation fails, and the offer schema now accepts UTC datetimes. Previously the raw local picker string was sent verbatim, so offers expired at the wrong moment for any user not in UTC.

## [0.5.0] - 2026-05-29

### Added

- Admin domain types (`AdminListOffersQuery`, `ReportSummary`, `PaginatedReports`, `PublicUser`) aligned with the backend `/admin/*` contract.
- Admin API client (`src/lib/api/admin.ts`) exposing `listAdminOffers` (with the admin-only `status` filter), `disableOffer`, `restoreOffer`, `listAdminReports`, `disableUser`, and `restoreUser`. Unit tests cover query serialization, id encoding, and `auth.forbidden` / `auth.unauthorized` propagation.
- Server-side admin guard (`requireAdmin`) wired through `/admin/+layout.server.ts`: it probes the session over the BFF, refreshes once on 401, redirects anonymous visitors to `/login`, and returns a 403 for authenticated non-admins so admin content never renders for them.
- `/admin` section with a shared shell and tabbed navigation (Offers, Reports), a localized `admin` translation namespace in Spanish, English, and French, and an `ADMIN`-gated "Administration" link in the header dropdown and mobile menu.
- Admin offers tab: a paginated, status-filterable table with disable/restore offer actions (the returned offer replaces the row) and a confirmation-gated "disable author" action that calls `PATCH /admin/users/:id/disable`.
- Admin reports tab: a paginated list of report summaries (offer link, reason, comment, reporter, date) reusing the localized report-reason labels.
- E2E smoke coverage for the admin panel: anonymous visitors are redirected to login, authenticated non-admins receive a 403, and an admin can list offers, disable one, and view pending reports.

### Fixed

- API requests now send `cache: 'no-store'`, so cookie-authenticated GET reads (e.g. `/offers/:id/reports/me`) are never replayed from the browser HTTP cache. Previously, after an admin restored an offer, the detail page could show a stale "already reported" state until a hard refresh.

### Security

- The public offer detail and listing now only ever surface `ACTIVE` offers (backend change): disabling an offer removes it from the public routes immediately, and reported/disabled/expired offers return a 404 to anonymous and regular users.

## [0.4.0] - 2026-05-28

### Added

- Report domain types (`ReportReason`, `CreateReportDto`, `OfferReportResponse`, `MyReportResponse`) aligned with the backend `/offers/:id/reports*` contract, plus a new `report.offer_not_reportable` error key with localized messages in Spanish, English, and French.
- Reports API client (`src/lib/api/reports.ts`) exposing `submitReport` and `getMyReport`, with cookie-based auth and offer-id URL encoding. Unit tests cover request shape (with and without the optional comment), response parsing, error propagation, and id encoding.
- Localized `offer.genericReportError` fallback for the new `report` context of `resolveOfferError`.
- Localized `report` translation namespace with the modal copy (title, description, reason label/placeholder, comment label/placeholder/hint, submit, cancel, already-reported, generic error) and the five `ReportReason` labels (`EXPIRED`, `UNAVAILABLE`, `INCORRECT_INFO`, `SCAM`, `OTHER`) in Spanish, English, and French.
- `ReportModal` component composing Flowbite `Modal`, `Select`, and `Textarea`, with optimistic submit, disabled state while in flight, inline error banner for `report.offer_not_reportable`, and a server-status callback so the page can update `offer.status` immediately when the moderation threshold is hit.
- Offer detail page wires the existing `FlagOutline` action to the `ReportModal`, gated to authenticated visitors (the button is hidden for anonymous ones).
- Initial user-report load on the offer detail page: `loadOffer` parallelizes `getOfferById` and `getMyReport` so the report button mounts already reflecting the authenticated visitor's prior report. Anonymous visitors and 401 responses fall back silently.
- When the visitor has already reported the offer, the action swaps to a filled-red `FlagSolid` icon, becomes `disabled`, and exposes the localized "already reported" label via `aria-label` and `title`.
- E2E smoke coverage for the report flow: authenticated user opens the modal, picks a reason, submits, sees the REPORTED banner appear and the action switch to the already-reported state. Anonymous visitor never sees the report button.

### Changed

- CI now caches Playwright browser binaries under `~/.cache/ms-playwright`, keyed by the `@playwright/test` version resolved at runtime. The browser-binary install runs only on cache miss with a 10-minute timeout, and the system-dependency install runs on every job (apt is not cachable) with a 5-minute timeout. Replaces the single `npx playwright install --with-deps chromium` step that occasionally hung silently after the download finished and was never bounded by a step timeout.

## [0.3.0] - 2026-05-27

### Added

- Vote domain types (`VoteType`, `OfferVoteResponse`, `MyVoteResponse`) aligned with the backend `/offers/:id/votes*` contract, plus a new `vote.offer_not_voteable` error key with localized messages in Spanish, English, and French.
- Votes API client (`src/lib/api/votes.ts`) exposing `castVote`, `removeVote`, and `getMyVote`, with cookie-based auth and offer-id URL encoding. Unit tests cover request shape, response parsing, error propagation, and id encoding.
- Localized `offer.genericVoteError` fallback for the new `vote` context of `resolveOfferError`.
- Offers now expose `userVote` in listing and detail responses so every `DealCard` and detail `VotePanel` mounts with the authenticated visitor's current vote.
- E2E smoke coverage for the vote flow: authenticated user toggles their up-vote (15° → 16° → 15° with `aria-pressed` switching), anonymous visitor sees the localized auth error and the score stays unchanged.

### Changed

- `VotePanel` switched from local-only optimistic state to backend-driven votes. The component now takes `offerId` and `initialUserVote`, applies an optimistic update on click, calls `POST /offers/:id/votes` (or `DELETE` to toggle off), reconciles with the server-returned `{ score, userVote }`, and rolls back with a localized inline error when the request fails. Buttons are disabled while a vote request is in flight. Anonymous clicks short-circuit with the `auth.unauthorized` message without firing a request.
- Offer detail now uses `createdByUsername` for author display and reads `userVote` directly from the offer payload, removing the parallel `getMyVote` fetch during detail loading.

## [0.2.0] - 2026-05-26

### Added

- Offer domain types (`Offer`, `OfferStatus`, `OfferSort`, `OfferPeriod`, `PaginatedOffers`, `CreateOfferDto`, `UpdateOfferDto`, `ListOffersQuery`) aligned with the backend `/offers/*` contract.
- New error keys for the offers and pagination namespaces (`offer.not_found`, `offer.forbidden`, `offer.invalid_dates`, `offer.invalid_status_transition`, `pagination.invalid_cursor`) plus their localized messages in Spanish, English, and French.
- Validation dictionaries for the offer fields (`title`, `description`, `offerType`, `externalUrl`, `storeName`, `city`, `startDate`, `endDate`) covering the `isString`, `isNotEmpty`, `maxLength`, `isUrl`, and `isDateString` constraints in the three locales.
- Offers API client (`src/lib/api/offers.ts`) exposing `listOffers`, `getMyOffers`, `getOfferById`, `createOffer`, `updateOffer`, and `deleteOffer` on the `/offers/*` backend contract, with cursor-aware query serialization and `204 No Content` tolerance for delete.
- Unit tests for the offers API client covering query serialization, id encoding, payload bodies, `offer.not_found` / `offer.invalid_dates` / `offer.forbidden` error propagation, and the 204 delete path.
- Offer error resolver (`src/lib/offers/offerErrors.ts`) that turns an `ApiError` into a banner message and per-field errors for the `browse`, `create`, `update`, and `delete` contexts, mirroring the auth error resolver pattern.
- Localized `offer` translation namespace with contextual generic and server-error fallbacks for offer browse, create, update, and delete failures.
- Unit tests for the offer error resolver covering each offer key, validation details, 5xx fallbacks, unknown keys, and non-`ApiError` throws per context.
- Localized `offerStatus` namespace mapping each `OfferStatus` value to its Spanish, English, and French label.
- Offer mock dataset (`src/lib/data/mockDeals.ts`) of nine `Offer` records spanning every status, used for local development, fakes on the detail page, and the popular-stores section.
- `DealStatusBadge` component wrapping Flowbite `Badge`, mapping each `OfferStatus` to a coherent color (green/yellow/red/gray/secondary) and the locale-aware label from the `offerStatus` namespace.
- `VotePanel` component with optimistic local toggle state for up/down votes (state-only, no backend persistence yet), three sizes, hot-deal coloring above 100, and localized `aria-label`s for screen readers.
- `DealCard` component composing Flowbite `Card`, `DealStatusBadge`, and `VotePanel` with a localized type badge (online/local), store and city footer, and an expiration date formatted via `Intl.DateTimeFormat` in the current locale.
- `DealFilters` component composing Flowbite `Select` and `ButtonGroup`: city and offer-type dropdowns (with an "all" option), a recent/popular sort toggle, and a contextual period dropdown that appears only when sorting by popularity. Values are exposed via `$bindable` props.
- `home` translation namespace and extended `deals` namespace with the listing title, load-more, and empty-state copy in Spanish, English, and French.
- `DealCardSkeleton` component that mirrors the `DealCard` layout with pulse-animated gray blocks (vote column, badges, title, description, footer) and an `aria-busy` flag for screen readers.
- Placeholder `/deals/[id]`, `/deals`, and `/create-deal` routes so the typed `resolve()` helper accepts the deal detail link from `DealCard` and the home CTAs while the full pages were being built.
- Full `/deals` listing page composing `DealFilters` and a `DealCard` grid backed by cursor pagination. Filter changes reset the cursor through an `$effect`, the load-more button is hidden when the next cursor is null, expired sessions and unknown errors surface via `resolveOfferError`, and a `pagination.invalid_cursor` response silently refetches the first page.
- E2E smoke test that visits `/deals` and asserts the listing heading plus the recent/popular sort buttons.
- Full `/deals/[id]` detail page with a localized two-column layout (status badge, store/city/expiration meta, vote panel, external store CTA, description, author and share/report icons), a moderated status banner for `EXPIRED` / `DISABLED` / `REPORTED` offers, mocked comments, and a related-offers sidebar that filters out the current offer.
- `offer.not_found` 404 fallback on the detail page with a back-to-listing button, plus loading skeletons for both the main card and the related sidebar.
- `deal` translation namespace with the detail-page strings (CTA, banners, mock comments, related and comments titles) in Spanish, English, and French.
- Graceful error fallback on the offer detail page that shows a localized "go back" card when the fetch fails for a reason other than `offer.not_found`, preventing a blank screen when the API is unreachable.
- E2E smoke test asserting the detail page renders a usable fallback when the requested offer id cannot be loaded.
- Mutex-protected refresh-on-401 retry inside `apiRequest`: a single failing call triggers `POST /auth/refresh` (cookie-driven), retries the original request once on success, and bypasses the refresh dance for `/auth/*` endpoints so that login validation errors surface cleanly.
- `refreshSession()` and `logout()` helpers in the auth API wired on the new `/auth/refresh` and `/auth/logout` endpoints.
- Cookie session contract documentation in `.env.example`, including the backend requirements (`Set-Cookie` on `access_token`/`refresh_token`, `Access-Control-Allow-Credentials: true`, frontend origin in `CORS_ORIGINS`) and the rule that no token is ever stored client-side.
- E2E regression that visits the home page and asserts no key containing "token" is persisted in `localStorage`, guarding against future reintroduction of client-side token storage.
- `sveltekit-superforms` and `zod` as runtime dependencies for the offer mutation forms.
- SvelteKit BFF catch-all proxy at `src/routes/api/[...path]/+server.ts` that forwards every browser request to the backend, copying request headers and cookies, and rewriting the refresh cookie `Path=/auth` to `Path=/api/auth` so the cookie scope follows the proxied path. The browser never talks to the backend directly anymore.
- Shared Zod offer validation schema for create and update flows, including localized constraint keys for title, description, type, URL, store, city, and date ordering/future-date validation.
- `/create-deal` server-action form with Superforms, Flowbite fields, server-side auth guard, BFF-backed `POST /api/offers`, translated validation errors, and redirect to the created offer detail page.
- `/deals/[id]/edit` server-action form reusing the create form, loading the existing offer server-side through the BFF, enforcing author ownership before render and before patch, and submitting `PATCH /api/offers/[id]`.
- Author-only edit and delete controls on the offer detail page. Delete uses a Flowbite confirmation modal, a named SvelteKit server action, `DELETE /api/offers/[id]`, translated failures, and redirects back to `/deals` after success.
- Reusable server helpers for offer form defaults, date conversion, backend validation-error mapping, authenticated session probing, and author ownership checks.
- Playwright smoke coverage for unauthenticated access to `/create-deal` and `/deals/[id]/edit`, backed by a lightweight mock backend so server-side guards receive deterministic `401` responses.
- Profile "My offers" tab backed by `GET /api/offers/mine`, rendering a responsive `DealCard` grid, loading skeletons, localized error retry state, and a first-offer empty state linking to `/create-deal`.
- Author actions on profile offer cards with a kebab menu for edit and delete, plus a Flowbite confirmation modal that calls `DELETE /api/offers/[id]` and updates the grid after success.
- Authenticated header CTA linking to `/create-deal`, available on both desktop and mobile navigation.
- Global Flowbite footer with localized copyright, terms, privacy, and contact placeholder links.
- Playwright smoke coverage for the authenticated empty profile offers state, using the mock backend to simulate a cookie-authenticated user without offers.

### Changed

- Dev and staging deploy workflows now run under dedicated `dev` and `staging` GitHub Environments, surfacing every deployment in the repo's Deployments tab alongside production and unlocking per-environment secrets, variables, and reviewer rules.
- Rewrote the home page with a localized hero (title, subtitle, explore and publish CTAs), a hot-deals row fetched with `sort=score&period=week&limit=3`, a recent-deals row fetched with `sort=date&limit=6`, and a popular-stores chip section. Skeletons cover the fetch latency and failures degrade silently to empty grids.
- Home e2e smoke test now asserts the new hero heading and the hot/recent section titles while keeping the header-driven login/register link assertions.
- API client now ships `credentials: 'include'` on every request so the browser carries the `access_token` cookie set by the backend.
- Offers API client drops the explicit bearer-token parameter from every function; authentication is carried entirely by the session cookie.
- Auth API now returns the `User` directly on `/auth/login` and `/auth/register`; cookies carry the tokens.
- Layout, profile page, and header use the cookie-based session: the layout boots a `loadCurrentUser()` probe with a silent catch, the profile page always probes the session before deciding to redirect, and the header awaits the logout API call before navigating home.
- API client always targets `/api/*` from the browser (the SvelteKit BFF). The runtime `window.APP_CONFIG.API_URL` mechanism is removed: `app.html` no longer loads `config.js`, the global type is dropped from `app.d.ts`, `static/config.js` is deleted, and the Docker entrypoint no longer generates a config file.
- Docker entrypoint reduced to a minimal `exec node build` since per-environment runtime configuration moved to a server-side `BACK_URL` environment variable.
- All three docker-compose files (dev, staging, prod) now use `BACK_URL` instead of `PUBLIC_API_URL`. The variable is server-side only, never exposed to the browser. Dokploy services must rename the env var when this is merged.
- `.env.example` now documents the BFF pattern and the role of `BACK_URL` (server-side, never readable by JavaScript in the browser).
- Playwright web server configuration provides a local `BACK_URL` during e2e tests, keeping server-side BFF routes testable without the real backend.
- Docker/npm setup: `npm ci` no longer downloads Playwright browser binaries during Docker builds. `prepare` only runs `svelte-kit sync`, e2e browser installation is explicit, and the production install uses `--ignore-scripts`.
- Migrated Flowbite Svelte components off deprecated props: `DropdownItem` (`liClass`), `FooterLink` (`liClass`, `aClass`), and `FooterCopyright` (`aClass`, `spanClass`) now use the canonical `class` / `classes={{ ... }}` API across `AppHeader`, `AppFooter`, and the profile page.
- Migrated Tailwind classes to the v4 canonical syntax: `!important` modifiers moved from the prefix form (`!max-w-full`, `!p-0`) to the suffix form (`max-w-full!`, `p-0!`), and `flex-grow` was renamed to `grow` across `DealCard`, `DealCardSkeleton`, `AuthForm`, the offer detail page, and the profile page.

### Removed

- Legacy `AuthResponse` type along with the `accessToken` field and the `localStorage` token persistence from the auth store; the client store is now a thin `{ user, isAuthenticated, isLoading }` shape backed by HTTP-only cookies.

### Fixed

- `DealCard` and `DealCardSkeleton` now stretch to the full width of their grid cell so the card layout stays robust when the listing grid switches to fewer columns or wider cells.
- `DealCard` now accepts an optional actions snippet so page-specific controls can be injected without duplicating the card layout.
- Offer create/edit form fields now use the lighter auth-form visual treatment, and the description textarea is taller and resizable for longer deal details.
- Offer description textarea now matches the title input width by forcing `block w-full`, working around the Flowbite `Textarea` not inheriting the same wrapper as `Input`.

## [0.1.0] - 2026-05-16

### Added

- SvelteKit + TypeScript application scaffold with Tailwind v4, Flowbite Svelte, Vitest, and Playwright.
- Typed i18n store supporting Spanish, English, and French with locale persistence in `localStorage`.
- Spanish as the default UI locale with proper accents across every translated string.
- Domain types (`User`, `AuthResponse`, `UserRole`, `UserStatus`) aligned with the backend contract.
- Fetch-based API client with typed `ApiError`, JSON helpers, and `PUBLIC_API_URL` resolution.
- Auth Svelte store handling login, register, logout, current-user loading, and token persistence in `localStorage` with SSR-safe initialization.
- `AppHeader` Flowbite navbar with brand, language switcher, responsive search input, and an auth-aware user menu.
- Shared `AuthForm` component composing the Flowbite `Input`, `Label`, and `Button` primitives.
- `/login` page connected to the live dev backend with loading and error states.
- `/register` page connected to the live dev backend with duplicate email, duplicate username, and validation error handling.
- `/profile` page protected on the client side that displays the authenticated user and placeholder activity tabs.
- Auth session restore on page refresh.
- Redirect of already-authenticated visitors away from `/login` and `/register`.
- Redirect to the home page after logout.
- Error key catalog synced with the backend `error-keys.ts` covering the `auth.*`, `user.*`, `validation.*`, `db.*`, and `error.*` namespaces.
- Localized error messages in Spanish, English, and French for every known error key, with a generic fallback for unknown keys.
- Per-field validation dictionary mapping `(field, constraint)` tuples to localized text, including the system `whitelistValidation` constraint.
- `getErrorMessage` and `getFieldErrorMap` helpers to translate the structured `{ key, statusCode, details }` backend error contract.
- `resolveAuthError` helper that turns an `ApiError` into a banner message and per-field errors, routing `user.email_taken` and `user.username_taken` to the matching input.
- Unit tests for the auth error resolver covering invalid credentials, taken email and username, validation details, and unknown-key fallbacks.
- Rate-limit cooldown on the login and register forms: on a 429 `error.too_many_requests` the submit button is disabled, the banner shows a localized countdown, and the wait honors the backend `Retry-After` header (falling back to 60 seconds).
- `Retry-After` parsing on `ApiError.retryAfterSeconds` and a `formatRateLimitedMessage` helper with unit tests covering both.
- `static/config.js` as the local-development placeholder shipped to the browser; the Docker entrypoint overwrites the file at container boot with the value of the `PUBLIC_API_URL` environment variable.
- Per-environment Docker Compose files (`docker-compose.dev.yml`, `docker-compose.staging.yml`, `docker-compose.prod.yml`) aligned with the backend convention: image pinned per environment, attached to the external `dokploy-network`, runtime env vars supplied by the Dokploy service configuration.
- Localized 404 and generic-error page (`src/routes/+error.svelte`) that displays the HTTP status, a context-appropriate Spanish/English/French message, and a `Volver al inicio` action button.
- `Confirmar contraseña` field on the register form with client-only validation that surfaces a localized error under the field when the two passwords do not match, without sending the extra field to the backend.
- Unit tests for the API client error handling.
- Unit tests for the auth store covering initialize, login, register, logout, and current-user loading.
- Unit tests for the error key catalog and the validation message helpers.
- Playwright auth smoke e2e test exercising the login flow end-to-end.
- Dockerfile and `docker-compose.yml` for the local frontend.
- GitHub Actions CI workflow that runs formatting, lint, type-check, unit tests, e2e tests, and build on every PR.
- Documented the dev, staging, production, normal release, and hotfix workflows in the README, including the rule that stable Dokploy tags (`staging` and `prod`) are only updated from immutable versioned images and never from `dev`.
- Tailwind CSS v4 with a warm primary orange palette and the Flowbite plugin.
- ESLint, Prettier, `prettier-plugin-svelte`, and `prettier-plugin-tailwindcss` for the project.
- `PUBLIC_API_URL` injection at Docker build time so deployed images resolve the backend URL.
- Deployed image fallback to a static backend URL when no environment override is provided.

### Changed

- API client and `ApiError` parse the structured `{ key, statusCode, details }` backend error contract instead of the legacy `message` field.
- Shared `AuthForm` accepts a `fieldErrors` map and renders the offending input in red with a localized message below it.
- Login and register pages consume `resolveAuthError`, replacing the legacy English-string matching with key-based handling.
- Replaced the `registerErrors` helper with the key-based `authErrors` resolver shared between login and register.
- Auth store no longer stores a redundant `error` field; pages own error translation via `resolveAuthError` and the i18n catalog.
- API client reads the backend URL from `window.APP_CONFIG.API_URL` at runtime (with a `process.env.PUBLIC_API_URL` fallback for SSR and tests), unlocking image-promotion across environments.
- Dockerfile aligned with the backend pattern: explicit `production` target, non-root `node` user, container healthcheck on the home page, and a dedicated `docker/entrypoint.sh` that injects the runtime config and starts the node server.
- `.env.example` documents the runtime variables consumed by the container (`NODE_ENV`, `PORT`, `FRONTEND_PORT`, `PUBLIC_API_URL`).
- CI workflow aligned with the backend: triggers on `v*` tag pushes (required for the staging release flow), explicit `permissions: contents: read`, job renamed `ci` / `Validate Frontend`, dropped the `PUBLIC_API_URL` env and the build-arg from `docker build`.
- `deploy-dev` workflow now waits for a successful `CI` workflow run on `dev`, then builds and deploys the exact commit validated by CI.
- Deployment workflow uses only `dev` and `main` as long-lived branches; CI no longer targets a long-lived `staging` branch.
- Staging release workflow: every stable or prerelease semantic Git tag from `main` builds an immutable versioned image such as `ghcr.io/ofertando-inc/front:v0.1.1` or `…:v0.1.1-rc.1`, validates that the tag belongs to `main`, retags that image as `:staging`, and triggers Dokploy staging.
- Production workflow: manual `workflow_dispatch` deployments validate an existing stable semantic tag, verify the matching versioned GHCR image exists, retag that image as `:prod`, and trigger Dokploy production without rebuilding from source.
- `docker/build-push-action` updated from `v6` to `v7` in the dev deploy workflow to run on the Node 24 runtime and silence the GitHub Actions Node 20 deprecation warning.
- Staging release workflow chains after a successful `CI` workflow run on a `v*` tag via `workflow_run`, so a release tag never produces a deployed image without first passing lint, typecheck, unit tests, e2e smoke tests, and the Docker build.
- Production deploy workflow runs under the `production` GitHub Environment, gating manual dispatches behind the configured reviewer approval and branch/tag protection rules.
- Auth form and header search inputs use a lighter `gray-400` placeholder color so the example text no longer competes with the typed value.
- Home landing hides the login and register call-to-action buttons when the visitor is already authenticated, avoiding the duplicate of the header user menu.
- Auth form submit button displays a Flowbite spinner alongside the label while a request is in flight, replacing the previous trailing-dots affordance.
- Profile page loading state renders a pulse skeleton mirroring the final avatar, identity, and stats grid (with `aria-busy` and a localized `aria-label`) instead of the previous bare `Cargando...` text.
- Register e2e smoke test asserts both password fields and uses an exact-match label query so the new confirmation input does not collide with the original password input.
- README replaces the default `sv` template content with a project header, local setup steps, environment variables, npm scripts, and the catalog of available routes.
- Replaced the SvelteKit starter homepage with an auth-focused landing.
- Register error messages react live to locale changes.
- Header layout improved for responsiveness across breakpoints.
- Auth and profile pages aligned with the UX model reference.
- Profile page displays the member-since date using the full localized month.

### Removed

- Dead error banner from the profile page; failures during current-user loading now redirect silently to `/login` and the page no longer carries a never-rendered error state.

### Fixed

- Docker healthcheck honors the `PORT` environment variable so it does not break when the container is started on a non-default port. Dropped the stale `EXPOSE 3000` directive that no longer reflects the runtime port.
- Docker healthcheck targets `127.0.0.1` instead of `localhost` (BusyBox `wget` resolves the latter to `::1` while the node server only listens on IPv4), and switched from a HEAD `--spider` probe to a `-O /dev/null` GET to stay compatible with routes that do not advertise HEAD.
- Document root language set to Spanish (`<html lang="es">`) to match the default UI locale and stop misleading screen readers and search engines.
- Login and register pages redirect authenticated visitors to `/profile` when reached via direct URL: an `$effect` watching `$authStore.user` replaces the previous `onMount` hook that fired before the layout had restored the token from `localStorage`.
- Docker port conflicts via an environment-driven port mapping.
- Dropdown items no longer show stray list markers.
- `resolveRoute` calls satisfy SvelteKit type checks.
- Build pipeline reliability for the SvelteKit + Flowbite combination.
- Frontend access to the dev backend by aligning the deployed URL with the backend `CORS_ORIGINS`.

[1.0.0]: https://github.com/ofertando-inc/front/releases/tag/v1.0.0
[0.7.0]: https://github.com/ofertando-inc/front/releases/tag/v0.7.0
[0.6.0]: https://github.com/ofertando-inc/front/releases/tag/v0.6.0
[0.5.0]: https://github.com/ofertando-inc/front/releases/tag/v0.5.0
[0.4.0]: https://github.com/ofertando-inc/front/releases/tag/v0.4.0
[0.3.0]: https://github.com/ofertando-inc/front/releases/tag/v0.3.0
[0.2.0]: https://github.com/ofertando-inc/front/releases/tag/v0.2.0
[0.1.0]: https://github.com/ofertando-inc/front/releases/tag/v0.1.0
