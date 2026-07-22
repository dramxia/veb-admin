'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Stack,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { useRef } from 'react';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  error?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: 'danger' | 'primary';
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  error,
  confirmLabel = '确认',
  cancelLabel = '取消',
  intent = 'primary',
  isLoading,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader>{title}</AlertDialogHeader>
          <AlertDialogBody>
            <Stack spacing={4}>
              <Box>{description}</Box>
              {error ? (
                <Alert status="error" aria-live="polite">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </Stack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              variant="ghost"
              onClick={onClose}
              isDisabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              colorScheme={intent === 'danger' ? 'red' : 'brand'}
              variant="solid"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
