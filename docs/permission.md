# 权限体系说明

VEB 使用以模块为分组、以菜单节点为权限资源的分层 RBAC。完整授权链固定为：

```text
创建 AppModule
  -> 在模块内创建 DIR / PAGE / LINK / BUTTON
  -> 通过 RoleModule + RoleMenu 为角色配置访问权限
  -> 通过 UserRole 将角色分配给用户
  -> 用户获得模块入口、页面、按钮和 API 权限
```

模块只保存稳定标识和展示元数据，不注册模块级入口组件、路径前缀或专属布局。菜单节点同时承担导航和权限资源职责，是唯一的权限资源。前端隐藏只用于改善体验；页面服务端守卫和 API 权限断言才是安全边界。

## 1. 数据模型

```text
User --< UserRole >-- Role --< RoleModule >-- AppModule
                         |
                         +--< RoleMenu >------ Menu
                                  |             |
                                  +-------------+
                                   moduleId 一致
```

- `AppModule` 保存唯一 `code`、名称、描述、图标、排序、状态和系统标记。
- `RoleModule(roleId, moduleId)` 表示角色被分配了模块。
- `Menu` 是模块内唯一的导航及权限资源，类型为 `DIR | PAGE | LINK | BUTTON`。
- `RoleMenu(roleId, moduleId, menuId)` 只保存 `PAGE`、`LINK` 和 `BUTTON` 授权；目录选中状态由后代授权计算。
- `RoleMenu(roleId, moduleId)` 复合外键关联 `RoleModule`，`RoleMenu(menuId, moduleId)` 复合外键关联 `Menu`，数据库因此拒绝未分配模块和跨模块节点授权。
- 用户与角色的现有 `UserRole` 多对多关系保持不变。

### 1.1 AppModule

模块是权限和导航的一级分组，不决定 URL，也不加载模块级入口页面。

| 字段                   | 规则                                         |
| ---------------------- | -------------------------------------------- |
| `code`                 | 创建时指定的全局唯一稳定标识，创建后不可修改 |
| `name` / `description` | 展示名称和说明                               |
| `icon` / `sort`        | 模块切换器的图标和稳定排序                   |
| `status`               | 停用后模块、节点和权限立即失效               |
| `isSystem`             | 内置模块保护标记                             |

模块列表分别统计导航节点数（`DIR/PAGE/LINK`）、按钮数（`BUTTON`）和角色数。没有可配置入口页面的模块显示“待配置”；已授权但后来失去可用入口的模块显示“缺少可用入口”。

### 1.2 Menu 类型

| 类型     | 允许父级        | 必填字段                                | 必须为空或固定的字段                                      | 行为                              |
| -------- | --------------- | --------------------------------------- | --------------------------------------------------------- | --------------------------------- |
| `DIR`    | 根节点或 `DIR`  | 名称                                    | `path`、`component`、`externalUrl`、`permissionCode` 为空 | 仅组织导航，不直接授权            |
| `PAGE`   | 根节点或 `DIR`  | `path`、`component`、`permissionCode`   | `externalUrl` 为空                                        | 内部页面，可导航且可作为模块落点  |
| `LINK`   | 根节点或 `DIR`  | HTTP(S) `externalUrl`、`permissionCode` | `path`、`component` 为空                                  | 外链导航，不作为模块落点          |
| `BUTTON` | 必须直属 `PAGE` | `parentId`、`permissionCode`            | 路由、组件、图标、外链为空，`visible=false`               | 按钮、操作及 API 权限，不进入导航 |

通用字段还包括 `moduleId`、`name`、`description`、`sort`、`status` 和 `isSystem`。导航类型可以配置图标和可见性。

### 1.3 菜单约束

- `moduleId` 和 `type` 创建后不可修改。
- 父级只能在同一模块内按类型规则移动；服务层检测循环。
- `Menu(parentId, moduleId)` 到 `Menu(id, moduleId)` 使用复合自关联，数据库拒绝跨模块父子和孤儿。
- 导航最多四级，`BUTTON` 不计入导航深度。
- `PAGE.path` 是规范绝对路径且全局唯一。禁止查询串、片段、反斜杠、百分号编码、重复斜杠、尾斜杠和系统保留路径。
- `PAGE/LINK/BUTTON.permissionCode` 必填且全局唯一；`DIR` 不设置权限码。
- 权限码沿用 `域:对象:操作` 格式，例如 `system:user:view`、`system:user:delete` 和 `system:role:assign-access`。
- 有子节点的菜单不能删除。删除叶子节点时，外键级联删除对应 `RoleMenu`；内置节点继续受保护。

页面组件仍由 `PAGE.component` 与 Web 页面 manifest 映射；模块本身不参与组件加载。

## 2. 有效授权计算

普通用户的授权必须按角色独立计算，再对各角色结果取并集：

```text
角色有效模块 = 该启用角色的 RoleModule 中仍处于 ENABLED 的模块
角色有效节点 = 该角色 RoleMenu 中属于角色有效模块、且自身及祖先均 ENABLED 的节点
用户有效模块/节点/权限码 = 各启用角色有效结果的并集
```

只有同一个角色同时拥有 `RoleModule` 和对应 `RoleMenu`，节点权限才生效。不得用角色 A 的模块授权与角色 B 的节点授权拼接访问权；复合外键和逐角色快照计算共同维持这条规则。

`permissionCodes` 是对外鉴权快照，不是独立数据源。系统从有效 `PAGE/LINK/BUTTON.permissionCode` 生成它，因此现有 `<Auth>`、`useHasPermission` 和 `requirePermission` 调用方式不变。

### 2.1 状态与可见性

- 用户、角色或模块停用后，相关授权在下一次请求立即失效。
- 节点自身或任一祖先 `status=DISABLED` 时，其页面、按钮和 API 权限全部失效。
- `visible=false` 只影响导航和模块落点，不撤销已授权页面的直接访问和其有效权限码。
- 若隐藏或停用导致模块没有启用、可见、已授权的 `PAGE`，导航临时移除该模块，不会回退到未授权页面；角色管理界面标记“缺少可用入口”。

### 2.2 superadmin

`role.code = 'superadmin'` 时，系统隐式授予全部启用模块及其全部有效节点，不依赖显式 `RoleModule` 或 `RoleMenu`。角色详情返回计算结果用于展示；访问权限抽屉只读，服务端也拒绝修改。

## 3. 角色访问权限接口

角色的模块和节点由一个接口、一个请求、一个事务全量替换：

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

`menuIds` 仅允许 `PAGE`、`LINK` 和 `BUTTON`。服务端先对模块和节点 ID 去重，再执行以下校验：

- 角色、模块及节点存在，且节点属于请求中的模块。
- 请求不包含 `DIR` 或缺少权限码的节点。
- 每个 `BUTTON` 的直属父 `PAGE` 同时在该模块的 `menuIds` 中。
- 每个已分配模块至少有一个已授权、启用、可见且祖先有效的 `PAGE`。
- `superadmin` 不能被显式修改。

任一校验失败时请求整体失败。校验通过后，服务端在 Serializable 事务中先删除该角色现有 `RoleMenu` 和 `RoleModule`，再写入完整新集合；并发序列化失败按有限次数重试。取消模块会在同一事务中撤销该模块的所有节点授权。

接口使用 `system:role:assign-access`，写入 `role.assign-access` 审计事件，并记录变更前后的模块与节点 ID。

### 3.1 勾选联动

- 勾选按钮时，管理端自动补齐直属父页面。
- 取消页面时，管理端清除该页面下全部按钮。
- 勾选页面不会自动授予按钮。
- “全选本组菜单”只选择页面和外链，按钮必须逐项选择。
- 取消已有授权的模块前二次确认，并清空该模块草稿。
- 保存前逐模块提示缺少入口页面；服务端仍执行最终校验。

## 4. 导航与路由

`GET /api/v1/navigation` 返回用户级导航：

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

- 模块按 `sort -> name -> id` 排序，只返回启用且存在可用落点的模块。
- 每个模块先按同样规则稳定排序菜单树，再做深度优先遍历；首个启用、可见、已授权的 `PAGE.path` 是 `landingPath`。
- `LINK` 和 `BUTTON` 永远不能成为落点，`BUTTON` 永远不进入导航树。
- `/` 跳转到排序第一的可用模块 `landingPath`。
- 模块切换器和“首页”动作都使用目标模块的 `landingPath`。
- 所有模块共用当前工作区 Header 和内容布局；只有一个可导航入口的模块隐藏侧栏及其切换按钮。
- 内置仪表盘模块使用 `/dashboard`；后台管理移除仪表盘菜单，点击后台管理进入其首个可访问页面，`/admin` 直接跳转到该页面。
- `/profile` 是登录后全局页面，不属于模块或菜单。

页面请求先在全部已知 `PAGE.path` 中进行最长前缀匹配，再校验用户授权。没有已知页面返回 404；页面存在但用户未授权返回 403。已授权页面的 `component` 未在页面 manifest 中注册时返回 404。

## 5. 三层校验

### 5.1 前端按钮

前端基于有效权限码改善 UX，但不能作为安全边界：

```tsx
<Auth code="system:user:create">
  <Button>新增用户</Button>
</Auth>
```

### 5.2 页面路由

工作区服务端路由先解析已知 `PAGE`，再检查用户是否通过同一角色获得模块和页面节点。直接粘贴 URL 不能绕过授权。

### 5.3 API

所有受控接口必须使用服务端权限断言：

```ts
await requirePermission('system:user:create');
await requirePermission(['system:user:update', 'system:user:delete']);
```

`requirePermission` 读取按角色计算的有效 `permissionCodes`。按钮与写接口应使用同一权限码，保证 UI 和 API 行为一致。

## 6. 管理流程

### 6.1 创建模块

在 `/admin/system/module` 仅填写编码、名称、描述、图标、排序和状态。模块列表展示导航节点、按钮、角色数量和入口配置状态。模块编码创建后不可修改；内置模块受删除和停用保护。

### 6.2 配置菜单与权限

在 `/admin/system/menu` 选择模块并维护完整树：

1. 创建目录、页面或外链。
2. 在页面行使用“新增按钮”，父页面自动锁定。
3. 页面组件键必须已存在于 Web 页面 manifest。
4. 为 `PAGE/LINK/BUTTON` 设置全局唯一权限码。

菜单和权限在同一页面管理，不再维护权限列表、权限下拉绑定或独立权限页面。

### 6.3 配置角色

角色列表只有一个“配置访问权限”入口。抽屉左侧选择模块，右侧勾选当前模块的页面、外链和按钮；切换模块保留未保存草稿。目录的选中和半选状态由后代节点派生。保存使用单一访问权限接口。

### 6.4 分配用户

用户新增、编辑和“分配角色”流程保持不变。授权保存或撤销后刷新导航，下一次请求使用最新权限快照。

## 7. 数据初始化与发布

项目尚未上线，数据库由单一初始化迁移 `20260818000000_init` 建表，只描述当前最终 RBAC 模型，不包含历史数据搬迁逻辑。生产部署先运行 `prisma migrate deploy`，再按需显式执行 seed 写入内置模块、菜单与超级管理员授权。

权限模型已统一为菜单节点（`DIR | PAGE | LINK | BUTTON`）：权限资源就是 `BUTTON Menu`，模块授权存 `RoleModule`，节点授权存 `RoleMenu`，不再有独立的权限资源表。

## 8. 授权一致性

授权快照当前不做跨请求缓存。导航、页面门禁、Auth.js JWT 和 API 权限检查每次从 PostgreSQL 主库重新计算，所以撤权事务提交后，任一实例的下一次请求都会使用新结果。后续如引入缓存，必须在数据库维护授权版本，并与用户角色、角色模块、角色节点、模块和菜单变更在同一事务递增；读取前校验版本，并用并发测试证明旧快照不会在失效后回填。
