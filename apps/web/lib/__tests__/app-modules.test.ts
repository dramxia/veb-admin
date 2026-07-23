import { describe, expect, it } from 'vitest';
import {
  ADMIN_BASE_PATH,
  appModules,
  DEFAULT_AUTHENTICATED_PATH,
  isModulePath,
  resolveAppModule,
  type AppModuleDefinition,
} from '@/components/layout/app-modules';

const plainRootModule: AppModuleDefinition = {
  id: 'home',
  label: '主页',
  basePath: '/',
  homePath: '/',
  shell: 'plain',
  capabilities: {
    sidebarToggle: false,
    menuSearch: false,
  },
};

describe('app module routing', () => {
  it('registers the admin module as the authenticated default', () => {
    expect(ADMIN_BASE_PATH).toBe('/admin');
    expect(DEFAULT_AUTHENTICATED_PATH).toBe('/admin');
    expect(appModules).toContainEqual(
      expect.objectContaining({
        id: 'admin',
        basePath: '/admin',
        homePath: '/admin',
        shell: 'sidebar',
      }),
    );
  });

  it('matches a module root, descendants, and trailing slashes', () => {
    const admin = appModules[0];

    expect(isModulePath('/admin', admin)).toBe(true);
    expect(isModulePath('/admin/', admin)).toBe(true);
    expect(isModulePath('/admin/system/user/', admin)).toBe(true);
  });

  it('does not match a sibling path with the same prefix', () => {
    const admin = appModules[0];

    expect(isModulePath('/administrator', admin)).toBe(false);
    expect(isModulePath('/administration/users', admin)).toBe(false);
  });

  it('allows a root module to own otherwise unmatched workspace paths', () => {
    expect(isModulePath('/', plainRootModule)).toBe(true);
    expect(isModulePath('/reports/weekly', plainRootModule)).toBe(true);
  });

  it('prefers the module with the longest matching base path', () => {
    const reportsModule: AppModuleDefinition = {
      ...plainRootModule,
      id: 'reports',
      label: '报表',
      basePath: '/admin/reports',
      homePath: '/admin/reports',
    };

    expect(
      resolveAppModule('/admin/reports/monthly', [
        plainRootModule,
        appModules[0],
        reportsModule,
      ])?.id,
    ).toBe('reports');
  });

  it('resolves admin descendants and rejects unknown paths', () => {
    expect(resolveAppModule('/admin/system/user')?.id).toBe('admin');
    expect(resolveAppModule('/admin/')?.homePath).toBe('/admin');
    expect(resolveAppModule('/unknown')).toBeUndefined();
  });
});
