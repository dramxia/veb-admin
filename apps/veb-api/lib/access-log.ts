export function logApiAccess(
  request: Request,
  response: Response,
  requestId: string,
  startedAt: number,
) {
  console.info('[veb-api:request]', {
    requestId,
    method: request.method,
    pathname: new URL(request.url).pathname,
    status: response.status,
    durationMs: Date.now() - startedAt,
  });
}
