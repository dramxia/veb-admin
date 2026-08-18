# 架构说明

## 1. Monorepo

仓库使用原生 pnpm workspace，不依赖 Turbo 或 Nx。应用不得跨边界导入其他应用的源码或 Prisma Client，共享内容只能放入 `packages/`。

```text
apps/web             页面、工作区导航、管理端 UI 与同源代理
apps/veb-api         身份、RBAC、系统、文件、审计
apps/blog-api        内容、标签、点赞、公开 API
packages/*           无数据库依赖的契约与服务认证
```

## 2. 请求链路

### 系统管理

```text
Browser -> trusted Web gateway -> Web runtime proxy -> VEB API -> VEB database
```

VEB API 根据 Auth.js session 构建统一授权快照。Web 使用同一快照执行模块、页面和按钮的 UX 控制；页面服务端守卫与 API 权限断言是真正的访问边界。

### 博客管理

```text
Browser -> trusted Web gateway -> Web runtime proxy -> VEB API RBAC
        -> request-bound service JWT -> Blog internal API -> Blog database
```

Web 使用版本化的 `/api/v1/blog/**` 管理入口。

服务令牌有效期 60 秒，固定 issuer、audience、权限码、HTTP method、目标 path、body hash 和 request ID。Blog API 不读取 VEB 数据库，也不接受浏览器 session Cookie。

### 公开博客

```text
Blog frontend -> public gateway -> Blog public API -> Blog database
Web          -> private network -> Blog public API -> Blog database
```

公开列表和详情只返回已经发布且发布时间不晚于当前时间的文章。公开 DTO 不包含数据库 ID、作者账号和草稿字段。

生产 Compose 的 public gateway 仅允许公开 API 与 Blog 健康检查路径，不转发 `/api/internal/v1/**`。

## 3. 数据所有权

VEB 数据库拥有 User、Role、UserRole、AppModule、Menu、RoleModule、RoleMenu、File、OperationLog 和 Auth.js 表。权限码由 `PAGE/LINK/BUTTON Menu` 节点持有，仍属于 VEB，因为它们控制后台人员的页面、按钮和 API 操作。

Blog 数据库拥有 Article、Tag、ArticleTag 和 ArticleLike。Article 使用作者 ID、用户名和昵称快照，不与 User 建立外键。作者改名或删除不会修改历史文章。

文件元数据与本地上传卷归 VEB API。本阶段 Markdown 文章不引入跨服务文件 ID。

## 4. 跨应用契约

`@veb/api-contracts` 是跨应用 DTO 的唯一来源：

- HTTP 日期为带时区的 ISO 8601 字符串。
- 分页为 `{ items, total, page, pageSize }`。
- 响应壳为 `{ code, data, message }`。
- `50301` 表示依赖服务不可用。
- Prisma 类型不得进入 Web 或共享包。
- `AppModule` 契约只包含编码、名称、描述、图标、排序、状态和系统标记。
- `MenuCreate` 是按 `DIR/PAGE/LINK/BUTTON` 判别的联合契约；服务端仍按节点类型执行关系和字段组合校验。
- `UserNavigation` 返回 `modules[]`、`permissionCodes` 和 `roleCodes`。每个模块包含用户级 `landingPath` 以及不含按钮的 `menus[]`。
- 页面实际 React 组件由 `PAGE.component` 和 Web 页面 manifest 映射。

## 5. 模块与菜单

### 5.1 模块

`AppModule` 只是权限和导航分组。模块编码是稳定标识，不派生 URL；模块不定义入口组件、路径前缀或专属布局。所有模块使用相同的工作区 Header、模块切换器和内容布局；只有一个可导航入口的模块隐藏侧栏及其切换按钮。内置仪表盘模块使用 `/dashboard`，后台管理移除仪表盘菜单，`/admin` 直接跳转到后台管理首个可访问页面。

模块停用后立即从有效模块、导航和权限快照移除。模块管理列表分别统计导航节点、按钮和角色，并标记“待配置”或“缺少可用入口”。

### 5.2 菜单节点

```text
AppModule
  +-- DIR
      +-- DIR
      +-- PAGE
          +-- BUTTON
      +-- LINK
  +-- PAGE
      +-- BUTTON
  +-- LINK
```

- `DIR` 只组织树，不持有权限码，不写入 `RoleMenu`。
- `PAGE` 持有全局唯一绝对 `path`、页面 manifest `component` 和全局唯一 `permissionCode`。
- `LINK` 持有 HTTP(S) `externalUrl` 和全局唯一 `permissionCode`，不作为模块落点。
- `BUTTON` 必须直属 `PAGE`，持有全局唯一 `permissionCode`，不具有导航或路由字段。
- 导航节点的父级只能是根或 `DIR`。导航最多四级，按钮不计入深度。
- `moduleId` 与 `type` 创建后不可修改；移动父级必须留在同一模块，服务层检测循环。
- 菜单复合自关联 `(parentId, moduleId) -> (id, moduleId)` 在数据库层拒绝跨模块父子和孤儿。
- 有子节点时拒绝删除；叶子删除级联撤销对应 `RoleMenu`。

## 6. 分层 RBAC

```text
User --< UserRole >-- Role --< RoleModule >-- AppModule
                         |
                         +--< RoleMenu >------ Menu
```

`RoleMenu` 通过 `(roleId, moduleId)` 复合外键依赖 `RoleModule`，并通过 `(menuId, moduleId)` 复合外键依赖 `Menu`。因此节点不可能被授予未分配该模块的角色，也不能被记录到错误模块。

权限快照逐角色计算：普通角色只有同时拥有启用模块和该模块下有效的节点授权时，节点权限才生效；各角色结果最后取并集。禁止用角色 A 的模块授权拼接角色 B 的节点授权。

`permissionCodes` 由有效的 `PAGE/LINK/BUTTON.permissionCode` 生成，供 Auth.js JWT、Web `<Auth>`、页面访问检查和 API `requirePermission` 复用。节点自身或任一祖先停用时权限立即失效；`visible=false` 只影响导航和落点，不撤销直接访问权限。

`superadmin` 隐式拥有全部启用模块和有效节点，不依赖显式关联记录。访问权限 UI 只读，服务端拒绝对其执行替换。

### 6.1 原子授权

角色模块和节点只通过以下 canonical 接口一起全量替换：

```http
PUT /api/v1/system/roles/:id/access
```

```json
{
  "modules": [{ "moduleId": "module-admin", "menuIds": ["menu-system-user"] }]
}
```

接口去重并校验未知 ID、跨模块节点、目录 ID、按钮父页面、模块入口和超级管理员锁定。在 Serializable 事务中全量替换 `RoleModule` 与 `RoleMenu`，任一错误整体回滚；审计事件 `role.assign-access` 保存变更前后的模块与节点 ID。

每个被分配模块必须至少包含一个已授权、启用、可见且祖先有效的 `PAGE`。按钮授权必须同时包含其父页面；页面授权不会自动包含按钮。

## 7. 导航与路由解析

VEB API 对模块按 `sort -> name -> id` 排序，对模块内树的每一级使用相同排序。深度优先遍历时遇到的首个启用、可见、已授权 `PAGE.path` 成为该用户在该模块的 `landingPath`。

- `GET /api/v1/navigation` 的导航树永远排除 `BUTTON`，并剪除空目录。
- `LINK` 不参与落点计算。
- 没有可用落点的模块不进入用户导航，且不会回退到未授权页面。
- `/`、模块切换器和首页操作统一跳转到 `landingPath`。
- `/profile` 是登录后的全局页面，不属于任何模块。`/admin` 直接跳转到当前用户后台管理模块的 `landingPath`。

工作区布局通过 `GET /api/v1/navigation/page?path=...` 统一解析页面：先精确匹配 `PAGE.path`，详情子路径再使用最长有效页面前缀，随后校验同角色模块与节点授权。页面不存在返回 404，页面存在但未授权返回 403；授权页面的 manifest loader 缺失也返回 404。单段模块落点（例如 `/dashboard`）只作精确匹配，避免首页吞掉未知子路径。

## 8. 故障与一致性边界

- Blog API 或 Blog 数据库不可用时，VEB 系统管理继续工作，博客管理返回 `50301`。
- VEB API 不可用时，公开博客读取与点赞继续工作。
- 每个 API 的 ready health 只检查自己的数据库与必要运行时配置，不探测另一个业务服务。
- 写请求不自动重试；只读请求遇到网络错误、502 或 503 最多重试一次。
- RBAC 快照当前每次从 PostgreSQL 主库重新计算，不使用跨请求进程缓存；撤权事务提交后，任一实例的下一次请求使用新结果。

## 9. 迁移与发布

项目尚未上线，数据库通过单一初始化迁移 `20260818000000_init` 建表，只描述当前最终 schema，不包含任何历史数据搬迁逻辑。生产部署时先运行 `prisma migrate deploy`，再按需显式执行 seed 写入内置模块、菜单与超级管理员授权。
