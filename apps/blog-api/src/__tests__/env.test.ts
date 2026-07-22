import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertRuntimeConfiguration } from '@/lib/env';

const SERVICE_AUTH_ENVIRONMENT = [
  'SERVICE_AUTH_JWKS_URL',
  'SERVICE_AUTH_JWKS',
  'SERVICE_AUTH_PUBLIC_KEY',
] as const;

const { publicKey: rsaPublicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const rsaPublicKeyPem = rsaPublicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();
const rsaPublicJwk = rsaPublicKey.export({ format: 'jwk' });

function configureServiceAuth(
  name: (typeof SERVICE_AUTH_ENVIRONMENT)[number],
  value: string,
): void {
  for (const environmentName of SERVICE_AUTH_ENVIRONMENT) {
    vi.stubEnv(environmentName, '');
  }
  vi.stubEnv(name, value);
}

describe('blog API runtime configuration', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgresql://blog:secret@localhost/blog');
    vi.stubEnv('BLOG_VISITOR_HASH_SECRET', 'visitor-hash-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    'http://veb-api:1067/api/internal/.well-known/jwks.json',
    'https://auth.example.test/.well-known/jwks.json',
  ])('accepts an HTTP(S) JWKS URL: %s', (url) => {
    configureServiceAuth('SERVICE_AUTH_JWKS_URL', url);

    expect(() => assertRuntimeConfiguration()).not.toThrow();
  });

  it.each([
    'not-a-url',
    'file:///tmp/jwks.json',
    'ftp://auth.example.test/jwks',
  ])('rejects a non-HTTP(S) JWKS URL: %s', (url) => {
    configureServiceAuth('SERVICE_AUTH_JWKS_URL', url);

    expect(() => assertRuntimeConfiguration()).toThrow(
      /SERVICE_AUTH_JWKS_URL must be a valid HTTP\(S\) URL/,
    );
  });

  it('accepts an inline JWKS containing an RS256 verification key', () => {
    configureServiceAuth(
      'SERVICE_AUTH_JWKS',
      JSON.stringify({
        keys: [
          {
            ...rsaPublicJwk,
            alg: 'RS256',
            kid: 'test-key',
            key_ops: ['verify'],
            use: 'sig',
          },
        ],
      }),
    );

    expect(() => assertRuntimeConfiguration()).not.toThrow();
  });

  it.each([
    ['malformed JSON', '{'],
    ['missing keys collection', '{}'],
    ['empty keys collection', '{"keys":[]}'],
    [
      'malformed JWK',
      '{"keys":[{"kty":"RSA","n":"not base64url","e":"AQAB"}]}',
    ],
  ])('rejects inline JWKS with %s', (_case, jwks) => {
    configureServiceAuth('SERVICE_AUTH_JWKS', jwks);

    expect(() => assertRuntimeConfiguration()).toThrow(/SERVICE_AUTH_JWKS/);
  });

  it('accepts an escaped RSA SPKI public key PEM', () => {
    configureServiceAuth(
      'SERVICE_AUTH_PUBLIC_KEY',
      rsaPublicKeyPem.replace(/\n/g, '\\n'),
    );

    expect(() => assertRuntimeConfiguration()).not.toThrow();
  });

  it('rejects a malformed public key PEM', () => {
    configureServiceAuth(
      'SERVICE_AUTH_PUBLIC_KEY',
      '-----BEGIN PUBLIC KEY-----\\nZm9v\\n-----END PUBLIC KEY-----',
    );

    expect(() => assertRuntimeConfiguration()).toThrow(
      /SERVICE_AUTH_PUBLIC_KEY must be a valid SPKI public key PEM/,
    );
  });

  it('rejects a non-RSA public key PEM', () => {
    const { publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
    });
    configureServiceAuth(
      'SERVICE_AUTH_PUBLIC_KEY',
      publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    );

    expect(() => assertRuntimeConfiguration()).toThrow(
      /SERVICE_AUTH_PUBLIC_KEY must contain an RSA public key/,
    );
  });
});
