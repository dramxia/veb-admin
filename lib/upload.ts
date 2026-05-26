import nodePath from 'node:path';
import { ParamError } from './errors';
import { t } from './i18n';

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

const dangerousExts = new Set([
  '.exe', '.bat', '.cmd', '.com', '.scr', '.msi', '.dll', '.sh', '.bash', '.zsh',
  '.ps1', '.jar', '.php', '.asp', '.aspx', '.jsp', '.js', '.mjs', '.vbs', '.reg',
]);

const officeMimes = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

function isAllowedMime(mime: string) {
  return mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('text/') || officeMimes.has(mime);
}

export function sanitizeFileName(name: string) {
  const base = name.split(/[\\/]/).pop()?.trim() || 'file';
  return base.replace(/[\u0000-\u001f]/g, '').slice(0, 180) || 'file';
}

export async function prepareUploadFile(file: globalThis.File) {
  const originalName = sanitizeFileName(file.name);
  const ext = nodePath.extname(originalName).toLowerCase();
  const mime = file.type || 'application/octet-stream';

  if (file.size <= 0) throw new ParamError(t('upload.empty'));
  if (file.size > MAX_UPLOAD_SIZE) throw new ParamError(t('upload.tooLarge'));
  if (dangerousExts.has(ext)) throw new ParamError(t('upload.dangerous'));
  if (!isAllowedMime(mime)) throw new ParamError(t('upload.unsupported'));

  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, originalName, mime, size: file.size };
}
