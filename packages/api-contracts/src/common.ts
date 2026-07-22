import { z } from 'zod';

export const ERROR_CODES = {
  OK: 0,
  PARAM_ERROR: 40001,
  UNAUTHORIZED: 40101,
  FORBIDDEN: 40301,
  NOT_FOUND: 40401,
  CONFLICT: 40901,
  RATE_LIMITED: 42901,
  SERVER_ERROR: 50001,
  SERVICE_UNAVAILABLE: 50301,
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export type ApiErrorCode = Exclude<ErrorCode, typeof ERROR_CODES.OK>;

export const apiErrorCodeSchema = z.union([
  z.literal(ERROR_CODES.PARAM_ERROR),
  z.literal(ERROR_CODES.UNAUTHORIZED),
  z.literal(ERROR_CODES.FORBIDDEN),
  z.literal(ERROR_CODES.NOT_FOUND),
  z.literal(ERROR_CODES.CONFLICT),
  z.literal(ERROR_CODES.RATE_LIMITED),
  z.literal(ERROR_CODES.SERVER_ERROR),
  z.literal(ERROR_CODES.SERVICE_UNAVAILABLE),
]);

export const idSchema = z.string().trim().min(1, 'id 不能为空');
export const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true, message: '必须是 ISO 8601 日期时间字符串' });

export type ApiSuccess<T> = {
  code: typeof ERROR_CODES.OK;
  data: T;
  message: string;
};

export type ApiError = {
  code: number;
  data: null;
  message: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export function apiSuccessSchema<TSchema extends z.ZodTypeAny>(
  dataSchema: TSchema,
) {
  return z
    .object({
      code: z.literal(ERROR_CODES.OK),
      data: dataSchema,
      message: z.string(),
    })
    .strict();
}

export const apiErrorSchema = z
  .object({
    code: apiErrorCodeSchema,
    data: z.null(),
    message: z.string().min(1),
  })
  .strict();

export function apiResultSchema<TSchema extends z.ZodTypeAny>(
  dataSchema: TSchema,
) {
  return z.union([apiSuccessSchema(dataSchema), apiErrorSchema]);
}

export const apiEnvelopeSchema = apiResultSchema;

export function createApiSuccess<T>(data: T, message = 'ok'): ApiSuccess<T> {
  return { code: ERROR_CODES.OK, data, message };
}

export function createApiError(code: number, message: string): ApiError {
  return { code, data: null, message };
}

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function pageResultSchema<TSchema extends z.ZodTypeAny>(
  itemSchema: TSchema,
) {
  return z
    .object({
      items: z.array(itemSchema),
      total: z.number().int().nonnegative(),
      page: z.number().int().min(1),
      pageSize: z.number().int().min(1).max(100),
    })
    .strict();
}

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const REQUEST_ID_HEADER = 'x-request-id' as const;
