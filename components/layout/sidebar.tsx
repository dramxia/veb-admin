'use client';

import {
  Box,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  Circle,
  Compass,
  ExternalLink,
  FileBox,
  Folder,
  Home,
  LayoutDashboard,
  ListTree,
  type LucideIcon,
  ScrollText,
  Shield,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import type { MenuNode } from '@/lib/menu';
import { useMenuStore } from '@/stores/menu-store';
import {
  flattenNavigableMenus,
  getCurrentMenu,
  getHref,
  isExternalHref,
  isMenuBranchActive,
} from './navigation-utils';

export const DESKTOP_SIDEBAR_WIDTH = '272px';

const INTERACTION_DURATION = '180ms';

type MobileDockItem = {
  menu: MenuNode;
  entries: MenuNode[];
};

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  home: Home,
  system: Compass,
  users: Users,
  user: User,
  role: Shield,
  shield: Shield,
  permission: Shield,
  menu: ListTree,
  file: FileBox,
  folder: Folder,
  log: ScrollText,
  profile: User,
};

function getMenuIcon(menu: MenuNode): LucideIcon {
  const configured = menu.icon?.toLowerCase();
  if (configured && iconMap[configured]) return iconMap[configured];
  if (menu.path === '/') return LayoutDashboard;
  if (menu.path.startsWith('/profile')) return User;
  if (menu.path.includes('user')) return Users;
  if (menu.path.includes('role')) return Shield;
  if (menu.path.includes('permission')) return Shield;
  if (menu.path.includes('menu')) return ListTree;
  if (menu.path.includes('file')) return FileBox;
  if (menu.path.includes('log')) return ScrollText;
  if (menu.path.startsWith('/system')) return Compass;
  return Circle;
}

function DesktopMenuBranch({
  menu,
  pathname,
  currentMenuId,
  level = 0,
}: {
  menu: MenuNode;
  pathname: string;
  currentMenuId?: string;
  level?: number;
}) {
  const branchActive = isMenuBranchActive(pathname, menu);
  const isCurrent = currentMenuId === menu.id;
  const hasChildren = menu.children.length > 0;
  const MenuIcon = getMenuIcon(menu);
  const nestedPadding = 3 + Math.min(level, 3) * 2;

  if (menu.type === 'DIR') {
    return (
      <Box role="group" aria-label={menu.name}>
        <HStack
          px={3}
          ps={nestedPadding}
          py={2}
          spacing={2.5}
          color={branchActive ? 'brand.700' : 'ink.500'}
        >
          <Icon as={MenuIcon} boxSize={5} flexShrink={0} aria-hidden />
          <Text
            fontSize="xs"
            fontWeight="800"
            letterSpacing="wide"
            noOfLines={1}
          >
            {menu.name}
          </Text>
        </HStack>

        {hasChildren && (
          <Stack
            spacing={1}
            ms={level === 0 ? 4 : 6}
            ps={2}
            borderStartWidth="1px"
            borderColor={branchActive ? 'brand.100' : 'ink.100'}
          >
            {menu.children.map((child) => (
              <DesktopMenuBranch
                key={child.id}
                menu={child}
                pathname={pathname}
                currentMenuId={currentMenuId}
                level={level + 1}
              />
            ))}
          </Stack>
        )}
      </Box>
    );
  }

  const href = getHref(menu);
  const external = isExternalHref(href);

  return (
    <Box>
      <ChakraLink
        as={Link}
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        aria-current={isCurrent ? 'page' : undefined}
        display="flex"
        alignItems="center"
        gap={2.5}
        minH="42px"
        px={3}
        ps={nestedPadding}
        rounded="xl"
        bg={isCurrent ? 'brand.50' : 'transparent'}
        color={isCurrent || branchActive ? 'brand.700' : 'ink.600'}
        fontSize="sm"
        fontWeight={isCurrent ? '800' : '700'}
        transitionProperty="common"
        transitionDuration={INTERACTION_DURATION}
        _hover={{
          bg: 'brand.50',
          color: 'brand.700',
          textDecoration: 'none',
        }}
        _focusVisible={{
          outline: '2px solid',
          outlineColor: 'brand.300',
          outlineOffset: '2px',
        }}
      >
        <Icon as={MenuIcon} boxSize={5} flexShrink={0} aria-hidden />
        <Text flex={1} minW={0} noOfLines={1}>
          {menu.name}
        </Text>
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

      {hasChildren && (
        <Stack
          spacing={1}
          mt={1}
          ms={level === 0 ? 4 : 6}
          ps={2}
          borderStartWidth="1px"
          borderColor={branchActive ? 'brand.100' : 'ink.100'}
        >
          {menu.children.map((child) => (
            <DesktopMenuBranch
              key={child.id}
              menu={child}
              pathname={pathname}
              currentMenuId={currentMenuId}
              level={level + 1}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function DesktopSidebar({
  menus,
  pathname,
  currentMenuId,
}: {
  menus: MenuNode[];
  pathname: string;
  currentMenuId?: string;
}) {
  return (
    <Box
      display={{ base: 'none', lg: 'block' }}
      position="fixed"
      insetBlock={0}
      insetInlineStart={0}
      w={DESKTOP_SIDEBAR_WIDTH}
      p={4}
      zIndex="sticky"
    >
      <GlassPanel
        as="aside"
        variant="solid"
        h="full"
        display="flex"
        flexDirection="column"
        p={3}
        rounded="3xl"
      >
        <HStack px={2} py={2} spacing={3}>
          <Flex
            layerStyle="iconBrand"
            w={10}
            h={10}
            rounded="2xl"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={Sparkles} boxSize={5} aria-hidden />
          </Flex>
          <Box minW={0}>
            <Text color="ink.900" fontWeight="900" noOfLines={1}>
              VEB
            </Text>
            <Text color="ink.500" fontSize="xs" fontWeight="700" noOfLines={1}>
              管理工作台
            </Text>
          </Box>
        </HStack>

        <Divider my={3} borderColor="ink.100" />

        <Box
          as="nav"
          aria-label="桌面主菜单"
          flex={1}
          minH={0}
          overflowY="auto"
          overscrollBehavior="contain"
          pe={1}
        >
          {menus.length > 0 ? (
            <Stack spacing={1}>
              {menus.map((menu) => (
                <DesktopMenuBranch
                  key={menu.id}
                  menu={menu}
                  pathname={pathname}
                  currentMenuId={currentMenuId}
                />
              ))}
            </Stack>
          ) : (
            <Box layerStyle="subtleSurface" px={3} py={4} rounded="2xl">
              <Text color="ink.500" fontSize="sm">
                暂无可用菜单
              </Text>
            </Box>
          )}
        </Box>
      </GlassPanel>
    </Box>
  );
}

function MobileDockMenuItem({
  item,
  pathname,
  currentMenuId,
}: {
  item: MobileDockItem;
  pathname: string;
  currentMenuId?: string;
}) {
  const active = isMenuBranchActive(pathname, item.menu);
  const hasSubMenu = item.menu.children.length > 0 && item.entries.length > 0;
  const MenuIcon = getMenuIcon(item.menu);

  if (hasSubMenu) {
    return (
      <VStack spacing={0.5} flexShrink={0}>
        <Menu placement="top" strategy="fixed" gutter={12} closeOnSelect isLazy>
          <MenuButton
            as={IconButton}
            aria-label={`打开 ${item.menu.name} 子菜单`}
            aria-current={active ? 'page' : undefined}
            icon={<Icon as={MenuIcon} boxSize={5.5} aria-hidden />}
            variant="ghost"
            size="md"
            w={11}
            h={11}
            rounded="2xl"
            bg={active ? 'brand.50' : 'transparent'}
            color={active ? 'brand.700' : 'ink.600'}
            transitionProperty="common"
            transitionDuration={INTERACTION_DURATION}
            _hover={{
              bg: 'brand.50',
              color: 'brand.700',
              transform: 'translateY(-2px)',
            }}
            _expanded={{ bg: 'brand.50', color: 'brand.700' }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'brand.300',
              outlineOffset: '2px',
            }}
          />
          <Portal>
            <MenuList
              layerStyle="glassFloating"
              minW="220px"
              maxW="calc(100vw - 24px)"
              maxH="min(60dvh, 420px)"
              overflowY="auto"
              p={2}
              rounded="2xl"
              zIndex="popover"
            >
              {item.entries.map((entry) => {
                const href = getHref(entry);
                const external = isExternalHref(href);
                const isCurrent = currentMenuId === entry.id;
                const EntryIcon = getMenuIcon(entry);

                return (
                  <MenuItem
                    key={entry.id}
                    as={Link}
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noreferrer' : undefined}
                    aria-current={isCurrent ? 'page' : undefined}
                    icon={<Icon as={EntryIcon} boxSize={4.5} aria-hidden />}
                    bg={isCurrent ? 'brand.50' : undefined}
                    color={isCurrent ? 'brand.700' : 'ink.700'}
                    rounded="xl"
                  >
                    <Flex
                      align="center"
                      justify="space-between"
                      gap={3}
                      w="full"
                    >
                      <Text
                        fontWeight={isCurrent ? '800' : '700'}
                        noOfLines={1}
                      >
                        {entry.name}
                      </Text>
                      {external && (
                        <Icon
                          as={ExternalLink}
                          boxSize={4}
                          color="ink.400"
                          flexShrink={0}
                          aria-hidden
                        />
                      )}
                    </Flex>
                  </MenuItem>
                );
              })}
            </MenuList>
          </Portal>
        </Menu>

        <Text
          maxW={14}
          color={active ? 'brand.700' : 'ink.500'}
          fontSize="xs"
          fontWeight={active ? '800' : '700'}
          noOfLines={1}
          aria-hidden
        >
          {item.menu.name}
        </Text>
      </VStack>
    );
  }

  const href = getHref(item.menu);
  const external = isExternalHref(href);
  const isCurrent = currentMenuId === item.menu.id;

  return (
    <VStack spacing={0.5} flexShrink={0}>
      <IconButton
        as={Link}
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        aria-label={item.menu.name}
        aria-current={isCurrent ? 'page' : undefined}
        icon={<Icon as={MenuIcon} boxSize={5.5} aria-hidden />}
        variant="ghost"
        size="md"
        w={11}
        h={11}
        rounded="2xl"
        bg={isCurrent ? 'brand.50' : 'transparent'}
        color={isCurrent ? 'brand.700' : 'ink.600'}
        transitionProperty="common"
        transitionDuration={INTERACTION_DURATION}
        _hover={{
          bg: 'brand.50',
          color: 'brand.700',
          transform: 'translateY(-2px)',
        }}
        _focusVisible={{
          outline: '2px solid',
          outlineColor: 'brand.300',
          outlineOffset: '2px',
        }}
      />

      <Text
        maxW={14}
        color={isCurrent ? 'brand.700' : 'ink.500'}
        fontSize="xs"
        fontWeight={isCurrent ? '800' : '700'}
        noOfLines={1}
        aria-hidden
      >
        {item.menu.name}
      </Text>
    </VStack>
  );
}

function MobileDock({
  items,
  pathname,
  currentMenuId,
}: {
  items: MobileDockItem[];
  pathname: string;
  currentMenuId?: string;
}) {
  if (items.length === 0) return null;

  return (
    <Flex
      display={{ base: 'flex', lg: 'none' }}
      position="fixed"
      insetInline={0}
      bottom={0}
      justify="center"
      px={3}
      pt={2}
      pb="calc(10px + env(safe-area-inset-bottom))"
      pointerEvents="none"
      zIndex="overlay"
    >
      <GlassPanel
        variant="floating"
        maxW="calc(100vw - 24px)"
        pointerEvents="auto"
        rounded="full"
      >
        <Box
          as="nav"
          aria-label="移动端主菜单"
          maxW="full"
          overflowX="auto"
          overflowY="hidden"
          overscrollBehaviorX="contain"
          px={2}
          py={2}
          sx={{
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Flex w="max-content" minW="full" justify="center" gap={1.5}>
            {items.map((item) => (
              <MobileDockMenuItem
                key={item.menu.id}
                item={item}
                pathname={pathname}
                currentMenuId={currentMenuId}
              />
            ))}
          </Flex>
        </Box>
      </GlassPanel>
    </Flex>
  );
}

export function Sidebar({ initialMenus = [] }: { initialMenus?: MenuNode[] }) {
  const storedMenus = useMenuStore((state) => state.menus);
  const pathname = usePathname();
  const menus = storedMenus.length > 0 ? storedMenus : initialMenus;
  const currentMenu = useMemo(
    () => getCurrentMenu(pathname, menus),
    [menus, pathname],
  );
  const mobileDockItems = useMemo<MobileDockItem[]>(
    () =>
      menus.map((menu) => ({
        menu,
        entries:
          menu.children.length > 0
            ? [
                ...(menu.type === 'DIR' ? [] : [menu]),
                ...flattenNavigableMenus(menu.children),
              ]
            : [],
      })),
    [menus],
  );

  return (
    <>
      <DesktopSidebar
        menus={menus}
        pathname={pathname}
        currentMenuId={currentMenu?.id}
      />
      <MobileDock
        items={mobileDockItems}
        pathname={pathname}
        currentMenuId={currentMenu?.id}
      />
    </>
  );
}
