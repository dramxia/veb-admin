export const dynamic = 'force-dynamic';

import { gone, withApi } from '@/lib/api';

export const POST = withApi(() =>
  gone('角色权限分配已合并到访问权限接口，请改用 PUT /roles/:id/access'),
);
