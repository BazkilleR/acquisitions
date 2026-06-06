# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start server with hot reload (node --watch)
npm run start        # Start server (no watch)
npm run lint         # Check lint errors
npm run lint:fix     # Auto-fix lint errors
npm run format       # Format all files with Prettier
npm run format:check # Check formatting without writing

npm run db:generate  # Generate Drizzle migrations from models
npm run db:migrate   # Apply migrations to the database
npm run db:studio    # Open Drizzle Studio (DB GUI)

npm run dev:docker   # Start full dev stack via Docker (app + Neon Local)
npm run prod:docker  # Start production stack via Docker
```

`DATABASE_URL` (Neon Postgres connection string) must be set before running any db commands or the server.

## Architecture

### Request flow

```
index.js (loads dotenv)
  → server.js (binds port)
    → app.js (middleware stack + routes)
      → src/middleware/security.middleware.js  (Arcjet rate limiting)
      → src/routes/*.routes.js
        → src/controllers/*.controller.js
          → src/services/*.service.js
            → src/models/*.model.js (Drizzle table schemas)
```

### Module system

The project uses **ESM** (`"type": "module"`). All imports use `import/export` — no `require()`. Health checks and shell scripts must not use `node -e "require(...)"`.

### Path aliases

Defined in `package.json` `"imports"` field — use these instead of relative paths:

| Alias            | Resolves to         |
| ---------------- | ------------------- |
| `#config/*`      | `src/config/*`      |
| `#controllers/*` | `src/controllers/*` |
| `#middleware/*`  | `src/middleware/*`  |
| `#models/*`      | `src/models/*`      |
| `#routes/*`      | `src/routes/*`      |
| `#services/*`    | `src/services/*`    |
| `#utils/*`       | `src/utils/*`       |
| `#validations/*` | `src/validations/*` |

### Database

Drizzle ORM with **Neon Postgres** (serverless). The `db` instance is exported from `src/config/database.js`. Schema is defined in `src/models/*.model.js`.

In `NODE_ENV=development`, `database.js` redirects queries to the Neon Local Docker proxy (`http://neon-local:5432/sql`) instead of Neon Cloud.

#### Schema

`users` table (`src/models/user.model.js`):

| Column       | Type         | Notes                 |
| ------------ | ------------ | --------------------- |
| `id`         | serial PK    |                       |
| `name`       | varchar(255) | not null              |
| `email`      | varchar(255) | not null, unique      |
| `password`   | varchar(255) | bcrypt hash, not null |
| `role`       | varchar(255) | default `'user'`      |
| `created_at` | timestamp    | defaultNow            |
| `updated_at` | timestamp    | defaultNow            |

### Auth pattern

- Validation with **Zod** schemas in `src/validations/auth.validation.js` — exports `signUpSchema`, `signInSchema`. Always call `schema.safeParse()` and check `.success` before using `.data`.
- Passwords are hashed with **bcrypt** (rounds: 10) before storage. The model column is named `password` (not `password_hash`).
- JWT tokens are signed/verified via `src/utils/jwt.js` — import as `import { jwttoken } from '#utils/jwt.js'`. Named export, not default.
- Tokens are stored in **httpOnly cookies** via `src/utils/cookies.js` — import as `import { cookies } from '#utils/cookies.js'`. Named export, not default. Methods: `cookies.set()`, `cookies.get()`, `cookies.clear()`.
- Logger is at `src/config/logger.js` — import via `#config/logger.js` (not `#utils/logger.js`).

### Security middleware

`src/middleware/security.middleware.js` — Arcjet-powered, applied globally in `app.js`. Enforces role-based sliding window rate limits:

| Role    | Limit      |
| ------- | ---------- |
| `admin` | 20 req/min |
| `user`  | 10 req/min |
| `guest` | 5 req/min  |

Also blocks bots and shield-flagged traffic. Arcjet config is in `src/config/arcjet.js`.

### API routes

| Method | Path               | Handler         | Status      |
| ------ | ------------------ | --------------- | ----------- |
| POST   | /api/auth/sign-up  | `signup`        | Implemented |
| POST   | /api/auth/sign-in  | —               | Planned     |
| POST   | /api/auth/sign-out | —               | Planned     |
| GET    | /api/users         | `fetchAllUsers` | Implemented |
| GET    | /api/users/:id     | —               | Stub        |
| PUT    | /api/users/:id     | —               | Stub        |
| DELETE | /api/users/:id     | —               | Stub        |
| GET    | /health            | inline          | Implemented |

### Logging

Morgan (HTTP request logs) is wired into Winston so all logs go through a single pipeline. In non-production, Winston also logs to console. Log files: `logs/error.log`, `logs/combined.log`.

### Code style

ESLint enforces: 2-space indent, single quotes, semicolons, LF line endings, `const` over `let`, arrow callbacks, object shorthand. Run `npm run lint:fix` after editing to avoid CRLF errors on Windows.

A `.gitattributes` file enforces LF for all text files on checkout. Set `git config core.autocrlf input` on Windows to prevent CRLF conversion.

## Docker

| File                      | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| `Dockerfile`              | Multi-stage: `development`, `production`           |
| `docker-compose.dev.yml`  | App + Neon Local sidecar, reads `.env.development` |
| `docker-compose.prod.yml` | App only, reads `.env.production`                  |
| `.env.development`        | Dev credentials + `USE_NEON_LOCAL=true`            |
| `.env.production`         | Prod credentials template                          |
| `.env`                    | Host-only (npm run dev, db:migrate)                |
| `scripts/dev.sh`          | Start dev stack, wait for DB, run migrations       |

Run migrations inside the container (not on host) so `DATABASE_URL` resolves correctly within the Docker network:

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```
