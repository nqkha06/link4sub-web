import { useTranslations } from "next-intl";

import { FAQ } from "@/components/landing-v2/faq";
import { FinalCTA } from "@/components/landing-v2/final-cta";
import { LandingFooter } from "@/components/landing-v2/footer";
import { howItWorksFaqKeys } from "@/components/landing-v2/how-it-works-data";
import { HowItWorksDifferentiators } from "@/components/landing-v2/how-it-works-differentiators";
import { HowItWorksHero } from "@/components/landing-v2/how-it-works-hero";
import { HowItWorksPersonas } from "@/components/landing-v2/how-it-works-personas";
import { HowItWorksProcess } from "@/components/landing-v2/how-it-works-process";
import { LandingNavbar } from "@/components/landing-v2/navbar";
import type { PublicMenusResponse } from "@/features/admin-menus/types";
import type { PublicSiteSettings } from "@/features/site-settings/types";

export function HowItWorksPage({
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
        <HowItWorksHero />
        <HowItWorksProcess />
        <HowItWorksPersonas />
        <HowItWorksDifferentiators />
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
