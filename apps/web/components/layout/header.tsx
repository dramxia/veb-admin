'use client';

import {
  Avatar,
  Box,
  Button,
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
  ChevronDown,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandMark } from '@/components/common/brand-mark';
import type { AuthUser } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import type { WorkspaceAppModule } from './app-modules';
import {
  flattenNavigableMenus,
  getCurrentMenu,
  getHref,
  isActive,
  isExternalHref,
} from './navigation-utils';
import {
  ADMIN_SIDEBAR_ID,
  ADMIN_SIDEBAR_TOGGLE_ID,
  DASHBOARD_HEADER_HEIGHT,
} from './layout-constants';
import { useWorkspaceData } from './workspace-data-context';

type HeaderProps = {
  user: Pick<AuthUser, 'username' | 'nickname' | 'avatar'>;
};

function ModuleSwitcher({
  activeModule,
  modules,
}: {
  activeModule?: WorkspaceAppModule;
  modules: WorkspaceAppModule[];
}) {
  const closeMobileSidebar = useUiStore((state) => state.closeMobileSidebar);

  if (modules.length === 0) return null;

  return (
    <>
      <HStack
        as="nav"
        aria-label="应用模块"
        display={{ base: 'none', xl: 'flex' }}
        spacing={1}
        maxW={{ xl: '46vw', '2xl': '640px' }}
        overflowX="auto"
        overscrollBehaviorX="contain"
      >
        {modules.map((module) => {
          const current = module.id === activeModule?.id;
          return (
            <Button
              key={module.id}
              as={Link}
              href={module.landingPath}
              aria-current={current ? 'page' : undefined}
              variant="ghost"
              size="sm"
              h="34px"
              minW="auto"
              px={3}
              flexShrink={0}
              bg={current ? 'brand.50' : 'transparent'}
              color={current ? 'brand.700' : 'ink.600'}
              onClick={closeMobileSidebar}
              _hover={{ bg: 'brand.50', color: 'ink.900' }}
            >
              {module.name}
            </Button>
          );
        })}
      </HStack>

      <Menu placement="bottom-end" strategy="fixed" isLazy>
        <MenuButton
          as={Button}
          display={{ base: 'inline-flex', xl: 'none' }}
          variant="ghost"
          size="sm"
          h="34px"
          maxW={{ base: '92px', sm: '128px' }}
          px={{ base: 2, sm: 3 }}
          rightIcon={<Icon as={ChevronDown} boxSize={4} aria-hidden />}
          aria-label="切换应用模块"
        >
          <Text as="span" noOfLines={1}>
            {activeModule?.name ?? '模块'}
          </Text>
        </MenuButton>
        <Portal>
          <MenuList
            minW="180px"
            maxW="calc(100vw - 16px)"
            maxH="calc(100vh - 80px)"
            overflowY="auto"
            zIndex="popover"
          >
            {modules.map((module) => (
              <MenuItem
                key={module.id}
                as={Link}
                href={module.landingPath}
                aria-current={
                  module.id === activeModule?.id ? 'page' : undefined
                }
                onClick={closeMobileSidebar}
                whiteSpace="normal"
                overflowWrap="anywhere"
              >
                {module.name}
              </MenuItem>
            ))}
          </MenuList>
        </Portal>
      </Menu>
    </>
  );
}

export function Header({ user }: HeaderProps) {
  const displayName = user.nickname ?? user.username;
  const pathname = usePathname();
  const { activeModule, menus, modules } = useWorkspaceData();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSidebarToggleRef = useRef<HTMLButtonElement>(null);
  const searchPopover = useDisclosure();
  const [query, setQuery] = useState('');
  const desktopSidebarCollapsed = useUiStore(
    (state) => state.desktopSidebarCollapsed,
  );
  const toggleDesktopSidebar = useUiStore(
    (state) => state.toggleDesktopSidebar,
  );
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const openMobileSidebar = useUiStore((state) => state.openMobileSidebar);
  const closeMobileSidebar = useUiStore((state) => state.closeMobileSidebar);
  const flatMenus = useMemo(
    () =>
      flattenNavigableMenus(menus).filter((menu) => {
        const href = getHref(menu);
        return href !== '/profile' && href !== '/admin/profile';
      }),
    [menus],
  );
  const filteredMenus = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return flatMenus.slice(0, 8);

    return flatMenus
      .filter((menu) =>
        `${menu.name} ${getHref(menu)}`.toLowerCase().includes(keyword),
      )
      .slice(0, 8);
  }, [flatMenus, query]);
  const currentMenu = useMemo(
    () => getCurrentMenu(pathname, menus),
    [menus, pathname],
  );
  const canToggleSidebar = Boolean(activeModule);
  const canSearchMenus = Boolean(activeModule);
  const moduleLandingPath =
    activeModule?.landingPath ?? modules[0]?.landingPath;
  const restoreMobileSidebarToggleFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      mobileSidebarToggleRef.current?.focus({ preventScroll: true });
    });
  }, []);
  const closeMobileSidebarAndRestoreFocus = useCallback(() => {
    closeMobileSidebar();
    restoreMobileSidebarToggleFocus();
  }, [closeMobileSidebar, restoreMobileSidebarToggleFocus]);
  const handleMobileSidebarToggle = useCallback(() => {
    if (mobileSidebarOpen) {
      closeMobileSidebarAndRestoreFocus();
      return;
    }

    openMobileSidebar();
  }, [closeMobileSidebarAndRestoreFocus, mobileSidebarOpen, openMobileSidebar]);

  useEffect(() => {
    if (!canToggleSidebar || !mobileSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeMobileSidebarAndRestoreFocus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canToggleSidebar, closeMobileSidebarAndRestoreFocus, mobileSidebarOpen]);

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
      px={{ base: 3, lg: desktopSidebarCollapsed ? 2 : 3 }}
    >
      <Flex h="full" align="center" justify="space-between" gap={2} minW={0}>
        <HStack spacing={{ base: 1, md: 3 }} minW={0} flexShrink={1}>
          {canToggleSidebar ? (
            <>
              <IconButton
                ref={mobileSidebarToggleRef}
                id={ADMIN_SIDEBAR_TOGGLE_ID}
                display={{ base: 'inline-flex', lg: 'none' }}
                aria-label={mobileSidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
                aria-controls={ADMIN_SIDEBAR_ID}
                aria-expanded={mobileSidebarOpen}
                icon={
                  <Icon
                    as={mobileSidebarOpen ? PanelLeftClose : PanelLeftOpen}
                    boxSize={5}
                    aria-hidden
                  />
                }
                onClick={handleMobileSidebarToggle}
                variant="ghost"
                size="sm"
                flexShrink={0}
              />
              <Tooltip
                label={desktopSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                placement="bottom"
              >
                <IconButton
                  display={{ base: 'none', lg: 'inline-flex' }}
                  aria-label={
                    desktopSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'
                  }
                  icon={
                    <Icon
                      as={
                        desktopSidebarCollapsed ? PanelLeftOpen : PanelLeftClose
                      }
                      boxSize={5}
                      aria-hidden
                    />
                  }
                  onClick={toggleDesktopSidebar}
                  variant="ghost"
                  size="sm"
                  flexShrink={0}
                />
              </Tooltip>
            </>
          ) : null}

          <HStack spacing={2.5} minW={0}>
            <BrandMark />
            <Text
              display={{ base: 'none', sm: 'block' }}
              color="ink.900"
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight="900"
              lineHeight="1.2"
              noOfLines={1}
            >
              VEB 工作台
            </Text>
          </HStack>
        </HStack>

        <HStack
          spacing={{ base: 0, sm: 1, md: 2 }}
          flex={1}
          justify="flex-end"
          minW={0}
        >
          <ModuleSwitcher activeModule={activeModule} modules={modules} />

          {moduleLandingPath ? (
            <IconButton
              as={Link}
              href={moduleLandingPath}
              aria-label={`返回${activeModule?.name ?? '应用模块'}首个菜单`}
              aria-current={pathname === moduleLandingPath ? 'page' : undefined}
              icon={<Icon as={Home} boxSize={5} aria-hidden />}
              variant="ghost"
              size="sm"
              flexShrink={0}
            />
          ) : null}

          {canSearchMenus ? (
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
                  aria-label="搜索应用菜单"
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
                      placeholder="输入菜单名称或路径"
                      aria-label="搜索应用菜单"
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
                                <Text
                                  color="ink.500"
                                  fontSize="xs"
                                  noOfLines={1}
                                >
                                  {href}
                                </Text>
                              </VStack>
                              {external ? (
                                <Icon
                                  as={ExternalLink}
                                  boxSize={4}
                                  color="ink.400"
                                  flexShrink={0}
                                  aria-hidden
                                />
                              ) : null}
                            </ChakraLink>
                          );
                        })
                      ) : (
                        <Text px={3} py={4} color="ink.500" fontSize="sm">
                          没有匹配的应用菜单
                        </Text>
                      )}
                    </Stack>
                  </PopoverBody>
                </PopoverContent>
              </Portal>
            </Popover>
          ) : null}

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
              <MenuList minW="240px" p={2} zIndex="popover">
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
