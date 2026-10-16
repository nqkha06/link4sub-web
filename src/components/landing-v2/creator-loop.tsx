"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Quote, Star } from "lucide-react";

import { HighlightText } from "@/components/landing-v2/highlight-text";
import {
  landingContentSectionClassName,
  landingSectionBodyGapClassName,
} from "@/components/landing-v2/section-rhythm";

type Translator = ReturnType<typeof useTranslations>;

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

const testimonialMeta: Array<{
  key: string;
  name: string;
  role: string;
  initials: string;
}> = [
  { key: "t1", name: "YouTube Creator", role: "Digital content", initials: "YT" },
  { key: "t2", name: "Content Creator", role: "Social media", initials: "CC" },
  { key: "t3", name: "Community Owner", role: "Discord community", initials: "CO" },
  { key: "t4", name: "Video Creator", role: "YouTube & TikTok", initials: "VC" },
  { key: "t5", name: "Freelance Creator", role: "Digital resources", initials: "FC" },
  { key: "t6", name: "Music Producer", role: "Sample & preset packs", initials: "MP" },
  { key: "t7", name: "Streamer", role: "Community content", initials: "ST" },
  { key: "t8", name: "Creator Manager", role: "Campaign management", initials: "CM" },
];

function buildTestimonials(t: Translator): Testimonial[] {
  return testimonialMeta.map((meta) => ({
    quote: t(`testimonials.${meta.key}.quote`),
    name: meta.name,
    role: meta.role,
    initials: meta.initials,
  }));
}

/**
 * Marquee track dịch chuyển bằng CSS @keyframes (không dùng Framer Motion
 * `animate`) để có thể pause/resume qua `animation-play-state` mà không bị
 * giật/nhảy vị trí — pause một animation CSS giữ nguyên đúng thời điểm nó
 * đang chạy, khác với việc tắt/bật lại một animate target của Framer Motion
 * (sẽ replay lại từ đầu keyframe).
 */
const MARQUEE_KEYFRAMES = `
  @keyframes testimonial-marquee-forward {
    from { transform: translateX(0%); }
    to { transform: translateX(-33.3333%); }
  }
  @keyframes testimonial-marquee-reverse {
    from { transform: translateX(-33.3333%); }
    to { transform: translateX(0%); }
  }
`;

export function CreatorLoop() {
  const t = useTranslations("Landing.creatorLoop");
  // const reduceMotion = useReducedMotion();
  const reduceMotion = false; //
  const testimonials = useMemo(() => buildTestimonials(t), [t]);
  const firstRow = testimonials.slice(0, 4);
  const secondRow = testimonials.slice(4);

  return (
    <section
      id="creator-loop"
      className={landingContentSectionClassName}
    >
      <style>{MARQUEE_KEYFRAMES}</style>

      <Background />

      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
        {/* HEADER */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.45,
          }}
          transition={{
            duration: reduceMotion ? 0 : 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto max-w-[720px] text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t("eyebrow")}
          </span>

          <h2
            className="
              mt-4
              text-balance
              text-[2.6rem]
              font-semibold
              leading-[1]
              tracking-[-0.05em]
              text-foreground
              sm:text-[3.3rem]
              md:text-[3.8rem]
            "
          >
            {t("titleBeforeHighlight")}{" "}
            <HighlightText className="text-primary">
              {t("titleHighlight")}
            </HighlightText>
          </h2>

          <p className="mx-auto mt-5 max-w-[590px] text-[16px] leading-7 text-muted-foreground">
            {t("description")}
          </p>
        </motion.div>
      </div>

      {/* MARQUEE */}
      <div
        className={`
          ${landingSectionBodyGapClassName}
          relative mx-auto max-w-[1500px]
          pt-3 pb-16
        `}
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
        }}
      >
        {/*
          Wrapper này có mask-image nên bản thân nó luôn "cắt" phần render
          ra ngoài đúng khung của chính nó (đây là hành vi ngầm định của CSS
          mask, không liên quan tới overflow) — pt-3/pb-16 chừa khoảng đệm
          thật cho card khi hover, thay vì dùng mẹo margin âm (đã chứng
          minh không ăn thua với overflow-hidden). Đệm dưới lớn hơn hẳn vì
          box-shadow khi hover đổ xuống rất xa (offset 24px + blur 55px ≈
          45-50px bên dưới card) — riêng hàng dưới không có hàng nào che
          nên phần bóng vượt quá khung mask sẽ bị cắt cụt nếu không đủ chỗ.
        */}
        <TestimonialRow
          testimonials={firstRow}
          reverse={false}
          reduceMotion={!!reduceMotion}
        />

        <TestimonialRow
          testimonials={secondRow}
          reverse
          reduceMotion={!!reduceMotion}
          className="mt-4"
        />
      </div>
    </section>
  );
}

function TestimonialRow({
  testimonials,
  reverse,
  reduceMotion,
  className = "",
}: {
  testimonials: Testimonial[];
  reverse: boolean;
  reduceMotion: boolean;
  className?: string;
}) {
  const [isPaused, setIsPaused] = useState(false);

  const duplicated = [
    ...testimonials,
    ...testimonials,
    ...testimonials,
  ];

  return (
    <div
      className={`
        relative
        overflow-x-clip
        overflow-y-visible
        ${className}
      `}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/*
        overflow-x-clip (không phải overflow-hidden) chỉ cắt theo chiều
        ngang cho marquee — chiều dọc để overflow-y-visible nguyên vẹn
        nên card có thể translateY/scale khi hover mà không bị xén mép
        trên/dưới. Dùng "clip" thay vì "hidden" để tránh việc trình
        duyệt tự ép overflow-y thành "auto" khi ghép với overflow-x
        khác "visible" (theo spec CSS Overflow).
      */}
      <div
        className="flex w-max gap-4 px-2"
        style={
          reduceMotion
            ? undefined
            : {
                animation: `${
                  reverse
                    ? "testimonial-marquee-reverse"
                    : "testimonial-marquee-forward"
                } 32s linear infinite`,
                animationPlayState: isPaused ? "paused" : "running",
              }
        }
      >
        {duplicated.map((item, index) => (
          <TestimonialCard
            key={`${item.name}-${index}`}
            item={item}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({
  item,
  reduceMotion,
}: {
  item: Testimonial;
  reduceMotion: boolean;
}) {
  return (
    <motion.article
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -4,
              scale: 1.008,
            }
      }
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 24,
      }}
      className="
        group
        relative
        flex
        w-[300px]
        shrink-0
        flex-col
        rounded-[22px]
        border
        border-border
        bg-card
        p-5
        shadow-[0_16px_45px_-34px_rgba(0,0,0,.3)]
        transition-shadow
        duration-300
        hover:z-10
        hover:shadow-[0_24px_55px_-30px_rgba(0,0,0,.32)]
        sm:w-[340px]
      "
    >
      {/* RATING */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className="size-3.5 fill-current"
            />
          ))}
        </div>

        <Quote className="size-6 text-primary/15" />
      </div>

      {/* QUOTE */}
      <blockquote className="mt-5 text-[14px] leading-6 text-foreground/80">
        “{item.quote}”
      </blockquote>

      {/* AUTHOR */}
      <div className="mt-auto flex items-center gap-3 pt-6">
        <div
          className="
            flex
            size-9
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-primary/10
            text-[11px]
            font-semibold
            text-primary
          "
        >
          {item.initials}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {item.name}
          </p>

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.role}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function Background() {
  return (
    <div
      aria-hidden
      className="
        pointer-events-none
        absolute
        inset-0
        -z-10
        overflow-hidden
      "
    >
      <div
        className="
          absolute
          left-1/2
          top-[56%]
          h-[600px]
          w-[1000px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-primary/[0.05]
          blur-[140px]
        "
      />

      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--foreground) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 75% 75% at 50% 55%, black 10%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 75% at 50% 55%, black 10%, transparent 82%)",
        }}
      />
    </div>
  );
}
