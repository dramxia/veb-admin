import { describe, expect, it, vi } from 'vitest';
import { userListQuerySchema } from '@veb/api-contracts';
import { pageOptions, readQuery } from '@/lib/api';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/operation-log', () => ({ logOperation: vi.fn() }));

describe('VEB query parsing', () => {
  it('parses contract-backed pagination and computes database offsets', () => {
    const query = readQuery(
      new Request(
        'http://core-api.test/api/v1/system/users?page=3&pageSize=25&status=ENABLED',
      ),
      userListQuerySchema,
    );

    expect(query).toEqual({ page: 3, pageSize: 25, status: 'ENABLED' });
    expect(pageOptions(query)).toEqual({ page: 3, pageSize: 25, skip: 50 });
  });

  it('rejects malformed pagination and enum values', () => {
    expect(() =>
      readQuery(
        new Request('http://core-api.test/api/v1/system/users?page=NaN'),
        userListQuerySchema,
      ),
    ).toThrow();
    expect(() =>
      readQuery(
        new Request('http://core-api.test/api/v1/system/users?status=UNKNOWN'),
        userListQuerySchema,
      ),
    ).toThrow();
  });
});
