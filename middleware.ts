import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = ['/login', '/403', '/404'];
const builtinProtectedPaths = ['/', '/profile'];

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function isPublicPath(pathname: string) {
  return (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js)$/.test(pathname)
  );
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function hasMenuAccess(pathname: string, menuPaths: string[]) {
  const normalizedPath = normalizePath(pathname);
  const matched = menuPaths
    .map(normalizePath)
    .filter((menuPath) => normalizedPath === menuPath || normalizedPath.startsWith(`${menuPath}/`))
    .sort((a, b) => b.length - a.length)[0];

  return Boolean(matched);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.disabled) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/api')) return NextResponse.next();

  const normalizedPath = normalizePath(pathname);
  if (builtinProtectedPaths.includes(normalizedPath)) return NextResponse.next();

  const roles = toStringArray(token.roles);
  if (roles.includes('superadmin')) return NextResponse.next();

  if (!hasMenuAccess(pathname, toStringArray(token.menuPaths))) {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
