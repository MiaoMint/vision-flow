import { i18n } from "@lingui/core";
import { GetUserPreference, SetUserPreference } from "../wailsjs/go/app/Service";

export const locales = {
  en: "English",
  "zh-CN": "简体中文",
};

const LOCALE_STORAGE_KEY = "app-locale";

/**
 * Get the default locale based on saved preference or system language
 */
async function getDefaultLocale(): Promise<string> {
  // First check if user has saved a preference in database
  try {
    const savedLocale = await GetUserPreference(LOCALE_STORAGE_KEY);
    if (savedLocale && savedLocale in locales) {
      return savedLocale;
    }
  } catch (error) {
    console.warn("Failed to get user preference from database:", error);
  }

  // Fall back to system language
  const systemLang = navigator.language || navigator.languages?.[0] || "en";
  
  // Map system language codes to our supported locales
  if (systemLang.startsWith("zh")) {
    return "zh-CN";
  }
  
  return "en";
}

export const defaultLocale = await getDefaultLocale();

/**
 * We do a dynamic import of just the catalog that we need
 * @param locale any locale string
 */
export async function dynamicActivate(locale: string) {
  const { messages } = await import(
    `./locales/${locale}/messages.po`
  );
  i18n.load(locale, messages);
  i18n.activate(locale);
  
  // Save user's locale preference to database
  try {
    await SetUserPreference(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.error("Failed to save user preference to database:", error);
  }
}
