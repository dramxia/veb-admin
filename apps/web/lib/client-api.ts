import type { ApiResult } from '@veb/api-contracts';

export type ClientApiResult<T> = ApiResult<T>;

export type RequestJsonOptions = RequestInit & {
  timeoutMs?: number;
};

export class ClientApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: number,
  ) {
    super(message);
    this.name = 'ClientApiError';
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

function isFormDataBody(body: BodyInit | null | undefined) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function buildHeaders(init: RequestInit) {
  if (isFormDataBody(init.body as BodyInit | null | undefined))
    return init.headers;
  return { 'Content-Type': 'application/json', ...(init.headers || {}) };
}

function parseApiPayload<T>(text: string, status: number): ClientApiResult<T> {
  if (!text.trim()) {
    return {
      code: status,
      data: null,
      message: status >= 400 ? '服务暂时不可用' : 'ok',
    };
  }

  try {
    return JSON.parse(text) as ClientApiResult<T>;
  } catch {
    return {
      code: status,
      data: null,
      message: status >= 500 ? '服务异常，请稍后重试' : '接口返回格式异常',
    };
  }
}

function mergeAbortSignals(
  signal: AbortSignal | null | undefined,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort('timeout'),
    timeoutMs,
  );

  function abort(reason?: unknown) {
    window.clearTimeout(timeout);
    controller.abort(reason);
  }

  if (signal?.aborted) abort(signal.reason);
  signal?.addEventListener('abort', () => abort(signal.reason), { once: true });

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeout),
  };
}

function toNetworkMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError')
    return '请求超时，请稍后重试';
  if (error instanceof Error && error.message) return error.message;
  return '网络连接异常，请稍后重试';
}

export async function requestJson<T>(
  path: string,
  init: RequestJsonOptions = {},
) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...requestInit } = init;
  const abort = mergeAbortSignals(requestInit.signal, timeoutMs);
  let response: Response;

  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      ...requestInit,
      headers: buildHeaders(requestInit),
      signal: abort.signal,
    });
  } catch (error) {
    throw new ClientApiError(toNetworkMessage(error));
  } finally {
    abort.clear();
  }

  const payload = parseApiPayload<T>(await response.text(), response.status);
  if (!response.ok || payload.code !== 0) {
    throw new ClientApiError(
      payload.message || '操作失败',
      response.status,
      payload.code,
    );
  }

  return payload.data as T;
}
