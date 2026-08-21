import {
  ErrorStatusIcon,
  InfoStatusIcon,
  SuccessStatusIcon,
  WarningStatusIcon,
} from '@/assets/icons';
import { LocalIcon, type LocalIconProps } from './local-icon';

export type AlertStatus = 'error' | 'info' | 'success' | 'warning';

const statusMeta = {
  error: { color: 'statusDanger', icon: ErrorStatusIcon },
  info: { color: 'statusInfo', icon: InfoStatusIcon },
  success: { color: 'statusSuccess', icon: SuccessStatusIcon },
  warning: { color: 'statusWarning', icon: WarningStatusIcon },
} satisfies Record<
  AlertStatus,
  { color: string; icon: typeof ErrorStatusIcon }
>;

type AlertStatusIconProps = Omit<LocalIconProps, 'color' | 'icon'> & {
  status: AlertStatus;
};

export function AlertStatusIcon({ status, ...props }: AlertStatusIconProps) {
  const meta = statusMeta[status];

  return <LocalIcon icon={meta.icon} color={meta.color} me={3} {...props} />;
}
