import type { z } from 'zod';

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
