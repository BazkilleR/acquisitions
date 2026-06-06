# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start server with hot reload (node --watch)
npm run lint         # Check lint errors
npm run lint:fix     # Auto-fix lint errors
npm run format       # Format all files with Prettier
npm run format:check # Check formatting without writing

npm run db:generate  # Generate Drizzle migrations from models
npm run db:migrate   # Apply migrations to the database
npm run db:studio    # Open Drizzle Studio (DB GUI)
```

Environment variable `DATABASE_URL` (Neon Postgres connection string) must be set before running any db commands or the server.

## Architecture

### Request flow

```
index.js (loads dotenv)
  → server.js (binds port)
    → app.js (middleware stack + routes)
      → src/routes/*.routes.js
        → src/controllers/*.controller.js
          → src/services/*  (planned, not yet implemented)
            → src/models/*.model.js (Drizzle table schemas)
```

### Module system

The project uses **ESM** (`"type": "module"`). All imports use `import/export` — no `require()`.

### Path aliases

Defined in `package.json` `"imports"` field — use these instead of relative paths:

| Alias            | Resolves to         |
| ---------------- | ------------------- |
| `#config/*`      | `src/config/*`      |
| `#controllers/*` | `src/controllers/*` |
| `#models/*`      | `src/models/*`      |
| `#routes/*`      | `src/routes/*`      |
| `#services/*`    | `src/services/*`    |
| `#utils/*`       | `src/utils/*`       |
| `#validations/*` | `src/validations/*` |

### Database

Drizzle ORM with **Neon Postgres** (serverless). The `db` instance is exported from `src/config/database.js`. Schema is defined in `src/models/*.model.js` — Drizzle reads all files matching `src/models/*.js` when generating migrations.

### Auth pattern

- Validation with **Zod** schemas in `src/validations/` — always call `schema.safeParse()` and check `.success` before using `.data`
- Passwords are expected to be hashed before storage (bcrypt not yet installed)
- JWT tokens are signed/verified via `src/utils/jwt.js` (`jwttoken.sign`, `jwttoken.verify`)
- Tokens are stored in **httpOnly cookies** managed by `src/utils/cookies.js` — `cookies.set()`, `cookies.get()`, `cookies.clear()`
- Logger is at `src/config/logger.js`, import via `#config/logger.js` (not `#utils/logger.js`)

### Logging

Morgan (HTTP request logs) is wired into Winston so all logs go through a single pipeline. In non-production, Winston also logs to console. Log files are written to `logs/error.log` and `logs/combined.log`.

### Code style

ESLint enforces: 2-space indent, single quotes, semicolons, LF line endings, `const` over `let`, arrow callbacks, object shorthand. Run `npm run lint:fix` after editing to avoid CRLF errors on Windows.
