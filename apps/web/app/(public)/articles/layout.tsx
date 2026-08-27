import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { PublicArticleHeader } from '@/components/blog/public-article-header';

export default function ArticlesLayout({ children }: { children: ReactNode }) {
  return (
    <Box minH="100vh">
      <PublicArticleHeader />
      {children}
    </Box>
  );
}
