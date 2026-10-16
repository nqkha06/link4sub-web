export const cookieConsentName = "l4s_cookie_consent";

export type CookieConsentChoice = "all" | "necessary";

export function isCookieConsentChoice(value: string | undefined): value is CookieConsentChoice {
  return value === "all" || value === "necessary";
}
