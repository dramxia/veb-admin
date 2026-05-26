import type { ComponentType } from 'react';

type ModuleLoader = () => Promise<{ default: ComponentType }>;

export const moduleManifest: Record<string, ModuleLoader> = {
  'example/page': () => import('./example/page'),
  'system/user/page': () => import('../(dashboard)/system/user/page'),
  'system/role/page': () => import('../(dashboard)/system/role/page'),
  'system/permission/page': () => import('../(dashboard)/system/permission/page'),
  'system/menu/page': () => import('../(dashboard)/system/menu/page'),
  'system/file/page': () => import('../(dashboard)/system/file/page'),
  'system/log/operation/page': () => import('../(dashboard)/system/log/operation/page'),
};

export function getModuleLoader(component?: string | null) {
  if (!component) return null;
  return moduleManifest[component] ?? null;
}
