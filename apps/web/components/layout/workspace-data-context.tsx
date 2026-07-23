'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { MenuNode } from '@veb/api-contracts';

const WorkspaceMenusContext = createContext<MenuNode[]>([]);

export function WorkspaceDataProvider({
  children,
  menus,
}: {
  children: ReactNode;
  menus: MenuNode[];
}) {
  return (
    <WorkspaceMenusContext.Provider value={menus}>
      {children}
    </WorkspaceMenusContext.Provider>
  );
}

export function useWorkspaceMenus() {
  return useContext(WorkspaceMenusContext);
}
