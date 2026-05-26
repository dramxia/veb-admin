import { LRUCache } from 'lru-cache';

export type PermissionSnapshot = {
  roleCodes: string[];
  permissionCodes: string[];
};

export const permissionCache = new LRUCache<string, PermissionSnapshot>({
  max: 1000,
  ttl: 1000 * 60 * 5,
});

export function getCachedPermissions(userId: string) {
  return permissionCache.get(userId);
}

export function setCachedPermissions(userId: string, snapshot: PermissionSnapshot) {
  permissionCache.set(userId, snapshot);
  return snapshot;
}

export function invalidatePermissionCache(userId?: string | null) {
  if (userId) permissionCache.delete(userId);
  else permissionCache.clear();
}
