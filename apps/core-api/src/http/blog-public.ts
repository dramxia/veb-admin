import type { NextRequest } from 'next/server';
import { publicArticleListQuerySchema } from '@veb/api-contracts';
import { defineApiRoute, ok, pageOptions, readQuery } from '@/lib/api';
import {
  ARTICLE_VISITOR_COOKIE,
  hashVisitorKey,
  newVisitorId,
} from '@/lib/blog';
import { assertRateLimit, getClientIp } from '@/lib/api-kit';
import {
  getLikeState,
  getPublicArticle,
  getPublicTag,
  getPublishedArticleIdentity,
  likeArticle,
  listPublicArticles,
  listPublicTags,
  unlikeArticle,
} from '@/src/modules/blog/service';

type SlugContext = { params: { slug: string } };
const publicRoute = { access: 'public' as const };

const visitorCookieBaseOptions = {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60,
  path: '/',
  sameSite: 'lax' as const,
};

function visitorCookieOptions(request: Request) {
  const forwardedProtocol = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  const secure =
    forwardedProtocol === 'https' ||
    (forwardedProtocol !== 'http' &&
      new URL(request.url).protocol === 'https:');
  return { ...visitorCookieBaseOptions, secure };
}

export const listArticles = defineApiRoute(
  publicRoute,
  async (request: Request) => {
    const query = readQuery(request, publicArticleListQuerySchema);
    return ok(await listPublicArticles(pageOptions(query), query.tag));
  },
);

export const getArticle = defineApiRoute<[Request, SlugContext]>(
  publicRoute,
  async (_request, context) => ok(await getPublicArticle(context.params.slug)),
);

export const listTags = defineApiRoute(publicRoute, async () =>
  ok({ items: await listPublicTags() }),
);

export const getTag = defineApiRoute<[Request, SlugContext]>(
  publicRoute,
  async (_request, context) => ok(await getPublicTag(context.params.slug)),
);

export const getArticleLike = defineApiRoute<[Request, SlugContext]>(
  publicRoute,
  async (request, context) => {
    const nextRequest = request as NextRequest;
    const article = await getPublishedArticleIdentity(context.params.slug);
    const visitorId = nextRequest.cookies.get(ARTICLE_VISITOR_COOKIE)?.value;
    return ok(
      await getLikeState(
        article.id,
        visitorId ? hashVisitorKey(visitorId) : undefined,
      ),
    );
  },
);

export const putArticleLike = defineApiRoute<[Request, SlugContext]>(
  publicRoute,
  async (request, context) => {
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
    const response = ok(
      await likeArticle(article.id, hashVisitorKey(visitorId)),
    );
    if (!existingVisitorId) {
      response.cookies.set(
        ARTICLE_VISITOR_COOKIE,
        visitorId,
        visitorCookieOptions(request),
      );
    }
    return response;
  },
);

export const deleteArticleLike = defineApiRoute<[Request, SlugContext]>(
  publicRoute,
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
