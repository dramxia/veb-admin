import { z } from 'zod';

const blogApiEnvSchema = z.object({
  BLOG_API_INTERNAL_URL: z
    .string()
    .url()
    .transform((value) => value.replace(/\/$/, '')),
  SERVICE_AUTH_PRIVATE_KEY: z.string().min(1),
  SERVICE_AUTH_KEY_ID: z.string().min(1),
  SERVICE_AUTH_ISSUER: z.string().min(1).default('veb-api'),
});

const jwksEnvSchema = z.object({
  SERVICE_AUTH_PUBLIC_KEY: z.string().min(1),
  SERVICE_AUTH_KEY_ID: z.string().min(1),
});

export type BlogApiEnv = z.infer<typeof blogApiEnvSchema>;
export type JwksEnv = z.infer<typeof jwksEnvSchema>;

let cachedBlogApiEnv: BlogApiEnv | undefined;
let cachedJwksEnv: JwksEnv | undefined;

export function getBlogApiEnv() {
  if (!cachedBlogApiEnv) {
    const result = blogApiEnvSchema.safeParse(process.env);
    if (!result.success) {
      throw new Error(
        `VEB API 博客服务配置无效: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
      );
    }
    cachedBlogApiEnv = result.data;
  }
  return cachedBlogApiEnv;
}

export function getJwksEnv() {
  if (!cachedJwksEnv) {
    const result = jwksEnvSchema.safeParse(process.env);
    if (!result.success) {
      throw new Error(
        `VEB API JWKS 配置无效: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
      );
    }
    cachedJwksEnv = result.data;
  }
  return cachedJwksEnv;
}

export function resetEnvCache() {
  cachedBlogApiEnv = undefined;
  cachedJwksEnv = undefined;
}
