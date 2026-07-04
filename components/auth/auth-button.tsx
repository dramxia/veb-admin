'use client';

import { Button, Tooltip, type ButtonProps } from '@chakra-ui/react';
import type { ReactElement, ReactNode } from 'react';
import { Auth } from './auth';
import type { PermissionCode } from './use-has-permission';

type AuthButtonProps = ButtonProps & {
  code: PermissionCode;
  fallback?: ReactNode;
  icon?: ReactElement;
  tooltip?: string;
  intent?: 'primary' | 'neutral' | 'danger';
};

export function AuthButton({
  code,
  fallback = null,
  icon,
  tooltip,
  intent = 'primary',
  children,
  colorScheme,
  variant,
  'aria-label': ariaLabel,
  ...buttonProps
}: AuthButtonProps) {
  const resolvedVariant =
    variant ?? (intent === 'danger' || intent === 'neutral' ? 'outline' : 'solid');
  const button = (
    <Button
      colorScheme={colorScheme ?? (intent === 'danger' ? 'red' : 'brand')}
      variant={resolvedVariant}
      color={intent === 'danger' && resolvedVariant !== 'solid' ? 'red.600' : undefined}
      leftIcon={children ? icon : undefined}
      aria-label={ariaLabel ?? tooltip}
      px={children ? undefined : 2.5}
      {...buttonProps}
    >
      {children ?? icon}
    </Button>
  );

  return (
    <Auth code={code} fallback={fallback}>
      {tooltip ? (
        <Tooltip label={tooltip} hasArrow>
          {button}
        </Tooltip>
      ) : (
        button
      )}
    </Auth>
  );
}
