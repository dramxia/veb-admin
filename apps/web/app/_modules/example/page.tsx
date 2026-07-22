import { Card, CardBody, Heading, Text } from '@chakra-ui/react';

export default function ExampleModulePage() {
  return (
    <Card>
      <CardBody>
        <Heading size="md" mb={2}>
          动态模块示例
        </Heading>
        <Text color="gray.500">
          这是通过数据库菜单 component 字段加载的示例页面。
        </Text>
      </CardBody>
    </Card>
  );
}
