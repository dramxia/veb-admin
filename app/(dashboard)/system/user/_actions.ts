'use client';

import { requestJson } from '@/lib/client-api';

export function getUsers() {
  return requestJson('/api/system/users');
}
