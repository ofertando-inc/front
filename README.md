# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.15.1 create --template minimal --types ts --add prettier eslint vitest="usages:component,unit" playwright tailwindcss="plugins:forms" sveltekit-adapter="adapter:node" --install npm frontend
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

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

Pushing a tag like `v0.1.1` triggers `.github/workflows/deploy-staging.yml`.

The workflow validates the tag, builds `ghcr.io/ofertando-inc/front:v0.1.1`, updates `ghcr.io/ofertando-inc/front:staging` from that versioned image, and triggers Dokploy staging.

### Production Release

Production is manual and does not rebuild from source.

Run `.github/workflows/deploy-prod.yml` manually with the `tag` input, for example `v0.1.1`.

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
