# VEB Repository Guide

本文件适用于整个仓库。代理在修改代码前应先阅读 `README.md`、相关应用目录，以及
[docs/architecture.md](docs/architecture.md)、[docs/permission.md](docs/permission.md)、
[docs/deployment.md](docs/deployment.md) 中与任务有关的部分。

## 项目状态（重要）

- **本项目尚未上线。** 当前没有正式线上实例、线上数据库或真实用户流量，也不存在需要保留或兼容的历史生产数据与历史生产结构。
- `.env.production`、Dockerfile、Compose、Nginx 和部署脚本只是首次上线所需的基础设施；它们的存在不代表项目已部署。
- 当前没有自动线上发布链路。CI（如存在或后续恢复）只用于安装依赖、生成 Prisma Client、lint、类型检查、测试、构建、迁移校验和镜像构建验证；不得把 CI 通过描述成“已上线”。
- 开发期一切以当前最新需求、最新代码、最新 API 契约和最新数据库 Schema 为准。不要保留旧接口、旧字段、旧表、旧迁移链、兼容分支、数据回填或 deprecated 适配层；发现此类残留时应在任务范围内直接清理，并同步调用方、测试和文档。
- 不需要设计从旧版本升级到当前版本的路径。验证数据库变更时从空库执行最新 init migration；验证应用状态时使用最新 seed 重新初始化。
- 未上线不等于可以随意执行破坏性命令。可以随最新 Schema 直接重写初始化迁移，但实际删除本地数据库、Docker volume 或上传目录前仍须获得用户明确同意。
- 在没有实际主机、域名、证书、密钥、备份和 smoke test 证据时，不得声称生产部署已经完成。

## 核心运行链路

### 系统管理

```text
Browser
  -> Web public gateway
  -> apps/web 页面 / 同源 API 代理
  -> apps/veb-api Auth.js + RBAC + 系统业务
  -> VEB PostgreSQL

apps/veb-api -> veb-uploads（文件内容）
```

- Web 把除 `/api/v1/public/**` 外的 `/api/**` 请求转发到 VEB API，并透传 Cookie 与 `X-Request-Id`。
- VEB API 负责登录会话、用户、角色、模块、菜单、权限、文件和操作日志；这些数据只属于 VEB PostgreSQL。
- Web 的菜单、页面和按钮显示只是 UX；Web 服务端页面守卫与 VEB API 的 session、`requirePermission` 才是实际访问边界。

### 博客管理

```text
Browser
  -> Web public gateway
  -> apps/web 同源 API 代理
  -> apps/veb-api /api/v1/blog/**（session + RBAC）
  -> request-bound RS256 service JWT
  -> apps/blog-api /api/internal/v1/**
  -> Blog PostgreSQL
```

- VEB API 是博客管理 BFF；浏览器不能直接调用 Blog 内部接口，Blog API 也不读取浏览器 session Cookie。
- 服务令牌绑定 issuer、audience、权限码、HTTP method、目标 path、body hash 和 request ID，有效期 60 秒。
- Blog API 通过 VEB API 的内部 JWKS 验签。私钥只配置给 VEB API，Blog API 不持有私钥。
- VEB API 不访问 Blog PostgreSQL；Blog API 也不访问 VEB PostgreSQL。跨服务 DTO 以 `@veb/api-contracts` 为准，不跨应用导入 Prisma 类型。

### 公开博客

```text
Web 公开文章页 -> Compose 私网 -> apps/blog-api /api/v1/public/** -> Blog PostgreSQL

Browser -> Web public gateway -> apps/web /api/v1/public/** 同源代理
                              -> apps/blog-api /api/v1/public/**

External blog/client -> Blog public gateway -> 路径白名单
                                        -> apps/blog-api /api/v1/public/**
```

- 公开接口只返回已发布且发布时间不晚于当前时间的文章；公开 DTO 不得包含数据库 ID、作者账号或草稿字段。
- Blog public gateway 只放行 `/api/v1/public/**`、`/api/health/live` 和 `/api/health/ready`；其他路径直接返回 404。
- `apps/web`、`apps/veb-api` 和原始 `apps/blog-api` 只在 Compose 私网可达；宿主机只发布 Web public 与 Blog public 两个网关。

### 共同约束与故障边界

- API 业务响应统一为 `{ code, data, message }`；链路请求 ID 使用 `X-Request-Id`，在 Web、VEB API、Blog API 和网关之间持续传递，用于关联访问及错误日志。
- public gateway 必须覆盖客户端伪造的 IP 转发头。只有可信网关覆盖这些头且原始 Web 端口不对外开放时，才能启用 `WEB_TRUST_PROXY_HEADERS=true`。
- Blog API 或 Blog 数据库不可用时，VEB 系统管理仍应可用，博客管理返回 `50301`；VEB API 不可用时，Blog public API 仍应可用。
- VEB API 与 Blog API 的 ready health 只检查各自数据库和必要配置，不互相探测，避免一个业务服务故障导致两个 API 实例都被摘除。
- 写请求不自动重试；只读请求仅在网络错误、502 或 503 时最多重试一次。

## 数据库规则

- VEB PostgreSQL 只保存用户、角色、模块、菜单、权限、文件元数据、操作日志和 Auth.js 数据。
- Blog PostgreSQL 只保存文章、标签、文章标签关系和点赞数据。
- 每个 API 只访问自己拥有的数据库，不建立跨库外键，不跨应用导入或复用 Prisma Client。
- `schema.prisma` 始终直接表达当前最新数据结构，不保留旧字段、旧表或历史结构兼容代码。
- Seed 是显式初始化/运维动作。它会同步内置数据，VEB seed 还会同步 `admin` 密码，不能作为每次部署的隐式步骤。

## 架构文档

整体组件职责、请求链路、数据所有权、跨服务认证、网络暴露和故障边界统一维护在
[docs/architecture.md](docs/architecture.md)。修改应用边界、跨服务契约、代理路由、数据库
所有权、共享包、Compose 服务依赖或健康检查时，必须先阅读并在同一任务中同步该文档。

## 权限文档

RBAC 数据模型、有效授权计算、角色访问范围、导航与页面守卫、前端权限控件和跨服务权限边界
统一维护在 [docs/permission.md](docs/permission.md)。修改 Prisma 权限关系、API 契约、权限码、
菜单或角色服务、导航解析、页面 manifest、前端权限控件、seed 或相关测试时，必须先阅读并在
同一任务中同步该文档。

## 部署文档

首次上线的前置条件、生产配置、发布命令、初始化、smoke test、发布记录和清理规则统一维护在
[docs/deployment.md](docs/deployment.md)。执行或修改部署相关任务前必须阅读该文档，并同步
核对 `docker-compose.yml` 与 `deploy/compose-deploy.sh` 的当前实现；文档与运行配置冲突时，
应先验证运行配置，再在同一任务中修正文档。
