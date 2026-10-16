"use client";

import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getWithdrawalIpReputationScan } from "@/features/ip-reputation/api/ip-reputation.client";
import {
  formatIpReputationDate,
  reputationStatusOptions,
  riskLevelOptions,
  temporalMatchOptions,
} from "@/features/ip-reputation/status-labels";
import type { WithdrawalScanResult } from "@/features/ip-reputation/types";
import { cn } from "@/lib/utils";

/**
 * Chỉ là risk signal hỗ trợ admin review — KHÔNG tự động ban/suspend/reject
 * withdrawal. Component này chỉ đọc, không có action nào thay đổi withdrawal/user.
 */
export function WithdrawalIpScanPanel({ userId }: { userId: number }) {
  const t = useTranslations("Admin.ipReputation");
  const locale = useLocale();
  const [scan, setScan] = React.useState<WithdrawalScanResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [started, setStarted] = React.useState(false);

  async function runScan() {
    setStarted(true);
    setLoading(true);
    setError("");
    try {
      const result = await getWithdrawalIpReputationScan(userId);
      setScan(result);
    } catch (scanError) {
      setError(
        scanError instanceof Error ? scanError.message : t("scan.failed"),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!started) {
    return (
      <Button variant="outline" size="sm" onClick={() => void runScan()}>
        <ShieldAlert className="size-4" />
        {t("scan.start")}
      </Button>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="size-4 text-muted-foreground" />
          {t("scan.title")}
        </h3>
        {loading ? <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" /> : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {scan ? (
        <>
          <div className="flex items-center gap-2">
            {(() => {
              const risk = riskLevelOptions[scan.riskLevel];
              return (
                <Badge variant="outline" className={cn("whitespace-nowrap font-medium", risk.badgeClassName)}>
                  <span className={cn("size-1.5 rounded-full", risk.dotClassName)} />
                  {t(risk.labelKey)}
                </Badge>
              );
            })()}
            <span className="text-xs text-muted-foreground">
              {t("scan.historyCount", { count: scan.ips.length })}
            </span>
          </div>
          {scan.ips.length ? (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>{t("scan.userFirstLastSeen")}</TableHead>
                    <TableHead>{t("scan.reputationDirtyUntil")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead>{t("scan.match")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scan.ips.map((item) => {
                    const status = reputationStatusOptions[item.reputationStatus];
                    const match = temporalMatchOptions[item.temporalMatch];
                    return (
                      <TableRow key={item.ip}>
                        <TableCell className="font-mono text-xs">{item.ip}</TableCell>
                        <TableCell className="text-xs">
                          {formatIpReputationDate(item.userFirstSeen, locale)} –{" "}
                          {formatIpReputationDate(item.userLastSeen, locale)} {t("scan.hitsInline", { count: item.userHitCount })}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.reputation ? (
                            <>
                              {formatIpReputationDate(item.reputation.dirtyUntil, locale)}{" "}
                              {t("scan.confirmedInline", { count: item.reputation.confirmedCount })}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("whitespace-nowrap font-medium", status.badgeClassName)}>
                            <span className={cn("size-1.5 rounded-full", status.dotClassName)} />
                            {t(status.labelKey)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("whitespace-nowrap font-medium", match.badgeClassName)}>
                            <span className={cn("size-1.5 rounded-full", match.dotClassName)} />
                            {t(match.labelKey)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              {t("scan.noHistory")}
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
