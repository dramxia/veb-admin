# 架构说明

本文描述 VEB 通用后台管理系统的当前架构、核心数据流与模块边界。

## 1. 总体架构

```text
[Browser]
   │
   │  React / Chakra UI / Zustand
   ▼
[Next.js App Router]
   ├── Server Components：页面首屏、权限页面守卫
   ├── Client Components：表格、弹窗、上传、按钮权限
   ├── API Routes：系统 CRUD、日志、文件
   └── middleware：登录态与菜单路径拦截
   │
   ▼
[Service Layer in lib/]
   ├── auth.ts              NextAuth 配置
   ├── permission.ts        权限校验
   ├── menu.ts              菜单与权限聚合
   ├── api.ts               API 响应壳与操作日志包装
   ├── operation-log.ts     审计写入
   └── storage/             文件存储适配
   │
   ▼
[Prisma ORM]
   │
   ▼
[PostgreSQL]
```

## 2. 核心模块边界

### 认证模块

- 使用 NextAuth Credentials Provider。
- 登录成功后 JWT 中写入：
  - `userId`
  - `username`
  - `roles`
  - `permissionCodes`
  - `menuPaths`
- 用户被禁用时，JWT callback 会标记 `disabled`，middleware 将其导回登录页。

### 菜单与权限模块

- `Menu` 表保存路由路径、组件映射、排序、显隐、状态和菜单权限码。
- `Permission` 表区分 `MENU` 与 `BUTTON`。
- `getUserMenuAndPermissions(userId)` 聚合当前用户菜单树与权限码集合。
- 超级管理员角色 `superadmin` 短路拥有全部权限。

### API 模块

API 统一返回：

```json
{
  "code": 0,
  "data": {},
  "message": "ok"
}
```

错误由 `withApi` 捕获并映射为标准错误码。
写操作可通过 `withApi(handler, { action })` 自动写入操作日志。

### 文件模块

当前实现本地存储适配：

```text
lib/storage/types.ts  定义 StorageAdapter
lib/storage/local.ts  local 实现
lib/storage/index.ts  根据 STORAGE_KIND 创建适配器
```

上传限制集中在 `upload.ts`：

- 单文件不超过 20MB。
- 允许图片、PDF、文本与 Office 常见类型。
- 拒绝危险可执行后缀。

## 3. 请求链路

### 页面访问链路

```text
用户访问页面
  → middleware 读取 JWT
  → 未登录跳 /login
  → 页面路径命中 menuPaths 或 superadmin 放行
  → Dashboard Layout 聚合菜单与权限
  → 页面级 requirePermission('*:view') 再校验
  → 渲染页面
```

说明：middleware 是轻量 UX 与路由拦截层，最终安全边界仍在页面级守卫与 API 守卫。

### API 写操作链路

```text
Client Action / fetch
  → API Route
  → withApi 包装
  → requirePermission('module:object:action')
  → Prisma 执行业务写入
  → withApi 写 OperationLog
  → 返回标准响应
```

### 文件上传链路

```text
浏览器 FormData
  → POST /api/files
  → requirePermission('system:file:upload')
  → prepareUploadFile 校验大小、MIME、后缀
  → StorageAdapter.save 写入磁盘
  → File 表记录元数据
  → 返回文件 id 与 url
```

## 4. 数据模型关系

```text
User ──< UserRole >── Role ──< RolePermission >── Permission
 │                                                    ▲
 │                                                    │
 ├── File                                       Menu.permissionCode
 └── OperationLog
```

关键规则：

- `User` 与 `Role` 多对多。
- `Role` 与 `Permission` 多对多。
- `Menu.permissionCode` 绑定一个 `MENU` 类型权限码。
- `BUTTON` 类型权限码只用于页面内按钮与 API 动作守卫。

## 5. 运行时状态

客户端 Zustand store：

- `menu-store`：菜单树、权限码集合。
- `auth-store`：当前登录用户快照。
- `ui-store`：侧边栏折叠等 UI 状态。

服务端缓存：

- `permission-cache`：缓存用户权限快照。
- 用户角色、角色权限、菜单、用户启停变更时需要失效缓存。

## 6. 当前约束

- 生产级数据库迁移目录尚未纳入仓库，当前容器启动使用 `prisma db push`。
- 文件存储仅实现 `local`，S3/OSS 是后续扩展点。
- middleware 使用 JWT 中的 `menuPaths` 做轻量拦截，权限实时性由重新登录和服务端守卫兜底。
