import { Compass, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LandingFooter } from "@/components/landing-v2/footer";
import { HighlightText } from "@/components/landing-v2/highlight-text";
import { LandingNavbar } from "@/components/landing-v2/navbar";
import { landingContentSectionClassName } from "@/components/landing-v2/section-rhythm";
import { Button } from "@/components/ui/button";
import type { PublicSiteSettings } from "@/features/site-settings/types";

export async function LandingNotFoundPage({
  settings,
  dashboardHref,
}: {
  settings: PublicSiteSettings;
  dashboardHref: string | null;
}) {
  const t = await getTranslations("NotFound");
  const tNav = await getTranslations("Landing.nav");
  const tHero = await getTranslations("Landing.hero");

  return (
    <div
      className="
        min-w-[320px] overflow-x-clip
        bg-background text-foreground
      "
      id="top"
    >
      <LandingNavbar
        dashboardHref={dashboardHref}
        settings={settings}
      />

      <main>
        <section className={landingContentSectionClassName}>
          <NotFoundBackground />

          <div className="mx-auto flex w-full max-w-[720px] flex-col items-center px-4 text-center md:px-8">
            <div
              aria-hidden="true"
              className="
                flex size-14 items-center justify-center
                rounded-[16px] bg-primary/10 text-primary
              "
            >
              <Compass className="size-6" />
            </div>

            <span className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {t("eyebrow")}
            </span>

            <p
              aria-label={t("codeLabel")}
              className="
                mt-2 select-none
                text-[5.5rem] font-semibold
                leading-none tracking-[-0.05em]
                text-foreground/[0.07]
                sm:text-[7.5rem]
              "
            >
              404
            </p>

            <h1
              className="
                -mt-8 text-balance
                text-[2.4rem] font-semibold
                leading-[1.08] tracking-[-0.045em]
                text-foreground
                sm:text-[3rem]
                md:-mt-10
              "
            >
              {t("titleBeforeHighlight")}{" "}
              <HighlightText>{t("titleHighlight")}</HighlightText>
            </h1>

            <p className="mx-auto mt-5 max-w-[480px] text-pretty text-[16px] leading-7 text-muted-foreground">
              {t("description")}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="
                  group h-13
                  rounded-xl px-7
                  text-[15px] font-semibold
                  shadow-[0_14px_38px_-14px_color-mix(in_oklab,var(--primary)_55%,transparent)]
                "
              >
                <Link href="/">
                  {t("backHome")}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="ghost"
                asChild
                className="h-13 rounded-xl px-5 text-[15px]"
              >
                <Link href={dashboardHref ?? "/member/create"}>
                  {dashboardHref
                    ? tNav("actions.dashboard")
                    : tHero("ctaPrimary")}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter settings={settings} />
    </div>
  );
}

function NotFoundBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="
          absolute left-1/2 top-[-10%]
          h-[520px] w-[900px]
          -translate-x-1/2
          rounded-full
          bg-primary/[0.06]
          blur-[130px]
        "
      />

      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--foreground) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 70% 70% at 50% 20%, black 10%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 70% at 50% 20%, black 10%, transparent 80%)",
        }}
      />
    </div>
  );
}
