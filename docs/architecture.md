# 架构说明

## 1. Monorepo

仓库使用原生 pnpm workspace，不依赖 Turbo 或 Nx。应用不得跨边界导入其他应用的源码或 Prisma Client，共享内容仅允许放入 `packages/`。

```text
apps/web             页面、组件、同源代理
apps/veb-api         身份、RBAC、系统、文件、审计
apps/blog-api        内容、标签、点赞、公开 API
packages/*           无数据库依赖的契约与服务认证
tools/*              离线运维工具
```

## 2. 请求链路

### 系统管理

```text
Browser -> trusted Web gateway -> Web runtime proxy -> VEB API -> VEB database
```

VEB API 根据 Auth.js session 查询当前用户和权限。Web 中的菜单过滤和按钮隐藏只承担 UX，最终权限检查始终在 API。

### 博客管理

```text
Browser -> trusted Web gateway -> Web runtime proxy -> VEB API RBAC
        -> request-bound service JWT -> Blog internal API -> Blog database
```

Web 使用版本化的 `/api/v1/blog/**` 管理入口；旧 `/api/admin/**` 仅在一个发布周期内作为兼容别名。

服务令牌有效期 60 秒，固定 issuer、audience、权限码、HTTP method、目标 path、body hash 和 request ID。Blog API 不读取 VEB 数据库，也不接受浏览器 session Cookie。

### 公开博客

```text
Blog frontend -> public gateway -> Blog public API -> Blog database
Web          -> private network -> Blog public API -> Blog database
```

公开列表和详情仅返回已经发布且发布时间不晚于当前时间的文章。公开 DTO 不包含数据库 ID、作者账号和草稿字段。

生产 Compose 的 public gateway 仅允许公开 API 与 Blog 健康检查路径，不转发 `/api/internal/v1/**`。旧 `/api/public/**` 兼容适配器只保证路径和 HTTP method 可继续调用，响应统一使用新的安全公开 DTO，不保证旧响应中的数据库 ID、作者账号、状态等敏感字段。

## 3. 数据所有权

VEB 数据库拥有 User、Role、Permission、Menu、File、OperationLog 和 Auth.js 表。内容权限码仍属于 VEB，因为它们控制后台人员的操作授权。

Blog 数据库拥有 Article、Tag、ArticleTag 和 ArticleLike。Article 使用作者 ID、用户名和昵称快照，不与 User 建立外键。作者改名或删除不会修改历史文章。

文件与本地上传卷归 VEB API。本阶段 Markdown 文章不引入跨服务文件 ID。

## 4. 契约

`@veb/api-contracts` 是跨应用 DTO 的唯一来源：

- HTTP 日期为带时区的 ISO 8601 字符串。
- 分页为 `{ items, total, page, pageSize }`。
- 响应壳为 `{ code, data, message }`。
- `50301` 表示依赖服务不可用。
- Prisma 类型不得进入 Web 或共享包。

## 5. 故障边界

- Blog API 或 Blog 数据库不可用时，VEB 系统管理继续工作，博客管理返回 `50301`。
- VEB API 不可用时，公开博客读取与点赞继续工作。
- 每个 API 的 ready health 只检查自己的数据库与必要运行时配置，不探测另一个业务服务。
- 写请求不自动重试；只读请求遇到网络错误、502 或 503 最多重试一次。

## 6. 迁移原则

数据拆分使用短暂写冻结，不进行双写。迁移工具保留原 ID，按标签、文章、关联、点赞顺序幂等复制，并验证计数、外键语义、slug 和点赞唯一键。旧内容表在观察期只读保留，稳定后再删除。
