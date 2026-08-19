/**
 * 在开发环境下把 PrismaClient 挂到 globalThis，避免 Next.js 热重载
 * 导致连接数爆炸；生产环境每次模块加载都新建实例，与原始实现一致。
 *
 * 使用方传入各自生成的 PrismaClient 构造器与全局 key，保证两个应用
 * 的全局缓存互不冲突（veb-api 用 `prisma`，blog-api 用 `blogPrisma`）。
 */
export function createPrismaSingleton<TClient>(
  globalKey: string,
  create: () => TClient,
): TClient {
  const globalStore = globalThis as unknown as Record<
    string,
    TClient | undefined
  >;
  const cached = globalStore[globalKey];
  if (cached) return cached;
  const client = create();
  if (process.env.NODE_ENV !== 'production') {
    globalStore[globalKey] = client;
  }
  return client;
}
