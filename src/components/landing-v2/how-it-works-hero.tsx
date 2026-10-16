"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import { HighlightText } from "@/components/landing-v2/highlight-text";
import { landingContentSectionClassName } from "@/components/landing-v2/section-rhythm";

export function HowItWorksHero() {
  const t = useTranslations("Landing.howItWorks.hero");
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section className={landingContentSectionClassName}>
      <Background />

      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
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
            amount: 0.5,
          }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto max-w-[760px] text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t("eyebrow")}
          </span>

          <h1
            className="
              mt-4
              text-balance
              text-[2.9rem]
              font-semibold
              leading-[1]
              tracking-[-0.055em]
              text-foreground
              sm:text-[3.8rem]
              md:text-[4.4rem]
            "
          >
            {t("titleLine1")}
            <br className="hidden sm:block" />
            {" "}
            <HighlightText>{t("titleHighlight")}</HighlightText>
          </h1>

          <p className="mx-auto mt-6 max-w-[600px] text-pretty text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
            {t("description")}
          </p>

          <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            {t("badge")}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Background() {
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
