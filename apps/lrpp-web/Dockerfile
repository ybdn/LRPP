# ===========================================
# LRPP Web - Dockerfile (Next.js)
# ===========================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/lrpp-web/package.json ./apps/lrpp-web/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter lrpp-web

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/lrpp-web/node_modules ./apps/lrpp-web/node_modules
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/lrpp-web ./apps/lrpp-web

# Build argument for API URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app/apps/lrpp-web
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/lrpp-web/.next/standalone ./
COPY --from=builder /app/apps/lrpp-web/.next/static ./apps/lrpp-web/.next/static
COPY --from=builder /app/apps/lrpp-web/public ./apps/lrpp-web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/lrpp-web/server.js"]
