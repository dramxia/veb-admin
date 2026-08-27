import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseOutput } from '../api-kit/contracts';

describe('parseOutput', () => {
  it('returns parsed data when valid', () => {
    const schema = z.object({ id: z.string(), count: z.number() });
    expect(parseOutput(schema, { id: 'a', count: 1 })).toEqual({
      id: 'a',
      count: 1,
    });
  });

  it('throws a generic error when the payload violates the contract', () => {
    const schema = z.object({ id: z.string() });
    expect(() => parseOutput(schema, { id: 1 })).toThrow(
      'API response violated its contract',
    );
  });
});
