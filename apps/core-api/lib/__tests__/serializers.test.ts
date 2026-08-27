import { publicArticleDetailSchema } from '@veb/api-contracts';
import { describe, expect, it } from 'vitest';
import { serializePublicArticle } from '@/src/modules/blog/serializers';

describe('public article serializer', () => {
  it('does not expose database ids, status, or account usernames', () => {
    const article = serializePublicArticle({
      id: 'article-id',
      title: 'Public article',
      slug: 'public-article',
      summary: 'Summary',
      contentMarkdown: '# Body',
      status: 'PUBLISHED',
      authorId: 'user-id',
      author: {
        id: 'user-id',
        username: 'private-account',
        nickname: 'Writer',
      },
      publishedAt: new Date('2026-07-20T00:00:00.000Z'),
      createdAt: new Date('2026-07-19T00:00:00.000Z'),
      updatedAt: new Date('2026-07-21T00:00:00.000Z'),
      tags: [{ tag: { id: 'tag-id', name: 'News', slug: 'news' } }],
      _count: { likes: 3 },
    });

    expect(publicArticleDetailSchema.parse(article)).toEqual(article);
    expect(article).not.toHaveProperty('id');
    expect(article).not.toHaveProperty('status');
    expect(article).not.toHaveProperty('authorUsername');
    expect(article.tags[0]).not.toHaveProperty('id');
  });

  it('rejects an impossible published article without a publication date', () => {
    expect(() =>
      serializePublicArticle({
        id: 'article-id',
        title: 'Broken article',
        slug: 'broken-article',
        summary: 'Summary',
        status: 'PUBLISHED',
        authorId: 'user-id',
        author: {
          id: 'user-id',
          username: 'private-account',
          nickname: null,
        },
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        _count: { likes: 0 },
      }),
    ).toThrow('Published article is missing publishedAt');
  });
});
