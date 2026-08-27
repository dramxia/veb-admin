import { LocalStorageAdapter } from './local';
import type { StorageAdapter } from './types';

let storage: StorageAdapter | null = null;

export function getStorage() {
  if (!storage) {
    const kind = process.env.STORAGE_KIND || 'local';
    if (kind !== 'local') throw new Error(`暂不支持的存储类型: ${kind}`);
    storage = new LocalStorageAdapter();
  }
  return storage;
}
