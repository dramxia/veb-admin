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
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
      <AlertDialogOverlay bg="rgba(23, 33, 29, 0.24)" backdropFilter="blur(16px)">
        <AlertDialogContent
          rounded="3xl"
          borderWidth="1px"
          borderColor="rgba(255,255,255,0.78)"
          bg="rgba(255,255,255,0.82)"
          boxShadow="glass"
          sx={{
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
        >
          <AlertDialogHeader color="surface.900" fontWeight="900">
            {title}
          </AlertDialogHeader>
          <AlertDialogBody color="surface.600" lineHeight="1.8">
            {description}
          </AlertDialogBody>
          <AlertDialogFooter gap={3}>
            <Button ref={cancelRef} variant="ghost" onClick={onClose} isDisabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              colorScheme={intent === 'danger' ? 'red' : 'brand'}
              variant="solid"
              bg={intent === 'danger' ? 'red.500' : undefined}
              boxShadow={intent === 'danger' ? '0 14px 28px rgba(229, 62, 62, 0.22)' : undefined}
              _hover={
                intent === 'danger'
                  ? {
                      bg: 'red.600',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 18px 38px rgba(229, 62, 62, 0.28)',
                    }
                  : undefined
              }
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
