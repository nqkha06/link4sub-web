/**
 * Fallback message for API clients that run outside React (no access to `useTranslations`).
 * It follows the active locale, which the root layout exposes as `<html lang>`.
 */
const MESSAGES: Record<string, string> = {
  vi: "Yêu cầu không thành công.",
  en: "Request failed.",
  id: "Permintaan gagal.",
};

export function requestFailedMessage(): string {
  const lang =
    typeof document !== "undefined"
      ? document.documentElement.lang.toLowerCase().split("-")[0]
      : "";
  return MESSAGES[lang] ?? MESSAGES.en;
}
