# Worktree Manager API

PHP API for the git worktree manager example.

## Setup

1. Copy `.env.example` to `.env` and adjust ports if needed.
2. Build and run the containers:

```bash
docker-compose up -d --build
```

## Endpoints

- `GET /health` - Health check
- `GET /api/worktrees` - List example worktrees
- `GET /api/branches` - List example branches

## Services

- `nginx` serves static files and proxies PHP requests
- `php` runs the PHP-FPM application
- `mailpit` catches outgoing emails for development
