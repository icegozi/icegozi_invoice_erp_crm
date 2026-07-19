import { ConfigProvider } from 'antd';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import antdLocale from './antdLocale';
import languages from './translation/translation';

const LANGUAGE_STORAGE_KEY = 'invoicecrm_language';
const DEFAULT_LANGUAGE = 'vi_vn';

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

export const useLocale = () => useContext(LanguageContext);

const getInitialLanguage = () => {
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedLanguage && languages[storedLanguage] ? storedLanguage : DEFAULT_LANGUAGE;
};

export default function Localization({ children }) {
  const [language, setCurrentLanguage] = useState(getInitialLanguage);

  const setLanguage = (nextLanguage) => {
    if (!languages[nextLanguage]) return;
    setCurrentLanguage(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language === 'vi_vn' ? 'vi' : 'en';
  }, [language]);

  const localeValue = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={localeValue}>
      <ConfigProvider
        locale={antdLocale[language]}
        theme={{
          token: {
            colorPrimary: '#339393',
            colorLink: '#1640D6',
            borderRadius: 0,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </LanguageContext.Provider>
  );
}
