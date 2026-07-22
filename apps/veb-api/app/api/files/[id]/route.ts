export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { fileReadQuerySchema } from '@veb/api-contracts';
import { ok, readQuery, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { logOperation } from '@/lib/operation-log';
import { requireUser } from '@/lib/session';
import { deleteFile, readFile } from '@/src/modules/files/service';

function encodeFileName(name: string) {
  return encodeURIComponent(name)
    .replace(/['()]/g, escape)
    .replace(/\*/g, '%2A');
}

function contentDisposition(name: string, download: boolean) {
  const type = download ? 'attachment' : 'inline';
  return `${type}; filename*=UTF-8''${encodeFileName(name)}`;
}

export const GET = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    const user = await requireUser();
    const { file, buffer } = await readFile(user.id, params.id);
    const { download } = readQuery(request, fileReadQuerySchema);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': file.mime,
        'Content-Length': String(file.size),
        'Content-Disposition': contentDisposition(file.name, download === '1'),
        'Cache-Control': 'private, max-age=300',
      },
    });
  },
);

export const DELETE = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    const user = await requirePermission('system:file:delete');
    const file = await deleteFile(user.id, params.id);
    await logOperation({
      actorId: user.id,
      action: 'file.delete',
      target: params.id,
      status: 'SUCCESS',
      payload: { name: file.name, size: file.size, mime: file.mime },
      req: request,
    });

    return ok({ id: params.id });
  },
  {
    action: 'file.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
    logSuccess: false,
  },
);
