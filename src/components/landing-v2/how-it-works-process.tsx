"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import { processSteps } from "@/components/landing-v2/how-it-works-data";
import { landingContentSectionClassName } from "@/components/landing-v2/section-rhythm";

export function HowItWorksProcess() {
  const t = useTranslations("Landing.howItWorks.process");
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section
      id="process"
      className={landingContentSectionClassName}
    >
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
          className="mx-auto max-w-[600px] text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t("eyebrow")}
          </span>

          <h2 className="mt-4 text-balance text-[2.6rem] font-semibold leading-[1] tracking-[-0.05em] text-foreground sm:text-[3.3rem]">
            {t("title")}
          </h2>
        </motion.div>

        {/* STEPS */}
        <div className="relative mt-14 grid gap-6 md:mt-16 md:grid-cols-3 md:gap-5">
          {/* connecting line (desktop only) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[52px] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
          />

          {processSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.index}
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
                  amount: 0.3,
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.09,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative flex flex-col"
              >
                <div className="relative z-10 flex size-[52px] items-center justify-center rounded-2xl border border-border bg-card shadow-[0_10px_30px_-20px_rgba(0,0,0,.35)]">
                  <Icon className="size-5 text-primary" />
                </div>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground/50">
                    {step.index}
                  </span>

                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                    {t(`steps.${step.key}.tag`)}
                  </span>
                </div>

                <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.02em] text-foreground">
                  {t(`steps.${step.key}.title`)}
                </h3>

                <p className="mt-2.5 max-w-[340px] text-[14px] leading-6 text-muted-foreground">
                  {t(`steps.${step.key}.description`)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
