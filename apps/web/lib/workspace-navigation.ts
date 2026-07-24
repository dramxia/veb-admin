import 'server-only';

import { cache } from 'react';
import type { PageAccessDto, UserNavigation } from '@veb/api-contracts';
import { isServerApiError, requestVebPage } from './server-api';

export const getWorkspaceNavigation = cache(() =>
  requestVebPage<UserNavigation>('/api/v1/navigation'),
);

export const getWorkspacePage = cache(async (pathname: string) => {
  const query = new URLSearchParams({ path: pathname });
  try {
    return await requestVebPage<PageAccessDto>(
      `/api/v1/navigation/page?${query.toString()}`,
    );
  } catch (error) {
    if (isServerApiError(error, 404)) return null;
    throw error;
  }
});
