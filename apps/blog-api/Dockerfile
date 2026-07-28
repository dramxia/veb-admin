FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /workspace
RUN apk add --no-cache openssl \
    && corepack enable \
    && corepack prepare pnpm@9.15.9 --activate

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/blog-api/package.json apps/blog-api/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
COPY packages/service-auth/package.json packages/service-auth/package.json
RUN --mount=type=cache,id=veb-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile \
      --filter @veb/blog-api... \
      --store-dir /pnpm/store

FROM dependencies AS builder
COPY tsconfig.base.json ./
COPY apps/blog-api/prisma apps/blog-api/prisma
RUN pnpm --filter @veb/blog-api db:generate
COPY apps/blog-api apps/blog-api
COPY packages/api-contracts packages/api-contracts
COPY packages/service-auth packages/service-auth
RUN --mount=type=cache,id=blog-api-next-cache,target=/workspace/apps/blog-api/.next/cache,sharing=locked \
    pnpm --filter @veb/blog-api build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=1068
WORKDIR /app
RUN apk add --no-cache openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/blog-api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/blog-api/.next/static ./apps/blog-api/.next/static
USER nextjs
EXPOSE 1068
CMD ["node", "apps/blog-api/server.js"]
