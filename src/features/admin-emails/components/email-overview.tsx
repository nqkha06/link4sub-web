"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmailOverview } from "../api/emails.client";
import type { EmailOverview } from "../types";
import { EmailEmptyState, EmailMetricCard, EmailStatusBadge, useFormatEmailDate } from "./email-ui";

export function EmailOverviewTab({
  initialData,
  onData,
}: {
  initialData: EmailOverview | null;
  onData: (data: EmailOverview) => void;
}) {
  const t = useTranslations("Admin.emails");
  const locale = useLocale();
  const formatEmailDate = useFormatEmailDate();
  const [data, setData] = React.useState<EmailOverview | null>(initialData);
  const [range, setRange] = React.useState<"7d" | "30d" | "90d" | "custom">("30d");
  const [mailType, setMailType] = React.useState<"all" | "transactional" | "marketing">("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [loading, setLoading] = React.useState(!initialData);

  const load = React.useCallback(async () => {
    if (range === "custom" && (!dateFrom || !dateTo)) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ range, mailType });
      if (range === "custom") {
        params.set("dateFrom", new Date(`${dateFrom}T00:00:00`).toISOString());
        params.set("dateTo", new Date(`${dateTo}T23:59:59.999`).toISOString());
      }
      const next = await getEmailOverview(params);
      setData(next);
      onData(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("overview.loadError"));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, mailType, onData, range, t]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  if (loading && !data) return <EmailOverviewSkeleton />;
  if (!data) return <EmailEmptyState title={t("overview.loadFailedTitle")} description={t("overview.loadFailedDescription")} warning />;

  const metrics = data.metrics;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={range} onValueChange={(value) => setRange(value as typeof range)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t("overview.range7")}</SelectItem>
              <SelectItem value="30d">{t("overview.range30")}</SelectItem>
              <SelectItem value="90d">{t("overview.range90")}</SelectItem>
              <SelectItem value="custom">{t("overview.rangeCustom")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mailType} onValueChange={(value) => setMailType(value as typeof mailType)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("overview.allMailTypes")}</SelectItem>
              <SelectItem value="transactional">{t("category.transactional")}</SelectItem>
              <SelectItem value="marketing">{t("category.marketing")}</SelectItem>
            </SelectContent>
          </Select>
          {range === "custom" ? (
            <>
              <Input type="date" aria-label={t("filters.fromDate")} value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-40" />
              <Input type="date" aria-label={t("filters.toDate")} value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-40" />
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatEmailDate(data.period.from)} — {formatEmailDate(data.period.to)}</span>
          <Button variant="outline" size="icon-sm" onClick={() => void load()} aria-label={t("overview.refreshAria")}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {data.reputation.status === "warning" ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>{t("overview.reputationWarning")}</AlertTitle>
          <AlertDescription>{data.reputation.message}</AlertDescription>
        </Alert>
      ) : null}

      <section aria-label={t("overview.metricsAria")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <EmailMetricCard label={t("overview.totalSent")} value={metrics.totalSent.toLocaleString(locale)} />
        <EmailMetricCard label={t("overview.delivered")} value={metrics.delivered.toLocaleString(locale)} hint={t("overview.deliveryRateHint", { rate: metrics.deliveryRate })} tone="positive" />
        <EmailMetricCard label={t("overview.failed")} value={metrics.failed.toLocaleString(locale)} tone={metrics.failed ? "negative" : "neutral"} />
        <EmailMetricCard label={t("overview.bounced")} value={metrics.bounced.toLocaleString(locale)} hint={t("overview.bounceRateHint", { rate: metrics.bounceRate })} tone={metrics.bounced ? "warning" : "neutral"} />
        <EmailMetricCard label={t("overview.complaints")} value={metrics.complaints.toLocaleString(locale)} hint={t("overview.complaintRateHint", { rate: metrics.complaintRate })} tone={metrics.complaints ? "negative" : "neutral"} />
        <EmailMetricCard label={t("overview.unsubscribes")} value={metrics.unsubscribes.toLocaleString(locale)} hint={t("overview.marketingOnly")} />
        <EmailMetricCard label={t("overview.deliveryRate")} value={`${metrics.deliveryRate}%`} tone="positive" />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label={t("overview.healthAria")}>
        <HealthCard title={t("overview.sesConfiguration")} status={data.health.sesConfiguration.status} value={data.health.sesConfiguration.message} />
        <HealthCard title={t("overview.domainAuthentication")} status={data.health.domainAuthentication.status} value={data.health.domainAuthentication.message} />
        <HealthCard title={t("overview.transactionalSender")} status={data.health.defaultTransactionalSender?.status || "pending"} value={data.health.defaultTransactionalSender?.emailAddress || t("overview.senderNotConfigured")} />
        <HealthCard title={t("overview.marketingSender")} status={data.health.defaultMarketingSender?.status || "pending"} value={data.health.defaultMarketingSender?.emailAddress || t("overview.senderNotConfigured")} />
        <HealthCard
          title={t("overview.sendingControls")}
          status={data.health.transactionalEnabled && data.health.marketingEnabled ? "active" : "pending"}
          value={t("overview.sendingControlsValue", { transactional: data.health.transactionalEnabled ? t("overview.on") : t("overview.paused"), marketing: data.health.marketingEnabled ? t("overview.on") : t("overview.paused") })}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-5">
            <CardTitle>{t("overview.deliveryTrend")}</CardTitle>
            <CardDescription>{t("overview.deliveryTrendDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.deliveryTrend.length ? (
              <div className="h-[340px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.deliveryTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emailSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(value) => value.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", borderRadius: 8 }} />
                    <Legend />
                    <Area type="monotone" dataKey="sent" name={t("overview.chartSent")} stroke="var(--primary)" fill="url(#emailSent)" strokeWidth={2} />
                    <Area type="monotone" dataKey="delivered" name={t("overview.delivered")} stroke="var(--success)" fill="transparent" strokeWidth={2} />
                    <Area type="monotone" dataKey="failed" name={t("overview.failed")} stroke="var(--destructive)" fill="transparent" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmailEmptyState title={t("activity.emptyTitle")} description={data.dataAvailability.message || t("overview.noEmailInRange")} />
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-5">
            <CardTitle>{t("overview.criticalEvents")}</CardTitle>
            <CardDescription>{t("overview.criticalEventsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentCriticalEvents.length ? (
              <ul className="divide-y">
                {data.recentCriticalEvents.map((event) => (
                  <li key={event.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <EmailStatusBadge status="failed" label={event.type.replaceAll("_", " ")} />
                      <time className="text-xs text-muted-foreground">{formatEmailDate(event.occurredAt)}</time>
                    </div>
                    <p className="mt-2 truncate text-sm font-medium">{event.message.subject}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{event.message.failureMessage || event.message.recipientEmail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmailEmptyState title={t("overview.noCriticalTitle")} description={t("overview.noCriticalDescription")} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-5">
          <CardTitle>{t("overview.topTemplates")}</CardTitle>
          <CardDescription>{t("overview.topTemplatesDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.topTemplates.length ? (
            <div className="divide-y">
              {data.topTemplates.map((item) => (
                <div key={item.template.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-5 py-3">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{item.template.name}</p><p className="truncate font-mono text-xs text-muted-foreground">{item.template.code}</p></div>
                  <div className="text-right"><p className="text-sm font-medium tabular-nums">{item.sent}</p><p className="text-xs text-muted-foreground">{t("overview.sentLower")}</p></div>
                  <div className="w-24 text-right"><p className="text-sm font-medium tabular-nums">{item.failureRate}%</p><p className="text-xs text-muted-foreground">{t("overview.failureLower")}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <EmailEmptyState title={t("overview.notEnoughDataTitle")} description={t("overview.notEnoughDataDescription")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HealthCard({ title, status, value }: { title: string; status: string; value: string }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{title}</p><EmailStatusBadge status={status} className="px-1.5" /></div>
        <p className="mt-3 line-clamp-2 text-sm font-medium leading-5">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmailOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]"><Skeleton className="h-96 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>
    </div>
  );
}
