import { AsyncLocalStorage } from 'node:async_hooks';
import type { Session } from 'next-auth';
import { auth } from './auth';
import { AuthError } from './errors';

export type AuthenticatedUser = Session['user'] & { id: string };

const authenticatedUserStorage = new AsyncLocalStorage<AuthenticatedUser>();

export function runWithAuthenticatedUser<T>(
  user: AuthenticatedUser,
  callback: () => T,
) {
  return authenticatedUserStorage.run(user, callback);
}

export function getAuthenticatedUser() {
  const user = authenticatedUserStorage.getStore();
  if (!user?.id) throw new AuthError();
  return user;
}

export async function getSession() {
  return auth();
}

export async function requireUser() {
  const routeUser = authenticatedUserStorage.getStore();
  if (routeUser?.id) return routeUser;

  const session = await getSession();
  if (!session?.user?.id) {
    throw new AuthError();
  }
  return session.user;
}
