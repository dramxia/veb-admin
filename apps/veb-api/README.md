# @veb/veb-api

VEB system API owns authentication, users, roles, permissions, menus, profiles,
files, and operation logs. It runs on port `1067` and does not access the blog
database.

## Routes

- Canonical: `/api/v1/system/**`, `/api/v1/me/**`, `/api/v1/files/**`,
  `/api/v1/navigation`, and `/api/v1/dashboard/stats`
- Transition aliases: `/api/system/**`, `/api/profile/**`, `/api/files/**`, and
  `/api/menu/me`
- Blog management BFF: `/api/v1/blog/**`
- Transition Blog BFF alias: `/api/admin/**`
- Service JWKS: `/api/internal/.well-known/jwks.json`
- Health: `/api/health/live`, `/api/health/ready`, and `/api/v1/health`

The BFF authorizes the current user with the existing `content:*` permissions,
then signs the final internal request with a 60-second RS256 service token.

## Application structure

Route Handlers under `app/api` are transport adapters: they authenticate,
parse input, format responses, and trigger audit records. Database access,
transactions, storage operations, password hashing, menu traversal, health
checks, and Blog BFF orchestration live under `src/modules` by domain. The
canonical `/api/v1` routes re-export the transition handlers so both route sets
execute the same application services during the compatibility release.

## Database

`prisma/schema.prisma` only exposes VEB-owned models. The historical content
migration remains for one transition release so an existing database keeps a
consistent migration history and its rollback tables. Those tables are not
available through this service's Prisma Client and can be dropped in a later
VEB migration after the split is verified.

Production containers must run the `migrate` Docker target before starting the
default `runner` target. Seeding is an explicit operation and is never run by
the application entrypoint.
