import { auth } from './auth';
import { AuthError } from './errors';

export async function getSession() {
  return auth();
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new AuthError();
  }
  return session.user;
}
