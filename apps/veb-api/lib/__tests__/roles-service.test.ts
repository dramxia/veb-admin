import { Prisma } from '../../generated/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const roleFindUnique = vi.fn();
  const appModuleFindMany = vi.fn();
  const menuFindMany = vi.fn();
  const userFindMany = vi.fn();
  const tx = {
    role: { findUnique: roleFindUnique },
    appModule: { findMany: appModuleFindMany },
    menu: { findMany: menuFindMany },
    roleMenu: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    roleModule: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  };
  return {
    tx,
    roleFindUnique,
    appModuleFindMany,
    menuFindMany,
    userFindMany,
    transaction: vi.fn(),
  };
});

vi.mock('../prisma', () => ({
  prisma: {
    role: { findUnique: mocks.roleFindUnique },
    appModule: { findMany: mocks.appModuleFindMany },
    menu: { findMany: mocks.menuFindMany },
    user: { findMany: mocks.userFindMany },
    $transaction: mocks.transaction,
  },
}));

const {
  assignRoleAccess,
  assignRoleAccessWithAudit,
  getRole,
  getRoleAccessDetail,
  getRoleUserAssignmentDetail,
} = await import('../../src/modules/roles/service');

function page(
  id: string,
  moduleId = 'module-a',
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    moduleId,
    parentId: null,
    type: 'PAGE',
    path: `/${id}`,
    permissionCode: `${id}:view`,
    status: 'ENABLED',
    visible: true,
    ...overrides,
  };
}

function mockMenuQueries(selected: unknown[], hierarchy = selected) {
  mocks.menuFindMany
    .mockResolvedValueOnce(selected)
    .mockResolvedValueOnce(hierarchy);
}

describe('role access authorization service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction
      .mockReset()
      .mockImplementation(
        async (callback: (client: typeof mocks.tx) => unknown) =>
          callback(mocks.tx),
      );
  });

  it('atomically replaces modules and Menu grants after deduplication', async () => {
    const pageA = page('page-a');
    const buttonA = page('button-a', 'module-a', {
      parentId: 'page-a',
      type: 'BUTTON',
      path: null,
      permissionCode: 'page-a:update',
      visible: false,
    });
    mocks.roleFindUnique.mockResolvedValue({
      code: 'editor',
      modules: [{ moduleId: 'module-old', menus: [{ menuId: 'page-old' }] }],
    });
    mocks.appModuleFindMany.mockResolvedValue([
      { id: 'module-a', status: 'ENABLED' },
    ]);
    mockMenuQueries([pageA, buttonA]);

    await expect(
      assignRoleAccessWithAudit('role-1', [
        { moduleId: 'module-a', menuIds: ['page-a', 'button-a', 'page-a'] },
        { moduleId: 'module-a', menuIds: ['button-a'] },
      ]),
    ).resolves.toEqual({
      result: {
        id: 'role-1',
        modules: [{ moduleId: 'module-a', menuIds: ['page-a', 'button-a'] }],
      },
      audit: {
        before: [{ moduleId: 'module-old', menuIds: ['page-old'] }],
        after: [{ moduleId: 'module-a', menuIds: ['page-a', 'button-a'] }],
      },
    });

    expect(mocks.tx.roleMenu.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
    });
    expect(mocks.tx.roleModule.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
    });
    expect(mocks.tx.roleModule.createMany).toHaveBeenCalledWith({
      data: [{ roleId: 'role-1', moduleId: 'module-a' }],
      skipDuplicates: true,
    });
    expect(mocks.tx.roleMenu.createMany).toHaveBeenCalledWith({
      data: [
        { roleId: 'role-1', moduleId: 'module-a', menuId: 'page-a' },
        { roleId: 'role-1', moduleId: 'module-a', menuId: 'button-a' },
      ],
      skipDuplicates: true,
    });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('rejects a menu from another module without writing partial access', async () => {
    mocks.roleFindUnique.mockResolvedValue({ code: 'editor', modules: [] });
    mocks.appModuleFindMany.mockResolvedValue([
      { id: 'module-a', status: 'ENABLED' },
    ]);
    mockMenuQueries([page('page-b', 'module-b')], [page('page-a', 'module-a')]);

    await expect(
      assignRoleAccess('role-1', [
        { moduleId: 'module-a', menuIds: ['page-b'] },
      ]),
    ).rejects.toMatchObject({ message: '菜单或按钮不属于指定模块' });
    expect(mocks.tx.roleMenu.deleteMany).not.toHaveBeenCalled();
    expect(mocks.tx.roleModule.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects assigning a directory directly', async () => {
    const directory = page('dir-a', 'module-a', {
      type: 'DIR',
      path: null,
      permissionCode: null,
    });
    mocks.roleFindUnique.mockResolvedValue({ code: 'editor', modules: [] });
    mocks.appModuleFindMany.mockResolvedValue([
      { id: 'module-a', status: 'ENABLED' },
    ]);
    mockMenuQueries([directory]);

    await expect(
      assignRoleAccess('role-1', [
        { moduleId: 'module-a', menuIds: ['dir-a'] },
      ]),
    ).rejects.toMatchObject({ message: '目录不能直接分配给角色' });
    expect(mocks.tx.roleMenu.deleteMany).not.toHaveBeenCalled();
  });

  it('requires a selected BUTTON to include its direct parent PAGE', async () => {
    const pageA = page('page-a');
    const buttonA = page('button-a', 'module-a', {
      parentId: 'page-a',
      type: 'BUTTON',
      path: null,
      permissionCode: 'page-a:update',
      visible: false,
    });
    mocks.roleFindUnique.mockResolvedValue({ code: 'editor', modules: [] });
    mocks.appModuleFindMany.mockResolvedValue([
      { id: 'module-a', status: 'ENABLED' },
    ]);
    mockMenuQueries([buttonA], [pageA, buttonA]);

    await expect(
      assignRoleAccess('role-1', [
        { moduleId: 'module-a', menuIds: ['button-a'] },
      ]),
    ).rejects.toMatchObject({
      message: '勾选按钮时必须同时勾选所属页面',
    });
    expect(mocks.tx.roleMenu.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects a module without an enabled and visible authorized PAGE', async () => {
    const directory = page('dir-disabled', 'module-a', {
      type: 'DIR',
      path: null,
      permissionCode: null,
      status: 'DISABLED',
    });
    const pageA = page('page-a', 'module-a', { parentId: 'dir-disabled' });
    mocks.roleFindUnique.mockResolvedValue({ code: 'editor', modules: [] });
    mocks.appModuleFindMany.mockResolvedValue([
      { id: 'module-a', status: 'ENABLED' },
    ]);
    mockMenuQueries([pageA], [directory, pageA]);

    await expect(
      assignRoleAccess('role-1', [
        { moduleId: 'module-a', menuIds: ['page-a'] },
      ]),
    ).rejects.toMatchObject({
      message: '每个已分配模块至少需要一个可用的入口页面',
    });
    expect(mocks.tx.roleMenu.deleteMany).not.toHaveBeenCalled();
  });

  it('removes all module and menu grants in one replacement', async () => {
    mocks.roleFindUnique.mockResolvedValue({
      code: 'editor',
      modules: [{ moduleId: 'module-a', menus: [{ menuId: 'page-a' }] }],
    });

    await expect(assignRoleAccess('role-1', [])).resolves.toEqual({
      id: 'role-1',
      modules: [],
    });

    expect(mocks.tx.roleMenu.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
    });
    expect(mocks.tx.roleModule.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
    });
    expect(mocks.tx.roleMenu.createMany).not.toHaveBeenCalled();
    expect(mocks.tx.roleModule.createMany).not.toHaveBeenCalled();
  });

  it('keeps superadmin access immutable', async () => {
    mocks.roleFindUnique.mockResolvedValue({
      code: 'superadmin',
      modules: [],
    });

    await expect(assignRoleAccess('root-role', [])).rejects.toMatchObject({
      message: '超级管理员访问权限不可修改',
    });
    expect(mocks.tx.roleMenu.deleteMany).not.toHaveBeenCalled();
    expect(mocks.tx.roleModule.deleteMany).not.toHaveBeenCalled();
  });

  it('retries a serialization conflict with a fresh transaction', async () => {
    mocks.transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('serialization conflict', {
        code: 'P2034',
        clientVersion: 'test',
      }),
    );
    mocks.roleFindUnique.mockResolvedValue({ code: 'editor', modules: [] });

    await expect(assignRoleAccess('role-1', [])).resolves.toEqual({
      id: 'role-1',
      modules: [],
    });

    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.transaction).toHaveBeenNthCalledWith(1, expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(mocks.transaction).toHaveBeenNthCalledWith(2, expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('keeps role:view detail limited to the base role projection', async () => {
    const role = {
      id: 'role-1',
      code: 'editor',
      name: '编辑角色',
      description: null,
      status: 'ENABLED',
      sort: 0,
      isSystem: false,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      _count: { users: 1, menus: 2, modules: 1 },
    };
    mocks.roleFindUnique.mockResolvedValue(role);

    await expect(getRole('role-1')).resolves.toEqual(role);
    const query = mocks.roleFindUnique.mock.calls.at(-1)?.[0];
    expect(query.select).toEqual(
      expect.objectContaining({
        id: true,
        code: true,
        _count: expect.anything(),
      }),
    );
    expect(query.select).not.toHaveProperty('users');
    expect(query.select).not.toHaveProperty('modules');
    expect(query.select).not.toHaveProperty('menus');
  });

  it('returns enabled implicit modules and effective Menu grants for superadmin', async () => {
    const moduleRecord = {
      id: 'module-a',
      name: '示例模块',
      status: 'ENABLED',
    };
    const directory = {
      ...page('dir-a'),
      name: '目录',
      sort: 0,
      type: 'DIR',
      path: null,
      permissionCode: null,
    };
    const pageA = { ...page('page-a'), name: '页面', sort: 1 };
    const buttonA = {
      ...page('button-a', 'module-a', {
        parentId: 'page-a',
        type: 'BUTTON',
        path: null,
        permissionCode: 'page-a:update',
        visible: false,
      }),
      name: '编辑',
      sort: 2,
    };
    const disabledPage = {
      ...page('page-disabled', 'module-a', { status: 'DISABLED' }),
      name: '禁用页面',
      sort: 3,
    };
    mocks.roleFindUnique.mockResolvedValue({
      id: 'root-role',
      code: 'superadmin',
      modules: [],
    });
    mocks.appModuleFindMany.mockResolvedValue([moduleRecord]);
    mocks.menuFindMany.mockResolvedValue([
      directory,
      pageA,
      buttonA,
      disabledPage,
    ]);

    const detail = await getRoleAccessDetail('root-role');
    expect(detail.assignments).toEqual([
      {
        moduleId: 'module-a',
        menuIds: ['page-a', 'button-a'],
      },
    ]);
    expect(mocks.appModuleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, name: true, status: true },
      }),
    );
  });

  it('returns access assignments and selectable modules and menus together', async () => {
    const pageA = {
      ...page('page-a'),
      name: '页面 A',
      sort: 2,
      externalUrl: null,
    };
    const buttonA = {
      ...page('button-a', 'module-a', {
        parentId: 'page-a',
        type: 'BUTTON',
        path: null,
        permissionCode: 'page-a:update',
        visible: false,
      }),
      name: '编辑',
      sort: 3,
      externalUrl: null,
    };
    const directory = {
      ...page('dir-a'),
      name: '目录',
      sort: 1,
      type: 'DIR',
      path: null,
      permissionCode: null,
      externalUrl: null,
    };
    mocks.roleFindUnique.mockResolvedValue({
      id: 'role-1',
      code: 'editor',
      modules: [
        {
          moduleId: 'module-a',
          menus: [{ menuId: 'button-a' }, { menuId: 'page-a' }],
        },
      ],
    });
    mocks.appModuleFindMany.mockResolvedValue([
      { id: 'module-a', name: '模块 A', status: 'ENABLED' },
    ]);
    mocks.menuFindMany.mockResolvedValue([directory, pageA, buttonA]);

    await expect(getRoleAccessDetail('role-1')).resolves.toEqual({
      id: 'role-1',
      assignments: [
        {
          moduleId: 'module-a',
          menuIds: ['page-a', 'button-a'],
        },
      ],
      modules: [
        {
          id: 'module-a',
          name: '模块 A',
          status: 'ENABLED',
          _count: { menus: 2, buttons: 1 },
        },
      ],
      menus: [directory, pageA, buttonA],
    });
    expect(mocks.appModuleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.any(Object) }),
    );
    expect(mocks.menuFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.any(Object) }),
    );
  });

  it('returns only the user fields needed by the role assignment drawer', async () => {
    mocks.roleFindUnique.mockResolvedValue({
      id: 'role-1',
      users: [{ userId: 'user-b' }],
    });
    mocks.userFindMany.mockResolvedValue([
      {
        id: 'user-a',
        username: 'alice',
        nickname: 'Alice',
        status: 'ENABLED',
      },
      {
        id: 'user-b',
        username: 'bob',
        nickname: null,
        status: 'DISABLED',
      },
    ]);

    await expect(getRoleUserAssignmentDetail('role-1')).resolves.toEqual({
      id: 'role-1',
      userIds: ['user-b'],
      users: [
        {
          id: 'user-a',
          username: 'alice',
          nickname: 'Alice',
          status: 'ENABLED',
        },
        {
          id: 'user-b',
          username: 'bob',
          nickname: null,
          status: 'DISABLED',
        },
      ],
    });
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      select: {
        id: true,
        username: true,
        nickname: true,
        status: true,
      },
      orderBy: [{ username: 'asc' }, { id: 'asc' }],
    });
  });
});
