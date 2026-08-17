# 通用后台管理系统 - 产品需求文档

> 版本：v1.2 · 日期：2026-07-24 · 状态：Implemented
> 技术栈：Next.js App Router、React、TypeScript、Prisma、PostgreSQL、Auth.js、Chakra UI、Tailwind CSS、Zustand

## 1. 产品概述

### 1.1 定位

VEB 是不绑定具体业务领域的后台管理脚手架，提供认证、基于角色的访问控制、动态导航、系统管理、操作日志、文件上传和博客管理。业务方可以在此基础上增加模块、页面和操作节点，而不需要重建账号与权限基础设施。

### 1.2 设计原则

1. **配置即资源**：模块负责分组，菜单节点同时承载导航和权限；页面组件由代码 manifest 映射。
2. **最小授权**：模块、页面和按钮必须显式授予角色，页面授权不会隐式授予按钮。
3. **同角色门禁**：模块与节点必须在同一角色内同时成立，禁止跨角色拼接权限。
4. **服务端安全边界**：前端隐藏只改善体验，页面守卫和 API 权限断言负责防越权。
5. **即时撤权**：用户、角色、模块或节点停用，以及角色授权替换，在事务提交后的下一次请求生效。
6. **稳定路由**：页面 URL 由 `PAGE.path` 独立决定，不从模块编码派生。

## 2. 技术与工程约束

| 分层       | 选型                                    | 约束                                             |
| ---------- | --------------------------------------- | ------------------------------------------------ |
| 前端       | Next.js App Router + React + TypeScript | Server Component 执行页面门禁                    |
| UI         | Chakra UI + Tailwind CSS                | Chakra 提供组件与 token，Tailwind 只用于布局微调 |
| 客户端状态 | Zustand                                 | 保存会话、导航、权限码和 UI 偏好                 |
| API        | Next.js Route Handler                   | canonical 路径使用 `/api/v1/**`                  |
| 数据       | Prisma + PostgreSQL                     | schema 和 migration 由 VEB API 独立拥有          |
| 认证       | Auth.js JWT session                     | token 保存用户标识，授权结果由服务端重新计算     |
| 包管理     | pnpm workspace                          | 应用不得跨目录导入其他应用源码                   |

## 3. 用户、角色与典型场景

### 3.1 内置角色

| 角色 code    | 名称       | 规则                                         |
| ------------ | ---------- | -------------------------------------------- |
| `superadmin` | 超级管理员 | 隐式拥有所有启用模块及有效节点；访问权限只读 |
| `admin`      | 管理员     | 初始拥有系统管理所需节点，可继续调整         |
| `user`       | 普通用户   | 初始仅登录和个人中心，可按业务分配角色       |

### 3.2 用户故事

1. 管理员创建模块，只填写编码、名称、描述、图标、排序和状态。
2. 管理员在“菜单与权限”中为模块创建目录、页面、外链，并在页面下创建按钮。
3. 管理员打开角色的“配置访问权限”抽屉，选择模块并勾选该模块的页面、外链和按钮，一次保存。
4. 管理员通过现有用户流程把角色分配给用户。
5. 用户登录后进入排序第一的可用模块 `landingPath`，切换模块时进入该模块的第一个授权页面。
6. 拥有 `system:user:delete` 的用户能看到删除按钮且能调用删除 API；只隐藏按钮而未通过 API 断言不视为完成鉴权。
7. 撤销页面或按钮、停用其祖先、停用角色或用户后，下一次请求立即拒绝。

## 4. 功能范围

| 功能       | 责任                               | 优先级 |
| ---------- | ---------------------------------- | ------ |
| 认证       | 登录、登出、Session 守卫           | P0     |
| 模块管理   | 模块元数据 CRUD、状态和统计        | P0     |
| 菜单与权限 | 目录、页面、外链、按钮的统一树管理 | P0     |
| 角色管理   | 角色 CRUD、统一访问授权、分配用户  | P0     |
| 用户管理   | 用户 CRUD、改密、启停、分配角色    | P0     |
| 导航与路由 | 用户级落点、动态侧栏、403/404 区分 | P0     |
| 个人中心   | 全局资料修改、改密                 | P0     |
| 仪表盘     | 用户、角色、权限节点和导航节点统计 | P1     |
| 操作日志   | 关键操作审计与导出                 | P1     |
| 文件上传   | 上传、下载、预览和删除             | P1     |

## 5. 权限模型

### 5.1 授权链

```text
创建 AppModule
  -> 在模块内配置 Menu(DIR / PAGE / LINK / BUTTON)
  -> 通过 RoleModule + RoleMenu 为 Role 配置访问权限
  -> 通过 UserRole 将 Role 分配给 User
  -> User 获得模块入口、页面、按钮和 API 权限
```

实体关系：

```text
User --< UserRole >-- Role --< RoleModule >-- AppModule
                         |
                         +--< RoleMenu >------ Menu
```

- `UserRole` 维持现有用户与角色多对多关系。
- `RoleModule` 表示角色被分配了某模块。
- `RoleMenu` 表示角色在该模块内被分配了某个页面、外链或按钮。
- `RoleMenu` 同时通过复合外键关联 `RoleModule` 和同模块 `Menu`，数据库阻止跨模块节点和未分配模块的授权。
- 目录不直接授权，其选中和半选状态由后代节点计算。

### 5.2 有效授权

普通用户的授权逐角色计算：

```text
角色有效模块 = 启用角色的 RoleModule 中仍启用的模块
角色有效节点 = 该角色 RoleMenu 中属于角色有效模块，且自身与祖先均启用的节点
用户授权 = 各启用角色有效结果的并集
```

只有同一个角色同时拥有模块和节点时，节点才有效。角色 A 的模块不能与角色 B 的节点组合出权限。

`permissionCodes` 是由有效 `PAGE/LINK/BUTTON.permissionCode` 生成的鉴权快照，不单独维护。现有 `<Auth>`、`useHasPermission`、`canAccess` 和 `requirePermission` 继续消费该快照。

### 5.3 状态规则

- 用户、角色或模块停用后，相关授权立即失效。
- 节点自身或任一祖先停用后，其页面、按钮和 API 权限立即失效。
- `visible=false` 只影响导航和落点，不撤销已授权页面的直接访问权限。
- 后续隐藏或停用导致模块没有可用页面时，该模块从用户导航隐藏，管理端标记“缺少可用入口”，不会回退到未授权页面。
- `superadmin` 隐式拥有全部启用模块和有效节点，不依赖显式关联记录；UI 只读且服务端拒绝修改。

## 6. 模块与菜单资源

### 6.1 AppModule

模块是一级权限及导航分组，不负责注册页面、路由前缀或布局。模块编码只作稳定业务标识。

| 字段                  | 类型               | 规则             |
| --------------------- | ------------------ | ---------------- |
| `id`                  | string             | 主键             |
| `code`                | string unique      | 创建后不可修改   |
| `name`                | string             | 模块切换器显示名 |
| `description`         | string?            | 描述             |
| `icon`                | string?            | 图标名           |
| `sort`                | int                | 模块稳定排序     |
| `status`              | `ENABLED/DISABLED` | 停用后立即撤权   |
| `isSystem`            | boolean            | 内置保护         |
| `createdAt/updatedAt` | datetime           | 审计时间         |

模块列表展示导航节点数、按钮数和角色数。没有页面的模块显示“待配置”，已被角色引用但没有可用落点时显示“缺少可用入口”。

### 6.2 Menu 类型

| 类型     | 允许父级        | 路由及组件                 | 权限码         | 导航行为                     |
| -------- | --------------- | -------------------------- | -------------- | ---------------------------- |
| `DIR`    | 根或 `DIR`      | 全部为空                   | 无             | 只作结构分组                 |
| `PAGE`   | 根或 `DIR`      | `path`、`component` 必填   | 必填且全局唯一 | 可导航，可作为模块落点       |
| `LINK`   | 根或 `DIR`      | HTTP(S) `externalUrl` 必填 | 必填且全局唯一 | 可导航，不作为模块落点       |
| `BUTTON` | 必须直属 `PAGE` | 路由、组件、图标、外链为空 | 必填且全局唯一 | 不进入导航，只控制操作和 API |

Menu 通用字段：

| 字段                   | 说明                         |
| ---------------------- | ---------------------------- |
| `moduleId`             | 必填所属模块，创建后不可修改 |
| `parentId`             | 同模块父节点；根节点为 null  |
| `name` / `description` | 名称与说明                   |
| `sort`                 | 同级稳定排序                 |
| `status`               | 自身及后代有效性             |
| `visible`              | 导航可见性；按钮固定为 false |
| `isSystem`             | 内置节点保护                 |

### 6.3 路径与树约束

- `PAGE.path` 是全局唯一的规范绝对路径。
- 路径禁止查询串、片段、反斜杠、百分号编码、重复斜杠、尾斜杠和系统保留路径。
- 导航最多四级，按钮不计入导航深度。
- 节点 `type` 和 `moduleId` 创建后不可修改。
- 父级移动必须留在同一模块，并满足类型规则；服务层检测循环。
- `Menu(parentId, moduleId)` 到 `Menu(id, moduleId)` 使用复合自关联，数据库拒绝跨模块父子和孤儿。
- 有子节点的菜单禁止删除；删除叶子时级联撤销对应 `RoleMenu`；内置节点受保护。
- 页面 React 组件由 `PAGE.component` 与 Web 页面 manifest 映射。

### 6.4 权限码

- 格式：`域:对象:操作`，使用小写字母、数字、连字符和英文冒号。
- 示例：`system:user:view`、`system:user:create`、`system:role:assign-access`。
- 推荐动作：`view`、`create`、`update`、`delete`、`export`、`import`、`assign-*`。
- 页面读取、按钮展示和 API 操作使用同一节点权限码。

## 7. 角色访问权限

### 7.1 管理端交互

角色列表把原有多个授权入口合并为“配置访问权限”：

- 抽屉左侧是模块复选列表，右侧是当前模块的菜单与按钮树。
- 切换模块保留未保存草稿。
- 目录显示由后代节点派生的选中或半选状态。
- 勾选按钮时自动补齐其直属父页面。
- 取消页面时清除页面下全部按钮。
- 勾选页面不自动授予按钮。
- “全选本组菜单”只选择页面和外链，按钮必须单独选择。
- 取消已有授权模块前二次确认，并清空该模块草稿。
- 保存前逐模块提示缺少入口页面。

### 7.2 原子接口

```http
PUT /api/v1/system/roles/:id/access
Content-Type: application/json
```

```json
{
  "modules": [
    {
      "moduleId": "module-admin",
      "menuIds": ["menu-system-user", "button-system-user-create"]
    }
  ]
}
```

`menuIds` 只接受 `PAGE/LINK/BUTTON`。服务端去重后校验：

1. 角色、模块和节点 ID 全部存在。
2. 节点属于声明的模块，不接受目录 ID。
3. 节点具有权限码。
4. 每个按钮的直属父页面也在同一模块请求中。
5. 每个模块至少有一个已授权、启用、可见且祖先有效的页面。
6. 目标角色不是 `superadmin`。

任一校验错误时请求整体失败。校验通过后，在 Serializable 事务中全量替换该角色的 `RoleModule` 和 `RoleMenu`；并发序列化冲突进行有限重试。取消模块会在同一事务撤销该模块全部节点。

接口权限码为 `system:role:assign-access`。审计事件为 `role.assign-access`，payload 保存变更前后的模块和节点 ID。

### 7.3 分配用户

角色分配用户以及用户新增、编辑、分配角色流程保持不变。保存角色访问权限后刷新受影响用户的导航；服务端下一次请求始终重新计算授权。

## 8. 导航与页面路由

### 8.1 UserNavigation

`GET /api/v1/navigation` 返回：

```ts
{
  modules: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    sort: number;
    landingPath: string;
    menus: MenuNode[]; // DIR | PAGE | LINK
  }>;
  permissionCodes: string[];
  roleCodes: string[];
  menus: MenuNode[]; // 兼容字段
}
```

- `BUTTON` 永远不进入导航树。
- 模块按 `sort -> name -> id` 排序。
- 菜单树每级按 `sort -> name -> id` 排序并剪除空目录。
- 对排序后的树做深度优先遍历，第一个启用、可见、已授权 `PAGE.path` 是用户级 `landingPath`。
- `LINK` 不作为落点。
- 没有落点的模块不返回。

### 8.2 工作区行为

- `/` 跳转到排序第一的可用模块 `landingPath`；没有模块时显示空状态，并保留个人中心和退出。
- 模块切换器和首页操作统一使用 `landingPath`。
- 所有模块共用当前工作区 Header 和内容布局；只有一个可导航入口的模块隐藏侧栏及其切换按钮。
- 内置仪表盘模块使用 `/dashboard`，后台管理模块移除仪表盘菜单并按首个可访问页面进入；旧 `/admin` 兼容跳转到后台管理首个页面。
- `/profile` 是登录后全局页面，不属于模块或菜单；`/admin/profile` 永久重定向。
- 外链只有在模块和节点授权有效时才展示并安全打开。

### 8.3 403 与 404

工作区页面统一调用 `GET /api/v1/navigation/page?path=...`：先精确匹配已知 `PAGE.path`，详情子路径再按最长有效页面前缀匹配，随后校验用户授权。单段模块落点只精确匹配，不能兜底未知子路径：

- 没有匹配页面：404。
- 页面存在但用户未通过同角色模块与节点门禁：403。
- 页面已授权但 `component` 未在 Web manifest 注册：404。

## 9. 管理端功能与 API

### 9.1 模块管理

- 页面：`/admin/system/module`。
- API：`GET/POST /api/v1/system/modules`、`GET/PATCH/DELETE /api/v1/system/modules/:id`。
- 表单字段：编码、名称、描述、图标、排序、状态。
- 列表字段：基础元数据、导航节点数、按钮数、角色数和入口状态。
- 权限码：`system:module:view/create/update/delete`。
- 审计：`module.create/update/delete`。

### 9.2 菜单与权限

- 页面：`/admin/system/menu`，标题为“菜单与权限”。
- API：`GET/POST /api/v1/system/menus`、`GET /api/v1/system/menus/tree`、`PATCH/DELETE /api/v1/system/menus/:id`。
- 按模块展示完整树，页面行提供“新增按钮”并锁定父页面。
- 新建抽屉根据节点类型动态展示字段；按钮不展示路径、组件、图标、外链或导航可见性。
- 按钮行展示名称、权限码、描述、状态和排序。
- 权限码：`system:menu:view/create/update/delete`。
- 审计：`menu.create/update/delete`。

### 9.3 角色管理

- 页面：`/admin/system/role`。
- CRUD：`GET/POST /api/v1/system/roles`、`GET/PATCH/DELETE /api/v1/system/roles/:id`。
- 访问授权：`PUT /api/v1/system/roles/:id/access`。
- 分配用户：`POST /api/v1/system/roles/:id/users`。
- 权限码：`system:role:view/create/update/delete/assign-access/assign-user`。

### 9.4 用户管理

- 页面：`/admin/system/user`。
- API：`GET/POST /api/v1/system/users`、`GET/PATCH/DELETE /api/v1/system/users/:id`、重置密码、分配角色。
- 权限码：`system:user:view/create/update/delete/reset-password/assign-role`。
- 用户停用后当前会话的下一次请求失效。

### 9.5 兼容行为

旧权限资源 CRUD、旧角色模块分配和旧角色权限分配接口保留一个发布周期，但不再写入数据，统一返回 HTTP `410 Gone` 和迁移提示。版本化与非版本化旧路径行为一致。

旧 `/admin/system/permission` 永久重定向到 `/admin/system/menu`。统一访问授权和菜单管理是唯一可写入口。

### 9.6 其他页面

- 个人中心：`/profile`，所有已登录用户可用。
- 操作日志：`/admin/system/log/operation`，使用 `log:operation:view/export`。
- 文件管理：`/admin/system/file`，使用 `system:file:view/upload/delete`。
- 仪表盘：内置 `PAGE`，展示用户数、角色数、带权限码节点数和 `DIR/PAGE/LINK` 节点数。

## 10. 关键 Prisma 模型

> 省略与本需求无关的字段和模型。

```prisma
model Role {
  id          String       @id @default(cuid())
  code        String       @unique
  name        String
  description String?
  status      CommonStatus @default(ENABLED)
  sort        Int          @default(0)
  isSystem    Boolean      @default(false)
  users       UserRole[]
  modules     RoleModule[]
  menus       RoleMenu[]
}

model AppModule {
  id          String       @id @default(cuid())
  code        String       @unique
  name        String
  description String?
  icon        String?
  sort        Int          @default(0)
  status      CommonStatus @default(ENABLED)
  isSystem    Boolean      @default(false)
  roles       RoleModule[]
  menus       Menu[]
}

model Menu {
  id             String       @id @default(cuid())
  parentId       String?
  moduleId       String
  module         AppModule    @relation(fields: [moduleId], references: [id], onDelete: Restrict)
  parent         Menu?        @relation("MenuTree", fields: [parentId, moduleId], references: [id, moduleId], onDelete: Restrict)
  children       Menu[]       @relation("MenuTree")
  name           String
  description    String?
  path           String?      @unique
  component      String?
  icon           String?
  sort           Int          @default(0)
  type           MenuType     @default(PAGE)
  permissionCode String?      @unique
  visible        Boolean      @default(true)
  status         CommonStatus @default(ENABLED)
  externalUrl    String?
  isSystem       Boolean      @default(false)
  roles          RoleMenu[]

  @@unique([id, moduleId])
  @@index([moduleId, parentId])
}

model RoleModule {
  roleId   String
  moduleId String
  role     Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  module   AppModule  @relation(fields: [moduleId], references: [id], onDelete: Restrict)
  menus    RoleMenu[]

  @@id([roleId, moduleId])
  @@index([moduleId])
}

model RoleMenu {
  roleId   String
  moduleId String
  menuId   String
  role     Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  module   RoleModule @relation(fields: [roleId, moduleId], references: [roleId, moduleId], onDelete: Cascade)
  menu     Menu       @relation(fields: [menuId, moduleId], references: [id, moduleId], onDelete: Cascade)

  @@id([roleId, menuId])
  @@index([roleId, moduleId])
  @@index([menuId, moduleId])
}

enum MenuType {
  DIR
  PAGE
  LINK
  BUTTON
}
```

## 11. 前端架构

```text
app/(workspace)/
  layout.tsx                   读取用户导航，渲染共享工作区
  page.tsx                     跳转首个模块 landingPath
  [...slug]/page.tsx           全局 PAGE 路由解析和权限门禁
  profile/page.tsx             全局个人中心
  admin/system/module          模块管理
  admin/system/menu            菜单与权限
  admin/system/role            角色与访问授权
  admin/system/user            用户管理

app/_modules/
  page-manifest.ts             PAGE.component -> React loader

components/
  auth/Auth.tsx                按钮可见性
  layout/Header.tsx            模块切换器
  layout/Sidebar.tsx           当前模块菜单树

stores/
  auth-store.ts                会话摘要
  menu-store.ts                modules、landingPath、menus、permissionCodes
  ui-store.ts                  侧栏与移动端 UI 偏好
```

模块切换、首页跳转和侧栏读取同一 `UserNavigation`，避免本地另算落点。授权保存后重新拉取导航。

## 12. 数据迁移与发布

### 12.1 迁移策略

`20260723120000_app_modules` 尚未进入共享环境，直接重写为最终模型，避免发布过渡数据结构。

迁移在写入前检查：

- 菜单孤儿、循环、非法导航深度。
- 重复页面路径、重复权限码、页面缺少组件或权限码。
- 按钮父级映射和新旧 ID 冲突。
- 角色按钮授权缺少父页面授权。
- 角色模块缺少启用、可见的页面入口。

### 12.2 历史数据转换

- 历史 `MENU` 类型资源迁移到对应 `PAGE/LINK Menu`，目录授权不持久化。
- 历史 `BUTTON` 类型资源转换为直属页面的 `BUTTON Menu`。
- 历史 `RolePermission` 转为 `RoleMenu`；按钮仅在同一角色同时拥有父页面时迁移。
- 内置按钮使用显式页面映射，禁止根据权限码前缀猜测。
- 自定义按钮优先根据历史父级关系唯一解析到页面；无法唯一映射时 SQL `RAISE EXCEPTION` 输出清单并整批回滚。
- 原权限管理菜单删除，菜单管理改名为“菜单与权限”。
- `system:menu:*` 仅迁移给历史上同时拥有菜单管理和权限管理对应能力的角色。
- `system:role:assign-permission` 重命名为 `system:role:assign-access`。

### 12.3 发布

生产 migration、VEB API 和 Web 在同一维护窗口发布。执行前备份数据库；失败依赖事务回滚；成功后运行授权等价性检查。生产需要的内置节点必须写入 migration，不能只依赖 seed。

## 13. 测试与验收

### 13.1 自动化覆盖

- 契约：四种节点字段组合、路径、权限码和角色访问请求。
- 数据库与服务：同模块父子、循环、深度、删除限制、按钮直属页面、复合外键和状态失效。
- 角色授权：原子替换、全量撤销、跨模块拒绝、按钮父页面、空入口拒绝、事务回滚、并发重试、超级管理员只读。
- 安全回归：同角色门禁、禁止跨角色拼接、停用即时撤权、按钮 UI 与 API 一致。
- 导航：稳定排序、首页面落点、隐藏与停用、外链和按钮排除、无入口模块、403/404。
- 迁移：空库、历史 seed、显式映射、自定义映射、未映射阻断、异常回滚和授权等价性。
- E2E：创建模块 -> 创建页面和按钮 -> 配置角色访问 -> 分配用户 -> 登录切换模块 -> 页面、按钮和 API 放行 -> 撤权失效。

### 13.2 验收命令

```bash
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

## 14. 非功能要求

### 安全

- 密码使用 bcrypt，敏感字段永不返回前端。
- 所有受控写接口必须调用 `requirePermission`。
- 页面路由和 API 都从服务端重新计算授权，不信任前端导航数据。
- 审计覆盖 `menu.*`、`module.*` 和 `role.assign-access`。

### 一致性

授权快照当前不做跨请求缓存，每次从 PostgreSQL 主库计算。后续如恢复缓存，必须引入数据库授权版本，并与用户角色、角色模块、角色节点、模块和菜单变更在同一事务递增。

### 可维护性

- TypeScript strict。
- API 响应壳统一为 `{ code, data, message }`。
- Prisma 查询显式选择字段，列表统一分页。
- 生产只运行 `prisma migrate deploy`，不自动执行 seed。

## 附录 A：内置节点示例

| 父级       | 名称         | 类型   | 路径或权限码                                 |
| ---------- | ------------ | ------ | -------------------------------------------- |
| 仪表盘模块 | 仪表盘       | PAGE   | `/dashboard`、`dashboard:view`               |
| 系统管理   | 模块管理     | PAGE   | `/admin/system/module`、`system:module:view` |
| 模块管理   | 新增模块     | BUTTON | `system:module:create`                       |
| 系统管理   | 用户管理     | PAGE   | `/admin/system/user`、`system:user:view`     |
| 用户管理   | 删除用户     | BUTTON | `system:user:delete`                         |
| 系统管理   | 角色管理     | PAGE   | `/admin/system/role`、`system:role:view`     |
| 角色管理   | 配置访问权限 | BUTTON | `system:role:assign-access`                  |
| 系统管理   | 菜单与权限   | PAGE   | `/admin/system/menu`、`system:menu:view`     |
| 菜单与权限 | 新增节点     | BUTTON | `system:menu:create`                         |

内置按钮和页面的父子映射必须显式写入 migration 和 seed。

## 附录 B：统一 API 响应

```json
{ "code": 0, "data": {}, "message": "ok" }
```

常用错误分段：

- `400xx`：参数或业务校验。
- `401xx`：未认证。
- `403xx`：资源存在但未授权。
- `404xx`：资源或页面不存在。
- HTTP `410 Gone`：已退役兼容接口。
- `409xx`：冲突。
- `500xx`：服务端错误。
