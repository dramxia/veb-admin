const LOCAL_ORIGIN = 'https://veb.local';

/**
 * 只允许站内绝对路径，避免登录回跳被利用为开放重定向。
 */
export function getSafeInternalPath(
  value: string | null | undefined,
  fallback = '/admin',
) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  if (value.includes('\\')) return fallback;

  try {
    const url = new URL(value, LOCAL_ORIGIN);
    if (url.origin !== LOCAL_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
