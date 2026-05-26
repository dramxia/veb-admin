import { z } from 'zod';

export const statusSchema = z.enum(['ENABLED', 'DISABLED']);
export const permissionTypeSchema = z.enum(['MENU', 'BUTTON']);
export const menuTypeSchema = z.enum(['DIR', 'PAGE', 'LINK']);

export const idSchema = z.string().min(1, 'id 不能为空');

export const userCreateSchema = z.object({
  username: z.string().min(2, '用户名至少 2 个字符'),
  password: z.string().min(6, '密码至少 6 个字符'),
  email: z.string().email('邮箱格式不正确').optional().nullable(),
  nickname: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  status: statusSchema.default('ENABLED'),
  roleIds: z.array(z.string()).optional(),
});

export const userUpdateSchema = userCreateSchema
  .omit({ username: true, password: true, roleIds: true })
  .extend({ username: z.string().min(2).optional() });

export const resetPasswordSchema = z.object({
  password: z.string().min(6, '密码至少 6 个字符'),
});

export const assignRolesSchema = z.object({ roleIds: z.array(z.string()) });

export const roleSchema = z.object({
  code: z.string().regex(/^[a-z][a-z0-9_-]*$/, '角色编码格式不正确'),
  name: z.string().min(1, '角色名称不能为空'),
  description: z.string().optional().nullable(),
  status: statusSchema.default('ENABLED'),
  sort: z.number().int().default(0),
});

export const roleUpdateSchema = roleSchema.partial();
export const assignPermissionsSchema = z.object({ permissionIds: z.array(z.string()) });
export const assignUsersSchema = z.object({ userIds: z.array(z.string()) });

export const permissionSchema = z.object({
  code: z.string().regex(/^[a-z0-9]+(:[a-z0-9-]+)+$/, '权限码格式不正确'),
  name: z.string().min(1, '权限名称不能为空'),
  type: permissionTypeSchema,
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

export const permissionUpdateSchema = permissionSchema.partial();

export const menuSchema = z.object({
  parentId: z.string().optional().nullable(),
  name: z.string().min(1, '菜单名称不能为空'),
  path: z.string().min(1, '路径不能为空'),
  component: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sort: z.number().int().default(0),
  type: menuTypeSchema.default('PAGE'),
  permissionCode: z.string().optional().nullable(),
  visible: z.boolean().default(true),
  status: statusSchema.default('ENABLED'),
  externalUrl: z.string().optional().nullable(),
});

export const menuUpdateSchema = menuSchema.partial();

export const profileSchema = z.object({
  nickname: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  email: z.string().email('邮箱格式不正确').optional().nullable(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入原密码'),
  newPassword: z.string().min(6, '新密码至少 6 个字符'),
});
