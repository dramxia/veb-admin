'use client';

import {
  Box,
  Flex,
  Icon,
  Link as ChakraLink,
  Stack,
  Text,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  Circle,
  Compass,
  FileBox,
  Folder,
  Home,
  LayoutDashboard,
  ListTree,
  LucideIcon,
  ScrollText,
  Shield,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import type { MenuNode } from '@/lib/menu';
import { useMenuStore } from '@/stores/menu-store';

type DockMenu = {
  menu: MenuNode;
  children: MenuNode[];
};

function isActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

function getHref(menu: MenuNode) {
  return menu.type === 'LINK' ? menu.externalUrl || menu.path : menu.path;
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

function collectDockChildren(menu: MenuNode): MenuNode[] {
  return menu.children.flatMap((child) => {
    if (child.children.length === 0) return [child];
    if (child.type === 'DIR') return collectDockChildren(child);
    return [child, ...collectDockChildren(child)];
  });
}

function toDockMenus(menus: MenuNode[]): DockMenu[] {
  return menus.map((menu) => ({ menu, children: collectDockChildren(menu) }));
}

function getParentHref(item: DockMenu) {
  return item.children[0] ? getHref(item.children[0]) : getHref(item.menu);
}

function isDockItemActive(pathname: string, item: DockMenu) {
  return (
    isActive(pathname, item.menu.path) ||
    item.children.some((child) => isActive(pathname, child.path))
  );
}

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

// Dock 只保留轻微弹性，避免影响后台高频操作的稳定感。
const springTransition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
const fadeTransition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';

function DockSubMenu({
  childrenMenus,
  pathname,
}: {
  childrenMenus: MenuNode[];
  pathname: string;
}) {
  if (childrenMenus.length === 0) return null;

  return (
    <Stack
      spacing={1}
      position="absolute"
      bottom="calc(100% + 16px)" // 距离父菜单顶部有一定呼吸空间
      left="50%"
      transform="translateX(-50%) translateY(10px) scale(0.9)"
      transformOrigin="bottom center"
      zIndex={10}
      minW="148px"
      p={1.5}
      rounded="2xl"
      bg="rgba(255, 255, 255, 0.72)"
      border="1px solid rgba(255, 255, 255, 0.78)"
      boxShadow="0 20px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.72)"
      opacity={0}
      pointerEvents="none"
      transition={springTransition}
      sx={{
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      }}
      // 利用伪元素填补子菜单与父级菜单之间的空隙，防止鼠标移出导致菜单消失
      _after={{
        content: '""',
        position: 'absolute',
        bottom: '-16px',
        left: 0,
        right: 0,
        height: '16px',
        bg: 'transparent',
      }}
      _groupHover={{
        opacity: 1,
        pointerEvents: 'auto',
        transform: 'translateX(-50%) translateY(0) scale(1)',
      }}
    >
      {childrenMenus.map((child) => {
        const href = getHref(child);
        const external = isExternalHref(href);
        const active = isActive(pathname, child.path);

        return (
          <ChakraLink
            key={child.id}
            as={Link}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            px={3}
            py={2}
            rounded="xl"
            fontSize="sm"
            fontWeight={active ? '600' : '500'}
            color={active ? 'ink.900' : 'ink.600'}
            bg={active ? 'rgba(22, 119, 255, 0.10)' : 'transparent'}
            whiteSpace="nowrap"
            transition={fadeTransition}
            _hover={{
              bg: 'rgba(22, 119, 255, 0.10)',
              color: 'ink.900',
              textDecoration: 'none',
              transform: 'scale(1.01)',
            }}
          >
            {child.name}
          </ChakraLink>
        );
      })}
    </Stack>
  );
}

function DockMenuItem({
  item,
  pathname,
}: {
  item: DockMenu;
  pathname: string;
}) {
  const href = getParentHref(item);
  const external = isExternalHref(href);
  const active = isDockItemActive(pathname, item);
  const hasChildren = item.children.length > 0;
  const MenuIcon = getMenuIcon(item.menu);

  return (
    <Box
      role="group"
      position="relative"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {hasChildren && (
        <DockSubMenu childrenMenus={item.children} pathname={pathname} />
      )}

      <motion.div
        whileHover={{ y: -6, scale: 1.12 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      >
        <ChakraLink
          as={Link}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          aria-label={item.menu.name}
          display="grid"
          placeItems="center"
          w="48px"
          h="48px"
          rounded="2xl"
          bg={active ? 'rgba(22, 119, 255, 0.14)' : 'rgba(255,255,255,0.22)'}
          color={active ? 'brand.700' : 'ink.700'}
          transition={springTransition}
          boxShadow={
            active
              ? 'inset 0 1px 0 rgba(255,255,255,0.82), 0 12px 26px rgba(22,119,255,0.18)'
              : 'inset 0 1px 0 rgba(255,255,255,0.64)'
          }
          _groupHover={{
            bg: 'rgba(255, 255, 255, 0.56)',
            boxShadow:
              '0 16px 30px rgba(15,23,42,0.10), inset 0 1px 1px rgba(255,255,255,0.82)',
            color: 'ink.900',
            zIndex: 2,
          }}
          _hover={{ textDecoration: 'none' }}
          _focusVisible={{
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(22,119,255,0.24)',
          }}
        >
          <Icon as={MenuIcon} boxSize={5} strokeWidth={2.2} />
        </ChakraLink>
      </motion.div>

      {/* 活跃状态的小圆点 (Mac 经典指示器) */}
      <Box
        position="absolute"
        bottom="-4px"
        w="4px"
        h="4px"
        rounded="full"
        bg={active ? 'brand.600' : 'transparent'}
        transition={fadeTransition}
      />

      {/* 悬浮提示 (Tooltip) - 只有在没有子菜单时才显示，避免重叠混乱 */}
      {!hasChildren && (
        <Text
          position="absolute"
          top="-36px"
          px={3}
          py={1.5}
          rounded="xl"
          bg="rgba(15, 23, 42, 0.82)"
          color="white"
          fontSize="xs"
          fontWeight="medium"
          whiteSpace="nowrap"
          opacity={0}
          pointerEvents="none"
          transform="translateY(8px) scale(0.9)"
          transition={springTransition}
          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
          sx={{ backdropFilter: 'blur(8px)' }}
          _groupHover={{
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          }}
        >
          {item.menu.name}
        </Text>
      )}
    </Box>
  );
}

export function Sidebar({ initialMenus = [] }: { initialMenus?: MenuNode[] }) {
  const storedMenus = useMenuStore((state) => state.menus);
  const pathname = usePathname();
  const allMenus = storedMenus.length > 0 ? storedMenus : initialMenus;
  const dockMenus = useMemo(() => toDockMenus(allMenus), [allMenus]);

  if (dockMenus.length === 0) return null;

  return (
    <Flex
      as="nav"
      aria-label="主菜单"
      position="fixed"
      left="50%"
      bottom="24px"
      transform="translateX(-50%)"
      zIndex="sticky"
      px={3}
      py={2.5}
      gap={2}
      rounded="3xl"
      bg="rgba(255, 255, 255, 0.44)"
      border="1px solid rgba(255, 255, 255, 0.62)"
      borderTopColor="rgba(255, 255, 255, 0.8)"
      boxShadow="0 20px 40px rgba(15, 23, 42, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.48)"
      overflow="visible"
      maxW="calc(100vw - 24px)"
      sx={{
        backdropFilter: 'blur(34px) saturate(200%)',
        WebkitBackdropFilter: 'blur(34px) saturate(200%)',
        '@media (max-width: 640px)': {
          overflowX: 'auto',
          overflowY: 'visible',
          justifyContent: 'flex-start',
        },
      }}
    >
      {dockMenus.map((item) => (
        <DockMenuItem key={item.menu.id} item={item} pathname={pathname} />
      ))}
    </Flex>
  );
}
