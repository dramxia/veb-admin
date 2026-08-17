# VEB Monorepo

VEB 是一个基于 pnpm workspace 的后台与博客双后端项目。Web、系统后台 API 和博客 API 可以独立构建、部署和扩容，并分别拥有自己的数据边界。

## 架构

```text
Browser
  -> Web gateway -> apps/web (1066)
       -> apps/veb-api (1067) -> VEB PostgreSQL
       -> apps/blog-api (1068) -> Blog PostgreSQL

External blog
  -> Blog public gateway -> apps/blog-api (1068)

apps/veb-api
  -> signed internal request -> apps/blog-api
```

- `apps/web`：后台 UI 与兼容 `/articles` 页面，只通过 HTTP 获取数据。
- `apps/veb-api`：Auth.js、用户、RBAC、菜单、文件、操作日志，以及博客管理 BFF。
- `apps/blog-api`：文章、标签、点赞、公开博客 API 和私网管理 API。
- `packages/api-contracts`：Zod 请求、响应、分页和错误码契约。
- `packages/service-auth`：请求绑定的 RS256 服务令牌与 JWKS。
- `tools/migrate-blog-data`：从旧单库拆分博客数据的迁移工具。

## 环境要求

- Node.js >= 20.10
- pnpm 9.15.9
- PostgreSQL 15+

## 安装与检查

```bash
pnpm install
pnpm db:generate
pnpm typecheck
pnpm test
pnpm build
```

## 本地开发

各应用的开发配置统一放在已纳入版本控制的 `.env.development` 中。`next dev`
会自动读取该文件，Prisma 与 seed 脚本也已显式使用同一套开发配置。首次运行前请确认
数据库连接和开发密钥符合本机环境。

数据库准备完成后执行：

```bash
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

集成测试使用同一个显式种子密码：`E2E_ADMIN_PASSWORD=<SEED_ADMIN_PASSWORD> pnpm test:e2e`。

访问地址：

- Web：`http://localhost:1066`
- VEB API：`http://localhost:1067`
- Blog API：`http://localhost:1068`

种子用户名为 `admin`，初始密码由 VEB API 的 `SEED_ADMIN_PASSWORD` 提供；当前开发和部署默认密码为 `123456`。显式执行 seed 会同步管理员密码，便于未上线环境重新初始化。

## Docker Compose

根 `.env.development` 和 `.env.production` 分别包含开发、生产 Compose 配置。
`VEB_DATABASE_URL` 与 `BLOG_DATABASE_URL` 必须显式填写，URL 中的密码保留字符需要
percent-encode；PostgreSQL 的两个 `*_DB_PASSWORD` 则填写原始密码。RSA 私钥只配置给
VEB API，Blog API 通过 VEB 内部 JWKS 验签。仓库中的生产值是部署占位符，发布前必须
替换。

```bash
pnpm compose:up
```

Compose 会依次执行 VEB 与 Blog 的 `prisma migrate deploy`，两套迁移成功后才启动 API；不会在应用启动时执行 `db push` 或 seed。对外只发布可信 Web 网关和经过路径白名单限制的 Blog public 网关；原始 Web、VEB API 与 Blog API 仅在 Compose 私网可达，两套数据库只提供 `127.0.0.1` 回环端口供本地开发进程使用。

生产环境使用带健康检查和缓存回收的部署入口：

```bash
pnpm compose:deploy
```

`compose:deploy` 默认读取 `.env.production`；需要使用其他生产配置文件时可设置
`COMPOSE_ENV_FILE=/path/to/file`。直接调用 Compose 时也必须明确指定环境文件，例如
`docker compose --env-file .env.production up --build`。

该命令只会在全部长期服务 ready 后删除已成功退出的 migration 容器，并清理悬挂镜像。BuildKit 缓存默认限制为 `8GB`；不会删除命名镜像、运行中镜像或任何 volume。可通过 `DOCKER_BUILD_CACHE_MAX_SIZE` 调整上限，或临时设置 `DOCKER_DEPLOY_PRUNE=0` 跳过回收。

## API

- VEB canonical API：`/api/v1/system/**`、`/api/v1/me/**`、`/api/v1/files/**`、`/api/v1/navigation`。
- VEB Blog management BFF：`/api/v1/blog/**`。
- Blog public API：`/api/v1/public/**`。
- Blog internal API：`/api/internal/v1/**`，仅接受 VEB API 签发的请求绑定令牌。
- 原 `/api/system`、`/api/profile`、`/api/files`、`/api/menu`、`/api/admin`、`/api/public` 在兼容期继续可用。公开兼容路径只保证路径与 HTTP method，响应改用安全公开 DTO，不再暴露数据库 ID、作者账号或草稿状态。

所有业务响应使用 `{ code, data, message }`，链路请求 ID 位于 `X-Request-Id`。

## 数据拆分

旧单库迁移前必须停止内容写入并完成备份：

```bash
SOURCE_DATABASE_URL=postgresql://... \
BLOG_DATABASE_URL=postgresql://... \
pnpm db:migrate:blog-data

SOURCE_DATABASE_URL=postgresql://... \
BLOG_DATABASE_URL=postgresql://... \
pnpm db:migrate:blog-data:apply

SOURCE_DATABASE_URL=postgresql://... \
BLOG_DATABASE_URL=postgresql://... \
pnpm db:verify:blog-data
```

首次切换时，`BLOG_VISITOR_HASH_SECRET` 必须使用旧 `NEXTAUTH_SECRET` 的值以维持点赞识别；VEB 的 `AUTH_SECRET` 应同时轮换。

更多细节见 `docs/architecture.md` 和 `docs/deployment.md`。
