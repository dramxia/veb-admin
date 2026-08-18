# @veb/blog-api

Independent blog content service. It owns articles, tags, article-tag links, and
article likes. It never reads the VEB identity database.

## Endpoints

- Public API: `/api/v1/public/**`
- VEB-only management API: `/api/internal/v1/**`
- Health checks: `/api/health/live` and `/api/health/ready`

Internal requests require a short-lived, request-bound RS256 bearer token issued
by `@veb/veb-api`. Public responses intentionally omit database IDs, account
usernames, and publication state.

## Local development

Development uses the committed `.env.development`; production uses
`.env.production`. Next.js selects the file from `NODE_ENV`, while the Prisma
and seed scripts select it explicitly. Review the values, run
`pnpm prisma:generate`, apply the database migrations, and then run `pnpm dev`.
The service listens on port `1068`.
