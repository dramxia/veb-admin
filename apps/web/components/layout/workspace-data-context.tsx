'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { MenuNode } from '@veb/api-contracts';
import type { WorkspaceAppModule } from './app-modules';

type WorkspaceData = {
  modules: WorkspaceAppModule[];
  activeModule?: WorkspaceAppModule;
  menus: MenuNode[];
  showSidebar: boolean;
};

const WorkspaceDataContext = createContext<WorkspaceData>({
  modules: [],
  menus: [],
  showSidebar: false,
});

export function WorkspaceDataProvider({
  activeModule,
  children,
  menus,
  modules,
  showSidebar,
}: WorkspaceData & { children: ReactNode }) {
  return (
    <WorkspaceDataContext.Provider
      value={{ activeModule, menus, modules, showSidebar }}
    >
      {children}
    </WorkspaceDataContext.Provider>
  );
}

export function useWorkspaceData() {
  return useContext(WorkspaceDataContext);
}

export function useWorkspaceMenus() {
  return useWorkspaceData().menus;
}

export function useWorkspaceModules() {
  return useWorkspaceData().modules;
}

export function useActiveWorkspaceModule() {
  return useWorkspaceData().activeModule;
}
