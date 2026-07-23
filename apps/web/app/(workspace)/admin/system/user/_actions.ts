'use client';

import { requestJson } from '@/lib/client-api';

export function getUsers() {
  return requestJson('/api/v1/system/users');
}
