"use client";

import { useMemo } from "react";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  BarChart3,
  Fingerprint,
  Link2,
  MousePointerClick,
  Share2,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { HighlightText } from "@/components/landing-v2/highlight-text";
import {
  landingContentSectionClassName,
  landingSectionBodyGapClassName,
} from "@/components/landing-v2/section-rhythm";

type Translator = ReturnType<typeof useTranslations>;

type Benefit = {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  card: string;
  iconStyle: string;
  glow: string;
};

function buildBenefits(t: Translator): Benefit[] {
  return [
    {
      key: "createLink",
      icon: Link2,
      title: t("benefits.createLink.title"),
      description: t("benefits.createLink.description"),
      card:
        "border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-background to-background dark:border-violet-900/50 dark:from-violet-950/20",
      iconStyle:
        "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
      glow: "bg-violet-400/15",
    },
    {
      key: "clickToEngagement",
      icon: MousePointerClick,
      title: t("benefits.clickToEngagement.title"),
      description: t("benefits.clickToEngagement.description"),
      card:
        "border-blue-200/70 bg-gradient-to-br from-blue-50/90 via-background to-background dark:border-blue-900/50 dark:from-blue-950/20",
      iconStyle:
        "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
      glow: "bg-blue-400/15",
    },
    {
      key: "chooseUnlock",
      icon: SlidersHorizontal,
      title: t("benefits.chooseUnlock.title"),
      description: t("benefits.chooseUnlock.description"),
      card:
        "border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-background to-background dark:border-emerald-900/50 dark:from-emerald-950/20",
      iconStyle:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
      glow: "bg-emerald-400/15",
    },
    {
      key: "shareAnywhere",
      icon: Share2,
      title: t("benefits.shareAnywhere.title"),
      description: t("benefits.shareAnywhere.description"),
      card:
        "border-orange-200/70 bg-gradient-to-br from-orange-50/90 via-background to-background dark:border-orange-900/50 dark:from-orange-950/20",
      iconStyle:
        "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
      glow: "bg-orange-400/15",
    },
    {
      key: "manageLinks",
      icon: BarChart3,
      title: t("benefits.manageLinks.title"),
      description: t("benefits.manageLinks.description"),
      card:
        "border-cyan-200/70 bg-gradient-to-br from-cyan-50/90 via-background to-background dark:border-cyan-900/50 dark:from-cyan-950/20",
      iconStyle:
        "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400",
      glow: "bg-cyan-400/15",
    },
    {
      key: "noSensitiveAccess",
      icon: Fingerprint,
      title: t("benefits.noSensitiveAccess.title"),
      description: t("benefits.noSensitiveAccess.description"),
      card:
        "border-rose-200/70 bg-gradient-to-br from-rose-50/90 via-background to-background dark:border-rose-900/50 dark:from-rose-950/20",
      iconStyle:
        "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
      glow: "bg-rose-400/15",
    },
  ];
}

export function WhyLink4Sub() {
  const t = useTranslations("Landing.why");
  const reduceMotion = usePrefersReducedMotion();
  const benefits = useMemo(() => buildBenefits(t), [t]);

  return (
    <section
      id="why-link4sub"
      className={landingContentSectionClassName}
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-[42%] -z-10 h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-primary/[0.045] blur-[130px]"
      />

      <div className="mx-auto w-full max-w-[1180px] px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 20,
                }
          }
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.4,
          }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto max-w-[700px] text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t("eyebrow")}
          </span>

          <h2 className="mt-4 text-balance text-[2.6rem] font-semibold leading-[1] tracking-[-0.05em] text-foreground sm:text-[3.3rem]">
            {t("titleBeforeHighlight")}{" "}
            <HighlightText>{t("titleHighlight")}</HighlightText>
          </h2>

          <p className="mx-auto mt-5 max-w-[600px] text-pretty text-[16px] leading-7 text-muted-foreground">
            {t("description")}
          </p>
        </motion.div>

        {/* Grid */}
        <div
          className={`${landingSectionBodyGapClassName} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <motion.article
                key={benefit.key}
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 20,
                      }
                }
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.25,
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.055,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  `
                    group relative
                    min-h-[235px]
                    overflow-hidden
                    rounded-[22px]
                    border
                    p-5
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:shadow-[0_20px_55px_-32px_rgba(0,0,0,0.28)]
                    sm:p-6
                  `,
                  benefit.card,
                )}
              >
                {/* Colored glow */}
                <div
                  aria-hidden
                  className={cn(
                    `
                      absolute -right-16 -top-16
                      size-40 rounded-full
                      opacity-70 blur-[55px]
                      transition-all duration-500
                      group-hover:scale-125
                      group-hover:opacity-100
                    `,
                    benefit.glow,
                  )}
                />

                {/* index */}
                <span className="absolute right-5 top-5 text-[11px] font-semibold tabular-nums text-muted-foreground/35">
                  0{index + 1}
                </span>

                <div className="relative flex h-full flex-col">
                  <div
                    className={cn(
                      `
                        flex size-11
                        items-center justify-center
                        rounded-[14px]
                        transition-transform duration-300
                        group-hover:-rotate-3
                        group-hover:scale-105
                      `,
                      benefit.iconStyle,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div className="mt-auto pt-9">
                    <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.025em] text-foreground">
                      {benefit.title}
                    </h3>

                    <p className="mt-2.5 text-[14px] leading-6 text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
