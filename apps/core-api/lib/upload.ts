import nodePath from 'node:path';
import { ParamError } from './errors';
import { t } from './i18n';

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

type FilePolicy = {
  mime: string;
  signature: (buffer: Buffer) => boolean;
};

function startsWith(buffer: Buffer, signature: readonly number[]) {
  return signature.every((value, index) => buffer[index] === value);
}

function isPlainText(buffer: Buffer) {
  if (buffer.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

const jpeg = (buffer: Buffer) => startsWith(buffer, [0xff, 0xd8, 0xff]);
const png = (buffer: Buffer) =>
  startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const gif = (buffer: Buffer) =>
  buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
  buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
const webp = (buffer: Buffer) =>
  buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
  buffer.subarray(8, 12).toString('ascii') === 'WEBP';
const pdf = (buffer: Buffer) =>
  buffer.subarray(0, 5).toString('ascii') === '%PDF-';
const ole = (buffer: Buffer) =>
  startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const zip = (buffer: Buffer) =>
  startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
  startsWith(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
  startsWith(buffer, [0x50, 0x4b, 0x07, 0x08]);

const policies = new Map<string, FilePolicy>([
  ['.jpg', { mime: 'image/jpeg', signature: jpeg }],
  ['.jpeg', { mime: 'image/jpeg', signature: jpeg }],
  ['.png', { mime: 'image/png', signature: png }],
  ['.gif', { mime: 'image/gif', signature: gif }],
  ['.webp', { mime: 'image/webp', signature: webp }],
  [
    '.pdf',
    {
      mime: 'application/pdf',
      signature: pdf,
    },
  ],
  [
    '.txt',
    {
      mime: 'text/plain',
      signature: isPlainText,
    },
  ],
  [
    '.csv',
    {
      mime: 'text/csv',
      signature: isPlainText,
    },
  ],
  [
    '.md',
    {
      mime: 'text/markdown',
      signature: isPlainText,
    },
  ],
  [
    '.doc',
    {
      mime: 'application/msword',
      signature: ole,
    },
  ],
  [
    '.xls',
    {
      mime: 'application/vnd.ms-excel',
      signature: ole,
    },
  ],
  [
    '.ppt',
    {
      mime: 'application/vnd.ms-powerpoint',
      signature: ole,
    },
  ],
  [
    '.docx',
    {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      signature: zip,
    },
  ],
  [
    '.xlsx',
    {
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      signature: zip,
    },
  ],
  [
    '.pptx',
    {
      mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      signature: zip,
    },
  ],
]);

const inlinePreviewMimes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'text/markdown',
]);

export function isInlinePreviewMime(mime: string) {
  return inlinePreviewMimes.has(mime);
}

export function sanitizeFileName(name: string) {
  const base = name.split(/[\\/]/).pop()?.trim() || 'file';
  return base.replace(/[\u0000-\u001f]/g, '').slice(0, 180) || 'file';
}

export async function prepareUploadFile(file: globalThis.File) {
  const originalName = sanitizeFileName(file.name);
  const ext = nodePath.extname(originalName).toLowerCase();
  const policy = policies.get(ext);

  if (file.size <= 0) throw new ParamError(t('upload.empty'));
  if (file.size > MAX_UPLOAD_SIZE) throw new ParamError(t('upload.tooLarge'));
  if (!policy) throw new ParamError(t('upload.unsupported'));

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!policy.signature(buffer)) throw new ParamError(t('upload.unsupported'));
  return {
    buffer,
    originalName,
    mime: policy.mime,
    size: file.size,
  };
}
