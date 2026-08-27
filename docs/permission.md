# Permission Model

## Data model

RBAC uses `User`, `Role`, `AppModule`, `Menu`, `UserRole`, `RoleModule`, and `RoleMenu`. PAGE and BUTTON menu records carry unique permission codes. A role can receive a menu only inside an assigned module.

The built-in modules include dashboard and administration. Blog administration is represented by the blog menu tree and `blog:*` permissions under the administration module.

## Effective authorization

A user's effective authorization is computed from enabled users, enabled roles, enabled modules, enabled menu entries, and valid role assignments. The `superadmin` role receives all enabled modules and menus dynamically.

Permission array checks use any-of semantics: access succeeds when the user has at least one requested code.

## Route enforcement

Every standard Core API method uses `defineApiRoute`:

- `access: public` allows anonymous calls.
- `access: private` requires an Auth.js Session.
- a private permission declaration requires Session plus the declared permission or any member of a declared permission list.
- route processing also applies request ID, error mapping, access logging, and optional operation audit.

The Auth.js catch-all handler is the only documented exception. Frontend navigation and permission controls never replace server enforcement.

## Blog permissions

Blog management uses these permission families:

- `blog:article:view`
- `blog:article:create`
- `blog:article:update`
- `blog:article:delete`
- `blog:article:publish`
- `blog:tag:view`
- `blog:tag:create`
- `blog:tag:update`
- `blog:tag:delete`
- `blog:tag:assign`
- `blog:like:view`
- `blog:like:stats`
- `blog:like:delete`

Publishing through create or update requires the ordinary write permission plus `blog:article:publish`. The authenticated user is the article author; clients cannot submit or override author identity.

Public article, tag, and like routes under `/api/v1/blog/**` are anonymous. Management routes under `/api/v1/blog/manage/**` are private and carry the relevant permission declaration.

## Navigation and pages

Seeded blog management pages are:

- `/admin/blog/article`
- `/admin/blog/tag`
- `/admin/blog/like`

Server-side page resolution requires both module assignment and the page permission. BUTTON permissions control commands within those pages. Unknown, disabled, cross-module, or unassigned pages are rejected.

## Role delegation

Role and access assignment APIs enforce the caller's delegable role boundary. A caller cannot grant roles, modules, pages, or buttons outside their own effective scope. `superadmin` remains the full administrative authority.

## Audit

Management writes record operation audit entries. Blog actions use the `blog.*` action namespace. Success and failure are recorded where configured; passwords, tokens, and secrets are redacted from JSON payloads.
