"use client";

import Link from "next/link";
import { Crown, Eye, Info, Medal, Sparkles, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LEADERBOARD_PERIODS,
  type Leaderboard,
  type LeaderboardEntry,
} from "@/features/leaderboard/types";
import { cn } from "@/lib/utils";

/**
 * Màu huy chương (vàng / bạc / đồng) là màu mang nghĩa, giống nhau ở cả hai theme,
 * nên dùng màu Tailwind trực tiếp kèm độ trong suốt để hòa với nền light/dark.
 */
const MEDALS = {
  1: {
    crown: "text-amber-500",
    ring: "ring-amber-400",
    avatar: "bg-amber-400/15 text-amber-600 dark:text-amber-300",
    step: "h-36 sm:h-44 border-amber-400/40 from-amber-400/30 to-amber-400/5",
    number: "text-amber-500",
    reward: "border-amber-400/40 bg-amber-400/10",
    place: "text-amber-600 dark:text-amber-300",
  },
  2: {
    crown: "text-slate-400",
    ring: "ring-slate-400",
    avatar: "bg-slate-400/15 text-slate-600 dark:text-slate-300",
    step: "h-28 sm:h-34 border-slate-400/40 from-slate-400/25 to-slate-400/5",
    number: "text-slate-400",
    reward: "border-slate-400/40 bg-slate-400/10",
    place: "text-slate-600 dark:text-slate-300",
  },
  3: {
    crown: "text-orange-500",
    ring: "ring-orange-400",
    avatar: "bg-orange-400/15 text-orange-600 dark:text-orange-300",
    step: "h-22 sm:h-26 border-orange-400/40 from-orange-400/25 to-orange-400/5",
    number: "text-orange-500",
    reward: "border-orange-400/40 bg-orange-400/10",
    place: "text-orange-600 dark:text-orange-300",
  },
} as const;

type MedalRank = keyof typeof MEDALS;

function isMedalRank(rank: number): rank is MedalRank {
  return rank === 1 || rank === 2 || rank === 3;
}

/** Thứ tự hiển thị trên bục: hạng 2 bên trái, hạng 1 ở giữa, hạng 3 bên phải. */
const PODIUM_ORDER: Record<MedalRank, string> = {
  1: "order-2",
  2: "order-1",
  3: "order-3",
};

/** Mức thưởng minh họa cho top 10 của tháng (đơn vị Xu). */
const MONTHLY_REWARDS = [250, 200, 150, 100, 75, 60, 50, 40, 30, 25] as const;

function initial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase() || "?";
}

export function LeaderboardView({ data }: { data: Leaderboard }) {
  const t = useTranslations("Leaderboard");
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);

  const podium = data.entries.slice(0, 3);
  const rest = data.entries.slice(3);
  const periodStart = data.periodStart
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(data.periodStart))
    : null;
  // Chỉ đánh dấu mức thưởng của bạn khi đang xem bảng tháng, vì thưởng xét theo tháng.
  const myRewardRank = data.period === "month" ? data.me.rank : null;

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        action={
          <nav
            aria-label={t("periodLabel")}
            className="inline-flex rounded-lg border border-border bg-muted/20 p-1"
          >
            {LEADERBOARD_PERIODS.map((period) => {
              const active = period === data.period;
              return (
                <Link
                  key={period}
                  href={`/member/leaderboard?period=${period}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "grid h-9 place-items-center rounded-md px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`periods.${period}`)}
                </Link>
              );
            })}
          </nav>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Cột trái */}
        <div className="min-w-0 space-y-6">
          {/* Vị trí của bạn */}
          <section
            aria-label={t("yourRank")}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Trophy className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("yourRank")}
                </p>
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {data.me.rank
                    ? `#${number.format(data.me.rank)}`
                    : t("unranked")}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">
                {t("validViews")}
              </p>
              <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground">
                {number.format(data.me.validViews)}
              </p>
            </div>

            {data.me.rank ? null : (
              <p className="basis-full text-xs leading-5 text-muted-foreground">
                {t("unrankedHint")}
              </p>
            )}
          </section>

          {data.entries.length === 0 ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
              <div>
                <Medal
                  className="mx-auto size-7 text-muted-foreground"
                  aria-hidden
                />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {t("emptyTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("emptyDescription")}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Bục vinh danh */}
              <section className="overflow-hidden rounded-2xl border border-border bg-card px-4 pt-5 sm:px-6 sm:pt-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                  {t("podiumTitle")}
                  <Sparkles className="size-4 text-amber-500" aria-hidden />
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("podiumNote")}
                </p>

                <ol className="mx-auto mt-8 grid max-w-xl grid-cols-3 items-end gap-2 sm:gap-4">
                  {podium.map((entry, index) => (
                    <PodiumContestant
                      key={`${entry.rank}-${index}`}
                      entry={entry}
                      slot={(index + 1) as MedalRank}
                      views={number.format(entry.validViews)}
                      viewsLabel={t("viewsUnit")}
                      youLabel={t("you")}
                    />
                  ))}
                </ol>
              </section>

              {/* Hạng 4 trở đi */}
              {rest.length > 0 ? (
                <section className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      {t(`listTitle.${data.period}`)}
                    </h2>
                    <small className="text-xs text-muted-foreground">
                      {t("listUnit")}
                    </small>
                  </div>
                  <ol className="divide-y divide-border">
                    {rest.map((entry, index) => (
                      <LeaderboardRow
                        key={`${entry.rank}-${index}`}
                        entry={entry}
                        views={number.format(entry.validViews)}
                        youLabel={t("you")}
                      />
                    ))}
                  </ol>
                </section>
              ) : null}
            </>
          )}

          <p className="text-xs leading-5 text-muted-foreground">
            {periodStart
              ? t("footnotePeriod", { size: data.size, date: periodStart })
              : t("footnoteAll", { size: data.size })}
          </p>
        </div>

        {/* Cột phải: phần thưởng */}
        <aside className="rounded-2xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-500">
              <Trophy className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t("rewards.eyebrow")}
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {t("rewards.title")}
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t.rich("rewards.description", {
              b: (chunks) => (
                <b className="font-semibold text-foreground">{chunks}</b>
              ),
            })}
          </p>

          <ol className="mt-5 space-y-2">
            {MONTHLY_REWARDS.map((amount, index) => {
              const rank = index + 1;
              const medal = isMedalRank(rank) ? MEDALS[rank] : null;
              const mine = myRewardRank === rank;
              return (
                <li
                  key={rank}
                  aria-current={mine ? "true" : undefined}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5",
                    medal ? medal.reward : "border-border bg-muted/20",
                    mine && "ring-2 ring-primary/60",
                  )}
                >
                  <span className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        medal ? medal.place : "text-foreground",
                      )}
                    >
                      #{rank}
                    </span>
                    <small className="text-xs text-muted-foreground">
                      {isMedalRank(rank)
                        ? t(`rewards.places.${rank}`)
                        : t("rewards.places.other")}
                    </small>
                    {mine ? <YouBadge label={t("you")} /> : null}
                  </span>
                  <b className="text-sm font-semibold tabular-nums text-foreground">
                    {t("rewards.amount", { amount: number.format(amount) })}
                  </b>
                </li>
              );
            })}
          </ol>

          <p className="mt-5 flex gap-2 rounded-xl bg-muted/40 px-3.5 py-3 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t("rewards.footnote")}
          </p>
        </aside>
      </div>
    </PageContainer>
  );
}

function PodiumContestant({
  entry,
  slot,
  views,
  viewsLabel,
  youLabel,
}: {
  entry: LeaderboardEntry;
  /** Vị trí trên bục (1–3), dùng để chọn màu và chiều cao bậc. */
  slot: MedalRank;
  views: string;
  viewsLabel: string;
  youLabel: string;
}) {
  const medal = MEDALS[slot];
  const first = slot === 1;

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col items-center text-center",
        PODIUM_ORDER[slot],
      )}
    >
      <Crown
        className={cn("mb-1", first ? "size-7" : "size-5", medal.crown)}
        fill="currentColor"
        aria-hidden
      />
      <Avatar
        className={cn(
          "ring-4 ring-offset-2 ring-offset-card",
          first ? "size-18 sm:size-20" : "size-14 sm:size-16",
          medal.ring,
          entry.isMe && "outline-2 outline-offset-4 outline-primary",
        )}
      >
        <AvatarImage src={entry.avatar || undefined} alt="" />
        <AvatarFallback
          className={cn(
            "font-bold",
            first ? "text-2xl" : "text-xl",
            medal.avatar,
          )}
        >
          {initial(entry.name)}
        </AvatarFallback>
      </Avatar>

      <p className="mt-3 flex max-w-full items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
        <span className="truncate">{entry.name}</span>
        {entry.isMe ? <YouBadge label={youLabel} /> : null}
      </p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        <Eye className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">
          <span className="font-semibold tabular-nums text-foreground">
            {views}
          </span>{" "}
          <span className="hidden sm:inline">{viewsLabel}</span>
        </span>
      </p>

      <div
        className={cn(
          "mt-3 flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl border border-b-0 bg-linear-to-b pt-3",
          medal.step,
        )}
      >
        <span
          className={cn(
            "font-black leading-none tabular-nums",
            first ? "text-5xl" : "text-4xl",
            medal.number,
          )}
        >
          {entry.rank}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Trophy className="size-3" aria-hidden />
          Top {entry.rank}
        </span>
      </div>
    </li>
  );
}

function YouBadge({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      {label}
    </span>
  );
}

function LeaderboardRow({
  entry,
  views,
  youLabel,
}: {
  entry: LeaderboardEntry;
  views: string;
  youLabel: string;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30",
        entry.isMe && "bg-primary/5 hover:bg-primary/10",
      )}
    >
      <span className="text-sm font-bold tabular-nums text-muted-foreground">
        #{entry.rank}
      </span>

      <span className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={entry.avatar || undefined} alt="" />
          <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">
            {initial(entry.name)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-foreground">
          {entry.name}
        </span>
        {entry.isMe ? <YouBadge label={youLabel} /> : null}
      </span>

      <span className="flex items-center justify-end gap-1.5 text-sm font-semibold tabular-nums text-foreground">
        <Eye className="size-3.5 text-muted-foreground" aria-hidden />
        {views}
      </span>
    </li>
  );
}
