# VEB

VEB 是一个基于 pnpm workspace 的管理后台与博客项目。Web、系统 API 和博客 API 可以独立
构建与扩容；系统数据和博客数据分别由独立的 PostgreSQL 数据库持有。

> **当前状态：项目尚未上线。** 仓库中的生产环境文件、Dockerfile、Compose、Nginx 和部署
> 脚本仅用于准备首次上线，不代表已经存在生产实例、生产数据库、真实流量或自动发布链路。

## 架构

```text
Browser
  -> Web public gateway
  -> apps/web 页面 / 同源 API 代理
       -> 系统 / 博客管理 -> apps/veb-api -> VEB PostgreSQL
                              -> request-bound RS256 service JWT
                              -> apps/blog-api internal API -> Blog PostgreSQL
       -> 公开博客 ---------> apps/blog-api public API ----> Blog PostgreSQL

External blog/client
  -> Blog public gateway
  -> apps/blog-api public API
```

- `apps/web`：管理端 UI、公开文章页、服务端页面守卫和浏览器同源 API 代理。
- `apps/veb-api`：Auth.js、用户、RBAC、菜单、文件、操作日志，以及博客管理 BFF。
- `apps/blog-api`：文章、标签、点赞、公开博客 API 和私网管理 API。
- `packages/api-contracts`：跨应用 Zod Schema、DTO、分页、响应壳和错误码。
- `packages/api-kit`：两个 API 共用的响应、异常映射、请求 ID、访问日志和限流基础设施。
- `packages/service-auth`：请求绑定的 RS256 服务令牌与 JWKS 工具。

浏览器不能直接调用 Blog 内部管理接口。VEB API 先校验浏览器 session 和 RBAC，再签发绑定
HTTP method、目标 path、body hash 与 `X-Request-Id` 的短期服务令牌。两个 API 只访问各自拥有
的数据库，不跨应用导入 Prisma Client。

完整组件职责、数据所有权和故障边界见 [架构说明](docs/architecture.md)。

## 环境要求

- Node.js >= 20.10
- pnpm 9.15.9
- Docker 与 Docker Compose（推荐用于本地数据库和完整 Compose 拓扑）
- PostgreSQL 15+（不使用 Compose 数据库时）

## 本地开发

根目录的 `.env.development` 供 Docker Compose 使用；各应用目录下的 `.env.development` 供
直接启动的 Next.js、Prisma 和 seed 脚本使用。它们已纳入版本控制，仅用于开发环境；修改
数据库连接或开发密钥时，应同步检查对应配置。

首次初始化：

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev:infra
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

`pnpm dev:infra` 只启动两套 PostgreSQL。`pnpm db:migrate:deploy` 从当前 migration 建库，
`pnpm db:seed` 显式同步开发环境的内置模块、菜单、超级管理员授权和管理员密码；应用启动本身
不会执行 seed。

完成首次初始化后，可以用一个命令启动数据库、应用 migration 并运行三个应用：

```bash
pnpm dev:all
```

直接运行开发进程时的地址：

| 服务     | 地址                    | 说明                      |
| -------- | ----------------------- | ------------------------- |
| Web      | `http://localhost:1066` | 页面与浏览器同源 API 入口 |
| VEB API  | `http://localhost:1067` | 开发环境原始系统 API      |
| Blog API | `http://localhost:1068` | 开发环境原始博客 API      |

种子用户名为 `admin`，密码读取 `apps/veb-api/.env.development` 中的
`SEED_ADMIN_PASSWORD`。再次执行 seed 会把管理员密码同步为该值。

## 检查与测试

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

端到端测试要求数据库已经迁移并执行最新 seed，同时三个应用均可访问。登录密码必须与本次
seed 使用的密码一致：

```bash
E2E_ADMIN_PASSWORD=<SEED_ADMIN_PASSWORD> pnpm test:e2e
```

## Docker Compose

完整开发拓扑：

```bash
pnpm compose:up
```

Compose 会先等待两套 PostgreSQL healthy，再依次执行 VEB 与 Blog 的
`prisma migrate deploy`，迁移成功后才启动 API、Web 和 public gateway。它不会执行 seed。

Compose 对宿主机发布的应用入口只有：

- Web public gateway：`http://localhost:${WEB_PORT:-1066}`
- Blog public gateway：`http://localhost:${BLOG_API_PORT:-1068}`，只放行
  `/api/v1/public/**` 和 health 路由

原始 Web、VEB API 与 Blog API 仅在 Compose 私网可达。两套 PostgreSQL 当前只映射
`127.0.0.1` 回环端口，上传文件与数据库分别保存在命名 volume 中。

首次上线的手动部署入口：

```bash
COMPOSE_ENV_FILE=/secure/path/veb.production.env pnpm compose:deploy
```

`compose:deploy` 会等待全部长期服务 ready，随后删除已成功退出的 migration 容器，并执行
受限的悬挂镜像与 BuildKit 缓存清理；不会删除命名镜像、运行中镜像或任何 volume。仓库中的
`.env.production` 只表达配置结构，不能直接视为可用的生产配置。当前 seed 命令也只读取开发
配置，不能用于生产环境。

首次部署前置条件、配置校验、smoke test 和清理规则见
[部署说明](docs/deployment.md)。

## API 边界

- VEB canonical API：`/api/v1/system/**`、`/api/v1/me/**`、`/api/v1/files/**`、
  `/api/v1/navigation` 和 `/api/v1/dashboard/stats`。
- VEB Blog management BFF：`/api/v1/blog/**`。
- Blog public API：`/api/v1/public/**`。
- Blog internal API：`/api/internal/v1/**`，仅接受 VEB API 签发的请求绑定令牌。
- Health：`/api/health/live` 和 `/api/health/ready`。

业务响应统一为 `{ code, data, message }`，链路请求 ID 使用 `X-Request-Id`。Blog API 或 Blog
数据库不可用时，系统管理仍应可用，博客管理返回 `50301`；VEB API 不可用时，Blog public
API 仍应可用。

## 文档

- [项目架构](docs/architecture.md)：组件职责、请求链路、数据所有权、跨服务认证与故障边界。
- [权限体系](docs/permission.md)：RBAC 模型、有效授权、导航、页面守卫与权限执行边界。
- [首次部署](docs/deployment.md)：生产前置条件、配置、发布步骤、初始化与 smoke test。
- [VEB API](apps/veb-api/README.md) 与 [Blog API](apps/blog-api/README.md)：应用级职责与开发说明。
