import { Card, CardBody, Heading, Text } from '@chakra-ui/react';

export default function ExampleModulePage() {
  return (
    <Card>
      <CardBody>
        <Heading size="md" mb={2}>
          动态模块示例
        </Heading>
        <Text color="gray.500">
          这是由代码注册并通过数据库授权启用的模块首页。
        </Text>
      </CardBody>
    </Card>
  );
}
