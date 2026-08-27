# @veb/core-api

Core API is the single backend runtime for authentication, RBAC, system administration, files, audit logs, and the blog module.

## API boundaries

- Public blog: `/api/v1/blog/articles/**`, `/api/v1/blog/tags/**`
- Private blog management: `/api/v1/blog/manage/**`
- System management: `/api/v1/system/**`
- Session-owned resources: `/api/v1/me/**`, `/api/v1/navigation`, `/api/v1/files/**`
- Health: `/api/health/live`, `/api/health/ready`

Every standard route is created through `defineApiRoute` and explicitly declares `public` or `private`. Private routes optionally declare one permission or an any-of permission list. The Auth.js catch-all adapter is the only documented exception because Auth.js owns that handler contract directly.

The application owns one Prisma schema and database. Blog articles have a required author relation to `User`; deleting an author with articles returns a conflict.
