# 项目迁移代码排查报告

> **状态：已全部清理完毕。** 本报告保留作为变更清单，记录每类迁移代码的位置与处置方式。
>
> 前提：本项目尚未上线，不存在线上数据库和用户数据，所有“为兼容旧版本/旧数据”而存在的迁移代码均为无用代码。

## 0. 当前工作区的重要状态（先看这里）

工作区已有一批**未提交的删除**，方向正确但不彻底：

| 已删除（待提交）                                                                                               | 说明                                      |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `tools/migrate-blog-data/`（整个目录，约 1500 行）                                                             | 单库拆双库的博客数据迁移 CLI 工具 ✅ 应删 |
| `apps/veb-api/prisma/migrations/20260712000000_content_articles/migration.sql`                                 | 单库拆双库的数据库迁移 ✅ 应删            |
| `README.md` / `IMPLEMENTATION.md` / `docs/architecture.md` / `package.json` / `pnpm-workspace.yaml` 中对应条目 | 同步清理 ✅                               |

**⚠️ 删除不干净的残留（会破坏 CI，需一并处理）：**

| 位置                                                                  | 问题                                                                                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `apps/veb-api/lib/__tests__/app-modules-migration.runtime.test.ts:17` | 仍 `readFileSync` 已删除的 `20260712000000_content_articles/migration.sql`，设置 `MIGRATION_TEST_DATABASE_URL` 时直接崩溃 |
| `.github/workflows/ci.yml:83-87`                                      | `Test VEB migrations against PostgreSQL` 步骤专门运行上述 runtime 测试，该测试整体已无存在意义（见 §3）                   |

---

## 1. 数据库迁移文件（Prisma migrations）

### 1.1 `apps/veb-api/prisma/migrations/` — ⚠️ 建议整体重建

项目未上线 ⇒ 不需要迁移历史，建议**删除全部既有迁移，按当前 `schema.prisma` 重新生成一个干净的 init 迁移**。若选择保留目录结构，逐项评估如下：

| 迁移                                         | 内容                                                                                                                                                                    | 评估                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `20260526000000_init`                        | 初始 schema（含已废弃的 `Permission` 表等旧模型）                                                                                                                       | 🟡 无用：可合并进新 init        |
| `20260723000000_admin_menu_paths`（79 行）   | 规范化**存量数据库**中菜单路径的旧分隔符，含预检 + 事务 + 回滚                                                                                                          | 🔴 **纯存量数据修正，完全无用** |
| `20260723120000_app_modules`（138 行）       | 引入 `AppModule`，并处理"已存在行"的回填（nullable 列→backfill→转 NOT NULL）                                                                                            | 🔴 回填逻辑无用                 |
| `20260724120000_role_menu_access`（1075 行） | 核心：把**旧 Permission 表 + 旧菜单授权**迁移到新 RBAC 模型。大量 legacy 校验、旧 ID 保留、旧枚举 `MenuType_legacy` 重命名、临时表 `_LegacyOpenDashboardRole`、异常回滚 | 🔴 **最典型、最重的无用迁移**   |

### 1.2 `apps/blog-api/prisma/migrations/20260722000000_init_blog`

- 55 行，是 blog 库的初始建表。🟢 保留（作为博客库唯一 init 迁移即可）。

### 1.3 `apps/blog-api/prisma/seed.ts:1`

```ts
// Blog content is migrated from the legacy database. No bootstrap rows are required.
```

- 🔴 注释引用"从旧库迁移内容"，事实性残留，建议改为普通的"无种子数据"说明。

---

## 2. 迁移专用测试与 fixtures（apps/veb-api/lib/**tests**/）

以下测试**只服务于上面那些面向存量数据的迁移**，迁移删除后全部无用：

| 文件                                                  | 说明                                                                          | 评估                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| `app-modules-migration.runtime.test.ts`（约 430 行）  | 起真实 PostgreSQL schema 逐条应用 5 个迁移文件，验证 legacy 数据迁移与回滚    | 🔴 无用（且引用已删文件，当前会挂） |
| `app-modules-migration.test.ts`                       | 静态断言 `role_menu_access`/`app_modules` SQL 的事务性、回滚、legacy 权限替换 | 🔴 无用                             |
| `admin-menu-path-migration.test.ts`                   | 静态断言 `admin_menu_paths` SQL                                               | 🔴 无用                             |
| `fixtures/app-modules-legacy-valid.sql`               | 构造完整"旧数据库"状态（legacy 权限/菜单/角色授权）                           | 🔴 无用                             |
| `fixtures/app-modules-invalid-parent.sql`             | 迁移异常场景 fixture                                                          | 🔴 无用                             |
| `fixtures/app-modules-unmapped-menu.sql`              | 同上                                                                          | 🔴 无用                             |
| `fixtures/app-modules-unmapped-button.sql`            | 同上                                                                          | 🔴 无用                             |
| `fixtures/app-modules-incomplete-unified-actions.sql` | 同上                                                                          | 🔴 无用                             |

> 注意：`fixtures/` 删除前确认无其他测试引用（当前仅迁移测试引用）。

---

## 3. API 过渡别名（Transition Aliases）—— 为一个发布周期保留的兼容路由

文档自述"保留一个发布周期"，未上线 ⇒ 无旧客户端 ⇒ 全部无用。

### 3.1 veb-api 非版本化兼容路由（`app/api/` 下，规范路由在 `app/api/v1/`）

| 路由                                                                                                | 别名对象                             | 评估            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------- |
| `app/api/system/**`（25 个 route 文件）                                                             | `/api/v1/system/**`                  | 🔴 整棵目录可删 |
| `app/api/profile/route.ts`、`app/api/profile/change-password/route.ts`                              | `/api/v1/me/**`                      | 🔴 可删         |
| `app/api/files/route.ts`、`app/api/files/[id]/route.ts`                                             | `/api/v1/files/**`                   | 🔴 可删         |
| `app/api/menu/me/route.ts`                                                                          | `/api/v1/navigation`（旧版响应形状） | 🔴 可删，见 §4  |
| `app/api/admin/[...path]/route.ts` + `src/modules/blog-bff/service.ts` 中 `proxyBlogAdminRequest()` | `/api/v1/blog/**` 的旧 BFF 别名      | 🔴 可删         |

> 保留：`app/api/auth/**`、`app/api/health/**`、`app/api/internal/**`（它们不是别名，是唯一实现）。

### 3.2 已废弃接口的 410 Gone 占位（迁移提示用）

| 文件                                                                                      | 说明                                                      | 评估                                    |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `src/modules/permissions/service.ts`（整个文件）                                          | 5 个 `@deprecated` 函数统一抛 410"已合并到菜单与权限管理" | 🔴 未上线无需告知旧调用方，连路由一起删 |
| `app/api/system/permissions/route.ts`、`[id]/route.ts` 及 v1 镜像                         | 旧权限资源 CRUD 的 410 占位                               | 🔴 删                                   |
| `src/modules/roles/service.ts:427-446` `assignRolePermissions()` / `assignRoleModules()`  | 旧角色分配接口，抛 GoneError                              | 🔴 删                                   |
| `app/api/system/roles/[id]/permissions/route.ts`、`[id]/modules/route.ts` 及 v1 镜像      | 返回 410 并提示"改用 PUT /roles/:id/access"               | 🔴 删                                   |
| `lib/__tests__/permissions-service.test.ts`、`role-assignment-routes.test.ts`（部分用例） | 验证上述 410 行为                                         | 🔴 随源码删除                           |

---

## 4. 旧版响应形状兼容（Legacy Shapes）

| 位置                                                                                                                                       | 说明                                                               | 评估                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------- |
| `packages/api-contracts/src/veb.ts:377-380` `legacyUserNavigationSchema`、`:682` `LegacyUserNavigation` 类型、`contracts.test.ts` 对应用例 | 在导航响应上额外挂旧 `menus` 字段                                  | 🔴 无用                                                 |
| `src/modules/navigation/service.ts:246-256` `getUserMenuAndPermissions()`                                                                  | 生成 legacy 导航形状，仅供 `/api/menu/me` 使用                     | 🔴 随 §3.1 一起删                                       |
| `packages/api-contracts/src/veb.ts:693-707` 尾部"Compatibility aliases"导出块                                                              | `userCreateSchema`/`roleSchema` 等 14 个旧命名导出                 | 🟡 若 veb-api 内部仍引用，直接改为引用新名后删除别名块  |
| `apps/veb-api/lib/permission-cache.ts` `invalidatePermissionCache()`                                                                       | 文档自述"仅作为兼容钩子保留"的空函数（授权已改为每请求直读数据库） | 🟡 兼容性残留，可删并清理各 mutation service 中的调用点 |

---

## 5. 前端迁移/兼容代码

| 位置                                                                                                                     | 说明                                                                              | 评估                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `apps/web/stores/ui-store.ts:15-26` `LegacyUiState` 类型 + `migrateUiState()` + persist `version: 2` + `migrate` 配置    | zustand localStorage 旧 key `sidebarCollapsed` → `desktopSidebarCollapsed` 的迁移 | 🔴 未上线无旧 localStorage，可删迁移函数，persist 回到 v1 |
| `apps/web/lib/__tests__/ui-store.test.ts` 中迁移用例                                                                     | 验证上述迁移                                                                      | 🔴 随删                                                   |
| `apps/web/lib/api-proxy.ts:8` `PUBLIC_BLOG_PREFIXES` 中 `'/api/public'`                                                  | 代理旧版博客公开路径                                                              | 🔴 移除数组第二项                                         |
| `apps/web/next.config.mjs:17-26` `/admin/profile → /profile` 永久重定向                                                  | 旧 URL 兼容                                                                       | 🔴 可删                                                   |
| `apps/web/app/(workspace)/admin/page.tsx` `LegacyAdminLandingPage`                                                       | 旧 `/admin` 落点兼容跳转到模块 landingPath                                        | 🟡 见下方说明，可删或改 404                               |
| `apps/web/app/(workspace)/layout.tsx` `GLOBAL_OR_LEGACY_PATHS` 中 `/admin`、`/admin/profile`、`/admin/system/permission` | 旧路径白名单                                                                      | 🟡 随旧页面删除后缩减                                     |
| `apps/web/middleware.ts` `GLOBAL_PATHS` 中 `/admin/profile`、`/admin/system/permission`                                  | 同上                                                                              | 🟡 同上                                                   |
| `apps/web/e2e/routing.spec.ts` 中 legacy 重定向断言（`/admin/profile` 308、`/admin` 307 等）                             | 验证旧路径行为                                                                    | 🟡 随删改                                                 |

> 说明：`/admin` 当前承载"后台管理模块"的入口跳转逻辑；若产品仍想让 `/admin` 可用，可保留但去掉 "Legacy" 命名与注释，它就不再是迁移代码。

### blog-api 旧版公开路由

| 位置                                                                                           | 说明                                         | 评估        |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------- |
| `apps/blog-api/app/api/public/**`（5 个 route 文件）                                           | `/api/v1/public/**` 的"一个发布周期"兼容别名 | 🔴 整目录删 |
| `apps/blog-api/src/http/public.ts:53` `listTagsLegacy()`（旧响应形状：裸数组 vs 新 `{items}`） | 仅供旧路由使用                               | 🔴 随删     |
| `apps/blog-api/README.md` "One-release compatibility aliases" 条目                             | 文档同步                                     | 🔴          |

---

## 6. 部署 / CI 中的迁移基础设施（谨慎评估）

| 位置                                                                                                                                                                                                           | 说明                                          | 评估                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `deploy/migrate/`（Dockerfile + package.json）、`docker-compose.yml` 的 `x-prisma-migrate`/`veb-migrate`/`blog-migrate`、`deploy/compose-deploy.sh` 中容器清理、`.github/workflows/ci.yml` 的 `migrations` job | Prisma migrate 专用镜像与"先迁移后启动"流水线 | 🟢 **保留**。这不是"旧版本迁移"，而是首次部署建库的正规机制。未上线项目同样需要在生产环境 `migrate deploy` 建表 |
| `.github/workflows/ci.yml:83-87` 迁移 runtime 测试步骤                                                                                                                                                         | 依赖已删除的迁移文件                          | 🔴 删除该步骤（或随 §2 测试整体删除）                                                                           |
| `docs/deployment.md:58` "拆库切换后保留旧内容表只读、回滚、观察期后提交删除旧表的 migration"                                                                                                                   | 整段描述已取消的拆库切换                      | 🔴 文档重写                                                                                                     |
| `apps/veb-api/README.md:33-36` "historical content migration remains for one transition release…"                                                                                                              | 描述的迁移已被删除                            | 🔴 文档重写                                                                                                     |

---

## 7. 文档中的迁移描述残留

| 文件                   | 内容                                                                             | 评估                          |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------- |
| `docs/permission.md`   | §3.2 兼容接口、§7 数据迁移与发布、`menus` 兼容字段注释、"旧 `/admin` 兼容跳转"等 | 🔴 大段描述随代码删除同步清理 |
| `docs/architecture.md` | §9 迁移与发布、`/api/admin/**` 别名、`/api/public/**` 适配器、410 兼容接口等     | 🔴 同上                       |
| `docs/deployment.md`   | §2 数据库迁移中的拆库切换段落                                                    | 🔴 同上                       |

---

## 8. 汇总：建议操作清单

### 🔴 直接删除（无用迁移代码）

1. `apps/veb-api/prisma/migrations/` 下 4 个迁移目录 → 按当前 schema 重新生成单一 init（保留 `migration_lock.toml`）
2. `apps/veb-api/lib/__tests__/`：`app-modules-migration.runtime.test.ts`、`app-modules-migration.test.ts`、`admin-menu-path-migration.test.ts`、`fixtures/`（5 个 SQL）
3. `apps/veb-api/app/api/`：`system/`、`profile/`、`files/`、`menu/`、`admin/` 五棵非版本化别名目录
4. `apps/veb-api/src/modules/permissions/service.ts` 全文件 + 对应 410 路由与测试
5. `apps/veb-api/src/modules/roles/service.ts` 中 `assignRolePermissions`/`assignRoleModules` + 对应 410 路由与测试
6. `src/modules/navigation/service.ts` 的 `getUserMenuAndPermissions` + `legacyUserNavigationSchema` 及其测试
7. `apps/blog-api/app/api/public/` 目录 + `listTagsLegacy`
8. `apps/web/stores/ui-store.ts` 的 `migrateUiState`/`LegacyUiState`（persist 回 v1）+ 对应测试
9. `apps/web/lib/api-proxy.ts` 中 `'/api/public'` 前缀
10. `apps/web/next.config.mjs` 的 `/admin/profile` 重定向、`(workspace)/admin/page.tsx`、`layout.tsx`/`middleware.ts` 中旧路径白名单、对应 e2e 断言
11. `.github/workflows/ci.yml` 中迁移 runtime 测试步骤

### 🟡 改造或改名后保留

- `packages/api-contracts/src/veb.ts` 兼容性别名导出块（内部引用改新名后删）
- `apps/veb-api/lib/permission-cache.ts` `invalidatePermissionCache` 空钩子（连同调用点清理）
- `apps/veb-api/prisma/seed.ts:498` 的 legacy 注释（保留按 permissionCode upsert 的逻辑，改注释）
- `/admin` 模块入口页（若保留，去掉 Legacy 语义）

### 🟢 保留

- `apps/blog-api/prisma/migrations/20260722000000_init_blog`
- `deploy/migrate/`、`docker-compose.yml` migrate 服务、`compose-deploy.sh`、CI 的 `migrate deploy` 步骤（首次部署建库机制）
- 各 `package.json` 的 `prisma:migrate:*` 脚本

### ⚠️ 必须先修复的破坏性残留

- `app-modules-migration.runtime.test.ts` 引用已删除的 `20260712000000_content_articles/migration.sql` → 按 §8.1 第 2 条整体删除该测试即可解决
