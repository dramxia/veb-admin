import {
  createPublicKey,
  type JsonWebKey as CryptoJsonWebKey,
  type KeyObject,
} from 'node:crypto';

type JsonRecord = Record<string, unknown>;

const MINIMUM_RSA_MODULUS_LENGTH = 2048;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidConfiguration(name: string, reason: string): never {
  throw new Error(`Invalid environment configuration: ${name} ${reason}`);
}

function assertRsaKeyStrength(key: KeyObject, name: string): void {
  if (key.asymmetricKeyType !== 'rsa') {
    invalidConfiguration(name, 'must contain an RSA public key');
  }

  const modulusLength = key.asymmetricKeyDetails?.modulusLength;
  if (modulusLength && modulusLength < MINIMUM_RSA_MODULUS_LENGTH) {
    invalidConfiguration(
      name,
      `must use an RSA key of at least ${MINIMUM_RSA_MODULUS_LENGTH} bits`,
    );
  }
}

function assertJwksUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    invalidConfiguration(
      'SERVICE_AUTH_JWKS_URL',
      'must be a valid HTTP(S) URL',
    );
  }

  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.host) {
    invalidConfiguration(
      'SERVICE_AUTH_JWKS_URL',
      'must be a valid HTTP(S) URL',
    );
  }
}

function isRs256VerificationKey(jwk: JsonRecord, key: KeyObject): boolean {
  const keyOperations = jwk.key_ops;
  return (
    key.asymmetricKeyType === 'rsa' &&
    (jwk.alg === undefined || jwk.alg === 'RS256') &&
    (jwk.use === undefined || jwk.use === 'sig') &&
    (keyOperations === undefined ||
      (Array.isArray(keyOperations) && keyOperations.includes('verify')))
  );
}

function assertJwks(value: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    invalidConfiguration('SERVICE_AUTH_JWKS', 'must be valid JWKS JSON');
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.keys) || !parsed.keys.length) {
    invalidConfiguration(
      'SERVICE_AUTH_JWKS',
      'must contain a non-empty keys array',
    );
  }

  let hasRs256VerificationKey = false;
  for (const candidate of parsed.keys) {
    if (!isRecord(candidate)) {
      invalidConfiguration(
        'SERVICE_AUTH_JWKS',
        'must contain valid public JWK entries',
      );
    }

    let key: KeyObject;
    try {
      key = createPublicKey({
        key: candidate as CryptoJsonWebKey,
        format: 'jwk',
      });
    } catch {
      invalidConfiguration(
        'SERVICE_AUTH_JWKS',
        'must contain valid public JWK entries',
      );
    }

    if (isRs256VerificationKey(candidate, key)) {
      assertRsaKeyStrength(key, 'SERVICE_AUTH_JWKS');
      hasRs256VerificationKey = true;
    }
  }

  if (!hasRs256VerificationKey) {
    invalidConfiguration(
      'SERVICE_AUTH_JWKS',
      'must contain an RSA key usable for RS256 verification',
    );
  }
}

function assertPublicKey(value: string): void {
  const normalized = value.replace(/\\n/g, '\n').trim();
  if (
    !normalized.startsWith('-----BEGIN PUBLIC KEY-----\n') ||
    !normalized.endsWith('\n-----END PUBLIC KEY-----')
  ) {
    invalidConfiguration(
      'SERVICE_AUTH_PUBLIC_KEY',
      'must be a valid SPKI public key PEM',
    );
  }

  let key: KeyObject;
  try {
    key = createPublicKey(normalized);
  } catch {
    invalidConfiguration(
      'SERVICE_AUTH_PUBLIC_KEY',
      'must be a valid SPKI public key PEM',
    );
  }

  assertRsaKeyStrength(key, 'SERVICE_AUTH_PUBLIC_KEY');
}

export function assertRuntimeConfiguration() {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!process.env.BLOG_VISITOR_HASH_SECRET) {
    missing.push('BLOG_VISITOR_HASH_SECRET');
  }
  if (
    !process.env.SERVICE_AUTH_JWKS_URL &&
    !process.env.SERVICE_AUTH_JWKS &&
    !process.env.SERVICE_AUTH_PUBLIC_KEY
  ) {
    missing.push(
      'SERVICE_AUTH_JWKS_URL, SERVICE_AUTH_JWKS, or SERVICE_AUTH_PUBLIC_KEY',
    );
  }
  if (missing.length) {
    throw new Error(`Missing required environment: ${missing.join(', ')}`);
  }

  if (process.env.SERVICE_AUTH_JWKS_URL) {
    assertJwksUrl(process.env.SERVICE_AUTH_JWKS_URL);
  }
  if (process.env.SERVICE_AUTH_JWKS) {
    assertJwks(process.env.SERVICE_AUTH_JWKS);
  }
  if (process.env.SERVICE_AUTH_PUBLIC_KEY) {
    assertPublicKey(process.env.SERVICE_AUTH_PUBLIC_KEY);
  }
}
