"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import { differentiators } from "@/components/landing-v2/how-it-works-data";
import { landingContentSectionClassName } from "@/components/landing-v2/section-rhythm";

export function HowItWorksDifferentiators() {
  const t = useTranslations("Landing.howItWorks.differentiators");
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section
      id="why-different"
      className={landingContentSectionClassName}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-full bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--muted)_35%,transparent)_35%,color-mix(in_oklab,var(--muted)_35%,transparent)_65%,transparent)]"
      />

      <div className="mx-auto w-full max-w-[1180px] px-4 md:px-8">
        {/* HEADER */}
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
          className="mx-auto max-w-[680px] text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t("eyebrow")}
          </span>

          <h2 className="mt-4 text-balance text-[2.6rem] font-semibold leading-[1] tracking-[-0.05em] text-foreground sm:text-[3.3rem]">
            {t("title")}
          </h2>
        </motion.div>

        {/* GRID */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {differentiators.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.key}
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
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative overflow-hidden rounded-[22px] border border-border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_55px_-32px_rgba(0,0,0,0.28)]"
              >
                <div className="relative flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                    <Icon className="size-5" />
                  </div>

                  <div>
                    <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.025em] text-foreground">
                      {t(`items.${item.key}.title`)}
                    </h3>

                    <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                      {t(`items.${item.key}.description`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
