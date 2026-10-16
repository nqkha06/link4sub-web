"use client";

import * as React from "react";

import {
  defaultLocale,
  type AppLocale,
} from "@/i18n/config";

import { getPublicLanguages } from "../api/languages.client";

export type UiLanguage = {
  locale: AppLocale;
  label: string;
  /** Mã quốc gia ISO alpha-2 của lá cờ, ví dụ "VN". */
  flag: string | null;
};

const fallbackLanguages: UiLanguage[] = [
  { locale: "vi", label: "Tiếng Việt", flag: "VN" },
  { locale: "en", label: "English", flag: "US" },
  { locale: "id", label: "Bahasa Indonesia", flag: "ID" },
];

export function useUiLanguages() {
  const [items, setItems] =
    React.useState<UiLanguage[]>(fallbackLanguages);
  const [resolvedDefaultLocale, setResolvedDefaultLocale] =
    React.useState<AppLocale>(defaultLocale);

  React.useEffect(() => {
    let active = true;
    void getPublicLanguages()
      .then((result) => {
        if (!active) return;
        const available = result.data
          .map((language) => ({
            locale: language.locale,
            label: language.nativeName || language.name,
            flag: language.flag,
          }));
        if (available.length) {
          setItems(available);
          const apiDefault = available.find(
            ({ locale }) => locale === result.meta.defaultLocale,
          )?.locale;
          setResolvedDefaultLocale(apiDefault ?? available[0].locale);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return {
    items,
    defaultLocale: resolvedDefaultLocale,
  };
}
