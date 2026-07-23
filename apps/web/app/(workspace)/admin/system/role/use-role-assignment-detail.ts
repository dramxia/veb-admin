'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requestJson } from '@/lib/client-api';

type DetailLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

type DetailLoadState = {
  context: symbol | null;
  error: string | null;
  roleId: string | null;
  status: DetailLoadStatus;
};

type UseRoleAssignmentDetailOptions<TDetail extends { id: string }> = {
  errorFallback: string;
  getSelectedIds: (detail: TDetail) => string[];
  isOpen: boolean;
  roleId: string | null;
};

const IDLE_STATE: DetailLoadState = {
  context: null,
  error: null,
  roleId: null,
  status: 'idle',
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * 将勾选值与成功加载的角色详情绑定，避免过期响应或旧角色选择串写。
 */
export function useRoleAssignmentDetail<TDetail extends { id: string }>({
  errorFallback,
  getSelectedIds,
  isOpen,
  roleId,
}: UseRoleAssignmentDetailOptions<TDetail>) {
  const requestContext = useMemo(
    () =>
      Symbol(
        `role-assignment-detail:${isOpen ? 'open' : 'closed'}:${roleId ?? 'none'}`,
      ),
    [isOpen, roleId],
  );
  const [loadState, setLoadState] = useState<DetailLoadState>(IDLE_STATE);
  const [requestVersion, setRequestVersion] = useState(0);
  const [storedSelectedIds, setStoredSelectedIds] = useState<string[]>([]);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    const requestSequence = ++requestSequenceRef.current;

    // 请求一开始就清空旧角色选择，不能等待新详情返回后再覆盖。
    setStoredSelectedIds([]);

    if (!isOpen || !roleId) {
      setLoadState(IDLE_STATE);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoadState({
      context: requestContext,
      error: null,
      roleId,
      status: 'loading',
    });

    requestJson<TDetail>(`/api/v1/system/roles/${roleId}`, {
      signal: controller.signal,
    })
      .then((detail) => {
        if (!active || requestSequenceRef.current !== requestSequence) return;
        if (detail.id !== roleId) {
          throw new Error('角色详情响应与当前角色不匹配，请重新加载');
        }

        const selectedIds = getSelectedIds(detail);
        if (!selectedIds.every((id) => typeof id === 'string' && id)) {
          throw new Error('角色详情数据异常，请重新加载');
        }

        setStoredSelectedIds([...new Set(selectedIds)]);
        setLoadState({
          context: requestContext,
          error: null,
          roleId,
          status: 'ready',
        });
      })
      .catch((error) => {
        if (!active || requestSequenceRef.current !== requestSequence) return;
        setStoredSelectedIds([]);
        setLoadState({
          context: requestContext,
          error: getErrorMessage(error, errorFallback),
          roleId,
          status: 'error',
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    errorFallback,
    getSelectedIds,
    isOpen,
    requestContext,
    requestVersion,
    roleId,
  ]);

  const status: DetailLoadStatus =
    !isOpen || !roleId
      ? 'idle'
      : loadState.context === requestContext && loadState.roleId === roleId
        ? loadState.status
        : 'loading';
  const isReady = status === 'ready';

  const retry = useCallback(() => {
    if (!isOpen || !roleId) return;
    setStoredSelectedIds([]);
    setLoadState({
      context: requestContext,
      error: null,
      roleId,
      status: 'loading',
    });
    setRequestVersion((version) => version + 1);
  }, [isOpen, requestContext, roleId]);

  return {
    error: status === 'error' ? loadState.error : null,
    isReady,
    retry,
    selectedIds: isReady ? storedSelectedIds : [],
    setSelectedIds: setStoredSelectedIds,
    status,
  };
}
