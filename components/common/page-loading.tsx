'use client';

import { Card, CardBody, Center, Skeleton, Stack } from '@chakra-ui/react';

export function PageLoading() {
  return (
    <Center minH="calc(100vh - 160px)" px={{ base: 4, md: 6 }}>
      <Card w="full" maxW="720px">
        <CardBody p={{ base: 6, md: 8 }}>
          <Stack spacing={5}>
            <Skeleton h="24px" w="140px" rounded="full" />
            <Skeleton h="38px" w="70%" rounded="xl" />
            <Skeleton h="18px" w="90%" rounded="full" />
            <Skeleton h="18px" w="76%" rounded="full" />
            <Skeleton h="120px" rounded="2xl" />
          </Stack>
        </CardBody>
      </Card>
    </Center>
  );
}
