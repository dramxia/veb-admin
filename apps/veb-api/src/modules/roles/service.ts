import type { z } from 'zod';
import type {
  RoleAccessUpdateInput,
  RoleListQuery as RoleListContractQuery,
} from '@veb/api-contracts';
import { Prisma } from '@/generated/client';
import { ConflictError, NotFoundError, ParamError } from '@/lib/errors';
import { createMenuHierarchy } from '@/lib/menu-hierarchy';
import { prisma } from '@/lib/prisma';
import { withSerializableRetry } from '@/lib/prisma-transaction';
import { roleSchema, roleUpdateSchema } from '@/lib/validation';
import { assertRolesAssignable } from '@/src/modules/role-assignment/policy';

type RoleCreateData = z.infer<typeof roleSchema>;
type RoleUpdateData = z.infer<typeof roleUpdateSchema>;

type RoleListQuery = RoleListContractQuery & {
  skip: number;
};

const systemRoleCodes = ['superadmin', 'admin', 'user'];

const roleSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  status: true,
  sort: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { users: true, menus: true, modules: true } },
} satisfies Prisma.RoleSelect;

const roleAccessModuleOptionSelect = {
  id: true,
  name: true,
  status: true,
} satisfies Prisma.AppModuleSelect;

const roleAccessMenuOptionSelect = {
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
} satisfies Prisma.MenuSelect;

const roleUserOptionSelect = {
  id: true,
  username: true,
  nickname: true,
  status: true,
} satisfies Prisma.UserSelect;

export async function listRoles({
  page,
  pageSize,
  skip,
  keyword,
  status,
}: RoleListQuery) {
  const where: Prisma.RoleWhereInput = {
    ...(status
      ? { status: status as Prisma.EnumCommonStatusFilter['equals'] }
      : {}),
    ...(keyword
      ? {
          OR: [
            { code: { contains: keyword } },
            { name: { contains: keyword } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.role.count({ where }),
    prisma.role.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      select: roleSelect,
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function createRole(data: RoleCreateData) {
  const exists = await prisma.role.findUnique({ where: { code: data.code } });
  if (exists) throw new ConflictError('角色编码已存在');
  return prisma.role.create({ data, select: roleSelect });
}

export async function getRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    select: roleSelect,
  });
  if (!role) throw new NotFoundError('角色不存在');
  return role;
}

export async function getRoleAccessDetail(id: string) {
  const [role, moduleRecords, menus] = await Promise.all([
    prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        modules: {
          select: {
            moduleId: true,
            menus: { select: { menuId: true } },
          },
        },
      },
    }),
    prisma.appModule.findMany({
      select: roleAccessModuleOptionSelect,
      orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    }),
    prisma.menu.findMany({
      select: roleAccessMenuOptionSelect,
      orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    }),
  ]);
  if (!role) throw new NotFoundError('角色不存在');

  const menuCounts = new Map<string, { menus: number; buttons: number }>();
  for (const menu of menus) {
    const counts = menuCounts.get(menu.moduleId) ?? { menus: 0, buttons: 0 };
    if (menu.type === 'BUTTON') counts.buttons += 1;
    else counts.menus += 1;
    menuCounts.set(menu.moduleId, counts);
  }

  const modules = moduleRecords.map((module) => ({
    ...module,
    _count: menuCounts.get(module.id) ?? { menus: 0, buttons: 0 },
  }));
  const moduleOrder = new Map(
    modules.map((module, index) => [module.id, index] as const),
  );
  const menuOrder = new Map(
    menus.map((menu, index) => [menu.id, index] as const),
  );

  const assignments =
    role.code === 'superadmin'
      ? modules
          .filter((module) => module.status === 'ENABLED')
          .map((module) => {
            const moduleMenus = menus.filter(
              (menu) => menu.moduleId === module.id,
            );
            const hierarchy = createMenuHierarchy(moduleMenus);
            return {
              moduleId: module.id,
              menuIds: moduleMenus
                .filter(
                  (menu) =>
                    menu.type !== 'DIR' &&
                    Boolean(menu.permissionCode) &&
                    hierarchy.isEnabled(menu.id),
                )
                .map((menu) => menu.id),
            };
          })
      : role.modules
          .map((assignment) => ({
            moduleId: assignment.moduleId,
            menuIds: assignment.menus
              .map((menu) => menu.menuId)
              .sort(
                (left, right) =>
                  (menuOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
                    (menuOrder.get(right) ?? Number.MAX_SAFE_INTEGER) ||
                  left.localeCompare(right),
              ),
          }))
          .sort(
            (left, right) =>
              (moduleOrder.get(left.moduleId) ?? Number.MAX_SAFE_INTEGER) -
                (moduleOrder.get(right.moduleId) ?? Number.MAX_SAFE_INTEGER) ||
              left.moduleId.localeCompare(right.moduleId),
          );

  return { id: role.id, assignments, modules, menus };
}

export async function getRoleUserAssignmentDetail(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    select: {
      id: true,
      users: { select: { userId: true } },
    },
  });
  if (!role) throw new NotFoundError('角色不存在');

  const users = await prisma.user.findMany({
    select: roleUserOptionSelect,
    orderBy: [{ username: 'asc' }, { id: 'asc' }],
  });
  const assignedUserIds = new Set(
    role.users.map((assignment) => assignment.userId),
  );
  return {
    id: role.id,
    userIds: users
      .filter((user) => assignedUserIds.has(user.id))
      .map((user) => user.id),
    users,
  };
}

export async function updateRole(id: string, data: RoleUpdateData) {
  const old = await prisma.role.findUnique({ where: { id } });
  if (!old) throw new NotFoundError('角色不存在');
  const safeData = old.isSystem ? { ...data, code: undefined } : data;
  const role = await prisma.role.update({ where: { id }, data: safeData });
  return role;
}

export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) throw new NotFoundError('角色不存在');
  if (role.isSystem || systemRoleCodes.includes(role.code))
    throw new ConflictError('内置角色不可删除');
  if (role._count.users > 0)
    throw new ConflictError('角色已关联用户，不能删除');
  await prisma.role.delete({ where: { id } });
  return { id };
}

function normalizeRoleAccess(modules: RoleAccessUpdateInput['modules']) {
  const menuIdsByModule = new Map<string, Set<string>>();
  for (const assignment of modules) {
    const menuIds =
      menuIdsByModule.get(assignment.moduleId) ?? new Set<string>();
    for (const menuId of assignment.menuIds) menuIds.add(menuId);
    menuIdsByModule.set(assignment.moduleId, menuIds);
  }
  return [...menuIdsByModule].map(([moduleId, menuIds]) => ({
    moduleId,
    menuIds: [...menuIds],
  }));
}

async function replaceRoleAccess(
  id: string,
  requestedModules: RoleAccessUpdateInput['modules'],
) {
  const modules = normalizeRoleAccess(requestedModules);
  const moduleIds = modules.map((module) => module.moduleId);
  const requestedMenuIds = [
    ...new Set(modules.flatMap((module) => module.menuIds)),
  ];

  const before = await withSerializableRetry(async (tx) => {
    const role = await tx.role.findUnique({
      where: { id },
      select: {
        code: true,
        modules: {
          select: {
            moduleId: true,
            menus: { select: { menuId: true } },
          },
        },
      },
    });
    if (!role) throw new NotFoundError('角色不存在');
    if (role.code === 'superadmin')
      throw new ConflictError('超级管理员访问权限不可修改');

    const previousModules = role.modules
      .map((assignment) => ({
        moduleId: assignment.moduleId,
        menuIds: assignment.menus
          .map((menu) => menu.menuId)
          .sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.moduleId.localeCompare(b.moduleId));

    const [moduleRecords, selectedMenus, hierarchyMenus] = await Promise.all([
      moduleIds.length
        ? tx.appModule.findMany({
            where: { id: { in: moduleIds } },
            select: { id: true, status: true },
          })
        : Promise.resolve([]),
      requestedMenuIds.length
        ? tx.menu.findMany({
            where: { id: { in: requestedMenuIds } },
            select: {
              id: true,
              moduleId: true,
              parentId: true,
              type: true,
              path: true,
              permissionCode: true,
              status: true,
              visible: true,
            },
          })
        : Promise.resolve([]),
      moduleIds.length
        ? tx.menu.findMany({
            where: { moduleId: { in: moduleIds } },
            select: {
              id: true,
              moduleId: true,
              parentId: true,
              type: true,
              path: true,
              permissionCode: true,
              status: true,
              visible: true,
            },
          })
        : Promise.resolve([]),
    ]);

    if (moduleRecords.length !== moduleIds.length)
      throw new ParamError('模块不存在');
    if (selectedMenus.length !== requestedMenuIds.length)
      throw new ParamError('菜单或按钮不存在');

    const moduleById = new Map(
      moduleRecords.map((module) => [module.id, module]),
    );
    const menuById = new Map(selectedMenus.map((menu) => [menu.id, menu]));
    const hierarchy = createMenuHierarchy(hierarchyMenus);

    for (const assignment of modules) {
      const selectedIds = new Set(assignment.menuIds);
      for (const menuId of assignment.menuIds) {
        const menu = menuById.get(menuId)!;
        if (menu.moduleId !== assignment.moduleId)
          throw new ParamError('菜单或按钮不属于指定模块');
        if (menu.type === 'DIR') throw new ParamError('目录不能直接分配给角色');
        if (!menu.permissionCode)
          throw new ParamError('分配的菜单或按钮缺少权限码');
        if (menu.type === 'BUTTON' && !selectedIds.has(menu.parentId ?? ''))
          throw new ParamError('勾选按钮时必须同时勾选所属页面');
      }

      const appModule = moduleById.get(assignment.moduleId)!;
      const hasLandingPage =
        appModule.status === 'ENABLED' &&
        assignment.menuIds.some((menuId) => {
          const menu = menuById.get(menuId)!;
          return (
            menu.type === 'PAGE' &&
            Boolean(menu.path && menu.permissionCode) &&
            hierarchy.isEnabled(menu.id) &&
            hierarchy.isVisible(menu.id)
          );
        });
      if (!hasLandingPage)
        throw new ParamError('每个已分配模块至少需要一个可用的入口页面');
    }

    await tx.roleMenu.deleteMany({ where: { roleId: id } });
    await tx.roleModule.deleteMany({ where: { roleId: id } });
    if (moduleIds.length) {
      await tx.roleModule.createMany({
        data: moduleIds.map((moduleId) => ({ roleId: id, moduleId })),
        skipDuplicates: true,
      });
    }
    if (requestedMenuIds.length) {
      await tx.roleMenu.createMany({
        data: modules.flatMap((module) =>
          module.menuIds.map((menuId) => ({
            roleId: id,
            moduleId: module.moduleId,
            menuId,
          })),
        ),
        skipDuplicates: true,
      });
    }
    return previousModules;
  });

  return {
    result: { id, modules },
    audit: { before, after: modules },
  };
}

export async function assignRoleAccess(
  id: string,
  requestedModules: RoleAccessUpdateInput['modules'],
) {
  return (await replaceRoleAccess(id, requestedModules)).result;
}

export async function assignRoleAccessWithAudit(
  id: string,
  requestedModules: RoleAccessUpdateInput['modules'],
) {
  return replaceRoleAccess(id, requestedModules);
}

export async function assignRoleUsers(
  actorId: string,
  id: string,
  requestedUserIds: string[],
) {
  await assertRolesAssignable(actorId, [id]);
  const userIds = [...new Set(requestedUserIds)];
  const [role, userCount] = await Promise.all([
    prisma.role.findUnique({ where: { id }, select: { id: true } }),
    userIds.length
      ? prisma.user.count({ where: { id: { in: userIds } } })
      : Promise.resolve(0),
  ]);
  if (!role) throw new NotFoundError('角色不存在');
  if (userCount !== userIds.length) throw new ParamError('用户不存在');

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { roleId: id } });
    if (userIds.length) {
      await tx.userRole.createMany({
        data: userIds.map((userId) => ({ userId, roleId: id })),
        skipDuplicates: true,
      });
    }
  });
  return { id, userIds };
}
