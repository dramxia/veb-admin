'use client';

import {
  Box,
  Button,
  Center,
  HStack,
  Icon,
  Input,
  List,
  ListItem,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FileUp, Paperclip } from 'lucide-react';
import { DragEvent, useRef, useState } from 'react';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import { t } from '@/lib/i18n';

export type UploadedFile = {
  id: string;
  name: string;
  url: string;
  mime: string;
  size: number;
};

type FileUploadProps = {
  value?: string[];
  onChange?: (ids: string[], files: UploadedFile[]) => void;
};

export function FileUpload({ value = [], onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { loading: uploading, run } = useActionFeedback();

  async function upload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || uploading) return;

    await run(
      async () => {
        const formData = new FormData();
        formData.append('file', file);
        const uploadedFile = await requestJson<UploadedFile>('/api/files', {
          method: 'POST',
          body: formData,
        });
        const nextFiles = [...files, uploadedFile];
        const nextIds = [...value, uploadedFile.id];
        setFiles(nextFiles);
        onChange?.(nextIds, nextFiles);
      },
      { successTitle: t('upload.success'), errorTitle: t('upload.failed') },
    );

    setDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    void upload(event.dataTransfer.files);
  }

  return (
    <Box
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={dragging ? 'brand.300' : 'ink.200'}
      rounded="2xl"
      p={{ base: 4, md: 5 }}
      bg={dragging ? 'brand.50' : 'rgba(255,255,255,0.78)'}
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.78)"
      transition="background 0.2s, border-color 0.2s, box-shadow 0.2s"
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <HStack justify="space-between" align="center" spacing={4}>
        <HStack spacing={3} minW={0}>
          <Center
            w="42px"
            h="42px"
            rounded="2xl"
            bg="brand.50"
            color="brand.600"
            flexShrink={0}
          >
            <Icon as={FileUp} boxSize={5} />
          </Center>
          <VStack align="stretch" spacing={0} minW={0}>
            <Text color="ink.700" fontWeight="800" noOfLines={1}>
              {t('upload.hint')}
            </Text>
            <Text color="ink.500" fontSize="sm" noOfLines={1}>
              拖拽文件到此处，或选择本地文件上传
            </Text>
          </VStack>
        </HStack>
        <Button isLoading={uploading} onClick={() => inputRef.current?.click()}>
          {t('upload.choose')}
        </Button>
      </HStack>
      <Input
        ref={inputRef}
        type="file"
        hidden
        onChange={(event) => upload(event.target.files)}
      />
      {uploading ? (
        <Progress mt={4} size="sm" isIndeterminate rounded="full" />
      ) : null}
      {files.length ? (
        <List mt={4} spacing={2}>
          {files.map((file) => (
            <ListItem
              key={file.id}
              display="flex"
              alignItems="center"
              gap={2}
              rounded="xl"
              borderWidth="1px"
              borderColor="ink.100"
              bg="rgba(255,255,255,0.72)"
              px={3}
              py={2}
              color="ink.700"
              fontWeight="600"
            >
              <Icon as={Paperclip} boxSize={4} color="brand.600" />
              <Text noOfLines={1}>{file.name}</Text>
            </ListItem>
          ))}
        </List>
      ) : null}
    </Box>
  );
}
