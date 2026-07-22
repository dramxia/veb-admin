import type { FileListQuery as FileListContractQuery } from '@veb/api-contracts';
import { Prisma } from '@/generated/client';
import { NotFoundError, PermissionError } from '@/lib/errors';
import { hasPermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage';
import { prepareUploadFile } from '@/lib/upload';

type FileListQuery = FileListContractQuery & {
  skip: number;
};

const fileSelect = {
  id: true,
  name: true,
  path: true,
  mime: true,
  size: true,
  uploaderId: true,
  scope: true,
  createdAt: true,
  uploader: { select: { id: true, username: true, nickname: true } },
} satisfies Prisma.FileSelect;

async function getAuthorizedFile(
  userId: string,
  id: string,
  permission: string,
) {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw new NotFoundError('文件不存在');
  const allowed =
    file.uploaderId === userId || (await hasPermission(userId, permission));
  if (!allowed) throw new PermissionError();
  return file;
}

export async function listFiles(
  userId: string,
  canViewAll: boolean,
  { page, pageSize, skip, keyword }: FileListQuery,
) {
  const where: Prisma.FileWhereInput = {
    ...(!canViewAll ? { uploaderId: userId } : {}),
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { mime: { contains: keyword } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.file.count({ where }),
    prisma.file.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: fileSelect,
    }),
  ]);
  const storage = getStorage();
  return {
    items: items.map((item) => ({ ...item, url: storage.url(item) })),
    total,
    page,
    pageSize,
  };
}

export async function uploadFile(
  userId: string,
  file: globalThis.File,
  scope: string | null,
) {
  const prepared = await prepareUploadFile(file);
  const storage = getStorage();
  const saved = await storage.save({
    buffer: prepared.buffer,
    originalName: prepared.originalName,
    mime: prepared.mime,
  });
  const record = await prisma.file.create({
    data: {
      name: prepared.originalName,
      path: saved.path,
      mime: prepared.mime,
      size: prepared.size,
      uploaderId: userId,
      scope,
    },
    select: fileSelect,
  });
  return { record, response: { ...record, url: storage.url(record) } };
}

export async function readFile(userId: string, id: string) {
  const file = await getAuthorizedFile(userId, id, 'system:file:view');
  const buffer = await getStorage().load(file.path);
  return { file, buffer };
}

export async function deleteFile(userId: string, id: string) {
  const file = await getAuthorizedFile(userId, id, 'system:file:delete');
  await prisma.file.delete({ where: { id } });
  await getStorage().delete(file.path);
  return file;
}
