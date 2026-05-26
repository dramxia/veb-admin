'use client';

import { Avatar, Button, Flex, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

type HeaderProps = {
  user: { username: string; nickname?: string | null; avatar?: string | null };
};

export function Header({ user }: HeaderProps) {
  return (
    <Flex h="64px" px={6} bg="white" borderBottom="1px solid" borderColor="gray.200" align="center" justify="space-between">
      <Text color="gray.500">通用后台管理系统</Text>
      <Menu>
        <MenuButton as={Button} variant="ghost" leftIcon={<Avatar size="sm" src={user.avatar ?? undefined} name={user.nickname ?? user.username} />}>
          {user.nickname ?? user.username}
        </MenuButton>
        <MenuList>
          <MenuItem as={Link} href="/profile">个人中心</MenuItem>
          <MenuItem onClick={() => signOut({ callbackUrl: '/login' })}>退出登录</MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}
