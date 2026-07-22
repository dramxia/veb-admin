import { enMessages } from '@/messages/en';
import { zhMessages, type MessageKey } from '@/messages/zh';

export type Locale = 'zh' | 'en';

const dictionaries = {
  zh: zhMessages,
  en: enMessages,
} satisfies Record<Locale, Record<MessageKey, string>>;

let currentLocale: Locale = 'zh';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale() {
  return currentLocale;
}

export function t(key: MessageKey, locale: Locale = currentLocale) {
  return dictionaries[locale][key] ?? dictionaries.zh[key] ?? key;
}
