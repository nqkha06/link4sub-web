import { LandingNotFoundPage } from "@/components/landing-v2/not-found-page";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getServerUser } from "@/lib/auth/server-session";

export default async function NotFoundPage() {
  const [settings, currentUser] = await Promise.all([
    getPublicSiteSettings(),
    getServerUser({ callbackUrl: "/", mode: "optional" }),
  ]);

  return (
    <LandingNotFoundPage
      dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
      settings={settings}
    />
  );
}
