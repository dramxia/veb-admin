import { Button, Center, Heading, Stack, Text } from '@chakra-ui/react';
import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <Center minH="100vh">
      <Stack align="center" spacing={4}>
        <Heading>403</Heading>
        <Text color="gray.500">你没有权限访问该页面</Text>
        <Button as={Link} href="/" colorScheme="blue">返回首页</Button>
      </Stack>
    </Center>
  );
}
