import type { ComponentType } from 'react';

type AdminPageLoader = () => Promise<{ default: ComponentType }>;

export const adminPageManifest: Record<string, AdminPageLoader> = {
  'example/page': () => import('./example/page'),
  'system/user/page': () => import('../(workspace)/admin/system/user/page'),
  'system/role/page': () => import('../(workspace)/admin/system/role/page'),
  'system/permission/page': () =>
    import('../(workspace)/admin/system/permission/page'),
  'system/menu/page': () => import('../(workspace)/admin/system/menu/page'),
  'system/file/page': () => import('../(workspace)/admin/system/file/page'),
  'system/log/operation/page': () =>
    import('../(workspace)/admin/system/log/operation/page'),
  'content/article/page': () =>
    import('../(workspace)/admin/content/article/page'),
  'content/tag/page': () => import('../(workspace)/admin/content/tag/page'),
  'content/like/page': () => import('../(workspace)/admin/content/like/page'),
};

export function getAdminPageLoader(component?: string | null) {
  if (!component) return null;
  return adminPageManifest[component] ?? null;
}
