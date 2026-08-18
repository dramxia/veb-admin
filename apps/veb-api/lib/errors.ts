import {
  ERROR_CODES as CONTRACT_ERROR_CODES,
  type ApiErrorCode,
} from '@veb/api-contracts';
import { t } from './i18n';

export const ERROR_CODES = CONTRACT_ERROR_CODES;

export class AppError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status = 400,
    public cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ParamError extends AppError {
  constructor(message = t('error.param'), cause?: unknown) {
    super(ERROR_CODES.PARAM_ERROR, message, 400, cause);
  }
}

export class AuthError extends AppError {
  constructor(message = t('error.unauthorized'), cause?: unknown) {
    super(ERROR_CODES.UNAUTHORIZED, message, 401, cause);
  }
}

export class PermissionError extends AppError {
  constructor(message = t('error.forbidden'), cause?: unknown) {
    super(ERROR_CODES.FORBIDDEN, message, 403, cause);
  }
}

export class NotFoundError extends AppError {
  constructor(message = t('error.notFound'), cause?: unknown) {
    super(ERROR_CODES.NOT_FOUND, message, 404, cause);
  }
}

export class ConflictError extends AppError {
  constructor(message = t('error.conflict'), cause?: unknown) {
    super(ERROR_CODES.CONFLICT, message, 409, cause);
  }
}

export class RateLimitError extends AppError {
  constructor(message = t('error.rateLimited'), cause?: unknown) {
    super(ERROR_CODES.RATE_LIMITED, message, 429, cause);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = '博客服务暂时不可用', cause?: unknown) {
    super(ERROR_CODES.SERVICE_UNAVAILABLE, message, 503, cause);
  }
}
