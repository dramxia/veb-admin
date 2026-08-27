import { z } from 'zod';
import { idSchema, isoDateTimeSchema, paginationQuerySchema } from './common';

export const statusSchema = z.enum(['ENABLED', 'DISABLED']);
export const menuTypeSchema = z.enum(['DIR', 'PAGE', 'LINK', 'BUTTON']);
export const navigationMenuTypeSchema = z.enum(['DIR', 'PAGE', 'LINK']);
export const logStatusSchema = z.enum(['SUCCESS', 'FAILURE']);

export function isCanonicalAdminMenuPath(path: string) {
  if (
    (path !== '/admin' && !path.startsWith('/admin/')) ||
    (path !== '/admin' && path.endsWith('/')) ||
    path.includes('//') ||
    path.includes('\\') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes('%')
  ) {
    return false;
  }

  try {
    const parsed = new URL(path, 'https://veb.invalid');
    return (
      parsed.origin === 'https://veb.invalid' &&
      parsed.pathname === path &&
      parsed.search === '' &&
      parsed.hash === ''
    );
  } catch {
    return false;
  }
}

export const adminMenuPathSchema = z
  .string()
  .trim()
  .min(1, '路径不能为空')
  .refine(isCanonicalAdminMenuPath, '后台菜单路径必须是规范的 /admin 绝对路径');

const reservedWorkspacePaths = new Set([
  '/',
  '/403',
  '/404',
  '/login',
  '/profile',
]);

export function isCanonicalPagePath(path: string) {
  if (
    !path.startsWith('/') ||
    (path !== '/' && path.endsWith('/')) ||
    path.includes('//') ||
    path.includes('\\') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes('%')
  ) {
    return false;
  }

  if (
    reservedWorkspacePaths.has(path) ||
    path === '/api' ||
    path.startsWith('/api/') ||
    path === '/articles' ||
    path.startsWith('/articles/') ||
    path === '/_next' ||
    path.startsWith('/_next/')
  ) {
    return false;
  }

  try {
    const parsed = new URL(path, 'https://veb.invalid');
    if (
      parsed.origin !== 'https://veb.invalid' ||
      parsed.pathname !== path ||
      parsed.search !== '' ||
      parsed.hash !== ''
    ) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

export const pagePathSchema = z
  .string()
  .trim()
  .min(1, '路径不能为空')
  .refine(isCanonicalPagePath, '页面路径必须是未被系统保留的规范绝对路径');

// Compatibility aliases for callers that still import the old path helpers.
export const isCanonicalModuleMenuPath = isCanonicalPagePath;
export const moduleMenuPathSchema = pagePathSchema;

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

export const appModuleBaseSchema = z
  .object({
    id: idSchema,
    code: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    sort: z.number().int(),
    status: statusSchema,
    isSystem: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const appModuleDtoSchema = appModuleBaseSchema
  .extend({
    _count: z
      .object({
        menus: z.number().int().nonnegative(),
        buttons: z.number().int().nonnegative(),
        roles: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const roleAccessModuleOptionSchema = appModuleBaseSchema
  .pick({ id: true, name: true, status: true })
  .extend({
    _count: z
      .object({
        menus: z.number().int().nonnegative(),
        buttons: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const appModuleCreateInputSchema = z
  .object({
    code: z.string().regex(/^[a-z][a-z0-9_-]*$/, '模块编码格式不正确'),
    name: z.string().trim().min(1, '模块名称不能为空'),
    description: z.string().trim().optional().nullable(),
    icon: z.string().trim().optional().nullable(),
    sort: z.number().int().default(0),
    status: statusSchema.default('ENABLED'),
  })
  .strict();

export const appModuleUpdateInputSchema = appModuleCreateInputSchema
  .omit({ code: true })
  .partial()
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
        modules: z.number().int().nonnegative(),
        menus: z.number().int().nonnegative(),
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
export const assignUsersInputSchema = z
  .object({ userIds: z.array(idSchema) })
  .strict();

export const roleAssignedUserSchema = vebUserSchema
  .omit({ roles: true })
  .strict();
export const roleUserAssignmentSchema = z
  .object({
    userId: idSchema,
    roleId: idSchema,
    user: roleAssignedUserSchema,
  })
  .strict();

export const roleUserOptionSchema = roleAssignedUserSchema
  .pick({ id: true, username: true, nickname: true, status: true })
  .strict();

export const menuDtoSchema = z
  .object({
    id: idSchema,
    moduleId: idSchema,
    parentId: idSchema.nullable(),
    name: z.string(),
    description: z.string().nullable(),
    path: z.string().nullable(),
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

export const roleAccessMenuOptionSchema = menuDtoSchema
  .pick({
    id: true,
    moduleId: true,
    parentId: true,
    name: true,
    path: true,
    sort: true,
    type: true,
    permissionCode: true,
    visible: true,
    status: true,
    externalUrl: true,
  })
  .strict();

export type MenuDto = z.infer<typeof menuDtoSchema>;

export const menuModuleOptionSchema = appModuleBaseSchema
  .pick({ id: true, name: true })
  .strict();
export const menuManagementListSchema = z
  .object({
    items: z.array(menuDtoSchema),
    modules: z.array(menuModuleOptionSchema),
  })
  .strict();

export type MenuModuleOption = z.infer<typeof menuModuleOptionSchema>;
export type MenuManagementList = z.infer<typeof menuManagementListSchema>;

export const menuTreeNodeBaseSchema = menuDtoSchema;
export type MenuTreeNode = MenuDto & { children: MenuTreeNode[] };
export const menuTreeNodeSchema: z.ZodType<MenuTreeNode> =
  menuTreeNodeBaseSchema.extend({
    children: z.lazy(() => z.array(menuTreeNodeSchema)),
  });

export const menuNodeBaseSchema = menuDtoSchema
  .omit({
    isSystem: true,
    createdAt: true,
    updatedAt: true,
    type: true,
  })
  .extend({ type: navigationMenuTypeSchema });

export type MenuNode = z.infer<typeof menuNodeBaseSchema> & {
  children: MenuNode[];
};
export type NavigationItem = MenuNode;

export const menuNodeSchema: z.ZodType<MenuNode> = menuNodeBaseSchema.extend({
  children: z.lazy(() => z.array(menuNodeSchema)),
});

export const navigationItemSchema = menuNodeSchema;
export const navigationSchema = z.array(menuNodeSchema);

export const appModuleNavigationSchema = appModuleBaseSchema
  .pick({
    id: true,
    code: true,
    name: true,
    description: true,
    icon: true,
    sort: true,
    status: true,
    isSystem: true,
  })
  .extend({ landingPath: pagePathSchema, menus: navigationSchema })
  .strict();

export const userNavigationSchema = z
  .object({
    modules: z.array(appModuleNavigationSchema),
    permissionCodes: z.array(z.string()),
    roleCodes: z.array(z.string()),
  })
  .strict();

export const pageAccessQuerySchema = z
  .object({ path: pagePathSchema })
  .strict();

export const pageAccessDtoSchema = z
  .object({
    id: idSchema,
    moduleId: idSchema,
    path: pagePathSchema,
    component: z.string().min(1),
  })
  .strict();

export const permissionCodeSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(:[a-z0-9-]+)+$/, '权限码格式不正确');

const menuCommonCreateSchema = z.object({
  moduleId: idSchema,
  name: z.string().trim().min(1, '名称不能为空'),
  description: z.string().trim().optional().nullable(),
  sort: z.number().int().default(0),
  status: statusSchema.default('ENABLED'),
});

const httpUrlSchema = z
  .string()
  .trim()
  .url('外链地址格式不正确')
  .refine((value) => /^https?:\/\//i.test(value), '外链仅支持 HTTP(S)');

const directoryMenuCreateInputSchema = menuCommonCreateSchema
  .extend({
    type: z.literal('DIR'),
    parentId: idSchema.optional().nullable(),
    icon: z.string().trim().optional().nullable(),
    visible: z.boolean().default(true),
  })
  .strict();

const pageMenuCreateInputSchema = menuCommonCreateSchema
  .extend({
    type: z.literal('PAGE'),
    parentId: idSchema.optional().nullable(),
    path: pagePathSchema,
    component: z.string().trim().min(1, '页面组件不能为空'),
    icon: z.string().trim().optional().nullable(),
    permissionCode: permissionCodeSchema,
    visible: z.boolean().default(true),
  })
  .strict();

const linkMenuCreateInputSchema = menuCommonCreateSchema
  .extend({
    type: z.literal('LINK'),
    parentId: idSchema.optional().nullable(),
    externalUrl: httpUrlSchema,
    icon: z.string().trim().optional().nullable(),
    permissionCode: permissionCodeSchema,
    visible: z.boolean().default(true),
  })
  .strict();

const buttonMenuCreateInputSchema = menuCommonCreateSchema
  .extend({
    type: z.literal('BUTTON'),
    parentId: idSchema,
    permissionCode: permissionCodeSchema,
  })
  .strict();

export const menuCreateInputSchema = z.discriminatedUnion('type', [
  directoryMenuCreateInputSchema,
  pageMenuCreateInputSchema,
  linkMenuCreateInputSchema,
  buttonMenuCreateInputSchema,
]);

const menuCommonUpdateSchema = z.object({
  parentId: idSchema.optional().nullable(),
  name: z.string().trim().min(1, '名称不能为空').optional(),
  description: z.string().trim().optional().nullable(),
  sort: z.number().int().optional(),
  status: statusSchema.optional(),
});

const directoryMenuUpdateInputSchema = menuCommonUpdateSchema
  .extend({
    type: z.literal('DIR'),
    icon: z.string().trim().optional().nullable(),
    visible: z.boolean().optional(),
  })
  .strict();

const pageMenuUpdateInputSchema = menuCommonUpdateSchema
  .extend({
    type: z.literal('PAGE'),
    path: pagePathSchema.optional(),
    component: z.string().trim().min(1, '页面组件不能为空').optional(),
    icon: z.string().trim().optional().nullable(),
    permissionCode: permissionCodeSchema.optional(),
    visible: z.boolean().optional(),
  })
  .strict();

const linkMenuUpdateInputSchema = menuCommonUpdateSchema
  .extend({
    type: z.literal('LINK'),
    externalUrl: httpUrlSchema.optional(),
    icon: z.string().trim().optional().nullable(),
    permissionCode: permissionCodeSchema.optional(),
    visible: z.boolean().optional(),
  })
  .strict();

const buttonMenuUpdateInputSchema = menuCommonUpdateSchema
  .extend({
    type: z.literal('BUTTON'),
    permissionCode: permissionCodeSchema.optional(),
  })
  .strict();

export const menuUpdateInputSchema = z.discriminatedUnion('type', [
  directoryMenuUpdateInputSchema,
  pageMenuUpdateInputSchema,
  linkMenuUpdateInputSchema,
  buttonMenuUpdateInputSchema,
]);

export const roleAccessModuleInputSchema = z
  .object({
    moduleId: idSchema,
    menuIds: z.array(idSchema),
  })
  .strict();

export const roleAccessUpdateInputSchema = z
  .object({ modules: z.array(roleAccessModuleInputSchema) })
  .strict();

export const roleAccessDetailDtoSchema = z
  .object({
    id: idSchema,
    assignments: z.array(roleAccessModuleInputSchema),
    modules: z.array(roleAccessModuleOptionSchema),
    menus: z.array(roleAccessMenuOptionSchema),
  })
  .strict();

export const roleUserAssignmentDetailDtoSchema = z
  .object({
    id: idSchema,
    userIds: z.array(idSchema),
    users: z.array(roleUserOptionSchema),
  })
  .strict();

export const roleAccessModuleSchema = z
  .object({
    moduleId: idSchema,
    module: appModuleBaseSchema,
    menuIds: z.array(idSchema),
  })
  .strict();

export const roleDetailDtoSchema = roleBaseSchema
  .extend({
    modules: z.array(roleAccessModuleSchema),
    users: z.array(roleUserAssignmentSchema),
  })
  .strict();

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

export const appModuleListQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional(),
  status: statusSchema.optional(),
});

export const menuListQuerySchema = z.object({ moduleId: idSchema.optional() });

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
    enabledUserCount: z.number().int().nonnegative(),
    roleCount: z.number().int().nonnegative(),
    enabledRoleCount: z.number().int().nonnegative(),
    moduleCount: z.number().int().nonnegative(),
    enabledModuleCount: z.number().int().nonnegative(),
    permissionCount: z.number().int().nonnegative(),
    menuCount: z.number().int().nonnegative(),
    operationCount24h: z.number().int().nonnegative(),
    failedOperationCount24h: z.number().int().nonnegative(),
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
export type AppModuleDto = z.infer<typeof appModuleDtoSchema>;
export type AppModuleBase = z.infer<typeof appModuleBaseSchema>;
export type RoleAccessModuleOption = z.infer<
  typeof roleAccessModuleOptionSchema
>;
export type RoleAccessMenuOption = z.infer<typeof roleAccessMenuOptionSchema>;
export type AppModuleCreateInput = z.input<typeof appModuleCreateInputSchema>;
export type AppModuleUpdateInput = z.input<typeof appModuleUpdateInputSchema>;
export type AppModuleListQuery = z.infer<typeof appModuleListQuerySchema>;
export type RoleAccessModule = z.infer<typeof roleAccessModuleSchema>;
export type RoleAccessUpdateInput = z.input<typeof roleAccessUpdateInputSchema>;
export type RoleAccessDetailDto = z.infer<typeof roleAccessDetailDtoSchema>;
export type RoleUserAssignment = z.infer<typeof roleUserAssignmentSchema>;
export type RoleUserOption = z.infer<typeof roleUserOptionSchema>;
export type RoleUserAssignmentDetailDto = z.infer<
  typeof roleUserAssignmentDetailDtoSchema
>;
export type FileDto = z.infer<typeof fileDtoSchema>;
export type OperationLogDto = z.infer<typeof operationLogDtoSchema>;
export type UserNavigation = z.infer<typeof userNavigationSchema>;
export type AppModuleNavigation = UserNavigation['modules'][number];
export type PageAccessDto = z.infer<typeof pageAccessDtoSchema>;
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type RoleListQuery = z.infer<typeof roleListQuerySchema>;
export type MenuListQuery = z.infer<typeof menuListQuerySchema>;
export type FileListQuery = z.infer<typeof fileListQuerySchema>;
export type FileReadQuery = z.infer<typeof fileReadQuerySchema>;
export type OperationLogQuery = z.infer<typeof operationLogQuerySchema>;
