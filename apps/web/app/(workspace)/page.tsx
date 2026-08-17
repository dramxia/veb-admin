import { Center, Heading, Stack, Text } from '@chakra-ui/react';
import { redirect } from 'next/navigation';
import { PlainModuleShell } from '@/components/layout/plain-module-shell';
import { getWorkspaceNavigation } from '@/lib/workspace-navigation';

export default async function WorkspaceIndexPage() {
  const navigation = await getWorkspaceNavigation();
  const landingPath = navigation.modules[0]?.landingPath;
  if (landingPath) redirect(landingPath);

  return (
    <PlainModuleShell>
      <Center h="full" minH="320px" textAlign="center">
        <Stack spacing={2} maxW="480px">
          <Heading size="md">暂无可用应用模块</Heading>
          <Text color="ink.500">当前账号尚未获得已启用的应用模块。</Text>
        </Stack>
      </Center>
    </PlainModuleShell>
  );
}
