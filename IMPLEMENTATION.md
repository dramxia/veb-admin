# Monorepo 实施状态

项目已从单体 Next.js 应用重构为原生 pnpm workspace。当前实现与运行方式以 [README.md](./README.md) 为准，架构边界和生产部署分别见 [docs/architecture.md](./docs/architecture.md) 与 [docs/deployment.md](./docs/deployment.md)。

## 工作区

```text
apps/web                 后台 UI 与 /articles
apps/veb-api             Auth.js、RBAC、系统、文件、审计与博客管理 BFF
apps/blog-api            文章、标签、点赞、公开和内部博客 API
packages/api-contracts   Zod HTTP 契约
packages/service-auth    RS256 服务身份认证与 JWKS
tools/migrate-blog-data  双库数据迁移与验证
```

## 已落实的边界

- Web 不包含 Prisma、数据库环境变量或 API 业务 Route Handler。
- VEB API 和 Blog API 使用独立 Prisma schema、migration history 与 PostgreSQL。
- 博客管理请求经 VEB RBAC 后，以 60 秒请求绑定服务令牌访问 Blog internal API。
- Blog public API 不依赖 VEB API，公开 DTO 不暴露数据库 ID、账号或草稿状态。
- 旧 API 路径保留一个发布周期；canonical API 使用 `/api/v1/**`。
- 生产容器只执行 `prisma migrate deploy`，不会自动 `db push` 或 seed。

## RBAC 最终模型

系统授权链已统一为：

```text
AppModule
  -> Menu(DIR / PAGE / LINK / BUTTON)
  -> RoleModule + RoleMenu
  -> UserRole
  -> User
```

- `AppModule` 只保存编码、名称、描述、图标、排序、状态和系统标记，不注册模块级入口组件、路径前缀或布局能力。
- `Menu` 同时承担导航和权限资源职责。页面组件仍由 `PAGE.component` 与 Web 页面 manifest 加载。
- `DIR` 只组织树；`PAGE` 是内部页面和模块落点；`LINK` 是外链；`BUTTON` 必须直属页面并控制按钮及 API 操作。
- `RoleMenu` 只持久化 `PAGE/LINK/BUTTON`。其复合外键同时依赖 `RoleModule` 和同模块 `Menu`，数据库拒绝跨模块授权。
- 有效授权逐角色计算，保持“同一角色必须同时拥有模块和节点”的门禁，禁止跨角色拼接。
- `permissionCodes` 由有效菜单节点生成，现有 `<Auth>` 和 `requirePermission` 接口保持不变。
- `superadmin` 隐式拥有全部启用模块和有效节点，访问权限配置只读。

角色访问权限使用单一原子接口：

```http
PUT /api/v1/system/roles/:id/access
```

```json
{
  "modules": [
    {
      "moduleId": "module-admin",
      "menuIds": ["menu-system-user", "button-system-user-create"]
    }
  ]
}
```

服务端去重并校验模块、节点归属、目录、按钮父页面和模块落点，在 Serializable 事务中全量替换 `RoleModule` 与 `RoleMenu`。`role.assign-access` 审计记录变更前后的模块和节点 ID。旧权限资源 CRUD、角色模块分配与角色权限分配接口保留一个发布周期，统一返回 HTTP `410 Gone`。

## 导航与管理端

- `GET /api/v1/navigation` 为每个可用模块返回用户级 `landingPath` 和不含按钮的菜单树。
- 模块与菜单按 `sort -> name -> id` 稳定排序；树深度优先遇到的首个启用、可见、已授权 `PAGE` 是落点。
- 没有可用落点的模块从导航隐藏，不回退到未授权页面。`/`、模块切换器和首页动作统一使用 `landingPath`。
- 工作区布局统一调用 `GET /api/v1/navigation/page?path=...`，先精确解析已知 `PAGE.path`，详情子路径再取最长有效前缀：未知页面返回 404，已知但未授权返回 403；单段模块落点不兜底未知子路径。
- 模块管理不再要求注册页面组件，列表统计导航节点、按钮和角色。
- 菜单管理已统一为“菜单与权限”，同一棵树维护目录、页面、外链和按钮；旧权限页面永久重定向。
- 角色列表使用单一“配置访问权限”抽屉。左侧选择模块，右侧勾选页面、外链和按钮，切换模块保留草稿。
- 用户新增、编辑和分配角色流程保持不变。

## 数据迁移

`apps/veb-api/prisma/migrations/20260723120000_app_modules` 按尚未进入共享环境处理，直接定义最终模型，不发布中间态。迁移在写入前检查菜单孤儿、循环、深度、重复路径和权限码、页面必填字段、按钮映射、角色父页面授权、角色落点和 ID 冲突。

历史内置按钮使用显式页面映射；自定义按钮只有在旧父级关系可唯一解析到页面时迁移，无法映射时通过 SQL `RAISE EXCEPTION` 整批回滚。历史菜单型授权迁移到 `PAGE/LINK`，按钮授权迁移到 `BUTTON`，目录授权不持久化。统一菜单管理能力按旧菜单与权限管理能力的交集迁移，防止权限扩大。

生产发布要求同一维护窗口部署 migration、VEB API 和 Web。执行前备份数据库，失败依赖事务回滚，成功后执行授权等价性检查。生产必需的内置节点必须存在于 migration，不能只依赖 seed。

## 验收命令

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

双库切换必须先 dry-run，再 apply，最后 verify：

```bash
pnpm db:migrate:blog-data
pnpm db:migrate:blog-data:apply
pnpm db:verify:blog-data
```

三个迁移命令均要求显式提供 `SOURCE_DATABASE_URL` 和 `BLOG_DATABASE_URL`。切换前还需备份旧数据库与上传目录，并冻结内容写入。
