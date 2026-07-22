FROM node:20-alpine AS dependencies
WORKDIR /workspace
RUN apk add --no-cache openssl && corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/blog-api/package.json apps/blog-api/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
COPY packages/service-auth/package.json packages/service-auth/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY . .
RUN pnpm --filter @veb/blog-api db:generate
RUN pnpm --filter @veb/blog-api build

FROM dependencies AS migration
COPY . .
CMD ["pnpm", "--filter", "@veb/blog-api", "db:deploy"]

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
