import { describe, expect, it } from 'vitest';
import {
  migrateUiState,
  partializeUiState,
  useUiStore,
} from '@/stores/ui-store';

describe('ui store persistence migration', () => {
  it('maps the legacy shared sidebar flag to the desktop preference', () => {
    expect(migrateUiState({ sidebarCollapsed: true }, 1)).toEqual({
      desktopSidebarCollapsed: true,
    });
    expect(migrateUiState({ sidebarCollapsed: false }, 1)).toEqual({
      desktopSidebarCollapsed: false,
    });
  });

  it('keeps only the desktop preference for current persisted state', () => {
    expect(
      migrateUiState(
        { desktopSidebarCollapsed: true, mobileSidebarOpen: true },
        2,
      ),
    ).toEqual({ desktopSidebarCollapsed: true });
  });

  it('falls back to an expanded desktop sidebar for invalid state', () => {
    expect(migrateUiState(null, 2)).toEqual({
      desktopSidebarCollapsed: false,
    });
  });

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
