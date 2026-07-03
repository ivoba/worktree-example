# Git Worktree Manager Example

> **Agent context:** This file is the source of truth for dev tooling, port allocation, and Git worktree behavior. Read it before changing any worktree, Docker Compose, or Portless-related code.

A small example project that demonstrates a git worktree manager with:

- **API**: PHP + nginx (Docker Compose)
- **Mailpit**: Mailpit workspace (Docker Compose)
- **Frontend**: TypeScript + Vite
- **E2E**: Playwright tests
- **Proxy**: [Portless](https://portless.sh) for local HTTPS domains

## Project Layout

```
.
├── api/                    PHP API, docker-compose, nginx
├── mailpit/                Portless workspace for mailpit route
├── frontend/               TypeScript Vite app
├── e2e/                    Playwright tests
├── scripts/                Helper scripts
│   └── worktree-ports.mjs  Source of truth for port/URL generation
├── portless.json.template  Tracked Portless config template
├── portless.json           Generated per worktree (ignored by git)
└── package.json            Root workspace configuration
```

## Before you edit

- `scripts/worktree-ports.mjs` is the source of truth for ports and the Portless URL base.
- The following files are generated and must not be hand-edited:
  - `api/.env` - ports and `COMPOSE_PROJECT_NAME` for Docker Compose
  - `frontend/.env.local` - API URL for the Vite dev proxy
  - `portless.json` - Portless `appPort` and `name` values
- Regenerate them with `npm run ports` after switching worktrees, pulling changes, or editing `worktree-ports.mjs`.
- Always run `npm run dev` after `npm run ports` so the generated config is loaded.

## Quick Start

1. Install dependencies and portless:

```bash
npm install
```

2. Generate the per-worktree ports and Portless config:

```bash
npm run ports
```

3. Start the API and frontend through Portless:

```bash
npm run dev
```

This launches:

- `https://worktree.localhost` - Vite frontend
- `https://api.worktree.localhost` - PHP API
- `https://mailpit.worktree.localhost` - Mailpit UI

On the main worktree, the concrete ports are the defaults:

- `API_PORT=8080`
- `MAILPIT_UI_PORT=8026` (mapped to mailpit container port `8025`)
- `MAILPIT_SMTP_PORT=1025`
- `FRONTEND_PORT=5173`

## Manual Start

Start the API and mailpit:

```bash
npm run dev:api
npm run dev:mailpit
```

Start the frontend only:

```bash
npm run dev:frontend
```

## Git Worktrees

This setup supports running multiple worktrees in parallel on the same machine.

`scripts/worktree-ports.mjs` detects the current git worktree (main vs linked) and writes a unique port range and Portless base name for it into:

- `api/.env` - ports and `COMPOSE_PROJECT_NAME` for Docker Compose
- `frontend/.env.local` - API URL for the Vite dev proxy
- `portless.json` - Portless `appPort` and `name` values so the proxy routes to the right ports and uses a worktree-unique URL

The main worktree keeps the default ports and the `worktree` base URL. Linked worktrees get:

- A deterministic port block in the `10000-65000` range based on the worktree path
- A Portless base name derived from the worktree directory name (e.g. `worktree-example-feature`)

Portless then prepends the branch name as a subdomain, so each worktree gets a unique URL.

Create a linked worktree:

```bash
npm run create -- feature-branch
```

This creates a new branch `feature-branch`, checks it out at `../worktree-example-feature`, and generates the per-worktree configuration. Then start it:

```bash
cd ../worktree-example-feature
npm install
npm run dev
```

For a worktree in `../worktree-example-feature` on branch `feature-branch`, the URLs become:

- `https://feature-branch.worktree-example-feature.localhost`
- `https://feature-branch.api.worktree-example-feature.localhost`
- `https://feature-branch.mailpit.worktree-example-feature.localhost`

Docker Compose containers are isolated per worktree via `COMPOSE_PROJECT_NAME`.

Remove a linked worktree:

```bash
npm run remove -- feature-branch
```

This finds and terminates any `npm run dev` processes running in that worktree, asks for confirmation, then deletes the worktree directory. The Git branch is left intact so you can delete it separately with `git branch -D` if desired.

### Override ports and URL

You can override the computed ports with environment variables:

```bash
WORKTREE_API_PORT=9000 \
WORKTREE_MAILPIT_UI_PORT=9001 \
WORKTREE_MAILPIT_SMTP_PORT=9002 \
WORKTREE_FRONTEND_PORT=9003 \
npm run ports
```

Set a custom base port for a linked worktree:

```bash
WORKTREE_BASE_PORT=30000 npm run ports
```

Set a custom Portless base name (instead of the worktree directory name):

```bash
WORKTREE_URL_BASE=my-feature npm run ports
```

## Common agent tasks

- **Switch worktree:** `cd <worktree-path> && npm run ports && npm run dev`
- **Update ports after pulling changes:** `npm run ports` (rerun in each active worktree)
- **Change port allocation logic:** edit `scripts/worktree-ports.mjs`, then regenerate and test in a linked worktree
- **Add a new service:** update `worktree-ports.mjs`, `portless.json.template`, `api/docker-compose.yml`, and `package.json` dev scripts; ensure a unique port variable is added
- **Debug routing:** compare `portless.json` and `api/.env` values with the actual running Docker Compose ports (`docker compose -f api/docker-compose.yml ps`)

## E2E Tests

Make sure the frontend and API are running, then:

```bash
cd e2e && npm install && npm run install:browsers && npm run test
```

To test against a Portless URL:

```bash
BASE_URL=https://worktree.localhost npm run test
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/worktrees` - List worktrees
- `GET /api/branches` - List branches

## Troubleshooting

- **Port already in use:** another worktree or process is using the port. Either stop the other process or override the port with `WORKTREE_*_PORT` and rerun `npm run ports`.
- **Portless domain does not resolve:** verify `portless.json` exists and matches the output of `npm run ports`. Check that Portless is running and that the worktree base name is unique.
- **Docker Compose project conflict:** verify `COMPOSE_PROJECT_NAME` in `api/.env` is unique per worktree. Regenerate with `npm run ports`.
- **Frontend cannot reach the API:** check `frontend/.env.local` for the correct API URL and ensure the API container is running.
- **Changes to `worktree-ports.mjs` not reflected:** rerun `npm run ports` in every active worktree; generated files are not updated automatically.

## Notes

- `portless.json` is generated by `scripts/worktree-ports.mjs` and is ignored by git. The template `portless.json.template` is kept under version control.
- The frontend uses the Vite dev proxy to reach the API at `/api` during local development.
- Portless exposes both apps on stable `.localhost` domains with HTTPS.
