import type { NextRequest } from 'next/server';
import { publicArticleListQuerySchema } from '@veb/api-contracts';
import { ok, pageOptions, readQuery, withApi } from '@/lib/api';
import {
  ARTICLE_VISITOR_COOKIE,
  hashVisitorKey,
  newVisitorId,
} from '@/lib/content';
import { assertRateLimit, getClientIp } from '@veb/api-kit';
import {
  getLikeState,
  getPublicArticle,
  getPublicTag,
  getPublishedArticleIdentity,
  likeArticle,
  listPublicArticles,
  listPublicTags,
  unlikeArticle,
} from '@/modules/content/service';

type SlugContext = { params: { slug: string } };

const visitorCookieOptions = {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export const listArticles = withApi(async (request: Request) => {
  const query = readQuery(request, publicArticleListQuerySchema);
  return ok(await listPublicArticles(pageOptions(query), query.tag));
});

export const getArticle = withApi<SlugContext>(async (_request, context) => {
  return ok(await getPublicArticle(context.params.slug));
});

export const listTags = withApi(async () =>
  ok({ items: await listPublicTags() }),
);

export const getTag = withApi<SlugContext>(async (_request, context) => {
  return ok(await getPublicTag(context.params.slug));
});

export const getArticleLike = withApi<SlugContext>(async (request, context) => {
  const nextRequest = request as NextRequest;
  const article = await getPublishedArticleIdentity(context.params.slug);
  const visitorId = nextRequest.cookies.get(ARTICLE_VISITOR_COOKIE)?.value;
  return ok(
    await getLikeState(
      article.id,
      visitorId ? hashVisitorKey(visitorId) : undefined,
    ),
  );
});

export const putArticleLike = withApi<SlugContext>(async (request, context) => {
  const nextRequest = request as NextRequest;
  const article = await getPublishedArticleIdentity(context.params.slug);
  assertRateLimit({
    key: `article-like:${article.id}:${getClientIp(request)}`,
    capacity: 30,
    windowMs: 60_000,
  });
  const existingVisitorId = nextRequest.cookies.get(
    ARTICLE_VISITOR_COOKIE,
  )?.value;
  const visitorId = existingVisitorId || newVisitorId();
  const response = ok(await likeArticle(article.id, hashVisitorKey(visitorId)));
  if (!existingVisitorId) {
    response.cookies.set(
      ARTICLE_VISITOR_COOKIE,
      visitorId,
      visitorCookieOptions,
    );
  }
  return response;
});

export const deleteArticleLike = withApi<SlugContext>(
  async (request, context) => {
    const nextRequest = request as NextRequest;
    const article = await getPublishedArticleIdentity(context.params.slug);
    assertRateLimit({
      key: `article-unlike:${article.id}:${getClientIp(request)}`,
      capacity: 30,
      windowMs: 60_000,
    });
    const visitorId = nextRequest.cookies.get(ARTICLE_VISITOR_COOKIE)?.value;
    return ok(
      await unlikeArticle(
        article.id,
        visitorId ? hashVisitorKey(visitorId) : undefined,
      ),
    );
  },
);
