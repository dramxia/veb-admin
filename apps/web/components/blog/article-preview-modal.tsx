'use client';

import {
  Alert,
  AlertDescription,
  Badge,
  Box,
  Divider,
  Heading,
  HStack,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { AppModal } from '@/components/common/managed-overlay';
import { useEffect, useRef, useState } from 'react';
import type { ArticleDetail } from '@/components/blog/admin-types';
import { ArticleMeta } from '@/components/blog/article-meta';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { requestJson } from '@/lib/client-api';

type ArticlePreviewModalProps = {
  articleUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ArticlePreviewModal({
  articleUrl,
  isOpen,
  onClose,
}: ArticlePreviewModalProps) {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    setArticle(null);
    setError('');

    if (!isOpen || !articleUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void requestJson<ArticleDetail>(articleUrl)
      .then((detail) => {
        if (requestId.current === currentRequestId) setArticle(detail);
      })
      .catch((requestError: unknown) => {
        if (requestId.current === currentRequestId) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : '文章预览加载失败',
          );
        }
      })
      .finally(() => {
        if (requestId.current === currentRequestId) setLoading(false);
      });
  }, [articleUrl, isOpen]);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        h={{ base: '100dvh', md: 'calc(100dvh - 48px)' }}
        maxH={{ base: '100dvh', md: 'calc(100dvh - 48px)' }}
        my={{ base: 0, md: 6 }}
      >
        <ModalHeader flexShrink={0}>文章预览</ModalHeader>
        <ModalCloseButton />
        <ModalBody
          data-testid="article-preview-scroll"
          flex="1 1 auto"
          minH={0}
          overflowY="auto"
          overscrollBehavior="contain"
          pb={8}
          sx={{ scrollbarGutter: 'stable' }}
        >
          {loading ? (
            <Stack align="center" justify="center" minH="320px" spacing={3}>
              <Spinner color="brand.500" />
              <Text color="ink.500" fontSize="sm">
                正在加载文章内容
              </Text>
            </Stack>
          ) : error ? (
            <Alert status="error">
              <AlertStatusIcon status="error" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : article ? (
            <Box as="article" maxW="780px" mx="auto">
              <HStack spacing={2} mb={4} wrap="wrap">
                <Badge
                  colorScheme={
                    article.status === 'PUBLISHED' ? 'green' : 'gray'
                  }
                >
                  {article.status === 'PUBLISHED' ? '已发布' : '草稿'}
                </Badge>
                <Text color="ink.500" fontSize="sm">
                  /{article.slug}
                </Text>
              </HStack>
              <Heading
                as="h2"
                color="ink.900"
                fontSize={{ base: '2xl', md: '36px' }}
                lineHeight="1.3"
              >
                {article.title}
              </Heading>
              {article.summary ? (
                <Text color="ink.600" fontSize="lg" lineHeight="1.75" mt={4}>
                  {article.summary}
                </Text>
              ) : null}
              {article.tags.length ? (
                <HStack spacing={2} mt={4} wrap="wrap">
                  {article.tags.map((tag) => (
                    <Badge key={tag.id} colorScheme="brand">
                      {tag.name}
                    </Badge>
                  ))}
                </HStack>
              ) : null}
              <Box mt={4}>
                <ArticleMeta
                  publishedAt={article.publishedAt}
                  likeCount={article.likeCount}
                  commentCount={article.commentCount}
                />
              </Box>
              <Divider my={{ base: 6, md: 8 }} />
              {article.contentMarkdown ? (
                <MarkdownContent>{article.contentMarkdown}</MarkdownContent>
              ) : (
                <Stack py={12} textAlign="center" spacing={1}>
                  <Text color="ink.700" fontWeight="700">
                    暂无正文内容
                  </Text>
                  <Text color="ink.500" fontSize="sm">
                    可进入编辑页补充 Markdown 正文。
                  </Text>
                </Stack>
              )}
            </Box>
          ) : null}
        </ModalBody>
      </ModalContent>
    </AppModal>
  );
}
