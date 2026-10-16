"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  CircleDollarSign,
  LoaderCircle,
  Network,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { getAdminAccessLog } from "../api/access-logs.client";
import type { AdminAccessLog, AdminAccessLogDetail } from "../types";
import { DetectionBadge, formatMoney } from "./access-logs-table-columns";

export function AccessLogDetailSheet({
  log,
  onOpenChange,
}: {
  log: AdminAccessLog;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Admin.accessLogs");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [detail, setDetail] = React.useState<AdminAccessLogDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    void getAdminAccessLog(log.id)
      .then((result) => {
        if (!active) return;
        setDetail(result);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message || t("errors.requestFailed")
              : t("errors.detailFailed"),
          );
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [log.id, t]);

  const item = detail || log;
  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="border-b p-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <SheetTitle>{t("detail.title")}</SheetTitle>
              <SheetDescription className="truncate font-mono text-xs">
                {log.id}
              </SheetDescription>
            </div>
            <DetectionBadge log={item} />
          </div>
        </SheetHeader>
        <div className="space-y-6 px-6 pb-8">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> {t("detail.loadingRelated")}
            </p>
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>{t("detail.loadIncomplete")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2">
            <InfoCard icon={UserRound} label={t("columns.user")}>
              <Link href={`/admin/users/${item.user.id}`} className="font-medium hover:underline">
                {item.user.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{item.user.email}</p>
            </InfoCard>
            <InfoCard icon={Activity} label={t("columns.link")}>
              <p className="font-medium">{item.link.title}</p>
              <p className="truncate text-xs text-muted-foreground">#{item.link.id} · /{item.link.slug}</p>
            </InfoCard>
          </section>

          <section>
            <h3 className="text-sm font-medium">{t("detail.requestData")}</h3>
            <dl className="mt-3 divide-y rounded-xl border px-4 text-sm">
              <DetailRow label={t("columns.time")} value={formatTimestamp(item.createdAt, locale)} />
              <DetailRow label={t("columns.ip")} value={item.ipAddress || "—"} mono />
              <DetailRow label={t("columns.country")} value={item.country || "ZZ"} />
              <DetailRow label={t("columns.device")} value={item.deviceLabel} />
              {detail ? <>
                <DetailRow label={t("detail.monetizationLevel")} value={detail.level?.name || tc("none")} />
                <DetailRow label={t("detail.agentHash")} value={detail.agentHash} mono />
                <DetailRow label={t("detail.userAgent")} value={detail.userAgent.raw} />
                <DetailRow label={t("detail.browserOs")} value={`${detail.userAgent.browser} / ${detail.userAgent.os}`} />
                <DetailRow label={t("detail.referrer")} value={detail.referrer || "—"} />
              </> : null}
            </dl>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium"><CircleDollarSign className="size-4" /> {t("detail.processingResult")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Metric label={t("columns.revenue")} value={formatMoney(item.revenue, locale)} />
              <Metric label={t("columns.isEarn")} value={item.isEarn ? tc("yes") : tc("no")} />
              <Metric label={t("detail.payoutCpm")} value={detail ? formatMoney(detail.payoutCpm, locale) : "—"} />
            </div>
            <dl className="mt-3 divide-y rounded-xl border px-4 text-sm">
              <DetailRow label={t("detail.detectionMask")} value={`${item.detectionMask}${item.detectionReasons.length ? ` · ${item.detectionReasons.join(", ")}` : ""}`} />
              <DetailRow label={t("detail.rejectReasonMask")} value={`${item.rejectReasonMask}${item.rejectReasons.length ? ` · ${item.rejectReasons.join(", ")}` : ""}`} />
              <DetailRow label={t("detail.completedAt")} value={item.completedAt ? formatTimestamp(item.completedAt, locale) : t("detail.notCompleted")} />
              <DetailRow label={t("detail.processedAt")} value={item.processedAt ? formatTimestamp(item.processedAt, locale) : t("detail.notProcessed")} />
            </dl>
          </section>

          {detail ? (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-medium"><Network className="size-4" /> {t("detail.relatedSignals")}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label={t("detail.sameIp1h")} value={detail.related.sameIp1h} />
                <Metric label={t("detail.sameIp24h")} value={detail.related.sameIp24h} />
                <Metric label={t("detail.sameIpOwners")} value={detail.related.distinctLinkOwnerCount} />
                <Metric label={t("detail.sameAgent24h")} value={detail.related.sameAgent24h} />
                <Metric label={t("detail.sameIpLinks")} value={detail.related.links.length} />
                <Metric label={t("detail.ipRevenue24h")} value={formatMoney(detail.related.ipRevenue24h, locale)} />
              </div>
              <Button variant="outline" className="mt-3" asChild>
                <Link href={`/admin/users/${item.user.id}/access-analysis`}>
                  <Bot /> {t("detail.analyzeUser")}
                </Link>
              </Button>
            </section>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoCard({ icon: Icon, label, children }: { icon: typeof UserRound; label: string; children: React.ReactNode }) {
  return <div className="rounded-xl border bg-muted/20 p-4"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4" /> {label}</p><div className="mt-2">{children}</div></div>;
}
function Metric({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular-nums">{value}</p></div>; }
function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-4 py-3"><dt className="text-muted-foreground">{label}</dt><dd className={`break-all text-right font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</dd></div>; }
function formatTimestamp(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value)); }
