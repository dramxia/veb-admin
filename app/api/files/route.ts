export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Prisma } from '@prisma/client';
import { ok, parsePage, withApi } from '@/lib/api';
import { ParamError } from '@/lib/errors';
import { t } from '@/lib/i18n';
import { hasPermission, requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { assertRateLimit, getClientIp } from '@/lib/rate-limit';
import { requireUser } from '@/lib/session';
import { getStorage } from '@/lib/storage';
import { logOperation } from '@/lib/operation-log';
import { prepareUploadFile } from '@/lib/upload';

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
};

export const GET = withApi(async (request: Request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip } = parsePage(searchParams);
  const keyword = searchParams.get('keyword')?.trim();
  const canViewAll = await hasPermission(user.id, 'system:file:view');

  const where: Prisma.FileWhereInput = {
    ...(!canViewAll ? { uploaderId: user.id } : {}),
    ...(keyword ? { OR: [{ name: { contains: keyword, mode: 'insensitive' } }, { mime: { contains: keyword } }] } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.file.count({ where }),
    prisma.file.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' }, select: fileSelect }),
  ]);

  const storage = getStorage();
  return ok({ items: items.map((item) => ({ ...item, url: storage.url(item) })), total, page, pageSize });
});

export const POST = withApi(async (request: Request) => {
  assertRateLimit({ key: `upload:${getClientIp(request)}`, capacity: 10, windowMs: 5000 });
  const user = await requirePermission('system:file:upload');
  const formData = await request.formData();
  const rawFile = formData.get('file');
  if (!(rawFile instanceof File)) throw new ParamError(t('upload.required'));

  const prepared = await prepareUploadFile(rawFile);
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
      uploaderId: user.id,
      scope: String(formData.get('scope') || '') || null,
    },
    select: fileSelect,
  });

  await logOperation({
    actorId: user.id,
    action: 'file.upload',
    target: record.id,
    status: 'SUCCESS',
    payload: { name: record.name, size: record.size, mime: record.mime },
    req: request,
  });

  return ok({ ...record, url: storage.url(record) });
}, { action: 'file.upload', logSuccess: false });
