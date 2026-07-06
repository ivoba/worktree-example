# Git Worktree Manager Example

An example project that demonstrates how to solve common git worktree problems in project setups.

- NPM monorepo as project setup
- NPM scripts as task runner
- [Portless](https://portless.sh) for dynamic HTTPS domains and ports
- Docker Compose to manage services
- JS Script to map ports to worktree config

## Problems with worktree setup

1. Gitignored files like `.env` are not automatically copied to a new worktree ✅
2. IDE-specific settings and local configs (phpunit, PHP Docker, open terminals, debug/run configs) are lost or out of sync ❌ (Not solved yet for PHPStorm)
3. Multiple Docker setups running in parallel cause port, container name, and volume conflicts ✅
4. Manual `/etc/hosts` and static `localhost` domains do not provide dynamic per-worktree URLs ✅
5. Directory structure and naming conventions differ across worktrees ✅


## Project Components 

- **API**: PHP + nginx (Docker Compose)
- **Mailpit**: Mailpit workspace (Docker Compose)
- **Frontend**: TypeScript + Vite
- **E2E**: Playwright tests

## Usage Main Worktree

```bash
# Install dependencies
npm install

# Generate per-worktree ports and Portless config
npm run ports

# Start the API (Docker Compose), mailpit, and frontend via Portless
npm run dev
```

On the main worktree this exposes:

- `https://worktree.localhost` - Vite frontend
- `https://api.worktree.localhost` - PHP API
- `https://mailpit.worktree.localhost` - Mailpit UI

## Worktree Workflow

### Create a worktree

```bash
npm run create -- <branch-name>
```

Creates a new branch, checks it out at `../<project-dir>-<branch-name>`, and generates per-worktree configuration.

### Set up and run

```bash
cd ../worktree-example-<branch-name>
npm install
npm run dev
```

`npm run create` already runs `npm run ports`, so the generated configs are in place. `npm run dev` starts Docker Compose (API + Mailpit) and the Vite frontend through Portless with unique URLs:

- `https://<branch>.worktree-example-<branch>.localhost` - Vite frontend
- `https://<branch>.api.worktree-example-<branch>.localhost` - PHP API
- `https://<branch>.mailpit.worktree-example-<branch>.localhost` - Mailpit UI

### Remove a worktree

From the main worktree:

```bash
npm run remove -- <branch-name>
```

Terminates any running `npm run dev` processes in that worktree, asks for confirmation, then deletes the worktree directory. The git branch is left intact:

```bash
git branch -D <branch-name>
```

## Example Tools & Resources
- https://crates.io/crates/worktree
- https://github.com/AgenticSec/sprout
- https://coasts.dev/
- https://fabiorehm.com/blog/2025/11/27/working-on-multiple-branches-without-losing-my-mind/
- https://github.com/wraps-team/wraps/blob/3f875647f7cf047d2b1106341b6368d7452e947c/scripts/setup-worktree.sh
- https://github.com/dazz/git-wt