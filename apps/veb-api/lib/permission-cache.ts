export type PermissionSnapshot = {
  roleCodes: string[];
  moduleIds: string[];
  permissionCodes: string[];
};

/**
 * Mutation services keep calling this compatibility hook. Authorization
 * snapshots are intentionally read from PostgreSQL on every request so a
 * revocation is visible across all server instances without cache coordination.
 */
export function invalidatePermissionCache(userId?: string | null) {
  void userId;
}
