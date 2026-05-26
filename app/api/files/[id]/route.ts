export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { ok, withApi } from '@/lib/api';
import { NotFoundError, PermissionError } from '@/lib/errors';
import { hasPermission, requirePermission } from '@/lib/permission';
import { logOperation } from '@/lib/operation-log';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { getStorage } from '@/lib/storage';

function encodeFileName(name: string) {
  return encodeURIComponent(name).replace(/['()]/g, escape).replace(/\*/g, '%2A');
}

function contentDisposition(name: string, download: boolean) {
  const type = download ? 'attachment' : 'inline';
  return `${type}; filename*=UTF-8''${encodeFileName(name)}`;
}

async function getAuthorizedFile(userId: string, id: string, permission = 'system:file:view') {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw new NotFoundError('文件不存在');
  const allowed = file.uploaderId === userId || (await hasPermission(userId, permission));
  if (!allowed) throw new PermissionError();
  return file;
}

export const GET = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const file = await getAuthorizedFile(user.id, params.id, 'system:file:view');
  const storage = getStorage();
  const buffer = await storage.load(file.path);
  const { searchParams } = new URL(request.url);
  const download = searchParams.get('download') === '1';

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(file.size),
      'Content-Disposition': contentDisposition(file.name, download),
      'Cache-Control': 'private, max-age=300',
    },
  });
});

export const DELETE = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  const user = await requirePermission('system:file:delete');
  const file = await getAuthorizedFile(user.id, params.id, 'system:file:delete');

  await prisma.file.delete({ where: { id: params.id } });
  await getStorage().delete(file.path);
  await logOperation({
    actorId: user.id,
    action: 'file.delete',
    target: params.id,
    status: 'SUCCESS',
    payload: { name: file.name, size: file.size, mime: file.mime },
    req: request,
  });

  return ok({ id: params.id });
}, { action: 'file.delete', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id, logSuccess: false });
