import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LocalIcon, type SvgComponent } from '@/components/common/local-icon';

const TestIcon: SvgComponent = (props) =>
  createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      ...props,
    },
    createElement('path', { d: 'M4 4h16v16H4z' }),
  );

describe('LocalIcon', () => {
  it('preserves the SVG default fill when no override is provided', () => {
    const markup = renderToStaticMarkup(
      createElement(LocalIcon, { icon: TestIcon }),
    );

    expect(markup).toContain('fill="none"');
    expect(markup).toContain('stroke="currentColor"');
  });

  it('allows an explicit fill override for filled states', () => {
    const markup = renderToStaticMarkup(
      createElement(LocalIcon, { icon: TestIcon, fill: 'currentColor' }),
    );

    expect(markup).toContain('fill="currentColor"');
  });
});
