'use client';

import { Flex, type FlexProps } from '@chakra-ui/react';
import { VebMarkIcon } from '@/assets/icons';
import { LocalIcon } from './local-icon';

type BrandMarkProps = {
  size?: FlexProps['boxSize'];
};

export function BrandMark({ size = 9 }: BrandMarkProps) {
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
      <LocalIcon icon={VebMarkIcon} />
    </Flex>
  );
}
