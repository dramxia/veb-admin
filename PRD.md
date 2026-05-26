# 通用后台管理系统 — 产品需求文档 (PRD)

> 版本:v1.0 · 日期:2026-05-25 · 状态:Draft
> 技术栈:Next.js 14+ (App Router) · React · TypeScript · Prisma · PostgreSQL · NextAuth.js · Chakra-UI · TailwindCSS · Zustand

---

## 1. 概述

### 1.1 文档目的与读者
本文档定义一个**通用后台管理系统模板**的产品需求,作为后续开发、设计、测试的共同依据。读者:研发、设计、测试、产品。

### 1.2 项目定位
- **通用后台脚手架**,不绑定具体业务领域。
- 内置 RBAC、动态菜单、三层权限校验、操作日志、文件上传。
- 业务方可在此基础上叠加自有模块,无需重新搭建账号/权限基础设施。

### 1.3 设计原则
1. **配置化优先**:菜单、权限、角色都可以通过页面配置,而非改代码。
2. **最小可用**:首版只做 P0 功能,P1 模块独立、可拆。
3. **可扩展**:数据模型、目录结构、权限模型为后续接入 SSO、多租户、审批流预留扩展点。
4. **安全优先**:任何"前端隐藏按钮"必须伴随后端断言,前端权限只承担 UX 作用。

---

## 2. 技术栈

| 分层 | 选型 | 说明 |
| --- | --- | --- |
| 前端框架 | Next.js 14+ (App Router) | RSC + Server Actions + middleware |
| 语言 | TypeScript (strict) | 全栈一致 |
| UI 组件 | Chakra-UI v2 | 表单、表格、Modal、Menu、Toast 等 |
| 原子样式 | TailwindCSS | 仅用于布局与间距微调,不与 Chakra 组件 props 在同一元素叠加 |
| 客户端状态 | Zustand | 轻量 store,服务端数据交给 RSC / fetch 缓存 |
| 数据层 | Prisma ORM + PostgreSQL | 迁移走 `prisma migrate` |
| 认证 | NextAuth.js (Auth.js) v5 | Credentials Provider 起步,OAuth 可后续接入 |
| 包管理 | pnpm | 工作空间预留 |
| 工程化 | ESLint + Prettier + Husky + lint-staged | 强制基线 |

---

## 3. 角色与用户场景

### 3.1 默认内置角色
| 角色 code | 名称 | 说明 | 可改/可删 |
| --- | --- | --- | --- |
| `superadmin` | 超级管理员 | 拥有全部权限,跳过校验 | 不可删,不可改权限 |
| `admin` | 管理员 | 拥有除"系统级危险操作"外的全部权限 | 可改 |
| `user` | 普通用户 | 仅登录 + 个人中心 | 可改 |

> 自定义角色由角色管理模块创建。

### 3.2 典型用户故事
1. **管理员登录**:管理员输入账号密码 → 系统校验 → 写入 session → 跳转到默认首页(由其菜单第一项决定)。
2. **新增用户并分配角色**:管理员在「系统管理 → 用户管理」点击新增,填写资料并勾选角色 `admin` → 保存。
3. **细粒度按钮控制**:产品要求"只有拥有 `system:user:delete` 权限的人能看见删除按钮且能调通接口" → 前端 `<Auth code="system:user:delete">` 包裹按钮,后端 `requirePermission('system:user:delete')` 守卫接口。
4. **被禁用账户**:管理员将某用户 `status` 改为 `DISABLED` → 该用户当前 session 下一次请求失效,跳登录页。
5. **审计查询**:出现疑似越权操作 → 管理员进入「操作日志」按 actor、action、时间检索。

---

## 4. 主要功能点总览

| # | 模块 | 责任 | 优先级 |
| --- | --- | --- | --- |
| 1 | 认证 | 登录、登出、找回密码、Session 守卫 | P0 |
| 2 | 用户管理 | 用户 CRUD、改密、启停、分配角色 | P0 |
| 3 | 角色管理 | 角色 CRUD、分配权限、分配用户 | P0 |
| 4 | 权限管理 | 权限码 CRUD,菜单/按钮类型 | P0 |
| 5 | 菜单/路由管理 | 菜单树 CRUD、绑定权限码、动态下发 | P0 |
| 6 | 个人中心 | 资料修改、改密 | P0 |
| 7 | 仪表盘 | 占位首页(P1 可叠加数据卡片) | P1 |
| 8 | 操作日志 | 关键操作审计 | P1 |
| 9 | 文件上传 | 上传、下载、预览(本地存储,留 OSS 适配口) | P1 |

---

## 5. 权限管理(详细)

### 5.1 权限模型(RBAC)

实体关系:

```
User  ─┐
       ├──< UserRole >── Role ──< RolePermission >── Permission
       │                                                  ▲
       │                                                  │ (menu permission 绑定)
       └─ Session                                         │
                                                       Menu
```

- `User` ↔ `Role`:多对多。
- `Role` ↔ `Permission`:多对多。
- `Menu` → `Permission`:菜单挂一个 `MENU` 类型权限码,通过该权限码加入角色。
- 超级管理员(`role.code = 'superadmin'`)在所有校验点短路通过。

### 5.2 权限类型
| type | 含义 | 示例 |
| --- | --- | --- |
| `MENU` | 控制菜单/路由可见与可访问 | `system:user:view` |
| `BUTTON` | 控制页面内按钮、列操作、批量动作 | `system:user:create` / `system:user:delete` / `system:user:export` |

### 5.3 权限标识规范
- 命名:`模块:对象:操作`,全小写、英文冒号分隔。
- 示例:
  - `system:user:view` / `system:user:create` / `system:user:update` / `system:user:delete`
  - `system:role:assign-permission`
  - `system:menu:view`
  - `log:operation:view` / `log:operation:export`
- 操作动词推荐:`view`、`create`、`update`、`delete`、`export`、`import`、`assign-xxx`。

### 5.4 权限下发流程
1. 用户登录,NextAuth 生成 session(JWT 策略),`userId` 写入 token。
2. 受保护的根 layout(Server Component)读取 session → 调 `getUserMenuAndPermissions(userId)`,聚合:
   - 菜单树(已剪枝,仅包含用户可见)
   - 按钮权限码集合 `Set<string>`
3. 通过初始化 props 注入 Zustand `menuStore`,客户端组件可读。
4. API 路由侧不依赖前端,只读 session + DB 实时校验。

### 5.5 三层校验防越权
| 层 | 实现 | 作用 |
| --- | --- | --- |
| 前端按钮 | `<Auth code="...">` 或 `useHasPermission(code)` | UX 隐藏/禁用,**不可作为安全边界** |
| 中间件 | `middleware.ts` 检查 session 与路由 → 菜单权限码 | 防止用户直接粘贴 URL 进入未授权页 |
| API handler | `requirePermission(code)` 装饰器 / 工具函数 | 真正的安全边界,所有变更类接口必须 |

### 5.6 权限管理页面功能
- 权限码列表(分页、按 type 筛选、按 code 模糊搜索)。
- 新增/编辑/删除权限:字段 `code`、`name`、`type`、`description`、`parentId`(可选,用于权限分组展示)。
- 内置权限(系统自带的)不可删除,标记 `system = true`。

---

## 6. 角色管理(详细)

### 6.1 字段
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string (cuid) | 主键 |
| code | string unique | 业务唯一标识(英文,内置角色不可改) |
| name | string | 显示名 |
| description | string? | 描述 |
| status | enum(`ENABLED`/`DISABLED`) | 禁用后该角色对应用户即时失权 |
| sort | int | 列表排序 |
| isSystem | boolean | 内置角色保护 |
| createdAt / updatedAt | datetime | — |

### 6.2 功能列表
1. 角色列表(分页 + 关键字搜索 + 状态筛选)。
2. 新增/编辑角色(普通字段)。
3. 启停切换(内置角色禁止)。
4. 删除角色:仅当未关联任何用户时允许;内置角色不可删。
5. **分配权限**:右侧抽屉打开权限树(按权限 `parentId` 分组),勾选后保存。超管角色禁止改权限。
6. **分配用户**:支持从用户池搜索勾选;支持批量解绑。

### 6.3 涉及权限码
- `system:role:view` / `system:role:create` / `system:role:update` / `system:role:delete`
- `system:role:assign-permission`
- `system:role:assign-user`

---

## 7. 路由管理(详细)

### 7.1 设计理念
**菜单即路由**:一条菜单记录对应一个可访问页面(或一个目录节点)。菜单存储在数据库中,前端启动后按用户拉取菜单树并动态渲染。

### 7.2 字段
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 主键 |
| parentId | string? | 父菜单,根菜单为 null |
| name | string | 显示名 |
| path | string | 路由路径(如 `/system/user`) |
| component | string? | 页面组件路径标识(动态导入用,如 `system/user/page`) |
| icon | string? | Chakra-UI / lucide 图标名 |
| sort | int | 同级排序 |
| type | enum(`DIR`/`PAGE`/`LINK`) | 目录/页面/外链 |
| permissionCode | string? | 关联的 `MENU` 类型权限码 |
| visible | boolean | 是否在侧边栏显示(隐藏型路由仍可访问,如详情页) |
| status | enum(`ENABLED`/`DISABLED`) | 禁用后所有用户均不可访问 |
| externalUrl | string? | type=LINK 时使用 |
| createdAt / updatedAt | datetime | — |

### 7.3 功能列表
1. 树形展示菜单,支持展开/折叠、拖拽排序(可选 P1)。
2. 新增/编辑/删除菜单。
3. 选择/创建关联的权限码:若为 PAGE 类型,必须绑定一个 `MENU` 权限;DIR 可选;LINK 可选。
4. 预览效果:实时显示当前用户视角下的菜单树。
5. 内置基础菜单(系统管理下的子项)不可删,只能改名/改图标。

### 7.4 前端动态路由生成

**静态路由(代码固定)**:
- `/login` 登录
- `/403` 无权限
- `/404` 找不到
- `/profile` 个人中心
- `/` 仪表盘(登录后默认进入)

**动态路由**:
- `app/(dashboard)/[[...slug]]/page.tsx` 作为统一壳,匹配数据库菜单的 `path`。
- 启动时根 layout 拉取 `getUserMenuTree(userId)` → 渲染侧边栏。
- 命中具体页面时,通过 `component` 字段映射到 `app/_modules/<component>/page.tsx`(用 dynamic import 装载)。
- 找不到 `component` → 跳 `/404`;命中但无权限 → 跳 `/403`。

### 7.5 中间件鉴权(`middleware.ts`)
伪代码:

```ts
export async function middleware(req) {
  const session = await getToken(req)
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()
  if (!session) return redirect('/login')

  const allowed = await canAccess(session.userId, pathname) // 缓存
  if (!allowed) return redirect('/403')
  return NextResponse.next()
}
```

- 公开路径白名单:`/login`、`/api/auth/*`、静态资源。
- `canAccess` 内部基于用户菜单 + 通配匹配,结果缓存(LRU,5 分钟)。

### 7.6 涉及权限码
- `system:menu:view` / `system:menu:create` / `system:menu:update` / `system:menu:delete`

---

## 8. 数据模型(Prisma Schema 草案)

> 仅展示关键字段;实施时按 Prisma 语法补全。

```prisma
model User {
  id            String     @id @default(cuid())
  username      String     @unique
  email         String?    @unique
  passwordHash  String
  nickname      String?
  avatar        String?
  status        UserStatus @default(ENABLED)
  lastLoginAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  roles         UserRole[]
  files         File[]
  operationLogs OperationLog[]
}

model Role {
  id          String           @id @default(cuid())
  code        String           @unique
  name        String
  description String?
  status      CommonStatus     @default(ENABLED)
  sort        Int              @default(0)
  isSystem    Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  users       UserRole[]
  permissions RolePermission[]
}

model Permission {
  id          String           @id @default(cuid())
  code        String           @unique           // e.g. system:user:create
  name        String
  type        PermissionType                     // MENU | BUTTON
  description String?
  parentId    String?
  isSystem    Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  roles       RolePermission[]
  menus       Menu[]
}

model Menu {
  id              String      @id @default(cuid())
  parentId        String?
  name            String
  path            String
  component       String?
  icon            String?
  sort            Int         @default(0)
  type            MenuType    @default(PAGE)     // DIR | PAGE | LINK
  permissionCode  String?
  permission      Permission? @relation(fields: [permissionCode], references: [code])
  visible         Boolean     @default(true)
  status          CommonStatus @default(ENABLED)
  externalUrl     String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@id([userId, roleId])
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@id([roleId, permissionId])
}

model OperationLog {
  id         String   @id @default(cuid())
  actorId    String?
  actor      User?    @relation(fields: [actorId], references: [id])
  action     String                       // e.g. user.create
  target     String?                      // e.g. user:{id}
  ip         String?
  userAgent  String?
  payload    Json?
  status     LogStatus @default(SUCCESS)
  message    String?
  createdAt  DateTime @default(now())
}

model File {
  id         String   @id @default(cuid())
  name       String
  path       String
  mime       String
  size       Int
  uploaderId String?
  uploader   User?    @relation(fields: [uploaderId], references: [id])
  scope      String?                      // 业务范围标签
  createdAt  DateTime @default(now())
}

enum UserStatus      { ENABLED DISABLED }
enum CommonStatus    { ENABLED DISABLED }
enum PermissionType  { MENU BUTTON }
enum MenuType        { DIR PAGE LINK }
enum LogStatus       { SUCCESS FAILURE }
```

> NextAuth 所需的 `Account` / `Session` / `VerificationToken` 表按 Auth.js 官方 Prisma adapter 模板叠加。

---

## 9. 主要功能点详述

### 9.1 认证(P0)
- **页面**:`/login`、`/forgot-password`(P1,可后置)。
- **接口**:`POST /api/auth/callback/credentials`(NextAuth 提供)、`POST /api/auth/signout`。
- **字段**:username、password。
- **逻辑**:bcrypt 比对密码 → 检查 `user.status === ENABLED` → 生成 JWT session。
- **失败提示**:统一返回"账号或密码错误",不暴露用户是否存在。
- **边界**:首版不做注册入口(用户由管理员创建)、不做邮箱验证。

### 9.2 用户管理(P0)
- **页面**:`/system/user`。
- **接口**:`GET/POST/PATCH/DELETE /api/system/users`、`POST /api/system/users/:id/reset-password`、`POST /api/system/users/:id/assign-roles`。
- **字段**:见 §8 `User`。
- **权限码**:`system:user:view` / `:create` / `:update` / `:delete` / `:reset-password` / `:assign-role`。
- **非目标**:不做用户自助注册、不做手机号验证。

### 9.3 角色管理(P0)
- **页面**:`/system/role`。
- **接口**:`GET/POST/PATCH/DELETE /api/system/roles`、`POST /api/system/roles/:id/permissions`、`POST /api/system/roles/:id/users`。
- **字段**:见 §8 `Role` + §6.1。
- **权限码**:见 §6.3。
- **校验**:删除前检查关联用户数 > 0 时拒绝。

### 9.4 权限管理(P0)
- **页面**:`/system/permission`。
- **接口**:`GET/POST/PATCH/DELETE /api/system/permissions`。
- **字段**:见 §8 `Permission`。
- **权限码**:`system:permission:view` / `:create` / `:update` / `:delete`。
- **校验**:`isSystem = true` 的权限不可删,不可改 `code`。

### 9.5 菜单/路由管理(P0)
- **页面**:`/system/menu`。
- **接口**:`GET /api/system/menus/tree`、`POST/PATCH/DELETE /api/system/menus`、`GET /api/menu/me`(当前用户菜单)。
- **字段**:见 §7.2。
- **权限码**:见 §7.6。
- **边界**:首版菜单上限 4 级。

### 9.6 个人中心(P0)
- **页面**:`/profile`。
- **接口**:`PATCH /api/profile`、`POST /api/profile/change-password`。
- **功能**:改昵称、头像、邮箱;改密码(需输入原密码)。

### 9.7 操作日志(P1)
- **页面**:`/system/log/operation`。
- **接口**:`GET /api/system/logs/operation`、`GET /api/system/logs/operation/export`。
- **字段**:见 §8 `OperationLog`。
- **权限码**:`log:operation:view` / `log:operation:export`。
- **写入策略**:在所有 `POST/PATCH/DELETE` API handler 通过统一中间件写入,避免散落。
- **保留期**:默认 180 天,超过定时清理(留 cron 接口,首版不实现自动清理)。

### 9.8 文件上传(P1)
- **页面**:无独立页面(以组件 `<FileUpload>` 提供);可选「文件管理」`/system/file` 列表查看。
- **接口**:`POST /api/files`(multipart)、`GET /api/files/:id`、`DELETE /api/files/:id`。
- **存储**:首版本地磁盘(`./uploads`),封装 `StorageAdapter` 接口,后续可替换为 OSS/S3。
- **权限码**:`system:file:upload` / `:view` / `:delete`。
- **限制**:单文件 ≤ 20MB,白名单 mime 校验。

### 9.9 仪表盘(P1)
- **页面**:`/`(登录后默认)。
- **首版**:仅欢迎语 + 用户数/角色数等基础统计卡片。

---

## 10. 前端架构与状态划分

### 10.1 目录结构(草案)

```
.
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              // 拉取菜单、注入 store、侧边栏 + Header
│   │   ├── page.tsx                // 仪表盘
│   │   ├── profile/page.tsx
│   │   └── [[...slug]]/page.tsx    // 动态匹配数据库菜单
│   ├── 403/page.tsx
│   ├── 404/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── menu/me/route.ts
│       └── system/
│           ├── users/...
│           ├── roles/...
│           ├── permissions/...
│           └── menus/...
├── components/
│   ├── auth/Auth.tsx               // <Auth code="..."> 按钮守卫
│   ├── layout/Sidebar.tsx
│   ├── layout/Header.tsx
│   └── common/...
├── stores/
│   ├── authStore.ts
│   ├── menuStore.ts
│   └── uiStore.ts
├── lib/
│   ├── auth.ts                     // NextAuth 配置
│   ├── prisma.ts
│   ├── permission.ts               // requirePermission, canAccess
│   └── api.ts                      // 统一响应壳、错误码
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                     // 内置超管 / 内置权限 / 内置菜单
├── middleware.ts
├── tailwind.config.ts
└── PRD.md
```

### 10.2 Zustand 状态划分

| store | 内容 | 来源 |
| --- | --- | --- |
| `authStore` | 当前 session 快照(userId、username、avatar、roles[]) | RSC 注入 |
| `menuStore` | 菜单树、按钮权限码 Set | RSC 注入 |
| `uiStore` | 侧边栏折叠、主题、布局尺寸 | 客户端持久化(localStorage) |

> 服务端数据(列表/详情)走 React Server Components 或 fetch + revalidate,不进 Zustand。

### 10.3 Chakra + Tailwind 共存策略
- Chakra 提供组件库与主题 token(`extendTheme` 定义主色、圆角等)。
- Tailwind 只在容器/布局层用(`flex`、`gap-4`、`p-6`、`grid`、响应式断点)。
- **禁止**在同一元素上同时使用 Chakra 样式 props 和 Tailwind 类名,避免覆盖优先级踩坑。
- `ChakraProvider` 包在根 `layout.tsx`,与 Tailwind base 样式协调(Tailwind 的 preflight 仅在不影响 Chakra 默认的范围内启用)。

---

## 11. 非功能性需求

### 11.1 安全
- 密码 bcrypt(cost ≥ 12)。
- NextAuth 默认 CSRF。
- API 限流:在 `app/api/*` 接入限流工具(预留 `lib/rate-limit.ts`,首版可空实现)。
- 敏感字段输出脱敏(`passwordHash` 永远不返回前端)。
- 所有写接口必须 `requirePermission`。

### 11.2 性能
- 列表统一分页(默认 pageSize=20,最大 100)。
- Prisma `select` / `include` 精确控制返回字段。
- 用户菜单/权限缓存:LRU 内存缓存 + 关键变更(分配权限/角色)时主动失效。

### 11.3 可维护
- 全量 TypeScript strict 模式。
- 统一 API 响应壳:`{ code: number, data: T, message: string }`,错误码集中在 `lib/errors.ts`。
- 提交规范:Conventional Commits。

### 11.4 国际化
- 预留 i18n provider(可选 `next-intl`)。
- 首版仅中文,所有文案集中在 `messages/zh.ts`,便于后续抽离。

### 11.5 可访问性
- Chakra-UI 默认 ARIA 友好,保持组件语义化。
- 键盘可达(tab 顺序、Modal focus trap)。

---

## 12. 里程碑

| 里程碑 | 范围 | 验收 |
| --- | --- | --- |
| M1 — 脚手架与核心 CRUD | Next.js + Prisma + NextAuth + Chakra/Tailwind 搭建;用户/角色/权限/菜单 CRUD 页面 | 内置超管可登录并跑通增删改查 |
| M2 — 动态菜单与三层校验 | 菜单树下发、Sidebar 动态渲染、middleware 鉴权、`<Auth>` 组件、`requirePermission` | 普通用户登录后只能看见被授权的菜单与按钮,直接粘 URL 也无法绕过 |
| M3 — 操作日志 + 文件上传 | 日志统一写入中间件、日志查询页;文件上传组件、本地存储 | 任意 CUD 操作可在日志中查到;上传一张图片可下载/预览 |
| M4 — 打磨 | 国际化抽离、错误码补全、文档、E2E 用例 | 跑通 Playwright 关键路径 |

---

## 13. 开放问题 / 待定项

| # | 问题 | 当前默认 | 决策时点 |
| --- | --- | --- | --- |
| 1 | 是否做多租户(组织/工作区) | 否(单租户) | v1 之后 |
| 2 | 是否接入 SSO(企业微信、飞书、钉钉) | 否,首版仅账号密码;NextAuth 已为 OAuth 预留 | v1 之后或按需 |
| 3 | 部署形态(Vercel / Docker / K8s) | Docker(自托管) | 实施前确认 |
| 4 | 是否需要数据权限(部门/本人/自定义范围) | 否(首版只做菜单+按钮级) | v2 |
| 5 | 是否做审批流 / 工作流 | 否 | v2 |
| 6 | 操作日志保留期与自动清理 | 默认保留 180 天,首版不自动清理 | M3 |

---

## 附录 A:内置权限码与菜单种子数据(建议)

| 菜单路径 | 名称 | 权限码 | 类型 |
| --- | --- | --- | --- |
| `/system` | 系统管理 | `system:view` | DIR |
| `/system/user` | 用户管理 | `system:user:view` | PAGE |
| `/system/role` | 角色管理 | `system:role:view` | PAGE |
| `/system/permission` | 权限管理 | `system:permission:view` | PAGE |
| `/system/menu` | 菜单管理 | `system:menu:view` | PAGE |
| `/system/file` | 文件管理 (P1) | `system:file:view` | PAGE |
| `/system/log/operation` | 操作日志 (P1) | `log:operation:view` | PAGE |

按钮级权限按 `:create` / `:update` / `:delete` / `:export` / `:assign-*` 后缀派生,在 `prisma/seed.ts` 中初始化。

---

## 附录 B:统一 API 响应壳

```ts
// 成功
{ "code": 0, "data": <T>, "message": "ok" }

// 失败
{ "code": 40301, "data": null, "message": "无权限" }
```

错误码分段:
- `0` 成功
- `400xx` 参数/校验类
- `401xx` 未认证
- `403xx` 无权限
- `404xx` 资源不存在
- `409xx` 冲突
- `500xx` 服务端错误
