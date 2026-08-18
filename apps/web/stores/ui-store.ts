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

type PersistedUiState = Pick<UiState, 'desktopSidebarCollapsed'>;

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
      skipHydration: true,
      partialize: partializeUiState,
    },
  ),
);
