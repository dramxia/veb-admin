# 权限体系说明

VEB 使用以应用模块分组、以菜单节点承载权限码的 RBAC。当前没有独立的 `Permission`
模型或权限表，权限资源统一由 `PAGE`、`LINK`、`BUTTON` 三类 `Menu` 表达。

```text
创建 AppModule
  -> 在模块内创建 DIR / PAGE / LINK / BUTTON
  -> 通过 RoleModule + RoleMenu 配置角色访问范围
  -> 通过 UserRole 把角色分配给用户
  -> 生成用户的模块、页面、按钮和 API 权限快照
```

前端菜单和按钮隐藏只改善使用体验。Web 服务端页面守卫、VEB API 权限断言，以及 Blog
内部接口的服务令牌校验才是访问边界。

## 1. 数据模型

```text
User --< UserRole >-- Role --< RoleModule >-- AppModule
                         |
                         +--< RoleMenu >------ Menu
                                  |             |
                                  +-------------+
                                   moduleId 一致
```

- `AppModule` 是权限和导航的一级分组，只保存稳定编码与展示元数据，不注册 URL 前缀、
  入口组件或专属布局。
- `RoleModule(roleId, moduleId)` 表示角色拥有一个模块。
- `Menu` 是模块内的导航或操作节点，类型为 `DIR | PAGE | LINK | BUTTON`。
- `RoleMenu(roleId, moduleId, menuId)` 保存角色的 `PAGE`、`LINK`、`BUTTON` 授权；`DIR`
  不直接授权，其勾选状态和导航展示由后代节点派生。
- `UserRole(userId, roleId)` 建立用户与角色的多对多关系。
- `RoleMenu(roleId, moduleId)` 复合外键指向 `RoleModule`，
  `RoleMenu(menuId, moduleId)` 复合外键指向 `Menu`。数据库会拒绝未分配模块或跨模块的
  节点授权。

### 1.1 AppModule

| 字段                   | 当前规则                         |
| ---------------------- | -------------------------------- |
| `code`                 | 全局唯一，创建后不可修改         |
| `name` / `description` | 展示名称和说明                   |
| `icon` / `sort`        | 模块切换器图标和稳定排序         |
| `status`               | 停用后不再产生有效模块或节点权限 |
| `isSystem`             | 内置模块保护标记                 |

模块管理列表分别统计导航节点数（`DIR/PAGE/LINK`）、按钮数和已关联角色数；导航节点数为
零时显示“待配置菜单”。角色访问权限抽屉会对已选择但没有可用页面入口的模块显示“缺少可用
入口”。内置模块只允许修改名称、图标和排序，不能停用或删除。

### 1.2 Menu 类型

| 类型     | 允许父级        | 必填字段                                | 固定约束                                  | 作用                             |
| -------- | --------------- | --------------------------------------- | ----------------------------------------- | -------------------------------- |
| `DIR`    | 根节点或 `DIR`  | 名称                                    | 无路径、组件、外链和权限码                | 组织导航，不直接授权             |
| `PAGE`   | 根节点或 `DIR`  | `path`、`component`、`permissionCode`   | 无外链                                    | 内部页面，可导航、可作为模块入口 |
| `LINK`   | 根节点或 `DIR`  | HTTP(S) `externalUrl`、`permissionCode` | 无路径和组件                              | 外部导航，不作为模块入口         |
| `BUTTON` | 必须直属 `PAGE` | `parentId`、`permissionCode`            | 无路径、组件、图标和外链，`visible=false` | UI 操作和 API 权限，不进入导航   |

通用字段包括 `moduleId`、`name`、`description`、`sort`、`status` 和 `isSystem`；
`DIR/PAGE/LINK` 还可以配置图标和导航可见性。

### 1.3 Menu 约束

- `moduleId` 和 `type` 创建后不可修改。
- 父级必须属于同一模块；`DIR/PAGE/LINK` 只能放在根节点或 `DIR` 下，`BUTTON` 必须直属
  `PAGE`。服务层同时拒绝父级循环。
- 导航深度最多四级，`BUTTON` 不计入导航深度。
- `PAGE.path` 是全局唯一的规范绝对路径。查询串、片段、反斜杠、百分号编码、重复斜杠、
  尾斜杠，以及 `/`、`/login`、`/profile`、`/api/**`、`/articles/**`、`/_next/**` 等
  系统路径不可使用。
- `PAGE/LINK/BUTTON.permissionCode` 必填且全局唯一。格式是两个或更多以冒号分隔的小写
  段：首段只允许数字和小写字母，后续段还允许连字符，例如 `dashboard:view`、
  `system:user:view`、`system:role:assign-access`。
- 有子节点的菜单不能删除。删除自定义叶子节点时，数据库级联删除对应 `RoleMenu`；内置
  菜单不可删除，且只允许修改名称和图标。
- `PAGE.component` 是 Web 页面 manifest 的键。VEB API 保存菜单时只校验非空，不校验该
  键是否已注册；授权页面的键未注册时，Web 在渲染阶段返回 404。

## 2. 有效授权

普通用户按角色独立计算权限，再对各启用角色的结果取并集：

```text
角色有效模块 = 该角色 RoleModule 中仍为 ENABLED 的 AppModule
角色有效节点 = 该角色 RoleMenu 中属于角色有效模块，且自身与祖先均为 ENABLED 的节点
用户有效模块、角色码、权限码 = 各启用角色有效结果的并集
```

只有同一个角色同时拥有模块和对应节点时，节点权限才生效。角色 A 的 `RoleModule` 不能与
角色 B 的 `RoleMenu` 拼接成权限；复合外键和逐角色快照计算共同保证这条规则。

`permissionCodes` 从有效的 `PAGE/LINK/BUTTON.permissionCode` 生成，不是独立数据源。
用户、角色、模块、节点或节点任一祖先停用后，相关授权在下一次服务端权限计算时失效。

### 2.1 可见性

`visible` 不参与权限码计算，只参与导航和模块入口计算：

- 已授权的 `PAGE` 设为 `visible=false` 后会从导航消失，但仍可直接访问，其权限码和有效
  `BUTTON` 权限仍然生效。
- 节点任一祖先不可见时，该节点也不进入导航。
- 模块没有启用、可见、已授权且祖先有效的 `PAGE` 时，不进入用户导航，也不会回退到未
  授权页面。

### 2.2 superadmin

启用的 `role.code = 'superadmin'` 会隐式获得全部启用模块，以及这些模块中自身和祖先均
启用、带权限码的全部 `PAGE/LINK/BUTTON`，不依赖显式 `RoleModule` 或 `RoleMenu`。
可见性仍只影响导航。角色访问详情返回这份计算结果用于展示，管理端为只读，服务端也拒绝
修改其访问范围。

### 2.3 一致性

权限快照当前不做跨请求缓存。导航、页面门禁、Auth.js JWT 刷新和 API 权限检查都会重新从
VEB PostgreSQL 计算有效授权；授权事务提交后，后续服务端请求会读取新结果。

## 3. 角色访问权限接口

读取和全量替换角色访问范围使用同一路径：

```http
GET /api/v1/system/roles/:id/access
PUT /api/v1/system/roles/:id/access
Content-Type: application/json
```

`PUT` 请求示例：

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

请求中的重复模块和节点 ID 会先去重。服务端随后校验：

- 角色、模块和节点存在，且节点属于声明的模块。
- `menuIds` 只包含带权限码的 `PAGE`、`LINK` 和 `BUTTON`，不包含 `DIR`。
- 每个 `BUTTON` 的直属父 `PAGE` 也在同一模块的 `menuIds` 中。
- 每个已分配模块为启用状态，并至少包含一个已授权、自身及祖先启用且可见的 `PAGE`。
- `superadmin` 的访问范围不能显式修改。

空的 `modules` 会撤销该角色的全部模块和节点授权。校验成功后，服务端在 Serializable 事务
中先删除旧 `RoleMenu`、`RoleModule`，再写入完整新集合；序列化冲突最多尝试三次。接口由
`system:role:assign-access` 保护，并写入 `role.assign-access` 操作日志及变更前后的模块和
节点 ID。

### 3.1 管理端勾选规则

- 勾选 `BUTTON` 时自动补齐直属父 `PAGE`。
- 勾选 `PAGE` 时自动选中该页面下当前有效的 `BUTTON`；取消 `PAGE` 时清除其全部按钮。
- 勾选 `DIR` 只批量选择其有效后代 `PAGE` 和 `LINK`，不会批量选择 `BUTTON`；取消目录
  会清除后代页面、外链及这些页面下的按钮。
- 取消已经持久化的模块前需要确认，并清空该模块的节点草稿。
- 切换模块会保留当前抽屉中的未保存草稿；保存前前端检查入口页面，服务端仍执行最终校验。

## 4. 导航与页面路由

`GET /api/v1/navigation` 返回当前用户的导航和鉴权快照：

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
    menus: MenuNode[]; // DIR | PAGE | LINK，不含 BUTTON
  }>;
  permissionCodes: string[];
  roleCodes: string[];
}
```

- 模块和每级菜单均按 `sort -> name -> id` 排序。
- 导航只保留自身及祖先启用、可见的授权节点，始终排除 `BUTTON`，并剪除没有后代的
  `DIR`。
- 模块树深度优先遇到的第一个有效 `PAGE.path` 是 `landingPath`；`LINK` 不参与落点计算，
  固定入口 `/admin` 也不会被选为模块落点。
- 没有 `landingPath` 的模块不进入导航。`/` 跳转到排序第一的模块落点，模块切换器跳转到
  目标模块落点；`/admin` 跳转到 `code=admin` 模块的落点，无落点时返回 403。
- `/profile` 是登录后的全局页面，不属于模块或菜单。

页面守卫通过 `GET /api/v1/navigation/page?path=...` 解析请求：

1. 先精确匹配 `PAGE.path`。
2. 没有精确匹配时，只允许两段及以上的页面路径匹配详情子路径，并选择最长前缀；
   `/dashboard` 这类单段路径只允许精确匹配。
3. 页面不存在返回 404；页面存在但当前用户没有同角色模块和页面权限时返回 403。
4. VEB API 返回已授权页面的 `component`，Web 找不到对应 manifest loader 时返回 404。

`/admin` 是固定重定向入口，不应作为模块唯一的 `PAGE`。当前角色访问接口的入口校验只检查
页面是否启用、可见且已授权，并未单独排除 `/admin`；配置时必须至少提供另一个实际页面
路径，否则该模块不会进入导航。

## 5. 权限执行边界

### 5.1 前端控件

`<Auth>`、`<AuthButton>` 和 `useHasPermission` 使用导航响应中的有效权限码控制展示。字符串
数组采用“任一满足”语义：

```tsx
<Auth code="system:user:create">
  <Button>新增用户</Button>
</Auth>
```

这些控件不是安全边界，不能替代服务端校验。

### 5.2 Web 页面

Web middleware 会提前请求页面解析接口并把未登录、无权限和不存在分别处理为登录跳转、403
和 404；服务端 layout/template 会再次获取页面授权与 manifest loader。早期探测失败时仍以
服务端渲染结果为准，直接粘贴 URL 不能绕过权限。

### 5.3 VEB API

受控接口必须使用服务端权限断言：

```ts
await requirePermission('system:user:create');
await requirePermission(['system:user:update', 'system:user:delete']);
```

数组同样是 OR 语义。`requirePermission` 先要求有效 session，再根据用户 ID 重新计算权限
快照；按钮和对应写接口应使用同一权限码。

### 5.4 Blog 管理接口

浏览器只调用 VEB API 的 `/api/v1/blog/**`。VEB BFF 根据 method 和 path 映射 `content:*`
权限并执行 `assertPermission`，再签发绑定 permission、method、内部 path、body hash、
request ID 和用户身份的短期 RS256 服务令牌。Blog API 的 `/api/internal/v1/**` 会再次验证
令牌及目标接口要求的权限，不读取浏览器 session，也不访问 VEB PostgreSQL。

## 6. 管理入口

- `/admin/system/module`：维护模块元数据。模块本身不配置 URL 或组件。
- `/admin/system/menu`：按模块维护完整菜单树和权限码。页面组件标识是自由文本，保存前后
  都应与 `apps/web/app/_modules/admin-page-manifest.ts` 同步。
- `/admin/system/role`：通过“配置访问权限”全量维护角色的模块和节点，通过“分配用户”
  全量维护该角色的用户。
- 用户管理中的“分配角色”全量维护指定用户的 `UserRole`。

修改授权模型时，应同步检查 Prisma Schema、`@veb/api-contracts`、VEB API 服务与路由、Web
页面守卫和权限控件、seed 以及相关单元测试和 E2E 测试。
