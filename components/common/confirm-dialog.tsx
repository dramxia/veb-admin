'use client';

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { useRef } from 'react';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
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
      <AlertDialogOverlay
        bg="rgba(248, 251, 255, 0.62)"
        backdropFilter="blur(16px)"
      >
        <AlertDialogContent
          rounded="3xl"
          borderWidth="1px"
          borderColor="rgba(255,255,255,0.78)"
          bg="rgba(255,255,255,0.90)"
          boxShadow="glass"
          sx={{
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
        >
          <AlertDialogHeader color="ink.900" fontWeight="900">
            {title}
          </AlertDialogHeader>
          <AlertDialogBody color="ink.600" lineHeight="1.8">
            {description}
          </AlertDialogBody>
          <AlertDialogFooter gap={3}>
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
