import languages from './translation/translation';
import { useLocale } from './Localization';

const normaliseKey = (key) =>
  String(key)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const fallbackLabel = (key) =>
  normaliseKey(key)
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const useLanguage = () => {
  const { language } = useLocale();
  const translate = (value) => {
    const key = normaliseKey(value);
    return languages[language]?.[key] || languages.en_us?.[key] || fallbackLabel(value);
  };

  return translate;
};

export default useLanguage;
