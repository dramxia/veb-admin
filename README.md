# VEB

VEB 是一个 pnpm Monorepo，包含管理后台、公开文章页面、Core API 和 PostgreSQL 数据库。

## 目录

- `apps/web`：Next.js Web 应用，提供页面、SSR 和同源 `/api/**` 代理。
- `apps/core-api`：Next.js Core API，负责 Auth.js、RBAC、系统管理、文件、操作日志、仪表盘和博客。
- `packages/api-contracts`：Web 与 Core API 共用的 Zod Schema、DTO、响应类型和错误码。
- `deploy`：迁移镜像、Nginx 配置及部署验证脚本。

运行请求路径见[架构文档](docs/architecture.md)。

## 本地开发

要求 Node.js `>=20.10.0`、pnpm `9.15.9` 和 Docker Compose。

首次启动：

```bash
pnpm install
pnpm dev:infra
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

默认地址：

- Web：`http://localhost:1066`
- Core API：`http://localhost:1067`
- Compose 网关：`http://localhost:1068`

`pnpm dev` 会在默认端口被占用时选择后续可用端口，并输出本次实际地址。可通过 `WEB_DEV_PORT`、`CORE_API_DEV_PORT` 指定首选端口；设置 `VEB_DEV_STRICT_PORTS=1` 后，端口不可用会直接启动失败。

种子用户名为 `admin`，密码读取 `SEED_ADMIN_PASSWORD`。再次执行种子脚本会更新该用户的密码。

## 检查

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:verify:init
docker compose --env-file .env.development config --quiet
```

`pnpm db:verify:init` 在临时 PostgreSQL 容器中执行当前迁移和种子脚本，结束后删除该容器，不使用项目的 `postgres-data` 数据卷。

## API

主要路由：

- Auth.js：`/api/auth/**`
- 健康检查：`/api/health/live`、`/api/health/ready`、`/api/v1/health`
- 公开博客：`/api/v1/blog/articles/**`、`/api/v1/blog/tags/**`
- 博客管理：`/api/v1/blog/manage/**`
- 仪表盘：`/api/v1/dashboard/stats`
- 系统管理：`/api/v1/system/**`
- 当前用户、导航和文件：`/api/v1/me/**`、`/api/v1/navigation/**`、`/api/v1/files/**`

JSON 接口使用 `{ code, data, message }`。文件读取返回二进制内容，操作日志导出返回 CSV。所有标准路由响应都会携带 `X-Request-Id`。

权限、部署和当前 UI 实现分别见[权限文档](docs/permission.md)、[部署文档](docs/deployment.md)和[Web UI 文档](docs/ui-style-guide.md)。
