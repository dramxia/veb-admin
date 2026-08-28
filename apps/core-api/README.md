# @veb/core-api

`@veb/core-api` 是 VEB 的后端运行时，负责 Auth.js、RBAC、仪表盘、系统管理、文件、操作日志、文章、标签和喜欢记录。

代码组织：

- `app/api`：Route Handler 和 HTTP 方法导出。
- `src/http`：博客公开与管理路由适配。
- `src/modules`：业务服务。
- `lib`：认证、权限、API 封装、日志、限流、存储和 Prisma 适配。
- `prisma`：唯一的 Prisma Schema、初始化迁移和种子脚本。

包内命令：

```bash
pnpm --filter @veb/core-api dev
pnpm --filter @veb/core-api test
pnpm --filter @veb/core-api typecheck
pnpm --filter @veb/core-api lint
```

运行边界见 [`docs/architecture.md`](../../docs/architecture.md)，权限与种子数据见 [`docs/permission.md`](../../docs/permission.md)。
