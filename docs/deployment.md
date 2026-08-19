# 首次线上部署

> **当前状态：项目尚未上线。** 本文描述首次上线的目标流程，不代表已经存在生产实例、
> 生产数据库、真实流量或自动发布链路。没有目标主机、域名、证书、密钥、备份和 smoke
> test 记录时，不得将构建或 CI 通过描述为“已上线”。

生产发布由运维人员在目标主机手动执行 Docker Compose。CI 只负责依赖安装、Prisma
Client 生成、lint、类型检查、测试、构建、迁移校验和镜像构建验证，不执行线上发布。

## 1. 部署边界与前置条件

首次部署前必须准备：

1. 支持 Docker Compose 的目标主机、持久化磁盘，以及可恢复的数据库和上传文件备份位置。
2. Web 与 Blog 的公网域名、DNS、TLS 证书和外层入口策略。仓库内的两个 Nginx gateway
   只负责路径隔离和反向代理，不提供完整的公网 DNS 或 TLS 配置。
3. 固定待发布的 Git commit，并为 Web、VEB API、Blog API 三个应用镜像建立可追踪的
   tag 或 digest。`deploy/compose-deploy.sh` 只会现场构建并启动服务，不会创建发布版本或
   自动回滚。
4. 从安全的密钥来源生成独立的生产配置。仓库内 `.env.production` 只表达配置结构；
   无论其中的值看起来是否完整，都不能视为已审核、可直接使用的生产配置，也不得把真实
   生产密钥提交到仓库。
5. 在空数据库上验证两套最新 init migration，并用最新 seed 验证初始化后的应用状态。
   项目未上线，不维护旧结构升级、历史数据搬迁或兼容回填流程。

Compose 对外只应发布 `web-public` 和 `blog-public`：

- `web-public`：Web 页面与同源 API 入口。
- `blog-public`：只放行 `/api/v1/public/**`、`/api/health/live` 和
  `/api/health/ready`，其他路径返回 404。
- `web`、`veb-api` 和原始 `blog-api`：只在 Compose 私网可达。
- 两套 PostgreSQL：当前 Compose 为本地开发保留了 `127.0.0.1` 回环端口映射；生产主机
  不需要宿主机数据库入口时，应通过经过审查的 Compose override 删除这些映射。

数据库和上传文件分别保存在命名 volume 中。删除本地或目标主机上的数据库 volume、上传
volume 或上传目录前，必须先获得明确确认。

## 2. 生产配置

建议由密钥管理或部署系统在仓库外生成环境文件，例如：

```bash
export COMPOSE_ENV_FILE=/secure/path/veb.production.env
```

部署前至少校验以下配置：

| 类别        | 配置                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------- |
| VEB 数据库  | `VEB_DB_NAME`、`VEB_DB_USER`、`VEB_DB_PASSWORD`、`VEB_DATABASE_URL`                         |
| Blog 数据库 | `BLOG_DB_NAME`、`BLOG_DB_USER`、`BLOG_DB_PASSWORD`、`BLOG_DATABASE_URL`                     |
| 登录会话    | `AUTH_SECRET`、指向 Web 公网地址的 `AUTH_URL`                                               |
| 访客标识    | 独立的 `BLOG_VISITOR_HASH_SECRET`                                                           |
| 服务鉴权    | 匹配的 `SERVICE_AUTH_PRIVATE_KEY`、`SERVICE_AUTH_PUBLIC_KEY` 与唯一的 `SERVICE_AUTH_KEY_ID` |
| 对外端口    | `WEB_PORT`、`BLOG_API_PORT`                                                                 |
| 私网上游    | `VEB_API_INTERNAL_URL`、`BLOG_API_INTERNAL_URL`                                             |

数据库 URL 在容器内必须使用 `veb-postgres` 和 `blog-postgres` 服务名。URL 用户名或密码
中的 `@`、`:`、`/`、`?`、`#`、`%` 等保留字符必须 percent-encode；
`VEB_DB_PASSWORD` 和 `BLOG_DB_PASSWORD` 则保留 PostgreSQL 接收的原始值。RSA 私钥只
提供给 VEB API，Blog API 只通过 VEB API 的内部 JWKS 获取公钥。

先执行只校验、不输出展开后密钥内容的 Compose 配置检查：

```bash
docker compose --env-file "$COMPOSE_ENV_FILE" config --quiet
```

`WEB_TRUST_PROXY_HEADERS=true` 只能用于原始 Web 端口不对外开放、且可信入口会覆盖客户端
伪造的 `Forwarded`、`X-Forwarded-For`、`X-Real-IP` 和 `CF-Connecting-IP` 的部署。
当前 `docker-compose.yml` 满足这一入口覆盖要求；新增外层代理时必须继续保持该边界。

## 3. 发布前验证

以下检查可由受信 CI 或目标主机完成，但结果必须绑定到同一个待发布 commit：

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose --env-file "$COMPOSE_ENV_FILE" build
```

数据库验证必须从空库应用当前 init migration。不要使用 `prisma db push`，不要为已删除的
旧 schema、旧字段或旧数据编写升级和兼容步骤。

## 4. 执行部署

在固定 commit 的仓库目录中执行：

```bash
COMPOSE_ENV_FILE="$COMPOSE_ENV_FILE" pnpm compose:deploy
```

Compose 的关键依赖顺序为：

```text
veb-postgres healthy -> veb-migrate completed -> veb-api healthy -> web healthy -> web-public healthy
                              |
blog-postgres healthy --------+-> blog-migrate completed -> blog-api healthy -> blog-public healthy
```

`veb-migrate` 和 `blog-migrate` 串行执行 `prisma migrate deploy`；每个 API 只能在自己依赖的
迁移成功后启动。脚本使用 `docker compose up --wait` 等待全部长期服务健康，默认超时为
300 秒。任一步失败都应停止部署并检查对应服务日志，不能跳过迁移强行启动：

```bash
docker compose --env-file "$COMPOSE_ENV_FILE" ps
docker compose --env-file "$COMPOSE_ENV_FILE" logs --tail=200
```

迁移只负责建表，不会隐式执行 seed。

## 5. 首次初始化

Seed 是显式初始化操作，不属于每次部署流程。VEB seed 会同步内置模块、菜单、超级管理员
授权和 `admin` 密码；Blog 当前没有需要初始化的业务数据。

当前根 `pnpm db:seed` 及两个应用的 `db:seed` 都明确读取开发配置，**不能用于生产环境**。
首次上线前必须先实现并审查一个明确读取生产配置的 VEB seed 入口，然后在目标环境按需执行。
执行后应立即修改并验证管理员凭据，且不得把初始密码写入本文或提交到仓库。

## 6. Smoke Test 与暴露面检查

部署命令成功后至少验证：

1. Web public 与 Blog public 的 `/api/health/live`、`/api/health/ready` 返回成功；VEB API
   与 Blog API 的 ready 只检查各自数据库和必要配置，不因另一个业务服务不可用而失败。
2. Web 登录、session、RBAC 页面守卫和受保护 API 权限符合预期。
3. 文件上传和读取正常，文件实际写入持久化的 `veb-uploads` volume。
4. 博客管理可以创建、编辑和发布文章；公开列表与详情只返回已发布且发布时间不晚于当前
   时间的内容。
5. 浏览器经 Web 同源入口访问公开博客 API，外部客户端经 Blog public gateway 访问公开
   API，响应契约和 `X-Request-Id` 传递正常。
6. 宿主机和公网不能直接访问原始 Web、VEB API、Blog API、数据库及 Blog 内部管理接口；
   Blog public gateway 对 `/api/internal/v1/**` 和其他非白名单路径返回 404。
7. Blog API 或 Blog 数据库不可用时，VEB 系统管理仍可用且博客管理返回 `50301`；VEB API
   不可用时，Blog public API 仍可用。

## 7. 发布记录与后续规则

首次上线验收通过后，记录以下信息：

- Git commit、三个应用镜像的 tag/digest，以及 Compose 配置版本。
- 两套 migration 的执行结果和 seed 执行记录。
- DNS/TLS、备份位置与恢复验证结果。
- smoke test 结果、时间和关联的 `X-Request-Id`。

随后立即更新仓库中的“尚未上线”状态，并根据实际生产约束制定备份、增量迁移、兼容和回滚
规则。首次上线前不维护假设性的历史升级或回滚方案。

## 8. 部署后清理

`pnpm compose:deploy` 仅在全部长期服务 ready 后执行清理：

- 删除已经成功退出的 `veb-migrate` 和 `blog-migrate` 容器。
- 删除超过 `DOCKER_IMAGE_PRUNE_UNTIL`（默认 `24h`）的悬挂镜像，不删除带 tag 的镜像、
  运行中镜像或 volume。
- 将宿主机全局 BuildKit 缓存限制为 `DOCKER_BUILD_CACHE_MAX_SIZE`（默认 `8GB`）；旧版
  Docker 不支持容量上限时，改为删除超过 `DOCKER_BUILD_CACHE_MAX_AGE`（默认 `168h`）
  的缓存。

设置 `DOCKER_DEPLOY_PRUNE=0` 可跳过镜像和构建缓存清理，但仍会删除成功退出的 migration
容器。不要给清理命令增加 `--volumes`，也不要在未确认同机其他项目影响时扩大 Docker
prune 范围。
