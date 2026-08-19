# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apk add --no-cache openssl \
    && corepack enable \
    && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/veb-api/package.json apps/veb-api/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
COPY packages/api-kit/package.json packages/api-kit/package.json
COPY packages/service-auth/package.json packages/service-auth/package.json
RUN --mount=type=cache,id=veb-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile \
      --filter @veb/veb-api... \
      --store-dir /pnpm/store

FROM deps AS builder
COPY tsconfig.base.json ./
COPY apps/veb-api/prisma apps/veb-api/prisma
RUN pnpm --filter @veb/veb-api prisma:generate
COPY apps/veb-api apps/veb-api
COPY packages/api-contracts packages/api-contracts
COPY packages/api-kit packages/api-kit
COPY packages/service-auth packages/service-auth
RUN --mount=type=cache,id=veb-api-next-cache,target=/app/apps/veb-api/.next/cache,sharing=locked \
    pnpm --filter @veb/veb-api build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=1067
ENV UPLOAD_DIR=/app/uploads
WORKDIR /app
RUN apk add --no-cache openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && mkdir -p /app/uploads \
    && chown nextjs:nodejs /app/uploads
COPY --from=builder --chown=nextjs:nodejs /app/apps/veb-api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/veb-api/.next/static ./apps/veb-api/.next/static
USER nextjs
EXPOSE 1067
CMD ["node", "apps/veb-api/server.js"]
