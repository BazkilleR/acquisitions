# syntax=docker/dockerfile:1

# ── Base ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── Development ───────────────────────────────────────────────────────────────
# Source code is volume-mounted at runtime for hot reload.
FROM base AS development
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Prod deps ─────────────────────────────────────────────────────────────────
FROM base AS prod-deps
RUN npm ci --omit=dev

# ── Production ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -S nodejs && adduser -S appuser -G nodejs
COPY --from=prod-deps /app/node_modules ./node_modules
COPY . .
RUN chown -R appuser:nodejs /app
USER appuser
EXPOSE 3000
CMD ["npm", "start"]
