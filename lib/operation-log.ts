import { LogStatus, type Prisma } from '@prisma/client';
import { prisma } from './prisma';

type JsonValue = Prisma.InputJsonValue;

export type LogOperationInput = {
  actorId?: string | null;
  action: string;
  target?: string | null;
  payload?: JsonValue | null;
  status: LogStatus;
  message?: string | null;
  req?: Request | null;
};

function getClientIp(req?: Request | null) {
  if (!req) return null;
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null
  );
}

export async function logOperation({
  actorId,
  action,
  target,
  payload,
  status,
  message,
  req,
}: LogOperationInput) {
  try {
    await prisma.operationLog.create({
      data: {
        actorId: actorId || null,
        action,
        target: target || null,
        ip: getClientIp(req),
        userAgent: req?.headers.get('user-agent') || null,
        payload: payload ?? undefined,
        status,
        message: message || null,
      },
    });
  } catch (error) {
    // 日志不能影响主业务响应，失败只输出服务端诊断信息。
    console.error('[operation-log:error]', error);
  }
}
