import { HStack, Text } from '@chakra-ui/react';
import { CalendarDays, Heart, MessageCircle } from 'lucide-react';

function formatDate(value: Date | string | null) {
  if (!value) return '未发布';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

export function ArticleMeta({
  publishedAt,
  likeCount,
  commentCount,
}: {
  publishedAt: Date | string | null;
  likeCount: number;
  commentCount: number;
}) {
  return (
    <HStack
      color="ink.500"
      fontSize="sm"
      spacing={{ base: 3, md: 5 }}
      wrap="wrap"
    >
      <HStack spacing={1.5}>
        <CalendarDays size={16} aria-hidden />
        <Text>{formatDate(publishedAt)}</Text>
      </HStack>
      <HStack spacing={1.5}>
        <Heart size={16} aria-hidden />
        <Text>{likeCount}</Text>
      </HStack>
      <HStack spacing={1.5}>
        <MessageCircle size={16} aria-hidden />
        <Text>{commentCount}</Text>
      </HStack>
    </HStack>
  );
}
