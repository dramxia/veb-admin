# 权限模型

## 数据结构

RBAC 使用 `User`、`Role`、`AppModule`、`Menu`、`UserRole`、`RoleModule` 和 `RoleMenu`。

`RoleMenu` 必须依附同一角色的 `RoleModule`，并通过复合外键保证菜单属于该模块。可授权节点是带 `permissionCode` 的非 `DIR` 菜单；应用服务在配置角色访问范围时校验该约束。

## 内置模块与页面

种子脚本创建以下模块：

| 模块代码    | 名称     | 默认落点               | 页面                                         |
| ----------- | -------- | ---------------------- | -------------------------------------------- |
| `dashboard` | 仪表盘   | `/dashboard`           | 仪表盘                                       |
| `blog`      | 博客管理 | `/admin/blog/article`  | 文章、标签、喜欢记录                         |
| `admin`     | 后台管理 | `/admin/system/module` | 模块、用户、角色、菜单与权限、文件、操作日志 |

“系统管理”是 `admin` 模块内的目录菜单，不是独立模块。

## 权限码

| 资源     | 权限码                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 仪表盘   | `dashboard:view`                                                                                                                              |
| 文章     | `blog:article:view`、`blog:article:create`、`blog:article:update`、`blog:article:delete`、`blog:article:publish`                              |
| 标签     | `blog:tag:view`、`blog:tag:create`、`blog:tag:update`、`blog:tag:delete`、`blog:tag:assign`                                                   |
| 喜欢记录 | `blog:like:view`、`blog:like:stats`、`blog:like:delete`                                                                                       |
| 模块     | `system:module:view`、`system:module:create`、`system:module:update`、`system:module:delete`                                                  |
| 用户     | `system:user:view`、`system:user:create`、`system:user:update`、`system:user:delete`、`system:user:reset-password`、`system:user:assign-role` |
| 角色     | `system:role:view`、`system:role:create`、`system:role:update`、`system:role:delete`、`system:role:assign-access`、`system:role:assign-user`  |
| 菜单     | `system:menu:view`、`system:menu:create`、`system:menu:update`、`system:menu:delete`                                                          |
| 文件     | `system:file:view`、`system:file:upload`、`system:file:delete`                                                                                |
| 操作日志 | `log:operation:view`、`log:operation:export`                                                                                                  |

## 内置角色与用户

种子脚本创建启用状态的 `superadmin`、`admin` 和 `user` 角色，并将 `superadmin` 分配给用户名为 `admin` 的用户。

`superadmin` 的权限在请求时动态计算，包含所有启用模块以及启用菜单树中的全部权限码。种子脚本不会为它保存 `RoleModule` 或 `RoleMenu` 记录，并会删除已有的这类记录。

种子脚本不给 `admin` 和 `user` 角色分配模块或菜单，因此这两个角色在初始化后本身不提供页面权限。

## 有效权限

每次权限检查都会从数据库计算当前快照：

- 用户、角色和模块必须处于启用状态。
- 非 `superadmin` 权限按角色分别计算；同一角色必须同时拥有模块和该模块内的菜单，不能把不同角色的分配拼接成权限。
- 菜单节点及其父级必须启用。
- 权限数组采用任一满足语义。
- 菜单 `visible` 只影响导航显示，不影响已分配权限的计算。

`/` 和 `/profile` 是已认证工作区的全局页面。其他工作区页面按菜单路径解析，并要求对应模块和 PAGE 权限。BUTTON 权限控制页面内命令，不能代替 API 权限校验。

## API 访问

公开路由：

- `/api/health/live`、`/api/health/ready`、`/api/v1/health`
- 公开文章、标签及文章喜欢接口

只要求 Session 的路由：

- 当前用户资料和修改密码
- 导航与页面解析
- 文件列表和文件读取

文件列表默认只返回当前用户上传的文件，拥有 `system:file:view` 时返回全部文件。文件读取允许上传者或拥有 `system:file:view` 的用户访问。上传和删除路由分别要求 `system:file:upload`、`system:file:delete`；服务层还会对读取和删除执行所有权或对应权限校验。

仪表盘统计要求 `dashboard:view`。统计总量和趋势始终返回；只有同时拥有 `log:operation:view` 时，`recentOperations` 才包含最近操作记录。

博客管理路由按上表使用对应的博客权限。创建或更新文章时，如果提交状态为 `PUBLISHED`，还会额外检查 `blog:article:publish`。文章作者固定为当前认证用户，客户端不能指定作者。

系统管理 CRUD 使用对应资源的 `view`、`create`、`update`、`delete` 权限；用户角色分配、角色访问配置、密码重置和日志导出使用各自的专用权限。

## 角色委派与审计

非 `superadmin` 用户不能分配 `superadmin` 角色，也不能授予超出自身有效模块和权限范围的角色或访问配置。`superadmin` 可以分配现有角色与访问范围，但其自身访问配置不能被普通角色配置接口修改。

配置了审计动作的路由会记录成功和失败结果。当前审计覆盖系统与博客管理写操作、资料和密码修改、文件上传与删除。JSON 请求载荷中的密码、令牌和密钥字段会被递归替换为 `[REDACTED]`。
