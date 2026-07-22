# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /workspace
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat \
  && corepack enable \
  && corepack prepare pnpm@9.15.9 --activate

FROM base AS dependencies
COPY . .
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
RUN pnpm --filter @veb/api-contracts build \
  && pnpm --filter @veb/web build

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
