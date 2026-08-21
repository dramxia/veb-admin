'use client';

import {
  Alert,
  AlertDescription,
  Badge,
  IconButton,
  Link,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import type { FileDto } from '@veb/api-contracts';
import { DeleteIcon, DownloadIcon, ExternalLinkIcon } from '@/assets/icons';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { LocalIcon } from '@/components/common/local-icon';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Auth } from '@/components/auth/auth';
import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { FileUpload } from '@/components/common/file-upload';
import { GlassPanel } from '@/components/common/glass-panel';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function FileTable({ files }: { files: FileDto[] }) {
  const router = useRouter();
  const { clearError, error, loading, run } = useActionFeedback({
    refresh: true,
  });
  const deleteDialog = useDisclosure();
  const [deletingFile, setDeletingFile] = useState<FileDto | null>(null);

  return (
    <>
      <Auth code="system:file:upload">
        <GlassPanel variant="soft" p={4} mb={5}>
          <FileUpload onChange={() => router.refresh()} />
        </GlassPanel>
      </Auth>
      {error ? (
        <Alert status="error" mb={4} aria-live="polite">
          <AlertStatusIcon status="error" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <DataTableCard
        minW="960px"
        title="文件资产"
        description="查看已上传文件、存储类型、上传人和访问操作，便于集中清理和追踪。"
        meta={`${files.length} 个文件`}
      >
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>文件名</Th>
              <Th>类型</Th>
              <Th isNumeric>大小</Th>
              <Th>上传人</Th>
              <Th>时间</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {files.length > 0 ? (
            <Tbody>
              {files.map((file) => (
                <Tr key={file.id}>
                  <Td fontWeight="700" color="ink.800">
                    {file.name}
                  </Td>
                  <Td>
                    <Badge colorScheme="gray">{file.mime}</Badge>
                  </Td>
                  <Td isNumeric>{formatSize(file.size)}</Td>
                  <Td>
                    {file.uploader?.nickname || file.uploader?.username || '-'}
                  </Td>
                  <Td>
                    {new Date(file.createdAt).toLocaleString('zh-CN', {
                      hour12: false,
                    })}
                  </Td>
                  <Td>
                    <TableActions>
                      <Tooltip label="预览文件" hasArrow>
                        <IconButton
                          as={Link}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          size="xs"
                          variant="ghost"
                          aria-label="预览文件"
                          icon={<LocalIcon icon={ExternalLinkIcon} />}
                        />
                      </Tooltip>
                      <Tooltip label="下载文件" hasArrow>
                        <IconButton
                          as={Link}
                          href={`${file.url}?download=1`}
                          size="xs"
                          variant="ghost"
                          aria-label="下载文件"
                          icon={<LocalIcon icon={DownloadIcon} />}
                        />
                      </Tooltip>
                      <AuthButton
                        code="system:file:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除文件"
                        icon={<LocalIcon icon={DeleteIcon} />}
                        isDisabled={loading}
                        onClick={() => {
                          clearError();
                          setDeletingFile(file);
                          deleteDialog.onOpen();
                        }}
                      />
                    </TableActions>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          ) : (
            <EmptyTableRow
              colSpan={6}
              text="暂无文件数据"
              description="上传文件后，可在这里预览、下载或删除。"
            />
          )}
        </Table>
      </DataTableCard>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除文件"
        description={`确认删除文件 ${deletingFile?.name ?? ''}？该操作不可撤销。`}
        error={error}
        confirmLabel="删除"
        intent="danger"
        isLoading={loading}
        onClose={() => {
          clearError();
          deleteDialog.onClose();
        }}
        onConfirm={async () => {
          const ok = await run(
            () =>
              deletingFile
                ? requestJson(`/api/v1/files/${deletingFile.id}`, {
                    method: 'DELETE',
                  })
                : undefined,
            {
              successTitle: '删除成功',
              errorTitle: '删除失败',
            },
          );
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
