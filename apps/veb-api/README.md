# @veb/veb-api

VEB system API owns authentication, users, roles, permissions, menus, profiles,
files, and operation logs. It runs on port `1067` and does not access the blog
database.

## Routes

- Canonical: `/api/v1/system/**`, `/api/v1/me/**`, `/api/v1/files/**`,
  `/api/v1/navigation`, and `/api/v1/dashboard/stats`
- Blog management BFF: `/api/v1/blog/**`
- Service JWKS: `/api/internal/.well-known/jwks.json`
- Health: `/api/health/live`, `/api/health/ready`, and `/api/v1/health`

The BFF authorizes the current user with the existing `content:*` permissions,
then signs the final internal request with a 60-second RS256 service token.

## Application structure

Route Handlers under `app/api` are transport adapters: they authenticate,
parse input, format responses, and trigger audit records. Database access,
transactions, storage operations, password hashing, menu traversal, health
checks, and Blog BFF orchestration live under `src/modules` by domain.

## Database

`prisma/schema.prisma` only exposes VEB-owned models.

Production containers must run the `migrate` Docker target before starting the
default `runner` target. Seeding is an explicit operation and is never run by
the application entrypoint.
