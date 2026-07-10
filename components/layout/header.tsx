'use client';

import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import {
  ChevronDown,
  Home,
  LogOut,
  Search,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import type { MenuNode } from '@/lib/menu';
import { useMenuStore } from '@/stores/menu-store';

type HeaderProps = {
  user: { username: string; nickname?: string | null; avatar?: string | null };
  initialMenus?: MenuNode[];
};

function getHref(menu: MenuNode) {
  return menu.type === 'LINK' ? menu.externalUrl || menu.path : menu.path;
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

function flattenMenus(menus: MenuNode[]): MenuNode[] {
  return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children)]);
}

function isActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

function getRouteLabel(pathname: string, menus: MenuNode[]) {
  if (pathname === '/') return '仪表盘';
  const active = flattenMenus(menus)
    .filter((menu) => isActive(pathname, menu.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return active?.name ?? pathname.split('/').filter(Boolean).at(-1) ?? '工作台';
}

export function Header({ user, initialMenus = [] }: HeaderProps) {
  const displayName = user.nickname ?? user.username;
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const storedMenus = useMenuStore((state) => state.menus);
  const menus = storedMenus.length > 0 ? storedMenus : initialMenus;
  const flatMenus = useMemo(
    () =>
      flattenMenus(menus).filter(
        (menu) => menu.type !== 'DIR' || menu.path === '/',
      ),
    [menus],
  );
  const filteredMenus = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return flatMenus.slice(0, 8);
    return flatMenus
      .filter((menu) =>
        `${menu.name} ${menu.path}`.toLowerCase().includes(keyword),
      )
      .slice(0, 8);
  }, [flatMenus, query]);
  const routeLabel = getRouteLabel(pathname, menus);

  return (
    <GlassPanel
      as="header"
      variant="floating"
      maxW="1280px"
      mx="auto"
      px={{ base: 3, md: 4 }}
      py={3}
      rounded="full"
      position="sticky"
      top={{ base: 3, md: 4 }}
      zIndex="banner"
    >
      <Flex align="center" justify="space-between" gap={3} minW={0}>
        <HStack spacing={3} minW={0}>
          <Flex
            w="42px"
            h="42px"
            rounded="2xl"
            align="center"
            justify="center"
            color="brand.700"
            bg="linear-gradient(135deg, rgba(238,247,255,0.92), rgba(216,236,255,0.72))"
            boxShadow="inset 0 1px 0 rgba(255,255,255,0.8), 0 10px 26px rgba(22,119,255,0.14)"
          >
            <Icon as={Sparkles} boxSize={5} />
          </Flex>
          <Box minW={0}>
            <Text
              color="ink.900"
              fontWeight="900"
              lineHeight="1.1"
              noOfLines={1}
            >
              VEB 管理后台
            </Text>
            <Text color="ink.500" fontSize="sm" fontWeight="700" noOfLines={1}>
              {routeLabel}
            </Text>
          </Box>
        </HStack>

        <HStack spacing={2} flexShrink={0}>
          <Tooltip label="返回仪表盘" hasArrow>
            <Button
              as={Link}
              href="/"
              variant="ghost"
              size="sm"
              aria-label="返回仪表盘"
              px={3}
            >
              <Icon as={Home} boxSize={4} />
            </Button>
          </Tooltip>

          <Menu placement="bottom-end" closeOnSelect>
            <Tooltip label="查找模块" hasArrow>
              <MenuButton
                as={Button}
                variant="outline"
                size="sm"
                leftIcon={<Icon as={Search} boxSize={4} />}
              >
                <Text as="span" display={{ base: 'none', md: 'inline' }}>
                  查找
                </Text>
              </MenuButton>
            </Tooltip>
            <MenuList minW="300px">
              <Box px={2} pb={2}>
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入模块名称或路径"
                  size="sm"
                  autoFocus
                />
              </Box>
              {filteredMenus.length > 0 ? (
                filteredMenus.map((menu) => {
                  const href = getHref(menu);
                  const external = isExternalHref(href);
                  return (
                    <MenuItem
                      key={menu.id}
                      as={Link}
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                    >
                      <VStack align="stretch" spacing={0} minW={0}>
                        <Text fontWeight="800" noOfLines={1}>
                          {menu.name}
                        </Text>
                        <Text color="ink.500" fontSize="xs" noOfLines={1}>
                          {menu.path}
                        </Text>
                      </VStack>
                    </MenuItem>
                  );
                })
              ) : (
                <Text px={3} py={4} color="ink.500" fontSize="sm">
                  没有匹配的模块
                </Text>
              )}
            </MenuList>
          </Menu>

          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              pl={2}
              pr={3}
              rounded="full"
              rightIcon={<Icon as={ChevronDown} boxSize={4} />}
              leftIcon={
                <Avatar
                  size="sm"
                  src={user.avatar ?? undefined}
                  name={displayName}
                />
              }
            >
              <Text
                as="span"
                display={{ base: 'none', sm: 'inline' }}
                fontWeight="800"
              >
                {displayName}
              </Text>
            </MenuButton>
            <MenuList>
              <MenuItem
                as={Link}
                href="/profile"
                icon={<Icon as={UserCircle} boxSize={4} />}
              >
                个人中心
              </MenuItem>
              <MenuItem
                icon={<Icon as={LogOut} boxSize={4} />}
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                退出登录
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </GlassPanel>
  );
}
