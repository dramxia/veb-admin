import { permanentRedirect } from 'next/navigation';

export default function LegacyProfilePage() {
  permanentRedirect('/profile');
}
