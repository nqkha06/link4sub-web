import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import "flag-icons/css/flag-icons.min.css";

import { PayoutRatesPage } from "@/components/payout-rates/payout-rates-page";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import { getPublicPayoutRates } from "@/features/public-payout-rates/api/payout-rates.server";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getServerUser } from "@/lib/auth/server-session";

const MAXIMUM_MONETIZATION_LEVEL_ID = 3;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getPublicSiteSettings(),
    getTranslations("PayoutRates"),
  ]);

  return {
    title: `${t("title")} — ${settings.siteName}`,
    description: t("description"),
  };
}

export default async function PayoutRatePage() {
  const locale = await getLocale();
  const [settings, menus, payoutRateLevel, t, currentUser] = await Promise.all([
    getPublicSiteSettings(),
    getPublicMenus(locale),
    getPublicPayoutRates(MAXIMUM_MONETIZATION_LEVEL_ID),
    getTranslations({ locale, namespace: "PayoutRates" }),
    getServerUser({ callbackUrl: "/payout-rate", mode: "optional" }),
  ]);

  return (
    <PayoutRatesPage
      dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
      locale={locale}
      menus={menus}
      payoutRateLevel={payoutRateLevel}
      settings={settings}
      t={t}
    />
  );
}
