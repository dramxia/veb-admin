# VEB 项目架构说明

本文描述当前代码、路由、数据库 Schema 与 `docker-compose.yml` 所表达的系统架构，作为组件
职责、调用边界和依赖方向的统一入口。权限细节见 [permission.md](permission.md)，首次上线与
运维步骤见 [deployment.md](deployment.md)。

> **当前状态：项目尚未上线。** 本文中的生产/Compose 拓扑是首次上线的目标结构，不代表
> 已存在生产实例、生产数据库、真实流量或自动发布链路。

## 1. 架构目标与原则

VEB 是一个基于 pnpm workspace 的管理后台与博客项目。三个 Next.js 应用可以独立构建和
扩容，系统管理与博客内容分别由独立 API 和 PostgreSQL 数据库负责。

架构遵循以下原则：

- 浏览器以 Web 为统一入口；博客管理必须经过 VEB API，不能直接访问 Blog 内部接口。
- VEB API 与 Blog API 各自拥有数据库和 Prisma Client，不跨库查询、不建立跨库外键。
- 跨应用只共享 DTO、API 基础设施和服务认证代码，不导入其他应用源码或 Prisma 类型。
- 菜单和按钮隐藏只是用户体验，服务端 session、页面守卫、RBAC 断言和服务令牌才是访问边界。
- 公开博客与系统管理保持运行时隔离，单个业务服务故障不应无条件拖垮另一条独立链路。
- API 使用统一响应壳和 `X-Request-Id`，便于跨网关、Web 与两个 API 关联请求。

## 2. 技术栈与仓库分层

- 运行时：Node.js 20+、TypeScript、Next.js 14 App Router、React 18。
- 工作区：pnpm workspace；不依赖 Turbo 或 Nx。
- 数据访问：Prisma 5，分别连接 PostgreSQL 15。
- 身份认证：Auth.js 5 Credentials Provider，JWT session。
- 跨服务认证：`jose` + RS256 request-bound JWT。
- 验证与测试：Zod、Vitest、Playwright。
- 部署基础设施：Docker Compose、Nginx public gateway、命名 volume。

```text
apps/
  web/                 页面、工作区导航、管理端 UI、公开文章页、同源 API 代理
  veb-api/             Auth.js、RBAC、系统业务、文件、审计、Blog 管理 BFF
  blog-api/            文章、标签、点赞、公开 API、内部管理 API

packages/
  api-contracts/       跨应用 Zod Schema、DTO、分页、响应壳和错误码
  api-kit/             两个 API 共用的响应、异常映射、请求 ID、访问日志和限流基础设施
  service-auth/        RS256 服务令牌的签发、请求绑定校验与 JWKS 工具

deploy/
  migrate/             两套 Prisma migration 使用的一次性容器
  nginx/               Web 与 Blog public gateway 配置
  compose-deploy.sh    手动 Compose 部署及受限缓存清理入口
```

API 应用内部采用薄 Route Handler：`app/api/**` 负责 HTTP 适配、认证、输入解析和响应；领域
查询、事务、存储或下游编排放在 `src/modules/**`，数据库和通用运行时适配放在 `lib/**`。

## 3. 运行拓扑

### 3.1 Compose 目标拓扑

```text
                                  +---------------------+
Browser ------------------------> | web-public (Nginx)  |
                                  +----------+----------+
                                             |
                                             v
                                  +----------+----------+
                                  | apps/web :1066      |
                                  | 页面 + 同源 API 代理 |
                                  +----+------------+---+
                                       |            |
                         system/blog   |            | public blog
                                       v            v
                              +--------+---+    +---+----------+
                              | veb-api    |    | blog-api     |
                              | :1067      |--->| :1068        |
                              +-----+------+ JWT+------+-------+
                                    |                   |
                                    v                   v
                              VEB PostgreSQL      Blog PostgreSQL
                                    |
                                    +--> veb-uploads

External blog/client ------------> blog-public (Nginx) ------------> blog-api
```

`web-public` 是页面和浏览器同源 API 入口。`blog-public` 是面向外部博客客户端的独立入口，
只放行 `/api/v1/public/**`、`/api/health/live` 和 `/api/health/ready`。`web`、`veb-api` 与
原始 `blog-api` 在 Compose 中仅通过内部网络暴露。

### 3.2 端口与暴露面

| 组件            | 默认端口 | Compose 暴露方式       | 职责                        |
| --------------- | -------: | ---------------------- | --------------------------- |
| `web-public`    |     1066 | 宿主机发布             | Web 页面与同源 API 公共入口 |
| `web`           |     1066 | 仅 Compose 私网        | SSR、UI 和 API 代理         |
| `veb-api`       |     1067 | 仅 Compose 私网        | 身份、系统管理和 Blog BFF   |
| `blog-public`   |     1068 | 宿主机发布             | Blog public API 白名单入口  |
| `blog-api`      |     1068 | 仅 Compose 私网        | 博客公开与内部业务接口      |
| VEB PostgreSQL  |     5432 | 当前仅映射 `127.0.0.1` | VEB 数据库                  |
| Blog PostgreSQL |     5433 | 当前仅映射 `127.0.0.1` | Blog 数据库                 |

直接执行 `pnpm dev` 时，三个应用分别监听 `1066`、`1067`、`1068`，便于本地开发；这不等同
于 Compose 的目标对外暴露面。生产主机若不需要数据库回环入口，应按部署文档使用经过审查的
Compose override 移除数据库端口映射。

## 4. 组件职责

### 4.1 Web (`apps/web`)

- 渲染登录、工作区、系统管理、博客管理与公开文章页面。
- 通过 `middleware.ts` 对工作区页面执行早期登录及页面权限探测；服务端 layout 和页面加载
  再次校验，探测失败不会放宽最终访问控制。
- 使用 VEB API 返回的导航、角色码和权限码控制模块、菜单和按钮展示。
- 通过 `app/api/[...path]/route.ts` 提供浏览器同源代理：`/api/v1/public/**` 转发至 Blog
  API，其余 `/api/**` 转发至 VEB API。
- SSR 通过私网地址直接请求对应 API：工作区访问 VEB API，公开文章页访问 Blog public API。
- `PAGE.component` 通过 `app/_modules/admin-page-manifest.ts` 映射到实际 React 页面；已授权但
  manifest 中不存在的组件返回 404。

### 4.2 VEB API (`apps/veb-api`)

- 拥有登录会话、用户、角色、模块、菜单、权限、个人资料、文件和操作日志。
- 暴露 canonical API：`/api/v1/system/**`、`/api/v1/me/**`、`/api/v1/files/**`、
  `/api/v1/navigation` 与 `/api/v1/dashboard/stats`。
- 使用 Auth.js JWT session 识别浏览器用户，并在服务端按用户 ID 重新计算有效授权快照。
- 作为博客管理 BFF 暴露 `/api/v1/blog/**`，将外部管理路径映射到 Blog API 的
  `/api/internal/v1/**`。
- 只保存文件元数据到 VEB PostgreSQL；本地存储实现将文件内容写入 `veb-uploads` volume。
- 通过 `/api/internal/.well-known/jwks.json` 向 Blog API 提供当前服务验签公钥。

### 4.3 Blog API (`apps/blog-api`)

- 独立拥有文章、标签、文章标签关系和点赞数据，不读取浏览器 session 或 VEB PostgreSQL。
- `/api/v1/public/**` 提供公开文章、标签和点赞能力。
- `/api/internal/v1/**` 提供文章、标签和点赞管理能力，只接受 VEB API 签发的服务令牌。
- 公开列表与详情只返回 `PUBLISHED` 且 `publishedAt <= 当前时间` 的文章；公开 DTO 不包含
  数据库 ID、作者账号、草稿状态等管理字段。
- 文章保存作者 ID、用户名和昵称快照，不与 VEB `User` 建立外键。

### 4.4 Public gateway

- `web-public` 转发全部 Web 流量，并覆盖客户端提供的 IP 转发头后再传给 Web。
- `blog-public` 使用路径白名单隔离公开接口，访问 `/api/internal/v1/**` 或其他非白名单路径
  时直接返回统一 404 响应。
- 两个网关生成或传递 `X-Request-Id`，记录包含 request ID 的结构化访问日志。
- 仓库内 Nginx 不负责公网 DNS、TLS 证书或完整边缘防护，这些属于首次上线前置设施。

## 5. 核心请求链路

### 5.1 登录与系统管理

```text
Browser
  -> web-public
  -> Web 页面 / `/api/**` 同源代理
  -> VEB API Auth.js session + `requirePermission`
  -> VEB PostgreSQL
```

1. 用户通过 Web 登录页提交凭据，请求经同源代理到 VEB API 的 Auth.js route。
2. VEB API 校验用户状态与密码，签发 JWT session Cookie。
3. Web SSR 透传 Cookie 请求用户资料、导航或页面解析；浏览器 API 代理同样透传 Cookie。
4. 写接口在 VEB API 重新要求有效 session 和权限码，并在需要时写入 `OperationLog`。

Web 中的权限组件和导航过滤不能替代步骤 4 的服务端断言。完整 RBAC 计算、角色授权接口和
页面解析规则见 [permission.md](permission.md)。

### 5.2 博客管理

```text
Browser
  -> web-public -> Web `/api/v1/blog/**`
  -> VEB API session + RBAC + route allowlist
  -> request-bound RS256 service JWT
  -> Blog API `/api/internal/v1/**`
  -> Blog PostgreSQL
```

VEB BFF 先按 HTTP method 与路径映射 `content:*` 权限，校验当前用户后才构造内部请求。服务
令牌有效期 60 秒，并绑定：

- issuer、audience、subject、key ID 和 token ID；
- 权限码、HTTP method、规范化目标 path；
- 请求体 SHA-256 hash 与 `X-Request-Id`；
- 当前操作者的 ID、用户名和昵称。

Blog API 从 VEB API 的内部 JWKS 获取公钥，验签后再次校验令牌绑定值和目标接口要求的权限。
因此令牌不能换路径、换方法、替换请求体或脱离原 request ID 重放到其他操作。RSA 私钥只
配置给 VEB API，Blog API 不持有私钥。

### 5.3 公开博客

```text
Browser -> web-public -> Web `/api/v1/public/**` proxy -> Blog API -> Blog DB

Web 公开文章 SSR -------- Compose private network -------> Blog API -> Blog DB

External client -> blog-public allowlist -----------------> Blog API -> Blog DB
```

公开博客不依赖 VEB session。浏览器可使用 Web 同源路径，Web 的服务端渲染直接走私网，独立
客户端则使用 Blog public gateway；三者最终使用同一组公开契约和 Blog 数据库。

### 5.4 文件

```text
Browser -> Web proxy -> VEB API permission check
                         +-> VEB PostgreSQL (`File` metadata)
                         +-> `veb-uploads` (file bytes)
```

文件归 VEB 边界所有。当前 Markdown 文章不建立跨服务文件外键；若未来文章引用文件，应使用
明确的公共标识或 URL 契约，不能让 Blog API 直接读取 VEB Prisma Client 或数据库。

## 6. 数据所有权

| 所有者   | 数据                                                                      | 持久化位置           |
| -------- | ------------------------------------------------------------------------- | -------------------- |
| VEB API  | `User`、`Role`、`UserRole`、`AppModule`、`Menu`、`RoleModule`、`RoleMenu` | VEB PostgreSQL       |
| VEB API  | `File` 元数据、`OperationLog`、Auth.js 相关表                             | VEB PostgreSQL       |
| VEB API  | 上传文件内容                                                              | `veb-uploads` volume |
| Blog API | `Article`、`Tag`、`ArticleTag`、`ArticleLike`                             | Blog PostgreSQL      |

跨服务只传递契约数据。Blog 文章中的作者字段是写入时快照，作者改名或删除不会跨库级联修改
历史文章。任何应用都不得导入另一应用生成的 Prisma Client，也不得通过共享包隐藏跨库访问。

项目尚未上线，Schema 与单一 init migration 直接表达当前最终结构；不保留旧字段、旧表、
历史迁移链或兼容层。Seed 是显式初始化动作，不属于应用启动或每次部署流程。

## 7. 权限与页面模型

VEB 使用分层 RBAC：

```text
User --< UserRole >-- Role --< RoleModule >-- AppModule
                         |
                         +--< RoleMenu >------ Menu
```

- `AppModule` 是权限和导航分组，不派生 URL，也不拥有独立数据库。
- `Menu` 分为 `DIR`、`PAGE`、`LINK`、`BUTTON`；权限码由除目录外的有效节点持有。
- 普通用户按单个角色计算“模块 + 节点”的有效授权，再对角色结果取并集，禁止跨角色拼接。
- `superadmin` 隐式拥有全部启用模块和有效节点，不依赖显式关联记录。
- 导航响应排除按钮并剪除空目录；页面解析分别返回未登录、无权限和不存在状态。
- 前端 `<Auth>` 等控件只负责展示，Web 服务端页面守卫与 API 权限断言负责强制执行。

数据约束、有效授权算法、原子角色授权接口和导航落点规则统一维护在
[permission.md](permission.md)。

## 8. 跨应用契约与横切能力

### 8.1 API 契约

`@veb/api-contracts` 是跨应用 HTTP DTO 的唯一来源：

- 业务响应统一为 `{ code, data, message }`，成功码为 `0`。
- 分页统一为 `{ items, total, page, pageSize }`。
- HTTP 日期使用带时区的 ISO 8601 字符串。
- `50301` 表示依赖服务不可用。
- Zod Schema 同时约束 Web、BFF 和 API 的请求/响应边界。
- Prisma model/type 不得出现在 Web 或共享契约中。

### 8.2 请求 ID、日志与代理头

`X-Request-Id` 在 public gateway、Web、VEB API、服务令牌和 Blog API 之间持续传递。未提供
时由入口生成；响应始终带回最终 request ID。API 访问日志记录 scope、method、path、status
和 duration，VEB 业务审计另行写入 `OperationLog`。

Web 代理会移除 hop-by-hop headers，透传 Cookie 与多值 `Set-Cookie`，并重建客户端 IP 相关
头。只有可信网关覆盖外部伪造头且原始 Web 端口不公开时，才能启用
`WEB_TRUST_PROXY_HEADERS=true`。

### 8.3 共享 API 基础设施

`@veb/api-kit` 统一两个 API 的成功/错误响应、Zod 与领域异常映射、请求 ID、访问日志和当前
进程内限流。它不包含业务服务或数据库访问。进程内限流不会自动形成跨实例全局配额；若未来
多实例需要严格全局限流，应引入独立共享存储并更新此边界。

## 9. 可用性与故障边界

- Blog API 或 Blog PostgreSQL 不可用时，VEB 系统管理仍应工作，博客管理返回 `50301`。
- VEB API 不可用时，Blog public gateway 与 Blog 公开 API 仍可工作。
- VEB API 和 Blog API 的 ready health 只检查自己的数据库及必要配置，不主动探测另一个
  业务服务，避免单个服务故障同时摘除两个 API。
- Blog BFF 对写请求不自动重试；GET 在网络或临时网关/服务错误时最多额外尝试一次，每次
  下游请求有 8 秒超时。
- RBAC 快照不做跨请求进程缓存；授权事务提交后，后续服务端权限计算从 VEB PostgreSQL
  读取最新结果。
- 当前存储使用单个 `veb-uploads` 命名 volume；多 VEB API 实例若不共享同一文件系统，必须
  先替换为可共享的存储实现。

## 10. 迁移、启动与部署

Compose 使用两个一次性 migration 服务，依赖顺序为：

```text
veb-postgres healthy -> veb-migrate completed -> veb-api healthy -> web healthy
                              |
blog-postgres healthy --------+-> blog-migrate completed -> blog-api healthy

web healthy      -> web-public
blog-api healthy -> blog-public
```

- `veb-migrate` 和 `blog-migrate` 执行各自的 `prisma migrate deploy`，迁移完成后 API 才启动。
- migration 不执行 seed；VEB seed 会同步内置权限数据及管理员密码，必须显式运行。
- `veb-postgres-data`、`blog-postgres-data` 与 `veb-uploads` 是独立命名 volume。
- `compose-deploy.sh` 在全部长期服务 ready 后才删除成功退出的 migration 容器，并只执行受限
  的悬挂镜像/BuildKit 缓存清理，不删除 volume。
- 当前没有自动线上发布链路，也没有已验证的生产回滚事实。

生产配置、首次初始化限制、smoke test 和清理规则见 [deployment.md](deployment.md)。

## 11. 架构变更检查清单

修改架构边界时至少同步检查以下内容：

1. 新 API 是否放在正确所有者中，浏览器是否仍只经过允许的入口。
2. 跨应用 DTO 是否进入 `@veb/api-contracts`，是否意外暴露 Prisma 类型或内部字段。
3. 数据是否写入正确数据库，是否引入跨库查询、外键或隐式耦合。
4. Blog 管理新路由是否同时更新 BFF allowlist、RBAC 权限映射、服务令牌校验和 Blog handler。
5. 新页面是否同步菜单 `component`、Web manifest、页面守卫、权限控件、seed 和测试。
6. 新配置、端口、健康检查或服务依赖是否同步 Compose、Nginx 与部署文档。
7. 错误响应、Cookie、代理头与 `X-Request-Id` 是否能沿完整链路保持契约。
8. 单元测试、E2E、类型检查、构建和空库 init migration 是否覆盖变更后的实际运行路径。
