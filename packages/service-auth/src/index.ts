import {
  SignJWT,
  base64url,
  createLocalJWKSet,
  createRemoteJWKSet,
  exportJWK,
  importPKCS8,
  importSPKI,
  jwtVerify,
  type CryptoKey,
  type JSONWebKeySet,
  type JWK,
  type JWTVerifyGetKey,
  type KeyObject,
} from 'jose';

export const SERVICE_TOKEN_ALGORITHM = 'RS256' as const;
export const SERVICE_TOKEN_TTL_SECONDS = 60 as const;
export const DEFAULT_SERVICE_TOKEN_ISSUER = 'veb-api' as const;
export const SERVICE_AUTHORIZATION_HEADER = 'authorization' as const;
export const SERVICE_REQUEST_ID_HEADER = 'x-request-id' as const;

export type ServiceKey = CryptoKey | KeyObject | JWK | Uint8Array;
export type ServiceRequestBody = string | Uint8Array | ArrayBuffer;

export type ServiceActor = {
  id?: string;
  username: string;
  nickname: string | null;
};

export type ServiceRequestClaims = {
  issuer: string;
  subject: string;
  audience: string | string[];
  permission: string;
  method: string;
  path: string;
  bodyHash: string;
  requestId: string;
  issuedAt: number;
  expiresAt: number;
  tokenId: string;
  actor?: ServiceActor;
};

export type SignServiceRequestInput = {
  audience: string;
  permission: string;
  method: string;
  path: string;
  body?: ServiceRequestBody | null;
  requestId: string;
  subject: string;
  actor?: ServiceActor;
};

export type SignServiceRequestOptions = {
  privateKey?: ServiceKey;
  privateKeyPem?: string;
  keyId?: string;
  issuer?: string;
  now?: number;
  tokenId?: string;
};

export type VerifyServiceTokenOptions = {
  audience: string;
  issuer?: string;
  publicKey?: ServiceKey;
  publicKeyPem?: string;
  jwks?: JSONWebKeySet | JWTVerifyGetKey;
  jwksUrl?: string | URL;
  clockTolerance?: number;
  now?: number;
  method?: string;
  path?: string;
  bodyHash?: string;
  requestId?: string;
  permission?: string | string[];
};

export type VerifyServiceRequestOptions = Omit<
  VerifyServiceTokenOptions,
  'method' | 'path' | 'bodyHash' | 'requestId'
>;

export type ServiceAuthErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'MISSING_TOKEN'
  | 'INVALID_TOKEN'
  | 'CLAIM_MISMATCH'
  | 'PERMISSION_DENIED';

export class ServiceAuthError extends Error {
  readonly status: number;

  constructor(
    readonly code: ServiceAuthErrorCode,
    message: string,
    options?: { cause?: unknown; status?: number },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ServiceAuthError';
    this.status = options?.status ?? (code === 'PERMISSION_DENIED' ? 403 : 401);
  }
}

const privateKeyCache = new Map<string, Promise<CryptoKey>>();
const publicKeyCache = new Map<string, Promise<CryptoKey>>();
const remoteJwksCache = new Map<string, JWTVerifyGetKey>();

function requiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ServiceAuthError('INVALID_TOKEN', `服务令牌缺少 ${name}`);
  }
  return value;
}

function requiredNumber(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ServiceAuthError('INVALID_TOKEN', `服务令牌缺少 ${name}`);
  }
  return value;
}

function readEnvironment(name: string): string | undefined {
  return typeof process === 'undefined' ? undefined : process.env[name];
}

function normalizePem(value: string): string {
  return value.includes('\\n') ? value.replace(/\\n/g, '\n') : value;
}

function resolveIssuer(value?: string): string {
  return (
    value ??
    readEnvironment('SERVICE_AUTH_ISSUER') ??
    DEFAULT_SERVICE_TOKEN_ISSUER
  );
}

function normalizeMethod(method: string): string {
  const normalized = method.trim().toUpperCase();
  if (!normalized) {
    throw new ServiceAuthError('CONFIGURATION_ERROR', '请求方法不能为空', {
      status: 500,
    });
  }
  return normalized;
}

function normalizePath(path: string): string {
  const value = path.trim();
  if (!value) {
    throw new ServiceAuthError('CONFIGURATION_ERROR', '请求路径不能为空', {
      status: 500,
    });
  }
  try {
    return new URL(value).pathname;
  } catch {
    const pathname = value.split('?')[0] ?? value;
    if (!pathname.startsWith('/')) {
      throw new ServiceAuthError(
        'CONFIGURATION_ERROR',
        '请求路径必须以 / 开头',
        {
          status: 500,
        },
      );
    }
    return pathname;
  }
}

function toBodyBytes(body?: ServiceRequestBody | null): Uint8Array {
  if (body === undefined || body === null) return new Uint8Array();
  if (typeof body === 'string') return new TextEncoder().encode(body);
  if (body instanceof Uint8Array) return body;
  return new Uint8Array(body);
}

export async function computeBodyHash(
  body?: ServiceRequestBody | null,
): Promise<string> {
  const bytes = toBodyBytes(body);
  const stableBytes = new Uint8Array(bytes.byteLength);
  stableBytes.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', stableBytes.buffer);
  return base64url.encode(new Uint8Array(digest));
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function isJwk(key: ServiceKey): key is JWK {
  return typeof key === 'object' && key !== null && 'kty' in key;
}

export async function importServicePrivateKey(pem: string): Promise<CryptoKey> {
  const normalized = normalizePem(pem);
  let pending = privateKeyCache.get(normalized);
  if (!pending) {
    pending = importPKCS8(normalized, SERVICE_TOKEN_ALGORITHM);
    privateKeyCache.set(normalized, pending);
  }
  return pending;
}

export async function importServicePublicKey(pem: string): Promise<CryptoKey> {
  const normalized = normalizePem(pem);
  let pending = publicKeyCache.get(normalized);
  if (!pending) {
    pending = importSPKI(normalized, SERVICE_TOKEN_ALGORITHM);
    publicKeyCache.set(normalized, pending);
  }
  return pending;
}

async function resolvePrivateKey(
  options: SignServiceRequestOptions,
): Promise<ServiceKey> {
  if (options.privateKey) return options.privateKey;
  const pem =
    options.privateKeyPem ?? readEnvironment('SERVICE_AUTH_PRIVATE_KEY');
  if (!pem) {
    throw new ServiceAuthError(
      'CONFIGURATION_ERROR',
      '缺少 SERVICE_AUTH_PRIVATE_KEY',
      { status: 500 },
    );
  }
  return importServicePrivateKey(pem);
}

async function resolveVerificationKey(
  options: VerifyServiceTokenOptions,
): Promise<ServiceKey | JWTVerifyGetKey> {
  if (options.publicKey) return options.publicKey;
  if (typeof options.jwks === 'function') return options.jwks;
  if (options.jwks) return createLocalJWKSet(options.jwks);

  const publicKeyPem =
    options.publicKeyPem ?? readEnvironment('SERVICE_AUTH_PUBLIC_KEY');
  if (publicKeyPem) return importServicePublicKey(publicKeyPem);

  const rawJwks = readEnvironment('SERVICE_AUTH_JWKS');
  if (rawJwks) {
    try {
      return createLocalJWKSet(JSON.parse(rawJwks) as JSONWebKeySet);
    } catch (error) {
      throw new ServiceAuthError(
        'CONFIGURATION_ERROR',
        'SERVICE_AUTH_JWKS 不是有效 JSON',
        {
          cause: error,
          status: 500,
        },
      );
    }
  }

  const configuredUrl =
    options.jwksUrl ?? readEnvironment('SERVICE_AUTH_JWKS_URL');
  if (configuredUrl) {
    const url =
      configuredUrl instanceof URL ? configuredUrl : new URL(configuredUrl);
    let resolver = remoteJwksCache.get(url.href);
    if (!resolver) {
      resolver = createRemoteJWKSet(url);
      remoteJwksCache.set(url.href, resolver);
    }
    return resolver;
  }

  throw new ServiceAuthError(
    'CONFIGURATION_ERROR',
    '缺少服务验签公钥或 JWKS 配置',
    { status: 500 },
  );
}

function parseActor(value: unknown): ServiceActor | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object') {
    throw new ServiceAuthError('INVALID_TOKEN', '服务令牌 actor 格式无效');
  }
  const actor = value as Record<string, unknown>;
  if (
    actor.id !== undefined &&
    (typeof actor.id !== 'string' || actor.id.length === 0)
  ) {
    throw new ServiceAuthError('INVALID_TOKEN', '服务令牌 actor.id 格式无效');
  }
  const username = requiredString(actor.username, 'actor.username');
  if (actor.nickname !== null && typeof actor.nickname !== 'string') {
    throw new ServiceAuthError(
      'INVALID_TOKEN',
      '服务令牌 actor.nickname 格式无效',
    );
  }
  return {
    ...(actor.id ? { id: actor.id as string } : {}),
    username,
    nickname: actor.nickname as string | null,
  };
}

function parseClaims(payload: Record<string, unknown>): ServiceRequestClaims {
  const audience = payload.aud;
  if (
    typeof audience !== 'string' &&
    !(
      Array.isArray(audience) &&
      audience.every((item) => typeof item === 'string')
    )
  ) {
    throw new ServiceAuthError('INVALID_TOKEN', '服务令牌缺少 aud');
  }

  return {
    issuer: requiredString(payload.iss, 'iss'),
    subject: requiredString(payload.sub, 'sub'),
    audience,
    permission: requiredString(payload.permission, 'permission'),
    method: requiredString(payload.method, 'method'),
    path: requiredString(payload.path, 'path'),
    bodyHash: requiredString(payload.bodyHash, 'bodyHash'),
    requestId: requiredString(payload.requestId, 'requestId'),
    issuedAt: requiredNumber(payload.iat, 'iat'),
    expiresAt: requiredNumber(payload.exp, 'exp'),
    tokenId: requiredString(payload.jti, 'jti'),
    actor: parseActor(payload.actor),
  };
}

function assertExpectedClaims(
  claims: ServiceRequestClaims,
  options: VerifyServiceTokenOptions,
): void {
  if (
    claims.expiresAt <= claims.issuedAt ||
    claims.expiresAt - claims.issuedAt > SERVICE_TOKEN_TTL_SECONDS
  ) {
    throw new ServiceAuthError('INVALID_TOKEN', '服务令牌有效期无效');
  }

  const now = options.now ?? Math.floor(Date.now() / 1000);
  const tolerance = options.clockTolerance ?? 5;
  if (claims.issuedAt > now + tolerance) {
    throw new ServiceAuthError('INVALID_TOKEN', '服务令牌签发时间无效');
  }

  const expectedPermission = options.permission;
  if (expectedPermission) {
    const allowed = Array.isArray(expectedPermission)
      ? expectedPermission
      : [expectedPermission];
    if (!allowed.includes(claims.permission)) {
      throw new ServiceAuthError('PERMISSION_DENIED', '服务令牌权限不足');
    }
  }

  const comparisons: Array<[string | undefined, string, string]> = [
    [
      options.method ? normalizeMethod(options.method) : undefined,
      claims.method,
      'method',
    ],
    [
      options.path ? normalizePath(options.path) : undefined,
      claims.path,
      'path',
    ],
    [options.bodyHash, claims.bodyHash, 'bodyHash'],
    [options.requestId, claims.requestId, 'requestId'],
  ];

  for (const [expected, actual, name] of comparisons) {
    if (expected !== undefined && !constantTimeEqual(expected, actual)) {
      throw new ServiceAuthError(
        'CLAIM_MISMATCH',
        `服务令牌 ${name} 与请求不匹配`,
      );
    }
  }
}

export async function signServiceRequest(
  input: SignServiceRequestInput,
  options: SignServiceRequestOptions = {},
): Promise<string> {
  const issuedAt = options.now ?? Math.floor(Date.now() / 1000);
  const keyId =
    options.keyId ?? readEnvironment('SERVICE_AUTH_KEY_ID') ?? 'veb-api-1';
  const issuer = resolveIssuer(options.issuer);
  const privateKey = await resolvePrivateKey(options);
  const method = normalizeMethod(input.method);
  const path = normalizePath(input.path);
  const bodyHash = await computeBodyHash(input.body);

  requiredString(input.audience, 'audience');
  requiredString(input.permission, 'permission');
  requiredString(input.requestId, 'requestId');
  requiredString(input.subject, 'subject');

  return new SignJWT({
    permission: input.permission,
    method,
    path,
    bodyHash,
    requestId: input.requestId,
    ...(input.actor ? { actor: input.actor } : {}),
  })
    .setProtectedHeader({
      alg: SERVICE_TOKEN_ALGORITHM,
      kid: keyId,
      typ: 'JWT',
    })
    .setIssuer(issuer)
    .setSubject(input.subject)
    .setAudience(input.audience)
    .setJti(options.tokenId ?? crypto.randomUUID())
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SERVICE_TOKEN_TTL_SECONDS)
    .sign(privateKey);
}

export async function verifyServiceToken(
  token: string,
  options: VerifyServiceTokenOptions,
): Promise<ServiceRequestClaims> {
  const key = await resolveVerificationKey(options);
  try {
    const verifyOptions = {
      algorithms: [SERVICE_TOKEN_ALGORITHM],
      audience: options.audience,
      issuer: resolveIssuer(options.issuer),
      clockTolerance: options.clockTolerance ?? 5,
      currentDate:
        options.now === undefined ? undefined : new Date(options.now * 1000),
    };
    const { payload } =
      typeof key === 'function'
        ? await jwtVerify(token, key, verifyOptions)
        : await jwtVerify(token, key, verifyOptions);
    const claims = parseClaims(payload);
    assertExpectedClaims(claims, options);
    return claims;
  } catch (error) {
    if (error instanceof ServiceAuthError) throw error;
    throw new ServiceAuthError('INVALID_TOKEN', '服务令牌无效', {
      cause: error,
    });
  }
}

function readBearerToken(request: Request): string {
  const authorization = request.headers.get(SERVICE_AUTHORIZATION_HEADER);
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match?.[1]) {
    throw new ServiceAuthError('MISSING_TOKEN', '缺少服务 Bearer 令牌');
  }
  return match[1];
}

export async function verifyServiceRequest(
  request: Request,
  options: VerifyServiceRequestOptions,
): Promise<ServiceRequestClaims> {
  const token = readBearerToken(request);
  const requestId = request.headers.get(SERVICE_REQUEST_ID_HEADER);
  if (!requestId) {
    throw new ServiceAuthError('CLAIM_MISMATCH', '缺少 X-Request-Id');
  }
  const body = await request.clone().arrayBuffer();
  const bodyHash = await computeBodyHash(body);

  return verifyServiceToken(token, {
    ...options,
    method: request.method,
    path: new URL(request.url).pathname,
    bodyHash,
    requestId,
  });
}

export function createServiceAuthorization(token: string): string {
  return `Bearer ${token}`;
}

export async function createServiceJwks(
  publicKey: ServiceKey,
  keyId = 'veb-api-1',
): Promise<JSONWebKeySet> {
  if (
    (isJwk(publicKey) && 'd' in publicKey) ||
    (!isJwk(publicKey) &&
      typeof publicKey === 'object' &&
      publicKey !== null &&
      'type' in publicKey &&
      publicKey.type === 'private')
  ) {
    throw new ServiceAuthError('CONFIGURATION_ERROR', 'JWKS 只能包含公钥', {
      status: 500,
    });
  }
  const jwk = isJwk(publicKey) ? publicKey : await exportJWK(publicKey);
  return {
    keys: [
      {
        ...jwk,
        alg: SERVICE_TOKEN_ALGORITHM,
        use: 'sig',
        kid: keyId,
      },
    ],
  };
}

export function createServiceJwksResolver(
  jwks: JSONWebKeySet,
): JWTVerifyGetKey {
  return createLocalJWKSet(jwks);
}

export function createServiceJwksResponse(jwks: JSONWebKeySet): Response {
  return Response.json(jwks, {
    headers: {
      'cache-control': 'public, max-age=300, stale-while-revalidate=300',
      'content-type': 'application/json',
    },
  });
}
