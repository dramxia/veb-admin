import { z } from 'zod';
import { idSchema, isoDateTimeSchema, paginationQuerySchema } from './common';

export const articleStatusSchema = z.enum(['DRAFT', 'PUBLISHED']);

export const authorSnapshotSchema = z
  .object({
    id: idSchema,
    username: z.string(),
    nickname: z.string().nullable(),
  })
  .strict();

export const articleCreateInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '请输入文章标题')
      .max(120, '标题不能超过 120 个字符'),
    slug: z.string().trim().max(120, 'slug 不能超过 120 个字符').optional(),
    summary: z
      .string()
      .trim()
      .max(300, '摘要不能超过 300 个字符')
      .optional()
      .nullable(),
    contentMarkdown: z.string().max(200_000, '正文内容过长').optional(),
    status: articleStatusSchema,
    tagIds: z.array(idSchema).max(20, '每篇文章最多关联 20 个标签').default([]),
  })
  .strict();

export const articleUpdateInputSchema = articleCreateInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: '请至少提供一个修改字段',
  });

export const internalArticleCreateInputSchema = articleCreateInputSchema.extend(
  {
    author: authorSnapshotSchema,
  },
);

export const internalArticleUpdateInputSchema = articleCreateInputSchema
  .partial()
  .extend({ author: authorSnapshotSchema.optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: '请至少提供一个修改字段',
  });

export const tagCreateInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, '请输入标签名称')
      .max(40, '标签名称不能超过 40 个字符'),
    slug: z.string().trim().max(60, 'slug 不能超过 60 个字符').optional(),
  })
  .strict();

export const tagUpdateInputSchema = tagCreateInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: '请至少提供一个修改字段',
  });

export const tagIdsInputSchema = z
  .object({
    tagIds: z.array(idSchema).max(20, '每篇文章最多关联 20 个标签'),
  })
  .strict();

export const likeBatchDeleteInputSchema = z
  .object({
    ids: z
      .array(idSchema)
      .min(1, '请选择喜欢记录')
      .max(100, '单次最多删除 100 条记录'),
  })
  .strict();

export const adminTagSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    slug: z.string(),
    articleCount: z.number().int().nonnegative(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const adminArticleListItemSchema = z
  .object({
    id: idSchema,
    title: z.string(),
    slug: z.string(),
    summary: z.string().nullable(),
    status: articleStatusSchema,
    publishedAt: isoDateTimeSchema.nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    author: authorSnapshotSchema.nullable(),
    tags: z.array(
      adminTagSchema.omit({
        articleCount: true,
        createdAt: true,
        updatedAt: true,
      }),
    ),
    likeCount: z.number().int().nonnegative(),
    commentCount: z.number().int().nonnegative(),
  })
  .strict();

export const adminArticleDetailSchema = adminArticleListItemSchema
  .extend({ contentMarkdown: z.string() })
  .strict();

export const publicTagSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    articleCount: z.number().int().nonnegative().optional(),
  })
  .strict();

export const publicArticleListItemSchema = z
  .object({
    title: z.string(),
    slug: z.string(),
    summary: z.string().nullable(),
    publishedAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    authorNickname: z.string().nullable(),
    tags: z.array(publicTagSchema.omit({ articleCount: true })),
    likeCount: z.number().int().nonnegative(),
    commentCount: z.number().int().nonnegative(),
  })
  .strict();

export const publicArticleDetailSchema = publicArticleListItemSchema
  .extend({ contentMarkdown: z.string() })
  .strict();

export const articleLikeSchema = z
  .object({
    id: idSchema,
    articleId: idSchema,
    article: z.object({ title: z.string(), slug: z.string() }).strict(),
    visitorHashMasked: z.string(),
    createdAt: isoDateTimeSchema,
  })
  .strict();

export const likeStatsSchema = z
  .object({
    total: z.number().int().nonnegative(),
    from: isoDateTimeSchema.optional().nullable(),
    to: isoDateTimeSchema.optional().nullable(),
    articles: z.array(
      z
        .object({
          articleId: idSchema,
          title: z.string().optional(),
          slug: z.string().optional(),
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    trend: z.array(
      z
        .object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
  })
  .strict();

export const likeStateSchema = z
  .object({
    liked: z.boolean(),
    likeCount: z.number().int().nonnegative(),
  })
  .strict();

export const adminArticleListQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional(),
  status: articleStatusSchema.optional(),
  tagId: idSchema.optional(),
  authorId: idSchema.optional(),
});

export const publicArticleListQuerySchema = paginationQuerySchema.extend({
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  tag: z.string().trim().optional(),
});

export const tagListQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional(),
});

export const likeListQuerySchema = paginationQuerySchema.extend({
  articleId: idSchema.optional(),
  keyword: z.string().trim().optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
});

export const likeStatsQuerySchema = z.object({
  articleId: idSchema.optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
});

export type ArticleStatus = z.infer<typeof articleStatusSchema>;
export type AuthorSnapshot = z.infer<typeof authorSnapshotSchema>;
export type ArticleCreateInput = z.input<typeof articleCreateInputSchema>;
export type ArticleUpdateInput = z.input<typeof articleUpdateInputSchema>;
export type InternalArticleCreateInput = z.input<
  typeof internalArticleCreateInputSchema
>;
export type InternalArticleUpdateInput = z.input<
  typeof internalArticleUpdateInputSchema
>;
export type TagCreateInput = z.input<typeof tagCreateInputSchema>;
export type TagUpdateInput = z.input<typeof tagUpdateInputSchema>;
export type TagIdsInput = z.input<typeof tagIdsInputSchema>;
export type LikeBatchDeleteInput = z.input<typeof likeBatchDeleteInputSchema>;
export type AdminArticleListQuery = z.output<
  typeof adminArticleListQuerySchema
>;
export type PublicArticleListQuery = z.output<
  typeof publicArticleListQuerySchema
>;
export type TagListQuery = z.output<typeof tagListQuerySchema>;
export type LikeListQuery = z.output<typeof likeListQuerySchema>;
export type LikeStatsQuery = z.output<typeof likeStatsQuerySchema>;
export type AdminTag = z.infer<typeof adminTagSchema>;
export type AdminArticleListItem = z.infer<typeof adminArticleListItemSchema>;
export type AdminArticleDetail = z.infer<typeof adminArticleDetailSchema>;
export type PublicTag = z.infer<typeof publicTagSchema>;
export type PublicArticleListItem = z.infer<typeof publicArticleListItemSchema>;
export type PublicArticleDetail = z.infer<typeof publicArticleDetailSchema>;
export type ArticleLike = z.infer<typeof articleLikeSchema>;
export type LikeStats = z.infer<typeof likeStatsSchema>;
export type LikeState = z.infer<typeof likeStateSchema>;

// Compatibility aliases for the existing API handlers during the transition release.
export const articleCreateSchema = articleCreateInputSchema;
export const articleUpdateSchema = articleUpdateInputSchema;
export const tagSchema = tagCreateInputSchema;
export const tagUpdateSchema = tagUpdateInputSchema;
export const tagIdsSchema = tagIdsInputSchema;
export const likeBatchDeleteSchema = likeBatchDeleteInputSchema;
