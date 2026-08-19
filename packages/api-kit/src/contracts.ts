import type { z } from 'zod';

/**
 * 用契约 schema 校验 API 出参，防止响应偏离 @veb/api-contracts 定义。
 * 校验失败视为服务端实现错误（500），而非参数错误。
 */
export function parseOutput<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error('API response violated its contract', {
      cause: result.error,
    });
  }
  return result.data;
}
