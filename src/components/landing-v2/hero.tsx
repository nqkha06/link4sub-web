"use client";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  ArrowRight,
  Check,
  LockKeyhole,
} from "lucide-react";
import {
  SiDiscord,
  SiYoutube,
} from "@icons-pack/react-simple-icons";

import { Button } from "@/components/ui/button";
import { HighlightText } from "@/components/landing-v2/highlight-text";
import { LandingGridBackground } from "@/components/landing-v2/landing-grid-background";

const SOCIAL_PROOF_AVATARS = [
  "https://images.unsplash.com/photo-1588590560438-5e27fe3f6b71?w=96&h=96&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1699720212394-d2b4cdb66266?w=96&h=96&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1588336443962-49d88df004a1?w=96&h=96&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1776699549852-b7de175e604a?w=96&h=96&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1762483759941-819cf21b333f?w=96&h=96&fit=crop&crop=faces&q=80",
];

type ActionTone = "youtube" | "discord" | "x";
type Translator = ReturnType<typeof useTranslations>;

type PreviewAction = {
  id: string;
  label: string;
  icon: ReactNode;
  tone: ActionTone;
};

type PreviewCard = {
  id: string;
  title: string;
  description: string;
  eyebrow: string;
  previewLabel: string;
  actions: PreviewAction[];
};

function buildPreviewCards(t: Translator): PreviewCard[] {
  const actions = {
    youtube: {
      id: "youtube",
      label: t("demo.actions.youtube"),
      icon: <SiYoutube size={17} />,
      tone: "youtube" as const,
    },
    discord: {
      id: "discord",
      label: t("demo.actions.discord"),
      icon: <SiDiscord size={17} />,
      tone: "discord" as const,
    },
    x: {
      id: "x",
      label: t("demo.actions.x"),
      icon: (
        <span className="text-[16px] leading-none">
          𝕏
        </span>
      ),
      tone: "x" as const,
    },
  };

  const samplePackTitle = "Free Sample Pack Vol. 3";
  const discordServerTitle = t("demo.discordServer.title");

  return [
    {
      id: "sample-pack",
      eyebrow: t("demo.samplePack.eyebrow"),
      title: samplePackTitle,
      description: t("demo.samplePack.description"),
      previewLabel: t("demo.previewAria", {
        title: samplePackTitle,
      }),
      actions: [actions.youtube, actions.discord, actions.x],
    },
    {
      id: "discord-server",
      eyebrow: t("demo.discordServer.eyebrow"),
      title: discordServerTitle,
      description: t("demo.discordServer.description"),
      previewLabel: t("demo.previewAria", {
        title: discordServerTitle,
      }),
      actions: [actions.discord, actions.youtube, actions.x],
    },
  ];
}

export function LandingHero({
  dashboardHref,
}: {
  dashboardHref: string | null;
}) {
  const t = useTranslations("Landing.hero");
  const reduceMotion = usePrefersReducedMotion();

  const previewCards = useMemo(
    () => buildPreviewCards(t),
    [t],
  );

  return (
    <section
      id="top"
      className="relative isolate min-h-[760px] overflow-hidden"
    >
      <LandingGridBackground />

      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-14 px-4 pb-24 pt-16 md:px-8 md:pb-32 md:pt-24 lg:min-h-[780px] lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">

        {/* COPY */}
        <motion.div
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 20,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40" />

              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>

            {t("badge")}
          </div>

          <h1 className="max-w-[680px] text-balance text-[3.25rem] font-semibold leading-[0.96] tracking-[-0.055em] text-foreground sm:text-[4.1rem] lg:text-[4.65rem] xl:text-[5.2rem]">
            {t("titleLine1")}
            <br />
            {t("titleLine2")}{" "}
            <br />
            <HighlightText>
              {t("titleHighlight")}
            </HighlightText>
          </h1>

          <p className="mt-7 max-w-[570px] text-pretty text-[17px] leading-7 text-muted-foreground md:text-lg">
            {t("description")}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              asChild
              className="group relative h-13 overflow-hidden rounded-xl px-7 text-[15px] font-semibold shadow-[0_14px_38px_-14px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
            >
              <Link
                href={
                  dashboardHref ?? "/create"
                }
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t("ctaPrimary")}
                  <span className="-ml-2 inline-flex w-0 -translate-x-1 overflow-hidden opacity-0 transition-all duration-300 group-hover:ml-0 group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:ml-0 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                    <ArrowRight className="size-4 shrink-0" />
                  </span>
                </span>

                <span
                  aria-hidden
                  className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0"
                />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="ghost"
              asChild
              className="group h-13 rounded-xl px-5 text-[15px]"
            >
              <Link href="/how-it-works">
                {t("ctaSecondary")}

                <span className="-ml-2 inline-flex h-6 w-0 -translate-x-1 items-center justify-center overflow-hidden rounded-full bg-muted opacity-0 transition-all duration-300 group-hover:ml-0 group-hover:w-6 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:ml-0 group-focus-visible:w-6 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2" aria-hidden>
              {SOCIAL_PROOF_AVATARS.map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-full border-2 border-background bg-muted object-cover"
                />
              ))}
            </div>

            <div>
              <p className="text-sm">
                {t.rich("socialProof.users", {
                  strong: (chunks) => (
                    <span className="font-semibold">{chunks}</span>
                  ),
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("socialProof.rating")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* INTERACTIVE DEMO */}
        <CardDeck
          reduceMotion={!!reduceMotion}
          previewCards={previewCards}
          t={t}
        />
      </div>
    </section>
  );
}

function CardDeck({
  reduceMotion,
  previewCards,
  t,
}: {
  reduceMotion: boolean;
  previewCards: PreviewCard[];
  t: Translator;
}) {
  const [activeIndex, setActiveIndex] =
    useState(0);

  const [
    completedByCard,
    setCompletedByCard,
  ] = useState<Record<string, string[]>>({});

  const [
    unlockedByCard,
    setUnlockedByCard,
  ] = useState<Record<string, boolean>>({});

  const celebrateUnlock = (
    element: HTMLElement,
  ) => {
    const rect =
      element.getBoundingClientRect();

    const origin = {
      x:
        (rect.left + rect.width / 2) /
        window.innerWidth,
      y:
        (rect.top + rect.height / 2) /
        window.innerHeight,
    };

    confetti({
      particleCount: 55,
      spread: 58,
      startVelocity: 38,
      gravity: 0.95,
      scalar: 0.9,
      ticks: 180,
      angle: 60,
      origin,
      zIndex: 100,
    });

    confetti({
      particleCount: 55,
      spread: 58,
      startVelocity: 38,
      gravity: 0.95,
      scalar: 0.9,
      ticks: 180,
      angle: 120,
      origin,
      zIndex: 100,
    });

    window.setTimeout(() => {
      confetti({
        particleCount: 26,
        spread: 90,
        startVelocity: 24,
        gravity: 0.8,
        scalar: 0.75,
        ticks: 150,
        origin,
        zIndex: 100,
      });
    }, 110);
  };

  const completeAction = (
    cardId: string,
    actionId: string,
  ) => {
    if (unlockedByCard[cardId]) {
      return;
    }

    setCompletedByCard((current) => {
      const completed =
        current[cardId] ?? [];

      if (
        completed.includes(actionId)
      ) {
        return current;
      }

      return {
        ...current,
        [cardId]: [
          ...completed,
          actionId,
        ],
      };
    });
  };

  const unlockCard = (
    card: PreviewCard,
    trigger: HTMLElement,
  ) => {
    const completed =
      completedByCard[card.id] ?? [];

    const canUnlock =
      completed.length ===
      card.actions.length;

    if (
      !canUnlock ||
      unlockedByCard[card.id]
    ) {
      return;
    }

    setUnlockedByCard((current) => ({
      ...current,
      [card.id]: true,
    }));

    celebrateUnlock(trigger);
  };

  return (
    <motion.div
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              x: 30,
              scale: 0.97,
            }
      }
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.8,
        delay: 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mx-auto h-[610px] w-full max-w-[620px] lg:mx-0 lg:justify-self-end"
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 h-[430px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.08] blur-[95px]"
      />

      {previewCards.map(
        (card, index) => {
          const isActive =
            index === activeIndex;

          const position =
            getCardPosition(
              index,
              activeIndex,
            );

          const completed =
            completedByCard[card.id] ??
            [];

          return (
            <motion.div
              key={card.id}
              role={
                isActive
                  ? undefined
                  : "button"
              }
              tabIndex={
                isActive ? -1 : 0
              }
              aria-label={
                isActive
                  ? undefined
                  : card.previewLabel
              }
              onClick={() => {
                if (!isActive) {
                  setActiveIndex(index);
                }
              }}
              onKeyDown={(event) => {
                if (
                  !isActive &&
                  (event.key ===
                    "Enter" ||
                    event.key === " ")
                ) {
                  event.preventDefault();

                  setActiveIndex(index);
                }
              }}
              animate={{
                x: position.x,
                y: position.y,
                scale: position.scale,
                rotate: position.rotate,
                opacity:
                  position.opacity,
              }}
              whileHover={
                isActive ||
                reduceMotion
                  ? undefined
                  : {
                      y:
                        position.y -
                        8,
                      scale:
                        position.scale +
                        0.012,
                    }
              }
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 26,
                mass: 0.8,
              }}
              style={{
                zIndex:
                  position.zIndex,
              }}
              className={[
                "absolute left-1/2 top-1/2 w-[88%] max-w-[445px] -translate-x-1/2 -translate-y-1/2 outline-none",
                isActive
                  ? "cursor-default"
                  : "cursor-pointer",
              ].join(" ")}
            >
              <PreviewUnlockCard
                card={card}
                active={isActive}
                completedActionIds={
                  completed
                }
                unlocked={
                  !!unlockedByCard[
                    card.id
                  ]
                }
                reduceMotion={
                  reduceMotion
                }
                t={t}
                onActionClick={(
                  actionId,
                ) =>
                  completeAction(
                    card.id,
                    actionId,
                  )
                }
                onUnlock={(
                  trigger,
                ) =>
                  unlockCard(
                    card,
                    trigger,
                  )
                }
              />
            </motion.div>
          );
        },
      )}
    </motion.div>
  );
}

function getCardPosition(
  index: number,
  activeIndex: number,
) {
  const isActive =
    index === activeIndex;

  if (isActive) {
    return {
      x: -24,
      y: 34,
      scale: 1,
      rotate: -1.5,
      opacity: 1,
      zIndex: 20,
    };
  }

  return {
    x: 78,
    y: -54,
    scale: 0.92,
    rotate: 4,
    opacity: 0.72,
    zIndex: 10,
  };
}

function PreviewUnlockCard({
  card,
  active,
  completedActionIds,
  unlocked,
  reduceMotion,
  t,
  onActionClick,
  onUnlock,
}: {
  card: PreviewCard;
  active: boolean;
  completedActionIds: string[];
  unlocked: boolean;
  reduceMotion: boolean;
  t: Translator;
  onActionClick: (
    actionId: string,
  ) => void;
  onUnlock: (
    trigger: HTMLElement,
  ) => void;
}) {
  const doneCount =
    completedActionIds.length;

  const total =
    card.actions.length;

  const canUnlock =
    doneCount === total;

  const progress =
    (doneCount / total) * 100;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[30px] border bg-card p-5 text-card-foreground transition-[border-color,background-color,box-shadow] duration-300 sm:p-6",
        active
          ? "border-border shadow-[0_34px_90px_-34px_rgba(0,0,0,0.28)] dark:shadow-[0_34px_90px_-24px_rgba(0,0,0,0.72)]"
          : "border-border/80 shadow-[0_22px_60px_-34px_rgba(0,0,0,0.22)] dark:shadow-[0_22px_60px_-24px_rgba(0,0,0,0.6)]",
      ].join(" ")}
    >
      {active && (
        <div
          aria-hidden
          className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />
      )}

      <div className="text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          {card.eyebrow}
        </span>

        <h3 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.035em] sm:text-[25px]">
          {card.title}
        </h3>

        <p className="mx-auto mt-1.5 max-w-[320px] text-sm leading-5 text-muted-foreground">
          {card.description}
        </p>
      </div>

      <div
        className={[
          "mt-6 space-y-2.5",
          active
            ? ""
            : "pointer-events-none",
        ].join(" ")}
      >
        {card.actions.map(
          (action) => {
            const done =
              completedActionIds.includes(
                action.id,
              );

            return (
              <ActionButton
                key={action.id}
                action={action}
                active={active}
                done={done}
                disabled={unlocked}
                onClick={() =>
                  onActionClick(
                    action.id,
                  )
                }
              />
            );
          },
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">
            {t("demo.progressLabel")}
          </span>

          <motion.span
            key={`${doneCount}-${unlocked}`}
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 3,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={[
              "font-semibold",
              unlocked
                ? "text-emerald-600"
                : canUnlock
                  ? "text-primary"
                  : "text-muted-foreground",
            ].join(" ")}
          >
            {unlocked
              ? t("demo.unlocked")
              : t("demo.progressCount", {
                  done: doneCount,
                  total,
                })}
          </motion.span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            animate={{
              width: `${progress}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 24,
            }}
            className={[
              "h-full rounded-full",
              unlocked
                ? "bg-emerald-500"
                : "bg-primary",
            ].join(" ")}
          />
        </div>

        <div className="relative mt-4">
          <motion.button
            type="button"
            disabled={
              !active ||
              !canUnlock ||
              unlocked
            }
            onClick={(event) => {
              event.stopPropagation();

              onUnlock(
                event.currentTarget,
              );
            }}
            whileTap={
              canUnlock &&
              active &&
              !unlocked
                ? {
                    scale: 0.975,
                  }
                : undefined
            }
            animate={
              unlocked
                ? {
                    scale: [
                      1,
                      1.035,
                      1,
                    ],
                  }
                : undefined
            }
            transition={{
              duration: 0.32,
            }}
            className={[
              "group relative flex h-12 w-full items-center justify-center gap-2 overflow-visible rounded-[15px] text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-200",
              unlocked
                ? "bg-emerald-500 text-white shadow-[0_16px_34px_-16px_rgba(16,185,129,.65)]"
                : canUnlock &&
                    active
                  ? "bg-foreground text-background shadow-[0_14px_30px_-16px_rgba(0,0,0,.55)] hover:-translate-y-0.5"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
            ].join(" ")}
          >
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              {unlocked ? (
                <motion.span
                  key="unlocked"
                  initial={{
                    opacity: 0,
                    y: 5,
                    scale: 0.95,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                  }}
                  className="flex items-center gap-2"
                >
                  <Check className="size-4 stroke-[2.5]" />

                  {t("demo.unlocked")}
                </motion.span>
              ) : (
                <motion.span
                  key="locked"
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                  }}
                  className="flex items-center gap-2"
                >
                  <LockKeyhole className="size-4" />

                  {t("demo.unlockButton")}
                </motion.span>
              )}
            </AnimatePresence>

            {unlocked && (
              <motion.span
                aria-hidden
                initial={{
                  opacity: 0.55,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 0,
                  scale: 1.28,
                }}
                transition={{
                  duration: 0.55,
                }}
                className="pointer-events-none absolute inset-0 -z-10 rounded-[18px] bg-emerald-400/35 blur-xl"
              />
            )}
          </motion.button>
        </div>

        <p className="mt-2 min-h-4 text-center text-[11px] text-muted-foreground">
          {unlocked
            ? t("demo.footerUnlocked")
            : canUnlock
              ? t("demo.footerReady")
              : t("demo.footerPending")}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  action,
  active,
  done,
  disabled,
  onClick,
}: {
  action: PreviewAction;
  active: boolean;
  done: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const activeTone =
    getActionTone(action.tone);

  return (
    <motion.button
      type="button"
      disabled={
        !active || disabled || done
      }
      aria-pressed={done}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      whileTap={
        active &&
        !done &&
        !disabled
          ? {
              scale: 0.985,
            }
          : undefined
      }
      className={[
        "relative flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[15px] border px-4 text-sm font-medium transition-all duration-200",

        /*
         * Luôn giữ màu platform.
         * Card phía sau chỉ giảm opacity toàn card,
         * không đổi button thành màu xám.
         */
        activeTone,

        done
          ? "brightness-[0.96]"
          : active &&
              !disabled
            ? "hover:-translate-y-0.5 hover:brightness-[0.98]"
            : "",

        disabled ||
        !active ||
        done
          ? "cursor-default"
          : "cursor-pointer",
      ].join(" ")}
    >
      <span className="flex items-center justify-center">
        {action.icon}
      </span>

      <span>
        {action.label}
      </span>

      <AnimatePresence>
        {done && (
          <motion.span
            initial={{
              opacity: 0,
              scale: 0.5,
              rotate: -20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.5,
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 22,
            }}
            className="absolute right-3 flex size-6 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-sm"
          >
            <Check className="size-3.5 stroke-[2.7]" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function getActionTone(
  tone: ActionTone,
) {
  switch (tone) {
    case "youtube":
      return "border-[#ff0033]/15 bg-[#ff0033] text-white shadow-[0_10px_24px_-18px_rgba(255,0,51,.8)]";

    case "discord":
      return "border-[#5865F2]/15 bg-[#5865F2] text-white shadow-[0_10px_24px_-18px_rgba(88,101,242,.8)]";

    case "x":
      return "border-zinc-950 bg-zinc-950 text-white shadow-[0_10px_24px_-18px_rgba(0,0,0,.65)]";
  }
}
