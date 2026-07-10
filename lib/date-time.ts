/** 将 ISO 时间转换为 datetime-local 控件使用的本地时间字符串。 */
export function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localTime = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localTime.toISOString().slice(0, 16);
}

/** 将 datetime-local 的本地时间转换为不含歧义的 UTC ISO 时间。 */
export function toIsoDateTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}
