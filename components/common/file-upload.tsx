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
  useToast,
} from '@chakra-ui/react';
import { DragEvent, useRef, useState } from 'react';
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
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const toast = useToast();

  async function upload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/files', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok || json.code !== 0)
        throw new Error(json.message || t('upload.failed'));
      const nextFiles = [...files, json.data as UploadedFile];
      const nextIds = [...value, json.data.id as string];
      setFiles(nextFiles);
      onChange?.(nextIds, nextFiles);
      toast({ title: t('upload.success'), status: 'success' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : t('upload.failed'),
        status: 'error',
      });
    } finally {
      setUploading(false);
      setDragging(false);
      if (inputRef.current) inputRef.current.value = '';
    }
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
