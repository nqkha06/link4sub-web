"use client";

import {
  AlertTriangle,
  DatabaseZap,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  getSystemCleanupOverviewClient,
  runSystemCleanup,
} from "../api/system-cleanup.client";
import type {
  SystemCleanupOverview,
  SystemCleanupTarget,
} from "../types";

type Props = {
  initialOverview: SystemCleanupOverview;
  canDelete: boolean;
};

const RETENTION_OPTIONS = [7, 30, 90, 180, 365] as const;

const GROUPS: Array<{
  key: "temporary" | "logs";
  targets: SystemCleanupTarget[];
}> = [
  {
    key: "temporary",
    targets: [
      "expired_sessions",
      "password_reset_tokens",
      "email_verification_tokens",
      "worker_log_files",
    ],
  },
  {
    key: "logs",
    targets: [
      "system_logs",
      "access_logs",
      "audit_logs",
      "email_history",
    ],
  },
];

export function SystemCleanupDashboard({
  initialOverview,
  canDelete,
}: Props) {
  const t = useTranslations("Admin.systemCleanup");
  const router = useRouter();
  const [overview, setOverview] = React.useState(initialOverview);
  const [days, setDays] = React.useState(initialOverview.olderThanDays);
  const [selected, setSelected] = React.useState<Set<SystemCleanupTarget>>(
    new Set(),
  );
  const [loading, setLoading] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const inventory = React.useMemo(
    () => new Map(overview.items.map((item) => [item.target, item])),
    [overview.items],
  );
  const selectedItems = overview.items.filter((item) =>
    selected.has(item.target),
  );
  const selectedCount = selectedItems.reduce(
    (total, item) => total + item.eligibleCount,
    0,
  );

  async function refresh(nextDays = days) {
    setLoading(true);
    try {
      const next = await getSystemCleanupOverviewClient(nextDays);
      setOverview(next);
      setSelected((current) =>
        new Set(
          [...current].filter(
            (target) =>
              (next.items.find((item) => item.target === target)
                ?.eligibleCount ?? 0) > 0,
          ),
        ),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function changeDays(value: string) {
    const nextDays = Number(value);
    setDays(nextDays);
    await refresh(nextDays);
  }

  function toggle(target: SystemCleanupTarget, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(target);
      else next.delete(target);
      return next;
    });
  }

  async function confirmCleanup() {
    if (!selected.size) return;
    setLoading(true);
    try {
      const result = await runSystemCleanup({
        targets: [...selected],
        olderThanDays: days,
      });
      toast.success(t("success", { count: result.deletedCount }));
      setSelected(new Set());
      setConfirming(false);
      await refresh(days);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="gap-4">
        <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <DatabaseZap className="size-5 text-primary" />
              {t("retention.title")}
            </CardTitle>
            <CardDescription>{t("retention.description")}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(days)}
              onValueChange={changeDays}
              disabled={loading}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETENTION_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {t("retention.days", { count: value })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              disabled={loading}
              onClick={() => refresh()}
              aria-label={t("refresh")}
            >
              <RefreshCw className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {GROUPS.map((group) => (
        <Card key={group.key} className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-5">
            <CardTitle>{t(`groups.${group.key}.title`)}</CardTitle>
            <CardDescription>
              {t(`groups.${group.key}.description`)}
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y px-0">
            {group.targets.map((target) => {
              const item = inventory.get(target);
              const eligibleCount = item?.eligibleCount ?? 0;
              const disabled = !canDelete || loading || eligibleCount === 0;
              return (
                <label
                  key={target}
                  className={cn(
                    "flex gap-3 px-5 py-4 transition-colors sm:px-6",
                    disabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={selected.has(target)}
                    disabled={disabled}
                    onCheckedChange={(value) => toggle(target, value === true)}
                    aria-label={t(`items.${target}.title`)}
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {t(`items.${target}.title`)}
                      </span>
                      <Badge variant="secondary" className="tabular-nums">
                        {t("count", { count: eligibleCount })}
                      </Badge>
                    </span>
                    <span className="block text-sm leading-6 text-muted-foreground">
                      {t(`items.${target}.description`, { days })}
                    </span>
                    {item && item.totalCount !== eligibleCount ? (
                      <span className="block text-xs text-muted-foreground">
                        {t("total", { count: item.totalCount })}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Card className="border-emerald-500/25 bg-emerald-500/[0.04]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-5 text-emerald-600" />
            {t("protected.title")}
          </CardTitle>
          <CardDescription>{t("protected.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {overview.protectedData.map((key) => (
            <Badge key={key} variant="outline">
              {t(`protected.items.${key}`)}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">
            {t("selection", {
              targets: selected.size,
              count: selectedCount,
            })}
          </p>
          {!canDelete ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("noPermission")}
            </p>
          ) : null}
        </div>
        <Button
          variant="destructive"
          disabled={!canDelete || !selected.size || loading}
          onClick={() => setConfirming(true)}
        >
          <Trash2 />
          {t("action")}
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              {t("dialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.description", {
                targets: selected.size,
                count: selectedCount,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-3">
            {selectedItems.map((item) => (
              <div
                key={item.target}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>{t(`items.${item.target}.title`)}</span>
                <span className="font-medium tabular-nums">
                  {t("count", { count: item.eligibleCount })}
                </span>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {t("dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={loading}
              onClick={(event) => {
                event.preventDefault();
                void confirmCleanup();
              }}
            >
              {loading ? <RefreshCw className="animate-spin" /> : <Trash2 />}
              {t("dialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}
