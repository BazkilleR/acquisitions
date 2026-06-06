# Acquisitions API

Express + Drizzle ORM + Neon Postgres REST API, fully Dockerized for both development and production.

---

## How environment switching works

| File               | Used by                                            | `DATABASE_URL` points to |
| ------------------ | -------------------------------------------------- | ------------------------ |
| `.env`             | Host machine (`npm run dev`, `npm run db:migrate`) | Neon Cloud               |
| `.env.development` | Docker dev containers (`app` + `neon-local`)       | `neon-local` proxy       |
| `.env.production`  | Docker prod container (`app`)                      | Neon Cloud               |

---

## Development — Neon Local

In development, a **Neon Local** sidecar container runs alongside the app. On startup it authenticates with your Neon project, creates a temporary branch forked from your main branch, and tears it down when stopped — giving every session a clean, isolated database.

```
Browser → localhost:3000
            ↓
        [app container]
            ↓  DATABASE_URL → neon-local:5432
        [neon-local container]
            ↓  authenticated via NEON_API_KEY
        Neon Cloud (ephemeral branch)
```

### Prerequisites

- Docker Desktop ≥ 4.x
- A [Neon](https://console.neon.tech) account (free tier works)

### Step 1 — Fill in `.env.development`

| Variable           | Where to find it                                              |
| ------------------ | ------------------------------------------------------------- |
| `NEON_API_KEY`     | Neon Console → Account Settings → API Keys                    |
| `NEON_PROJECT_ID`  | Neon Console → Project Settings → General                     |
| `PARENT_BRANCH_ID` | Neon Console → Branches → click `main` → copy the `br-xxx` ID |
| `ARCJET_KEY`       | [app.arcjet.com](https://app.arcjet.com)                      |

### Step 2 — Start

```bash
npm run docker:dev
```

This script:

1. Builds the Docker image
2. Starts `neon-local` and `app` containers
3. Waits for `neon-local` to become healthy
4. Runs Drizzle migrations inside the `app` container
5. Streams logs (Ctrl+C detaches — containers keep running)

### Step 3 — Verify

```bash
curl http://localhost:3000/health
```

### Stop

```bash
npm run docker:dev:down
# The ephemeral Neon branch is automatically deleted.
```

---

## Production — Neon Cloud

No local proxy. The app connects directly to your Neon Cloud project.

### Step 1 — Fill in `.env.production`

```bash
# Edit .env.production and set:
DATABASE_URL=postgres://user:password@ep-xxx.neon.tech/neondb?sslmode=require
ARCJET_KEY=your-production-arcjet-key
```

Get the connection string from **Neon Console → Project → Connection details**.

### Step 2 — Run migrations

```bash
npm run docker:prod:migrate
```

### Step 3 — Start

```bash
npm run docker:prod
```

### Step 4 — Verify

```bash
curl http://localhost:3000/health
```

### Stop

```bash
npm run docker:prod:down
```

---

## npm scripts reference

| Script                        | What it does                                            |
| ----------------------------- | ------------------------------------------------------- |
| `npm run docker:dev`          | Build + start dev stack (app + Neon Local), stream logs |
| `npm run docker:dev:down`     | Stop dev stack, ephemeral branch is deleted             |
| `npm run docker:dev:migrate`  | Run Drizzle migrations in the running dev container     |
| `npm run docker:prod`         | Build + start production stack in detached mode         |
| `npm run docker:prod:down`    | Stop production stack                                   |
| `npm run docker:prod:migrate` | Run Drizzle migrations in the running prod container    |
| `npm run dev`                 | Start app locally on host (no Docker)                   |
| `npm run db:migrate`          | Apply migrations on host using root `.env`              |
| `npm run db:generate`         | Generate migrations from schema changes                 |
| `npm run db:studio`           | Open Drizzle Studio GUI                                 |

---

## Environment variable reference

### App container

| Variable          | Dev                                          | Prod           | Description                             |
| ----------------- | -------------------------------------------- | -------------- | --------------------------------------- |
| `PORT`            | `3000`                                       | `3000`         | HTTP port                               |
| `NODE_ENV`        | `development`                                | `production`   | Runtime mode                            |
| `LOG_LEVEL`       | `debug`                                      | `info`         | Winston log level                       |
| `DATABASE_URL`    | `postgres://neon:npg@neon-local:5432/neondb` | Neon Cloud URL | Postgres connection string              |
| `USE_NEON_LOCAL`  | `true`                                       | _(unset)_      | Routes queries through Neon Local proxy |
| `NEON_LOCAL_HOST` | `neon-local`                                 | _(unset)_      | Docker service name for Neon Local      |
| `ARCJET_KEY`      | Your key                                     | Your key       | Arcjet API key                          |
| `ARCJET_ENV`      | `development`                                | `production`   | Arcjet environment                      |

### Neon Local container (dev only, from `.env.development`)

| Variable           | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `NEON_API_KEY`     | Authenticates against Neon Cloud                               |
| `NEON_PROJECT_ID`  | Neon project to fork branches from                             |
| `PARENT_BRANCH_ID` | Branch to fork — ephemeral branch is deleted on container stop |
