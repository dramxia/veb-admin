'use client';

import {
  Box,
  Center,
  Button,
  Flex,
  HStack,
  Heading,
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

  return (
    <GlassPanel
      variant="soft"
      rounded="3xl"
      overflow="hidden"
      className={['data-table-card', className].filter(Boolean).join(' ')}
      borderColor="rgba(255, 255, 255, 0.78)"
      bg="rgba(255, 255, 255, 0.74)"
      boxShadow="0 18px 44px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255,255,255,0.82)"
      isolation="isolate"
      _before={{
        bg: 'radial-gradient(circle at 16% 12%, rgba(22, 119, 255, 0.08), transparent 28%), radial-gradient(circle at 86% 6%, rgba(109, 93, 252, 0.06), transparent 26%)',
        content: '""',
        filter: 'blur(24px)',
        inset: '-34% -24% 48% -24%',
        opacity: 0.9,
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 0,
      }}
      _after={{
        bg: 'linear-gradient(180deg, rgba(255,255,255,0.62), transparent 36%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(255,255,255,0.42)',
        content: '""',
        inset: 0,
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 0,
      }}
      {...boxProps}
    >
      <Box position="relative" zIndex={1}>
        {hasHeader ? (
          <Flex
            align={{ base: 'stretch', md: 'flex-start' }}
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            justify="space-between"
            px={{ base: 4, md: 6 }}
            pt={{ base: 5, md: 6 }}
            pb={toolbar ? 3 : 4}
          >
            <VStack align="stretch" spacing={2} minW={0}>
              {meta ? (
                <Box
                  alignSelf="flex-start"
                  px={3}
                  py={1.5}
                  rounded="full"
                  borderWidth="1px"
                  borderColor="rgba(255,255,255,0.76)"
                  bg="rgba(255,255,255,0.48)"
                  color="brand.700"
                  fontSize="xs"
                  fontWeight="800"
                  lineHeight="1.2"
                  boxShadow="inset 0 1px 0 rgba(255,255,255,0.76)"
                  sx={{
                    backdropFilter: 'blur(18px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(180%)',
                  }}
                >
                  {meta}
                </Box>
              ) : null}
              {title ? (
                <Heading
                  as="h2"
                  color="ink.900"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  letterSpacing="0"
                  lineHeight="1.08"
                >
                  {title}
                </Heading>
              ) : null}
              {description ? (
                <Text
                  color="ink.600"
                  fontSize="sm"
                  lineHeight="1.75"
                  maxW="720px"
                >
                  {description}
                </Text>
              ) : null}
            </VStack>
            {primaryAction ? (
              <Flex
                justify={{ base: 'flex-start', md: 'flex-end' }}
                flexShrink={0}
              >
                <Box
                  className="data-table-primary-action"
                  rounded="18px"
                  borderWidth="1px"
                  borderColor="rgba(255,255,255,0.72)"
                  bg="rgba(255,255,255,0.36)"
                  p={1.5}
                  boxShadow="inset 0 1px 0 rgba(255,255,255,0.72), 0 12px 28px rgba(15,23,42,0.06)"
                  _empty={{ display: 'none' }}
                  sx={{
                    backdropFilter: 'blur(18px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(180%)',
                  }}
                >
                  {primaryAction}
                </Box>
              </Flex>
            ) : null}
          </Flex>
        ) : null}

        {toolbar ? (
          <Box
            mx={{ base: 4, md: 6 }}
            mb={4}
            p={{ base: 3, md: 4 }}
            rounded="24px"
            borderWidth="1px"
            borderColor="rgba(255,255,255,0.74)"
            bg="rgba(255,255,255,0.64)"
            zIndex={4}
            boxShadow="0 12px 30px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.82)"
            sx={{
              backdropFilter: 'blur(30px) saturate(190%)',
              WebkitBackdropFilter: 'blur(30px) saturate(190%)',
            }}
          >
            {toolbar}
          </Box>
        ) : null}

        <TableContainer
          overflowX="auto"
          px={{ base: 3, md: 5 }}
          pb={{ base: 3, md: 5 }}
          sx={{
            '& table': {
              minWidth: minW,
              borderCollapse: 'separate',
              borderSpacing: '0 8px',
            },
            '& thead th': {
              position: 'sticky',
              top: 0,
              zIndex: 2,
              bg: 'rgba(255,255,255,0.82)',
              borderBottomColor: 'ink.100',
              borderTopWidth: '1px',
              borderTopColor: 'rgba(255,255,255,0.72)',
              color: 'ink.500',
              fontSize: 'xs',
              fontWeight: 700,
              letterSpacing: '0',
              py: 3,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.82)',
            },
            '& thead th:first-of-type': {
              borderLeftWidth: '1px',
              borderLeftColor: 'rgba(255,255,255,0.72)',
              borderTopLeftRadius: '18px',
              borderBottomLeftRadius: '18px',
              pl: 5,
            },
            '& thead th:last-of-type': {
              borderRightWidth: '1px',
              borderRightColor: 'rgba(255,255,255,0.72)',
              borderTopRightRadius: '18px',
              borderBottomRightRadius: '18px',
              pr: 5,
            },
            '& tbody tr': {
              position: 'relative',
              transition: 'background 0.2s ease, box-shadow 0.2s ease',
            },
            '& tbody td': {
              bg: 'rgba(255,255,255,0.68)',
              borderBottomWidth: '1px',
              borderBottomColor: 'rgba(226,232,240,0.64)',
              borderTopWidth: '1px',
              borderTopColor: 'rgba(226,232,240,0.54)',
              color: 'ink.700',
              py: 4,
              verticalAlign: 'middle',
              transition:
                'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            },
            '& tbody td:first-of-type': {
              borderLeftWidth: '1px',
              borderLeftColor: 'rgba(255,255,255,0.72)',
              borderTopLeftRadius: '22px',
              borderBottomLeftRadius: '22px',
              boxShadow: 'inset 3px 0 0 rgba(22,119,255,0.12)',
              pl: 5,
            },
            '& tbody td:last-of-type': {
              borderRightWidth: '1px',
              borderRightColor: 'rgba(255,255,255,0.72)',
              borderTopRightRadius: '22px',
              borderBottomRightRadius: '22px',
              pr: 5,
            },
            '& tbody tr:hover td': {
              bg: 'rgba(238,247,255,0.62)',
              borderColor: 'rgba(183,221,255,0.66)',
              color: 'ink.800',
            },
            '& tbody tr:hover td:first-of-type': {
              boxShadow: 'inset 4px 0 0 rgba(22,119,255,0.62)',
            },
            '& tbody tr:last-of-type td': {
              borderBottomWidth: '1px',
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
    <HStack
      spacing={1}
      wrap="nowrap"
      rounded="full"
      borderWidth="1px"
      borderColor="rgba(255,255,255,0.66)"
      bg="rgba(255,255,255,0.44)"
      p={1}
      w="fit-content"
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.74)"
      _empty={{ display: 'none' }}
      sx={{
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        '& .chakra-button': {
          borderRadius: '999px',
          height: '30px',
          minWidth: '30px',
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
  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan} py={4}>
          <Center
            flexDirection="column"
            minH="220px"
            color="ink.400"
            rounded="26px"
            borderWidth="1px"
            borderColor="rgba(255,255,255,0.78)"
            bg="linear-gradient(135deg, rgba(255,255,255,0.62), rgba(238,247,255,0.48))"
            boxShadow="inset 0 1px 0 rgba(255,255,255,0.82)"
            sx={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <Center
              w="58px"
              h="58px"
              rounded="full"
              borderWidth="1px"
              borderColor="rgba(255, 255, 255, 0.76)"
              bg="linear-gradient(135deg, rgba(238,247,255,0.88), rgba(255,255,255,0.62))"
              boxShadow="0 16px 36px rgba(22, 119, 255, 0.12), inset 0 1px 0 rgba(255,255,255,0.82)"
              color="brand.600"
              mb={3}
              sx={{
                backdropFilter: 'blur(18px) saturate(180%)',
                WebkitBackdropFilter: 'blur(18px) saturate(180%)',
              }}
            >
              <Icon as={Inbox} boxSize={6} />
            </Center>
            <Text color="ink.600" fontWeight="800">
              {text}
            </Text>
            {description ? (
              <Text
                mt={2}
                color="ink.500"
                fontSize="sm"
                maxW="420px"
                textAlign="center"
              >
                {description}
              </Text>
            ) : null}
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
