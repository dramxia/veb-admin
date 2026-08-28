import { describe, expect, it } from 'vitest';
import { synchronizedScrollTop } from '@/lib/scroll-sync';

describe('synchronized scroll position', () => {
  it('maps scroll progress between panes with different content heights', () => {
    expect(
      synchronizedScrollTop(
        { scrollTop: 450, scrollHeight: 1200, clientHeight: 300 },
        { scrollTop: 0, scrollHeight: 2400, clientHeight: 600 },
      ),
    ).toBe(900);
  });

  it('clamps source positions to the target scroll range', () => {
    const target = { scrollTop: 0, scrollHeight: 1000, clientHeight: 400 };

    expect(
      synchronizedScrollTop(
        { scrollTop: -50, scrollHeight: 800, clientHeight: 200 },
        target,
      ),
    ).toBe(0);
    expect(
      synchronizedScrollTop(
        { scrollTop: 900, scrollHeight: 800, clientHeight: 200 },
        target,
      ),
    ).toBe(600);
  });

  it('returns the top when either pane cannot scroll', () => {
    expect(
      synchronizedScrollTop(
        { scrollTop: 0, scrollHeight: 400, clientHeight: 400 },
        { scrollTop: 50, scrollHeight: 1000, clientHeight: 400 },
      ),
    ).toBe(0);
    expect(
      synchronizedScrollTop(
        { scrollTop: 200, scrollHeight: 1000, clientHeight: 400 },
        { scrollTop: 0, scrollHeight: 400, clientHeight: 400 },
      ),
    ).toBe(0);
  });
});
