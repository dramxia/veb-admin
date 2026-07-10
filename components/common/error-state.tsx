'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Heading,
  HStack,
  Stack,
  Text,
  type ButtonProps,
} from '@chakra-ui/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type ErrorStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: ButtonProps['variant'];
};

type ErrorStateProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  message?: ReactNode;
  digest?: string;
  status?: 'error' | 'warning' | 'info' | 'success';
  minH?: string;
  actions?: ErrorStateAction[];
};

export function ErrorState({
  eyebrow = 'Error',
  title,
  description,
  message,
  digest,
  status = 'error',
  minH = 'calc(100vh - 160px)',
  actions = [],
}: ErrorStateProps) {
  const effectiveActions =
    actions.length > 0
      ? actions
      : [
          {
            label: '刷新页面',
            onClick: () => window.location.reload(),
            variant: 'outline' as const,
          },
        ];

  return (
    <Center minH={minH} px={{ base: 4, md: 6 }}>
      <Card w="full" maxW="640px">
        <CardBody p={{ base: 6, md: 8 }}>
          <Stack spacing={6}>
            <Alert status={status} rounded="2xl" alignItems="flex-start">
              <AlertIcon mt={1} />
              <Stack spacing={1}>
                <AlertTitle>{eyebrow}</AlertTitle>
                {description ? (
                  <AlertDescription color="ink.600">
                    {description}
                  </AlertDescription>
                ) : null}
              </Stack>
            </Alert>

            <Box>
              <Heading size="lg" color="ink.900" letterSpacing="0" mb={3}>
                {title}
              </Heading>
              {message ? (
                <Text color="ink.500" lineHeight="1.8">
                  {message}
                </Text>
              ) : null}
              {digest ? (
                <Box as="details" mt={3}>
                  <Text
                    as="summary"
                    color="ink.500"
                    cursor="pointer"
                    fontSize="sm"
                    fontWeight="700"
                  >
                    查看错误标识
                  </Text>
                  <Text
                    mt={2}
                    color="ink.400"
                    fontSize="sm"
                    wordBreak="break-all"
                  >
                    {digest}
                  </Text>
                </Box>
              ) : null}
            </Box>

            {effectiveActions.length > 0 ? (
              <HStack spacing={3} wrap="wrap">
                {effectiveActions.map((action) => {
                  if (action.href) {
                    return (
                      <Button
                        key={action.label}
                        as={Link}
                        href={action.href}
                        variant={action.variant}
                      >
                        {action.label}
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={action.label}
                      onClick={action.onClick}
                      variant={action.variant}
                    >
                      {action.label}
                    </Button>
                  );
                })}
              </HStack>
            ) : null}
          </Stack>
        </CardBody>
      </Card>
    </Center>
  );
}
