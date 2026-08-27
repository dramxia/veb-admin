import type {
  AdminArticleDetail,
  AdminArticleListItem,
  Author,
  PageResult as ContractPageResult,
} from '@veb/api-contracts';

export type ContentTag = AdminArticleListItem['tags'][number];
export type BlogAuthor = Author;
export type ArticleListItem = AdminArticleListItem;
export type ArticleDetail = AdminArticleDetail;
export type PageResult<T> = ContractPageResult<T>;
