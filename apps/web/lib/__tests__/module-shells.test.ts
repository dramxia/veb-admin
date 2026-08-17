import { createElement, type ElementType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const { workspaceData } = vi.hoisted(() => ({
  workspaceData: { showSidebar: true },
}));

vi.mock('@chakra-ui/react', () => ({
  Box: ({
    as,
    children,
    id,
  }: {
    as?: ElementType;
    children?: ReactNode;
    id?: string;
  }) => createElement(as ?? 'div', id ? { id } : undefined, children),
}));

vi.mock('@/components/layout/sidebar', () => ({
  DESKTOP_SIDEBAR_COLLAPSED_WIDTH: '76px',
  DESKTOP_SIDEBAR_EXPANDED_WIDTH: '184px',
  Sidebar: () => createElement('aside', { id: 'admin-sidebar' }),
}));

vi.mock('@/stores/ui-store', () => ({
  useUiStore: (
    selector: (state: {
      desktopSidebarCollapsed: boolean;
      closeMobileSidebar: () => void;
    }) => unknown,
  ) =>
    selector({ desktopSidebarCollapsed: false, closeMobileSidebar: vi.fn() }),
}));

vi.mock('@/components/layout/workspace-data-context', () => ({
  useWorkspaceData: () => workspaceData,
}));

const { AdminShell } = await import('@/components/layout/admin-shell');
const { PlainModuleShell } =
  await import('@/components/layout/plain-module-shell');

describe('module shells', () => {
  it('mounts the admin sidebar and offset content surface', () => {
    const markup = renderToStaticMarkup(
      createElement(
        AdminShell,
        null,
        createElement('p', null, 'admin content'),
      ),
    );

    expect(markup).toContain('<aside id="admin-sidebar"></aside>');
    expect(markup).toContain('<main id="dashboard-main">');
    expect(markup).toContain('admin content');
  });

  it('keeps plain modules full width without admin sidebar infrastructure', () => {
    const markup = renderToStaticMarkup(
      createElement(
        PlainModuleShell,
        null,
        createElement('p', null, 'plain content'),
      ),
    );

    expect(markup).toContain('<main id="module-main">');
    expect(markup).toContain('plain content');
    expect(markup).not.toContain('<aside');
    expect(markup).not.toContain('dashboard-main');
  });

  it('omits the admin sidebar infrastructure for single-page modules', () => {
    workspaceData.showSidebar = false;
    const markup = renderToStaticMarkup(
      createElement(
        AdminShell,
        null,
        createElement('p', null, 'single page content'),
      ),
    );

    expect(markup).not.toContain('<aside');
    expect(markup).toContain('<main id="dashboard-main">');
    expect(markup).toContain('single page content');
    workspaceData.showSidebar = true;
  });
});
