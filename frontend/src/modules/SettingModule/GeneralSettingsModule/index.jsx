import SetingsSection from '../components/SetingsSection';
import UpdateSettingModule from '../components/UpdateSettingModule';
import GeneralSettingForm from './forms/GeneralSettingForm';
import useLanguage from '@/locale/useLanguage';
import { useLocale } from '@/locale/Localization';

export default function GeneralSettingsModule({ config }) {
  const translate = useLanguage();
  const { setLanguage } = useLocale();
  return (
    <UpdateSettingModule
      config={config}
      onSubmitSuccess={({ invoice_app_language: language }) => setLanguage(language)}
    >
      <SetingsSection
        title={translate('App Settings')}
        description={translate('Update your app configuration')}
      >
        <GeneralSettingForm />
      </SetingsSection>
    </UpdateSettingModule>
  );
}
