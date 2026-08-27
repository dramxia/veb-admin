'use client';

import { Alert, Button, Stack, Text } from '@chakra-ui/react';
import type { LikeState } from '@veb/api-contracts';
import { useEffect, useState } from 'react';
import { LikesIcon } from '@/assets/icons';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { LocalIcon } from '@/components/common/local-icon';
import { requestJson } from '@/lib/client-api';

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
      `/api/v1/blog/articles/${encodeURIComponent(slug)}/like`,
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
          `/api/v1/blog/articles/${encodeURIComponent(slug)}/like`,
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
          <LocalIcon
            icon={LikesIcon}
            fill={state.liked ? 'currentColor' : 'none'}
          />
        }
      >
        {state.liked ? '已喜欢' : '喜欢'} · {state.likeCount}
      </Button>
      {error ? (
        <Alert status="error" aria-live="polite">
          <AlertStatusIcon status="error" />
          <Text fontSize="sm">{error}</Text>
        </Alert>
      ) : null}
    </Stack>
  );
}
