# 通用后台管理系统 — 实施过程文档 (M1-M4)

> 配套文档:[PRD.md](./PRD.md)
> 版本:v1.0 · 日期:2026-05-25
> 目标:把 PRD 拆解为四个里程碑下的可执行步骤,每个步骤包含**目标 / 输出文件 / 验收**三段式描述,作为后续逐步生成代码的工作手册。

---

## 0. 前置准备(执行一次)

### 0.1 本机依赖

- Node.js ≥ 20.10
- pnpm ≥ 9
- PostgreSQL ≥ 15(本地或 Docker)
- 推荐 VSCode + Prisma 插件

### 0.2 初始化命令(在 `/Users/misemo/project/my/veb/` 下执行)

```bash
pnpm init
pnpm add next@^14 react react-dom
pnpm add @prisma/client next-auth@beta @auth/prisma-adapter
pnpm add @chakra-ui/react @chakra-ui/next-js @emotion/react @emotion/styled framer-motion
pnpm add zustand bcryptjs lru-cache zod
pnpm add -D typescript @types/node @types/react @types/react-dom @types/bcryptjs
pnpm add -D prisma tsx
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D eslint eslint-config-next prettier husky lint-staged
pnpm dlx prisma init --datasource-provider postgresql
pnpm dlx tailwindcss init -p
```

### 0.3 环境变量(`.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/veb?schema=public"
NEXTAUTH_SECRET="<openssl rand -base64 32 的输出>"
NEXTAUTH_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
```

---

## 1. M1 — 脚手架与核心 CRUD

> **目标**:把工程跑起来,内置超管登录,跑通用户/角色/权限/菜单的 CRUD。

### 1.1 工程基线

- **目标**:确立目录结构、TS 严格模式、Lint/Prettier、Chakra+Tailwind 共存。
- **输出文件**:
  - `package.json` — 脚本(`dev`/`build`/`start`/`lint`/`db:migrate`/`db:seed`)
  - `tsconfig.json` — strict、`@/*` 路径别名
  - `next.config.mjs` — 基础配置
  - `tailwind.config.ts` — `corePlugins.preflight = false`(避免与 Chakra 冲突)
  - `postcss.config.js`
  - `.eslintrc.json` — extends `next/core-web-vitals`
  - `.prettierrc`、`.editorconfig`、`.gitignore`、`.env.example`
  - `app/layout.tsx` — 根布局 + ChakraProvider + Tailwind base
  - `app/globals.css` — 仅 Tailwind layout 工具类
  - `app/providers.tsx` — Chakra `extendTheme` + `<ChakraProvider>` + `<CacheProvider>`
- **验收**:`pnpm dev` 启动后访问 `/` 能看到空白欢迎页且无 console 报错。

### 1.2 数据层(Prisma)

- **目标**:落地 §8 数据模型 + Auth.js 必需表(Account/Session/VerificationToken)。
- **输出文件**:
  - `prisma/schema.prisma` — User / Role / Permission / Menu / UserRole / RolePermission / OperationLog / File + Auth 表 + 枚举
  - `prisma/seed.ts` — 内置:
    - 超管账号 `admin / Admin@123`(bcrypt)
    - 内置角色:`superadmin`、`admin`、`user`(`isSystem=true`)
    - 内置权限码:`system:view` / `system:user:*` / `system:role:*` / `system:permission:*` / `system:menu:*`(全部 `isSystem=true`)
    - 内置菜单:见 PRD 附录 A
  - `lib/prisma.ts` — 单例 Prisma Client(防止热更新泄漏)
- **执行命令**(用户自跑):
  ```bash
  pnpm prisma migrate dev --name init
  pnpm tsx prisma/seed.ts
  ```
- **验收**:能用 Prisma Studio 看到种子数据;`admin` 用户带 `superadmin` 角色。

### 1.3 认证(NextAuth v5,Credentials)

- **目标**:`/login` 页面 + JWT session + 自动跳转。
- **输出文件**:
  - `lib/auth.ts` — `NextAuth({ providers, callbacks, session: { strategy: 'jwt' } })`,登录回调里写 `userId`/`username` 进 token
  - `app/api/auth/[...nextauth]/route.ts`
  - `app/(auth)/login/page.tsx` — Chakra 表单(username/password)
  - `app/(auth)/login/login-form.tsx` — Client Component(调用 `signIn('credentials')`)
  - `middleware.ts` — 占位版本,只做未登录跳 `/login`(M2 升级为细粒度鉴权)
- **验收**:用 `admin / Admin@123` 能登录,跳到 `/`;未登录访问 `/system/user` 跳 `/login`。

### 1.4 统一 API 响应壳与错误码

- **目标**:所有 API 返回 PRD 附录 B 的 `{ code, data, message }`。
- **输出文件**:
  - `lib/api.ts` — `ok(data)` / `fail(code, message)` / `withApi(handler)` 高阶函数
  - `lib/errors.ts` — 错误码常量(`0`、`40001 参数错误`、`40101 未登录`、`40301 无权限`、`40401 资源不存在`、`40901 冲突`、`50001 服务端错误`)
  - `lib/validation.ts` — Zod schemas 收口
- **验收**:任意接口 throw → 走中间件捕获 → 返回标准 fail 结构。

### 1.5 权限工具(M1 弱化版)

- **目标**:先做"登录即可访问"的占位,API 守卫返回 stub。
- **输出文件**:
  - `lib/session.ts` — `getSession()` / `requireUser()`(从 NextAuth 取 session)
  - `lib/permission.ts` — `requirePermission(code)` 暂时只校验"登录",真正逻辑在 M2 完善;`hasPermission(userId, code)` 返回 `true` 占位
- **验收**:登录后访问 `/api/system/users` 不再 401。

### 1.6 后台主壳(Dashboard Layout)

- **目标**:登录后看到 Sidebar + Header + 内容区,菜单先用硬编码版本。
- **输出文件**:
  - `app/(dashboard)/layout.tsx` — Server Component,读 session,渲染 Header + Sidebar + `<main>`
  - `app/(dashboard)/page.tsx` — 仪表盘(欢迎语 + 简单统计卡片)
  - `components/layout/sidebar.tsx` — 接收菜单 props 渲染(M1 用静态菜单,M2 接 store)
  - `components/layout/header.tsx` — 头像、下拉(个人中心 / 登出)
  - `components/layout/dashboard-shell.tsx` — Client 容器,负责响应式折叠
  - `stores/ui-store.ts` — sidebarCollapsed(localStorage 持久化)
- **验收**:有完整的后台外观,Sidebar 显示"系统管理"菜单组。

### 1.7 模块:用户管理

- **目标**:列表(分页/搜索/状态筛选)、新增、编辑、删除、改密、分配角色。
- **输出文件**:
  - `app/api/system/users/route.ts` — `GET`(分页) / `POST`
  - `app/api/system/users/[id]/route.ts` — `GET` / `PATCH` / `DELETE`
  - `app/api/system/users/[id]/reset-password/route.ts` — `POST`
  - `app/api/system/users/[id]/assign-roles/route.ts` — `POST`
  - `app/(dashboard)/system/user/page.tsx` — Server Component(初次加载列表)
  - `app/(dashboard)/system/user/user-table.tsx` — Client(分页交互、搜索、操作按钮)
  - `app/(dashboard)/system/user/user-form-modal.tsx` — 新增/编辑表单
  - `app/(dashboard)/system/user/assign-roles-modal.tsx` — 选角色
  - `app/(dashboard)/system/user/_actions.ts` — 封装 `fetch` 调用
- **验收**:超管可以新增用户并分配 `admin` 角色,新用户能登录。

### 1.8 模块:角色管理

- **目标**:列表 + CRUD + 启停 + 分配权限 + 分配用户。
- **输出文件**:
  - `app/api/system/roles/route.ts` / `[id]/route.ts`
  - `app/api/system/roles/[id]/permissions/route.ts` — `POST`(批量覆写)
  - `app/api/system/roles/[id]/users/route.ts` — `POST`(批量绑定/解绑)
  - `app/(dashboard)/system/role/page.tsx`
  - `app/(dashboard)/system/role/role-table.tsx`
  - `app/(dashboard)/system/role/role-form-modal.tsx`
  - `app/(dashboard)/system/role/assign-permission-drawer.tsx` — 树形勾选
  - `app/(dashboard)/system/role/assign-user-drawer.tsx`
- **校验点**:
  - 删除前查 `UserRole.count > 0` → 拒绝
  - `isSystem=true` 的 `superadmin` 禁止改权限
  - `superadmin` / `admin` / `user` 不可删
- **验收**:能为 `admin` 角色批量勾选权限,新用户被赋角色后立即生效(M1 暂不强校验,M2 接入)。

### 1.9 模块:权限管理

- **目标**:列表(按 type 筛选、code 模糊搜索)、CRUD;`isSystem=true` 仅可改名/描述。
- **输出文件**:
  - `app/api/system/permissions/route.ts` / `[id]/route.ts`
  - `app/(dashboard)/system/permission/page.tsx`
  - `app/(dashboard)/system/permission/permission-table.tsx`
  - `app/(dashboard)/system/permission/permission-form-modal.tsx`
- **验收**:能新建一个 `BUTTON` 类型权限并被角色分配。

### 1.10 模块:菜单管理

- **目标**:树形 CRUD;字段见 PRD §7.2;PAGE 类型必须绑定 `MENU` 权限码。
- **输出文件**:
  - `app/api/system/menus/route.ts` / `[id]/route.ts`
  - `app/api/system/menus/tree/route.ts` — `GET`(后台完整树)
  - `app/(dashboard)/system/menu/page.tsx`
  - `app/(dashboard)/system/menu/menu-tree.tsx` — 折叠树
  - `app/(dashboard)/system/menu/menu-form-modal.tsx`
- **校验点**:
  - 深度 ≤ 4
  - `type=PAGE` 必须有 `permissionCode`
  - 内置菜单只能改 `name`/`icon`
- **验收**:能新增一个新菜单,绑定到 `admin` 角色后下次登录显示在 Sidebar(M2 完成动态渲染)。

### 1.11 模块:个人中心

- **目标**:改昵称/头像/邮箱;改密码。
- **输出文件**:
  - `app/api/profile/route.ts` — `PATCH`
  - `app/api/profile/change-password/route.ts` — `POST`(校验原密码)
  - `app/(dashboard)/profile/page.tsx`
  - `app/(dashboard)/profile/profile-form.tsx`
  - `app/(dashboard)/profile/change-password-form.tsx`
- **验收**:改密码后旧密码失效,新密码能登录。

### 1.12 错误页与静态路由

- **输出文件**:
  - `app/403/page.tsx`、`app/404/page.tsx`、`app/not-found.tsx`
- **验收**:访问不存在路径走 404,无权限走 403。

### 1.13 M1 验收清单

- [ ] `pnpm dev` 启动无错
- [ ] 超管能登录
- [ ] 用户/角色/权限/菜单四张表 CRUD 在页面可视化
- [ ] 改密码、分配角色、分配权限链路打通
- [ ] 所有 API 返回 `{ code, data, message }`

---

## 2. M2 — 动态菜单与三层校验

> **目标**:把"前端按钮 + middleware + API 守卫"全部接上,菜单完全由数据库驱动。

### 2.1 用户菜单与权限聚合

- **输出文件**:
  - `lib/menu.ts` — `getUserMenuAndPermissions(userId): { menus: MenuNode[]; permissions: Set<string> }`
    - 超管:返回全部启用菜单 + 所有权限码
    - 普通用户:`User → Roles → Permissions`,按 `MENU` 类型过滤菜单(剪枝空目录)
  - `lib/permission-cache.ts` — `lru-cache`(maxAge=5min),key=`userId`
  - `app/api/menu/me/route.ts` — `GET`,返回当前用户聚合结果
- **失效点**:
  - 用户分配角色 / 角色分配权限 / 菜单变更 / 用户被禁用 → 主动 `cache.delete(userId)`(集中在 `lib/permission-cache.ts` 暴露 `invalidate(userId)`)
- **验收**:登录后请求 `/api/menu/me` 返回当前用户菜单树与权限码集合。

### 2.2 Dashboard Layout 改为动态菜单

- **改造文件**:
  - `app/(dashboard)/layout.tsx` — Server Component 调 `getUserMenuAndPermissions(userId)` 并把结果通过 `<MenuStoreInitializer>` 注入 store
  - `stores/menu-store.ts` — Zustand:`menus`、`permissionCodes: Set<string>`、`setAll(payload)`
  - `stores/auth-store.ts` — `user: { id, username, nickname, avatar, roles[] }`
  - `components/layout/menu-store-initializer.tsx` — Client 初始化 hooks
  - `components/layout/sidebar.tsx` — 从 `menuStore` 读菜单,递归渲染
- **验收**:为普通用户只勾选"角色管理",登录后 Sidebar 只显示该菜单。

### 2.3 `<Auth>` 组件 + `useHasPermission` Hook

- **输出文件**:
  - `components/auth/auth.tsx` — `<Auth code="...">{children}</Auth>`,缺权限时默认隐藏(支持 `fallback` prop)
  - `components/auth/use-has-permission.ts` — `useHasPermission(code | code[])`
  - `components/auth/auth-button.tsx` — 包装 Chakra `<Button>` 自动绑定权限
- **改造点**:所有页面"新建/编辑/删除"按钮换成 `<Auth code="...">` 包裹
- **验收**:无 `system:user:delete` 权限的用户在用户列表看不到删除按钮。

### 2.4 动态路由壳

- **输出文件**:
  - `app/(dashboard)/[[...slug]]/page.tsx` — 解析 `pathname` → 查菜单 → 动态 `import` 对应 `app/_modules/<component>/page.tsx`
  - `app/_modules/manifest.ts` — `component` 字符串到动态组件的映射(`{ 'system/user/page': () => import(...) }`),避免任意路径动态 import
  - `app/_modules/example/page.tsx` — 示例占位
- **验收**:在菜单管理新增一条 PAGE 指向 `example`,赋权后能在 Sidebar 点开。

### 2.5 中间件细粒度鉴权

- **改造文件**:
  - `middleware.ts`
    - 公开路径白名单:`/login`、`/api/auth/*`、`/_next/*`、静态资源
    - 未登录 → `/login`
    - 调 `canAccess(userId, pathname)`(基于菜单 path 通配 + 用户 MENU 权限码)
    - 不通过 → `/403`
  - `lib/permission.ts` — `canAccess(userId, pathname)` 实现:匹配最深菜单 → 校验 `permissionCode` 是否在用户权限集合
- **注意**:Edge runtime 不能用 Prisma → middleware 走 `/api/internal/can-access` 或 NextAuth JWT 中携带的权限码集合(推荐方案 B:JWT callback 里塞 `permCodes`,middleware 解码 JWT)
- **验收**:普通用户直接粘 `/system/user` URL → 跳 `/403`。

### 2.6 API 守卫真正落地

- **改造文件**:
  - `lib/permission.ts`
    - `requirePermission(code: string | string[])` — 取 session → 取用户权限码 Set(缓存)→ 校验 → 不通过 throw `PermissionError`
    - 超管短路通过
  - 全量改造 `app/api/system/**` 的写接口加 `await requirePermission('system:xxx:create')`
- **验收**:用 Postman 用普通用户 JWT 调 `POST /api/system/users` 返回 `40301`。

### 2.7 禁用账户即时失权

- **改造文件**:
  - `lib/auth.ts` 的 `jwt` callback:每次请求重新读 `user.status`,DISABLED → 返回空 token / 抛错
  - 或:`middleware.ts` 中校验 `user.status`(配合 JWT 短 TTL=10min,搭配 refresh)
- **验收**:禁用某账号后,该账号下次操作跳 `/login`。

### 2.8 M2 验收清单

- [ ] 登录后 Sidebar 菜单 100% 来自数据库
- [ ] 普通用户进入未授权 URL → `/403`
- [ ] 无权限按钮在前端隐藏 + 后端返回 `40301`
- [ ] 禁用用户即时失权
- [ ] 权限变更后缓存正确失效

---

## 3. M3 — 操作日志 + 文件上传

> **目标**:所有写操作可审计;文件上传/下载/预览闭环。

### 3.1 操作日志统一写入

- **输出文件**:
  - `lib/operation-log.ts` — `logOperation({ actorId, action, target, payload, status, message, req })`
  - `lib/api.ts` 增强 — `withApi(handler, { action })`,handler 结束后自动写日志(成功/失败都写),actor 取自 session,IP/UA 从 `req.headers` 取
  - 改造所有 `POST/PATCH/DELETE` 路由:统一通过 `withApi` 包装,声明 `action: 'user.create'` 等
- **action 命名**:`<entity>.<verb>`,如 `user.create` / `role.assign-permission`
- **验收**:任意新增用户后,`OperationLog` 表新增一条 `action=user.create` 的记录。

### 3.2 操作日志查询页

- **输出文件**:
  - `app/api/system/logs/operation/route.ts` — `GET`(分页 + 按 actor / action / 时间区间 / status 过滤)
  - `app/api/system/logs/operation/export/route.ts` — `GET`(CSV stream)
  - `app/(dashboard)/system/log/operation/page.tsx`
  - `app/(dashboard)/system/log/operation/log-table.tsx`
  - `app/(dashboard)/system/log/operation/log-filter.tsx`
- **权限码**:`log:operation:view` / `log:operation:export`(加到 seed)
- **验收**:能筛选近 7 天某用户所有操作并导出 CSV。

### 3.3 文件存储适配层

- **输出文件**:
  - `lib/storage/types.ts` — `StorageAdapter` 接口(`save`/`load`/`delete`/`url`)
  - `lib/storage/local.ts` — 本地实现,路径 `UPLOAD_DIR/yyyy/mm/<cuid>.ext`
  - `lib/storage/index.ts` — 工厂(env `STORAGE_KIND=local | s3`,首版只接 local)
- **验收**:能 `await storage.save(file)` 写入本地。

### 3.4 文件上传接口

- **输出文件**:
  - `app/api/files/route.ts` — `POST`(multipart)、`GET`(分页查自己上传或全部,看权限)
  - `app/api/files/[id]/route.ts` — `GET`(下载/预览,带 Content-Disposition)、`DELETE`
  - `lib/upload.ts` — 限制:≤20MB,mime 白名单(`image/*`, `application/pdf`, `text/*`, office 类),拒绝可执行后缀
- **权限码**:`system:file:upload` / `system:file:view` / `system:file:delete`
- **验收**:超大文件返回 `40001`,白名单外类型返回 `40001`,正常文件成功并返回 `{ id, url }`。

### 3.5 `<FileUpload>` 组件

- **输出文件**:
  - `components/common/file-upload.tsx` — 拖拽 + 点击,展示上传中/失败/成功,受控 `value` 为 `fileId[]`
  - `components/common/file-preview.tsx` — 图片 / PDF / 其他三类渲染
- **验收**:任意表单嵌入即可使用,提交时把 `fileId[]` 传给后端。

### 3.6 文件管理页(可选)

- **输出文件**:
  - `app/(dashboard)/system/file/page.tsx` / `file-table.tsx`
- **验收**:列出当前用户可见文件,支持删除。

### 3.7 M3 验收清单

- [ ] 任意 CUD 操作可在日志中查到
- [ ] 上传一张图片可在新窗口预览/下载
- [ ] 超限文件被拒绝
- [ ] 删除文件后磁盘文件被同步移除

---

## 4. M4 — 打磨

> **目标**:把质量、文档、测试拉到可上线水位。

### 4.1 国际化抽离

- **输出文件**:
  - `messages/zh.ts` / `messages/en.ts`(英文为占位)
  - `lib/i18n.ts` — 极简 `t(key)` 实现,Provider 注入语言;后续可替换为 `next-intl`
  - 改造所有写死中文文案为 `t('...')`
- **验收**:切语言 key 全量替换,无遗留中文。

### 4.2 错误码与异常体系

- **改造文件**:
  - `lib/errors.ts` — 补齐 §附录 B 全量错误码
  - 自定义 Error 子类:`ParamError` / `AuthError` / `PermissionError` / `NotFoundError` / `ConflictError`
  - 全局错误处理在 `withApi` 内统一映射
- **验收**:任意接口异常都返回标准结构,日志含 stack。

### 4.3 限流(预留实现)

- **输出文件**:
  - `lib/rate-limit.ts` — 默认 in-memory(token bucket),挂接到登录、改密、上传接口
- **验收**:同 IP 5s 内调用登录 ≥ 10 次返回 `42901`。

### 4.4 E2E 测试(Playwright)

- **输出文件**:
  - `playwright.config.ts`
  - `e2e/auth.spec.ts` — 登录 / 错密码 / 禁用账号
  - `e2e/rbac.spec.ts` — 普通用户访问超管菜单跳 403
  - `e2e/user-crud.spec.ts` — 用户增删改查
  - `e2e/file-upload.spec.ts`
  - GitHub Actions workflow(可选):`.github/workflows/ci.yml`
- **验收**:本地 `pnpm test:e2e` 全绿。

### 4.5 单元测试关键函数

- **输出文件**:
  - `lib/__tests__/permission.test.ts` — 权限聚合、缓存失效
  - `lib/__tests__/menu.test.ts` — 菜单树剪枝
  - `vitest.config.ts`
- **验收**:`pnpm test` 全绿,关键函数覆盖率 ≥ 80%。

### 4.6 文档补全

- **输出文件**:
  - `README.md` — 安装、运行、目录索引、常见问题
  - `docs/architecture.md` — 架构图、数据流图
  - `docs/permission.md` — 权限码命名规约、新增权限步骤
  - `docs/deployment.md` — Docker 部署、环境变量、HTTPS 注意
- **验收**:新成员按 README 30 分钟内能本地跑起来。

### 4.7 工程化收尾

- **输出文件**:
  - `.husky/pre-commit` — 跑 `lint-staged`
  - `commitlint.config.cjs` — Conventional Commits
  - `Dockerfile`、`docker-compose.yml`(app + postgres)
- **验收**:`docker compose up` 即可起服务。

### 4.8 M4 验收清单

- [ ] i18n key 全覆盖
- [ ] 错误码与异常类型一一对应
- [ ] E2E + 单测全绿
- [ ] README 可让新人上手
- [ ] Docker 一键启动

---

## 5. 跨里程碑约定

### 5.1 命名约定

- 文件/目录:kebab-case(`user-table.tsx`)
- 组件:PascalCase(`<UserTable />`)
- Server Action / API:camelCase + 资源名复数(`listUsers` / `/api/system/users`)
- 权限码:`module:object:action` 全小写

### 5.2 提交规范

- Conventional Commits:`feat(user): add reset password`
- 一个 PR 对应一个里程碑下的一个步骤(粒度由 1.1 / 1.7 类编号决定)

### 5.3 分支策略

- `main` — 受保护
- `feat/m1-skeleton` / `feat/m2-rbac` / ... — 每个里程碑一条主分支
- 步骤级再拉子分支或直接 commit

### 5.4 后端守卫优先

- **任何**新增写接口先加 `requirePermission` 再写业务
- **任何**新增 UI 操作先在表里有权限码,再画按钮

### 5.5 缓存失效清单(M2 起持续维护)

| 触发动作          | 失效目标                      |
| ----------------- | ----------------------------- |
| 分配/撤销用户角色 | 该用户                        |
| 角色绑定/解绑权限 | 该角色所有用户                |
| 菜单 CRUD         | 全量(简单粗暴,菜单变更频次低) |
| 用户启停          | 该用户                        |
| 权限 CRUD         | 全量                          |

---

## 6. 后续(超出 v1)

- 多租户(组织/工作区)
- SSO(企业微信 / 飞书 / 钉钉)
- 数据权限(部门 / 本人 / 自定义范围)
- 审批流 / 工作流
- 日志定时清理(cron)
- 文件存储 S3/OSS 适配

---

> 文档维护:每个里程碑完成后,在对应小节末尾补"实际产出与偏差",形成回溯记录。

---

## 7. 实际产出记录（2026-05-26）

### M2 收尾

- `components/layout/sidebar.tsx`
  - 移除硬编码的「仪表盘 / 个人中心」拼接。
  - Sidebar 完全从 `menuStore` 的数据库菜单树渲染。
- `prisma/seed.ts`
  - 补齐 `/`、`/profile`、`/system/file`、`/system/log`、`/system/log/operation` 内置菜单。
  - 保留 M3 权限码：`system:file:*`、`log:operation:*`。
- `app/(dashboard)/system/*/page.tsx`
  - 用户、角色、权限、菜单静态页面增加页面级 `requirePermission('*:view')` 守卫。
- `app/api/system/users/[id]/route.ts`
  - 删除用户后主动 `invalidatePermissionCache(params.id)`。
- `app/api/system/menus/**/route.ts`
  - 新增菜单深度 ≤ 4 校验。
  - 继续校验 PAGE 必须绑定 MENU 权限码。
- `app/(dashboard)/system/menu/menu-tree.tsx`
  - 新增 / 编辑菜单时可录入 `component`，支持 `example/page` 验收链路。

### M3 执行

- 操作日志
  - 新增 `lib/operation-log.ts`。
  - 增强 `lib/api.ts`：`withApi(handler, { action })` 支持写操作成功 / 失败自动落库，JSON payload 自动脱敏。
  - 为用户、角色、权限、菜单、个人中心等 CUD 接口声明 action。
  - 新增 `app/api/system/logs/operation/route.ts`：分页与筛选。
  - 新增 `app/api/system/logs/operation/export/route.ts`：CSV 导出。
  - 新增 `app/(dashboard)/system/log/operation/*`：操作日志页面、筛选、表格。
- 文件上传
  - 新增本地存储适配层：`lib/storage/types.ts`、`lib/storage/local.ts`、`lib/storage/index.ts`。
  - 新增 `lib/upload.ts`：20MB 限制、mime 白名单、危险后缀拒绝。
  - 新增 `app/api/files/route.ts`：上传与文件列表。
  - 新增 `app/api/files/[id]/route.ts`：预览 / 下载 / 删除，删除同步移除磁盘文件。
  - 新增 `components/common/file-upload.tsx` 与 `components/common/file-preview.tsx`。
  - 新增 `app/(dashboard)/system/file/*`：文件管理页。
  - `.env.example` 增加 `STORAGE_KIND="local"`。
- 动态模块映射
  - `app/_modules/manifest.ts` 增加 `system/file/page` 与 `system/log/operation/page`。

### 验证

- `pnpm exec tsc --noEmit`：通过。
- `pnpm lint`：通过，无 ESLint warnings/errors。
- `pnpm build`：通过。

### 偏差 / 注意事项

- `middleware` 仍使用 JWT 内的 `menuPaths` 做轻量页面拦截；最终安全边界是页面级 `requirePermission` 与 API 守卫。
- 新增 seed 菜单需要重新执行 `pnpm db:seed` 后才会进入数据库。
- 文件存储首版仅实现 local，S3/OSS 仍为后续扩展点。

### M3 收尾（2026-05-26）

- `prisma/schema.prisma`
  - `OperationLog.actor` 与 `File.uploader` 增加 `onDelete: SetNull`，避免删除用户时被历史日志 / 文件外键阻塞。
- `prisma/migrations/20260526000000_init/migration.sql`
  - 新增初始 Prisma migration，覆盖 M1-M3 全量模型、枚举、索引和外键。
- `app/(dashboard)/system/log/operation/*`
  - 日志页面筛选补齐 `actorId`、`action`、`startAt`、`endAt`、`status`，与 API 能力对齐。
- `components/common/file-upload.tsx`
  - 文件上传组件补齐拖拽上传入口，保留点击选择文件能力。

### M4 执行（2026-05-26）

- 国际化基础
  - 新增 `messages/zh.ts`、`messages/en.ts` 与 `lib/i18n.ts`。
  - 公共标题、错误消息、上传、日志、资料页等关键文案接入 `t(key)`。
  - 英文文案为占位实现，后续可替换为 `next-intl`。
- 错误码与异常体系
  - `lib/errors.ts` 补齐 `RATE_LIMITED=42901`。
  - 保留并统一 `ParamError` / `AuthError` / `PermissionError` / `NotFoundError` / `ConflictError`。
  - 新增 `RateLimitError`，`withApi` 统一映射并输出 stack 诊断。
- 限流
  - 新增 `lib/rate-limit.ts`：in-memory token bucket。
  - 登录、改密、上传接口接入 5 秒 10 次限制，超限返回 `42901`。
- 测试
  - 新增 `vitest.config.ts`。
  - 新增 `lib/__tests__/permission.test.ts`、`menu.test.ts`、`rate-limit.test.ts`。
  - 新增 `playwright.config.ts` 与 `e2e/auth.spec.ts`、`rbac.spec.ts`、`user-crud.spec.ts`、`file-upload.spec.ts`。
  - `package.json` 增加 `test`、`test:watch`、`test:e2e`、`typecheck`。
- 文档
  - 新增 / 补齐 `README.md`。
  - 新增 `docs/architecture.md`、`docs/permission.md`、`docs/deployment.md`。
- 工程化
  - 新增 `.husky/pre-commit`、`commitlint.config.cjs`、`.github/workflows/ci.yml`。
  - 新增 `Dockerfile`、`docker-compose.yml`、`.dockerignore`。
  - 新增 devDependencies：`vitest`、`@playwright/test`、`@commitlint/cli`、`@commitlint/config-conventional`。

### M4 验证（2026-05-26）

- `pnpm exec tsc --noEmit`：通过。
- `pnpm lint`：通过，无 ESLint warnings/errors。
- `pnpm test`：通过，3 个测试文件 / 6 个用例全绿。
- `pnpm build`：通过。
- `docker compose config`：通过。

### M4 偏差 / 注意事项

- i18n 已提供基础 key 与关键链路接入，但系统管理表格中的大量临时 prompt 文案仍建议在正式 Modal 化时继续抽离。
- Playwright E2E 当前以基础可访问性 / 未登录保护链路为主；完整用户 CRUD 与文件上传需要依赖本地数据库与浏览器运行环境。
- 当前 Docker Compose 为开发 / 演示便利仍使用 `prisma db push`；生产部署建议切换为 `prisma migrate deploy`。
