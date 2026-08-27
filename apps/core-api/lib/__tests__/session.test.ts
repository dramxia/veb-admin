import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock('../auth', () => ({ auth: mocks.auth }));

import {
  getAuthenticatedUser,
  requireUser,
  runWithAuthenticatedUser,
  type AuthenticatedUser,
} from '../session';

const user = (id: string): AuthenticatedUser => ({
  id,
  name: id,
  email: null,
  username: id,
  nickname: null,
  avatar: null,
  roles: [],
  permissionCodes: [],
});

describe('authenticated route context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps concurrent route users isolated across async work', async () => {
    const ids = await Promise.all([
      runWithAuthenticatedUser(user('user-1'), async () => {
        await Promise.resolve();
        return getAuthenticatedUser().id;
      }),
      runWithAuthenticatedUser(user('user-2'), async () => {
        await Promise.resolve();
        return getAuthenticatedUser().id;
      }),
    ]);

    expect(ids).toEqual(['user-1', 'user-2']);
  });

  it('lets requireUser reuse the trusted route user without reloading auth', async () => {
    await expect(
      runWithAuthenticatedUser(user('user-1'), () => requireUser()),
    ).resolves.toMatchObject({ id: 'user-1' });
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it('falls back to Auth.js outside a classified private route', async () => {
    mocks.auth.mockResolvedValue({ user: user('session-user') });

    await expect(requireUser()).resolves.toMatchObject({ id: 'session-user' });
    expect(mocks.auth).toHaveBeenCalledOnce();
  });
});
