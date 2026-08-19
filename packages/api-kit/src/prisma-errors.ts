/**
 * 与具体 Prisma Client 实例无关的错误判断工具。
 * 不导入 @prisma/client，统一使用 name + code 鸭子判断，
 * 因此可同时用于 veb-api（generated/client）与 blog-api（generated/prisma）。
 */

type PrismaErrorLike = {
  name?: string;
  code?: string;
  message?: string;
};

/** 判断是否为指定错误码的 PrismaClientKnownRequestError（默认 P2002 唯一约束）。 */
export function isPrismaKnownRequestError(
  error: unknown,
  code = 'P2002',
): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as PrismaErrorLike;
  return (
    candidate.name === 'PrismaClientKnownRequestError' &&
    candidate.code === code
  );
}

/** 唯一约束冲突（P2002）。 */
export function isPrismaUniqueError(error: unknown): boolean {
  return isPrismaKnownRequestError(error, 'P2002');
}

/** 序列化冲突（P2034），可安全重试。 */
export function isPrismaSerializableConflict(error: unknown): boolean {
  return isPrismaKnownRequestError(error, 'P2034');
}

export type DatabaseConnectionError = {
  name?: string;
  code?: string;
  errorCode?: string;
  message?: string;
};

const databaseConnectionCodes = new Set([
  'P1000',
  'P1001',
  'P1002',
  'P1003',
  'P1017',
]);

const databaseConnectionMessage =
  /can't reach database server|server has closed the connection|connection refused|error connecting to the database/i;

export function isDatabaseConnectionError(
  error: unknown,
): error is DatabaseConnectionError {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as DatabaseConnectionError;
  return (
    candidate.name === 'PrismaClientInitializationError' ||
    databaseConnectionCodes.has(candidate.errorCode ?? candidate.code ?? '') ||
    (candidate.name?.startsWith('PrismaClient') === true &&
      databaseConnectionMessage.test(candidate.message ?? ''))
  );
}
