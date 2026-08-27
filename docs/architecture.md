# VEB Architecture

## Goals

VEB uses one backend runtime and one database because the blog is a first-class application module, not an independent service. The architecture keeps one public ingress, one authentication/RBAC boundary, one Prisma client, and one audit trail.

## Components

```text
apps/
  web/       UI, SSR, public article pages, same-origin API proxy
  core-api/  Auth.js, RBAC, system administration, files, audit, blog
packages/
  api-contracts/  shared Zod schemas and HTTP DTOs
deploy/
  migrate/         one-shot Prisma migration image
  nginx/           Web public gateway
```

Core API uses thin Next Route Handlers. HTTP adaptation and access declarations live under `app/api`; domain work lives under `src/modules`; runtime adapters live under `lib`.

## Runtime topology

```text
Browser / external client
  -> web-public :${WEB_PUBLIC_PORT} on host (:1068 in development)
  -> web :1066 (Compose private network)
  -> core-api :1067 (Compose private network)
  -> postgres :5432 (Compose private network)

core-api -> uploads volume
```

`web-public` is the only non-loopback/public listener. Its host port is distinct from the private Web container port; development uses host port `1068` while the Web container continues to listen on `1066`. Core API and the Web application process have no host port. PostgreSQL has a `127.0.0.1`-only host binding for local migration and maintenance commands but is never exposed on an external interface. The gateway replaces spoofable forwarding headers and supplies `X-Request-Id`.

## Request paths

### Authentication and administration

```text
Browser -> Web same-origin /api proxy -> Core API Auth.js / defineApiRoute -> PostgreSQL
```

Auth.js creates the JWT session. Private application routes recompute permissions from the database before protected work. UI visibility is only a convenience; Core API is the enforcement boundary.

### Blog management

Management routes live under `/api/v1/blog/manage/**`. They use the same Session, `blog:*` RBAC, Prisma client, response envelope, and operation audit as system administration. There is no BFF, internal Blog API, service token, JWKS, replay table, or cross-service retry.

### Public blog

Public articles, tags, and likes live under `/api/v1/blog/**` outside the `manage` subtree. Browser and external clients reach these routes through the Web public gateway and same-origin proxy. Public article DTOs exclude database IDs, account usernames, status, and draft data.

## Route boundary

Every standard Core API method is created by `defineApiRoute`:

- `public`: no Session requirement.
- `private`: Session required before the handler.
- `private` with `permission`: Session and RBAC required before the handler.
- permission arrays preserve existing any-of semantics.
- optional audit records successful and failed operations with sensitive payload fields redacted.
- all responses receive request IDs, error mapping, and access logging.

The Auth.js catch-all route is the sole documented exception because Auth.js owns its exported handler. It still applies request IDs and access logging explicitly. Health routes are public declarations, not exceptions.

## Data ownership

One PostgreSQL database stores users, roles, modules, menus, assignments, sessions, file metadata, operation logs, articles, tags, article-tag relations, and likes.

`Article.authorId` is required and references `User.id` with restrictive deletion. Author display data is read from the current User record; duplicate username/nickname snapshots are not stored. Attempting to delete a user with articles returns a 409 conflict.

## Availability

Core API readiness checks its own database and required authentication configuration. Since blog and system data share one database and runtime, they share that failure boundary. Public article availability no longer survives a Core API outage.

## Initialization and deployment

There is one current init migration and one seed. Compose startup order is:

```text
postgres healthy -> migrate completed -> core-api healthy -> web healthy -> web-public healthy
```

No historical migration chain or data upgrade path is maintained before first production launch.
