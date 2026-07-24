import { permanentRedirect } from 'next/navigation';

export default function PermissionPage() {
  permanentRedirect('/admin/system/menu');
  return null;
}
