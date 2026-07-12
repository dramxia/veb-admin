export const dynamic = 'force-dynamic';

import { ArticleStatus } from '@prisma/client';
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleMeta } from '@/components/content/article-meta';
import { LikeButton } from '@/components/content/like-button';
import { MarkdownContent } from '@/components/content/markdown-content';
import { articleDetailSelect, serializeArticle } from '@/lib/content-data';
import { prisma } from '@/lib/prisma';

async function findArticle(slug: string) {
  return prisma.article.findFirst({
    where: {
      slug,
      status: ArticleStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
    },
    select: articleDetailSelect,
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await findArticle(params.slug);
  return article
    ? {
        title: `${article.title} | VEB`,
        description: article.summary || undefined,
      }
    : { title: '文章不存在 | VEB' };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const row = await findArticle(params.slug);
  if (!row) notFound();
  const article = serializeArticle(row);
  return (
    <Container maxW="860px" px={{ base: 4, md: 6 }} py={{ base: 7, md: 12 }}>
      <NextLink href="/articles">
        <Button as="span" variant="ghost" size="sm" mb={6}>
          返回文章列表
        </Button>
      </NextLink>
      <Box as="article" layerStyle="glassSolid" p={{ base: 5, md: 9 }}>
        <VStack align="stretch" spacing={4}>
          <Heading
            as="h1"
            fontSize={{ base: '3xl', md: '40px' }}
            lineHeight="1.3"
          >
            {article.title}
          </Heading>
          <Text color="ink.600" fontSize="lg" lineHeight="1.75">
            {article.summary}
          </Text>
          <HStack spacing={2} wrap="wrap">
            {article.tags.map((tag) => (
              <NextLink key={tag.id} href={`/articles?tag=${tag.slug}`}>
                <Badge as="span" colorScheme="brand">
                  {tag.name}
                </Badge>
              </NextLink>
            ))}
          </HStack>
          <ArticleMeta
            publishedAt={article.publishedAt}
            likeCount={article.likeCount}
            commentCount={article.commentCount}
          />
        </VStack>
        <Divider my={{ base: 6, md: 8 }} />
        <MarkdownContent>{article.contentMarkdown}</MarkdownContent>
        <Divider my={{ base: 6, md: 8 }} />
        <Stack spacing={4}>
          <LikeButton slug={article.slug} initialCount={article.likeCount} />
          <ArticleMeta
            publishedAt={article.publishedAt}
            likeCount={article.likeCount}
            commentCount={article.commentCount}
          />
        </Stack>
      </Box>
    </Container>
  );
}
