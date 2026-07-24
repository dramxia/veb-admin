import type { MenuNode, UserNavigation } from '@veb/api-contracts';

export type WorkspaceAppModule = UserNavigation['modules'][number];
export type AppModuleRouteDefinition = Pick<WorkspaceAppModule, 'menus'>;

export function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function isPagePathMatch(pathname: string, menu: MenuNode) {
  if (menu.type !== 'PAGE' || !menu.path) return false;

  const normalizedPathname = normalizePathname(pathname);
  const pagePath = normalizePathname(menu.path);
  return (
    normalizedPathname === pagePath ||
    (pagePath.split('/').filter(Boolean).length > 1 &&
      normalizedPathname.startsWith(`${pagePath}/`))
  );
}

function getLongestMatchingPagePath(
  pathname: string,
  menus: readonly MenuNode[],
): string | undefined {
  let match: string | undefined;

  for (const menu of menus) {
    if ((menu.type as string) === 'BUTTON') continue;

    if (isPagePathMatch(pathname, menu)) {
      const pagePath = normalizePathname(menu.path!);
      if (!match || pagePath.length > match.length) match = pagePath;
    }

    const childMatch = getLongestMatchingPagePath(pathname, menu.children);
    if (childMatch && (!match || childMatch.length > match.length)) {
      match = childMatch;
    }
  }

  return match;
}

export function isModulePath(
  pathname: string,
  module: AppModuleRouteDefinition,
) {
  return Boolean(getLongestMatchingPagePath(pathname, module.menus));
}

/** Resolve ownership from the longest authorized PAGE path, not a module prefix. */
export function resolveAppModule<
  T extends AppModuleRouteDefinition & { id: string },
>(pathname: string, modules: readonly T[], moduleId?: string): T | undefined {
  const resolvedById = moduleId
    ? modules.find((module) => module.id === moduleId)
    : undefined;
  if (resolvedById) return resolvedById;

  return modules
    .map((module, index) => ({
      index,
      module,
      pagePath: getLongestMatchingPagePath(pathname, module.menus),
    }))
    .filter((candidate): candidate is typeof candidate & { pagePath: string } =>
      Boolean(candidate.pagePath),
    )
    .sort(
      (left, right) =>
        right.pagePath.length - left.pagePath.length ||
        left.index - right.index,
    )[0]?.module;
}

export function sortWorkspaceModules(modules: readonly WorkspaceAppModule[]) {
  return [...modules].sort(
    (left, right) =>
      left.sort - right.sort ||
      left.name.localeCompare(right.name, 'zh-CN') ||
      left.id.localeCompare(right.id),
  );
}
