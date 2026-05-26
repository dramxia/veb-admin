'use client';

import { Box, Collapse, Link as ChakraLink, Stack, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MenuNode } from '@/lib/menu';
import { useMenuStore } from '@/stores/menu-store';


function isActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

function MenuLink({ menu, level = 0 }: { menu: MenuNode; level?: number }) {
  const pathname = usePathname();
  const active = isActive(pathname, menu.path);
  const hasChildren = menu.children.length > 0;
  const href = menu.type === 'LINK'
    ? menu.externalUrl || menu.path
    : menu.type === 'DIR' && menu.children[0]
      ? menu.children[0].path
      : menu.path;

  return (
    <Box>
      <ChakraLink
        as={Link}
        href={href}
        px={3}
        py={2}
        pl={3 + level * 4}
        rounded="md"
        display="block"
        bg={active ? 'blue.50' : 'transparent'}
        color={active ? 'blue.600' : 'gray.700'}
        fontWeight={active ? 'semibold' : 'normal'}
        _hover={{ bg: 'gray.50', textDecoration: 'none' }}
      >
        {menu.name}
      </ChakraLink>
      {hasChildren ? (
        <Collapse in={active || level === 0} animateOpacity>
          <Stack spacing={1} mt={1}>
            {menu.children.map((child) => (
              <MenuLink key={child.id} menu={child} level={level + 1} />
            ))}
          </Stack>
        </Collapse>
      ) : null}
    </Box>
  );
}

export function Sidebar() {
  const allMenus = useMenuStore((state) => state.menus);

  return (
    <Box w="240px" bg="white" borderRight="1px solid" borderColor="gray.200" h="100vh" p={4} overflowY="auto">
      <Text fontSize="xl" fontWeight="bold" mb={6}>VEB</Text>
      <Stack spacing={1}>
        {allMenus.map((menu) => (
          <MenuLink key={menu.id} menu={menu} />
        ))}
      </Stack>
    </Box>
  );
}
