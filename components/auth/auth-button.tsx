'use client';

import {
  Button,
  IconButton,
  Tooltip,
  type ButtonProps,
} from '@chakra-ui/react';
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
    variant ??
    (intent === 'danger' || intent === 'neutral' ? 'outline' : 'solid');
  const resolvedColorScheme =
    colorScheme ?? (intent === 'danger' ? 'red' : 'brand');
  const resolvedColor =
    intent === 'danger' && resolvedVariant !== 'solid' ? 'red.600' : undefined;
  const resolvedAriaLabel = ariaLabel ?? tooltip;

  const button = children ? (
    <Button
      colorScheme={resolvedColorScheme}
      variant={resolvedVariant}
      color={resolvedColor}
      leftIcon={icon}
      aria-label={resolvedAriaLabel}
      {...buttonProps}
    >
      {children}
    </Button>
  ) : icon && resolvedAriaLabel ? (
    <IconButton
      colorScheme={resolvedColorScheme}
      variant={resolvedVariant}
      color={resolvedColor}
      aria-label={resolvedAriaLabel}
      icon={icon}
      {...buttonProps}
    />
  ) : null;

  if (!button) return null;

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
