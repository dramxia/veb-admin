export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { ok, withApi } from '@/lib/api';
import {
  ARTICLE_VISITOR_COOKIE,
  hashVisitorKey,
  newVisitorId,
} from '@/lib/content';
import { requirePublishedArticle } from '@/lib/content-data';
import { prisma } from '@/lib/prisma';
import { assertRateLimit, getClientIp } from '@/lib/rate-limit';

const cookieOptions = {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

async function state(articleId: string, visitorId?: string) {
  const visitorKeyHash = visitorId ? hashVisitorKey(visitorId) : null;
  const [likeCount, liked] = await Promise.all([
    prisma.articleLike.count({ where: { articleId } }),
    visitorKeyHash
      ? prisma.articleLike.findUnique({
          where: { articleId_visitorKeyHash: { articleId, visitorKeyHash } },
          select: { id: true },
        })
      : null,
  ]);
  return { liked: Boolean(liked), likeCount };
}

export const GET = withApi(
  async (request: NextRequest, { params }: { params: { slug: string } }) => {
    const article = await requirePublishedArticle(params.slug);
    return ok(
      await state(
        article.id,
        request.cookies.get(ARTICLE_VISITOR_COOKIE)?.value,
      ),
    );
  },
);

export const PUT = withApi(
  async (request: NextRequest, { params }: { params: { slug: string } }) => {
    const article = await requirePublishedArticle(params.slug);
    assertRateLimit({
      key: `article-like:${article.id}:${getClientIp(request)}`,
      capacity: 30,
      windowMs: 60_000,
    });
    const existingVisitorId = request.cookies.get(
      ARTICLE_VISITOR_COOKIE,
    )?.value;
    const visitorId = existingVisitorId || newVisitorId();
    const visitorKeyHash = hashVisitorKey(visitorId);
    await prisma.articleLike.upsert({
      where: {
        articleId_visitorKeyHash: { articleId: article.id, visitorKeyHash },
      },
      update: {},
      create: { articleId: article.id, visitorKeyHash },
    });
    const response = ok(await state(article.id, visitorId));
    if (!existingVisitorId)
      response.cookies.set(ARTICLE_VISITOR_COOKIE, visitorId, cookieOptions);
    return response;
  },
);

export const DELETE = withApi(
  async (request: NextRequest, { params }: { params: { slug: string } }) => {
    const article = await requirePublishedArticle(params.slug);
    assertRateLimit({
      key: `article-unlike:${article.id}:${getClientIp(request)}`,
      capacity: 30,
      windowMs: 60_000,
    });
    const visitorId = request.cookies.get(ARTICLE_VISITOR_COOKIE)?.value;
    if (visitorId) {
      await prisma.articleLike.deleteMany({
        where: {
          articleId: article.id,
          visitorKeyHash: hashVisitorKey(visitorId),
        },
      });
    }
    return ok(await state(article.id, visitorId));
  },
);
