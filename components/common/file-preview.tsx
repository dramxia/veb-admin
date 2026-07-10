'use client';

import { Box, Button, HStack, Icon, Image, Link, Text } from '@chakra-ui/react';
import { Download, FileText } from 'lucide-react';

type FilePreviewProps = {
  file: { id: string; name: string; mime: string; url?: string };
};

export function FilePreview({ file }: FilePreviewProps) {
  const url = file.url || `/api/files/${file.id}`;
  if (file.mime.startsWith('image/')) {
    return (
      <Box
        rounded="2xl"
        borderWidth="1px"
        borderColor="ink.100"
        bg="rgba(255,255,255,0.72)"
        p={2}
      >
        <Image
          src={url}
          alt={file.name}
          maxH="160px"
          rounded="xl"
          borderWidth="1px"
          borderColor="ink.100"
        />
      </Box>
    );
  }
  if (file.mime === 'application/pdf') {
    return (
      <Box
        borderWidth="1px"
        borderColor="ink.100"
        rounded="2xl"
        bg="rgba(255,255,255,0.72)"
        p={3}
      >
        <HStack spacing={2} mb={3}>
          <Icon as={FileText} boxSize={4} color="brand.600" />
          <Text color="ink.700" fontWeight="700" noOfLines={1}>
            {file.name}
          </Text>
        </HStack>
        <Button
          as={Link}
          href={url}
          target="_blank"
          size="sm"
          variant="outline"
        >
          预览 PDF
        </Button>
      </Box>
    );
  }
  return (
    <Button
      as={Link}
      href={`${url}?download=1`}
      size="sm"
      variant="outline"
      leftIcon={<Icon as={Download} boxSize={4} />}
    >
      <Text as="span" noOfLines={1}>
        下载 {file.name}
      </Text>
    </Button>
  );
}
