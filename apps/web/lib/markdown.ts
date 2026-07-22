const UNSAFE_PROTOCOL = /^(?:javascript|vbscript|data):/i;

export function sanitizeMarkdownUrl(value: string) {
  const normalized = value
    .trim()
    .replace(/[\u0000-\u001f\u007f-\u009f\s]+/g, '');
  return UNSAFE_PROTOCOL.test(normalized) ? '' : value;
}
