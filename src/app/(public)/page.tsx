import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { LandingFloatingControls } from "@/components/landing-v2/landing-floating-controls";
import { Link4SubLandingPage } from "@/components/landing-v2/landing-page";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getServerUser } from "@/lib/auth/server-session";
import { cookieConsentName, isCookieConsentChoice } from "@/lib/cookie-consent";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const title = settings.siteTagline
    ? `${settings.siteName} — ${settings.siteTagline}`
    : settings.siteName;
  const description = settings.siteDescription || undefined;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function Home() {
  const locale = await getLocale();
  const [settings, currentUser, menus, cookieStore] = await Promise.all([
    getPublicSiteSettings(),
    getServerUser({ callbackUrl: "/", mode: "optional" }),
    getPublicMenus(locale),
    cookies(),
  ]);
  const storedChoice = cookieStore.get(cookieConsentName)?.value;
  return (
    <>
      <Link4SubLandingPage
        dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
        settings={settings}
        menus={menus}
      />
      <LandingFloatingControls initialChoice={isCookieConsentChoice(storedChoice) ? storedChoice : null} />
    </>
  );
}
