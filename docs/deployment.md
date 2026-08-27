# First Deployment

The project has not been deployed. This document describes first-launch preparation and does not assert that production exists.

## Exposure boundary

Compose exposes `web-public` on `WEB_PUBLIC_PORT` as the only non-loopback/public listener. `web` and `core-api` stay on the private Compose network. PostgreSQL also stays private to services but has a `127.0.0.1`-only `DB_PORT` binding for local migration and maintenance commands; it must never bind to a public interface. External API clients use the same Web gateway and `/api/**` proxy as browsers.

## Required configuration

| Area           | Variables                                                      |
| -------------- | -------------------------------------------------------------- |
| Database       | `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DATABASE_URL` |
| Authentication | `AUTH_SECRET`, `PUBLIC_APP_URL`                                |
| Blog likes     | `BLOG_VISITOR_HASH_SECRET`                                     |
| Initialization | `SEED_ADMIN_PASSWORD`                                          |
| Network        | `WEB_PUBLIC_PORT`, `CORE_API_INTERNAL_URL`                     |

Container `DATABASE_URL` must use the `postgres` service hostname. Production values must replace every placeholder. Core API needs write access to the uploads volume.

## Local port behavior

The direct `pnpm dev` launcher prefers Web port `1066` and Core API port `1067`. When either port is unavailable, it reserves the next free port before starting both applications and injects matching `AUTH_URL` and `CORE_API_INTERNAL_URL` values. It reports the effective URLs and does not terminate the process that owns the requested port. `WEB_DEV_PORT` and `CORE_API_DEV_PORT` override the preferred ports; `VEB_DEV_STRICT_PORTS=1` disables fallback selection.

The development Compose environment exposes `web-public` on host port `1068`, while the private Web container continues to listen on `1066`. `PUBLIC_APP_URL` is mapped to the Core API container's `AUTH_URL`, so development authentication uses `http://localhost:1068`. Production Compose continues to use the explicit `WEB_PUBLIC_PORT` and `PUBLIC_APP_URL` values in `.env.production`.

Compose does not select fallback ports. `WEB_PUBLIC_PORT` and `DB_PORT` are explicit deployment inputs so operators, health checks, proxies, and firewall rules use predictable bindings. Change those values deliberately in the selected Compose environment file when a host binding must move.

## Pre-deployment validation

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:verify:init
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production build
docker compose --env-file .env.production --profile operations build seed
```

`db:verify:init` uses an isolated temporary PostgreSQL container and verifies the single init migration plus seed. It does not touch named deployment volumes.

## Deployment

After host, domain, TLS, secrets, backups, and rollback ownership are confirmed:

```bash
pnpm compose:deploy
```

Compose waits for this dependency chain:

```text
postgres healthy -> migrate completed -> core-api healthy -> web healthy -> web-public healthy
```

The deploy script removes only the completed `migrate` one-shot container and applies bounded image/build-cache cleanup. It does not seed automatically.

## First initialization

Run seed explicitly after the first migration:

```bash
docker compose --env-file .env.production --profile operations run --rm seed
```

Seed synchronizes built-in modules, menus, `blog:*` permissions, roles, and the admin password. Treat it as an explicit operational action.

## Smoke tests

Verify through the public gateway:

- `/api/health/live` and `/api/health/ready` return healthy envelopes and request IDs.
- anonymous access can list published `/api/v1/blog/articles`.
- anonymous access to `/api/v1/blog/manage/articles` is rejected.
- authenticated users without `blog:*` permissions receive 403 on management routes.
- an authorized administrator can publish an article and then read it anonymously.
- public DTOs contain no database ID, account username, status, or draft fields.
- Core API and Web application ports have no host binding; PostgreSQL is bound only to `127.0.0.1` and is unreachable from external networks.

Record actual commands, timestamps, host/domain, image identifiers, migration result, seed result, and smoke-test evidence before declaring first deployment complete.

## Cleanup safety

Do not delete PostgreSQL volumes or uploads during routine deployment. Any destructive cleanup requires explicit user approval and verified backup/restore evidence.
