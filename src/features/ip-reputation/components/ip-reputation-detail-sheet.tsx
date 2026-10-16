"use client";

import { LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getIpReputationDetail } from "@/features/ip-reputation/api/ip-reputation.client";
import { formatIpReputationDate, reputationStatusOptions } from "@/features/ip-reputation/status-labels";
import type { IpReputationDetail } from "@/features/ip-reputation/types";
import { cn } from "@/lib/utils";

export function IpReputationDetailSheet({
  ip,
  onOpenChange,
}: {
  ip: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Admin.ipReputation");
  const locale = useLocale();
  const [detail, setDetail] = React.useState<IpReputationDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    void getIpReputationDetail(ip)
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("detail.loadFailed"),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ip, t]);

  const status = detail ? reputationStatusOptions[detail.status] : null;

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b p-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <SheetTitle className="font-mono">{ip}</SheetTitle>
              <SheetDescription>{t("detail.description")}</SheetDescription>
            </div>
            {status ? (
              <Badge variant="outline" className={cn("whitespace-nowrap font-medium", status.badgeClassName)}>
                <span className={cn("size-1.5 rounded-full", status.dotClassName)} />
                {t(status.labelKey)}
              </Badge>
            ) : null}
          </div>
        </SheetHeader>
        <div className="space-y-6 px-6 pb-8 pt-4">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle className="size-3.5 animate-spin" />
              {t("loading")}
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {detail ? (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border bg-muted/20 p-3">
                  <dt className="text-xs text-muted-foreground">{t("table.firstBad")}</dt>
                  <dd className="mt-1 font-medium">{formatIpReputationDate(detail.firstBadAt, locale)}</dd>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <dt className="text-xs text-muted-foreground">{t("table.lastBad")}</dt>
                  <dd className="mt-1 font-medium">{formatIpReputationDate(detail.lastBadAt, locale)}</dd>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <dt className="text-xs text-muted-foreground">{t("table.dirtyUntil")}</dt>
                  <dd className="mt-1 font-medium">{formatIpReputationDate(detail.dirtyUntil, locale)}</dd>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <dt className="text-xs text-muted-foreground">{t("table.confirmedCount")}</dt>
                  <dd className="mt-1 font-medium">{detail.confirmedCount}</dd>
                </div>
              </dl>
              <div>
                <h3 className="text-sm font-medium">
                  {t("detail.evidenceTitle", { count: detail.evidences.length })}
                </h3>
                <div className="mt-3 overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("detail.cheatUser")}</TableHead>
                        <TableHead>{t("detail.firstSeen")}</TableHead>
                        <TableHead>{t("detail.lastSeen")}</TableHead>
                        <TableHead className="text-right">{t("detail.hits")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.evidences.map((evidence) => (
                        <TableRow key={evidence.sourceUser.id}>
                          <TableCell>
                            <div className="font-medium">{evidence.sourceUser.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {evidence.sourceUser.email}
                            </div>
                          </TableCell>
                          <TableCell>{formatIpReputationDate(evidence.firstSeen, locale)}</TableCell>
                          <TableCell>{formatIpReputationDate(evidence.lastSeen, locale)}</TableCell>
                          <TableCell className="text-right">{evidence.hitCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
