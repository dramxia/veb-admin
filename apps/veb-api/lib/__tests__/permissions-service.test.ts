import { describe, expect, it } from 'vitest';
import {
  createPermission,
  deletePermission,
  getPermission,
  listPermissions,
  updatePermission,
} from '../../src/modules/permissions/service';

describe('retired permission service', () => {
  it.each([
    ['list', () => listPermissions({})],
    ['create', () => createPermission({ code: 'report:view' })],
    ['get', () => getPermission('permission-report-view')],
    [
      'update',
      () => updatePermission('permission-report-view', { name: '查看报表' }),
    ],
    ['delete', () => deletePermission('permission-report-view')],
  ])(
    'returns 410 Gone for the legacy %s operation',
    async (_name, operation) => {
      await expect(operation()).rejects.toMatchObject({
        status: 410,
        message: '权限管理已合并到菜单与权限管理',
      });
    },
  );
});
