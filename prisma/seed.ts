import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  ['content:view', '内容管理', 'MENU'],
  ['content:article:view', '文章管理', 'MENU'],
  ['content:article:create', '新增文章', 'BUTTON'],
  ['content:article:update', '编辑文章', 'BUTTON'],
  ['content:article:delete', '删除文章', 'BUTTON'],
  ['content:article:publish', '发布文章', 'BUTTON'],
  ['content:tag:view', '标签管理', 'MENU'],
  ['content:tag:create', '新增标签', 'BUTTON'],
  ['content:tag:update', '编辑标签', 'BUTTON'],
  ['content:tag:delete', '删除标签', 'BUTTON'],
  ['content:tag:assign', '关联标签', 'BUTTON'],
  ['content:like:view', '喜欢记录', 'MENU'],
  ['content:like:stats', '喜欢统计', 'BUTTON'],
  ['content:like:delete', '删除喜欢记录', 'BUTTON'],
  ['system:view', '系统管理', 'MENU'],
  ['system:user:view', '用户管理', 'MENU'],
  ['system:user:create', '新增用户', 'BUTTON'],
  ['system:user:update', '编辑用户', 'BUTTON'],
  ['system:user:delete', '删除用户', 'BUTTON'],
  ['system:user:reset-password', '重置用户密码', 'BUTTON'],
  ['system:user:assign-role', '分配用户角色', 'BUTTON'],
  ['system:role:view', '角色管理', 'MENU'],
  ['system:role:create', '新增角色', 'BUTTON'],
  ['system:role:update', '编辑角色', 'BUTTON'],
  ['system:role:delete', '删除角色', 'BUTTON'],
  ['system:role:assign-permission', '分配角色权限', 'BUTTON'],
  ['system:role:assign-user', '分配角色用户', 'BUTTON'],
  ['system:permission:view', '权限管理', 'MENU'],
  ['system:permission:create', '新增权限', 'BUTTON'],
  ['system:permission:update', '编辑权限', 'BUTTON'],
  ['system:permission:delete', '删除权限', 'BUTTON'],
  ['system:menu:view', '菜单管理', 'MENU'],
  ['system:menu:create', '新增菜单', 'BUTTON'],
  ['system:menu:update', '编辑菜单', 'BUTTON'],
  ['system:menu:delete', '删除菜单', 'BUTTON'],
  ['system:file:view', '文件管理', 'MENU'],
  ['system:file:upload', '上传文件', 'BUTTON'],
  ['system:file:delete', '删除文件', 'BUTTON'],
  ['log:operation:view', '操作日志', 'MENU'],
  ['log:operation:export', '导出操作日志', 'BUTTON'],
] as const;

const menus = [
  {
    id: 'menu-dashboard',
    path: '/',
    name: '仪表盘',
    type: 'PAGE',
    permissionCode: null,
    sort: 0,
    component: null,
    parentId: null,
  },
  {
    id: 'content-root',
    path: '/content',
    name: '内容管理',
    type: 'DIR',
    permissionCode: 'content:view',
    sort: 5,
    component: null,
    parentId: null,
  },
  {
    id: 'menu-content-article',
    path: '/content/article',
    name: '文章管理',
    type: 'PAGE',
    permissionCode: 'content:article:view',
    sort: 6,
    component: 'content/article/page',
    parentId: 'content-root',
  },
  {
    id: 'menu-content-tag',
    path: '/content/tag',
    name: '标签管理',
    type: 'PAGE',
    permissionCode: 'content:tag:view',
    sort: 7,
    component: 'content/tag/page',
    parentId: 'content-root',
  },
  {
    id: 'menu-content-like',
    path: '/content/like',
    name: '喜欢记录',
    type: 'PAGE',
    permissionCode: 'content:like:view',
    sort: 8,
    component: 'content/like/page',
    parentId: 'content-root',
  },
  {
    id: 'system-root',
    path: '/system',
    name: '系统管理',
    type: 'DIR',
    permissionCode: 'system:view',
    sort: 10,
    component: null,
    parentId: null,
  },
  {
    id: 'menu-system-user',
    path: '/system/user',
    name: '用户管理',
    type: 'PAGE',
    permissionCode: 'system:user:view',
    sort: 11,
    component: 'system/user/page',
    parentId: 'system-root',
  },
  {
    id: 'menu-system-role',
    path: '/system/role',
    name: '角色管理',
    type: 'PAGE',
    permissionCode: 'system:role:view',
    sort: 12,
    component: 'system/role/page',
    parentId: 'system-root',
  },
  {
    id: 'menu-system-permission',
    path: '/system/permission',
    name: '权限管理',
    type: 'PAGE',
    permissionCode: 'system:permission:view',
    sort: 13,
    component: 'system/permission/page',
    parentId: 'system-root',
  },
  {
    id: 'menu-system-menu',
    path: '/system/menu',
    name: '菜单管理',
    type: 'PAGE',
    permissionCode: 'system:menu:view',
    sort: 14,
    component: 'system/menu/page',
    parentId: 'system-root',
  },
  {
    id: 'menu-system-file',
    path: '/system/file',
    name: '文件管理',
    type: 'PAGE',
    permissionCode: 'system:file:view',
    sort: 15,
    component: 'system/file/page',
    parentId: 'system-root',
  },
  {
    id: 'menu-system-log',
    path: '/system/log',
    name: '日志管理',
    type: 'DIR',
    permissionCode: 'log:operation:view',
    sort: 90,
    component: null,
    parentId: 'system-root',
  },
  {
    id: 'menu-system-log-operation',
    path: '/system/log/operation',
    name: '操作日志',
    type: 'PAGE',
    permissionCode: 'log:operation:view',
    sort: 91,
    component: 'system/log/operation/page',
    parentId: 'menu-system-log',
  },
  {
    id: 'menu-profile',
    path: '/profile',
    name: '个人中心',
    type: 'PAGE',
    permissionCode: null,
    sort: 9999,
    component: null,
    parentId: null,
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);

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
    update: { passwordHash, nickname: '超级管理员', status: 'ENABLED' },
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

  for (const [code, name, type] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name, type, isSystem: true },
      create: { code, name, type, isSystem: true },
    });
  }

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { id: menu.id },
      update: {
        parentId: menu.parentId,
        name: menu.name,
        path: menu.path,
        type: menu.type,
        permissionCode: menu.permissionCode,
        sort: menu.sort,
        component: menu.component,
        visible: true,
        status: 'ENABLED',
        isSystem: true,
      },
      create: {
        id: menu.id,
        parentId: menu.parentId,
        name: menu.name,
        path: menu.path,
        type: menu.type,
        permissionCode: menu.permissionCode,
        sort: menu.sort,
        component: menu.component,
        visible: true,
        status: 'ENABLED',
        isSystem: true,
      },
    });
  }

  const allPermissions = await prisma.permission.findMany({
    select: { id: true },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: superadmin.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((permission) => ({
      roleId: superadmin.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    console.log('Seed completed. admin / Admin@123');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
