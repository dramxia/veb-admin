import { Box, type BoxProps } from '@chakra-ui/react';
import type { ComponentType, SVGProps } from 'react';

/** 本地 svg 文件经 @svgr/webpack 编译后得到的组件类型。 */
export type SvgComponent = ComponentType<SVGProps<SVGSVGElement>>;

type IconSizeProp =
  | 'boxSize'
  | 'width'
  | 'w'
  | 'minWidth'
  | 'minW'
  | 'maxWidth'
  | 'maxW'
  | 'height'
  | 'h'
  | 'minHeight'
  | 'minH'
  | 'maxHeight'
  | 'maxH';

export type LocalIconProps = Omit<BoxProps, IconSizeProp> & {
  /** 本地 svg 组件，使用 `import logo from '@/assets/icons/brand/veb-mark.svg'` 传入。 */
  icon: SvgComponent;
};

/**
 * 本地 svg 文件图标组件。
 *
 * - 所有业务图标固定使用 18px，强调状态通过外层容器表达；
 * - 颜色：使用 `color` 或 `fill`，接受主题 token，如 `color="brand.500"`。
 *   svg 内部的 `fill`/`stroke` 为 `currentColor` 时才会随颜色属性变化，
 *   导出 svg 时请避免写死颜色。
 *
 * @example
 * import logo from '@/assets/icons/brand/veb-mark.svg';
 *
 * <LocalIcon icon={logo} color="brand.500" />
 * <LocalIcon icon={logo} color="red.400" aria-label="Logo" />
 */
export function LocalIcon({ icon: Svg, fill, ...props }: LocalIconProps) {
  const labelled = Boolean(props['aria-label']);
  const svgFillProps = typeof fill === 'string' ? { fill } : {};

  return (
    <Box
      as="span"
      color="currentColor"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      lineHeight={0}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      {...props}
      boxSize="18px"
    >
      <Svg
        width="100%"
        height="100%"
        focusable="false"
        aria-hidden="true"
        {...svgFillProps}
      />
    </Box>
  );
}
