"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import { personas } from "@/components/landing-v2/how-it-works-data";
import { landingContentSectionClassName } from "@/components/landing-v2/section-rhythm";
import { cn } from "@/lib/utils";

export function HowItWorksPersonas() {
  const t = useTranslations("Landing.howItWorks.personas");
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section
      id="who-its-for"
      className={landingContentSectionClassName}
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-[42%] -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.045] blur-[130px]"
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
          {personas.map((persona, index) => {
            const Icon = persona.icon;

            return (
              <motion.article
                key={persona.key}
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
                className={cn(
                  "group relative overflow-hidden rounded-[22px] border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_-32px_rgba(0,0,0,0.28)]",
                  persona.card,
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "absolute -right-14 -top-14 size-36 rounded-full opacity-70 blur-[50px] transition-all duration-500 group-hover:scale-125 group-hover:opacity-100",
                    persona.glow,
                  )}
                />

                <div className="relative flex items-start gap-4">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105",
                      persona.iconStyle,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div>
                    <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.025em] text-foreground">
                      {t(`items.${persona.key}.title`)}
                    </h3>

                    <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                      {t(`items.${persona.key}.description`)}
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
