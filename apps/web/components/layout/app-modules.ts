import type { MenuNode, UserNavigation } from '@veb/api-contracts';

export type WorkspaceAppModule = UserNavigation['modules'][number];
type AppModuleRouteDefinition = Pick<WorkspaceAppModule, 'menus'>;

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
