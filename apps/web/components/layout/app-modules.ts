export type AppModuleDefinition = {
  id: string;
  label: string;
  basePath: string;
  homePath: string;
  shell: 'sidebar' | 'plain';
  capabilities: {
    sidebarToggle: boolean;
    menuSearch: boolean;
  };
};

export const ADMIN_BASE_PATH = '/admin';
export const DEFAULT_AUTHENTICATED_PATH = ADMIN_BASE_PATH;

export const appModules = [
  {
    id: 'admin',
    label: '后台',
    basePath: ADMIN_BASE_PATH,
    homePath: ADMIN_BASE_PATH,
    shell: 'sidebar',
    capabilities: {
      sidebarToggle: true,
      menuSearch: true,
    },
  },
] as const satisfies readonly AppModuleDefinition[];

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function isModulePath(pathname: string, module: AppModuleDefinition) {
  const normalizedPathname = normalizePathname(pathname);
  const basePath = normalizePathname(module.basePath);

  if (basePath === '/') return normalizedPathname.startsWith('/');
  return (
    normalizedPathname === basePath ||
    normalizedPathname.startsWith(`${basePath}/`)
  );
}

export function resolveAppModule(
  pathname: string,
  modules: readonly AppModuleDefinition[] = appModules,
) {
  return [...modules]
    .sort((left, right) => right.basePath.length - left.basePath.length)
    .find((module) => isModulePath(pathname, module));
}
