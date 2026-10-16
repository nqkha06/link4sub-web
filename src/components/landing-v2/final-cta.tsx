"use client";

import type { ElementType } from "react";

import Link from "next/link";

import {
  SiDiscord,
  SiFacebook,
  SiTelegram,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HighlightText } from "@/components/landing-v2/highlight-text";
import {
  landingContentPaddingClassName,
  landingSectionBoundaryClassName,
} from "@/components/landing-v2/section-rhythm";

type FloatingIcon = {
  icon: ElementType;
  className: string;
  size: number;
  duration: number;
  delay: number;
  drift: {
    x: number;
    y: number;
  };
};

const floatingIcons: FloatingIcon[] = [
  {
    icon: SiFacebook,
    className: "left-[8%] top-[20%]",
    size: 32,
    duration: 16,
    delay: 0,
    drift: { x: 16, y: 14 },
  },
  {
    icon: SiDiscord,
    className: "left-[16%] top-[72%]",
    size: 24,
    duration: 19,
    delay: 1.2,
    drift: { x: -14, y: 18 },
  },
  {
    icon: SiTelegram,
    className: "left-[40%] top-[12%]",
    size: 22,
    duration: 22,
    delay: 2.6,
    drift: { x: 12, y: -18 },
  },
  {
    icon: SiYoutube,
    className: "right-[9%] top-[26%]",
    size: 36,
    duration: 17.5,
    delay: 0.8,
    drift: { x: -18, y: 16 },
  },
  {
    icon: SiDiscord,
    className: "right-[15%] top-[76%]",
    size: 24,
    duration: 20.5,
    delay: 3,
    drift: { x: 14, y: -14 },
  },
  {
    icon: SiTelegram,
    className: "right-[38%] top-[82%]",
    size: 20,
    duration: 18,
    delay: 1.8,
    drift: { x: -12, y: 16 },
  },
];

export function FinalCTA({
  dashboardHref,
}: {
  dashboardHref: string | null;
}) {
  const t = useTranslations("Landing.finalCta");
  const reduceMotion = false;

  return (
    <section className={landingSectionBoundaryClassName}>
      <CTABackground />

      <motion.div
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 24,
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
          duration: 0.65,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`${landingContentPaddingClassName}
          relative mx-auto
          flex min-h-[560px]
          w-full max-w-[1200px]
          flex-col items-center justify-center
          px-4
          text-center
          md:px-8
        `}
      >
        <span
          className="
            inline-flex items-center
            rounded-full
            border border-border
            bg-background/70
            px-3 py-1.5
            text-xs font-medium
            text-muted-foreground
            backdrop-blur-sm
          "
        >
          {t("badge")}
        </span>

        <h2
          className="
            mt-6
            max-w-[900px]
            text-balance
            text-[2.9rem]
            font-semibold
            leading-[0.98]
            tracking-[-0.055em]
            text-foreground
            sm:text-[3.8rem]
            md:text-[4.8rem]
          "
        >
          {t("titleLine1")}
          <br className="hidden sm:block" />{" "}
          {t("titleLine2")}{" "}
          <HighlightText>{t("titleHighlight")}</HighlightText>
        </h2>

        <p
          className="
            mt-6
            max-w-[620px]
            text-pretty
            text-[16px]
            leading-7
            text-muted-foreground
            sm:text-[18px]
          "
        >
          {t("description")}
        </p>

        <div className="mt-9">
          <Button
            size="lg"
            asChild
            className="
              group h-13
              rounded-xl
              px-8
              text-[15px]
              font-semibold
              shadow-[0_14px_40px_-18px_color-mix(in_oklab,var(--primary)_60%,transparent)]
            "
          >
            <Link href={dashboardHref ?? "/member/create"}>
              {t("cta")}

              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

function CTABackground() {
  const reduceMotion = false;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Main glow */}
      <div
        className="
          absolute left-1/2 top-1/2
          h-[560px] w-[920px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-primary/[0.10]
          blur-[120px]
        "
      />

      {/* Moving beam */}
      <motion.div
        className="
          absolute top-1/2
          h-[220px] w-[42%]
          -translate-y-1/2
          rotate-[-8deg]
          bg-gradient-to-r
          from-transparent
          via-primary/[0.12]
          to-transparent
          blur-3xl
        "
        animate={{
          x: ["-140%", "340%"],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2,
        }}
      />

      {/* Subtle dots */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--foreground) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 70% 80% at 50% 50%, black 20%, transparent 85%)",
        }}
      />

      {/* Floating social icons */}
      <div className="absolute inset-0 hidden sm:block">
        {floatingIcons.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={index}
              className={cn(
                "absolute text-foreground/[0.14]",
                item.className,
              )}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      x: [0, item.drift.x, 0, -item.drift.x, 0],
                      y: [0, -item.drift.y, 0, item.drift.y, 0],
                    }
              }
              transition={{
                duration: item.duration,
                delay: item.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon size={item.size} />
            </motion.div>
          );
        })}
      </div>

      {/* Edge fades */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
