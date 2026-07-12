export type ContentTag = { id: string; name: string; slug: string };
export type ContentAuthor = {
  id: string;
  username: string;
  nickname: string | null;
};
export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  author: ContentAuthor | null;
  tags: ContentTag[];
  likeCount: number;
  commentCount: number;
};
export type ArticleDetail = ArticleListItem & { contentMarkdown: string };
export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
