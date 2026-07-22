import {
  adminArticleListQuerySchema,
  articleUpdateInputSchema,
  internalArticleCreateInputSchema,
  likeBatchDeleteInputSchema,
  likeListQuerySchema,
  likeStatsQuerySchema,
  paginationQuerySchema,
  tagCreateInputSchema,
  tagIdsInputSchema,
  tagListQuerySchema,
  tagUpdateInputSchema,
} from '@veb/api-contracts';
import { ok, readJson, readQuery, withApi } from '@/lib/api';
import { parseOptionalDate } from '@/lib/content';
import { ParamError } from '@/lib/errors';
import {
  batchDeleteLikes,
  createArticle as createArticleRecord,
  createTag as createTagRecord,
  deleteArticle,
  deleteLike,
  deleteTag,
  getAdminArticle,
  getAdminTag,
  getArticleTags,
  getLike,
  getLikeStats,
  listAdminArticles,
  listArticleAuthors,
  listAdminTags,
  listLikes,
  listTagArticles,
  replaceArticleTags,
  updateArticle,
  updateTag,
} from '@/modules/content/service';

type IdContext = { params: { id: string } };

const internal = (permission: string) => ({ internal: true, permission });

function pageOptions(query: { page: number; pageSize: number }) {
  return {
    ...query,
    skip: (query.page - 1) * query.pageSize,
  };
}

export const listArticles = withApi(async (request) => {
  const query = readQuery(request, adminArticleListQuerySchema);
  return ok(
    await listAdminArticles(pageOptions(query), {
      keyword: query.keyword,
      status: query.status,
      tagId: query.tagId,
      authorId: query.authorId,
    }),
  );
}, internal('content:article:view'));

export const createArticle = withApi(async (request) => {
  const input = await readJson(request, internalArticleCreateInputSchema);
  return ok(await createArticleRecord(input));
}, internal('content:article:create'));

export const listAuthors = withApi(
  async () => ok(await listArticleAuthors()),
  internal('content:article:view'),
);

export const getArticle = withApi<IdContext>(
  async (_request, context) => ok(await getAdminArticle(context.params.id)),
  internal('content:article:view'),
);

export const patchArticle = withApi<IdContext>(async (request, context) => {
  const input = await readJson(request, articleUpdateInputSchema);
  return ok(await updateArticle(context.params.id, input));
}, internal('content:article:update'));

export const removeArticle = withApi<IdContext>(
  async (_request, context) => ok(await deleteArticle(context.params.id)),
  internal('content:article:delete'),
);

export const getArticleTagList = withApi<IdContext>(
  async (_request, context) => ok(await getArticleTags(context.params.id)),
  internal('content:tag:assign'),
);

export const putArticleTags = withApi<IdContext>(async (request, context) => {
  const { tagIds } = await readJson(request, tagIdsInputSchema);
  return ok(await replaceArticleTags(context.params.id, tagIds));
}, internal('content:tag:assign'));

export const listTags = withApi(async (request) => {
  const query = readQuery(request, tagListQuerySchema);
  return ok(await listAdminTags(pageOptions(query), query.keyword));
}, internal('content:tag:view'));

export const createTag = withApi(async (request) => {
  const input = await readJson(request, tagCreateInputSchema);
  return ok(await createTagRecord(input));
}, internal('content:tag:create'));

export const getTag = withApi<IdContext>(
  async (_request, context) => ok(await getAdminTag(context.params.id)),
  internal('content:tag:view'),
);

export const patchTag = withApi<IdContext>(async (request, context) => {
  const input = await readJson(request, tagUpdateInputSchema);
  return ok(await updateTag(context.params.id, input));
}, internal('content:tag:update'));

export const removeTag = withApi<IdContext>(
  async (_request, context) => ok(await deleteTag(context.params.id)),
  internal('content:tag:delete'),
);

export const listArticlesForTag = withApi<IdContext>(
  async (request, context) => {
    const query = readQuery(request, paginationQuerySchema);
    return ok(await listTagArticles(context.params.id, pageOptions(query)));
  },
  internal('content:tag:view'),
);

export const listArticleLikes = withApi(async (request) => {
  const query = readQuery(request, likeListQuerySchema);
  return ok(
    await listLikes(pageOptions(query), {
      articleId: query.articleId,
      keyword: query.keyword,
      from: parseOptionalDate(query.from ?? null, '开始时间'),
      to: parseOptionalDate(query.to ?? null, '结束时间'),
    }),
  );
}, internal('content:like:view'));

export const getArticleLike = withApi<IdContext>(
  async (_request, context) => ok(await getLike(context.params.id)),
  internal('content:like:view'),
);

export const removeArticleLike = withApi<IdContext>(
  async (_request, context) => ok(await deleteLike(context.params.id)),
  internal('content:like:delete'),
);

export const batchRemoveArticleLikes = withApi(async (request) => {
  const { ids } = await readJson(request, likeBatchDeleteInputSchema);
  return ok(await batchDeleteLikes(ids));
}, internal('content:like:delete'));

export const getArticleLikeStats = withApi(async (request) => {
  const query = readQuery(request, likeStatsQuerySchema);
  const from =
    parseOptionalDate(query.from ?? null, '开始时间') ||
    new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
  const to = parseOptionalDate(query.to ?? null, '结束时间') || new Date();
  if (from > to) throw new ParamError('开始时间不能晚于结束时间');
  return ok(
    await getLikeStats({
      articleId: query.articleId,
      from,
      to,
    }),
  );
}, internal('content:like:stats'));
