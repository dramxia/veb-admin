'use client';

import { Avatar, Badge, Box, Button, Flex, HStack, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

type HeaderProps = {
  user: { username: string; nickname?: string | null; avatar?: string | null };
};

export function Header({ user }: HeaderProps) {
  const displayName = user.nickname ?? user.username;

  return (
    <Flex
      as="header"
      h="72px"
      px={{ base: 4, md: 8 }}
      position="sticky"
      top={0}
      zIndex="banner"
      align="center"
      justify="space-between"
      bg="rgba(255, 255, 255, 0.72)"
      borderBottom="1px solid rgba(226, 232, 240, 0.72)"
      boxShadow="0 10px 30px rgba(15, 23, 42, 0.04)"
      sx={{
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      }}
    >
      <HStack spacing={3} minW={0}>
        <Flex
          w="42px"
          h="42px"
          rounded="16px"
          align="center"
          justify="center"
          color="white"
          fontWeight="900"
          bg="linear-gradient(135deg, #1677ff 0%, #6d5dfc 100%)"
          boxShadow="0 14px 30px rgba(22, 119, 255, 0.28)"
        >
          V
        </Flex>
        <Box minW={0}>
          <HStack spacing={2}>
            <Text fontWeight="900" color="ink.900" letterSpacing="-0.02em">
              VEB 管理后台
            </Text>
            <Badge colorScheme="blue" rounded="full" px={2} variant="subtle">
              Pro
            </Badge>
          </HStack>
          <Text fontSize="sm" color="ink.500" display={{ base: 'none', md: 'block' }}>
            统一权限、菜单与业务模块工作台
          </Text>
        </Box>
      </HStack>

      <Menu placement="bottom-end">
        <MenuButton
          as={Button}
          variant="ghost"
          px={2}
          py={6}
          rounded="full"
          leftIcon={<Avatar size="sm" src={user.avatar ?? undefined} name={displayName} />}
        >
          <Text as="span" display={{ base: 'none', sm: 'inline' }} fontWeight="800">
            {displayName}
          </Text>
        </MenuButton>
        <MenuList>
          <MenuItem as={Link} href="/profile">个人中心</MenuItem>
          <MenuItem onClick={() => signOut({ callbackUrl: '/login' })}>退出登录</MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}
