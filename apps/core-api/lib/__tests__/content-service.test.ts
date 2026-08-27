import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '@/lib/api-kit';
import {
  createArticle,
  getLikeStats,
  getPublicArticle,
} from '@/src/modules/blog/service';

const prismaMock = vi.hoisted(() => ({
  article: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  articleLike: {
    count: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  tag: {
    count: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

const now = new Date('2026-07-22T08:00:00.000Z');

function draftArticleRecord() {
  return {
    id: 'article-1',
    title: 'Draft with tags',
    slug: 'draft-with-tags',
    summary: 'Draft summary',
    contentMarkdown: '# Draft',
    status: 'DRAFT' as const,
    authorId: 'user-1',
    author: {
      id: 'user-1',
      username: 'editor',
      nickname: 'Editor',
    },
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    tags: [
      { tag: { id: 'tag-1', name: 'Engineering', slug: 'engineering' } },
      { tag: { id: 'tag-2', name: 'Release', slug: 'release' } },
    ],
    _count: { likes: 0 },
  };
}

describe('content service boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only resolves public articles through the published visibility filter', async () => {
    prismaMock.article.findFirst.mockResolvedValue(null);

    await expect(getPublicArticle('draft-with-tags')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(prismaMock.article.findFirst).toHaveBeenCalledOnce();

    const query = prismaMock.article.findFirst.mock.calls[0]?.[0] as {
      where: {
        slug: string;
        status: string;
        publishedAt: { lte: Date };
      };
    };
    expect(query.where).toMatchObject({
      slug: 'draft-with-tags',
      status: 'PUBLISHED',
    });
    expect(query.where.publishedAt.lte).toBeInstanceOf(Date);
  });

  it('maps like statistics without leaking the article database id field', async () => {
    prismaMock.articleLike.count.mockResolvedValue(1);
    prismaMock.articleLike.groupBy.mockResolvedValue([
      { articleId: 'article-1', _count: { _all: 1 } },
    ]);
    prismaMock.articleLike.findMany.mockResolvedValue([{ createdAt: now }]);
    prismaMock.article.findMany.mockResolvedValue([
      { id: 'article-1', title: 'Published', slug: 'published' },
    ]);

    const result = await getLikeStats({
      articleId: 'article-1',
      from: new Date('2026-07-22T00:00:00.000Z'),
      to: new Date('2026-07-22T23:59:59.999Z'),
    });

    expect(result.articles).toEqual([
      {
        articleId: 'article-1',
        title: 'Published',
        slug: 'published',
        count: 1,
      },
    ]);
    expect(result.articles[0]).not.toHaveProperty('id');
  });

  it('persists the authenticated author relation and de-duplicated tags', async () => {
    prismaMock.tag.count.mockResolvedValue(2);
    prismaMock.article.create.mockResolvedValue(draftArticleRecord());

    const result = await createArticle({
      title: 'Draft with tags',
      slug: 'draft-with-tags',
      summary: 'Draft summary',
      contentMarkdown: '# Draft',
      status: 'DRAFT',
      tagIds: ['tag-1', 'tag-2', 'tag-1'],
      authorId: 'user-1',
    });

    expect(prismaMock.tag.count).toHaveBeenCalledWith({
      where: { id: { in: ['tag-1', 'tag-2'] } },
    });
    const create = prismaMock.article.create.mock.calls[0]?.[0] as {
      data: {
        authorId: string;
        tags: { create: Array<{ tagId: string }> };
      };
    };
    expect(create.data).toMatchObject({
      authorId: 'user-1',
      tags: { create: [{ tagId: 'tag-1' }, { tagId: 'tag-2' }] },
    });
    expect(result.author).toEqual({
      id: 'user-1',
      username: 'editor',
      nickname: 'Editor',
    });
    expect(result.tags.map((tag) => tag.id)).toEqual(['tag-1', 'tag-2']);
  });
});
