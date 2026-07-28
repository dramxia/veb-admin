# 部署说明

## 1. 服务

生产拓扑包含 Web、VEB API、Blog API、Web/Blog public Nginx 网关和两套 PostgreSQL。Compose 对外只发布两个入口网关；Web、VEB API 和原始 Blog API 不映射宿主机端口。为支持 `pnpm dev:infra` 后从宿主机运行开发进程，两套数据库仅绑定到 `127.0.0.1`，不会监听外部网卡；不需要宿主机运维入口的生产部署应通过 Compose override 删除这两个回环端口映射。

固定应用端口：

- Web：1066（仅 Compose 私网）
- Web public 网关：`${WEB_PORT:-1066}`（宿主机）
- VEB API：1067
- Blog API：1068（仅 Compose 私网）
- Blog public 网关：`${BLOG_API_PORT:-1068}`（宿主机）

public 网关只转发 `/api/v1/public/**`、兼容路径 `/api/public/**` 以及 `/api/health/live`、`/api/health/ready`，其他路径直接返回 404。VEB API 通过 `blog-api:1068` 调用私网管理接口，不能经 public 网关访问。

两个 public 网关都会覆盖客户端提供的 IP 转发头并写入带 `requestId` 的结构化访问日志。Web 运行时代理默认丢弃浏览器自带的 `Forwarded`、`X-Forwarded-For`、`X-Real-IP` 和 `CF-Connecting-IP`；只有在 `WEB_TRUST_PROXY_HEADERS=true` 时才采用入口写入的 IP 和协议，因此该开关只能用于原始 Web 端口不对外开放、且入口明确覆盖这些头的部署。

Web 使用运行时同源代理。`VEB_API_INTERNAL_URL` 和 `BLOG_API_INTERNAL_URL` 只需在容器运行时提供，可以在不重建 Web 镜像的情况下切换上游；公开博客路径发送到 Blog API，其余 `/api/**` 请求发送到 VEB API。

Compose 要求显式提供 `VEB_DATABASE_URL` 和 `BLOG_DATABASE_URL`，并分别映射为各 API 与 migration job 的 `DATABASE_URL`。连接串必须使用容器服务名 `veb-postgres` 或 `blog-postgres`。若用户名或密码含 `@`、`:`、`/`、`?`、`#`、`%` 等 URI 保留字符，必须先进行 percent-encode；`VEB_DB_PASSWORD` 和 `BLOG_DB_PASSWORD` 仍填写 PostgreSQL 接收的原始密码，不能填写编码后的值。

## 2. 数据库迁移

每个 API 只管理自己的 Prisma schema 和 migration history。部署顺序为：

1. 备份数据库与上传目录。
2. 先执行 VEB、再执行 Blog 的 `prisma migrate deploy`；根脚本与 Compose 都按此顺序串行运行。
3. 启动两个 API 并等待 ready health。
4. 启动 Web 并执行 smoke test。

禁止在生产使用 `prisma db push`。Seed 必须作为显式运维操作运行，不能随副本启动。

## 3. 密钥

- `AUTH_SECRET` 只供 VEB Auth.js 使用。
- `SERVICE_AUTH_PRIVATE_KEY` 只配置在 VEB API。
- `SERVICE_AUTH_PUBLIC_KEY` 用于 VEB 的 JWKS 输出。
- Blog API 通过 `SERVICE_AUTH_JWKS_URL` 获取并缓存公钥。
- `BLOG_VISITOR_HASH_SECRET` 独立管理；首次拆分时沿用旧 NextAuth secret 的值。
- `SEED_ADMIN_PASSWORD` 只在显式初始化 VEB 种子数据时提供；seed 不会重置已存在管理员的密码。

RSA 密钥应由密钥管理服务注入。当前 VEB JWKS 端点只发布 `SERVICE_AUTH_PUBLIC_KEY` 对应的单个 key，不支持同时发布新旧 key，因此不能无中断轮换。轮换必须安排短暂维护窗口，同时替换公私钥与 `SERVICE_AUTH_KEY_ID`，并重启 VEB API 和 Blog API；在实现多 key JWKS 前不要使用“先发布双 key”的轮换流程。

## 4. 健康检查

两个 API 均提供：

- `/api/health/live`：进程存活。
- `/api/health/ready`：当前服务数据库及必要运行时配置可用。

下游服务失败不应影响 ready 状态，避免单一依赖导致全部实例被摘除。

Blog public 网关只暴露 Blog 的两个健康路径；VEB 健康路径仅在 Compose 私网可访问，可通过容器编排器或 `docker compose exec` 检查。

## 5. 回滚

拆库切换后的一个发布周期内保留旧内容表只读。若 smoke test 失败，在重新开放写流量前恢复旧镜像和旧连接即可回滚。观察期结束后再提交删除旧内容表的 VEB migration。

## 6. 部署与磁盘回收

生产发布统一使用：

```bash
pnpm compose:deploy
```

脚本先构建并启动 Compose 项目，等待所有长期服务 ready，成功后才执行以下回收：

- 删除已成功退出的 `veb-migrate` 与 `blog-migrate` 容器。
- 删除超过 24 小时的悬挂镜像；不会删除有 tag 的回滚镜像、运行中镜像或 volume。
- 将宿主机 BuildKit 缓存限制在 `8GB`。构建缓存由 Docker daemon 全局管理，因此这项上限同时适用于宿主机上的其他项目；它只影响后续构建速度，不影响运行中的容器。

可通过 `COMPOSE_WAIT_TIMEOUT`、`DOCKER_IMAGE_PRUNE_UNTIL` 和 `DOCKER_BUILD_CACHE_MAX_SIZE` 调整默认值。旧版 Docker 不支持缓存容量上限时，脚本回退为删除超过 `DOCKER_BUILD_CACHE_MAX_AGE`（默认 168 小时）的缓存。设置 `DOCKER_DEPLOY_PRUNE=0` 可跳过镜像与构建缓存回收，但仍会删除成功退出的 migration 容器。

首次启用前可在部署成功后执行一次即时回收：

```bash
docker compose rm --force veb-migrate blog-migrate
docker image prune --force
docker builder prune --force --max-used-space 8GB
docker system df
```

不要给以上命令增加 `--volumes`；数据库和上传文件都保存在命名 volume 中。
