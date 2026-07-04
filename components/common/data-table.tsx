'use client';

import {
  Center,
  HStack,
  Icon,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
  type BoxProps,
  type StackProps,
} from '@chakra-ui/react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { GlassPanel } from './glass-panel';

type DataTableCardProps = BoxProps & {
  children: ReactNode;
  toolbar?: ReactNode;
  minW?: BoxProps['minW'];
};

export function DataTableCard({
  children,
  toolbar,
  minW = '760px',
  ...boxProps
}: DataTableCardProps) {
  return (
    <GlassPanel
      variant="solid"
      rounded="3xl"
      overflow="hidden"
      {...boxProps}
    >
      {toolbar ? (
        <HStack
          px={{ base: 4, md: 5 }}
          py={4}
          justify="space-between"
          align="center"
          spacing={3}
          wrap="wrap"
          borderBottomWidth="1px"
          borderBottomColor="rgba(148, 166, 155, 0.16)"
          bg="rgba(255,255,255,0.48)"
          position="sticky"
          top={0}
          zIndex={2}
          sx={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {toolbar}
        </HStack>
      ) : null}

      <TableContainer
        overflowX="auto"
        sx={{
          '& table': {
            minWidth: minW,
            borderCollapse: 'separate',
            borderSpacing: 0,
          },
          '& thead th': {
            position: 'sticky',
            top: 0,
            zIndex: 1,
            bg: 'rgba(246, 250, 247, 0.92)',
            color: 'surface.600',
            fontSize: '11px',
            letterSpacing: '0',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(18px) saturate(180%)',
          },
          '& tbody tr': {
            transition: 'background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
          },
          '& tbody tr:hover': {
            bg: 'rgba(239, 252, 245, 0.74)',
            boxShadow: 'inset 3px 0 0 var(--chakra-colors-brand-500)',
          },
          '& tbody tr:last-of-type td': {
            borderBottomWidth: 0,
          },
          '& td': {
            color: 'surface.700',
            verticalAlign: 'middle',
          },
        }}
      >
        {children}
      </TableContainer>
    </GlassPanel>
  );
}

export function TableActions({ children, ...props }: StackProps) {
  return (
    <HStack spacing={2} wrap="nowrap" {...props}>
      {children}
    </HStack>
  );
}

export function EmptyTableRow({
  colSpan,
  text = '暂无数据',
}: {
  colSpan: number;
  text?: string;
}) {
  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan} py={12}>
          <Center flexDirection="column" color="surface.400">
            <Center
              w="54px"
              h="54px"
              rounded="2xl"
              bg="rgba(232, 246, 236, 0.72)"
              color="brand.600"
              mb={3}
            >
              <Icon as={Inbox} boxSize={6} />
            </Center>
            <Text fontWeight="800">{text}</Text>
          </Center>
        </Td>
      </Tr>
    </Tbody>
  );
}
