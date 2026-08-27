import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(() => ({ id: 'user-1' })),
  readFile: vi.fn(),
}));

vi.mock('../api', () => ({
  ok: (data: unknown) => data,
  readQuery: (request: Request) =>
    Object.fromEntries(new URL(request.url).searchParams),
  withApi: (handler: unknown) => handler,
  defineApiRoute: (_access: unknown, handler: unknown) => handler,
}));

vi.mock('../permission', () => ({ requirePermission: vi.fn() }));
vi.mock('../operation-log', () => ({ logOperation: vi.fn() }));
vi.mock('../session', () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));
vi.mock('../../src/modules/files/service', () => ({
  deleteFile: vi.fn(),
  readFile: mocks.readFile,
}));

const { GET } = await import('../../app/api/v1/files/[id]/route');

describe('file response hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forces potentially active legacy records to download with hardened headers', async () => {
    mocks.readFile.mockResolvedValue({
      file: { name: 'legacy.html', mime: 'text/html', size: 13 },
      buffer: Buffer.from('<h1>test</h1>'),
    });

    const response = await GET(
      new Request('http://localhost/api/v1/files/file-1'),
      { params: { id: 'file-1' } },
    );

    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('content-security-policy')).toContain(
      "default-src 'none'",
    );
  });

  it('allows a verified raster MIME to render inline', async () => {
    mocks.readFile.mockResolvedValue({
      file: { name: 'photo.png', mime: 'image/png', size: 4 },
      buffer: Buffer.from([1, 2, 3, 4]),
    });

    const response = await GET(
      new Request('http://localhost/api/v1/files/file-1'),
      { params: { id: 'file-1' } },
    );

    expect(response.headers.get('content-disposition')).toContain('inline');
  });
});
