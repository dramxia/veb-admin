# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apk add --no-cache openssl && corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/veb-api/package.json apps/veb-api/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
COPY packages/service-auth/package.json packages/service-auth/package.json
RUN pnpm install --frozen-lockfile --filter @veb/veb-api...

FROM deps AS builder
COPY apps/veb-api apps/veb-api
COPY packages/api-contracts packages/api-contracts
COPY packages/service-auth packages/service-auth
RUN pnpm --filter @veb/veb-api prisma:generate
RUN pnpm --filter @veb/veb-api build

FROM builder AS migrate
CMD ["pnpm", "--filter", "@veb/veb-api", "prisma:migrate:deploy"]

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
