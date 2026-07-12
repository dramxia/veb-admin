import { Box } from '@chakra-ui/react';
import rehypeSanitize from 'rehype-sanitize';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeMarkdownUrl } from '@/lib/markdown';

export function MarkdownContent({ children }: { children: string }) {
  return (
    <Box
      color="ink.800"
      fontSize={{ base: 'md', md: '17px' }}
      lineHeight="1.85"
      sx={{
        '& > *:first-of-type': { mt: 0 },
        '& > *:last-child': { mb: 0 },
        'h1, h2, h3, h4': {
          color: 'ink.900',
          fontWeight: 800,
          lineHeight: 1.4,
          mb: 3,
          mt: 8,
        },
        h1: { fontSize: '2xl' },
        h2: {
          borderBottom: '1px solid',
          borderColor: 'borderSubtle',
          fontSize: 'xl',
          pb: 2,
        },
        h3: { fontSize: 'lg' },
        'p, ul, ol, blockquote, pre, table': { mb: 5 },
        'ul, ol': { ps: 6 },
        li: { mb: 1 },
        a: {
          color: 'brand.700',
          fontWeight: 600,
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
        },
        blockquote: {
          bg: 'brand.50',
          borderLeft: '4px solid',
          borderColor: 'brand.300',
          color: 'ink.700',
          px: 4,
          py: 3,
        },
        code: {
          bg: 'ink.100',
          borderRadius: '6px',
          color: 'ink.800',
          fontSize: '0.9em',
          px: 1.5,
          py: 0.5,
        },
        pre: {
          bg: 'ink.900',
          borderRadius: '12px',
          color: 'white',
          overflowX: 'auto',
          p: 4,
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
          borderColor: 'ink.200',
          px: 3,
          py: 2,
          textAlign: 'left',
        },
        th: { bg: 'ink.50' },
        img: { borderRadius: '12px', maxW: 'full' },
        hr: { borderColor: 'ink.200', my: 8 },
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
