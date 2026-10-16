import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { PaymentProofPage } from "@/components/payment-proof/payment-proof-page";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import {
  getPublicPaymentProofs,
  getPublicPaymentProofSummary,
} from "@/features/public-payment-proofs/api/payment-proofs.server";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getServerUser } from "@/lib/auth/server-session";

type PaymentProofRouteProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? "1", 10);
  return Number.isSafeInteger(page) && page >= 1 && page <= 10_000 ? page : 1;
}

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getPublicSiteSettings(),
    getTranslations("PaymentProof"),
  ]);

  return {
    title: `${t("title")} — ${settings.siteName}`,
    description: t("metaDescription"),
  };
}

export default async function PaymentProofRoute({
  searchParams,
}: PaymentProofRouteProps) {
  const page = parsePage((await searchParams).page);
  const locale = await getLocale();
  const [settings, menus, proofs, summary, t, currentUser] = await Promise.all([
    getPublicSiteSettings(),
    getPublicMenus(locale),
    getPublicPaymentProofs(page),
    getPublicPaymentProofSummary(),
    getTranslations({ locale, namespace: "PaymentProof" }),
    getServerUser({ callbackUrl: "/payment-proof", mode: "optional" }),
  ]);

  return (
    <PaymentProofPage
      dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
      locale={locale}
      menus={menus}
      proofs={proofs}
      settings={settings}
      summary={summary}
      t={t}
    />
  );
}
