import 'server-only';

import { cache } from 'react';
import type { PageAccessDto, UserNavigation } from '@veb/api-contracts';
import { isServerApiError, requestCorePage } from './server-api';

export const getWorkspaceNavigation = cache(() =>
  requestCorePage<UserNavigation>('/api/v1/navigation'),
);

export const getWorkspacePage = cache(async (pathname: string) => {
  const query = new URLSearchParams({ path: pathname });
  try {
    return await requestCorePage<PageAccessDto>(
      `/api/v1/navigation/page?${query.toString()}`,
    );
  } catch (error) {
    if (isServerApiError(error, 404)) return null;
    throw error;
  }
});
