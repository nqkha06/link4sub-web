import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { HowItWorksPage } from "@/components/landing-v2/how-it-works-page";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getServerUser } from "@/lib/auth/server-session";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getPublicSiteSettings(),
    getTranslations("Landing.howItWorks.metadata"),
  ]);
  const title = t("title", { siteName: settings.siteName });
  const description = t("description");

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function HowItWorksRoute() {
  const locale = await getLocale();
  const [settings, currentUser, menus] = await Promise.all([
    getPublicSiteSettings(),
    getServerUser({ callbackUrl: "/how-it-works", mode: "optional" }),
    getPublicMenus(locale),
  ]);

  return (
    <HowItWorksPage
      settings={settings}
      dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
      menus={menus}
    />
  );
}
