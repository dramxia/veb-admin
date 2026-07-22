import type {
  AdminArticleDetail,
  AdminArticleListItem,
  AuthorSnapshot,
  PageResult as ContractPageResult,
} from '@veb/api-contracts';

export type ContentTag = AdminArticleListItem['tags'][number];
export type ContentAuthor = AuthorSnapshot;
export type ArticleListItem = AdminArticleListItem;
export type ArticleDetail = AdminArticleDetail;
export type PageResult<T> = ContractPageResult<T>;
