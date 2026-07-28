# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /workspace
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat \
  && corepack enable \
  && corepack prepare pnpm@9.15.9 --activate

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
RUN --mount=type=cache,id=veb-pnpm-store,target=/pnpm/store,sharing=locked \
  pnpm install --frozen-lockfile \
    --filter @veb/web... \
    --store-dir /pnpm/store

FROM dependencies AS builder
COPY tsconfig.base.json ./
COPY apps/web apps/web
COPY packages/api-contracts packages/api-contracts
RUN pnpm --filter @veb/api-contracts build
RUN --mount=type=cache,id=web-next-cache,target=/workspace/apps/web/.next/cache,sharing=locked \
  pnpm --filter @veb/web build

FROM node:20-alpine AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=1066
ENV HOSTNAME=0.0.0.0

COPY --from=builder /workspace/apps/web/.next/standalone /app
COPY --from=builder /workspace/apps/web/.next/static /app/apps/web/.next/static

EXPOSE 1066
CMD ["node", "server.js"]
