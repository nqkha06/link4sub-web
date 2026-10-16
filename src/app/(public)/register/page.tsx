import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthScreen } from "@/components/auth/auth-screen";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getSignedInRedirect } from "@/lib/auth/redirects";
import { getServerUser } from "@/lib/auth/server-session";
import { getPublicGoogleClientId } from "@/config/public";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getPublicSiteSettings(),
    getTranslations("Auth.meta"),
  ]);
  return {
    title: `${t("registerTitle")} — ${settings.siteName}`,
    description: t("registerDescription", { siteName: settings.siteName }),
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  const rawCallbackUrl = resolvedSearchParams.callbackUrl;
  const callbackCandidate = Array.isArray(rawCallbackUrl)
    ? rawCallbackUrl[0]
    : rawCallbackUrl;
  const callbackUrl =
    callbackCandidate?.startsWith("/") && !callbackCandidate.startsWith("//")
      ? callbackCandidate
      : "/member";

  const currentUser = await getServerUser({
    callbackUrl: "/register",
    mode: "optional",
  });
  if (currentUser) {
    redirect(getSignedInRedirect(currentUser, callbackCandidate));
  }

  const googleClientId = getPublicGoogleClientId();
  const rawReferralCode = resolvedSearchParams.ref;
  const referralCode = (
    Array.isArray(rawReferralCode) ? rawReferralCode[0] : rawReferralCode
  )
    ?.trim()
    .toLowerCase()
    .slice(0, 32);

  return (
    <AuthScreen
      mode="register"
      googleClientId={googleClientId}
      referralCode={referralCode}
      redirectTo={callbackUrl}
    />
  );
}
