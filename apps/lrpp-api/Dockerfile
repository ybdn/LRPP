# ===========================================
# LRPP API - Dockerfile (NestJS)
# ===========================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/lrpp-api/package.json ./apps/lrpp-api/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter lrpp-api

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/lrpp-api/node_modules ./apps/lrpp-api/node_modules
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/lrpp-api ./apps/lrpp-api
COPY data ./data

WORKDIR /app/apps/lrpp-api
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy package files for prod install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/lrpp-api/package.json ./apps/lrpp-api/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --filter lrpp-api

# Copy built application
COPY --from=builder /app/apps/lrpp-api/dist ./apps/lrpp-api/dist
COPY --from=builder /app/data ./data

USER nestjs

EXPOSE 3001

# Run from the app directory to ensure paths are correct
WORKDIR /app/apps/lrpp-api
CMD ["node", "dist/main"]
