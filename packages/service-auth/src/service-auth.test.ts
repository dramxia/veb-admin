import { generateKeyPair } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  SERVICE_TOKEN_TTL_SECONDS,
  ServiceAuthError,
  computeBodyHash,
  createServiceAuthorization,
  createServiceJwks,
  signServiceRequest,
  verifyServiceRequest,
  verifyServiceToken,
  type ServiceKey,
} from './index';

describe('service request authentication', () => {
  let privateKey: ServiceKey;
  let publicKey: ServiceKey;

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256', { extractable: true });
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;
  });

  async function signedRequest(overrides?: {
    requestMethod?: string;
    requestPath?: string;
    requestBody?: string;
    requestId?: string;
    tokenMethod?: string;
    tokenPath?: string;
    tokenBody?: string;
    tokenRequestId?: string;
    audience?: string;
    issuedAt?: number;
  }) {
    const body = overrides?.requestBody ?? '{"title":"hello"}';
    const requestId = overrides?.requestId ?? 'request-1';
    const token = await signServiceRequest(
      {
        audience: overrides?.audience ?? 'blog-api',
        permission: 'content:article:create',
        method: overrides?.tokenMethod ?? 'POST',
        path: overrides?.tokenPath ?? '/api/internal/v1/articles',
        body: overrides?.tokenBody ?? body,
        requestId: overrides?.tokenRequestId ?? requestId,
        subject: 'user-1',
        actor: { id: 'user-1', username: 'admin', nickname: 'Editor' },
      },
      {
        privateKey,
        keyId: 'test-key',
        now: overrides?.issuedAt,
        tokenId: 'token-1',
      },
    );
    const request = new Request(
      `https://blog.internal${overrides?.requestPath ?? '/api/internal/v1/articles'}`,
      {
        method: overrides?.requestMethod ?? 'POST',
        body,
        headers: {
          authorization: createServiceAuthorization(token),
          'content-type': 'application/json',
          'x-request-id': requestId,
        },
      },
    );
    return { request, token };
  }

  it('signs a 60 second RS256 token and verifies all request bindings', async () => {
    const { request, token } = await signedRequest();
    const jwks = await createServiceJwks(publicKey, 'test-key');
    const claims = await verifyServiceRequest(request, {
      audience: 'blog-api',
      jwks,
      permission: 'content:article:create',
    });

    expect(claims).toMatchObject({
      subject: 'user-1',
      permission: 'content:article:create',
      method: 'POST',
      path: '/api/internal/v1/articles',
      requestId: 'request-1',
      tokenId: 'token-1',
      actor: { id: 'user-1', username: 'admin', nickname: 'Editor' },
    });
    expect(claims.expiresAt - claims.issuedAt).toBe(SERVICE_TOKEN_TTL_SECONDS);
    expect(await request.text()).toBe('{"title":"hello"}');
    expect(token.split('.')).toHaveLength(3);
  });

  it.each([
    ['method', { requestMethod: 'PATCH' }],
    ['path', { requestPath: '/api/internal/v1/tags' }],
    [
      'body hash',
      { requestBody: '{"title":"changed"}', tokenBody: '{"title":"hello"}' },
    ],
    ['request id', { requestId: 'request-2', tokenRequestId: 'request-1' }],
  ])('rejects a mismatched %s binding', async (_name, overrides) => {
    const { request } = await signedRequest(overrides);
    const jwks = await createServiceJwks(publicKey, 'test-key');

    await expect(
      verifyServiceRequest(request, { audience: 'blog-api', jwks }),
    ).rejects.toMatchObject({ code: 'CLAIM_MISMATCH' });
  });

  it('rejects the wrong audience and an expired token', async () => {
    const jwks = await createServiceJwks(publicKey, 'test-key');
    const wrongAudience = await signedRequest({ audience: 'another-service' });
    await expect(
      verifyServiceRequest(wrongAudience.request, {
        audience: 'blog-api',
        jwks,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TOKEN' });

    const now = Math.floor(Date.now() / 1000);
    const expired = await signedRequest({
      issuedAt: now - SERVICE_TOKEN_TTL_SECONDS - 6,
    });
    await expect(
      verifyServiceRequest(expired.request, {
        audience: 'blog-api',
        jwks,
        now,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
  });

  it('rejects a permission outside the route allow-list', async () => {
    const { request } = await signedRequest();
    const jwks = await createServiceJwks(publicKey, 'test-key');
    await expect(
      verifyServiceRequest(request, {
        audience: 'blog-api',
        jwks,
        permission: ['content:article:view', 'content:article:update'],
      }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED', status: 403 });
  });

  it('supports JWKS rotation while rejecting unknown keys', async () => {
    const rotated = await generateKeyPair('RS256', { extractable: true });
    const firstJwks = await createServiceJwks(publicKey, 'test-key');
    const rotatedJwks = await createServiceJwks(
      rotated.publicKey,
      'rotated-key',
    );
    const jwks = { keys: [...firstJwks.keys, ...rotatedJwks.keys] };

    const original = await signedRequest();
    await expect(
      verifyServiceToken(original.token, { audience: 'blog-api', jwks }),
    ).resolves.toMatchObject({ tokenId: 'token-1' });

    const rotatedToken = await signServiceRequest(
      {
        audience: 'blog-api',
        permission: 'content:tag:view',
        method: 'GET',
        path: '/api/internal/v1/tags',
        requestId: 'request-rotation',
        subject: 'user-1',
      },
      { privateKey: rotated.privateKey, keyId: 'rotated-key' },
    );
    await expect(
      verifyServiceToken(rotatedToken, { audience: 'blog-api', jwks }),
    ).resolves.toMatchObject({ permission: 'content:tag:view' });
    await expect(
      verifyServiceToken(rotatedToken, {
        audience: 'blog-api',
        jwks: firstJwks,
      }),
    ).rejects.toBeInstanceOf(ServiceAuthError);
  });

  it('hashes exact body bytes', async () => {
    await expect(computeBodyHash('')).resolves.toBe(
      '47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU',
    );
    expect(await computeBodyHash('a')).not.toBe(await computeBodyHash('A'));
  });
});
