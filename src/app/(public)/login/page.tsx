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
    title: `${t("loginTitle")} — ${settings.siteName}`,
    description: t("loginDescription", { siteName: settings.siteName }),
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    reason?: string | string[];
    error?: string | string[];
    code?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const callbackCandidate = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const callbackUrl =
    callbackCandidate?.startsWith("/") && !callbackCandidate.startsWith("//")
      ? callbackCandidate
      : "/member";
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const authError = Array.isArray(params.error) ? params.error[0] : params.error;
  const authCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const [currentUser, t] = await Promise.all([
    getServerUser({ callbackUrl: "/login", mode: "optional" }),
    getTranslations("Auth.messages"),
  ]);
  if (currentUser) {
    redirect(getSignedInRedirect(currentUser, callbackCandidate));
  }

  const googleClientId = getPublicGoogleClientId();

  return (
    <AuthScreen
      mode="login"
      googleClientId={googleClientId}
      redirectTo={callbackUrl}
      initialMessage={
        reason === "password-reset"
          ? t("passwordResetComplete")
          : reason === "session-expired"
          ? t("sessionExpired")
          : authError === "CredentialsSignin" || authCode === "credentials"
            ? t("invalidCredentials")
            : authError
              ? t("loginFailed")
              : ""
      }
    />
  );
}
