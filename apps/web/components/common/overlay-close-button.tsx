import { IconButton, type IconButtonProps } from '@chakra-ui/react';
import { CloseIcon } from '@/assets/icons';
import { LocalIcon } from './local-icon';

type OverlayCloseButtonProps = Omit<IconButtonProps, 'icon'>;

export function OverlayCloseButton(props: OverlayCloseButtonProps) {
  return (
    <IconButton
      position="absolute"
      insetEnd={2}
      top={2}
      zIndex={1}
      size="sm"
      variant="ghost"
      icon={<LocalIcon icon={CloseIcon} />}
      {...props}
    />
  );
}
