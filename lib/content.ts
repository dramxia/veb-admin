import { createHmac, randomUUID } from 'node:crypto';
import { ParamError } from './errors';

export const ARTICLE_VISITOR_COOKIE = 'veb_article_visitor';

export function normalizeSlug(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function createContentSlug(value: string, prefix: 'article' | 'tag') {
  return (
    normalizeSlug(value) ||
    `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 10)}`
  );
}

export function validatePublishableArticle(input: {
  status: 'DRAFT' | 'PUBLISHED';
  summary?: string | null;
  contentMarkdown?: string | null;
}) {
  if (input.status !== 'PUBLISHED') return;
  if (!input.summary?.trim()) throw new ParamError('发布文章前请填写摘要');
  if (!input.contentMarkdown?.trim())
    throw new ParamError('发布文章前请填写正文');
}

export function hashVisitorKey(
  visitorId: string,
  secret = process.env.NEXTAUTH_SECRET,
) {
  if (!secret) throw new Error('NEXTAUTH_SECRET 未配置');
  return createHmac('sha256', secret).update(visitorId).digest('hex');
}

export function maskVisitorHash(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export function newVisitorId() {
  return randomUUID();
}
