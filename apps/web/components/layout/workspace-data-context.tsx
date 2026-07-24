'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { MenuNode } from '@veb/api-contracts';
import type { WorkspaceAppModule } from './app-modules';

type WorkspaceData = {
  modules: WorkspaceAppModule[];
  activeModule?: WorkspaceAppModule;
  menus: MenuNode[];
};

const WorkspaceDataContext = createContext<WorkspaceData>({
  modules: [],
  menus: [],
});

export function WorkspaceDataProvider({
  activeModule,
  children,
  menus,
  modules,
}: WorkspaceData & { children: ReactNode }) {
  return (
    <WorkspaceDataContext.Provider value={{ activeModule, menus, modules }}>
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
