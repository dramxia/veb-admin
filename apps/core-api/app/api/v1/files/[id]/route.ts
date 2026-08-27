export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { fileReadQuerySchema } from '@veb/api-contracts';
import { ok, readQuery, defineApiRoute } from '@/lib/api';
import { logOperation } from '@/lib/operation-log';
import { getAuthenticatedUser } from '@/lib/session';
import { isInlinePreviewMime } from '@/lib/upload';
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

export const GET = defineApiRoute(
  { access: 'private' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const user = getAuthenticatedUser();
    const { file, buffer } = await readFile(user.id, params.id);
    const { download } = readQuery(request, fileReadQuerySchema);

    const forceDownload = download === '1' || !isInlinePreviewMime(file.mime);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': file.mime,
        'Content-Length': String(file.size),
        'Content-Disposition': contentDisposition(file.name, forceDownload),
        'Cache-Control': 'private, max-age=300',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cross-Origin-Resource-Policy': 'same-origin',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
);

export const DELETE = defineApiRoute(
  { access: 'private', permission: 'system:file:delete' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const user = getAuthenticatedUser();
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
