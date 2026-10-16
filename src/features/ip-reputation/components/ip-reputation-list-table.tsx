"use client";

import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IpReputationDetailSheet } from "@/features/ip-reputation/components/ip-reputation-detail-sheet";
import { formatIpReputationDate, reputationStatusOptions } from "@/features/ip-reputation/status-labels";
import type { IpReputationListItem } from "@/features/ip-reputation/types";
import { cn } from "@/lib/utils";

export function IpReputationListTable({ items }: { items: IpReputationListItem[] }) {
  const t = useTranslations("Admin.ipReputation");
  const locale = useLocale();
  const [selected, setSelected] = React.useState<string | null>(null);

  if (!items.length) {
    return (
      <p className="rounded-xl border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        {t("table.empty")}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.ip")}</TableHead>
              <TableHead>{t("table.firstBad")}</TableHead>
              <TableHead>{t("table.lastBad")}</TableHead>
              <TableHead>{t("table.dirtyUntil")}</TableHead>
              <TableHead className="text-right">{t("table.confirmedCount")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const status = reputationStatusOptions[item.status];
              return (
                <TableRow
                  key={item.ip}
                  className="cursor-pointer"
                  onClick={() => item.ip && setSelected(item.ip)}
                >
                  <TableCell className="font-mono text-xs">{item.ip}</TableCell>
                  <TableCell>{formatIpReputationDate(item.firstBadAt, locale)}</TableCell>
                  <TableCell>{formatIpReputationDate(item.lastBadAt, locale)}</TableCell>
                  <TableCell>{formatIpReputationDate(item.dirtyUntil, locale)}</TableCell>
                  <TableCell className="text-right">{item.confirmedCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("whitespace-nowrap font-medium", status.badgeClassName)}>
                      <span className={cn("size-1.5 rounded-full", status.dotClassName)} />
                      {t(status.labelKey)}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {selected ? (
        <IpReputationDetailSheet ip={selected} onOpenChange={(open) => !open && setSelected(null)} />
      ) : null}
    </>
  );
}
