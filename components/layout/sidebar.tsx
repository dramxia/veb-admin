'use client';

import { Box, Flex, Link as ChakraLink, Stack, Text } from '@chakra-ui/react';
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
  return isActive(pathname, item.menu.path) || item.children.some((child) => isActive(pathname, child.path));
}

function getMenuIcon(menu: MenuNode) {
  if (menu.icon) return menu.icon;
  if (menu.path === '/') return '⌘';
  if (menu.path.startsWith('/system')) return '⚙';
  if (menu.path.startsWith('/profile')) return '👤';
  if (menu.path.includes('user')) return '人';
  if (menu.path.includes('role')) return '盾';
  if (menu.path.includes('file')) return '夹';
  if (menu.path.includes('log')) return '志';
  return menu.name.slice(0, 1);
}

// 动画曲线：模拟苹果的弹性动画
const springTransition = 'all 0.4s cubic-bezier(0.25, 1.2, 0.5, 1)';
const fadeTransition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';

function DockSubMenu({ childrenMenus, pathname }: { childrenMenus: MenuNode[]; pathname: string }) {
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
      minW="120px"
      p={1.5}
      rounded="2xl"
      bg="rgba(255, 255, 255, 0.75)"
      border="1px solid rgba(255, 255, 255, 0.8)"
      boxShadow="0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.02)"
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
        bg: 'transparent'
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
            color={active ? 'gray.900' : 'gray.600'}
            bg={active ? 'rgba(0, 0, 0, 0.04)' : 'transparent'}
            whiteSpace="nowrap"
            transition={fadeTransition}
            _hover={{
              bg: 'rgba(0, 0, 0, 0.06)',
              color: 'gray.900',
              textDecoration: 'none',
              transform: 'scale(1.02)', // 子项轻微放大
            }}
          >
            {child.name}
          </ChakraLink>
        );
      })}
    </Stack>
  );
}

function DockMenuItem({ item, pathname }: { item: DockMenu; pathname: string }) {
  const href = getParentHref(item);
  const external = isExternalHref(href);
  const active = isDockItemActive(pathname, item);
  const hasChildren = item.children.length > 0;
  const icon = getMenuIcon(item.menu);

  return (
    <Box
      role="group"
      position="relative"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {hasChildren && <DockSubMenu childrenMenus={item.children} pathname={pathname} />}

      <ChakraLink
        as={Link}
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        aria-label={item.menu.name}
        display="grid"
        placeItems="center"
        w="48px" // 基础尺寸稍微减小，让放大效果更明显
        h="48px"
        rounded="2xl" // 圆角矩形比纯圆更现代（类似 iOS/macOS 图标）
        bg="transparent"
        color="gray.700"
        fontSize="2xl"
        transition={springTransition}
        _groupHover={{
          bg: 'rgba(255, 255, 255, 0.5)',
          transform: 'translateY(-12px) scale(1.3)', // Mac 经典放大上浮效果
          boxShadow: '0 10px 20px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.8)',
          color: 'gray.900',
          zIndex: 2,
        }}
        _hover={{ textDecoration: 'none' }}
      >
        <Text as="span" lineHeight="1">
          {icon}
        </Text>
      </ChakraLink>

      {/* 活跃状态的小圆点 (Mac 经典指示器) */}
      <Box 
        position="absolute"
        bottom="-4px"
        w="4px"
        h="4px"
        rounded="full"
        bg={active ? 'gray.800' : 'transparent'}
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
          bg="rgba(0, 0, 0, 0.75)"
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
            transform: 'translateY(0) scale(1)' 
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
      rounded="3xl" // 整个 Dock 呈现大圆角胶囊状
      bg="rgba(255, 255, 255, 0.4)" // 降低基础不透明度，强化毛玻璃
      border="1px solid rgba(255, 255, 255, 0.4)"
      borderTopColor="rgba(255, 255, 255, 0.8)" // 模拟光线从上方打下来的反光边
      boxShadow="0 20px 40px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.3)"
      overflow="visible"
      sx={{
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
      }}
    >
      {dockMenus.map((item) => (
        <DockMenuItem key={item.menu.id} item={item} pathname={pathname} />
      ))}
    </Flex>
  );
}