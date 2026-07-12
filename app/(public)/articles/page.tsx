export const dynamic = 'force-dynamic';

import { ArticleStatus } from '@prisma/client';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { ArticleMeta } from '@/components/content/article-meta';
import { articleListSelect, serializeArticle } from '@/lib/content-data';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: '文章 | VEB',
  description: 'VEB 文章列表',
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { tag?: string; page?: string };
}) {
  const requestedPage = Number(searchParams.page || 1);
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1;
  const pageSize = 10;
  const tag = searchParams.tag?.trim().toLowerCase();
  const where = {
    status: ArticleStatus.PUBLISHED,
    publishedAt: { lte: new Date() },
    ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
  };
  const [total, rows, tags] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: articleListSelect,
    }),
    prisma.tag.findMany({
      where: {
        articles: { some: { article: { status: ArticleStatus.PUBLISHED } } },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            articles: {
              where: { article: { status: ArticleStatus.PUBLISHED } },
            },
          },
        },
      },
    }),
  ]);
  const items = rows.map(serializeArticle);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageHref = (nextPage: number) =>
    `/articles?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(nextPage) })}`;

  return (
    <Container maxW="920px" px={{ base: 4, md: 6 }} py={{ base: 8, md: 12 }}>
      <VStack align="stretch" spacing={3} mb={8}>
        <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }}>
          文章
        </Heading>
        <Text color="ink.600" lineHeight="1.7">
          浏览最新发布的记录与实践。
        </Text>
        <HStack spacing={2} wrap="wrap" pt={2}>
          <NextLink href="/articles">
            <Button as="span" size="sm" variant={!tag ? 'solid' : 'outline'}>
              全部 {total}
            </Button>
          </NextLink>
          {tags.map((item) => (
            <NextLink
              key={item.id}
              href={`/articles?tag=${encodeURIComponent(item.slug)}`}
            >
              <Button
                as="span"
                size="sm"
                variant={tag === item.slug ? 'solid' : 'outline'}
              >
                {item.name} {item._count.articles}
              </Button>
            </NextLink>
          ))}
        </HStack>
      </VStack>

      <Stack spacing={4}>
        {items.map((article) => (
          <Card key={article.id} as="article" variant="outline">
            <CardBody p={{ base: 5, md: 6 }}>
              <VStack align="stretch" spacing={3}>
                <Heading
                  as="h2"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  lineHeight="1.4"
                >
                  <NextLink href={`/articles/${article.slug}`}>
                    <Box as="span" _hover={{ color: 'brand.700' }}>
                      {article.title}
                    </Box>
                  </NextLink>
                </Heading>
                <Text color="ink.600" lineHeight="1.75">
                  {article.summary}
                </Text>
                <HStack spacing={2} wrap="wrap">
                  {article.tags.map((item) => (
                    <Badge key={item.id} colorScheme="brand">
                      {item.name}
                    </Badge>
                  ))}
                </HStack>
                <ArticleMeta
                  publishedAt={article.publishedAt}
                  likeCount={article.likeCount}
                  commentCount={article.commentCount}
                />
              </VStack>
            </CardBody>
          </Card>
        ))}
        {!items.length ? (
          <Box layerStyle="subtleSurface" py={16} px={5} textAlign="center">
            <Heading fontSize="lg">暂无文章</Heading>
            <Text color="ink.500" mt={2}>
              请切换标签或稍后再来查看。
            </Text>
          </Box>
        ) : null}
      </Stack>

      {pages > 1 ? (
        <Flex mt={8} justify="space-between" align="center">
          {page <= 1 ? (
            <Button variant="outline" isDisabled>
              上一页
            </Button>
          ) : (
            <NextLink href={pageHref(page - 1)}>
              <Button as="span" variant="outline">
                上一页
              </Button>
            </NextLink>
          )}
          <Text color="ink.500" fontSize="sm">
            第 {page} / {pages} 页
          </Text>
          {page >= pages ? (
            <Button variant="outline" isDisabled>
              下一页
            </Button>
          ) : (
            <NextLink href={pageHref(page + 1)}>
              <Button as="span" variant="outline">
                下一页
              </Button>
            </NextLink>
          )}
        </Flex>
      ) : null}
    </Container>
  );
}
