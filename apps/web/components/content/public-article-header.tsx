import { Box, Button, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import { LayoutDashboard } from 'lucide-react';
import NextLink from 'next/link';
import { BrandMark } from '@/components/common/brand-mark';

export function PublicArticleHeader() {
  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={10}
      bg="glassSolidBg"
      borderBottomWidth="1px"
      borderColor="glassBorder"
      backdropFilter="blur(18px) saturate(160%)"
    >
      <Flex
        maxW="1080px"
        mx="auto"
        minH="68px"
        px={{ base: 4, md: 6 }}
        align="center"
        justify="space-between"
        gap={4}
      >
        <NextLink href="/articles">
          <HStack spacing={3} minW={0}>
            <BrandMark />
            <Box minW={0}>
              <Heading fontSize="lg" lineHeight="1.2">
                VEB 文章
              </Heading>
              <Text color="ink.500" fontSize="xs">
                记录、思考与实践
              </Text>
            </Box>
          </HStack>
        </NextLink>
        <NextLink href="/admin">
          <Button as="span" size="sm" variant="ghost">
            <HStack spacing={2}>
              <LayoutDashboard size={16} aria-hidden />
              <Text>管理后台</Text>
            </HStack>
          </Button>
        </NextLink>
      </Flex>
    </Box>
  );
}
