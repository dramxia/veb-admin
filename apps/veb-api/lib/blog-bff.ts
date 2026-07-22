export type BlogActor = {
  id: string;
  username: string;
  nickname: string | null;
};

export type BlogAuthorization = {
  action: string;
  permission: string;
};

const articleMethods = {
  GET: { action: 'article.view', permission: 'content:article:view' },
  POST: { action: 'article.create', permission: 'content:article:create' },
  PATCH: { action: 'article.update', permission: 'content:article:update' },
  DELETE: { action: 'article.delete', permission: 'content:article:delete' },
} as const;

const tagMethods = {
  GET: { action: 'tag.view', permission: 'content:tag:view' },
  POST: { action: 'tag.create', permission: 'content:tag:create' },
  PATCH: { action: 'tag.update', permission: 'content:tag:update' },
  DELETE: { action: 'tag.delete', permission: 'content:tag:delete' },
} as const;

export function resolveBlogAuthorization(
  method: string,
  path: string[],
): BlogAuthorization | null {
  const normalizedMethod = method.toUpperCase();
  const [resource, id, operation] = path;

  if (
    resource === 'articles' &&
    path.length === 3 &&
    id &&
    operation === 'tags'
  ) {
    if (normalizedMethod === 'GET' || normalizedMethod === 'PUT') {
      return {
        action:
          normalizedMethod === 'GET'
            ? 'article.tags.view'
            : 'article.tags.update',
        permission: 'content:tag:assign',
      };
    }
    return null;
  }

  if (resource === 'articles' && path.length === 2 && id === 'authors') {
    return normalizedMethod === 'GET' ? articleMethods.GET : null;
  }

  if (resource === 'articles') {
    if (
      path.length === 1 &&
      (normalizedMethod === 'GET' || normalizedMethod === 'POST')
    ) {
      return articleMethods[normalizedMethod];
    }
    if (
      path.length === 2 &&
      id &&
      (normalizedMethod === 'GET' ||
        normalizedMethod === 'PATCH' ||
        normalizedMethod === 'DELETE')
    ) {
      return articleMethods[normalizedMethod];
    }
    return null;
  }

  if (
    resource === 'tags' &&
    path.length === 3 &&
    id &&
    operation === 'articles'
  ) {
    return normalizedMethod === 'GET'
      ? { action: 'tag.articles.view', permission: 'content:tag:view' }
      : null;
  }

  if (resource === 'tags') {
    if (
      path.length === 1 &&
      (normalizedMethod === 'GET' || normalizedMethod === 'POST')
    ) {
      return tagMethods[normalizedMethod];
    }
    if (
      path.length === 2 &&
      id &&
      (normalizedMethod === 'GET' ||
        normalizedMethod === 'PATCH' ||
        normalizedMethod === 'DELETE')
    ) {
      return tagMethods[normalizedMethod];
    }
    return null;
  }

  if (resource === 'likes' && path.length === 2 && id === 'stats') {
    return normalizedMethod === 'GET'
      ? { action: 'article-like.stats', permission: 'content:like:stats' }
      : null;
  }

  if (resource === 'likes' && path.length === 2 && id === 'batch-delete') {
    return normalizedMethod === 'POST'
      ? {
          action: 'article-like.batch-delete',
          permission: 'content:like:delete',
        }
      : null;
  }

  if (resource === 'likes' && path.length === 1 && normalizedMethod === 'GET') {
    return { action: 'article-like.view', permission: 'content:like:view' };
  }

  if (resource === 'likes' && path.length === 2 && id) {
    if (normalizedMethod === 'GET') {
      return { action: 'article-like.view', permission: 'content:like:view' };
    }
    if (normalizedMethod === 'DELETE') {
      return {
        action: 'article-like.delete',
        permission: 'content:like:delete',
      };
    }
  }

  return null;
}

export function injectArticleAuthor(body: string, actor: BlogActor) {
  const value = JSON.parse(body) as unknown;
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new SyntaxError('文章请求体必须是 JSON 对象');
  }
  return JSON.stringify({
    ...(value as Record<string, unknown>),
    author: actor,
  });
}

export function needsPublishPermission(
  method: string,
  path: string[],
  body: string | undefined,
) {
  if (
    !body ||
    path[0] !== 'articles' ||
    !['POST', 'PATCH'].includes(method.toUpperCase())
  ) {
    return false;
  }
  try {
    const value = JSON.parse(body) as { status?: unknown };
    return value.status === 'PUBLISHED';
  } catch {
    return false;
  }
}
