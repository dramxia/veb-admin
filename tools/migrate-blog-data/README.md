# 博客数据迁移工具

将旧单体数据库中的 `Tag`、`Article`、`ArticleTag`、`ArticleLike` 迁移到独立博客数据库。工具保留所有原始 ID，并通过旧库 `User` 表生成文章的 `authorId`、`authorUsername`、`authorNickname` 快照。

## 前置条件

- 先备份旧数据库，并在执行 `--apply` 期间冻结文章、标签和点赞写入。
- 目标博客数据库必须已经执行 Prisma migration。
- `SOURCE_DATABASE_URL` 必须指向仍包含内容表和 `User` 表的旧单体数据库或其备份。
- `BLOG_DATABASE_URL` 必须指向独立博客数据库，且不能与源地址相同。用户名、密码或 `schema` 查询参数不同不能把同一个 PostgreSQL database 视为两套库，工具会拒绝这种配置。

可参考 `.env.example` 配置环境变量。命令会读取当前工作目录的 `.env`，也可以由部署环境直接注入变量。

## 使用方式

```bash
# 默认模式，只读取、校验并预览数量，不写数据库
pnpm --filter @veb/migrate-blog-data migrate
pnpm --filter @veb/migrate-blog-data migrate --dry-run

# 在一个目标库事务内按 Tag -> Article -> ArticleTag -> ArticleLike 写入
pnpm --filter @veb/migrate-blog-data migrate --apply

# 独立核对源库和目标库
pnpm --filter @veb/migrate-blog-data migrate --verify
```

三个模式互斥。`--apply` 使用 ID upsert，可以针对同一份源数据重复执行；它不会删除目标库额外记录。若目标库已有不同 ID 占用相同 tag name/slug、article slug 或点赞唯一键，预检会中止写入。

每次运行输出 JSON 报告。验证覆盖四张表的计数、文章与标签关联、孤立点赞、文章和标签 slug、标签名称、点赞唯一键、文章作者快照，以及管理/公开文章 DTO 的共享 Zod 契约。任何检查失败时进程退出码为 `1`。

## 验证

```bash
pnpm --filter @veb/migrate-blog-data typecheck
pnpm --filter @veb/migrate-blog-data test
```
