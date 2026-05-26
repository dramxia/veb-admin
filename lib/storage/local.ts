import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import nodePath from 'node:path';
import type { StorageAdapter, StorageSaveInput } from './types';

function uploadRoot() {
  return nodePath.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
}

function safeResolve(relativePath: string) {
  const root = uploadRoot();
  const fullPath = nodePath.resolve(root, relativePath);
  if (!fullPath.startsWith(root + nodePath.sep) && fullPath !== root) {
    throw new Error('非法文件路径');
  }
  return fullPath;
}

function extname(name: string) {
  return nodePath.extname(name).toLowerCase().slice(0, 20);
}

export class LocalStorageAdapter implements StorageAdapter {
  async save(input: StorageSaveInput) {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const relativePath = nodePath.posix.join(yyyy, mm, `${randomUUID()}${extname(input.originalName)}`);
    const fullPath = safeResolve(relativePath);
    await fs.mkdir(nodePath.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, input.buffer);
    return { path: relativePath };
  }

  async load(path: string) {
    return fs.readFile(safeResolve(path));
  }

  async delete(path: string) {
    try {
      await fs.unlink(safeResolve(path));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  url(file: { id: string }) {
    return `/api/files/${file.id}`;
  }
}
