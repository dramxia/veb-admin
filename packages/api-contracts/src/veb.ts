import { z } from 'zod';
import { idSchema, isoDateTimeSchema, paginationQuerySchema } from './common';

export const statusSchema = z.enum(['ENABLED', 'DISABLED']);
export const permissionTypeSchema = z.enum(['MENU', 'BUTTON']);
export const menuTypeSchema = z.enum(['DIR', 'PAGE', 'LINK']);
export const logStatusSchema = z.enum(['SUCCESS', 'FAILURE']);

export const roleSummarySchema = z
  .object({
    id: idSchema,
    code: z.string(),
    name: z.string(),
  })
  .strict();

export const userRoleAssignmentSchema = z
  .object({ role: roleSummarySchema })
  .strict();

export const vebUserSchema = z
  .object({
    id: idSchema,
    username: z.string(),
    email: z.string().email().nullable(),
    nickname: z.string().nullable(),
    avatar: z.string().nullable(),
    status: statusSchema,
    lastLoginAt: isoDateTimeSchema.nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    roles: z.array(userRoleAssignmentSchema),
  })
  .strict();

export const profileDtoSchema = vebUserSchema.pick({
  id: true,
  username: true,
  email: true,
  nickname: true,
  avatar: true,
});

export const userCreateInputSchema = z
  .object({
    username: z.string().trim().min(2, '用户名至少 2 个字符'),
    password: z.string().min(6, '密码至少 6 个字符'),
    email: z.string().email('邮箱格式不正确').optional().nullable(),
    nickname: z.string().trim().optional().nullable(),
    avatar: z.string().trim().optional().nullable(),
    status: statusSchema.default('ENABLED'),
    roleIds: z.array(idSchema).optional(),
  })
  .strict();

export const userUpdateInputSchema = userCreateInputSchema
  .omit({ password: true, roleIds: true })
  .partial()
  .strict();

export const resetPasswordInputSchema = z
  .object({ password: z.string().min(6, '密码至少 6 个字符') })
  .strict();

export const assignRolesInputSchema = z
  .object({ roleIds: z.array(idSchema) })
  .strict();

export const roleBaseSchema = z
  .object({
    id: idSchema,
    code: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    status: statusSchema,
    sort: z.number().int(),
    isSystem: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const roleDtoSchema = roleBaseSchema
  .extend({
    _count: z
      .object({
        users: z.number().int().nonnegative(),
        permissions: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const roleCreateInputSchema = z
  .object({
    code: z.string().regex(/^[a-z][a-z0-9_-]*$/, '角色编码格式不正确'),
    name: z.string().trim().min(1, '角色名称不能为空'),
    description: z.string().trim().optional().nullable(),
    status: statusSchema.default('ENABLED'),
    sort: z.number().int().default(0),
  })
  .strict();

export const roleUpdateInputSchema = roleCreateInputSchema.partial().strict();
export const assignPermissionsInputSchema = z
  .object({ permissionIds: z.array(idSchema) })
  .strict();
export const assignUsersInputSchema = z
  .object({ userIds: z.array(idSchema) })
  .strict();

export const permissionDtoSchema = z
  .object({
    id: idSchema,
    code: z.string(),
    name: z.string(),
    type: permissionTypeSchema,
    description: z.string().nullable(),
    parentId: idSchema.nullable(),
    isSystem: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const permissionCreateInputSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9]+(:[a-z0-9-]+)+$/, '权限码格式不正确'),
    name: z.string().trim().min(1, '权限名称不能为空'),
    type: permissionTypeSchema,
    description: z.string().trim().optional().nullable(),
    parentId: idSchema.optional().nullable(),
  })
  .strict();

export const permissionUpdateInputSchema = permissionCreateInputSchema
  .partial()
  .strict();

export const roleAssignedUserSchema = vebUserSchema
  .omit({ roles: true })
  .strict();
export const rolePermissionAssignmentSchema = z
  .object({
    roleId: idSchema,
    permissionId: idSchema,
    permission: permissionDtoSchema,
  })
  .strict();
export const roleUserAssignmentSchema = z
  .object({
    userId: idSchema,
    roleId: idSchema,
    user: roleAssignedUserSchema,
  })
  .strict();
export const roleDetailDtoSchema = roleBaseSchema
  .extend({
    permissions: z.array(rolePermissionAssignmentSchema),
    users: z.array(roleUserAssignmentSchema),
  })
  .strict();

export const menuDtoSchema = z
  .object({
    id: idSchema,
    parentId: idSchema.nullable(),
    name: z.string(),
    path: z.string(),
    component: z.string().nullable(),
    icon: z.string().nullable(),
    sort: z.number().int(),
    type: menuTypeSchema,
    permissionCode: z.string().nullable(),
    visible: z.boolean(),
    status: statusSchema,
    externalUrl: z.string().nullable(),
    isSystem: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type MenuDto = z.infer<typeof menuDtoSchema>;

export const menuNodeBaseSchema = menuDtoSchema.omit({
  isSystem: true,
  createdAt: true,
  updatedAt: true,
});

export type MenuNode = z.infer<typeof menuNodeBaseSchema> & {
  children: MenuNode[];
};
export type NavigationItem = MenuNode;

export const menuNodeSchema: z.ZodType<MenuNode> = menuNodeBaseSchema.extend({
  children: z.lazy(() => z.array(menuNodeSchema)),
});

export const navigationItemSchema = menuNodeSchema;
export const navigationSchema = z.array(menuNodeSchema);

export const userNavigationSchema = z
  .object({
    menus: navigationSchema,
    permissionCodes: z.array(z.string()),
    roleCodes: z.array(z.string()),
  })
  .strict();

export const menuCreateInputSchema = z
  .object({
    parentId: idSchema.optional().nullable(),
    name: z.string().trim().min(1, '菜单名称不能为空'),
    path: z.string().trim().min(1, '路径不能为空'),
    component: z.string().trim().optional().nullable(),
    icon: z.string().trim().optional().nullable(),
    sort: z.number().int().default(0),
    type: menuTypeSchema.default('PAGE'),
    permissionCode: z.string().trim().optional().nullable(),
    visible: z.boolean().default(true),
    status: statusSchema.default('ENABLED'),
    externalUrl: z.string().trim().optional().nullable(),
  })
  .strict();

export const menuUpdateInputSchema = menuCreateInputSchema.partial().strict();

export const profileUpdateInputSchema = z
  .object({
    nickname: z.string().trim().optional().nullable(),
    avatar: z.string().trim().optional().nullable(),
    email: z.string().email('邮箱格式不正确').optional().nullable(),
  })
  .strict();

export const changePasswordInputSchema = z
  .object({
    oldPassword: z.string().min(1, '请输入原密码'),
    newPassword: z.string().min(6, '新密码至少 6 个字符'),
  })
  .strict();

export const fileDtoSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    path: z.string(),
    url: z.string(),
    mime: z.string(),
    size: z.number().int().nonnegative(),
    uploaderId: idSchema.nullable(),
    scope: z.string().nullable(),
    createdAt: isoDateTimeSchema,
    uploader: roleSummarySchema
      .pick({ id: true, name: true })
      .extend({ username: z.string(), nickname: z.string().nullable() })
      .omit({ name: true })
      .nullable(),
  })
  .strict();

export const operationLogDtoSchema = z
  .object({
    id: idSchema,
    actorId: idSchema.nullable(),
    action: z.string(),
    target: z.string().nullable(),
    ip: z.string().nullable(),
    userAgent: z.string().nullable(),
    payload: z.unknown().nullable(),
    status: logStatusSchema,
    message: z.string().nullable(),
    createdAt: isoDateTimeSchema,
    actor: z
      .object({
        id: idSchema,
        username: z.string(),
        nickname: z.string().nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const userListQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional(),
  status: statusSchema.optional(),
});

export const roleListQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional(),
  status: statusSchema.optional(),
});

export const permissionListQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional(),
  type: permissionTypeSchema.optional(),
});

export const menuListQuerySchema = z.object({});

export const fileListQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional(),
});

export const fileReadQuerySchema = z.object({
  download: z.enum(['0', '1']).optional().default('0'),
});

export const operationLogQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional(),
  actorId: idSchema.optional(),
  action: z.string().trim().optional(),
  status: logStatusSchema.optional(),
  startAt: isoDateTimeSchema.optional(),
  endAt: isoDateTimeSchema.optional(),
});

export const dashboardStatsSchema = z
  .object({
    userCount: z.number().int().nonnegative(),
    roleCount: z.number().int().nonnegative(),
    permissionCount: z.number().int().nonnegative(),
    menuCount: z.number().int().nonnegative(),
  })
  .strict();

export type VebUser = z.infer<typeof vebUserSchema>;
export type UserDto = VebUser;
export type UserRoleAssignment = z.infer<typeof userRoleAssignmentSchema>;
export type ProfileDto = z.infer<typeof profileDtoSchema>;
export type UserCreateInput = z.input<typeof userCreateInputSchema>;
export type UserUpdateInput = z.input<typeof userUpdateInputSchema>;
export type RoleDto = z.infer<typeof roleDtoSchema>;
export type RoleDetailDto = z.infer<typeof roleDetailDtoSchema>;
export type RolePermissionAssignment = z.infer<
  typeof rolePermissionAssignmentSchema
>;
export type RoleUserAssignment = z.infer<typeof roleUserAssignmentSchema>;
export type PermissionDto = z.infer<typeof permissionDtoSchema>;
export type FileDto = z.infer<typeof fileDtoSchema>;
export type OperationLogDto = z.infer<typeof operationLogDtoSchema>;
export type UserNavigation = z.infer<typeof userNavigationSchema>;
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type RoleListQuery = z.infer<typeof roleListQuerySchema>;
export type PermissionListQuery = z.infer<typeof permissionListQuerySchema>;
export type MenuListQuery = z.infer<typeof menuListQuerySchema>;
export type FileListQuery = z.infer<typeof fileListQuerySchema>;
export type FileReadQuery = z.infer<typeof fileReadQuerySchema>;
export type OperationLogQuery = z.infer<typeof operationLogQuerySchema>;

// Compatibility aliases for the existing API handlers during the transition release.
export const userCreateSchema = userCreateInputSchema;
export const userUpdateSchema = userUpdateInputSchema;
export const resetPasswordSchema = resetPasswordInputSchema;
export const assignRolesSchema = assignRolesInputSchema;
export const roleSchema = roleCreateInputSchema;
export const roleUpdateSchema = roleUpdateInputSchema;
export const assignPermissionsSchema = assignPermissionsInputSchema;
export const assignUsersSchema = assignUsersInputSchema;
export const permissionSchema = permissionCreateInputSchema;
export const permissionUpdateSchema = permissionUpdateInputSchema;
export const menuSchema = menuCreateInputSchema;
export const menuUpdateSchema = menuUpdateInputSchema;
export const profileSchema = profileUpdateInputSchema;
export const changePasswordSchema = changePasswordInputSchema;
