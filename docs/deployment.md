# 部署说明

项目尚未部署。当前仓库提供 Docker Compose 首次部署路径，不包含域名、TLS 证书、外部反向代理、备份平台或监控平台配置。

## Compose 服务

| 服务         | 作用                                        | 宿主机绑定                       |
| ------------ | ------------------------------------------- | -------------------------------- |
| `postgres`   | PostgreSQL 15，使用 `postgres-data` 数据卷  | `127.0.0.1:${DB_PORT}:5432`      |
| `migrate`    | 执行当前 Prisma 初始化迁移后退出            | 无                               |
| `core-api`   | Core API，使用 `uploads` 数据卷             | 无，仅在 Compose 网络暴露 `1067` |
| `web`        | Web 页面、SSR 和 API 代理                   | 无，仅在 Compose 网络暴露 `1066` |
| `web-public` | Nginx 入口                                  | `${WEB_PUBLIC_PORT}:1066`        |
| `seed`       | 显式执行种子脚本，属于 `operations` profile | 无                               |

依赖顺序：

```text
postgres 健康 -> migrate 成功 -> core-api 就绪 -> web 就绪 -> web-public 就绪
```

`seed` 不在常规启动链中，也不会由部署脚本自动执行。

## 环境文件

根目录的 `.env.development` 和 `.env.production` 供 Docker Compose 使用：

| 领域           | 变量                                                           |
| -------------- | -------------------------------------------------------------- |
| PostgreSQL     | `DB_NAME`、`DB_USER`、`DB_PASSWORD`、`DB_PORT`、`DATABASE_URL` |
| Auth.js        | `AUTH_SECRET`、`PUBLIC_APP_URL`                                |
| 博客喜欢       | `BLOG_VISITOR_HASH_SECRET`                                     |
| 种子           | `SEED_ADMIN_PASSWORD`                                          |
| 网关和服务地址 | `WEB_PUBLIC_PORT`、`CORE_API_INTERNAL_URL`                     |

容器使用的 `DATABASE_URL` 主机名是 `postgres`。`PUBLIC_APP_URL` 会作为 Core API 容器的 `AUTH_URL`。

`apps/core-api/.env.development` 和 `apps/core-api/.env.production` 供包内 Prisma、种子及直接运行 Core API 时使用。`apps/web/.env.*` 供直接运行 Web 时使用。

`.env.production` 当前包含待替换值，部署脚本不会识别或拒绝占位值。执行部署前必须人工替换数据库密码、`AUTH_SECRET`、管理员密码、访客哈希密钥和公开地址。

`web-public` 的仓库配置只监听 HTTP，不终止 TLS。使用 HTTPS 域名时，需要在 Compose 入口之前配置 TLS 终止和转发。

## 部署前检查

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:verify:init
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production build
docker compose --env-file .env.production --profile operations build seed
```

`pnpm db:verify:init` 默认将临时 PostgreSQL 绑定到 `127.0.0.1:55432`。可通过 `VEB_INIT_CHECK_PORT` 修改端口。脚本执行迁移和种子后，会创建两篇验证文章并确认自动标识依次为 `20000`、`20001`，最后删除临时容器；该过程不使用 `postgres-data` 数据卷。

## 启动

```bash
pnpm compose:deploy
```

`compose:deploy` 默认读取 `.env.production`。可通过 `COMPOSE_ENV_FILE` 指定其他环境文件。

脚本执行 `docker compose up --build --detach --remove-orphans --wait`，等待 Compose 健康检查通过，然后删除已完成的 `migrate` 容器。默认还会清理超过时限的悬空镜像，并按最大占用或时限清理构建缓存；设置 `DOCKER_DEPLOY_PRUNE=0` 可禁用该清理。

该脚本不会删除 `postgres-data` 或 `uploads` 数据卷。

## 初始化数据

部署迁移完成后，显式执行：

```bash
docker compose --env-file .env.production --profile operations run --rm seed
```

种子脚本同步内置模块、菜单、权限和角色，创建或更新 `admin` 用户，并把密码更新为 `SEED_ADMIN_PASSWORD`。

## 健康检查

通过 `web-public` 检查：

- `/api/health/live`：Core API 进程存活。
- `/api/health/ready`：`AUTH_SECRET` 非空且数据库可查询。

Compose 对 Core API、Web 和 Nginx 的依赖都使用 `/api/health/ready`。该检查不验证生产占位值、TLS、种子结果、uploads 写权限、备份或外部网络策略。

PostgreSQL 和 uploads 数据卷不会由常规部署或验证命令删除。任何数据卷清理都需要单独执行破坏性命令，并须先获得用户明确批准。
