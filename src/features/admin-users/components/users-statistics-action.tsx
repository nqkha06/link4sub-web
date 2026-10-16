"use client";

import {
  BadgeCheck,
  ChartNoAxesCombined,
  CircleDollarSign,
  Eye,
  Link2,
  LoaderCircle,
  LogIn,
  RefreshCw,
  UserPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminUsersStatistics } from "@/features/admin-users/api/users.client";
import type { UsersStatistics } from "@/features/admin-users/types";
import { userStatusConfig } from "@/features/admin-users/user-status";

type RegistrationRange = "week" | "month" | "year";

export function UsersStatisticsAction() {
  const t = useTranslations("Admin.users.statistics");
  const tc = useTranslations("Admin.common");
  const { formatDateTime } = useFormatters();
  const [open, setOpen] = React.useState(false);
  const [statistics, setStatistics] = React.useState<UsersStatistics | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadStatistics = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStatistics(await getAdminUsersStatistics());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  function openDialog() {
    setOpen(true);
    void loadStatistics();
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={openDialog}>
        <ChartNoAxesCombined /> {t("trigger")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="shrink-0 border-b bg-muted/20 px-5 py-5 pr-14 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <ChartNoAxesCombined className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle>{t("title")}</DialogTitle>
                  {statistics ? (
                    <Badge variant="outline" className="rounded-md bg-background font-normal">
                      {t("scopeBadge")}
                    </Badge>
                  ) : null}
                </div>
                <DialogDescription className="mt-1">
                  {t("description")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {loading && !statistics ? <StatisticsSkeleton /> : null}
            {error && !statistics ? (
              <div className="grid min-h-72 place-items-center rounded-xl border border-dashed p-6 text-center">
                <div>
                  <p className="text-sm font-semibold">{t("errorTitle")}</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{error}</p>
                  <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void loadStatistics()}>
                    <RefreshCw /> {tc("retry")}
                  </Button>
                </div>
              </div>
            ) : null}
            {statistics ? <StatisticsContent statistics={statistics} /> : null}
          </div>

          <DialogFooter className="shrink-0 flex-col items-stretch border-t bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted-foreground">
              {statistics
                ? t("updatedAt", { time: formatDateTime(statistics.generatedAt) })
                : t("aggregating")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <DialogClose asChild>
                <Button type="button" variant="outline">{tc("close")}</Button>
              </DialogClose>
              <Button type="button" disabled={loading} onClick={() => void loadStatistics()}>
                {loading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
                {tc("refresh")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatisticsContent({ statistics }: { statistics: UsersStatistics }) {
  const t = useTranslations("Admin.users.statistics");
  const tUsers = useTranslations("Admin.users");
  const { formatNumber, formatPercent, formatCurrency } = useFormatters();
  const activeUsers = statistics.statuses.find(({ status }) => status === "active")?.count ?? 0;
  const headlineStats = [
    {
      label: t("headline.totalUsers"),
      value: formatNumber(statistics.totals.users),
      description: t("headline.verifiedEmail", {
        percent: formatPercent(statistics.totals.verifiedUsers, statistics.totals.users),
      }),
      icon: UsersRound,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: t("headline.active"),
      value: formatNumber(activeUsers),
      description: t("headline.ofTotalAccounts", {
        percent: formatPercent(activeUsers, statistics.totals.users),
      }),
      icon: BadgeCheck,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("headline.newRegistrations"),
      value: formatNumber(statistics.registrations.last30Days),
      description: t("headline.last30Days"),
      icon: UserPlus,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: t("headline.totalBalance"),
      value: formatCurrency(statistics.totals.balance),
      description: t("headline.allAccountsBalance"),
      icon: CircleDollarSign,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-5">
      <section aria-labelledby="users-statistics-summary">
        <SectionHeading id="users-statistics-summary" title={t("summary.title")} description={t("summary.description")} />
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {headlineStats.map((statistic) => {
            const Icon = statistic.icon;
            return (
              <article key={statistic.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${statistic.tone}`}>
                    <Icon className="size-4" />
                  </span>
                  <span className="text-xl font-semibold tabular-nums tracking-tight">{statistic.value}</span>
                </div>
                <p className="mt-3 text-sm font-medium">{statistic.label}</p>
                <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{statistic.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <RegistrationChart data={statistics.registrations.byDay} />

      <section aria-labelledby="users-statistics-activity">
        <SectionHeading id="users-statistics-activity" title={t("activity.title")} description={t("activity.description")} />
        <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <InlineMetric label={t("activity.today")} value={statistics.registrations.today} icon={UserPlus} />
            <InlineMetric label={t("activity.last7Days")} value={statistics.registrations.last7Days} icon={UserPlus} />
            <InlineMetric label={t("activity.last30Days")} value={statistics.registrations.last30Days} icon={UserPlus} />
          </div>
          <div className="grid border-t divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <InlineMetric label={t("activity.totalLinks")} value={statistics.totals.links} icon={Link2} />
            <InlineMetric label={t("activity.validViews7Days")} value={statistics.totals.validViewsLast7Days} icon={Eye} />
            <InlineMetric label={t("activity.activeSessions")} value={statistics.totals.activeSessions} icon={LogIn} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <BreakdownPanel title={t("statuses.title")} description={t("statuses.description")}>
          {statistics.statuses.map(({ status, count }) => {
            const config = userStatusConfig[status];
            const Icon = config.icon;
            return (
              <BreakdownRow
                key={status}
                icon={Icon}
                label={tUsers(config.labelKey)}
                count={count}
                total={statistics.totals.users}
              />
            );
          })}
        </BreakdownPanel>

        <BreakdownPanel title={t("roles.title")} description={t("roles.description")}>
          {statistics.roles.length ? statistics.roles.map((role) => (
            <BreakdownRow
              key={role.key}
              icon={UsersRound}
              label={role.name}
              detail={role.key}
              count={role.count}
              total={statistics.totals.users}
            />
          )) : <EmptyBreakdown label={t("roles.empty")} />}
        </BreakdownPanel>
      </div>

      <section aria-labelledby="users-statistics-system">
        <SectionHeading id="users-statistics-system" title={t("system.title")} description={t("system.description")} />
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <CompactMetric label={t("system.usesDefault")} value={statistics.monetization.usesDefault} description={formatPercent(statistics.monetization.usesDefault, statistics.totals.users)} />
          <CompactMetric label={t("system.assigned")} value={statistics.monetization.assigned} description={formatPercent(statistics.monetization.assigned, statistics.totals.users)} />
          <CompactMetric label={t("system.paymentMethods")} value={statistics.totals.paymentMethods} description={t("system.linked")} icon={WalletCards} />
          <CompactMetric label={t("system.withdrawals")} value={statistics.totals.withdrawals} description={t("system.createdOnSystem")} icon={CircleDollarSign} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("system.usersWithLinks", {
            count: statistics.totals.usersWithLinks,
            formatted: formatNumber(statistics.totals.usersWithLinks),
          })}
        </p>
      </section>
    </div>
  );
}

function RegistrationChart({ data }: { data: UsersStatistics["registrations"]["byDay"] }) {
  const t = useTranslations("Admin.users.statistics");
  const {
    formatNumber,
    formatDecimal,
    compactNumber,
    formatChartTick,
    formatChartDate,
  } = useFormatters();
  const [range, setRange] = React.useState<RegistrationRange>("month");
  const registrationsChartConfig = {
    count: {
      label: t("chart.newAccounts"),
      color: "var(--primary)",
    },
  } satisfies ChartConfig;
  const rangeConfig: Record<RegistrationRange, { days: number; label: string; tickInterval: number }> = {
    week: { days: 7, label: t("chart.range.week"), tickInterval: 0 },
    month: { days: 30, label: t("chart.range.month"), tickInterval: 4 },
    year: { days: 365, label: t("chart.range.year"), tickInterval: 59 },
  };
  const selected = rangeConfig[range];
  const chartData = data.slice(-selected.days);
  const total = chartData.reduce((sum, item) => sum + item.count, 0);
  const dailyAverage = chartData.length ? total / chartData.length : 0;

  return (
    <section aria-labelledby="users-registration-chart" className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex flex-col gap-3 border-b bg-muted/20 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="users-registration-chart" className="text-sm font-semibold">{t("chart.title")}</h3>
            <Badge variant="outline" className="rounded-md bg-background font-normal">
              {t("chart.accountsBadge", { count: formatNumber(total) })}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("chart.average", {
              average: formatDecimal(dailyAverage),
              range: selected.label.toLowerCase(),
            })}
          </p>
        </div>
        <div className="grid grid-cols-3 rounded-lg border bg-background p-1" role="group" aria-label={t("chart.rangeAria")}>
          {([
            ["week", t("chart.unit.week")],
            ["month", t("chart.unit.month")],
            ["year", t("chart.unit.year")],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={range === value}
              className={range === value
                ? "h-7 rounded-md bg-primary px-3 text-xs text-primary-foreground shadow-xs hover:bg-primary/90 hover:text-primary-foreground"
                : "h-7 rounded-md px-3 text-xs font-normal text-muted-foreground shadow-none"}
              onClick={() => setRange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-3 pt-4 sm:px-4">
        <ChartContainer config={registrationsChartConfig} className="h-64 w-full" initialDimension={{ width: 760, height: 256 }}>
          <BarChart data={chartData} margin={{ left: 0, right: 16, top: 8 }} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={selected.tickInterval}
              minTickGap={range === "year" ? 24 : 12}
              tickFormatter={(value: string) => formatChartTick(value, range)}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(value: number) => compactNumber(value)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(_, payload) => {
                    const date = payload?.[0]?.payload?.date as string | undefined;
                    return date ? formatChartDate(date) : "";
                  }}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[3, 3, 0, 0]}
              maxBarSize={range === "year" ? 6 : 32}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div>
      <h3 id={id} className="text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function InlineMetric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UserPlus }) {
  const { formatNumber } = useFormatters();
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-base font-semibold tabular-nums">{formatNumber(value)}</p>
      </div>
    </div>
  );
}

function BreakdownPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function BreakdownRow({ icon: Icon, label, detail, count, total }: { icon: typeof UsersRound; label: string; detail?: string; count: number; total: number }) {
  const { formatNumber } = useFormatters();
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
        {detail ? <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">{detail}</span> : null}
        <span className="text-sm font-semibold tabular-nums">{formatNumber(count)}</span>
        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="mt-2 h-1.5 bg-muted" />
    </div>
  );
}

function CompactMetric({ label, value, description, icon: Icon = ChartNoAxesCombined }: { label: string; value: number; description: string; icon?: typeof ChartNoAxesCombined }) {
  const { formatNumber } = useFormatters();
  return (
    <article className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-xs">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold tabular-nums">{formatNumber(value)}</p>
        <p className="text-xs font-medium">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}

function EmptyBreakdown({ label }: { label: string }) {
  return <p className="px-4 py-8 text-center text-xs text-muted-foreground">{label}</p>;
}

function StatisticsSkeleton() {
  const t = useTranslations("Admin.users.statistics");
  return (
    <div className="space-y-5" aria-label={t("loading")}>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

function useFormatters() {
  const locale = useLocale();
  return React.useMemo(() => {
    const number = new Intl.NumberFormat(locale);
    const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const compact = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return {
      formatNumber: (value: number) => number.format(value),
      formatCurrency: (value: string) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return `$${value}`;
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "USD",
        }).format(amount);
      },
      formatDecimal: (value: number) => decimal.format(value),
      compactNumber: (value: number) => compact.format(value),
      formatChartTick: (value: string, range: RegistrationRange) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        if (range === "year") {
          return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCFullYear()).slice(-2)}`;
        }
        return new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: "2-digit",
          timeZone: "UTC",
        }).format(date);
      },
      formatChartDate: (value: string) =>
        new Intl.DateTimeFormat(locale, {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(`${value}T00:00:00.000Z`)),
      formatPercent: (value: number, total: number) => {
        if (total <= 0) return "0%";
        return `${decimal.format((value / total) * 100)}%`;
      },
      formatDateTime: (value: string) =>
        new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(value)),
    };
  }, [locale]);
}
