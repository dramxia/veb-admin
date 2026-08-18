import type { ComponentType } from 'react';

type MenuPageLoader = () => Promise<{ default: ComponentType }>;

export const menuPageManifest: Record<string, MenuPageLoader> = {
  'dashboard/page': () => import('../(workspace)/dashboard/page'),
  'example/page': () => import('./example/page'),
  'system/user/page': () => import('../(workspace)/admin/system/user/page'),
  'system/role/page': () => import('../(workspace)/admin/system/role/page'),
  'system/menu/page': () => import('../(workspace)/admin/system/menu/page'),
  'system/module/page': () => import('../(workspace)/admin/system/module/page'),
  'system/file/page': () => import('../(workspace)/admin/system/file/page'),
  'system/log/operation/page': () =>
    import('../(workspace)/admin/system/log/operation/page'),
  'content/article/page': () =>
    import('../(workspace)/admin/content/article/page'),
  'content/tag/page': () => import('../(workspace)/admin/content/tag/page'),
  'content/like/page': () => import('../(workspace)/admin/content/like/page'),
};

export function getMenuPageLoader(component?: string | null) {
  if (!component) return null;
  return menuPageManifest[component] ?? null;
}

export const adminPageManifest = menuPageManifest;
export const getAdminPageLoader = getMenuPageLoader;
