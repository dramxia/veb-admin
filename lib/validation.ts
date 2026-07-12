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
export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
});
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

const articleFields = {
  title: z
    .string()
    .trim()
    .min(1, '请输入文章标题')
    .max(120, '标题不能超过 120 个字符'),
  slug: z.string().trim().max(120, 'slug 不能超过 120 个字符').optional(),
  summary: z
    .string()
    .trim()
    .max(300, '摘要不能超过 300 个字符')
    .nullable()
    .optional(),
  contentMarkdown: z.string().max(200_000, '正文内容过长').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  tagIds: z
    .array(z.string().min(1))
    .max(20, '每篇文章最多关联 20 个标签')
    .default([]),
};

export const articleCreateSchema = z.object(articleFields);
export const articleUpdateSchema = z.object(articleFields).partial();

export const tagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '请输入标签名称')
    .max(40, '标签名称不能超过 40 个字符'),
  slug: z.string().trim().max(60, 'slug 不能超过 60 个字符').optional(),
});

export const tagUpdateSchema = tagSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: '请至少提供一个修改字段',
  });

export const tagIdsSchema = z.object({
  tagIds: z.array(z.string().min(1)).max(20, '每篇文章最多关联 20 个标签'),
});

export const likeBatchDeleteSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, '请选择喜欢记录')
    .max(100, '单次最多删除 100 条记录'),
});
