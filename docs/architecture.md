# VEB 架构

## 组件

```text
apps/
  web/       页面、SSR、中间件和同源 API 代理
  core-api/  Auth.js、RBAC、仪表盘、系统管理、文件、操作日志和博客
packages/
  api-contracts/  共享 Zod Schema、DTO、响应类型和错误码
deploy/
  migrate/        Prisma 迁移镜像
  nginx/          web-public 网关配置
```

Web 和 Core API 都使用 Next.js 14 App Router。Core API 的 `app/api` 导出 Route Handler，`src/http` 放置博客 HTTP 适配，`src/modules` 放置业务服务，`lib` 放置运行时基础设施。

## 请求路径

```text
浏览器 / 外部客户端
  -> web-public :${WEB_PUBLIC_PORT}
  -> web :1066
  -> Web 同源 /api/** 代理
  -> core-api :1067

Web 中间件和 SSR
  -> CORE_API_INTERNAL_URL
  -> core-api :1067

core-api
  -> postgres :5432
  -> uploads 数据卷
```

`web-public` 是 Compose 的公开入口。Nginx 将请求转发到 Web，覆盖外部传入的客户端转发头，并生成或透传 `X-Request-Id`。

浏览器的 `/api/**` 请求由 `apps/web/app/api/[...path]/route.ts` 代理到 Core API。代理保留 Cookie、请求体、查询参数、响应 Cookie 和 `X-Request-Id`。Web 中间件会直接请求 Core API 的导航接口完成页面预检，SSR 也通过 `CORE_API_INTERNAL_URL` 直接读取数据。

页面预检和菜单可见性用于路由体验，最终的 Session 与权限校验仍由 Core API 执行。

## Core API 路由

除 `/api/auth/[...nextauth]` 外，Core API 的路由方法都通过 `defineApiRoute` 创建：

- `public`：不要求 Session。
- `private`：要求有效 Auth.js Session。
- 带 `permission` 的 `private`：在 Session 基础上检查一个权限码或任一满足的权限码数组。
- 带 `audit` 的路由：记录配置的成功或失败操作，并对 JSON 载荷中的密码、令牌和密钥字段脱敏。

`defineApiRoute` 同时处理请求 ID、错误映射和访问日志。Auth.js 处理器自行维护响应契约，但仍显式附加请求 ID，并记录访问日志。

普通 JSON 接口通过共享助手返回 `{ code, data, message }`。`GET /api/v1/files/[id]` 返回文件内容，`GET /api/v1/system/logs/operation/export` 返回 CSV，不使用 JSON 封装。

## 业务边界

- 公开博客路由位于 `/api/v1/blog/articles/**` 和 `/api/v1/blog/tags/**`；公开文章读取和喜欢操作只针对已发布文章。
- 博客管理路由位于 `/api/v1/blog/manage/**`，使用 `blog:*` 权限和操作审计。
- 系统管理路由位于 `/api/v1/system/**`。
- 仪表盘、当前用户、导航和文件分别位于 `/api/v1/dashboard/**`、`/api/v1/me/**`、`/api/v1/navigation/**` 和 `/api/v1/files/**`。

公开喜欢接口使用 HttpOnly、SameSite=Lax 的访客 Cookie。Core API 使用 `BLOG_VISITOR_HASH_SECRET` 对访客标识做哈希后保存，并按客户端 IP 在单个进程内限流。

## 数据与文件

`apps/core-api/prisma/schema.prisma` 是唯一的 Prisma Schema。一个 PostgreSQL 数据库存储用户、角色、模块、菜单、授权关系、Auth.js 数据、文件元数据、操作日志、文章、标签和喜欢记录。

`Article.authorId` 必填，并以 `onDelete: Restrict` 关联 `User`。删除仍有关联文章的用户会被映射为 409 冲突。文章标签和喜欢记录在删除文章时级联删除。

文件内容由 Core API 的存储适配器写入 `UPLOAD_DIR`。Compose 将该目录映射到 `uploads` 数据卷；数据库只保存文件元数据。

项目只维护 `apps/core-api/prisma/migrations/20260818000000_init` 这一份初始化迁移。种子脚本初始化内置模块、菜单、权限、角色和 `admin` 用户。

## 健康与启动

- `/api/health/live`：返回进程存活状态。
- `/api/health/ready`：检查 `AUTH_SECRET` 非空并执行数据库查询。
- `/api/v1/health`：执行数据库查询并返回 Core API 状态。

Compose 启动顺序为：

```text
postgres 健康 -> migrate 成功 -> core-api 就绪 -> web 就绪 -> web-public 就绪
```

博客与系统模块共享 Core API 和 PostgreSQL，因此也共享故障边界。
