# Monorepo 实施状态

项目已从单体 Next.js 应用重构为原生 pnpm workspace。当前实现与运行方式以 [README.md](./README.md) 为准，架构边界和生产部署分别见 [docs/architecture.md](./docs/architecture.md) 与 [docs/deployment.md](./docs/deployment.md)。

## 工作区

```text
apps/web                 后台 UI 与 /articles
apps/veb-api             Auth.js、RBAC、系统、文件、审计与博客管理 BFF
apps/blog-api            文章、标签、点赞、公开和内部博客 API
packages/api-contracts   Zod HTTP 契约
packages/service-auth    RS256 服务身份认证与 JWKS
tools/migrate-blog-data  双库数据迁移与验证
```

## 已落实的边界

- Web 不包含 Prisma、数据库环境变量或 API 业务 Route Handler。
- VEB API 和 Blog API 使用独立 Prisma schema、migration history 与 PostgreSQL。
- 博客管理请求经 VEB RBAC 后，以 60 秒请求绑定服务令牌访问 Blog internal API。
- Blog public API 不依赖 VEB API，公开 DTO 不暴露数据库 ID、账号或草稿状态。
- 旧 API 路径保留一个发布周期；canonical API 使用 `/api/v1/**`。
- 生产容器只执行 `prisma migrate deploy`，不会自动 `db push` 或 seed。

## 验收命令

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

双库切换必须先 dry-run，再 apply，最后 verify：

```bash
pnpm db:migrate:blog-data
pnpm db:migrate:blog-data:apply
pnpm db:verify:blog-data
```

三个迁移命令均要求显式提供 `SOURCE_DATABASE_URL` 和 `BLOG_DATABASE_URL`。切换前还需备份旧数据库与上传目录，并冻结内容写入。
