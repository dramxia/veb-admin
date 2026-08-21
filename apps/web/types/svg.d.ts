/**
 * 本地 svg 文件的模块声明，配合 next.config.mjs 中的 @svgr/webpack 规则。
 *
 * - 默认导入（`import Icon from './icon.svg'`）得到 React 组件；
 * - 带 `?url` 后缀（`import url from './icon.svg?url'`）得到静态文件 URL。
 */
declare module '*.svg' {
  import type { ComponentType, SVGProps } from 'react';

  const content: ComponentType<SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.svg?url' {
  const content: string;
  export default content;
}
