import { describe, expect, it } from 'vitest';
import { publicArticleListQuerySchema } from '@veb/api-contracts';
import { readQuery } from '@/lib/api-kit';

describe('pagination', () => {
  it('uses contract defaults and parses valid query strings', () => {
    expect(
      readQuery(
        new Request('https://blog.test/api/v1/blog/articles'),
        publicArticleListQuerySchema,
      ),
    ).toEqual({ page: 1, pageSize: 10 });
    expect(
      readQuery(
        new Request(
          'https://blog.test/api/v1/blog/articles?page=3&pageSize=50&tag=typescript',
        ),
        publicArticleListQuerySchema,
      ),
    ).toEqual({
      page: 3,
      pageSize: 50,
      tag: 'typescript',
    });
  });

  it('rejects malformed values at the contract boundary', () => {
    expect(() =>
      readQuery(
        new Request(
          'https://blog.test/api/v1/blog/articles?page=nope&pageSize=-1',
        ),
        publicArticleListQuerySchema,
      ),
    ).toThrow();
  });
});
