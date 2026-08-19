import {
  ERROR_CODES as CONTRACT_ERROR_CODES,
  type ApiErrorCode,
} from '@veb/api-contracts';

export const ERROR_CODES = CONTRACT_ERROR_CODES;

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 400,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ParamError extends AppError {
  constructor(message = '请求参数错误', cause?: unknown) {
    super(ERROR_CODES.PARAM_ERROR, message, 400, cause);
  }
}

export class AuthError extends AppError {
  constructor(message = '请先登录', cause?: unknown) {
    super(ERROR_CODES.UNAUTHORIZED, message, 401, cause);
  }
}

export class PermissionError extends AppError {
  constructor(message = '无权执行此操作', cause?: unknown) {
    super(ERROR_CODES.FORBIDDEN, message, 403, cause);
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源不存在', cause?: unknown) {
    super(ERROR_CODES.NOT_FOUND, message, 404, cause);
  }
}

export class ConflictError extends AppError {
  constructor(message = '资源冲突', cause?: unknown) {
    super(ERROR_CODES.CONFLICT, message, 409, cause);
  }
}

export class RateLimitError extends AppError {
  constructor(message = '请求过于频繁', cause?: unknown) {
    super(ERROR_CODES.RATE_LIMITED, message, 429, cause);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = '服务暂时不可用', cause?: unknown) {
    super(ERROR_CODES.SERVICE_UNAVAILABLE, message, 503, cause);
  }
}
