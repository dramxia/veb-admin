# 权限体系说明

VEB 使用 RBAC 权限模型，并按 PRD 要求提供三层校验：前端按钮、middleware 页面拦截、API 服务端守卫。

## 1. 权限模型

```text
User ──< UserRole >── Role ──< RolePermission >── Permission
                                      ▲
                                      │
                                  Menu.permissionCode
```

- 用户通过角色获得权限。
- 菜单通过 `permissionCode` 绑定 `MENU` 权限。
- 按钮和写接口使用 `BUTTON` 权限。
- `superadmin` 角色拥有所有权限，校验时短路通过。

## 2. 权限类型

### MENU

用于控制页面、菜单、路由访问。

示例：

```text
system:user:view
system:role:view
log:operation:view
```

### BUTTON

用于控制按钮、批量操作和写接口。

示例：

```text
system:user:create
system:user:update
system:user:delete
system:role:assign-permission
system:file:upload
```

## 3. 命名规范

格式：

```text
module:object:action
```

推荐动作：

- `view`
- `create`
- `update`
- `delete`
- `export`
- `import`
- `assign-role`
- `assign-permission`
- `reset-password`

示例：

```text
system:user:view
system:user:create
system:user:reset-password
log:operation:export
```

## 4. 三层校验

### 4.1 前端按钮层

用于改善 UX，不是安全边界。

典型用法：

```tsx
<Auth code="system:user:create">
  <Button>新增用户</Button>
</Auth>
```

或使用封装按钮：

```tsx
<AuthButton code="system:user:delete">删除</AuthButton>
```

### 4.2 middleware 页面层

middleware 从 JWT 中读取 `roles` 与 `menuPaths`：

- 未登录访问受保护路径，跳转 `/login`。
- `superadmin` 直接放行。
- 普通用户必须命中 `menuPaths`，否则跳转 `/403`。

注意：middleware 不能作为最终安全边界。页面级守卫和 API 守卫仍然必须保留。

### 4.3 API 服务端层

所有写接口必须调用：

```ts
await requirePermission('system:user:create');
```

多个权限满足任一即可：

```ts
await requirePermission(['system:user:update', 'system:user:delete']);
```

这是权限安全边界。

## 5. 新增一个受控页面

1. 新增 `MENU` 权限码。

```text
example:report:view
```

2. 新增菜单，绑定该权限码。

关键字段：

```text
path: /example/report
component: example/report/page
permissionCode: example:report:view
type: PAGE
status: ENABLED
visible: true
```

3. 在动态模块 manifest 中注册组件映射。

```ts
'example/report/page': () => import('./example/report/page')
```

4. 页面入口添加页面级守卫。

```ts
await requirePermission('example:report:view');
```

5. 给目标角色分配 `example:report:view`。

6. 重新登录，刷新 JWT 中的 `menuPaths`。

## 6. 新增一个按钮或写接口

1. 新增 `BUTTON` 权限码。

```text
example:report:export
```

2. 前端按钮包裹权限组件。

```tsx
<Auth code="example:report:export">
  <Button>导出</Button>
</Auth>
```

3. API 中增加服务端守卫。

```ts
export const POST = withApi(async (request) => {
  await requirePermission('example:report:export');
  // 业务逻辑
});
```

4. 将权限分配给角色。

## 7. 内置权限清单

当前 seed 中包含：

```text
system:view
system:user:view/create/update/delete/reset-password/assign-role
system:role:view/create/update/delete/assign-permission/assign-user
system:permission:view/create/update/delete
system:menu:view/create/update/delete
system:file:view/upload/delete
log:operation:view/export
```

## 8. 缓存失效建议

权限相关变更后应失效缓存：

- 用户绑定/解绑角色：失效该用户。
- 角色绑定/解绑权限：失效该角色下所有用户。
- 菜单 CRUD：建议全量失效。
- 用户启停：失效该用户。
- 权限 CRUD：建议全量失效。
