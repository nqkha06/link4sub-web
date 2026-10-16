import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { VerifyEmailCard } from "@/features/auth/components/verify-email-card";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getPublicSiteSettings(),
    getTranslations("Auth.meta"),
  ]);
  return {
    title: `${t("verifyTitle")} — ${settings.siteName}`,
    robots: { index: false, follow: false },
  };
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] || "" : params.token || "";
  return <VerifyEmailCard token={token} />;
}
