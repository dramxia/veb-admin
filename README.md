# 通用后台管理系统（VEB）

一个基于 **Next.js App Router + Prisma + PostgreSQL + NextAuth + Chakra UI** 的通用后台管理系统模板。

当前已实现：登录认证、RBAC 权限、动态菜单、用户/角色/权限/菜单管理、操作日志、文件上传、本地存储适配与 Docker Compose 启动。

## ✨ 功能概览

- **认证登录**：NextAuth Credentials，JWT Session。
- **RBAC 权限**：用户、角色、权限码、菜单的多对多授权链路。
- **三层权限校验**：前端按钮隐藏、middleware 路由拦截、API 服务端守卫。
- **动态菜单**：数据库菜单树驱动侧边栏与页面访问。
- **系统管理**：用户、角色、权限、菜单 CRUD。
- **操作日志**：写操作审计、分页筛选、CSV 导出。
- **文件上传**：20MB 限制、MIME 白名单、本地存储、预览/下载/删除。
- **容器化**：单应用镜像 + PostgreSQL 的 `docker-compose.yml`。

## 🧱 技术栈

- Next.js 14 App Router
- React 18 + TypeScript
- Prisma 5 + PostgreSQL
- NextAuth.js v5 beta
- Chakra UI v2 + TailwindCSS
- Zustand
- pnpm

## 🚀 本地开发

### 1. 环境要求

- Node.js >= 20.10
- pnpm >= 9
- PostgreSQL >= 15

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

本地默认配置示例：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/veb?schema=public"
NEXTAUTH_SECRET="replace-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:1066"
UPLOAD_DIR="./uploads"
STORAGE_KIND="local"
```

建议生成新的 `NEXTAUTH_SECRET`：

```bash
openssl rand -base64 32
```

### 4. 初始化数据库

当前仓库已包含初始 Prisma migration，首次开发环境推荐使用：

```bash
pnpm db:migrate
pnpm db:seed
```

如只做快速原型验证，也可使用 `pnpm prisma db push`。

种子账号：

```text
用户名：admin
密码：Admin@123
```

### 5. 启动开发服务

```bash
pnpm dev
```

访问：

```text
http://localhost:1066
```

## 🐳 Docker Compose 启动

```bash
docker compose up --build
```

Compose 会启动：

- `postgres`：PostgreSQL 15
- `app`：Next.js 应用容器

应用启动前会执行：

```bash
pnpm prisma db push
pnpm db:seed
```

然后运行：

```bash
pnpm start
```

访问：

```text
http://localhost:1066
```

## 📁 目录索引

```text
app/              Next.js App Router 页面与 API Routes
components/       通用组件、布局组件、权限组件
lib/              服务端工具、认证、权限、菜单、存储、日志
prisma/           Prisma schema 与 seed
stores/           Zustand 客户端状态
types/            类型扩展
docs/             架构、权限、部署文档
```

## 🧪 常用命令

```bash
pnpm dev          # 开发启动
pnpm build        # 生产构建
pnpm start        # 生产启动
pnpm lint         # ESLint 检查
pnpm db:seed      # 写入内置账号、角色、权限、菜单
pnpm prisma       # Prisma CLI 入口
```

## 📚 扩展阅读

- `docs/architecture.md`：系统架构、请求链路、数据流。
- `docs/permission.md`：权限码规范与新增权限步骤。
- `docs/deployment.md`：Docker、环境变量、HTTPS 和上线注意事项。
- `PRD.md`：产品需求。
- `IMPLEMENTATION.md`：里程碑实施记录。

## ❓ 常见问题

### 登录后看不到新菜单？

确认已执行：

```bash
pnpm db:seed
```

如果是运行中的用户，重新登录以刷新 JWT 内的菜单路径与权限码。

### `docker compose up` 后数据库为空？

`app` 容器启动命令会自动执行 `prisma db push` 和 `db:seed`。
如果数据库卷中已有旧数据，请确认 seed 中的菜单和权限是否被正确 upsert。

### 上传文件保存在哪里？

默认保存到 `UPLOAD_DIR`。Docker Compose 中映射到容器内：

```text
/app/uploads
```

宿主机数据卷为：

```text
app-uploads
```
