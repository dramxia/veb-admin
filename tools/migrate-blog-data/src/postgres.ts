import { Pool, type PoolClient } from 'pg';
import type {
  ArticleLikeRow,
  ArticleRow,
  ArticleTagRow,
  BlogSnapshot,
  MigrationCounts,
  MigrationRepository,
  TagRow,
} from './types';
import { MIGRATION_TABLE_ORDER } from './types';

const SOURCE_TAGS_SQL = `
  SELECT
    "id", "name", "slug",
    to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
    to_char("updatedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM "Tag"
  ORDER BY "id"
`;

const SOURCE_ARTICLES_SQL = `
  SELECT
    article."id",
    article."title",
    article."slug",
    article."summary",
    article."contentMarkdown",
    article."status"::text AS "status",
    article."authorId",
    author."username" AS "authorUsername",
    author."nickname" AS "authorNickname",
    to_char(article."publishedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "publishedAt",
    to_char(article."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
    to_char(article."updatedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM "Article" AS article
  LEFT JOIN "User" AS author ON author."id" = article."authorId"
  ORDER BY article."id"
`;

const TARGET_ARTICLES_SQL = `
  SELECT
    "id", "title", "slug", "summary", "contentMarkdown",
    "status"::text AS "status",
    "authorId", "authorUsername", "authorNickname",
    to_char("publishedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "publishedAt",
    to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
    to_char("updatedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM "Article"
  ORDER BY "id"
`;

const ARTICLE_TAGS_SQL = `
  SELECT "articleId", "tagId"
  FROM "ArticleTag"
  ORDER BY "articleId", "tagId"
`;

const ARTICLE_LIKES_SQL = `
  SELECT
    "id", "articleId", "visitorKeyHash",
    to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
  FROM "ArticleLike"
  ORDER BY "id"
`;

async function rows<T>(client: PoolClient, sql: string): Promise<T[]> {
  const result = await client.query(sql);
  return result.rows as T[];
}

async function readSnapshot(
  client: PoolClient,
  articleSql: string,
): Promise<BlogSnapshot> {
  const tags = await rows<TagRow>(client, SOURCE_TAGS_SQL);
  const articles = await rows<ArticleRow>(client, articleSql);
  const articleTags = await rows<ArticleTagRow>(client, ARTICLE_TAGS_SQL);
  const articleLikes = await rows<ArticleLikeRow>(client, ARTICLE_LIKES_SQL);
  return { tags, articles, articleTags, articleLikes };
}

async function inReadTransaction<T>(
  pool: Pool,
  operation: (client: PoolClient) => Promise<T>,
) {
  const client = await pool.connect();
  try {
    await client.query(
      'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY',
    );
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function insertBatches(
  client: PoolClient,
  table: (typeof MIGRATION_TABLE_ORDER)[number],
  columns: string[],
  values: unknown[][],
  conflictClause: string,
): Promise<void> {
  for (const batch of chunks(values, 500)) {
    if (batch.length === 0) continue;
    const parameters: unknown[] = [];
    const tuples = batch.map((row) => {
      const placeholders = row.map((value) => {
        parameters.push(value);
        return `$${parameters.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    const quotedColumns = columns.map((column) => `"${column}"`).join(', ');
    await client.query(
      `INSERT INTO "${table}" (${quotedColumns}) VALUES ${tuples.join(', ')} ${conflictClause}`,
      parameters,
    );
  }
}

async function upsertTags(client: PoolClient, tags: TagRow[]) {
  await insertBatches(
    client,
    'Tag',
    ['id', 'name', 'slug', 'createdAt', 'updatedAt'],
    tags.map((tag) => [
      tag.id,
      tag.name,
      tag.slug,
      tag.createdAt,
      tag.updatedAt,
    ]),
    `ON CONFLICT ("id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "slug" = EXCLUDED."slug",
      "createdAt" = EXCLUDED."createdAt",
      "updatedAt" = EXCLUDED."updatedAt"`,
  );
}

async function upsertArticles(client: PoolClient, articles: ArticleRow[]) {
  await insertBatches(
    client,
    'Article',
    [
      'id',
      'title',
      'slug',
      'summary',
      'contentMarkdown',
      'status',
      'authorId',
      'authorUsername',
      'authorNickname',
      'publishedAt',
      'createdAt',
      'updatedAt',
    ],
    articles.map((article) => [
      article.id,
      article.title,
      article.slug,
      article.summary,
      article.contentMarkdown,
      article.status,
      article.authorId,
      article.authorUsername,
      article.authorNickname,
      article.publishedAt,
      article.createdAt,
      article.updatedAt,
    ]),
    `ON CONFLICT ("id") DO UPDATE SET
      "title" = EXCLUDED."title",
      "slug" = EXCLUDED."slug",
      "summary" = EXCLUDED."summary",
      "contentMarkdown" = EXCLUDED."contentMarkdown",
      "status" = EXCLUDED."status",
      "authorId" = EXCLUDED."authorId",
      "authorUsername" = EXCLUDED."authorUsername",
      "authorNickname" = EXCLUDED."authorNickname",
      "publishedAt" = EXCLUDED."publishedAt",
      "createdAt" = EXCLUDED."createdAt",
      "updatedAt" = EXCLUDED."updatedAt"`,
  );
}

async function upsertArticleTags(
  client: PoolClient,
  articleTags: ArticleTagRow[],
) {
  await insertBatches(
    client,
    'ArticleTag',
    ['articleId', 'tagId'],
    articleTags.map((item) => [item.articleId, item.tagId]),
    'ON CONFLICT ("articleId", "tagId") DO NOTHING',
  );
}

async function upsertArticleLikes(
  client: PoolClient,
  articleLikes: ArticleLikeRow[],
) {
  await insertBatches(
    client,
    'ArticleLike',
    ['id', 'articleId', 'visitorKeyHash', 'createdAt'],
    articleLikes.map((like) => [
      like.id,
      like.articleId,
      like.visitorKeyHash,
      like.createdAt,
    ]),
    `ON CONFLICT ("id") DO UPDATE SET
      "articleId" = EXCLUDED."articleId",
      "visitorKeyHash" = EXCLUDED."visitorKeyHash",
      "createdAt" = EXCLUDED."createdAt"`,
  );
}

export class PostgresMigrationRepository implements MigrationRepository {
  private readonly sourcePool: Pool;
  private readonly targetPool: Pool;

  constructor(sourceDatabaseUrl: string, blogDatabaseUrl: string) {
    const poolOptions = {
      max: 4,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
      application_name: 'veb-migrate-blog-data',
    } as const;
    this.sourcePool = new Pool({
      ...poolOptions,
      connectionString: sourceDatabaseUrl,
    });
    this.targetPool = new Pool({
      ...poolOptions,
      connectionString: blogDatabaseUrl,
    });
  }

  readSourceSnapshot(): Promise<BlogSnapshot> {
    return inReadTransaction(this.sourcePool, (client) =>
      readSnapshot(client, SOURCE_ARTICLES_SQL),
    );
  }

  readTargetSnapshot(): Promise<BlogSnapshot> {
    return inReadTransaction(this.targetPool, (client) =>
      readSnapshot(client, TARGET_ARTICLES_SQL),
    );
  }

  async applySnapshot(snapshot: BlogSnapshot): Promise<MigrationCounts> {
    const client = await this.targetPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'LOCK TABLE "Tag", "Article", "ArticleTag", "ArticleLike" IN SHARE ROW EXCLUSIVE MODE',
      );
      await upsertTags(client, snapshot.tags);
      await upsertArticles(client, snapshot.articles);
      await upsertArticleTags(client, snapshot.articleTags);
      await upsertArticleLikes(client, snapshot.articleLikes);
      await client.query('COMMIT');
      return {
        tags: snapshot.tags.length,
        articles: snapshot.articles.length,
        articleTags: snapshot.articleTags.length,
        articleLikes: snapshot.articleLikes.length,
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await Promise.all([this.sourcePool.end(), this.targetPool.end()]);
  }
}
