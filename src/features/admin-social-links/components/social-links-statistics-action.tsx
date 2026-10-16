"use client"

import {
  Activity,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  CircleDollarSign,
  Eye,
  FileText,
  Infinity as InfinityIcon,
  Link2,
  LoaderCircle,
  PauseCircle,
  RefreshCw,
  RotateCcw,
  UsersRound,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminSocialLinksStatistics } from "@/features/admin-social-links/api/social-links.client"
import type {
  AdminSocialLinkDestinationType,
  AdminSocialLinkStatus,
  AdminSocialLinksStatistics,
} from "@/features/admin-social-links/types"

const statusLabelKeys: Record<AdminSocialLinkStatus, string> = {
  active: "stats.status.active",
  paused: "stats.status.paused",
  inactive: "stats.status.inactive",
}

const destinationLabelKeys: Record<AdminSocialLinkDestinationType, string> = {
  url: "stats.destination.url",
  file: "stats.destination.file",
  snippet: "stats.destination.snippet",
}

type StatisticsRange = AdminSocialLinksStatistics["period"]["range"]
type StatisticsFilter = { range: StatisticsRange; from?: string; to?: string }

const rangeOptions: Array<{
  value: StatisticsRange
  labelKey: string
  icon: typeof CalendarDays
}> = [
  { value: "week", labelKey: "stats.range.week", icon: CalendarDays },
  { value: "month", labelKey: "stats.range.month", icon: CalendarDays },
  { value: "year", labelKey: "stats.range.year", icon: CalendarDays },
  { value: "all", labelKey: "stats.range.all", icon: InfinityIcon },
  { value: "custom", labelKey: "stats.range.custom", icon: CalendarRange },
]

export function SocialLinksStatisticsAction() {
  const t = useTranslations("Admin.socialLinks")
  const tc = useTranslations("Admin.common")
  const f = useStatsFormatters()
  const defaultCustomDates = React.useMemo(() => getDefaultCustomDates(), [])
  const [open, setOpen] = React.useState(false)
  const [statistics, setStatistics] = React.useState<AdminSocialLinksStatistics | null>(null)
  const [selectedRange, setSelectedRange] = React.useState<StatisticsRange>("month")
  const [appliedFilter, setAppliedFilter] = React.useState<StatisticsFilter>({ range: "month" })
  const [customFrom, setCustomFrom] = React.useState(defaultCustomDates.from)
  const [customTo, setCustomTo] = React.useState(defaultCustomDates.to)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [customError, setCustomError] = React.useState("")

  const loadStatistics = React.useCallback(async (filter: StatisticsFilter) => {
    setLoading(true)
    setError("")
    try {
      const result = await getAdminSocialLinksStatistics(filter)
      setStatistics(result)
      setAppliedFilter(filter)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("stats.loadError"))
    } finally {
      setLoading(false)
    }
  }, [t])

  function openDialog() {
    setOpen(true)
    setSelectedRange("month")
    void loadStatistics({ range: "month" })
  }

  function selectRange(range: StatisticsRange) {
    setSelectedRange(range)
    setCustomError("")
    if (range !== "custom") void loadStatistics({ range })
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) {
      setCustomError(t("stats.errors.missingDates"))
      return
    }
    if (customFrom > customTo) {
      setCustomError(t("stats.errors.startAfterEnd"))
      return
    }
    if (customTo > todayDateKey()) {
      setCustomError(t("stats.errors.endInFuture"))
      return
    }
    setCustomError("")
    void loadStatistics({ range: "custom", from: customFrom, to: customTo })
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={openDialog}>
        <ChartNoAxesCombined /> {t("stats.trigger")}
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
                  <DialogTitle>{t("stats.title")}</DialogTitle>
                  <Badge variant="outline" className="rounded-md bg-background font-normal">{t("stats.scopeBadge")}</Badge>
                </div>
                <DialogDescription className="mt-1">
                  {t("stats.description")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <PeriodFilter
              selectedRange={selectedRange}
              appliedPeriod={statistics?.period}
              customFrom={customFrom}
              customTo={customTo}
              loading={loading}
              error={customError || (statistics ? error : "")}
              onSelectRange={selectRange}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
              onApplyCustom={applyCustomRange}
            />

            <div className="mt-5">
              {loading && !statistics ? <StatisticsSkeleton /> : null}
              {error && !statistics ? (
                <div className="grid min-h-72 place-items-center rounded-xl border border-dashed p-6 text-center">
                  <div>
                    <p className="text-sm font-semibold">{t("stats.loadFailedTitle")}</p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{error}</p>
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void loadStatistics(appliedFilter)}>
                      <RefreshCw /> {tc("retry")}
                    </Button>
                  </div>
                </div>
              ) : null}
              {statistics ? (
                <div className={loading ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
                  <StatisticsContent statistics={statistics} />
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col items-stretch border-t bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted-foreground">
              {statistics
                ? t("stats.footerUpdated", {
                    period: f.periodLabel(statistics.period),
                    time: f.dateTime(statistics.generatedAt),
                  })
                : t("stats.aggregating")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <DialogClose asChild><Button type="button" variant="outline">{tc("close")}</Button></DialogClose>
              <Button type="button" disabled={loading} onClick={() => void loadStatistics(appliedFilter)}>
                {loading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
                {tc("refresh")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PeriodFilter({
  selectedRange,
  appliedPeriod,
  customFrom,
  customTo,
  loading,
  error,
  onSelectRange,
  onCustomFromChange,
  onCustomToChange,
  onApplyCustom,
}: {
  selectedRange: StatisticsRange
  appliedPeriod?: AdminSocialLinksStatistics["period"]
  customFrom: string
  customTo: string
  loading: boolean
  error: string
  onSelectRange: (range: StatisticsRange) => void
  onCustomFromChange: (value: string) => void
  onCustomToChange: (value: string) => void
  onApplyCustom: () => void
}) {
  const t = useTranslations("Admin.socialLinks")
  const tc = useTranslations("Admin.common")
  const f = useStatsFormatters()
  return (
    <section className="rounded-xl border border-primary/15 bg-primary/[0.035] p-3.5" aria-labelledby="statistics-period-filter">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <CalendarRange className="size-4" />
          </span>
          <div>
            <h3 id="statistics-period-filter" className="text-sm font-semibold">{t("stats.period.title")}</h3>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {t("stats.period.description")}
            </p>
          </div>
        </div>
        {appliedPeriod ? (
          <Badge variant="outline" className="w-fit rounded-md bg-background font-normal">
            <CalendarDays className="size-3" /> {f.periodLabel(appliedPeriod)}
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5" role="group" aria-label={t("stats.period.selectRange")}>
        {rangeOptions.map(({ value, labelKey, icon: Icon }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            aria-pressed={selectedRange === value}
            className={selectedRange === value
              ? "h-9 justify-center border-primary bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:text-primary-foreground"
              : "h-9 justify-center bg-background font-normal text-muted-foreground"}
            onClick={() => onSelectRange(value)}
          >
            <Icon className="size-3.5" /> {t(labelKey)}
          </Button>
        ))}
      </div>

      {selectedRange === "custom" ? (
        <div className="mt-3 rounded-lg border bg-background p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="social-links-statistics-from" className="text-xs">{t("stats.period.fromDate")}</Label>
              <Input id="social-links-statistics-from" type="date" value={customFrom} max={todayDateKey()} onChange={(event) => onCustomFromChange(event.target.value)} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="social-links-statistics-to" className="text-xs">{t("stats.period.toDate")}</Label>
              <Input id="social-links-statistics-to" type="date" value={customTo} min={customFrom || undefined} max={todayDateKey()} onChange={(event) => onCustomToChange(event.target.value)} />
            </div>
            <Button type="button" disabled={loading} onClick={onApplyCustom}>
              {loading ? <LoaderCircle className="animate-spin" /> : <CalendarRange />}
              {tc("apply")}
            </Button>
          </div>
          <p className={`mt-2 text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>
            {error || t("stats.period.customHint")}
          </p>
        </div>
      ) : error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  )
}

function StatisticsContent({ statistics }: { statistics: AdminSocialLinksStatistics }) {
  const t = useTranslations("Admin.socialLinks")
  const f = useStatsFormatters()
  const activeLinks = statistics.statuses.find(({ status }) => status === "active")?.count ?? 0
  const periodLabel = f.periodLabel(statistics.period)
  const peakDay = statistics.creations.byDay.reduce(
    (peak, item) => item.count > peak.count ? item : peak,
    statistics.creations.byDay[0] ?? { date: statistics.period.from, count: 0 },
  )
  const activeDays = statistics.creations.byDay.filter(({ count }) => count > 0).length
  const headlineStats = [
    {
      label: t("stats.headline.newLinks"),
      value: f.number(statistics.totals.links),
      description: t("stats.headline.newLinksDesc", { period: periodLabel.toLowerCase() }),
      icon: Link2,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: t("stats.status.active"),
      value: f.number(activeLinks),
      description: t("stats.headline.activeDesc", { percent: f.percent(activeLinks, statistics.totals.links) }),
      icon: Activity,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("stats.headline.visits"),
      value: f.number(statistics.totals.views),
      description: t("stats.headline.visitsDesc"),
      icon: Eye,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: t("stats.headline.revenue"),
      value: f.currency(statistics.totals.revenue),
      description: t("stats.headline.revenueDesc"),
      icon: CircleDollarSign,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="space-y-5">
      <section aria-labelledby="social-links-statistics-summary">
        <SectionHeading id="social-links-statistics-summary" title={t("stats.summary.title")} description={t("stats.summary.description", { period: periodLabel.toLowerCase() })} />
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {headlineStats.map((statistic) => {
            const Icon = statistic.icon
            return (
              <article key={statistic.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${statistic.tone}`}><Icon className="size-4" /></span>
                  <span className="text-xl font-semibold tabular-nums tracking-tight">{statistic.value}</span>
                </div>
                <p className="mt-3 text-sm font-medium">{statistic.label}</p>
                <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{statistic.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <CreationChart data={statistics.creations.byDay} period={statistics.period} />

      <section aria-labelledby="social-links-statistics-activity">
        <SectionHeading id="social-links-statistics-activity" title={t("stats.activity.title")} description={t("stats.activity.description")} />
        <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <InlineMetric label={t("stats.activity.daysInPeriod")} value={statistics.period.days} icon={CalendarDays} />
            <InlineMetric label={t("stats.activity.daysWithNew")} value={activeDays} icon={Activity} />
            <InlineMetric label={t("stats.activity.peak", { date: f.shortDate(peakDay.date) })} value={peakDay.count} icon={ChartNoAxesCombined} />
          </div>
          <div className="grid border-t divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <InlineMetric label={t("stats.activity.newOwners")} value={statistics.totals.owners} icon={UsersRound} />
            <InlineMetric label={t("stats.activity.configuredActions")} value={statistics.totals.actions} icon={Activity} />
            <InlineMetric label={t("stats.activity.deletedLinks")} value={statistics.totals.deletedLinks} icon={RotateCcw} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <BreakdownPanel title={t("stats.breakdown.statusTitle")} description={t("stats.breakdown.statusDesc")}>
          {statistics.statuses.map(({ status, count }) => (
            <BreakdownRow key={status} icon={status === "active" ? Activity : PauseCircle} label={t(statusLabelKeys[status])} count={count} total={statistics.totals.links} />
          ))}
        </BreakdownPanel>
        <BreakdownPanel title={t("stats.breakdown.destinationTitle")} description={t("stats.breakdown.destinationDesc")}>
          {statistics.destinations.map(({ type, count }) => (
            <BreakdownRow key={type} icon={type === "url" ? Link2 : FileText} label={t(destinationLabelKeys[type])} count={count} total={statistics.totals.links} />
          ))}
        </BreakdownPanel>
      </div>

      <BreakdownPanel title={t("stats.breakdown.platformTitle")} description={t("stats.breakdown.platformDesc")}>
        {statistics.platforms.length ? statistics.platforms.slice(0, 10).map(({ platform, count }) => (
          <BreakdownRow key={platform} icon={Activity} label={formatPlatform(platform)} count={count} total={statistics.totals.actions} />
        )) : <p className="px-4 py-8 text-center text-xs text-muted-foreground">{t("stats.breakdown.noPlatforms")}</p>}
      </BreakdownPanel>
    </div>
  )
}

function CreationChart({
  data,
  period,
}: {
  data: AdminSocialLinksStatistics["creations"]["byDay"]
  period: AdminSocialLinksStatistics["period"]
}) {
  const t = useTranslations("Admin.socialLinks")
  const f = useStatsFormatters()
  const creationsChartConfig = {
    count: {
      label: t("stats.chart.newLinks"),
      color: "var(--primary)",
    },
  } satisfies ChartConfig
  const tickInterval = data.length <= 8 ? 0 : Math.max(0, Math.ceil(data.length / 7) - 1)
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const dailyAverage = data.length ? total / data.length : 0

  return (
    <section aria-labelledby="social-links-creation-chart" className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex flex-col gap-2 border-b bg-muted/20 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="social-links-creation-chart" className="text-sm font-semibold">{t("stats.chart.title")}</h3>
            <Badge variant="outline" className="rounded-md bg-background font-normal">{t("stats.chart.totalBadge", { count: f.number(total) })}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("stats.chart.average", { average: f.decimal(dailyAverage), period: f.periodLabel(period) })}
          </p>
        </div>
        <Badge className="w-fit rounded-md" variant="secondary">{t("stats.chart.followsFilter")}</Badge>
      </div>
      <div className="px-2 pb-3 pt-4 sm:px-4">
        <ChartContainer config={creationsChartConfig} className="h-64 w-full" initialDimension={{ width: 760, height: 256 }}>
          <BarChart data={data} margin={{ left: 0, right: 16, top: 8 }} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} interval={tickInterval} minTickGap={20} tickFormatter={(value: string) => f.chartTick(value, period.days)} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} tickFormatter={(value: number) => f.compact(value)} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" labelFormatter={(_, payload) => {
                const date = payload?.[0]?.payload?.date as string | undefined
                return date ? f.chartDate(date) : ""
              }} />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} maxBarSize={data.length > 120 ? 6 : 32} />
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  )
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return <div><h3 id={id} className="text-sm font-semibold">{title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>
}

function InlineMetric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Link2 }) {
  const f = useStatsFormatters()
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1"><p className="truncate text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-base font-semibold tabular-nums">{f.number(value)}</p></div>
    </div>
  )
}

function BreakdownPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="border-b bg-muted/30 px-4 py-3"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>
      <div className="divide-y">{children}</div>
    </section>
  )
}

function BreakdownRow({ icon: Icon, label, count, total }: { icon: typeof Link2; label: string; count: number; total: number }) {
  const f = useStatsFormatters()
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{f.number(count)}</span>
        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="mt-2 h-1.5 bg-muted" />
    </div>
  )
}

function StatisticsSkeleton() {
  const t = useTranslations("Admin.socialLinks")
  return (
    <div className="space-y-5" aria-label={t("stats.loadingAria")}>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}</div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
    </div>
  )
}

type Translator = ReturnType<typeof useTranslations>

function createFormatters(locale: string, t: Translator) {
  const utcDay = (value: string) => new Date(`${value}T00:00:00.000Z`)
  const number = (value: number) => new Intl.NumberFormat(locale).format(value)
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })

  return {
    number,
    currency(value: string) {
      const amount = Number(value)
      if (!Number.isFinite(amount)) return `$${value}`
      return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(amount)
    },
    decimal: (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value),
    compact: (value: number) => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value),
    chartTick(value: string, days: number) {
      const date = utcDay(value)
      if (days > 90) return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCFullYear()).slice(-2)}`
      return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date)
    },
    chartDate: (value: string) => new Intl.DateTimeFormat(locale, { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(utcDay(value)),
    shortDate: (value: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(utcDay(value)),
    periodLabel(period: AdminSocialLinksStatistics["period"]) {
      const from = dateFormatter.format(utcDay(period.from))
      const to = dateFormatter.format(utcDay(period.to))
      if (period.range === "all") return t("stats.periodAllSince", { from })
      return from === to ? from : `${from} – ${to}`
    },
    percent(value: number, total: number) {
      if (total <= 0) return "0%"
      return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format((value / total) * 100)}%`
    },
    dateTime: (value: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)),
  }
}

function useStatsFormatters() {
  const locale = useLocale()
  const t = useTranslations("Admin.socialLinks")
  return React.useMemo(() => createFormatters(locale, t), [locale, t])
}

function formatPlatform(value: string) {
  return value.split(/[-_\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function todayDateKey() {
  return toLocalDateKey(new Date())
}

function getDefaultCustomDates() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)
  return { from: toLocalDateKey(from), to: toLocalDateKey(to) }
}

function toLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}
