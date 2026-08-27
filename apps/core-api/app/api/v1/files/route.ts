export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { fileListQuerySchema } from '@veb/api-contracts';
import { ok, pageOptions, readQuery, defineApiRoute } from '@/lib/api';
import { ParamError } from '@/lib/errors';
import { t } from '@/lib/i18n';
import { hasPermission } from '@/lib/permission';
import { assertRateLimit, getClientIp } from '@/lib/rate-limit';
import { getAuthenticatedUser } from '@/lib/session';
import { logOperation } from '@/lib/operation-log';
import { listFiles, uploadFile } from '@/src/modules/files/service';

export const GET = defineApiRoute(
  { access: 'private' },
  async (request: Request) => {
    const user = getAuthenticatedUser();
    const query = readQuery(request, fileListQuerySchema);
    const canViewAll = await hasPermission(user.id, 'system:file:view');
    return ok(
      await listFiles(user.id, canViewAll, { ...query, ...pageOptions(query) }),
    );
  },
);

export const POST = defineApiRoute(
  { access: 'private', permission: 'system:file:upload' },
  async (request: Request) => {
    assertRateLimit({
      key: `upload:${getClientIp(request)}`,
      capacity: 10,
      windowMs: 5000,
    });
    const user = getAuthenticatedUser();
    const formData = await request.formData();
    const rawFile = formData.get('file');
    if (!(rawFile instanceof File)) throw new ParamError(t('upload.required'));

    const { record, response } = await uploadFile(
      user.id,
      rawFile,
      String(formData.get('scope') || '') || null,
    );

    await logOperation({
      actorId: user.id,
      action: 'file.upload',
      target: record.id,
      status: 'SUCCESS',
      payload: { name: record.name, size: record.size, mime: record.mime },
      req: request,
    });

    return ok(response);
  },
  { action: 'file.upload', logSuccess: false },
);
