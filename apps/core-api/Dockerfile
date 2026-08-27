# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/core-api/package.json apps/core-api/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
RUN --mount=type=cache,id=veb-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --filter @veb/core-api... --store-dir /pnpm/store

FROM deps AS seed
COPY tsconfig.base.json ./
COPY apps/core-api/tsconfig.json apps/core-api/tsconfig.json
COPY apps/core-api/prisma apps/core-api/prisma
RUN pnpm --filter @veb/core-api prisma:generate
USER node
ENTRYPOINT ["pnpm", "--filter", "@veb/core-api", "exec", "tsx", "prisma/seed.ts"]

FROM deps AS builder
COPY tsconfig.base.json ./
COPY apps/core-api/prisma apps/core-api/prisma
RUN pnpm --filter @veb/core-api prisma:generate
COPY apps/core-api apps/core-api
COPY packages/api-contracts packages/api-contracts
COPY --from=deps /app/apps/core-api/node_modules apps/core-api/node_modules
COPY --from=deps /app/packages/api-contracts/node_modules packages/api-contracts/node_modules
RUN --mount=type=cache,id=core-api-next-cache,target=/app/apps/core-api/.next/cache,sharing=locked \
    pnpm --filter @veb/core-api build

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
COPY --from=builder --chown=nextjs:nodejs /app/apps/core-api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/core-api/.next/static ./apps/core-api/.next/static
USER nextjs
EXPOSE 1067
CMD ["node", "apps/core-api/server.js"]
