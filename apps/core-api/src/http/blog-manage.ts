import {
  adminArticleListQuerySchema,
  articleCreateInputSchema,
  articleUpdateInputSchema,
  likeBatchDeleteInputSchema,
  likeListQuerySchema,
  likeStatsQuerySchema,
  paginationQuerySchema,
  tagCreateInputSchema,
  tagIdsInputSchema,
  tagListQuerySchema,
  tagUpdateInputSchema,
} from '@veb/api-contracts';
import {
  defineApiRoute,
  ok,
  pageOptions,
  readJson,
  readQuery,
} from '@/lib/api';
import { ParamError } from '@/lib/errors';
import { parseOptionalDate } from '@/lib/blog';
import { assertPermission } from '@/lib/permission';
import { getAuthenticatedUser } from '@/lib/session';
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
} from '@/src/modules/blog/service';

type IdContext = { params: { id: string } };

const privateRoute = (permission: string, action?: string) => ({
  access: 'private' as const,
  permission,
  ...(action ? { audit: { action } } : {}),
});

export const listArticles = defineApiRoute(
  privateRoute('blog:article:view'),
  async (request: Request) => {
    const query = readQuery(request, adminArticleListQuerySchema);
    return ok(
      await listAdminArticles(pageOptions(query), {
        keyword: query.keyword,
        status: query.status,
        tagId: query.tagId,
        authorId: query.authorId,
      }),
    );
  },
);

export const createArticle = defineApiRoute(
  privateRoute('blog:article:create', 'blog.article.create'),
  async (request: Request) => {
    const user = getAuthenticatedUser();
    const input = await readJson(request, articleCreateInputSchema);
    if (input.status === 'PUBLISHED') {
      await assertPermission(user.id, 'blog:article:publish');
    }
    return ok(await createArticleRecord({ ...input, authorId: user.id }));
  },
);

export const listAuthors = defineApiRoute(
  privateRoute('blog:article:view'),
  async () => ok(await listArticleAuthors()),
);

export const getArticle = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:article:view'),
  async (_request, context) => ok(await getAdminArticle(context.params.id)),
);

export const patchArticle = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:article:update', 'blog.article.update'),
  async (request, context) => {
    const user = getAuthenticatedUser();
    const input = await readJson(request, articleUpdateInputSchema);
    if (input.status === 'PUBLISHED') {
      await assertPermission(user.id, 'blog:article:publish');
    }
    return ok(await updateArticle(context.params.id, input));
  },
);

export const removeArticle = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:article:delete', 'blog.article.delete'),
  async (_request, context) => ok(await deleteArticle(context.params.id)),
);

export const getArticleTagList = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:tag:assign'),
  async (_request, context) => ok(await getArticleTags(context.params.id)),
);

export const putArticleTags = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:tag:assign', 'blog.article.tags.update'),
  async (request, context) => {
    const { tagIds } = await readJson(request, tagIdsInputSchema);
    return ok(await replaceArticleTags(context.params.id, tagIds));
  },
);

export const listTags = defineApiRoute(
  privateRoute('blog:tag:view'),
  async (request: Request) => {
    const query = readQuery(request, tagListQuerySchema);
    return ok(await listAdminTags(pageOptions(query), query.keyword));
  },
);

export const createTag = defineApiRoute(
  privateRoute('blog:tag:create', 'blog.tag.create'),
  async (request: Request) =>
    ok(await createTagRecord(await readJson(request, tagCreateInputSchema))),
);

export const getTag = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:tag:view'),
  async (_request, context) => ok(await getAdminTag(context.params.id)),
);

export const patchTag = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:tag:update', 'blog.tag.update'),
  async (request, context) =>
    ok(
      await updateTag(
        context.params.id,
        await readJson(request, tagUpdateInputSchema),
      ),
    ),
);

export const removeTag = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:tag:delete', 'blog.tag.delete'),
  async (_request, context) => ok(await deleteTag(context.params.id)),
);

export const listArticlesForTag = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:tag:view'),
  async (request, context) => {
    const query = readQuery(request, paginationQuerySchema);
    return ok(await listTagArticles(context.params.id, pageOptions(query)));
  },
);

export const listArticleLikes = defineApiRoute(
  privateRoute('blog:like:view'),
  async (request: Request) => {
    const query = readQuery(request, likeListQuerySchema);
    return ok(
      await listLikes(pageOptions(query), {
        articleId: query.articleId,
        keyword: query.keyword,
        from: parseOptionalDate(query.from ?? null, '开始时间'),
        to: parseOptionalDate(query.to ?? null, '结束时间'),
      }),
    );
  },
);

export const getArticleLike = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:like:view'),
  async (_request, context) => ok(await getLike(context.params.id)),
);

export const removeArticleLike = defineApiRoute<[Request, IdContext]>(
  privateRoute('blog:like:delete', 'blog.like.delete'),
  async (_request, context) => ok(await deleteLike(context.params.id)),
);

export const batchRemoveArticleLikes = defineApiRoute(
  privateRoute('blog:like:delete', 'blog.like.batch-delete'),
  async (request: Request) => {
    const { ids } = await readJson(request, likeBatchDeleteInputSchema);
    return ok(await batchDeleteLikes(ids));
  },
);

export const getArticleLikeStats = defineApiRoute(
  privateRoute('blog:like:stats'),
  async (request: Request) => {
    const query = readQuery(request, likeStatsQuerySchema);
    const from =
      parseOptionalDate(query.from ?? null, '开始时间') ||
      new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const to = parseOptionalDate(query.to ?? null, '结束时间') || new Date();
    if (from > to) throw new ParamError('开始时间不能晚于结束时间');
    return ok(await getLikeStats({ articleId: query.articleId, from, to }));
  },
);
