'use client';

import {
  Box,
  Button,
  HStack,
  Input,
  List,
  ListItem,
  Progress,
  Text,
} from '@chakra-ui/react';
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
        const uploadedFile = await requestJson<UploadedFile>('/api/files', { method: 'POST', body: formData });
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
      borderColor={dragging ? 'blue.400' : 'gray.200'}
      rounded="lg"
      p={4}
      bg={dragging ? 'blue.50' : 'white'}
      transition="background 0.2s, border-color 0.2s"
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <HStack justify="space-between" align="center">
        <Text color="gray.500">{t('upload.hint')}</Text>
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
      {uploading ? <Progress mt={3} size="sm" isIndeterminate /> : null}
      {files.length ? (
        <List mt={3} spacing={1}>
          {files.map((file) => (
            <ListItem key={file.id}>{file.name}</ListItem>
          ))}
        </List>
      ) : null}
    </Box>
  );
}
