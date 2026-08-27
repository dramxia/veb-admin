# VEB

VEB is a Next.js monorepo with one Web application, one Core API, and one PostgreSQL database.

## Architecture

```text
Browser / external client
  -> web-public (Nginx)
  -> apps/web pages and same-origin /api proxy
  -> apps/core-api Auth.js + RBAC + system and blog modules
  -> PostgreSQL

apps/core-api -> uploads volume
```

- `apps/web`: administration UI, public article pages, and the same-origin API proxy.
- `apps/core-api`: authentication, users, roles, modules, menus, files, audit logs, articles, tags, and likes.
- `packages/api-contracts`: shared Zod schemas, DTOs, response envelopes, and error codes.
- `deploy/nginx/web-public.conf`: the only public gateway.

## Local development

Requirements: Node.js 20+, pnpm 9, Docker with Compose.

```bash
pnpm install
pnpm dev:infra
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

Local endpoints:

- Direct Web development server: `http://localhost:1066` by default.
- Direct Core API development server: `http://localhost:1067` by default.
- Development Compose gateway: `http://localhost:1068`.

`pnpm dev` keeps the direct development defaults when they are available. If another process uses either port, the development launcher selects the next free ports, prints the effective URLs, and updates the Web proxy and Auth.js URL for that run. It never stops the process that owns an occupied port.

Set explicit preferred ports with `WEB_DEV_PORT` and `CORE_API_DEV_PORT`. Set `VEB_DEV_STRICT_PORTS=1` when startup must fail instead of selecting fallback ports:

```bash
WEB_DEV_PORT=2066 CORE_API_DEV_PORT=2067 pnpm dev
VEB_DEV_STRICT_PORTS=1 pnpm dev
```

Compose host ports remain explicit through `WEB_PUBLIC_PORT` and `DB_PORT` in the selected Compose environment file. The development environment uses `WEB_PUBLIC_PORT=1068`, leaving `1066` available to the direct Web development server.

The seed user is `admin`; its password is read from `SEED_ADMIN_PASSWORD`.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:verify:init
docker compose --env-file .env.development config --quiet
```

`db:verify:init` creates and removes an isolated temporary PostgreSQL container. It never touches the normal development database or named volumes.

## API boundaries

- Public blog: `/api/v1/blog/articles/**`, `/api/v1/blog/tags/**`
- Private blog management: `/api/v1/blog/manage/**`
- System management: `/api/v1/system/**`
- Current user/navigation/files: `/api/v1/me/**`, `/api/v1/navigation`, `/api/v1/files/**`

Responses use `{ code, data, message }`; request correlation uses `X-Request-Id`.

See [architecture](docs/architecture.md), [permissions](docs/permission.md), and [deployment](docs/deployment.md).
