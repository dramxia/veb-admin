import { describe, expect, it } from 'vitest';
import { partializeUiState, useUiStore } from '@/stores/ui-store';

describe('ui store persistence', () => {
  it('persists the desktop preference without the mobile drawer state', () => {
    expect(
      partializeUiState({
        ...useUiStore.getState(),
        desktopSidebarCollapsed: true,
        mobileSidebarOpen: true,
      }),
    ).toEqual({ desktopSidebarCollapsed: true });
  });
});
