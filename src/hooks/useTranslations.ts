import { useLocale } from "@/contexts/AppProviders";
import { translations, type Locale } from "@/lib/translations";

export const useTranslations = () => {
  const { locale } = useLocale();
  return translations[locale];
};
