import bcrypt from 'bcryptjs';
import { PrismaClient } from '@/generated/client';

const prisma = new PrismaClient();

const adminModuleId = 'module-admin';

const menus = [
  {
    id: 'menu-dashboard',
    parentId: null,
    name: '仪表盘',
    type: 'PAGE',
    path: '/admin',
    component: 'dashboard/page',
    permissionCode: 'dashboard:view',
    sort: 0,
  },
  {
    id: 'content-root',
    parentId: null,
    name: '内容管理',
    type: 'DIR',
    sort: 5,
  },
  {
    id: 'menu-content-article',
    parentId: 'content-root',
    name: '文章管理',
    type: 'PAGE',
    path: '/admin/content/article',
    component: 'content/article/page',
    permissionCode: 'content:article:view',
    sort: 6,
  },
  {
    id: 'button-content-article-create',
    parentId: 'menu-content-article',
    name: '新增文章',
    type: 'BUTTON',
    permissionCode: 'content:article:create',
    sort: 1001,
  },
  {
    id: 'button-content-article-update',
    parentId: 'menu-content-article',
    name: '编辑文章',
    type: 'BUTTON',
    permissionCode: 'content:article:update',
    sort: 1002,
  },
  {
    id: 'button-content-article-delete',
    parentId: 'menu-content-article',
    name: '删除文章',
    type: 'BUTTON',
    permissionCode: 'content:article:delete',
    sort: 1003,
  },
  {
    id: 'button-content-article-publish',
    parentId: 'menu-content-article',
    name: '发布文章',
    type: 'BUTTON',
    permissionCode: 'content:article:publish',
    sort: 1004,
  },
  {
    id: 'menu-content-tag',
    parentId: 'content-root',
    name: '标签管理',
    type: 'PAGE',
    path: '/admin/content/tag',
    component: 'content/tag/page',
    permissionCode: 'content:tag:view',
    sort: 7,
  },
  {
    id: 'button-content-tag-create',
    parentId: 'menu-content-tag',
    name: '新增标签',
    type: 'BUTTON',
    permissionCode: 'content:tag:create',
    sort: 1001,
  },
  {
    id: 'button-content-tag-update',
    parentId: 'menu-content-tag',
    name: '编辑标签',
    type: 'BUTTON',
    permissionCode: 'content:tag:update',
    sort: 1002,
  },
  {
    id: 'button-content-tag-delete',
    parentId: 'menu-content-tag',
    name: '删除标签',
    type: 'BUTTON',
    permissionCode: 'content:tag:delete',
    sort: 1003,
  },
  {
    id: 'button-content-tag-assign',
    parentId: 'menu-content-tag',
    name: '关联标签',
    type: 'BUTTON',
    permissionCode: 'content:tag:assign',
    sort: 1004,
  },
  {
    id: 'menu-content-like',
    parentId: 'content-root',
    name: '喜欢记录',
    type: 'PAGE',
    path: '/admin/content/like',
    component: 'content/like/page',
    permissionCode: 'content:like:view',
    sort: 8,
  },
  {
    id: 'button-content-like-stats',
    parentId: 'menu-content-like',
    name: '喜欢统计',
    type: 'BUTTON',
    permissionCode: 'content:like:stats',
    sort: 1001,
  },
  {
    id: 'button-content-like-delete',
    parentId: 'menu-content-like',
    name: '删除喜欢记录',
    type: 'BUTTON',
    permissionCode: 'content:like:delete',
    sort: 1002,
  },
  {
    id: 'system-root',
    parentId: null,
    name: '系统管理',
    type: 'DIR',
    sort: 10,
  },
  {
    id: 'menu-system-module',
    parentId: 'system-root',
    name: '模块管理',
    type: 'PAGE',
    path: '/admin/system/module',
    component: 'system/module/page',
    permissionCode: 'system:module:view',
    sort: 11,
  },
  {
    id: 'button-system-module-create',
    parentId: 'menu-system-module',
    name: '新增模块',
    type: 'BUTTON',
    permissionCode: 'system:module:create',
    sort: 1001,
  },
  {
    id: 'button-system-module-update',
    parentId: 'menu-system-module',
    name: '编辑模块',
    type: 'BUTTON',
    permissionCode: 'system:module:update',
    sort: 1002,
  },
  {
    id: 'button-system-module-delete',
    parentId: 'menu-system-module',
    name: '删除模块',
    type: 'BUTTON',
    permissionCode: 'system:module:delete',
    sort: 1003,
  },
  {
    id: 'menu-system-user',
    parentId: 'system-root',
    name: '用户管理',
    type: 'PAGE',
    path: '/admin/system/user',
    component: 'system/user/page',
    permissionCode: 'system:user:view',
    sort: 12,
  },
  {
    id: 'button-system-user-create',
    parentId: 'menu-system-user',
    name: '新增用户',
    type: 'BUTTON',
    permissionCode: 'system:user:create',
    sort: 1001,
  },
  {
    id: 'button-system-user-update',
    parentId: 'menu-system-user',
    name: '编辑用户',
    type: 'BUTTON',
    permissionCode: 'system:user:update',
    sort: 1002,
  },
  {
    id: 'button-system-user-delete',
    parentId: 'menu-system-user',
    name: '删除用户',
    type: 'BUTTON',
    permissionCode: 'system:user:delete',
    sort: 1003,
  },
  {
    id: 'button-system-user-reset-password',
    parentId: 'menu-system-user',
    name: '重置用户密码',
    type: 'BUTTON',
    permissionCode: 'system:user:reset-password',
    sort: 1004,
  },
  {
    id: 'button-system-user-assign-role',
    parentId: 'menu-system-user',
    name: '分配用户角色',
    type: 'BUTTON',
    permissionCode: 'system:user:assign-role',
    sort: 1005,
  },
  {
    id: 'menu-system-role',
    parentId: 'system-root',
    name: '角色管理',
    type: 'PAGE',
    path: '/admin/system/role',
    component: 'system/role/page',
    permissionCode: 'system:role:view',
    sort: 13,
  },
  {
    id: 'button-system-role-create',
    parentId: 'menu-system-role',
    name: '新增角色',
    type: 'BUTTON',
    permissionCode: 'system:role:create',
    sort: 1001,
  },
  {
    id: 'button-system-role-update',
    parentId: 'menu-system-role',
    name: '编辑角色',
    type: 'BUTTON',
    permissionCode: 'system:role:update',
    sort: 1002,
  },
  {
    id: 'button-system-role-delete',
    parentId: 'menu-system-role',
    name: '删除角色',
    type: 'BUTTON',
    permissionCode: 'system:role:delete',
    sort: 1003,
  },
  {
    id: 'button-system-role-assign-access',
    parentId: 'menu-system-role',
    name: '配置访问权限',
    type: 'BUTTON',
    permissionCode: 'system:role:assign-access',
    sort: 1004,
  },
  {
    id: 'button-system-role-assign-user',
    parentId: 'menu-system-role',
    name: '分配角色用户',
    type: 'BUTTON',
    permissionCode: 'system:role:assign-user',
    sort: 1005,
  },
  {
    id: 'menu-system-menu',
    parentId: 'system-root',
    name: '菜单与权限',
    type: 'PAGE',
    path: '/admin/system/menu',
    component: 'system/menu/page',
    permissionCode: 'system:menu:view',
    sort: 14,
  },
  {
    id: 'button-system-menu-create',
    parentId: 'menu-system-menu',
    name: '新增菜单或按钮',
    type: 'BUTTON',
    permissionCode: 'system:menu:create',
    sort: 1001,
  },
  {
    id: 'button-system-menu-update',
    parentId: 'menu-system-menu',
    name: '编辑菜单或按钮',
    type: 'BUTTON',
    permissionCode: 'system:menu:update',
    sort: 1002,
  },
  {
    id: 'button-system-menu-delete',
    parentId: 'menu-system-menu',
    name: '删除菜单或按钮',
    type: 'BUTTON',
    permissionCode: 'system:menu:delete',
    sort: 1003,
  },
  {
    id: 'menu-system-file',
    parentId: 'system-root',
    name: '文件管理',
    type: 'PAGE',
    path: '/admin/system/file',
    component: 'system/file/page',
    permissionCode: 'system:file:view',
    sort: 16,
  },
  {
    id: 'button-system-file-upload',
    parentId: 'menu-system-file',
    name: '上传文件',
    type: 'BUTTON',
    permissionCode: 'system:file:upload',
    sort: 1001,
  },
  {
    id: 'button-system-file-delete',
    parentId: 'menu-system-file',
    name: '删除文件',
    type: 'BUTTON',
    permissionCode: 'system:file:delete',
    sort: 1002,
  },
  {
    id: 'menu-system-log',
    parentId: 'system-root',
    name: '日志管理',
    type: 'DIR',
    sort: 90,
  },
  {
    id: 'menu-system-log-operation',
    parentId: 'menu-system-log',
    name: '操作日志',
    type: 'PAGE',
    path: '/admin/system/log/operation',
    component: 'system/log/operation/page',
    permissionCode: 'log:operation:view',
    sort: 91,
  },
  {
    id: 'button-system-log-operation-export',
    parentId: 'menu-system-log-operation',
    name: '导出操作日志',
    type: 'BUTTON',
    permissionCode: 'log:operation:export',
    sort: 1001,
  },
] as const;

async function main() {
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedAdminPassword || seedAdminPassword.length < 12) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required and must contain at least 12 characters',
    );
  }
  const passwordHash = await bcrypt.hash(seedAdminPassword, 12);

  const adminModule = await prisma.appModule.upsert({
    where: { code: 'admin' },
    update: {
      name: '后台管理',
      description: '系统内置后台管理模块',
      icon: 'LayoutDashboard',
      sort: 0,
      status: 'ENABLED',
      isSystem: true,
    },
    create: {
      id: adminModuleId,
      code: 'admin',
      name: '后台管理',
      description: '系统内置后台管理模块',
      icon: 'LayoutDashboard',
      sort: 0,
      status: 'ENABLED',
      isSystem: true,
    },
  });

  const superadmin = await prisma.role.upsert({
    where: { code: 'superadmin' },
    update: { name: '超级管理员', isSystem: true, status: 'ENABLED', sort: 1 },
    create: {
      code: 'superadmin',
      name: '超级管理员',
      isSystem: true,
      status: 'ENABLED',
      sort: 1,
    },
  });
  await prisma.role.upsert({
    where: { code: 'admin' },
    update: { name: '管理员', isSystem: true, status: 'ENABLED', sort: 2 },
    create: {
      code: 'admin',
      name: '管理员',
      isSystem: true,
      status: 'ENABLED',
      sort: 2,
    },
  });
  await prisma.role.upsert({
    where: { code: 'user' },
    update: { name: '普通用户', isSystem: true, status: 'ENABLED', sort: 3 },
    create: {
      code: 'user',
      name: '普通用户',
      isSystem: true,
      status: 'ENABLED',
      sort: 3,
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { nickname: '超级管理员', status: 'ENABLED' },
    create: {
      username: 'admin',
      passwordHash,
      nickname: '超级管理员',
      status: 'ENABLED',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superadmin.id } },
    update: {},
    create: { userId: admin.id, roleId: superadmin.id },
  });

  for (const menu of menus) {
    const isButton = menu.type === 'BUTTON';
    const permissionCode =
      'permissionCode' in menu ? menu.permissionCode : null;
    const data = {
      parentId: menu.parentId,
      moduleId: adminModule.id,
      name: menu.name,
      description: null,
      path: 'path' in menu ? menu.path : null,
      component: 'component' in menu ? menu.component : null,
      icon: null,
      sort: menu.sort,
      type: menu.type,
      permissionCode,
      visible: !isButton,
      status: 'ENABLED' as const,
      externalUrl: null,
      isSystem: true,
    };
    await prisma.menu.upsert({
      // Upgraded databases keep legacy Permission IDs for button menu nodes.
      // Permission codes are the stable identity shared by migration and seed.
      where: permissionCode ? { permissionCode } : { id: menu.id },
      update: data,
      create: { id: menu.id, ...data },
    });
  }

  await prisma.roleMenu.deleteMany({ where: { roleId: superadmin.id } });
  await prisma.roleModule.deleteMany({ where: { roleId: superadmin.id } });
}

main()
  .then(async () => {
    console.log('Seed completed for admin user');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
