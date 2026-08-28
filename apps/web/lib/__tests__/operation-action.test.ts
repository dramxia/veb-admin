import { describe, expect, it } from 'vitest';
import {
  getOperationActionLabel,
  OperationAction,
} from '@/enums/operation-action';

describe('getOperationActionLabel', () => {
  it('returns the localized label for a known operation action', () => {
    expect(getOperationActionLabel(OperationAction.BlogArticleCreate)).toBe(
      '新建文章',
    );
  });

  it('keeps an unknown operation action visible', () => {
    expect(getOperationActionLabel('unknown.action')).toBe('unknown.action');
  });
});
