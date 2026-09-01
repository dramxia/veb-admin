import { describe, expect, it } from 'vitest';
import {
  initialOverlayStackState,
  overlayStackReducer,
} from '@/components/common/overlay-stack-state';

describe('overlayStackReducer', () => {
  it('keeps the outer overlay open when an inner overlay opens', () => {
    const outerOpen = overlayStackReducer(initialOverlayStackState, {
      id: 'outer',
      type: 'open',
    });
    const innerOpen = overlayStackReducer(outerOpen, {
      id: 'inner',
      type: 'open',
    });

    expect(innerOpen.stack).toEqual(['outer', 'inner']);
    expect(innerOpen.stack.at(-1)).toBe('inner');
  });

  it('restores the outer overlay as topmost after the inner closes', () => {
    const bothOpen = { stack: ['outer', 'inner'] };
    const innerClosed = overlayStackReducer(bothOpen, {
      id: 'inner',
      type: 'close',
    });

    expect(innerClosed.stack).toEqual(['outer']);
    expect(innerClosed.stack.at(-1)).toBe('outer');
  });

  it('keeps the inner overlay topmost when the outer closes first', () => {
    const bothOpen = { stack: ['outer', 'inner'] };

    expect(
      overlayStackReducer(bothOpen, { id: 'outer', type: 'close' }),
    ).toEqual({ stack: ['inner'] });
  });

  it('does not duplicate an already registered overlay', () => {
    const open = { stack: ['dialog'] };

    expect(overlayStackReducer(open, { id: 'dialog', type: 'open' })).toBe(
      open,
    );
  });
});
