'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Icon,
  Input,
  List,
  ListItem,
  Progress,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { FileDto } from '@veb/api-contracts';
import { FileUp, Paperclip } from 'lucide-react';
import { type DragEvent, useId, useRef, useState } from 'react';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import { t } from '@/lib/i18n';

export type UploadedFile = Pick<
  FileDto,
  'id' | 'name' | 'url' | 'mime' | 'size'
>;

type FileUploadProps = {
  value?: string[];
  onChange?: (ids: string[], files: UploadedFile[]) => void;
};

export function FileUpload({ value = [], onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const titleId = `${inputId}-title`;
  const hintId = `${inputId}-hint`;
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { clearError, error, loading: uploading, run } = useActionFeedback();

  async function upload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || uploading) return;

    await run(
      async () => {
        const formData = new FormData();
        formData.append('file', file);
        const uploadedFile = await requestJson<UploadedFile>('/api/v1/files', {
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
      layerStyle="subtleSurface"
      role="region"
      aria-busy={uploading}
      aria-labelledby={titleId}
      aria-describedby={hintId}
      minH="132px"
      borderStyle="dashed"
      borderColor={dragging ? 'brand.300' : 'borderDefault'}
      bg={dragging ? 'brand.50' : 'surfaceSubtleBg'}
      p={{ base: 4, md: 5 }}
      transition="background 180ms ease, border-color 180ms ease, box-shadow 180ms ease"
      _focusWithin={{ borderColor: 'brand.400', boxShadow: 'focusRing' }}
      onDragEnter={(event) => {
        event.preventDefault();
        clearError();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          !(nextTarget instanceof Node) ||
          !event.currentTarget.contains(nextTarget)
        ) {
          setDragging(false);
        }
      }}
      onDrop={onDrop}
    >
      <Stack
        align={{ base: 'stretch', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        justify="space-between"
        spacing={4}
      >
        <HStack spacing={3} minW={0}>
          <Center layerStyle="iconBrand" aria-hidden="true">
            <Icon as={FileUp} boxSize={5} />
          </Center>
          <VStack align="stretch" spacing={0.5} minW={0}>
            <Text id={titleId} color="ink.800" fontWeight="700">
              {t('upload.hint')}
            </Text>
            <Text id={hintId} color="ink.500" fontSize="sm" lineHeight="1.6">
              拖拽文件到此处，或选择本地文件上传
            </Text>
          </VStack>
        </HStack>
        <Button
          type="button"
          flexShrink={0}
          isLoading={uploading}
          loadingText="上传中"
          w={{ base: 'full', sm: 'auto' }}
          aria-controls={inputId}
          onClick={() => {
            clearError();
            inputRef.current?.click();
          }}
        >
          {t('upload.choose')}
        </Button>
      </Stack>

      <Input
        id={inputId}
        ref={inputRef}
        type="file"
        hidden
        aria-label={t('upload.choose')}
        onChange={(event) => void upload(event.target.files)}
      />

      {uploading ? (
        <Box mt={4} role="status" aria-live="polite">
          <HStack justify="space-between" mb={2}>
            <Text color="ink.600" fontSize="sm" fontWeight="600">
              正在上传文件
            </Text>
            <Text color="ink.500" fontSize="sm">
              请稍候
            </Text>
          </HStack>
          <Progress
            size="sm"
            isIndeterminate
            rounded="full"
            aria-label="文件上传进度"
          />
        </Box>
      ) : null}

      {error ? (
        <Alert status="error" mt={4} alignItems="flex-start">
          <AlertIcon mt={0.5} />
          <Box>
            <AlertTitle>{t('upload.failed')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      ) : null}

      {files.length ? (
        <List mt={4} spacing={2} aria-label="已上传文件">
          {files.map((file) => (
            <ListItem
              key={file.id}
              layerStyle="subtleSurface"
              display="flex"
              alignItems="center"
              gap={2.5}
              minH="42px"
              px={3}
              py={2}
              color="ink.700"
            >
              <Icon
                as={Paperclip}
                aria-hidden="true"
                boxSize={4}
                color="brand.600"
                flexShrink={0}
              />
              <Text minW={0} flex="1" noOfLines={1} title={file.name}>
                {file.name}
              </Text>
              <Badge colorScheme="green" flexShrink={0}>
                已上传
              </Badge>
            </ListItem>
          ))}
        </List>
      ) : null}
    </Box>
  );
}
