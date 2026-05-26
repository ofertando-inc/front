# Ofertando Frontend

SvelteKit + TypeScript frontend for the Ofertando deals platform.

## Stack

- SvelteKit 2 (`adapter-node`) + Svelte 5 (runes)
- TypeScript
- Tailwind CSS v4 + Flowbite Svelte + Flowbite Svelte Icons
- Vitest (unit + component) + Playwright (e2e)
- Docker image deployed via Dokploy

## Local setup

Prerequisites: Node.js 24+, npm 10+.

```sh
git clone https://github.com/ofertando-inc/front.git
cd front
cp .env.example .env
# adjust BACK_URL in .env if your backend runs on a different host or port
npm install
npm run dev
```

The dev server listens on http://localhost:5173 and reloads on file changes.

## Environment variables

| Variable        | Purpose                                                                                | Default                 |
| --------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| `NODE_ENV`      | Node runtime mode (`development`, `production`)                                        | `development`           |
| `PORT`          | Port the node server listens on inside the container                                   | `3000`                  |
| `FRONTEND_PORT` | Host port the docker-compose service exposes                                           | `5173`                  |
| `BACK_URL`      | Backend base URL, read server-side by the SvelteKit BFF. Never exposed to the browser. | `http://localhost:3000` |

Auth and API calls flow through a SvelteKit BFF at `/api/*`: the browser only talks to the SvelteKit server, which forwards requests to `BACK_URL` and pipes cookies in both directions. There is no client-side token storage and no `PUBLIC_*` URL injected at build time — the production image is environment-agnostic and configured at boot via `BACK_URL`.

When running the front in Docker on Linux, set `BACK_URL=http://host.docker.internal:3000` so the BFF inside the container can reach a backend exposed on the Docker host (the `docker-compose.yml` already maps `host.docker.internal` to the host gateway).

## Scripts

| Script              | Action                                                        |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                                     |
| `npm run build`     | Build the production bundle                                   |
| `npm run preview`   | Preview the production build locally                          |
| `npm run start`     | Run the built node server (after `build`)                     |
| `npm run check`     | Type-check via `svelte-check`                                 |
| `npm run lint`      | Prettier check + ESLint                                       |
| `npm run format`    | Prettier write                                                |
| `npm run test:unit` | Vitest unit + component tests                                 |
| `npm run test:e2e`  | Playwright e2e tests (builds and serves a production preview) |
| `npm test`          | All tests (unit then e2e)                                     |

## Routes

| Path               | Description                                                                                                                                         | Auth required                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `/`                | Home — hero, hot deals, recent deals, and popular stores. Login and register CTAs are hidden when authenticated.                                    | No                                           |
| `/login`           | Sign-in form. Calls `POST /api/auth/login` through the BFF; the backend sets the session cookies and the page redirects to `/profile`.              | No                                           |
| `/register`        | Account creation form with client-side password confirmation. Calls `POST /api/auth/register` through the BFF.                                      | No                                           |
| `/profile`         | Current user info from `GET /api/users/me`. The "My offers" tab is backed by `GET /api/offers/mine` with edit / delete actions; comments and votes tabs are placeholders. | Yes (redirects to `/login` otherwise)        |
| `/deals`           | Cursor-paginated offer listing with city, offer type, sort, and period filters.                                                                     | No                                           |
| `/deals/[id]`      | Offer detail page with status banners, vote panel, related offers, mocked comments. Author-only edit and delete buttons (delete via confirm modal). | No                                           |
| `/deals/[id]/edit` | Edit form pre-filled with the existing offer. SvelteKit server action `PATCH /api/offers/[id]` with Superforms + Zod validation.                    | Yes (must be the author)                     |
| `/create-deal`     | Create form. SvelteKit server action `POST /api/offers` with Superforms + Zod validation.                                                           | Yes (redirects to `/login` otherwise)        |
| `/api/*`           | BFF catch-all proxy: forwards every browser request to `BACK_URL`, rewriting the refresh cookie path so it stays scoped under `/api/auth`.          | Whatever the targeted backend route requires |
| _Anything else_    | Localized 404 / generic error page rendered by `src/routes/+error.svelte`.                                                                          | —                                            |

## Deployment Workflow

This repository uses two long-lived branches:

- `dev`: integration branch for tested feature branches. Pushes to `dev` run CI first; the dev image is deployed only after CI succeeds.
- `main`: stable branch used as the source of truth for releases.

Temporary work should happen on `feature/*`, `fix/*`, or `hotfix/*` branches.

### Docker Image Tags

- Dev uses `ghcr.io/ofertando-inc/front:dev`.
- Staging uses the stable Dokploy tag `ghcr.io/ofertando-inc/front:staging`.
- Production uses the stable Dokploy tag `ghcr.io/ofertando-inc/front:prod`.
- Releases use immutable semantic version tags such as `ghcr.io/ofertando-inc/front:v0.1.1`.

The `staging` and `prod` tags are never built directly and are never created from `dev`. They are only updated from an immutable versioned image. This keeps Dokploy simple while guaranteeing production uses the exact image validated in staging, without rebuilding.

### Dev Deployment

Merging a PR into `dev` runs `.github/workflows/ci.yml`. When that CI workflow completes successfully on `dev`, `.github/workflows/deploy-dev.yml` starts automatically.

The workflow builds and pushes:

- `ghcr.io/ofertando-inc/front:dev`
- `ghcr.io/ofertando-inc/front:dev-<commit-sha>`

It checks out the exact commit validated by CI, builds the dev image, then triggers the dev Dokploy webhook.

### Staging Release

When `dev` is ready for release, merge `dev` into `main` by PR, then create a semantic version tag from `main`.

Pushing a tag like `v0.1.1` triggers `.github/workflows/deploy-staging.yml` after the CI workflow on the tag has succeeded.

The workflow validates the tag, builds `ghcr.io/ofertando-inc/front:v0.1.1`, updates `ghcr.io/ofertando-inc/front:staging` from that versioned image, and triggers Dokploy staging.

### Production Release

Production is manual and does not rebuild from source.

Run `.github/workflows/deploy-prod.yml` manually with the `tag` input, for example `v0.1.1`. The workflow runs under the `production` GitHub Environment, so it is gated by the configured reviewer approval and branch/tag protection rules.

The workflow validates the tag, verifies that `ghcr.io/ofertando-inc/front:v0.1.1` already exists, updates `ghcr.io/ofertando-inc/front:prod` from that same image, and triggers Dokploy production.

### Normal Release Commands

```sh
git checkout dev
git pull origin dev

# Open a PR from dev to main, wait for CI, then merge it.

git checkout main
git pull origin main
git tag v0.1.1
git push origin v0.1.1
```

After staging validates `v0.1.1`, run the production workflow manually with:

```txt
tag = v0.1.1
```

### Hotfix Commands

Create hotfixes from `main` or the latest production tag, not from `dev`.

```sh
git checkout main
git pull origin main
git checkout -b hotfix/short-description

# Fix, test, commit, then open a PR into main.
```

After the hotfix PR is merged into `main`:

```sh
git checkout main
git pull origin main
git tag v0.1.2
git push origin v0.1.2
```

After staging validates `v0.1.2`, run the production workflow manually with:

```txt
tag = v0.1.2
```

Then bring the hotfix back into `dev`:

```sh
git checkout dev
git pull origin dev
git merge main
git push origin dev
```

If `dev` has unreleased work that conflicts with `main`, cherry-pick only the hotfix commit instead of merging all of `main`.
