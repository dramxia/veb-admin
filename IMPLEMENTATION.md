# Monorepo 实施状态

项目已从单体 Next.js 应用重构为原生 pnpm workspace。当前实现与运行方式以 [README.md](./README.md) 为准，架构边界和生产部署分别见 [docs/architecture.md](./docs/architecture.md) 与 [docs/deployment.md](./docs/deployment.md)。

## 工作区

```text
apps/web                 后台 UI 与 /articles
apps/veb-api             Auth.js、RBAC、系统、文件、审计与博客管理 BFF
apps/blog-api            文章、标签、点赞、公开和内部博客 API
packages/api-contracts   Zod HTTP 契约
packages/service-auth    RS256 服务身份认证与 JWKS
```

## 已落实的边界

- Web 不包含 Prisma、数据库环境变量或 API 业务 Route Handler。
- VEB API 和 Blog API 使用独立 Prisma schema、migration history 与 PostgreSQL。
- 博客管理请求经 VEB RBAC 后，以 60 秒请求绑定服务令牌访问 Blog internal API。
- Blog public API 不依赖 VEB API，公开 DTO 不暴露数据库 ID、账号或草稿状态。
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

服务端去重并校验模块、节点归属、目录、按钮父页面和模块落点，在 Serializable 事务中全量替换 `RoleModule` 与 `RoleMenu`。`role.assign-access` 审计记录变更前后的模块和节点 ID。

## 导航与管理端

- `GET /api/v1/navigation` 为每个可用模块返回用户级 `landingPath` 和不含按钮的菜单树。
- 模块与菜单按 `sort -> name -> id` 稳定排序；树深度优先遇到的首个启用、可见、已授权 `PAGE` 是落点。
- 没有可用落点的模块从导航隐藏，不回退到未授权页面。`/`、模块切换器和首页动作统一使用 `landingPath`。
- 工作区布局统一调用 `GET /api/v1/navigation/page?path=...`，先精确解析已知 `PAGE.path`，详情子路径再取最长有效前缀：未知页面返回 404，已知但未授权返回 403；单段模块落点不兜底未知子路径。
- 模块管理不再要求注册页面组件，列表统计导航节点、按钮和角色。
- 菜单管理已统一为“菜单与权限”，同一棵树维护目录、页面、外链和按钮。
- 角色列表使用单一“配置访问权限”抽屉。左侧选择模块，右侧勾选页面、外链和按钮，切换模块保留草稿。
- 用户新增、编辑和分配角色流程保持不变。

## 数据初始化

项目尚未上线，数据库由单一初始化迁移 `apps/veb-api/prisma/migrations/20260818000000_init` 建表，只描述当前最终模型。生产部署先执行 `prisma migrate deploy`，再按需显式执行 seed 写入内置模块、菜单与超级管理员授权。

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
