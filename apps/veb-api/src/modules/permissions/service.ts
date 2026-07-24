import { GoneError } from '@/lib/errors';

function retiredPermissionApi(): never {
  throw new GoneError('权限管理已合并到菜单与权限管理');
}

/** @deprecated Permission resources are represented by Menu nodes. */
export async function listPermissions(query?: unknown): Promise<never> {
  void query;
  return retiredPermissionApi();
}

/** @deprecated Permission resources are represented by Menu nodes. */
export async function createPermission(data?: unknown): Promise<never> {
  void data;
  return retiredPermissionApi();
}

/** @deprecated Permission resources are represented by Menu nodes. */
export async function getPermission(id?: string): Promise<never> {
  void id;
  return retiredPermissionApi();
}

/** @deprecated Permission resources are represented by Menu nodes. */
export async function updatePermission(
  id?: string,
  data?: unknown,
): Promise<never> {
  void id;
  void data;
  return retiredPermissionApi();
}

/** @deprecated Permission resources are represented by Menu nodes. */
export async function deletePermission(id?: string): Promise<never> {
  void id;
  return retiredPermissionApi();
}
