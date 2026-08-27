import { describe, expect, it } from 'vitest';
import {
  isDatabaseConnectionError,
  isPrismaKnownRequestError,
  isPrismaSerializableConflict,
  isPrismaUniqueError,
} from '../api-kit/prisma-errors';

function fakePrismaError(name: string, code?: string, message?: string) {
  return Object.assign(new Error(message ?? 'err'), { name, code });
}

describe('isPrismaKnownRequestError', () => {
  it('matches PrismaClientKnownRequestError by name and code', () => {
    const error = fakePrismaError('PrismaClientKnownRequestError', 'P2002');
    expect(isPrismaKnownRequestError(error)).toBe(true);
    expect(isPrismaKnownRequestError(error, 'P2002')).toBe(true);
    expect(isPrismaKnownRequestError(error, 'P2025')).toBe(false);
  });

  it('rejects non-Prisma errors', () => {
    expect(isPrismaKnownRequestError(new Error('x'))).toBe(false);
    expect(isPrismaKnownRequestError(null)).toBe(false);
    expect(isPrismaKnownRequestError({ name: 'OtherError' })).toBe(false);
  });
});

describe('isPrismaUniqueError', () => {
  it('is true for P2002', () => {
    expect(
      isPrismaUniqueError(
        fakePrismaError('PrismaClientKnownRequestError', 'P2002'),
      ),
    ).toBe(true);
    expect(
      isPrismaUniqueError(
        fakePrismaError('PrismaClientKnownRequestError', 'P2003'),
      ),
    ).toBe(false);
  });
});

describe('isPrismaSerializableConflict', () => {
  it('is true for P2034', () => {
    expect(
      isPrismaSerializableConflict(
        fakePrismaError('PrismaClientKnownRequestError', 'P2034'),
      ),
    ).toBe(true);
    expect(
      isPrismaSerializableConflict(
        fakePrismaError('PrismaClientKnownRequestError', 'P2002'),
      ),
    ).toBe(false);
  });
});

describe('isDatabaseConnectionError', () => {
  it('matches PrismaClientInitializationError by name', () => {
    expect(
      isDatabaseConnectionError(
        fakePrismaError('PrismaClientInitializationError'),
      ),
    ).toBe(true);
  });

  it('matches known connection error codes', () => {
    for (const code of ['P1000', 'P1001', 'P1002', 'P1003', 'P1017']) {
      expect(
        isDatabaseConnectionError(
          fakePrismaError('PrismaClientKnownRequestError', code),
        ),
      ).toBe(true);
    }
  });

  it('matches errorCode field as well as code', () => {
    const error = Object.assign(new Error('x'), {
      name: 'PrismaClientInitializationError',
      errorCode: 'P1001',
    });
    expect(isDatabaseConnectionError(error)).toBe(true);
  });

  it('matches PrismaClient errors with connection-refused message', () => {
    expect(
      isDatabaseConnectionError(
        fakePrismaError(
          'PrismaClientUnknownRequestError',
          undefined,
          "Can't reach database server at localhost:5432",
        ),
      ),
    ).toBe(true);
    expect(
      isDatabaseConnectionError(
        fakePrismaError(
          'PrismaClientKnownRequestError',
          'P9999',
          'connection refused',
        ),
      ),
    ).toBe(true);
  });

  it('rejects unrelated errors', () => {
    expect(isDatabaseConnectionError(new Error('timeout'))).toBe(false);
    expect(isDatabaseConnectionError(null)).toBe(false);
    expect(isDatabaseConnectionError({ name: 'TypeError' })).toBe(false);
  });
});
