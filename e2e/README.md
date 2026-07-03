# Worktree Manager E2E Tests

Playwright end-to-end tests for the git worktree manager example.

## Setup

```bash
npm install
npm run install:browsers
```

## Run tests

```bash
npm run test
```

## Configuration

Set `BASE_URL` to point to the running frontend. The default is `http://localhost:5173`.

```bash
BASE_URL=https://my-portless-subdomain.portless.sh npm run test
```
