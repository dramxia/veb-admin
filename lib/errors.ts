import { t } from './i18n';

export const ERROR_CODES = {
  OK: 0,
  PARAM_ERROR: 40001,
  UNAUTHORIZED: 40101,
  FORBIDDEN: 40301,
  NOT_FOUND: 40401,
  CONFLICT: 40901,
  RATE_LIMITED: 42901,
  SERVER_ERROR: 50001,
} as const;

export class AppError extends Error {
  constructor(
    public code: number,
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
