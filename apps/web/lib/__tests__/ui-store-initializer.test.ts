import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rehydrate: vi.fn(),
}));

vi.mock('@/stores/ui-store', () => ({
  useUiStore: {
    persist: {
      rehydrate: mocks.rehydrate,
    },
  },
}));

const { UiStoreInitializer } =
  await import('@/components/layout/ui-store-initializer');

describe('UiStoreInitializer', () => {
  it('keeps workspace content in the server-rendered HTML', () => {
    const markup = renderToStaticMarkup(
      createElement(
        UiStoreInitializer,
        null,
        createElement('header', null, 'VEB workspace'),
        createElement('main', null, 'admin content'),
      ),
    );

    expect(markup).toContain('<header>VEB workspace</header>');
    expect(markup).toContain('<main>admin content</main>');
    expect(mocks.rehydrate).not.toHaveBeenCalled();
  });
});
