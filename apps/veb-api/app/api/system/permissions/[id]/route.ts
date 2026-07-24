export const dynamic = 'force-dynamic';

import { gone, withApi } from '@/lib/api';

const retired = withApi(() =>
  gone('权限管理已合并到菜单与权限管理，请改用菜单接口'),
);

export const GET = retired;
export const PATCH = retired;
export const DELETE = retired;
