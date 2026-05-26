'use client';

import { Button, type ButtonProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { Auth } from './auth';
import type { PermissionCode } from './use-has-permission';

type AuthButtonProps = ButtonProps & {
  code: PermissionCode;
  fallback?: ReactNode;
};

export function AuthButton({ code, fallback = null, ...buttonProps }: AuthButtonProps) {
  return (
    <Auth code={code} fallback={fallback}>
      <Button {...buttonProps} />
    </Auth>
  );
}
