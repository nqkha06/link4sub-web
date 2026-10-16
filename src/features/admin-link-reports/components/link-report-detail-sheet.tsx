"use client";

import { ExternalLink, Loader2, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteAdminLinkReport,
  getAdminLinkReport,
  updateAdminLinkReport,
} from "@/features/admin-link-reports/api/admin-link-reports.client";
import {
  LinkReportReasonBadge,
  LinkReportStatusBadge,
  formatLinkReportDate,
} from "@/features/admin-link-reports/components/link-report-badges";
import { linkReportStatuses } from "@/features/admin-link-reports/query/link-reports-search-params";
import type {
  AdminLinkReport,
  LinkReportStatus,
} from "@/features/admin-link-reports/types";

export function LinkReportDetailSheet({
  reportId,
  canDelete,
  canManage,
  onOpenChange,
  onChanged,
}: {
  /** Id của báo cáo đang mở; null = đóng. */
  reportId: number | null;
  canDelete: boolean;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gọi sau khi cập nhật hoặc xoá để bảng tải lại dữ liệu. */
  onChanged: () => void;
}) {
  const t = useTranslations("Admin.linkReports");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loaded, setLoaded] = useState<AdminLinkReport>();
  const open = reportId !== null;
  const report = loaded?.id === reportId ? loaded : undefined;
  const loading = open && !report;

  useEffect(() => {
    if (reportId === null) return;
    let active = true;
    getAdminLinkReport(reportId).then(
      (result) => {
        if (active) setLoaded(result);
      },
      (failure: unknown) => {
        if (!active) return;
        toast.error(
          failure instanceof Error
            ? failure.message || t("errors.requestFailed")
            : t("errors.openFailed"),
        );
        onOpenChange(false);
      },
    );
    return () => {
      active = false;
    };
  }, [onOpenChange, reportId, t]);

  async function remove() {
    if (!report) return;
    setDeleting(true);
    try {
      await deleteAdminLinkReport(report.id);
      toast.success(t("delete.success"));
      setDeleteOpen(false);
      onOpenChange(false);
      onChanged();
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message || t("errors.requestFailed")
          : t("errors.deleteFailed"),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-5 py-4 text-left sm:px-6">
            <SheetTitle>{t("detail.title")}</SheetTitle>
            <SheetDescription>
              {report?.reference || t("detail.loading")}
            </SheetDescription>
          </SheetHeader>
          {loading || !report ? (
            <div className="space-y-4 p-5 sm:p-6">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton className="h-14 w-full" key={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <LinkReportStatusBadge status={report.status} />
                <LinkReportReasonBadge reason={report.reason} />
              </div>

              <div className="space-y-4 text-sm">
                <DetailItem label={t("detail.reference")} value={report.reference} mono />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("detail.senderEmail")}</p>
                  <a className="mt-1 inline-flex items-center gap-2 font-medium text-primary hover:underline" href={`mailto:${report.email}`}>
                    <Mail className="size-4" /> {report.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("detail.reportedUrl")}</p>
                  <a className="mt-1 flex items-start gap-2 break-all font-medium text-primary hover:underline" href={report.reportedUrl} rel="noreferrer" target="_blank">
                    <ExternalLink className="mt-0.5 size-4 shrink-0" /> {report.reportedUrl}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("detail.details")}</p>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 leading-6">{report.details}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label={t("detail.sentAt")} value={formatLinkReportDate(report.createdAt, locale)} />
                  <DetailItem label={t("detail.updatedAt")} value={formatLinkReportDate(report.updatedAt, locale)} />
                  <DetailItem label={t("table.columns.reviewer")} value={report.reviewedBy?.name || t("table.noReviewer")} />
                  <DetailItem label={t("detail.resolvedAt")} value={report.resolvedAt ? formatLinkReportDate(report.resolvedAt, locale) : t("detail.notResolved")} />
                </div>
              </div>

              <Separator />

              {canManage ? (
                <ReportReviewForm
                  key={`${report.id}-${report.updatedAt}`}
                  onUpdated={(updated) => {
                    setLoaded(updated);
                    onChanged();
                  }}
                  report={report}
                />
              ) : report.resolutionNote ? (
                <DetailItem label={t("review.note")} value={report.resolutionNote} />
              ) : null}

              {canDelete ? (
                <div className="border-t pt-5">
                  <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 /> {t("detail.deleteButton")}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={(next) => !deleting && setDeleteOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.bulkTitle", { count: 1 })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
              variant="destructive"
            >
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {deleting ? t("delete.deleting") : t("detail.deleteButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ReportReviewForm({
  onUpdated,
  report,
}: {
  onUpdated: (report: AdminLinkReport) => void;
  report: AdminLinkReport;
}) {
  const t = useTranslations("Admin.linkReports");
  const [status, setStatus] = useState(report.status);
  const [resolutionNote, setResolutionNote] = useState(report.resolutionNote || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await updateAdminLinkReport(report.id, {
        status,
        resolutionNote: resolutionNote.trim(),
      });
      onUpdated(updated);
      toast.success(t("review.success"));
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message || t("errors.requestFailed")
          : t("errors.updateFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="report-status">{t("review.status")}</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as LinkReportStatus)}>
          <SelectTrigger className="w-full" id="report-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            {linkReportStatuses.map((item) => (
              <SelectItem key={item} value={item}>{t(`status.${item}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="resolution-note">{t("review.note")}</Label>
        <Textarea
          id="resolution-note"
          maxLength={2_000}
          onChange={(event) => setResolutionNote(event.target.value)}
          placeholder={t("review.notePlaceholder")}
          rows={5}
          value={resolutionNote}
        />
      </div>
      <Button disabled={saving} onClick={() => void save()}>
        {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
        {saving ? t("review.saving") : t("review.save")}
      </Button>
    </div>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 break-words ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}
