import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthScreen } from "@/components/auth/auth-screen";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getSignedInRedirect } from "@/lib/auth/redirects";
import { getServerUser } from "@/lib/auth/server-session";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getPublicSiteSettings(),
    getTranslations("Auth.meta"),
  ]);
  return {
    title: `${t("forgotTitle")} — ${settings.siteName}`,
    description: t("forgotDescription", { siteName: settings.siteName }),
  };
}

export default async function ForgotPasswordPage() {
  const currentUser = await getServerUser({
    callbackUrl: "/forgot-password",
    mode: "optional",
  });
  if (currentUser) {
    redirect(getSignedInRedirect(currentUser));
  }
  return <AuthScreen mode="forgot" />;
}
