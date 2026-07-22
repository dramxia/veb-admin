'use client';

import {
  Box,
  Button,
  Center,
  HStack,
  Icon,
  Image,
  Link,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Download, FileText, ImageOff } from 'lucide-react';

export type FilePreviewProps = {
  file: { id: string; name: string; mime: string; url?: string };
};

export function FilePreview({ file }: FilePreviewProps) {
  const url = file.url || `/api/v1/files/${file.id}`;

  if (file.mime.startsWith('image/')) {
    return (
      <Box layerStyle="subtleSurface" p={2} w="full" maxW="440px">
        <Image
          src={url}
          alt={file.name}
          w="full"
          h="160px"
          objectFit="contain"
          loading="lazy"
          rounded="xl"
          bg="surfaceSolidBg"
          borderWidth="1px"
          borderColor="borderSubtle"
          fallback={
            <Center
              flexDirection="column"
              h="160px"
              rounded="xl"
              bg="surfaceSolidBg"
              color="ink.500"
            >
              <Icon as={ImageOff} aria-hidden="true" boxSize={5} mb={2} />
              <Text fontSize="sm">图片暂时无法预览</Text>
            </Center>
          }
        />
        <Text
          mt={2}
          px={1}
          color="ink.600"
          fontSize="sm"
          noOfLines={1}
          title={file.name}
        >
          {file.name}
        </Text>
      </Box>
    );
  }

  const isPdf = file.mime === 'application/pdf';

  return (
    <Box layerStyle="subtleSurface" p={3} w="full" maxW="440px" minH="82px">
      <Stack
        align={{ base: 'stretch', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        justify="space-between"
        spacing={3}
      >
        <HStack spacing={3} minW={0}>
          <Center layerStyle="iconBrand" aria-hidden="true">
            <Icon as={FileText} boxSize={5} />
          </Center>
          <VStack align="stretch" spacing={0} minW={0}>
            <Text
              color="ink.700"
              fontWeight="700"
              noOfLines={1}
              title={file.name}
            >
              {file.name}
            </Text>
            <Text color="ink.500" fontSize="sm" noOfLines={1}>
              {isPdf ? 'PDF 文件' : file.mime || '文件'}
            </Text>
          </VStack>
        </HStack>

        {isPdf ? (
          <Button
            as={Link}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="outline"
            flexShrink={0}
            aria-label={`在新窗口预览 ${file.name}`}
          >
            预览 PDF
          </Button>
        ) : (
          <Button
            as={Link}
            href={`${url}?download=1`}
            size="sm"
            variant="outline"
            flexShrink={0}
            leftIcon={<Icon as={Download} aria-hidden="true" boxSize={4} />}
            aria-label={`下载 ${file.name}`}
          >
            下载
          </Button>
        )}
      </Stack>
    </Box>
  );
}
