import { Suspense } from 'react';
import { Box, Card, CardBody, CardHeader, Heading, Text } from '@chakra-ui/react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" px={4}>
      <Card w="full" maxW="420px" shadow="lg">
        <CardHeader>
          <Heading size="lg">VEB 管理后台</Heading>
          <Text mt={2} color="gray.500">请输入账号密码登录</Text>
        </CardHeader>
        <CardBody pt={0}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardBody>
      </Card>
    </Box>
  );
}
