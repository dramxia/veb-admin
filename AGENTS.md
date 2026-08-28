# VEB 仓库约定

本文件适用于整个仓库。修改代码前，先阅读 `README.md` 以及与改动相关的 `docs/architecture.md`、`docs/permission.md`、`docs/deployment.md` 或 `docs/ui-style-guide.md`。

## 当前状态

- 项目尚未部署，没有正式数据库或用户流量。
- 当前代码、`packages/api-contracts` 契约和 `apps/core-api/prisma/schema.prisma` 是实现依据。
- 项目不保留旧路由、旧字段、旧表、历史迁移、旧环境变量或兼容层。
- 数据库结构验证从隔离的空 PostgreSQL 开始，执行当前初始化迁移和种子脚本。
- 未经用户明确批准，不得删除本地数据库、Docker 数据卷、上传文件或密钥。

## 运行边界

```text
浏览器 / 外部客户端
  -> web-public
  -> apps/web 页面或同源 /api 代理
  -> apps/core-api
  -> PostgreSQL

apps/web 中间件和 SSR -> apps/core-api
apps/core-api -> uploads 数据卷
```

- `web-public` 是唯一面向非回环地址的 Compose 入口。
- Web 和 Core API 不绑定宿主机端口；PostgreSQL 只绑定到 `127.0.0.1`。
- Core API 负责 Auth.js、RBAC、仪表盘、系统管理、文件、操作日志和博客。
- 除 Auth.js 全匹配处理器外，Core API 路由方法都通过 `defineApiRoute` 声明 `public` 或 `private`。
- 私有路由的 Session 和权限检查以 Core API 为准，前端菜单与页面控制不能替代服务端校验。
- 项目使用一个 Prisma Schema、一个 PostgreSQL 数据库和一个初始化迁移。

## 文档同步

- 架构、请求路径或服务边界变更：更新 `docs/architecture.md`。
- 模块、菜单、权限、路由访问或种子数据变更：更新 `docs/permission.md`。
- Compose、环境变量、迁移、健康检查或部署脚本变更：更新 `docs/deployment.md`。
- Web 主题、布局、通用组件或可见依赖变更：更新 `docs/ui-style-guide.md`。
