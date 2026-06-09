'use client';

import {
  Box,
  Center,
  HStack,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
  type BoxProps,
  type StackProps,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';

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
    <Box
      bg="rgba(255, 255, 255, 0.88)"
      borderWidth="1px"
      borderColor="whiteAlpha.800"
      rounded="3xl"
      overflow="hidden"
      boxShadow="card"
      sx={{
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      }}
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
          borderBottomColor="ink.100"
          bg="linear-gradient(180deg, rgba(248, 250, 252, 0.86), rgba(255, 255, 255, 0.62))"
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
            bg: 'rgba(248, 250, 252, 0.96)',
            color: 'ink.500',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
          '& tbody tr': {
            transition: 'background 0.18s ease, box-shadow 0.18s ease',
          },
          '& tbody tr:hover': {
            bg: 'brand.50',
            boxShadow: 'inset 3px 0 0 var(--chakra-colors-brand-500)',
          },
          '& tbody tr:last-of-type td': {
            borderBottomWidth: 0,
          },
          '& td': {
            color: 'ink.700',
            verticalAlign: 'middle',
          },
        }}
      >
        {children}
      </TableContainer>
    </Box>
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
          <Center flexDirection="column" color="ink.400">
            <Text fontSize="2xl" mb={2}>
              ⎔
            </Text>
            <Text fontWeight="700">{text}</Text>
          </Center>
        </Td>
      </Tr>
    </Tbody>
  );
}
