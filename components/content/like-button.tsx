'use client';

import { Alert, AlertIcon, Button, Icon, Stack, Text } from '@chakra-ui/react';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/client-api';

type LikeState = { liked: boolean; likeCount: number };

export function LikeButton({
  slug,
  initialCount,
}: {
  slug: string;
  initialCount: number;
}) {
  const [state, setState] = useState<LikeState>({
    liked: false,
    likeCount: initialCount,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    requestJson<LikeState>(
      `/api/public/articles/${encodeURIComponent(slug)}/like`,
    )
      .then(setState)
      .catch(() => undefined);
  }, [slug]);

  async function toggleLike() {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      setState(
        await requestJson<LikeState>(
          `/api/public/articles/${encodeURIComponent(slug)}/like`,
          {
            method: state.liked ? 'DELETE' : 'PUT',
          },
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack align="stretch" spacing={3}>
      <Button
        alignSelf="flex-start"
        colorScheme={state.liked ? 'red' : 'brand'}
        variant={state.liked ? 'solid' : 'outline'}
        isLoading={loading}
        aria-pressed={state.liked}
        onClick={toggleLike}
        leftIcon={
          <Icon as={Heart} fill={state.liked ? 'currentColor' : 'none'} />
        }
      >
        {state.liked ? '已喜欢' : '喜欢'} · {state.likeCount}
      </Button>
      {error ? (
        <Alert status="error" aria-live="polite">
          <AlertIcon />
          <Text fontSize="sm">{error}</Text>
        </Alert>
      ) : null}
    </Stack>
  );
}
