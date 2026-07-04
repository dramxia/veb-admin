'use client';

import {
  Badge,
  Button,
  Icon,
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
import { Download, ExternalLink, Trash2 } from 'lucide-react';
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

export type ManagedFile = {
  id: string;
  name: string;
  mime: string;
  size: number;
  url: string;
  createdAt: Date | string;
  uploader: { username: string; nickname: string | null } | null;
};

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function FileTable({ files }: { files: ManagedFile[] }) {
  const router = useRouter();
  const { loading, run } = useActionFeedback({ refresh: true });
  const deleteDialog = useDisclosure();
  const [deletingFile, setDeletingFile] = useState<ManagedFile | null>(null);

  return (
    <>
      <Auth code="system:file:upload">
        <GlassPanel variant="soft" p={4} mb={5}>
          <FileUpload onChange={() => router.refresh()} />
        </GlassPanel>
      </Auth>
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
              <Th>大小</Th>
              <Th>上传人</Th>
              <Th>时间</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {files.length > 0 ? (
            <Tbody>
              {files.map((file) => (
                <Tr key={file.id}>
                  <Td>{file.name}</Td>
                  <Td>
                    <Badge>{file.mime}</Badge>
                  </Td>
                  <Td>{formatSize(file.size)}</Td>
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
                        <Button as={Link} href={file.url} target="_blank" size="xs" variant="ghost" aria-label="预览文件">
                          <Icon as={ExternalLink} boxSize={4} />
                        </Button>
                      </Tooltip>
                      <Tooltip label="下载文件" hasArrow>
                        <Button as={Link} href={`${file.url}?download=1`} size="xs" variant="ghost" aria-label="下载文件">
                          <Icon as={Download} boxSize={4} />
                        </Button>
                      </Tooltip>
                      <AuthButton
                        code="system:file:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除文件"
                        icon={<Icon as={Trash2} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
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
            <EmptyTableRow colSpan={6} text="暂无文件数据" />
          )}
        </Table>
      </DataTableCard>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除文件"
        description={`确认删除文件 ${deletingFile?.name ?? ''}？该操作不可撤销。`}
        confirmLabel="删除"
        intent="danger"
        isLoading={loading}
        onClose={deleteDialog.onClose}
        onConfirm={async () => {
          const ok = await run(
            () =>
              deletingFile
                ? requestJson(`/api/files/${deletingFile.id}`, { method: 'DELETE' })
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
