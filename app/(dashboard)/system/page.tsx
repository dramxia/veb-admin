import { Heading, Text } from '@chakra-ui/react';

export default function SystemPage() {
  return (
    <div>
      <Heading size="lg" mb={2}>系统管理</Heading>
      <Text color="gray.500">请选择左侧菜单进入用户、角色、权限或菜单管理。</Text>
    </div>
  );
}
