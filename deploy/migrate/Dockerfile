# syntax=docker/dockerfile:1
FROM node:20-alpine AS runner
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
WORKDIR /app
RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY deploy/migrate/package.json deploy/migrate/package.json
RUN --mount=type=cache,id=veb-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --prod --filter @veb/migration-runner --store-dir /pnpm/store
COPY apps/core-api/prisma /app/apps/core-api/prisma
USER node
ENTRYPOINT ["/app/deploy/migrate/node_modules/.bin/prisma"]
