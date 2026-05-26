import { Button, Center, Heading, Stack, Text } from '@chakra-ui/react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <Center minH="100vh">
      <Stack align="center" spacing={4}>
        <Heading>404</Heading>
        <Text color="gray.500">页面不存在</Text>
        <Button as={Link} href="/" colorScheme="blue">返回首页</Button>
      </Stack>
    </Center>
  );
}
