import { redirect } from 'next/navigation';
import { DEFAULT_AUTHENTICATED_PATH } from '@/components/layout/app-modules';

export default function WorkspaceIndexPage() {
  redirect(DEFAULT_AUTHENTICATED_PATH);
}
