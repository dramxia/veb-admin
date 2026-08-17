import type { MenuNode, UserNavigation } from '@veb/api-contracts';

export type WorkspaceAppModule = UserNavigation['modules'][number];
export type AppModuleRouteDefinition = Pick<WorkspaceAppModule, 'menus'>;

export function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/**
 * Finds the first routable PAGE in the server-sorted navigation tree. The
 * legacy /admin landing route is intentionally excluded from this fallback so
 * stale navigation data cannot redirect /admin back to itself forever.
 */
export function findFirstPagePath(
  menus: readonly MenuNode[],
  excludedPath?: string,
): string | undefined {
  const excluded = excludedPath ? normalizePathname(excludedPath) : undefined;

  const visit = (items: readonly MenuNode[]): string | undefined => {
    for (const menu of items) {
      if (menu.type === 'PAGE' && menu.path) {
        const path = normalizePathname(menu.path);
        if (path !== excluded) return path;
      }

      const childPath = visit(menu.children);
      if (childPath) return childPath;
    }

    return undefined;
  };

  return visit(menus);
}

/**
 * Resolves a module landing route from its current authorized menu snapshot.
 * The persisted landingPath is deliberately not used for redirects: a bad
 * value can only be repaired by a deployment, while a menu snapshot always
 * gives us a route that the current user can navigate to.
 */
export function resolveModuleLandingPath(
  appModule: { menus: readonly MenuNode[] },
  currentPath?: string,
) {
  return findFirstPagePath(
    Array.isArray(appModule.menus) ? appModule.menus : [],
    currentPath,
  );
}

export function resolveFirstModuleLandingPath<
  T extends { menus: readonly MenuNode[] },
>(modules: readonly T[], currentPath?: string) {
  for (const appModule of modules) {
    const landingPath = resolveModuleLandingPath(appModule, currentPath);
    if (landingPath) return landingPath;
  }

  return undefined;
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

/**
 * Resolve ownership from the longest authorized PAGE path, not a module prefix.
 *
 * The pathname is the source of truth because the (workspace) layout is a
 * shared layout: Next.js preserves it across client-side navigations within
 * the same route group and does not re-render it, so the server-provided
 * `moduleId` can be stale on the client. The `moduleId` is only consulted as
 * a fallback for authorized pages that are hidden from the navigation tree and
 * therefore cannot be matched by path.
 */
export function resolveAppModule<
  T extends AppModuleRouteDefinition & { id: string },
>(pathname: string, modules: readonly T[], moduleId?: string): T | undefined {
  const byPath = modules
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
  if (byPath) return byPath;

  return moduleId
    ? modules.find((module) => module.id === moduleId)
    : undefined;
}

export function sortWorkspaceModules(modules: readonly WorkspaceAppModule[]) {
  return [...modules].sort(
    (left, right) =>
      left.sort - right.sort ||
      left.name.localeCompare(right.name, 'zh-CN') ||
      left.id.localeCompare(right.id),
  );
}
