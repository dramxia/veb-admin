'use client';

import {
  Box,
  Center,
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
      borderColor="rgba(255, 255, 255, 0.82)"
      bg="linear-gradient(135deg, rgba(255,255,255,0.54), rgba(239,250,245,0.38) 42%, rgba(248,251,252,0.48))"
      boxShadow="0 34px 96px rgba(23, 33, 29, 0.12), 0 1px 2px rgba(23, 33, 29, 0.04), inset 0 1px 0 rgba(255,255,255,0.88)"
      isolation="isolate"
      _before={{
        animation: 'table-glass-drift 16s ease-in-out infinite alternate',
        bg: 'radial-gradient(circle at 16% 18%, rgba(134, 217, 173, 0.34), transparent 30%), radial-gradient(circle at 86% 8%, rgba(142, 167, 255, 0.13), transparent 28%), radial-gradient(circle at 70% 72%, rgba(116, 199, 187, 0.18), transparent 34%), linear-gradient(115deg, transparent 8%, rgba(255,255,255,0.54) 34%, rgba(239,252,245,0.50) 52%, transparent 78%)',
        content: '""',
        filter: 'blur(36px)',
        inset: '-42% -28%',
        opacity: 0.88,
        pointerEvents: 'none',
        position: 'absolute',
        transform: 'translate3d(-6%, -4%, 0)',
        zIndex: 0,
      }}
      _after={{
        bg: 'linear-gradient(180deg, rgba(255,255,255,0.70), transparent 34%), linear-gradient(90deg, rgba(255,255,255,0.48), transparent 22%, transparent 78%, rgba(255,255,255,0.38))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(255,255,255,0.42)',
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
                  color="mint.700"
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
                  color="surface.900"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  letterSpacing="0"
                  lineHeight="1.08"
                >
                  {title}
                </Heading>
              ) : null}
              {description ? (
                <Text color="surface.600" fontSize="sm" lineHeight="1.75" maxW="720px">
                  {description}
                </Text>
              ) : null}
            </VStack>
            {primaryAction ? (
              <Flex justify={{ base: 'flex-start', md: 'flex-end' }} flexShrink={0}>
                <Box
                  className="data-table-primary-action"
                  rounded="18px"
                  borderWidth="1px"
                  borderColor="rgba(255,255,255,0.72)"
                  bg="rgba(255,255,255,0.36)"
                  p={1.5}
                  boxShadow="inset 0 1px 0 rgba(255,255,255,0.72), 0 16px 36px rgba(23,33,29,0.08)"
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
            bg="linear-gradient(135deg, rgba(255,255,255,0.56), rgba(244,251,247,0.40))"
            zIndex={4}
            boxShadow="0 16px 42px rgba(23,33,29,0.08), inset 0 1px 0 rgba(255,255,255,0.82)"
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
              borderSpacing: '0 12px',
            },
            '& thead th': {
              position: 'sticky',
              top: 0,
              zIndex: 2,
              bg: 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(241,250,246,0.66))',
              borderBottomColor: 'rgba(255,255,255,0.72)',
              borderTopWidth: '1px',
              borderTopColor: 'rgba(255,255,255,0.72)',
              color: 'surface.600',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0',
              py: 3,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.82), 0 12px 30px rgba(23,33,29,0.06)',
              backdropFilter: 'blur(26px) saturate(190%)',
              WebkitBackdropFilter: 'blur(26px) saturate(190%)',
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
              transition:
                'background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, filter 0.2s ease',
            },
            '& tbody td': {
              bg: 'rgba(255,255,255,0.56)',
              borderBottomWidth: '1px',
              borderBottomColor: 'rgba(255,255,255,0.70)',
              borderTopWidth: '1px',
              borderTopColor: 'rgba(255,255,255,0.68)',
              color: 'surface.700',
              py: 4,
              verticalAlign: 'middle',
              transition:
                'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
            },
            '& tbody td:first-of-type': {
              borderLeftWidth: '1px',
              borderLeftColor: 'rgba(255,255,255,0.72)',
              borderTopLeftRadius: '22px',
              borderBottomLeftRadius: '22px',
              boxShadow: 'inset 3px 0 0 rgba(49,168,120,0.14)',
              pl: 5,
            },
            '& tbody td:last-of-type': {
              borderRightWidth: '1px',
              borderRightColor: 'rgba(255,255,255,0.72)',
              borderTopRightRadius: '22px',
              borderBottomRightRadius: '22px',
              pr: 5,
            },
            '& tbody tr:hover': {
              transform: 'translateY(-1px)',
            },
            '& tbody tr:hover td': {
              bg: 'rgba(246,253,249,0.78)',
              borderColor: 'rgba(255,255,255,0.86)',
              boxShadow: '0 18px 42px rgba(33, 166, 108, 0.10)',
              color: 'surface.800',
            },
            '& tbody tr:hover td:first-of-type': {
              boxShadow:
                'inset 4px 0 0 rgba(33,166,108,0.72), 0 18px 42px rgba(33, 166, 108, 0.10)',
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
  colSpan,
  text = '暂无数据',
}: {
  colSpan: number;
  text?: string;
}) {
  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan} py={4}>
          <Center
            flexDirection="column"
            minH="220px"
            color="surface.400"
            rounded="26px"
            borderWidth="1px"
            borderColor="rgba(255,255,255,0.78)"
            bg="linear-gradient(135deg, rgba(255,255,255,0.58), rgba(239,252,245,0.44))"
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
