import { Box } from '@chakra-ui/react';
import rehypeSanitize from 'rehype-sanitize';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeMarkdownUrl } from '@/lib/markdown';

type MarkdownContentProps = {
  children: string;
  variant?: 'article' | 'compact';
};

export function MarkdownContent({
  children,
  variant = 'article',
}: MarkdownContentProps) {
  const isCompact = variant === 'compact';

  return (
    <Box
      color={isCompact ? 'gray.800' : 'ink.800'}
      fontSize={isCompact ? '15px' : { base: 'md', md: '17px' }}
      lineHeight={isCompact ? '1.65' : '1.85'}
      sx={{
        '& > *:first-of-type': { mt: 0 },
        '& > *:last-child': { mb: 0 },
        'h1, h2, h3, h4': {
          color: isCompact ? 'gray.900' : 'ink.900',
          fontWeight: isCompact ? 700 : 800,
          lineHeight: isCompact ? 1.35 : 1.4,
          mb: isCompact ? 2 : 3,
          mt: isCompact ? 5 : 8,
        },
        h1: { fontSize: isCompact ? 'xl' : '2xl' },
        h2: {
          borderBottom: '1px solid',
          borderColor: isCompact ? 'gray.200' : 'borderSubtle',
          fontSize: isCompact ? 'lg' : 'xl',
          pb: isCompact ? 1.5 : 2,
        },
        h3: { fontSize: isCompact ? 'md' : 'lg' },
        h4: { fontSize: isCompact ? 'sm' : undefined },
        'p, ul, ol, blockquote, pre, table': { mb: isCompact ? 3 : 5 },
        p: { whiteSpace: 'pre-wrap' },
        'ul, ol': { ps: isCompact ? 5 : 6 },
        li: { mb: isCompact ? 0.5 : 1, ps: isCompact ? 0.5 : 1 },
        'li > p': { mb: isCompact ? 1 : 2 },
        a: {
          color: isCompact ? 'gray.900' : 'brand.700',
          fontWeight: isCompact ? 500 : 600,
          textDecoration: 'underline',
          textUnderlineOffset: isCompact ? '2px' : '3px',
        },
        blockquote: {
          bg: isCompact ? 'gray.50' : 'brand.50',
          borderLeft: isCompact ? '3px solid' : '4px solid',
          borderColor: isCompact ? 'gray.400' : 'brand.300',
          borderRadius: isCompact ? 0 : '0 8px 8px 0',
          color: isCompact ? 'gray.700' : 'ink.700',
          px: isCompact ? 3 : 4,
          py: isCompact ? 2 : 3,
        },
        'blockquote > *:first-of-type': { mt: 0 },
        'blockquote > *:last-child': { mb: 0 },
        code: {
          bg: isCompact ? 'gray.100' : 'ink.100',
          borderRadius: isCompact ? '3px' : '6px',
          color: isCompact ? 'gray.900' : 'ink.800',
          fontSize: '0.9em',
          px: isCompact ? 1 : 1.5,
          py: isCompact ? 0.25 : 0.5,
        },
        pre: {
          bg: isCompact ? 'gray.900' : 'ink.900',
          borderRadius: isCompact ? '4px' : '8px',
          color: 'white',
          overflowX: 'auto',
          p: isCompact ? 3 : 4,
        },
        'pre code': { bg: 'transparent', color: 'inherit', p: 0 },
        table: {
          borderCollapse: 'collapse',
          display: 'block',
          overflowX: 'auto',
          w: 'full',
        },
        'th, td': {
          border: '1px solid',
          borderColor: isCompact ? 'gray.300' : 'ink.200',
          px: isCompact ? 2 : 3,
          py: isCompact ? 1 : 2,
          textAlign: 'left',
        },
        th: { bg: isCompact ? 'gray.100' : 'ink.50' },
        img: {
          borderRadius: isCompact ? '4px' : '8px',
          h: 'auto',
          maxW: 'full',
        },
        hr: {
          borderColor: isCompact ? 'gray.300' : 'ink.200',
          my: isCompact ? 5 : 8,
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        urlTransform={sanitizeMarkdownUrl}
      >
        {children}
      </ReactMarkdown>
    </Box>
  );
}
