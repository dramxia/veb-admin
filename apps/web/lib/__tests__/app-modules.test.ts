import { describe, expect, it } from 'vitest';
import type { MenuDto, MenuNode } from '@veb/api-contracts';
import { getMenuPageLoader } from '@/app/_modules/admin-page-manifest';
import {
  resolveAppModule,
  type WorkspaceAppModule,
} from '@/components/layout/app-modules';

function createMenu(
  id: string,
  path: string | null,
  type: MenuDto['type'] = 'PAGE',
  children: MenuNode[] = [],
): MenuNode {
  return {
    id,
    moduleId: 'module-admin',
    parentId: null,
    name: id,
    description: null,
    path,
    component: type === 'PAGE' ? 'example/page' : null,
    icon: null,
    sort: 0,
    type,
    permissionCode: type === 'DIR' ? null : `${id}:view`,
    visible: true,
    status: 'ENABLED',
    externalUrl: type === 'LINK' ? 'https://example.com' : null,
    children,
  } as MenuNode;
}

function createWorkspaceModule(
  overrides: Partial<WorkspaceAppModule> = {},
): WorkspaceAppModule {
  return {
    id: 'module-admin',
    code: 'admin',
    name: '后台',
    description: null,
    icon: null,
    sort: 0,
    status: 'ENABLED',
    isSystem: true,
    landingPath: '/admin',
    menus: [createMenu('dashboard', '/admin')],
    ...overrides,
  };
}

describe('app module routing', () => {
  it('loads the dashboard module home through the PAGE manifest', () => {
    expect(getMenuPageLoader('dashboard/page')).toBeTypeOf('function');
  });

  it('matches a single-segment PAGE only by its exact path', () => {
    const admin = createWorkspaceModule();

    expect(resolveAppModule('/admin', [admin])?.id).toBe(admin.id);
    expect(resolveAppModule('/admin/', [admin])?.id).toBe(admin.id);
    expect(resolveAppModule('/admin/settings/', [admin])).toBeUndefined();
  });

  it('matches dynamic descendants from a multi-segment PAGE path', () => {
    const admin = createWorkspaceModule({
      menus: [createMenu('settings', '/admin/settings')],
    });

    expect(resolveAppModule('/admin/settings', [admin])?.id).toBe(admin.id);
    expect(resolveAppModule('/admin/settings/profile/', [admin])?.id).toBe(
      admin.id,
    );
  });

  it('does not infer module ownership from its code or landing path', () => {
    const admin = createWorkspaceModule({
      menus: [createMenu('example', '/example')],
    });

    expect(resolveAppModule('/admin', [admin])).toBeUndefined();
  });

  it('prefers the module owning the longest matching PAGE path', () => {
    const admin = createWorkspaceModule({
      menus: [createMenu('reports', '/admin/reports')],
    });
    const reports = createWorkspaceModule({
      id: 'module-reports',
      code: 'reports',
      landingPath: '/admin/reports/monthly',
      menus: [createMenu('monthly-reports', '/admin/reports/monthly')],
    });

    expect(
      resolveAppModule('/admin/reports/monthly/2026', [admin, reports])?.id,
    ).toBe('module-reports');
  });

  it('keeps module context for an authorized page hidden from navigation', () => {
    const admin = createWorkspaceModule();
    const reports = createWorkspaceModule({
      id: 'module-reports',
      code: 'reports',
      landingPath: '/reports',
      menus: [createMenu('reports-home', '/reports')],
    });

    expect(
      resolveAppModule('/reports/hidden-detail', [admin, reports], reports.id)
        ?.id,
    ).toBe('module-reports');
  });

  it('ignores DIR, LINK, and BUTTON nodes when resolving a route', () => {
    const workspaceModule = createWorkspaceModule({
      menus: [
        createMenu('directory', '/directory', 'DIR'),
        createMenu('link', '/link', 'LINK'),
        createMenu('button', '/button', 'BUTTON'),
      ],
    });

    expect(resolveAppModule('/directory', [workspaceModule])).toBeUndefined();
    expect(resolveAppModule('/link', [workspaceModule])).toBeUndefined();
    expect(resolveAppModule('/button', [workspaceModule])).toBeUndefined();
  });

  it('only resolves modules supplied by the current navigation snapshot', () => {
    expect(resolveAppModule('/admin/system/user', [])).toBeUndefined();
    expect(
      resolveAppModule('/admin/system/user', [
        createWorkspaceModule({
          menus: [createMenu('users', '/admin/system/user')],
        }),
      ])?.code,
    ).toBe('admin');
  });
});
