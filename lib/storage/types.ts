export type StorageSaveInput = {
  buffer: Buffer;
  originalName: string;
  mime: string;
};

export type StorageSaveResult = {
  path: string;
};

export type StoredFileMeta = {
  id: string;
  name: string;
  path: string;
  mime: string;
  size: number;
};

export interface StorageAdapter {
  save(input: StorageSaveInput): Promise<StorageSaveResult>;
  load(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  url(file: StoredFileMeta): string;
}
