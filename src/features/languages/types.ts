import type { PublicationStatus } from "@/types/publication-status";

export type Language = {
  id: number;
  name: string;
  nativeName: string | null;
  locale: string;
  code: string;
  regional: string | null;
  flag: string | null;
  isDefault: boolean;
  status: PublicationStatus;
  sortOrder: number;
  isRtl: boolean;
  uiTranslation?: {
    translatedKeys: number;
    catalogSize: number;
    version: number;
    updatedAt: string | null;
  };
};

export type LanguagePayload = Omit<Language, "id" | "uiTranslation">;

export type LanguagesResponse = Omit<
  import("@/contracts").PaginatedApiResponse<Language>,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    defaultLocale: string | null;
  };
};

export type PublicLanguagesResponse = Omit<
  import("@/contracts").PaginatedApiResponse<
    Omit<Language, "status"> & {
      status?: never;
    }
  >,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    defaultLocale: string | null;
  };
};

export type UiTranslationsResponse = {
  language: Language;
  messages: Record<string, string>;
  translatedKeys: number;
  catalogSize: number;
  version: number;
  updatedAt: string | null;
};
