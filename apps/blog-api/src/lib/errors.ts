import { ERROR_CODES, type ApiErrorCode } from '@veb/api-contracts';

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 400,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ParamError extends AppError {
  constructor(message = '请求参数错误', options?: ErrorOptions) {
    super(ERROR_CODES.PARAM_ERROR, message, 400, options);
  }
}

export class AuthError extends AppError {
  constructor(message = '服务身份验证失败', options?: ErrorOptions) {
    super(ERROR_CODES.UNAUTHORIZED, message, 401, options);
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源不存在', options?: ErrorOptions) {
    super(ERROR_CODES.NOT_FOUND, message, 404, options);
  }
}

export class ConflictError extends AppError {
  constructor(message = '资源冲突', options?: ErrorOptions) {
    super(ERROR_CODES.CONFLICT, message, 409, options);
  }
}

export class RateLimitError extends AppError {
  constructor(message = '请求过于频繁', options?: ErrorOptions) {
    super(ERROR_CODES.RATE_LIMITED, message, 429, options);
  }
}
