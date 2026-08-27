import type { RoleAccessUpdateInput } from '@veb/api-contracts';
import { ParamError, PermissionError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { getUserPermissionSnapshot } from '@/src/modules/navigation/service';

const SUPERADMIN_ROLE_CODE = 'superadmin';

function unique(values: readonly string[]) {
  return [...new Set(values)];
}

function assertCovered(values: Iterable<string>, allowed: ReadonlySet<string>) {
  for (const value of values) {
    if (!allowed.has(value)) {
      throw new PermissionError('不能授予超出自身有效权限范围的角色');
    }
  }
}

export async function assertRolesAssignable(
  actorId: string,
  requestedRoleIds: readonly string[],
) {
  const roleIds = unique(requestedRoleIds);
  if (!roleIds.length) return;

  const [actor, roles] = await Promise.all([
    getUserPermissionSnapshot(actorId),
    prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: {
        id: true,
        code: true,
        modules: { select: { moduleId: true } },
        menus: {
          select: {
            moduleId: true,
            menu: { select: { permissionCode: true } },
          },
        },
      },
    }),
  ]);

  if (roles.length !== roleIds.length) throw new ParamError('角色不存在');
  if (actor.roleCodes.includes(SUPERADMIN_ROLE_CODE)) return;

  const actorModuleIds = new Set(actor.moduleIds);
  const actorPermissionCodes = new Set(actor.permissionCodes);
  for (const role of roles) {
    if (role.code === SUPERADMIN_ROLE_CODE) {
      throw new PermissionError('只有超级管理员可以分配超级管理员角色');
    }

    const roleModuleIds = new Set(
      role.modules.map((assignment) => assignment.moduleId),
    );
    assertCovered(roleModuleIds, actorModuleIds);
    assertCovered(
      role.menus.flatMap((assignment) =>
        roleModuleIds.has(assignment.moduleId) && assignment.menu.permissionCode
          ? [assignment.menu.permissionCode]
          : [],
      ),
      actorPermissionCodes,
    );
  }
}

export async function assertRoleAccessAssignable(
  actorId: string,
  requestedModules: RoleAccessUpdateInput['modules'],
) {
  const actor = await getUserPermissionSnapshot(actorId);
  if (actor.roleCodes.includes(SUPERADMIN_ROLE_CODE)) return;

  const moduleIds = unique(
    requestedModules.map((assignment) => assignment.moduleId),
  );
  const menuIds = unique(
    requestedModules.flatMap((assignment) => assignment.menuIds),
  );
  const actorModuleIds = new Set(actor.moduleIds);
  assertCovered(moduleIds, actorModuleIds);

  const menus = menuIds.length
    ? await prisma.menu.findMany({
        where: { id: { in: menuIds } },
        select: { permissionCode: true },
      })
    : [];
  const actorPermissionCodes = new Set(actor.permissionCodes);
  assertCovered(
    menus.flatMap((menu) => (menu.permissionCode ? [menu.permissionCode] : [])),
    actorPermissionCodes,
  );
}
