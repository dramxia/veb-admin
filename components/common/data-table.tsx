'use client';

import {
  Box,
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
  className,
  toolbar,
  minW = '760px',
  ...boxProps
}: DataTableCardProps) {
  return (
    <GlassPanel
      variant="soft"
      rounded="3xl"
      overflow="hidden"
      className={['data-table-card', className].filter(Boolean).join(' ')}
      borderColor="rgba(255, 255, 255, 0.82)"
      bg="linear-gradient(135deg, rgba(255,255,255,0.70), rgba(244,251,247,0.58) 46%, rgba(255,255,255,0.64))"
      boxShadow="0 28px 90px rgba(23, 33, 29, 0.11), 0 1px 2px rgba(23, 33, 29, 0.04), inset 0 1px 0 rgba(255,255,255,0.82)"
      isolation="isolate"
      _before={{
        animation: 'table-glass-drift 18s ease-in-out infinite alternate',
        bg: 'radial-gradient(circle at 18% 24%, rgba(134, 217, 173, 0.28), transparent 34%), radial-gradient(circle at 72% 14%, rgba(116, 199, 187, 0.20), transparent 32%), linear-gradient(115deg, transparent 8%, rgba(255,255,255,0.52) 36%, rgba(239,252,245,0.46) 52%, transparent 78%)',
        content: '""',
        filter: 'blur(32px)',
        inset: '-34% -24%',
        opacity: 0.78,
        pointerEvents: 'none',
        position: 'absolute',
        transform: 'translate3d(-6%, -4%, 0)',
        zIndex: 0,
      }}
      _after={{
        bg: 'linear-gradient(180deg, rgba(255,255,255,0.56), transparent 38%), linear-gradient(90deg, rgba(255,255,255,0.44), transparent 24%, transparent 76%, rgba(255,255,255,0.36))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(255,255,255,0.38)',
        content: '""',
        inset: 0,
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 0,
      }}
      {...boxProps}
    >
      <Box position="relative" zIndex={1}>
        {toolbar ? (
          <HStack
            px={{ base: 4, md: 5 }}
            py={4}
            justify="space-between"
            align="center"
            spacing={3}
            wrap="wrap"
            borderBottomWidth="1px"
            borderBottomColor="rgba(148, 166, 155, 0.13)"
            bg="linear-gradient(180deg, rgba(255,255,255,0.66), rgba(246,252,248,0.50))"
            position="sticky"
            top={0}
            zIndex={3}
            boxShadow="inset 0 1px 0 rgba(255,255,255,0.76)"
            sx={{
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
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
              zIndex: 2,
              bg: 'linear-gradient(180deg, rgba(248,252,249,0.92), rgba(239,249,244,0.78))',
              borderBottomColor: 'rgba(126, 150, 109, 0.16)',
              color: 'surface.600',
              fontSize: '11px',
              letterSpacing: '0',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.74), 0 1px 0 rgba(255,255,255,0.34)',
              backdropFilter: 'blur(24px) saturate(190%)',
              WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            },
            '& tbody tr': {
              position: 'relative',
              transition:
                'background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, filter 0.2s ease',
            },
            '& tbody tr:hover': {
              bg: 'rgba(241, 253, 247, 0.62)',
              boxShadow:
                'inset 3px 0 0 rgba(33, 166, 108, 0.72), inset 0 1px 0 rgba(255,255,255,0.72), 0 12px 28px rgba(33, 166, 108, 0.08)',
              transform: 'translateY(-1px)',
            },
            '& tbody tr:hover td': {
              color: 'surface.800',
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
      </Box>
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
              w="58px"
              h="58px"
              rounded="full"
              borderWidth="1px"
              borderColor="rgba(255, 255, 255, 0.76)"
              bg="linear-gradient(135deg, rgba(239,252,245,0.84), rgba(255,255,255,0.58))"
              boxShadow="0 16px 36px rgba(33, 166, 108, 0.12), inset 0 1px 0 rgba(255,255,255,0.82)"
              color="brand.600"
              mb={3}
              sx={{
                backdropFilter: 'blur(18px) saturate(180%)',
                WebkitBackdropFilter: 'blur(18px) saturate(180%)',
              }}
            >
              <Icon as={Inbox} boxSize={6} />
            </Center>
            <Text color="surface.500" fontWeight="800">
              {text}
            </Text>
          </Center>
        </Td>
      </Tr>
    </Tbody>
  );
}
