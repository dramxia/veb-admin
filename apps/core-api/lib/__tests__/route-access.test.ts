import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assertPermission: vi.fn(),
  auth: vi.fn(),
  logOperation: vi.fn(),
  requireUser: vi.fn(),
  runWithAuthenticatedUser: vi.fn((_user: unknown, callback: () => unknown) =>
    callback(),
  ),
  withApi: vi.fn(
    (
      handler: (...args: unknown[]) => Promise<Response>,
      hooks: {
        prepare?: (args: unknown[]) => unknown;
        onSuccess?: (
          args: unknown[],
          response: Response,
          state: unknown,
        ) => Promise<void>;
        onFailure?: (
          args: unknown[],
          error: unknown,
          state: unknown,
        ) => Promise<void>;
      },
    ) =>
      async (...args: unknown[]) => {
        const state = hooks.prepare?.(args);
        try {
          const response = await handler(...args);
          await hooks.onSuccess?.(args, response, state);
          return response;
        } catch (error) {
          await hooks.onFailure?.(args, error, state);
          throw error;
        }
      },
  ),
}));

vi.mock('../session', () => ({
  requireUser: mocks.requireUser,
  runWithAuthenticatedUser: mocks.runWithAuthenticatedUser,
}));
vi.mock('../permission', () => ({ assertPermission: mocks.assertPermission }));
vi.mock('../api-kit', () => ({
  buildErrorResponse: vi.fn(),
  fail: vi.fn(),
  ok: vi.fn(),
  pageOptions: vi.fn(),
  readJson: vi.fn(),
  readQuery: vi.fn(),
  withApi: mocks.withApi,
}));
vi.mock('../auth', () => ({ auth: mocks.auth }));
vi.mock('../operation-log', () => ({ logOperation: mocks.logOperation }));

import { API_ROUTE_ACCESS, defineApiRoute, getRouteAccess } from '../api';

describe('defineApiRoute access boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: 'user-1' });
  });

  it('allows public handlers without a session', async () => {
    const handler = vi.fn(async (request: Request) => {
      void request;
      return new Response('ok');
    });
    const route = defineApiRoute({ access: 'public' }, handler);
    const response = await route(new Request('http://core.test/api/public'));
    expect(await response.text()).toBe('ok');
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it('requires a session before invoking private handlers', async () => {
    const order: string[] = [];
    mocks.requireUser.mockImplementation(async () => {
      order.push('session');
      return { id: 'user-1' };
    });
    const handler = vi.fn(async (request: Request) => {
      void request;
      order.push('handler');
      return new Response('ok');
    });
    const route = defineApiRoute({ access: 'private' }, handler);
    await route(new Request('http://core.test/api/private'));
    expect(order).toEqual(['session', 'handler']);
    expect(mocks.runWithAuthenticatedUser).toHaveBeenCalledWith(
      { id: 'user-1' },
      expect.any(Function),
    );
  });

  it('uses the authenticated route actor for operation audits', async () => {
    const request = new Request('http://core.test/api/private', {
      method: 'POST',
    });
    const route = defineApiRoute(
      {
        access: 'private',
        permission: 'blog:article:create',
        audit: { action: 'blog.article.create' },
      },
      async (request: Request) => {
        void request;
        return new Response('ok');
      },
    );

    await route(request);

    expect(mocks.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'blog.article.create',
        actorId: 'user-1',
        status: 'SUCCESS',
      }),
    );
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it('attaches immutable access metadata to classified handlers', () => {
    const access = {
      access: 'private' as const,
      permission: ['blog:article:update', 'blog:article:publish'],
    };
    const route = defineApiRoute(access, async () => new Response('ok'));

    expect(getRouteAccess(route)).toBe(access);
    expect(
      Object.getOwnPropertyDescriptor(route, API_ROUTE_ACCESS),
    ).toMatchObject({
      configurable: false,
      enumerable: false,
      writable: false,
    });
  });

  it('preserves any-of permission lists at the permission boundary', async () => {
    const handler = vi.fn(async (request: Request) => {
      void request;
      return new Response('ok');
    });
    const route = defineApiRoute(
      {
        access: 'private',
        permission: ['blog:article:update', 'blog:article:publish'],
      },
      handler,
    );
    await route(new Request('http://core.test/api/private'));
    expect(mocks.assertPermission).toHaveBeenCalledWith('user-1', [
      'blog:article:update',
      'blog:article:publish',
    ]);
  });
});
