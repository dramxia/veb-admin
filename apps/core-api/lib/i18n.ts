const messages = {
  'error.param': '请求参数错误',
  'error.unauthorized': '请先登录',
  'error.forbidden': '无权执行此操作',
  'error.notFound': '资源不存在',
  'error.conflict': '资源冲突',
  'error.rateLimited': '请求过于频繁',
  'error.server': '服务器内部错误',
  'error.unknown': '未知错误',
  'error.jsonRequired': '请求体必须是有效的 JSON',
  'upload.required': '请选择要上传的文件',
  'upload.empty': '不能上传空文件',
  'upload.tooLarge': '文件大小不能超过 20 MB',
  'upload.dangerous': '不允许上传该类型的文件',
  'upload.unsupported': '不支持该文件类型',
} as const;

export type MessageKey = keyof typeof messages;

export function t(key: MessageKey): string {
  return messages[key];
}
