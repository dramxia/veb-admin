'use client';

import { Flex, Icon, type FlexProps, type IconProps } from '@chakra-ui/react';
import { Blocks } from 'lucide-react';

type BrandMarkProps = {
  size?: FlexProps['boxSize'];
  iconSize?: IconProps['boxSize'];
};

export function BrandMark({ size = 9, iconSize = 5 }: BrandMarkProps) {
  return (
    <Flex
      boxSize={size}
      align="center"
      justify="center"
      flexShrink={0}
      bg="brand.500"
      color="white"
      rounded="md"
      boxShadow="none"
      aria-hidden
    >
      <Icon as={Blocks} boxSize={iconSize} />
    </Flex>
  );
}
