export type MigrationMode = 'dry-run' | 'apply' | 'verify';

export const MIGRATION_TABLE_ORDER = [
  'Tag',
  'Article',
  'ArticleTag',
  'ArticleLike',
] as const;

export type TagRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentMarkdown: string;
  status: 'DRAFT' | 'PUBLISHED';
  authorId: string | null;
  authorUsername: string | null;
  authorNickname: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticleTagRow = {
  articleId: string;
  tagId: string;
};

export type ArticleLikeRow = {
  id: string;
  articleId: string;
  visitorKeyHash: string;
  createdAt: string;
};

export type BlogSnapshot = {
  tags: TagRow[];
  articles: ArticleRow[];
  articleTags: ArticleTagRow[];
  articleLikes: ArticleLikeRow[];
};

export type MigrationCounts = {
  tags: number;
  articles: number;
  articleTags: number;
  articleLikes: number;
};

export type VerificationCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

export type MigrationReport = {
  mode: MigrationMode;
  ok: boolean;
  sourceCounts: MigrationCounts;
  targetCounts: MigrationCounts;
  applied?: MigrationCounts;
  checks: VerificationCheck[];
  errors: string[];
  warnings: string[];
};

export interface MigrationRepository {
  readSourceSnapshot(): Promise<BlogSnapshot>;
  readTargetSnapshot(): Promise<BlogSnapshot>;
  applySnapshot(snapshot: BlogSnapshot): Promise<MigrationCounts>;
  close(): Promise<void>;
}
