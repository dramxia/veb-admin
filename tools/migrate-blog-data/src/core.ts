import {
  adminArticleDetailSchema,
  adminTagSchema,
  publicArticleDetailSchema,
} from '@veb/api-contracts';
import type {
  BlogSnapshot,
  MigrationCounts,
  MigrationMode,
  MigrationReport,
  MigrationRepository,
  VerificationCheck,
} from './types';

export class MigrationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationInputError';
  }
}

export function parseMigrationMode(args: string[]): MigrationMode {
  const supported = new Set(['--dry-run', '--apply', '--verify']);
  const unknown = args.filter((arg) => !supported.has(arg));
  if (unknown.length > 0) {
    throw new MigrationInputError(`未知参数: ${unknown.join(', ')}`);
  }
  if (args.length > 1) {
    throw new MigrationInputError(
      '--dry-run、--apply 和 --verify 不能同时使用',
    );
  }
  if (args[0] === '--apply') return 'apply';
  if (args[0] === '--verify') return 'verify';
  return 'dry-run';
}

export function readMigrationEnvironment(environment: NodeJS.ProcessEnv): {
  sourceDatabaseUrl: string;
  blogDatabaseUrl: string;
} {
  const sourceDatabaseUrl = environment.SOURCE_DATABASE_URL?.trim();
  const blogDatabaseUrl = environment.BLOG_DATABASE_URL?.trim();
  if (!sourceDatabaseUrl)
    throw new MigrationInputError('缺少 SOURCE_DATABASE_URL');
  if (!blogDatabaseUrl) throw new MigrationInputError('缺少 BLOG_DATABASE_URL');

  let source: URL;
  let target: URL;
  try {
    source = new URL(sourceDatabaseUrl);
    target = new URL(blogDatabaseUrl);
  } catch (error) {
    throw new MigrationInputError(
      `数据库连接地址无效: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const protocols = new Set(['postgres:', 'postgresql:']);
  if (!protocols.has(source.protocol) || !protocols.has(target.protocol)) {
    throw new MigrationInputError('迁移工具只支持 PostgreSQL 连接地址');
  }
  const databaseIdentity = (url: URL) =>
    `${url.hostname.toLowerCase()}:${url.port || '5432'}${url.pathname}`;
  if (databaseIdentity(source) === databaseIdentity(target)) {
    throw new MigrationInputError(
      'SOURCE_DATABASE_URL 和 BLOG_DATABASE_URL 不能指向同一数据库',
    );
  }
  return { sourceDatabaseUrl, blogDatabaseUrl };
}

export function snapshotCounts(snapshot: BlogSnapshot): MigrationCounts {
  return {
    tags: snapshot.tags.length,
    articles: snapshot.articles.length,
    articleTags: snapshot.articleTags.length,
    articleLikes: snapshot.articleLikes.length,
  };
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function composite(parts: unknown[]): string {
  return JSON.stringify(parts);
}

function contractDtoCheck(
  snapshot: BlogSnapshot,
  label: string,
): VerificationCheck {
  const tagsById = new Map(snapshot.tags.map((tag) => [tag.id, tag]));
  const tagArticleCounts = new Map<string, number>();
  const articleTagIds = new Map<string, string[]>();
  const articleLikeCounts = new Map<string, number>();
  const failures: string[] = [];

  for (const relation of snapshot.articleTags) {
    tagArticleCounts.set(
      relation.tagId,
      (tagArticleCounts.get(relation.tagId) ?? 0) + 1,
    );
    const tagIds = articleTagIds.get(relation.articleId) ?? [];
    tagIds.push(relation.tagId);
    articleTagIds.set(relation.articleId, tagIds);
  }
  for (const like of snapshot.articleLikes) {
    articleLikeCounts.set(
      like.articleId,
      (articleLikeCounts.get(like.articleId) ?? 0) + 1,
    );
  }

  function recordFailure(
    entity: string,
    result: {
      success: boolean;
      error?: {
        issues: ReadonlyArray<{
          path: ReadonlyArray<string | number>;
          message: string;
        }>;
      };
    },
  ) {
    if (result.success) return;
    const detail = (result.error?.issues ?? [])
      .slice(0, 3)
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    failures.push(`${entity} (${detail})`);
  }

  for (const tag of snapshot.tags) {
    recordFailure(
      `Tag ${tag.id}`,
      adminTagSchema.safeParse({
        ...tag,
        articleCount: tagArticleCounts.get(tag.id) ?? 0,
      }),
    );
  }

  for (const article of snapshot.articles) {
    const tags = (articleTagIds.get(article.id) ?? [])
      .map((tagId) => tagsById.get(tagId))
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
    const likeCount = articleLikeCounts.get(article.id) ?? 0;
    const author =
      article.authorId && article.authorUsername !== null
        ? {
            id: article.authorId,
            username: article.authorUsername,
            nickname: article.authorNickname,
          }
        : null;

    recordFailure(
      `Article ${article.id} admin DTO`,
      adminArticleDetailSchema.safeParse({
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        contentMarkdown: article.contentMarkdown,
        status: article.status,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        author,
        tags: tags.map(({ id, name, slug }) => ({ id, name, slug })),
        likeCount,
        commentCount: 0,
      }),
    );

    if (article.status === 'PUBLISHED') {
      recordFailure(
        `Article ${article.id} public DTO`,
        publicArticleDetailSchema.safeParse({
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          contentMarkdown: article.contentMarkdown,
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
          authorNickname: article.authorNickname,
          tags: tags.map(({ name, slug }) => ({ name, slug })),
          likeCount,
          commentCount: 0,
        }),
      );
    }
  }

  return {
    name: `${label}.contract-dtos-valid`,
    ok: failures.length === 0,
    detail: failures.length
      ? `契约 DTO 校验失败: ${failures.slice(0, 20).join('；')}`
      : '管理与公开 DTO 均符合共享契约',
  };
}

function validationChecks(
  snapshot: BlogSnapshot,
  label: string,
): VerificationCheck[] {
  const articleIds = new Set(snapshot.articles.map((article) => article.id));
  const tagIds = new Set(snapshot.tags.map((tag) => tag.id));
  const duplicateArticleSlugs = duplicateValues(
    snapshot.articles.map((article) => article.slug),
  );
  const duplicateTagSlugs = duplicateValues(
    snapshot.tags.map((tag) => tag.slug),
  );
  const duplicateTagNames = duplicateValues(
    snapshot.tags.map((tag) => tag.name),
  );
  const duplicateLikePairs = duplicateValues(
    snapshot.articleLikes.map((like) =>
      composite([like.articleId, like.visitorKeyHash]),
    ),
  );
  const duplicateArticleTagPairs = duplicateValues(
    snapshot.articleTags.map((item) => composite([item.articleId, item.tagId])),
  );
  const orphanArticleTags = snapshot.articleTags.filter(
    (item) => !articleIds.has(item.articleId) || !tagIds.has(item.tagId),
  );
  const orphanLikes = snapshot.articleLikes.filter(
    (like) => !articleIds.has(like.articleId),
  );
  const missingAuthors = snapshot.articles.filter(
    (article) => article.authorId !== null && article.authorUsername === null,
  );
  const duplicateIds = [
    ...duplicateValues(snapshot.tags.map((tag) => tag.id)).map(
      (id) => `Tag:${id}`,
    ),
    ...duplicateValues(snapshot.articles.map((article) => article.id)).map(
      (id) => `Article:${id}`,
    ),
    ...duplicateValues(snapshot.articleLikes.map((like) => like.id)).map(
      (id) => `ArticleLike:${id}`,
    ),
  ];

  return [
    {
      name: `${label}.ids-unique`,
      ok: duplicateIds.length === 0,
      detail: duplicateIds.length
        ? `重复主键: ${duplicateIds.join(', ')}`
        : '实体主键唯一',
    },
    {
      name: `${label}.article-slugs-unique`,
      ok: duplicateArticleSlugs.length === 0,
      detail: duplicateArticleSlugs.length
        ? `重复文章 slug: ${duplicateArticleSlugs.join(', ')}`
        : '文章 slug 唯一',
    },
    {
      name: `${label}.tag-slugs-unique`,
      ok: duplicateTagSlugs.length === 0,
      detail: duplicateTagSlugs.length
        ? `重复标签 slug: ${duplicateTagSlugs.join(', ')}`
        : '标签 slug 唯一',
    },
    {
      name: `${label}.tag-names-unique`,
      ok: duplicateTagNames.length === 0,
      detail: duplicateTagNames.length
        ? `重复标签名称: ${duplicateTagNames.join(', ')}`
        : '标签名称唯一',
    },
    {
      name: `${label}.article-tags-unique`,
      ok: duplicateArticleTagPairs.length === 0,
      detail: duplicateArticleTagPairs.length
        ? `重复文章标签关联: ${duplicateArticleTagPairs.length}`
        : '文章标签关联唯一',
    },
    {
      name: `${label}.likes-unique`,
      ok: duplicateLikePairs.length === 0,
      detail: duplicateLikePairs.length
        ? `重复点赞唯一键: ${duplicateLikePairs.length}`
        : '点赞唯一键有效',
    },
    {
      name: `${label}.relations-valid`,
      ok: orphanArticleTags.length === 0 && orphanLikes.length === 0,
      detail:
        orphanArticleTags.length || orphanLikes.length
          ? `孤立文章标签 ${orphanArticleTags.length} 条，孤立点赞 ${orphanLikes.length} 条`
          : '文章标签和点赞关联完整',
    },
    {
      name: `${label}.author-snapshots-valid`,
      ok: missingAuthors.length === 0,
      detail: missingAuthors.length
        ? `${missingAuthors.length} 篇文章无法从 User 生成作者账号快照`
        : '作者快照完整',
    },
    contractDtoCheck(snapshot, label),
  ];
}

function checkExactSet(
  name: string,
  sourceValues: string[],
  targetValues: string[],
  description: string,
): VerificationCheck {
  const source = new Set(sourceValues);
  const target = new Set(targetValues);
  const missing = [...source].filter((value) => !target.has(value));
  const extra = [...target].filter((value) => !source.has(value));
  return {
    name,
    ok: missing.length === 0 && extra.length === 0,
    detail:
      missing.length || extra.length
        ? `${description}: 缺少 ${missing.length}，额外 ${extra.length}`
        : `${description}一致`,
  };
}

function countChecks(
  source: MigrationCounts,
  target: MigrationCounts,
): VerificationCheck[] {
  return (Object.keys(source) as Array<keyof MigrationCounts>).map((key) => ({
    name: `counts.${key}`,
    ok: source[key] === target[key],
    detail: `源 ${source[key]}，目标 ${target[key]}`,
  }));
}

export function verifySnapshots(
  source: BlogSnapshot,
  target: BlogSnapshot,
): VerificationCheck[] {
  const sourceCounts = snapshotCounts(source);
  const targetCounts = snapshotCounts(target);
  return [
    ...validationChecks(source, 'source'),
    ...validationChecks(target, 'target'),
    ...countChecks(sourceCounts, targetCounts),
    checkExactSet(
      'mapping.tags',
      source.tags.map((tag) =>
        composite([tag.id, tag.name, tag.slug, tag.createdAt, tag.updatedAt]),
      ),
      target.tags.map((tag) =>
        composite([tag.id, tag.name, tag.slug, tag.createdAt, tag.updatedAt]),
      ),
      '标签记录',
    ),
    checkExactSet(
      'mapping.articles',
      source.articles.map((article) =>
        composite([
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
      ),
      target.articles.map((article) =>
        composite([
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
      ),
      '文章记录与作者快照',
    ),
    checkExactSet(
      'mapping.article-tags',
      source.articleTags.map((item) => composite([item.articleId, item.tagId])),
      target.articleTags.map((item) => composite([item.articleId, item.tagId])),
      '文章标签关联',
    ),
    checkExactSet(
      'mapping.likes',
      source.articleLikes.map((like) =>
        composite([
          like.id,
          like.articleId,
          like.visitorKeyHash,
          like.createdAt,
        ]),
      ),
      target.articleLikes.map((like) =>
        composite([
          like.id,
          like.articleId,
          like.visitorKeyHash,
          like.createdAt,
        ]),
      ),
      '点赞记录与唯一键',
    ),
  ];
}

function findTargetConflicts(
  source: BlogSnapshot,
  target: BlogSnapshot,
): VerificationCheck[] {
  const targetTagBySlug = new Map(target.tags.map((tag) => [tag.slug, tag.id]));
  const targetTagByName = new Map(target.tags.map((tag) => [tag.name, tag.id]));
  const targetArticleBySlug = new Map(
    target.articles.map((article) => [article.slug, article.id]),
  );
  const targetLikeByPair = new Map(
    target.articleLikes.map((like) => [
      composite([like.articleId, like.visitorKeyHash]),
      like.id,
    ]),
  );
  const conflicts = [
    ...source.tags.flatMap((tag) => {
      const ids = [
        targetTagBySlug.get(tag.slug),
        targetTagByName.get(tag.name),
      ].filter(Boolean);
      return ids.some((id) => id !== tag.id) ? [`Tag ${tag.id}`] : [];
    }),
    ...source.articles.flatMap((article) => {
      const id = targetArticleBySlug.get(article.slug);
      return id && id !== article.id ? [`Article ${article.id}`] : [];
    }),
    ...source.articleLikes.flatMap((like) => {
      const id = targetLikeByPair.get(
        composite([like.articleId, like.visitorKeyHash]),
      );
      return id && id !== like.id ? [`ArticleLike ${like.id}`] : [];
    }),
  ];
  return [
    {
      name: 'target.unique-conflicts',
      ok: conflicts.length === 0,
      detail: conflicts.length
        ? `目标库存在不同 ID 的唯一键冲突: ${conflicts.slice(0, 20).join(', ')}`
        : '目标库不存在唯一键冲突',
    },
  ];
}

function report(
  mode: MigrationMode,
  source: BlogSnapshot,
  target: BlogSnapshot,
  checks: VerificationCheck[],
  warnings: string[],
  applied?: MigrationCounts,
): MigrationReport {
  const errors = checks
    .filter((check) => !check.ok)
    .map((check) => check.detail);
  return {
    mode,
    ok: errors.length === 0,
    sourceCounts: snapshotCounts(source),
    targetCounts: snapshotCounts(target),
    ...(applied ? { applied } : {}),
    checks,
    errors,
    warnings,
  };
}

export async function runMigration(
  mode: MigrationMode,
  repository: MigrationRepository,
): Promise<MigrationReport> {
  const source = await repository.readSourceSnapshot();
  const targetBefore = await repository.readTargetSnapshot();
  const sourceChecks = validationChecks(source, 'source');

  if (mode === 'dry-run') {
    const checks = [
      ...sourceChecks,
      ...validationChecks(targetBefore, 'target'),
      ...findTargetConflicts(source, targetBefore),
    ];
    const warnings = Object.values(snapshotCounts(targetBefore)).some(
      (count) => count > 0,
    )
      ? [
          '目标库已有内容；apply 会按源 ID 更新，并保留源库之外的记录直到 verify 报告差异',
        ]
      : [];
    return report(mode, source, targetBefore, checks, warnings);
  }

  if (mode === 'verify') {
    return report(
      mode,
      source,
      targetBefore,
      verifySnapshots(source, targetBefore),
      [],
    );
  }

  const preflight = [
    ...sourceChecks,
    ...validationChecks(targetBefore, 'target'),
    ...findTargetConflicts(source, targetBefore),
  ];
  if (preflight.some((check) => !check.ok)) {
    return report(mode, source, targetBefore, preflight, []);
  }
  const applied = await repository.applySnapshot(source);
  const targetAfter = await repository.readTargetSnapshot();
  return report(
    mode,
    source,
    targetAfter,
    verifySnapshots(source, targetAfter),
    [],
    applied,
  );
}
