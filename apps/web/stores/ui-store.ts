'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiState = {
  desktopSidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toggleDesktopSidebar: () => void;
  setDesktopSidebarCollapsed: (value: boolean) => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

type LegacyUiState = Partial<UiState> & { sidebarCollapsed?: boolean };
type PersistedUiState = Pick<UiState, 'desktopSidebarCollapsed'>;

export function migrateUiState(persistedState: unknown, version: number) {
  const state = (persistedState ?? {}) as LegacyUiState;
  if (version < 2 && typeof state.sidebarCollapsed === 'boolean') {
    return { desktopSidebarCollapsed: state.sidebarCollapsed };
  }
  return {
    desktopSidebarCollapsed: Boolean(state.desktopSidebarCollapsed),
  };
}

export function partializeUiState(state: UiState): PersistedUiState {
  return {
    desktopSidebarCollapsed: state.desktopSidebarCollapsed,
  };
}

export const useUiStore = create<UiState>()(
  persist<UiState, [], [], PersistedUiState>(
    (set) => ({
      desktopSidebarCollapsed: false,
      mobileSidebarOpen: false,
      toggleDesktopSidebar: () =>
        set((state) => ({
          desktopSidebarCollapsed: !state.desktopSidebarCollapsed,
        })),
      setDesktopSidebarCollapsed: (value) =>
        set({ desktopSidebarCollapsed: value }),
      openMobileSidebar: () => set({ mobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
    }),
    {
      name: 'veb-ui',
      version: 2,
      skipHydration: true,
      migrate: migrateUiState,
      partialize: partializeUiState,
    },
  ),
);
