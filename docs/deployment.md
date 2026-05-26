# 部署说明

本文描述本项目的 Docker 部署、环境变量、数据持久化与 HTTPS 注意事项。

## 1. Docker Compose 快速启动

```bash
docker compose up --build
```

默认暴露：

```text
http://localhost:3000
```

内置账号：

```text
admin / Admin@123
```

## 2. Compose 服务

### app

- 基于仓库根目录 `Dockerfile` 构建。
- 监听容器内 `3000` 端口。
- 启动前执行数据库结构同步与 seed。
- 上传文件保存到 `/app/uploads`。

### postgres

- 镜像：`postgres:15-alpine`
- 默认数据库：`veb`
- 默认用户：`postgres`
- 默认密码：`postgres`
- 数据卷：`postgres-data`

## 3. 环境变量

### DATABASE_URL

Prisma 数据库连接串。

Docker Compose 默认：

```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/veb?schema=public"
```

### NEXTAUTH_SECRET

NextAuth JWT 与 session 加密密钥。

生产环境必须替换：

```bash
openssl rand -base64 32
```

### NEXTAUTH_URL

应用外部访问地址。

本地：

```env
NEXTAUTH_URL="http://localhost:3000"
```

生产：

```env
NEXTAUTH_URL="https://admin.example.com"
```

### UPLOAD_DIR

本地文件存储目录。

Docker 默认：

```env
UPLOAD_DIR="/app/uploads"
```

### STORAGE_KIND

当前仅支持：

```env
STORAGE_KIND="local"
```

## 4. 单镜像构建

只构建应用镜像：

```bash
docker build -t veb-app .
```

运行时需要外部 PostgreSQL：

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/veb?schema=public" \
  -e NEXTAUTH_SECRET="replace-with-real-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e UPLOAD_DIR="/app/uploads" \
  -e STORAGE_KIND="local" \
  -v veb-uploads:/app/uploads \
  veb-app
```

如果是首次连接新数据库，需要先进入容器或覆盖命令执行：

```bash
pnpm prisma db push
pnpm db:seed
```

## 5. 数据库迁移策略

当前仓库已提交初始 `prisma/migrations` 目录。Compose 为了便于开发/演示仍使用：

```bash
pnpm prisma db push
pnpm db:seed
```

生产环境建议改为：

```bash
pnpm prisma migrate deploy
pnpm db:seed
```

并将迁移目录纳入版本管理。

## 6. HTTPS 与反向代理

生产推荐在应用前放置 Nginx、Traefik 或云负载均衡。

必须确认：

- `NEXTAUTH_URL` 使用 HTTPS 外部域名。
- 反向代理转发 `Host`、`X-Forwarded-Proto`、`X-Forwarded-For`。
- Cookie Secure 策略与 HTTPS 一致。
- 上传文件如继续使用 local，应挂载持久化卷并做好备份。

Nginx 反向代理示例：

```nginx
location / {
  proxy_pass http://app:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## 7. 上线前检查清单

- 替换 `NEXTAUTH_SECRET`。
- 替换数据库密码。
- 配置 `NEXTAUTH_URL` 为真实 HTTPS 地址。
- 挂载并备份 PostgreSQL 数据卷。
- 挂载并备份上传目录。
- 确认超级管理员默认密码已修改。
- 生产环境使用 `prisma migrate deploy` 应用版本化迁移。
- 为 `/app/uploads` 配置容量监控和清理策略。
