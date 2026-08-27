# VEB Repository Guide

This file applies to the whole repository. Read `README.md` and the relevant parts of `docs/architecture.md`, `docs/permission.md`, and `docs/deployment.md` before changing code.

## Project status

- The project is not deployed and has no production database or user traffic.
- Current code, contracts, and the single Prisma schema are authoritative. Do not keep old routes, fields, tables, migrations, environment names, or compatibility layers.
- Database verification starts from an empty isolated database and the current init migration/seed.
- Never delete local databases, Docker volumes, uploads, or secrets without explicit user approval.
- Do not describe CI or local Compose checks as a production deployment.

## Runtime topology

```text
Browser / external client
  -> web-public
  -> apps/web page or same-origin API proxy
  -> apps/core-api
  -> PostgreSQL

apps/core-api -> uploads volume
```

- Web forwards all `/api/**` requests to Core API and preserves Cookie and `X-Request-Id`.
- Core API owns Auth.js, RBAC, system administration, files, audit logs, articles, tags, and likes.
- Public blog routes are `/api/v1/blog/articles/**` and `/api/v1/blog/tags/**`.
- Private blog management routes are `/api/v1/blog/manage/**` and require Session plus `blog:*` permissions.
- `defineApiRoute` explicitly marks every standard method public/private and owns Session/RBAC, request ID, error/access logging, and optional audit. Auth.js is the only documented technical exception.
- Core API and Web have no host port. `web-public` is the only non-loopback/public listener; PostgreSQL may bind only to `127.0.0.1` for local migration and maintenance commands.

## Database rules

- One PostgreSQL database contains system, Auth.js, file metadata, audit, article, tag, and like data.
- Article author is a required `User` relation with restrictive deletion.
- Schema and the single init migration always express the latest structure. Seed is an explicit initialization operation and updates the admin password.

## Documentation requirements

- Architecture or topology changes must update `docs/architecture.md`.
- Permission, module, menu, route policy, or seed changes must update `docs/permission.md`.
- Compose, environment, migration, health, or release changes must update `docs/deployment.md`.
