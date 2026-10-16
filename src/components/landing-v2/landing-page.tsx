import { useTranslations } from "next-intl";

import { CreatorLoop } from "@/components/landing-v2/creator-loop";
import { FAQ } from "@/components/landing-v2/faq";
import { FinalCTA } from "@/components/landing-v2/final-cta";
import { LandingFooter } from "@/components/landing-v2/footer";
import { LandingHero } from "@/components/landing-v2/hero";
import { howItWorksFaqKeys } from "@/components/landing-v2/how-it-works-data";
import { WhyLink4Sub } from "@/components/landing-v2/why-link4sub";
import { LandingNavbar } from "@/components/landing-v2/navbar";
import { PlatformStrip } from "@/components/landing-v2/platform-strip";
import type { PublicSiteSettings } from "@/features/site-settings/types";
import type { PublicMenusResponse } from "@/features/admin-menus/types";

export function Link4SubLandingPage({
  settings,
  dashboardHref,
  menus,
}: {
  settings: PublicSiteSettings;
  dashboardHref: string | null;
  menus: PublicMenusResponse;
}) {
  const t = useTranslations("Landing.howItWorks.faq");
  const faqs = howItWorksFaqKeys.map((key) => ({
    question: t(`items.${key}.question`),
    answer: t(`items.${key}.answer`),
  }));

  return (
    <div className="bg-background">
      <LandingNavbar settings={settings} dashboardHref={dashboardHref} menus={menus} />
      <main>
        <LandingHero dashboardHref={dashboardHref} />
        <PlatformStrip />
        <WhyLink4Sub />
        <CreatorLoop />
        <FAQ
          eyebrow={t("eyebrow")}
          title={t("title")}
          highlightedTitle={t("highlightedTitle")}
          description={t("description")}
          faqs={faqs}
        />
        <FinalCTA dashboardHref={dashboardHref} />
      </main>
      <LandingFooter settings={settings} menus={menus} />
    </div>
  );
}
