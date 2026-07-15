# Ofertando Frontend

SvelteKit frontend for **Ofertando**, a community-driven deals platform for Colombia: users publish and vote on offers, brands manage their official presence, admins moderate the whole thing.

- BFF architecture: the browser only ever talks to the SvelteKit server, which proxies the API — no token ever reaches client-side storage
- Three languages (Spanish default, English and French lazy-loaded), light and dark mode
- WCAG 2.1 AA / RGAA accessibility enforced in CI (axe-core in e2e, Lighthouse accessibility = 1.0)
- Shipped as a Docker image (GHCR) deployed on Dokploy

## Stack

| Layer        | Tech                                           |
| ------------ | ---------------------------------------------- |
| Runtime      | Node.js 24, TypeScript 5                       |
| Framework    | SvelteKit 2 (`adapter-node`), Svelte 5 (runes) |
| UI           | Tailwind CSS v4, Flowbite Svelte + Icons       |
| Forms & maps | Superforms + Zod (server-validated), Leaflet   |
| Testing      | Vitest, Playwright + axe-core, Lighthouse CI   |
| CI/CD        | GitHub Actions → GHCR → Dokploy                |

## Requirements

- **Node.js 24+** and **npm 10+** (with nvm: `nvm install 24`)
- The **Ofertando backend** reachable (default `http://localhost:3000`) for real data — the app starts without it, but pages that fetch data show their error state. Tests and Lighthouse do **not** need it: they run against an embedded mock backend
- **Docker** (or Podman) only for the containerized workflow
- For the e2e suite: the Playwright Chromium binary (`npm run test:e2e:install`, one-time)

## Getting Started

```bash
git clone git@github.com:ofertando-inc/front.git
cd front
npm ci
cp .env.example .env # then adjust BACK_URL if your backend runs elsewhere
```

Then pick one of the two workflows:

### Option A — dev server locally

```bash
npm run dev
```

Vite dev server with hot reload on `http://localhost:5173`. API calls are proxied server-side to `BACK_URL`.

### Option B — production image in Docker

```bash
docker compose up -d --build
```

Builds the multi-stage production image (non-root `node` user, precompressed `.br`/`.gz` assets) and exposes it on `FRONTEND_PORT` (default `5173`).

> With this option on Linux, set `BACK_URL=http://host.docker.internal:3000` in `.env` so the BFF inside the container can reach a backend exposed on the Docker host (the compose file already maps `host.docker.internal` to the host gateway).

### Sanity check

```bash
curl http://localhost:5173/healthz
```

should answer `status: "ok"` with the app version — add `?deep=1` to also verify the BFF → API connectivity.

## Environment

`cp .env.example .env` and adjust. All variables are read **at boot, server-side** — no `PUBLIC_*` URL is baked at build time, so the same image runs in every environment:

| Variable        | Default                 | Purpose                                                                                |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `NODE_ENV`      | `development`           | Node runtime mode                                                                      |
| `PORT`          | `3000`                  | Port the node server listens on inside the container                                   |
| `FRONTEND_PORT` | `5173`                  | Host port the docker-compose service exposes                                           |
| `BACK_URL`      | `http://localhost:3000` | Backend base URL, read server-side by the SvelteKit BFF. Never exposed to the browser. |

## Project Structure

```text
src/
  lib/
    api/          apiRequest<T> client + one module per domain
                  (auth, offers, admin, business, ...)
    types/        backend DTOs, one file per domain
    components/   UI (layout, offers, comments, ...)
    i18n/         typed message catalog — es (default, bundled),
                  en/fr (code-split, lazy-loaded)
    stores/       auth, locale, theme (dark mode)
    validation/   Zod schemas shared by Superforms actions
  routes/         pages + server actions; api/[...path] is the BFF proxy,
                  healthz the supervision endpoint, dark.css the dark theme
  app.html        anti-FOUC theme script

scripts/          lh-server.mjs (mock backend + preview for Lighthouse CI)
static/           robots.txt, favicons
```

The BFF proxy (`src/routes/api/[...path]/+server.ts`) forwards every browser request to `BACK_URL` and pipes the auth cookies in both directions; all client code goes through `apiRequest<T>` (`src/lib/api/client.ts`), never straight to the backend.

## Pages Overview

| Routes                             | Description                                                                                           | Access                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `/`                                | Home — hero, hot deals, recent deals, popular stores                                                  | Public                                  |
| `/deals`, `/deals/[id]`            | Cursor-paginated listing (city/type/sort/period filters), offer detail with votes, comments, tracking | Public                                  |
| `/create-deal`, `/deals/[id]/edit` | Offer creation / edition (Superforms + Zod server actions)                                            | JWT (edit: author only)                 |
| `/login`, `/register`              | Auth forms; the backend sets the session cookies through the BFF                                      | Public                                  |
| `/profile`                         | Own account, offers / comments / votes tabs                                                           | JWT                                     |
| `/business`, `/business/new-offer` | Business space: stats dashboard, own offers, official offer publishing, address requests              | BUSINESS                                |
| `/admin`                           | Moderation back-office: offers, comments, reports, merchants & addresses, accounts, claims            | ADMIN or ROOT (accounts & claims: ROOT) |
| `/privacy`, `/terms`               | Legal pages                                                                                           | Public                                  |
| `/healthz`                         | Supervision (see below)                                                                               | Public                                  |
| `/api/*`                           | BFF catch-all proxy towards `BACK_URL`                                                                | Whatever the backend route requires     |
| _anything else_                    | Localized 404 / error page                                                                            | —                                       |

**Error contract**: the API answers `{ "key": "<stable.key>", "statusCode": <n> }`; the front maps each key to a translated message (`src/lib/i18n`) — messages are never parsed.

## Internationalization

Spanish ships in the initial bundle; English and French are code-split and lazy-loaded when selected (choice persisted). The catalog is fully typed (`src/lib/i18n/types.ts`): adding a key without translating it in all three locales is a compile error. No user-facing string is hardcoded in components.

## Accessibility & Dark Mode

- WCAG 2.1 AA / RGAA: axe-core scans 13 key screens in the e2e suite (zero critical/serious violations allowed), Svelte compiler a11y warnings are ESLint **errors**, and Lighthouse CI asserts **accessibility = 1.0** on every audited page.
- Dark mode follows the OS `prefers-color-scheme` and can be forced with the moon/sun toggle in the header (persisted, applied before first paint).

## Tests

Unit and component tests are self-contained:

```bash
npm run test:unit -- --run
```

The e2e suite is also self-contained — it builds the app, serves a production preview on `127.0.0.1:4173` and spins up an inline mock backend on `127.0.0.1:4174`, so no real backend or database is needed:

```bash
npm run test:e2e:install   # download Chromium, first time only
npm run test:e2e           # Playwright + axe accessibility scans
```

## Quality Checks

Run the same core checks as CI before opening a PR:

```bash
npm run lint               # prettier --check + eslint (a11y warnings are errors)
npm run check              # svelte-check typecheck
npm run test:unit -- --run
npm run test:e2e
npm run build
npm run lh                 # optional: Lighthouse CI with the same assertions as CI
```

## Supervision

- `GET /healthz` — liveness: answers `200 { "status": "ok", "version": "<package.json version>" }` (`Cache-Control: no-store`) as soon as the node server serves requests (Docker healthcheck target).
- `GET /healthz?deep=1` — readiness: the SvelteKit server additionally probes `BACK_URL/health/live` directly (2 s timeout, server-side, not through the public proxy) and answers `503 { "status": "degraded", "api": "down" }` when the API is unreachable. Point Uptime Kuma at this one to monitor the BFF → API connectivity.

The route is public (external probes need it), returns no metrics or user data, and is excluded from `robots.txt`.

## Deployment

The production image (multi-stage `Dockerfile`, target `production`) contains only the compiled `build/` output and production dependencies, runs as the non-root `node` user, and embeds a Docker `HEALTHCHECK` probing `/healthz`. It is configured at boot via `BACK_URL` — the exact same image runs in dev, staging and production.

Flow: feature branches → PR to `dev` (CI then auto-deploys the dev environment) → PR from `dev` to `main` → version tag `v*` (builds the immutable versioned image and promotes it to staging) → manual production workflow promotes that same image behind an approval gate. The `staging` and `prod` tags are never rebuilt from source, only updated from an already-validated versioned image. Hotfixes branch from `main`, ship through the same tag flow, then merge back into `dev`.

## CI

GitHub Actions runs validation on pushes and pull requests targeting `dev` and `main`: lint, typecheck, unit tests, e2e tests (cached Chromium), build, Lighthouse CI (accessibility = 1.0 enforced, reports uploaded as artifacts) and the Docker image build. A scheduled `npm audit` workflow fails on high/critical advisories — the project holds 0 vulnerabilities, pinning vulnerable transitive dependencies via `overrides` when needed.

## Changelog

Notable changes are tracked per release in [CHANGELOG.md](CHANGELOG.md) (Keep a Changelog format, semantic versioning).
