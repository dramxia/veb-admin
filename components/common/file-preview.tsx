'use client';

import { Box, Button, Image, Link, Text } from '@chakra-ui/react';

type FilePreviewProps = {
  file: { id: string; name: string; mime: string; url?: string };
};

export function FilePreview({ file }: FilePreviewProps) {
  const url = file.url || `/api/files/${file.id}`;
  if (file.mime.startsWith('image/')) {
    return <Image src={url} alt={file.name} maxH="160px" rounded="md" borderWidth="1px" />;
  }
  if (file.mime === 'application/pdf') {
    return (
      <Box borderWidth="1px" rounded="md" p={3}>
        <Text mb={2}>{file.name}</Text>
        <Button as={Link} href={url} target="_blank" size="sm">预览 PDF</Button>
      </Box>
    );
  }
  return (
    <Button as={Link} href={`${url}?download=1`} size="sm" variant="outline">
      下载 {file.name}
    </Button>
  );
}
