import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export function getRequestId(request: Request) {
  const incoming = request.headers.get(REQUEST_ID_HEADER)?.trim();
  return incoming && incoming.length <= 128 ? incoming : randomUUID();
}

export function attachRequestId(response: Response, requestId: string) {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
