import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  MigrationInputError,
  parseMigrationMode,
  readMigrationEnvironment,
  runMigration,
  verifySnapshots,
} from './core';
import type {
  BlogSnapshot,
  MigrationCounts,
  MigrationRepository,
} from './types';
import { MIGRATION_TABLE_ORDER } from './types';

function fixture(): BlogSnapshot {
  return {
    tags: [
      {
        id: 'tag-1',
        name: 'Engineering',
        slug: 'engineering',
        createdAt: '2026-07-20T10:00:00.000Z',
        updatedAt: '2026-07-20T10:00:00.000Z',
      },
    ],
    articles: [
      {
        id: 'article-1',
        title: 'Monorepo migration',
        slug: 'monorepo-migration',
        summary: null,
        contentMarkdown: '# Migration',
        status: 'PUBLISHED',
        authorId: 'user-1',
        authorUsername: 'admin',
        authorNickname: 'Editor',
        publishedAt: '2026-07-21T08:00:00.000Z',
        createdAt: '2026-07-20T10:00:00.000Z',
        updatedAt: '2026-07-21T08:00:00.000Z',
      },
    ],
    articleTags: [{ articleId: 'article-1', tagId: 'tag-1' }],
    articleLikes: [
      {
        id: 'like-1',
        articleId: 'article-1',
        visitorKeyHash: 'visitor-hash',
        createdAt: '2026-07-21T09:00:00.000Z',
      },
    ],
  };
}

function emptySnapshot(): BlogSnapshot {
  return { tags: [], articles: [], articleTags: [], articleLikes: [] };
}

function mergeById<T extends { id: string }>(target: T[], source: T[]): T[] {
  const values = new Map(target.map((item) => [item.id, item]));
  for (const item of source) values.set(item.id, structuredClone(item));
  return [...values.values()];
}

class MemoryRepository implements MigrationRepository {
  applyCalls = 0;

  constructor(
    readonly source: BlogSnapshot,
    public target: BlogSnapshot,
  ) {}

  async readSourceSnapshot() {
    return structuredClone(this.source);
  }

  async readTargetSnapshot() {
    return structuredClone(this.target);
  }

  async applySnapshot(snapshot: BlogSnapshot): Promise<MigrationCounts> {
    this.applyCalls += 1;
    this.target.tags = mergeById(this.target.tags, snapshot.tags);
    this.target.articles = mergeById(this.target.articles, snapshot.articles);
    const articleTags = new Map(
      this.target.articleTags.map((item) => [
        `${item.articleId}:${item.tagId}`,
        item,
      ]),
    );
    for (const item of snapshot.articleTags) {
      articleTags.set(`${item.articleId}:${item.tagId}`, structuredClone(item));
    }
    this.target.articleTags = [...articleTags.values()];
    this.target.articleLikes = mergeById(
      this.target.articleLikes,
      snapshot.articleLikes,
    );
    return {
      tags: snapshot.tags.length,
      articles: snapshot.articles.length,
      articleTags: snapshot.articleTags.length,
      articleLikes: snapshot.articleLikes.length,
    };
  }

  async close() {}
}

describe('CLI inputs', () => {
  it('defaults to dry-run and accepts one explicit mode', () => {
    expect(parseMigrationMode([])).toBe('dry-run');
    expect(parseMigrationMode(['--dry-run'])).toBe('dry-run');
    expect(parseMigrationMode(['--apply'])).toBe('apply');
    expect(parseMigrationMode(['--verify'])).toBe('verify');
  });

  it('rejects combined, duplicate, and unknown modes', () => {
    expect(() => parseMigrationMode(['--apply', '--verify'])).toThrow(
      MigrationInputError,
    );
    expect(() => parseMigrationMode(['--apply', '--apply'])).toThrow(
      MigrationInputError,
    );
    expect(() => parseMigrationMode(['--force'])).toThrow('未知参数');
  });

  it('requires distinct PostgreSQL URLs', () => {
    const valid = readMigrationEnvironment({
      SOURCE_DATABASE_URL: 'postgresql://localhost/source',
      BLOG_DATABASE_URL: 'postgresql://localhost/blog',
    });
    expect(valid.blogDatabaseUrl).toContain('/blog');
    expect(() =>
      readMigrationEnvironment({
        SOURCE_DATABASE_URL: 'postgresql://localhost/same',
        BLOG_DATABASE_URL: 'postgresql://localhost/same',
      }),
    ).toThrow('不能指向同一数据库');
    expect(() =>
      readMigrationEnvironment({
        SOURCE_DATABASE_URL: 'postgresql://reader:one@localhost/shared',
        BLOG_DATABASE_URL: 'postgresql://writer:two@localhost/shared',
      }),
    ).toThrow('不能指向同一数据库');
    expect(() =>
      readMigrationEnvironment({
        SOURCE_DATABASE_URL:
          'postgresql://reader:one@localhost/shared?schema=legacy',
        BLOG_DATABASE_URL:
          'postgresql://writer:two@localhost/shared?schema=public',
      }),
    ).toThrow('不能指向同一数据库');
  });

  it('returns a non-zero process status when the CLI fails', () => {
    const packageDirectory = fileURLToPath(new URL('..', import.meta.url));
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', 'src/cli.ts', '--unsupported'],
      {
        cwd: packageDirectory,
        encoding: 'utf8',
        env: process.env,
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('未知参数: --unsupported');
  });
});

describe('migration workflow', () => {
  it('keeps dry-run read-only', async () => {
    const repository = new MemoryRepository(fixture(), emptySnapshot());
    const report = await runMigration('dry-run', repository);

    expect(report.ok).toBe(true);
    expect(report.sourceCounts).toEqual({
      tags: 1,
      articles: 1,
      articleTags: 1,
      articleLikes: 1,
    });
    expect(repository.applyCalls).toBe(0);
    expect(repository.target).toEqual(emptySnapshot());
  });

  it('applies in dependency order and remains idempotent', async () => {
    expect(MIGRATION_TABLE_ORDER).toEqual([
      'Tag',
      'Article',
      'ArticleTag',
      'ArticleLike',
    ]);
    const source = fixture();
    const repository = new MemoryRepository(source, emptySnapshot());

    const first = await runMigration('apply', repository);
    const afterFirst = structuredClone(repository.target);
    const second = await runMigration('apply', repository);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(repository.applyCalls).toBe(2);
    expect(repository.target).toEqual(afterFirst);
    expect(repository.target.articles[0]).toMatchObject({
      id: 'article-1',
      authorId: 'user-1',
      authorUsername: 'admin',
      authorNickname: 'Editor',
    });
  });

  it('blocks a unique-key conflict before writing', async () => {
    const target = emptySnapshot();
    target.tags.push({ ...fixture().tags[0]!, id: 'another-tag' });
    const repository = new MemoryRepository(fixture(), target);
    const report = await runMigration('apply', repository);

    expect(report.ok).toBe(false);
    expect(report.errors.join(' ')).toContain('唯一键冲突');
    expect(repository.applyCalls).toBe(0);
  });

  it('reports count, relation, slug, author, and like uniqueness failures', () => {
    const source = fixture();
    const target = structuredClone(source);
    target.articles[0]!.slug = 'wrong-slug';
    target.articles[0]!.authorUsername = null;
    target.articleTags[0]!.tagId = 'missing-tag';
    target.articleLikes.push({ ...target.articleLikes[0]!, id: 'like-2' });

    const failed = verifySnapshots(source, target).filter((check) => !check.ok);
    expect(failed.map((check) => check.name)).toEqual(
      expect.arrayContaining([
        'target.likes-unique',
        'target.relations-valid',
        'target.author-snapshots-valid',
        'counts.articleLikes',
        'mapping.articles',
        'mapping.article-tags',
        'mapping.likes',
      ]),
    );
  });

  it('rejects migrated rows that cannot produce contract DTOs', () => {
    const source = fixture();
    source.articles[0]!.publishedAt = null;

    const failed = verifySnapshots(source, structuredClone(source)).filter(
      (check) => !check.ok,
    );

    expect(failed.map((check) => check.name)).toEqual(
      expect.arrayContaining([
        'source.contract-dtos-valid',
        'target.contract-dtos-valid',
      ]),
    );
  });
});
