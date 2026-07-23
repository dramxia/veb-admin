'use client';

import {
  Avatar,
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import {
  ExternalLink,
  Home,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserCircle,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { MenuNode } from '@veb/api-contracts';
import { useMenuStore } from '@/stores/menu-store';
import { useUiStore } from '@/stores/ui-store';
import type { AuthUser } from '@/stores/auth-store';
import { BrandMark } from '@/components/common/brand-mark';
import {
  flattenMenus,
  getCurrentMenu,
  getHref,
  isActive,
  isExternalHref,
} from './navigation-utils';
import { DASHBOARD_HEADER_HEIGHT } from './layout-constants';

type HeaderProps = {
  user: Pick<AuthUser, 'username' | 'nickname' | 'avatar'>;
  initialMenus?: MenuNode[];
};

export function Header({ user, initialMenus = [] }: HeaderProps) {
  const displayName = user.nickname ?? user.username;
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPopover = useDisclosure();
  const [query, setQuery] = useState('');
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const storedMenus = useMenuStore((state) => state.menus);
  const menus = storedMenus.length > 0 ? storedMenus : initialMenus;
  const flatMenus = useMemo(
    () =>
      flattenMenus(menus).filter(
        (menu) =>
          (menu.type !== 'DIR' || menu.path === '/') &&
          menu.path !== '/profile',
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
  const currentMenu = useMemo(
    () => getCurrentMenu(pathname, menus),
    [menus, pathname],
  );

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex="banner"
      w="full"
      h={DASHBOARD_HEADER_HEIGHT}
      bg="transparent"
      boxShadow="none"
      px={{ base: 3, lg: sidebarCollapsed ? 2 : 3 }}
    >
      <Flex h="full" align="center" justify="space-between" gap={3} minW={0}>
        <HStack spacing={{ base: 2, md: 3 }} minW={0}>
          <Tooltip
            label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
            placement="bottom"
          >
            <IconButton
              aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
              icon={
                <Icon
                  as={sidebarCollapsed ? PanelLeftOpen : PanelLeftClose}
                  boxSize={5}
                  aria-hidden
                />
              }
              onClick={toggleSidebar}
              variant="ghost"
              w={{ base: 8, md: 9 }}
              h={{ base: 8, md: 9 }}
              rounded="md"
              flexShrink={0}
            />
          </Tooltip>

          <HStack spacing={2.5} minW={0}>
            <BrandMark />
            <Text
              color="ink.900"
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight="900"
              lineHeight="1.2"
              noOfLines={1}
            >
              VEB 管理后台
            </Text>
          </HStack>
        </HStack>

        <HStack spacing={{ base: 1, sm: 2 }} flexShrink={0}>
          <IconButton
            as={Link}
            href="/"
            aria-label="返回仪表盘"
            aria-current={pathname === '/' ? 'page' : undefined}
            icon={<Icon as={Home} boxSize={5} aria-hidden />}
            variant="ghost"
            size="sm"
          />

          <Popover
            isOpen={searchPopover.isOpen}
            onOpen={searchPopover.onOpen}
            onClose={searchPopover.onClose}
            placement="bottom-end"
            strategy="fixed"
            initialFocusRef={searchInputRef}
            isLazy
          >
            <PopoverTrigger>
              <IconButton
                aria-label="查找模块"
                icon={<Icon as={Search} boxSize={5} aria-hidden />}
                variant="ghost"
                size="sm"
              />
            </PopoverTrigger>
            <Portal>
              <PopoverContent
                layerStyle="glassFloating"
                w={{ base: 'calc(100vw - 24px)', sm: '320px' }}
                maxW="calc(100vw - 24px)"
                rounded="2xl"
                zIndex="popover"
              >
                <PopoverBody p={2} role="search">
                  <Input
                    ref={searchInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="输入模块名称或路径"
                    aria-label="搜索模块"
                    size="sm"
                  />

                  <Stack spacing={1} mt={2} maxH="320px" overflowY="auto">
                    {filteredMenus.length > 0 ? (
                      filteredMenus.map((menu) => {
                        const href = getHref(menu);
                        const external = isExternalHref(href);
                        const isCurrent = currentMenu?.id === menu.id;

                        return (
                          <ChakraLink
                            key={menu.id}
                            as={Link}
                            href={href}
                            target={external ? '_blank' : undefined}
                            rel={external ? 'noreferrer' : undefined}
                            aria-current={isCurrent ? 'page' : undefined}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            gap={3}
                            px={3}
                            py={2.5}
                            bg={isCurrent ? 'brand.50' : undefined}
                            color={isCurrent ? 'brand.700' : 'ink.700'}
                            rounded="xl"
                            onClick={searchPopover.onClose}
                            _hover={{
                              bg: 'brand.50',
                              color: 'ink.900',
                              textDecoration: 'none',
                            }}
                            _focusVisible={{
                              boxShadow: 'focusRing',
                              outline: 'none',
                            }}
                          >
                            <VStack align="stretch" spacing={0} minW={0}>
                              <Text fontWeight="800" noOfLines={1}>
                                {menu.name}
                              </Text>
                              <Text color="ink.500" fontSize="xs" noOfLines={1}>
                                {menu.path}
                              </Text>
                            </VStack>
                            {external && (
                              <Icon
                                as={ExternalLink}
                                boxSize={4}
                                color="ink.400"
                                flexShrink={0}
                                aria-hidden
                              />
                            )}
                          </ChakraLink>
                        );
                      })
                    ) : (
                      <Text px={3} py={4} color="ink.500" fontSize="sm">
                        没有匹配的模块
                      </Text>
                    )}
                  </Stack>
                </PopoverBody>
              </PopoverContent>
            </Portal>
          </Popover>

          <Menu placement="bottom-end" strategy="fixed" isLazy>
            <MenuButton
              as={IconButton}
              aria-label={`打开 ${displayName} 的账户菜单`}
              icon={
                <Avatar
                  size="xs"
                  src={user.avatar ?? undefined}
                  name={displayName}
                  pointerEvents="none"
                />
              }
              variant="ghost"
              size="sm"
              isRound
            />
            <Portal>
              <MenuList
                layerStyle="glassFloating"
                minW="240px"
                p={2}
                rounded="2xl"
                zIndex="popover"
              >
                <HStack px={2} py={2} spacing={3}>
                  <Avatar
                    size="sm"
                    src={user.avatar ?? undefined}
                    name={displayName}
                  />
                  <Box minW={0}>
                    <Text fontWeight="800" noOfLines={1}>
                      {displayName}
                    </Text>
                    <Text color="ink.500" fontSize="xs" noOfLines={1}>
                      {user.username}
                    </Text>
                  </Box>
                </HStack>
                <MenuDivider borderColor="ink.100" />
                <MenuItem
                  as={Link}
                  href="/profile"
                  icon={<Icon as={UserCircle} boxSize={4.5} aria-hidden />}
                  aria-current={
                    isActive(pathname, '/profile') ? 'page' : undefined
                  }
                  rounded="xl"
                >
                  个人中心
                </MenuItem>
                <MenuItem
                  icon={<Icon as={LogOut} boxSize={4.5} aria-hidden />}
                  onClick={() => void signOut({ callbackUrl: '/login' })}
                  rounded="xl"
                >
                  退出登录
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
}
