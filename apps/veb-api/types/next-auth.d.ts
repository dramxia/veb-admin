import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      nickname?: string | null;
      avatar?: string | null;
      roles: string[];
      permissionCodes: string[];
      menuPaths: string[];
    } & DefaultSession['user'];
  }

  interface User {
    username?: string;
    nickname?: string | null;
    avatar?: string | null;
    roles?: string[];
    permissionCodes?: string[];
    menuPaths?: string[];
    disabled?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    username?: string;
    nickname?: string | null;
    avatar?: string | null;
    roles?: string[];
    permissionCodes?: string[];
    menuPaths?: string[];
    disabled?: boolean;
  }
}
