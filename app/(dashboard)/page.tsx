export const dynamic = 'force-dynamic';

import { Card, CardBody, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Text } from '@chakra-ui/react';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const [userCount, roleCount, permissionCount, menuCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.menu.count(),
  ]);

  return (
    <div>
      <Heading size="lg" mb={2}>仪表盘</Heading>
      <Text color="gray.500" mb={6}>欢迎使用通用后台管理系统模板</Text>
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        {[
          ['用户数', userCount],
          ['角色数', roleCount],
          ['权限数', permissionCount],
          ['菜单数', menuCount],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardBody>
              <Stat>
                <StatLabel>{label}</StatLabel>
                <StatNumber>{value}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </div>
  );
}
