import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userCount: vi.fn(),
  roleCount: vi.fn(),
  moduleCount: vi.fn(),
  menuCount: vi.fn(),
  operationLogCount: vi.fn(),
}));

vi.mock('../prisma', () => ({
  prisma: {
    user: { count: mocks.userCount },
    role: { count: mocks.roleCount },
    appModule: { count: mocks.moduleCount },
    menu: { count: mocks.menuCount },
    operationLog: { count: mocks.operationLogCount },
  },
}));

const { getDashboardStats } =
  await import('../../src/modules/dashboard/service');

describe('dashboard service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-24T12:00:00.000Z'));
    vi.clearAllMocks();
    mocks.userCount.mockResolvedValueOnce(12).mockResolvedValueOnce(10);
    mocks.roleCount.mockResolvedValueOnce(4).mockResolvedValueOnce(3);
    mocks.moduleCount.mockResolvedValueOnce(3).mockResolvedValueOnce(3);
    mocks.menuCount.mockResolvedValueOnce(28).mockResolvedValueOnce(14);
    mocks.operationLogCount.mockResolvedValueOnce(9).mockResolvedValueOnce(1);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns resource enablement and the latest 24-hour activity snapshot', async () => {
    await expect(getDashboardStats()).resolves.toEqual({
      userCount: 12,
      enabledUserCount: 10,
      roleCount: 4,
      enabledRoleCount: 3,
      moduleCount: 3,
      enabledModuleCount: 3,
      permissionCount: 28,
      menuCount: 14,
      operationCount24h: 9,
      failedOperationCount24h: 1,
    });

    const since = new Date('2026-07-23T12:00:00.000Z');
    expect(mocks.userCount).toHaveBeenNthCalledWith(2, {
      where: { status: 'ENABLED' },
    });
    expect(mocks.roleCount).toHaveBeenNthCalledWith(2, {
      where: { status: 'ENABLED' },
    });
    expect(mocks.moduleCount).toHaveBeenNthCalledWith(2, {
      where: { status: 'ENABLED' },
    });
    expect(mocks.operationLogCount).toHaveBeenNthCalledWith(1, {
      where: { createdAt: { gte: since } },
    });
    expect(mocks.operationLogCount).toHaveBeenNthCalledWith(2, {
      where: { createdAt: { gte: since }, status: 'FAILURE' },
    });
  });
});
