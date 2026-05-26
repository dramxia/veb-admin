import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { CommonStatus, UserStatus } from '@prisma/client';
import { prisma } from './prisma';
import { assertRateLimit, getClientIp } from './rate-limit';


type AuthTokenPayload = {
  userId?: string;
  username?: string;
  nickname?: string | null;
  avatar?: string | null;
  roles?: string[];
  permissionCodes?: string[];
  menuPaths?: string[];
  disabled?: boolean;
};

function normalizeMenuPath(path: string) {
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
}

async function loadAuthTokenPayload(userId: string): Promise<AuthTokenPayload> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
      status: true,
      roles: {
        where: { role: { status: CommonStatus.ENABLED } },
        select: {
          role: {
            select: {
              code: true,
              permissions: { select: { permission: { select: { code: true } } } },
            },
          },
        },
      },
    },
  });

  if (!user || user.status === UserStatus.DISABLED) {
    return {
      userId,
      roles: [],
      permissionCodes: [],
      menuPaths: [],
      disabled: true,
    };
  }

  const roles = user.roles.map((item) => item.role.code);
  const permissionCodes = [
    ...new Set(user.roles.flatMap((item) => item.role.permissions.map((rp) => rp.permission.code))),
  ];
  const isSuperadmin = roles.includes('superadmin');

  const menus = await prisma.menu.findMany({
    where: { status: CommonStatus.ENABLED, type: { not: 'DIR' } },
    select: { path: true, permissionCode: true },
  });
  const allowed = new Set(permissionCodes);
  const menuPaths = [
    ...new Set(
      menus
        .filter((menu) => isSuperadmin || !menu.permissionCode || allowed.has(menu.permissionCode))
        .map((menu) => normalizeMenuPath(menu.path)),
    ),
  ];

  return {
    userId: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    roles,
    permissionCodes,
    menuPaths,
    disabled: false,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        assertRateLimit({ key: `login:${getClientIp(request)}`, capacity: 10, windowMs: 5000 });
        const username = String(credentials?.username ?? '');
        const password = String(credentials?.password ?? '');
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: { username },
          include: { roles: { include: { role: true } } },
        });
        if (!user || user.status !== 'ENABLED') return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.nickname ?? user.username,
          email: user.email,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          roles: user.roles.map((item) => item.role.code),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id ?? token.userId;
      if (userId) {
        const payload = await loadAuthTokenPayload(String(userId));
        token.userId = payload.userId;
        token.username = payload.username;
        token.nickname = payload.nickname;
        token.avatar = payload.avatar;
        token.roles = payload.roles ?? [];
        token.permissionCodes = payload.permissionCodes ?? [];
        token.menuPaths = payload.menuPaths ?? [];
        token.disabled = payload.disabled ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.disabled) {
        session.user.id = '';
        session.user.username = '';
        session.user.nickname = null;
        session.user.avatar = null;
        session.user.roles = [];
        session.user.permissionCodes = [];
        session.user.menuPaths = [];
        return session;
      }

      session.user.id = String(token.userId ?? '');
      session.user.username = String(token.username ?? '');
      session.user.nickname = (token.nickname as string | null | undefined) ?? null;
      session.user.avatar = (token.avatar as string | null | undefined) ?? null;
      session.user.roles = (token.roles as string[] | undefined) ?? [];
      session.user.permissionCodes = (token.permissionCodes as string[] | undefined) ?? [];
      session.user.menuPaths = (token.menuPaths as string[] | undefined) ?? [];
      return session;
    },
  },
});
