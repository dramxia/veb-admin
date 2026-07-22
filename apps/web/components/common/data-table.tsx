'use client';

import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Icon,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
  VStack,
  type BoxProps,
  type StackProps,
} from '@chakra-ui/react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { GlassPanel } from './glass-panel';

type DataTableCardProps = Omit<BoxProps, 'title'> & {
  children: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  primaryAction?: ReactNode;
  title?: ReactNode;
  toolbar?: ReactNode;
  minW?: BoxProps['minW'];
};

export function DataTableCard({
  children,
  className,
  description,
  meta,
  primaryAction,
  title,
  toolbar,
  minW = '760px',
  ...boxProps
}: DataTableCardProps) {
  const hasHeader = Boolean(title || description || meta || primaryAction);
  const tableLabel = typeof title === 'string' ? title : '数据表格';

  return (
    <GlassPanel
      variant="solid"
      className={['data-table-card', className].filter(Boolean).join(' ')}
      {...boxProps}
    >
      {hasHeader ? (
        <Flex
          align={{ base: 'stretch', md: 'flex-start' }}
          direction={{ base: 'column', md: 'row' }}
          gap={4}
          justify="space-between"
          px={{ base: 4, md: 5 }}
          py={{ base: 4, md: 5 }}
        >
          <VStack align="stretch" spacing={1.5} minW={0}>
            {meta ? (
              <Box color="brand.700" fontSize="xs" fontWeight="700">
                {meta}
              </Box>
            ) : null}
            {title ? (
              <Heading as="h2" color="ink.900" fontSize="lg" lineHeight="1.35">
                {title}
              </Heading>
            ) : null}
            {description ? (
              <Text
                color="ink.600"
                fontSize="sm"
                lineHeight="1.65"
                maxW="720px"
              >
                {description}
              </Text>
            ) : null}
          </VStack>

          {primaryAction ? (
            <Flex
              className="data-table-primary-action"
              flexShrink={0}
              justify={{ base: 'flex-start', md: 'flex-end' }}
            >
              {primaryAction}
            </Flex>
          ) : null}
        </Flex>
      ) : null}

      {toolbar ? (
        <Box
          layerStyle="toolbarSurface"
          boxShadow="none"
          mx={{ base: 3, md: 5 }}
          mb={4}
          p={{ base: 3, md: 4 }}
        >
          {toolbar}
        </Box>
      ) : null}

      <TableContainer
        aria-label={tableLabel}
        role="region"
        tabIndex={0}
        overflowX="auto"
        borderTopWidth="1px"
        borderColor="borderSubtle"
        _focusVisible={{ boxShadow: 'focusRing', outline: 'none' }}
        sx={{
          '& table': {
            minWidth: minW,
            borderCollapse: 'collapse',
          },
          '& thead th': {
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bg: 'surfaceSolidBg',
            borderBottomColor: 'borderSubtle',
            color: 'ink.500',
            fontSize: 'xs',
            fontWeight: 700,
            py: 3,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
          '& thead th:first-of-type, & tbody td:first-of-type': {
            pl: { base: 4, md: 5 },
          },
          '& thead th:last-of-type, & tbody td:last-of-type': {
            pr: { base: 4, md: 5 },
          },
          '& tbody tr': {
            transition: 'background 160ms ease',
          },
          '& tbody td': {
            bg: 'transparent',
            borderBottomColor: 'borderSubtle',
            color: 'ink.700',
            py: 3.5,
            verticalAlign: 'middle',
            transition: 'background 160ms ease, color 160ms ease',
          },
          '& tbody tr:not([data-empty-state]):hover td': {
            bg: 'tableHoverBg',
            color: 'ink.800',
          },
          '& tbody tr[aria-selected="true"] td': {
            bg: 'tableSelectedBg',
          },
          '& tbody tr:last-of-type td': {
            borderBottomWidth: 0,
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
    <HStack
      spacing={1}
      wrap="nowrap"
      w="fit-content"
      _empty={{ display: 'none' }}
      sx={{
        '& > .chakra-button, & > button, & > a': {
          borderRadius: '12px',
          h: '36px',
          minH: '36px',
          minW: '36px',
        },
      }}
      {...props}
    >
      {children}
    </HStack>
  );
}

export function EmptyTableRow({
  action,
  colSpan,
  description,
  text = '暂无数据',
}: {
  action?: ReactNode;
  colSpan: number;
  description?: ReactNode;
  text?: string;
}) {
  const nextStep =
    description ??
    (action
      ? '请使用下方操作继续。'
      : '请检查筛选条件，或刷新后重新获取数据。');

  return (
    <Tbody>
      <Tr data-empty-state>
        <Td colSpan={colSpan} p={0}>
          <Center
            layerStyle="subtleSurface"
            flexDirection="column"
            minH="200px"
            position={{ base: 'sticky', md: 'static' }}
            left={{ base: 3, md: 'auto' }}
            w={{ base: 'calc(100vw - 52px)', md: 'auto' }}
            maxW={{ base: 'calc(100vw - 52px)', md: '560px' }}
            mx={{ base: 0, md: 'auto' }}
            my={{ base: 3, md: 4 }}
            px={5}
            py={8}
          >
            <Center layerStyle="iconBrand" aria-hidden="true" mb={3}>
              <Icon as={Inbox} boxSize={5} />
            </Center>
            <Text color="ink.700" fontWeight="700">
              {text}
            </Text>
            <Text
              mt={1.5}
              color="ink.500"
              fontSize="sm"
              lineHeight="1.65"
              maxW="420px"
              textAlign="center"
            >
              {nextStep}
            </Text>
            {action ? (
              <Box mt={4}>{action}</Box>
            ) : (
              <Button
                mt={4}
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                刷新数据
              </Button>
            )}
          </Center>
        </Td>
      </Tr>
    </Tbody>
  );
}
