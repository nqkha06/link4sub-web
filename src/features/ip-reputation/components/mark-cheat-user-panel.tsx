"use client";

import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  confirmCheatUserImport,
  getCheatUserPreview,
} from "@/features/ip-reputation/api/ip-reputation.client";
import { formatIpReputationDate } from "@/features/ip-reputation/status-labels";
import type { CheatUserPreview } from "@/features/ip-reputation/types";

export function MarkCheatUserPanel({ onImported }: { onImported?: () => void }) {
  const t = useTranslations("Admin.ipReputation.markCheat");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const permissions = useAdminPermissions();
  const canManage = permissions.includes("ip_reputation.manage");
  const [userId, setUserId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<CheatUserPreview | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState("");

  async function scan() {
    const parsed = Number(userId);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      setError(t("invalidUserId"));
      return;
    }
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const result = await getCheatUserPreview(parsed);
      setPreview(result);
      if (!result.ips.length) {
        toast.info(t("noHistory"));
      }
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : t("loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function confirmImport() {
    if (!preview) return;
    setConfirming(true);
    try {
      const result = await confirmCheatUserImport(preview.user.id);
      toast.success(t("imported", { count: result.imported.length }));
      setConfirmOpen(false);
      onImported?.();
      await scan();
    } catch (confirmError) {
      toast.error(
        confirmError instanceof Error
          ? confirmError.message
          : t("importFailed"),
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="mark-cheat-user-id">{t("userIdLabel")}</Label>
          <Input
            id="mark-cheat-user-id"
            inputMode="numeric"
            placeholder={t("userIdPlaceholder")}
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void scan();
            }}
          />
        </div>
        <Button onClick={() => void scan()} disabled={loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t("scan")}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {preview ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("previewSummary", { name: preview.user.name, email: preview.user.email, count: preview.ips.length })}
          </p>
          {preview.ips.length ? (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>{t("firstSeen")}</TableHead>
                    <TableHead>{t("lastSeen")}</TableHead>
                    <TableHead className="text-right">{t("hits")}</TableHead>
                    <TableHead>{t("currentReputation")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.ips.map((item) => (
                    <TableRow key={item.ip}>
                      <TableCell className="font-mono text-xs">{item.ip}</TableCell>
                      <TableCell>{formatIpReputationDate(item.firstSeen, locale)}</TableCell>
                      <TableCell>{formatIpReputationDate(item.lastSeen, locale)}</TableCell>
                      <TableCell className="text-right">{item.hitCount}</TableCell>
                      <TableCell>
                        {item.existingReputation
                          ? t("confirmedCountValue", { count: item.existingReputation.confirmedCount })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {canManage && preview.ips.length ? (
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <ShieldAlert className="size-4" />
              {t("confirmButton", { count: preview.ips.length })}
            </Button>
          ) : null}
        </div>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogDescription", { count: preview?.ips.length ?? 0, userId: preview?.user.id ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={confirming} onClick={() => void confirmImport()}>
              {confirming ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {t("confirmImport")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
