"use client";

import {
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MousePointerClick,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ElementType } from "react";
import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteAdminBioPage,
  updateAdminBioPageStatus,
} from "@/features/admin-bio-pages/api/admin-bio-pages.client";
import type {
  AdminBioPageListItem,
  BioPageStatus,
} from "@/features/admin-bio-pages/types";

import { formatDate, StatusBadge } from "./bio-page-status-badge";

export function BioPageDetailSheet({
  canDelete,
  canManage,
  loading,
  onDeleted,
  onOpenChange,
  onUpdated,
  open,
  page,
}: {
  canDelete: boolean;
  canManage: boolean;
  loading: boolean;
  onDeleted: () => void;
  onOpenChange: (open: boolean) => void;
  onUpdated: (page: AdminBioPageListItem) => void;
  open: boolean;
  page?: AdminBioPageListItem;
}) {
  const t = useTranslations("Admin.bioPages");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function remove() {
    if (!page) return;
    setDeleting(true);
    try {
      await deleteAdminBioPage(page.id);
      toast.success(t("delete.success"));
      setDeleteOpen(false);
      onDeleted();
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

  async function toggleStatus() {
    if (!page) return;
    const nextStatus: BioPageStatus = page.status === "published" ? "draft" : "published";
    setToggling(true);
    try {
      const updated = await updateAdminBioPageStatus(page.id, nextStatus);
      onUpdated(updated);
      toast.success(
        nextStatus === "published" ? t("detail.publishSuccess") : t("detail.unpublishSuccess"),
      );
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message || t("errors.requestFailed")
          : t("errors.statusFailed"),
      );
    } finally {
      setToggling(false);
    }
  }

  const contentEntries = page
    ? (Object.entries(page.contentSummary) as Array<
        [keyof AdminBioPageListItem["contentSummary"], number]
      >).filter(([, value]) => value > 0)
    : [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-5 py-4 text-left sm:px-6">
            <SheetTitle>{t("detail.title")}</SheetTitle>
            <SheetDescription>
              {page?.name || t("detail.loading")}
            </SheetDescription>
          </SheetHeader>
          {loading || !page ? (
            <div className="space-y-4 p-5 sm:p-6">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton className="h-14 w-full" key={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={page.status} />
                {page.title ? <Badge variant="secondary">{page.title}</Badge> : null}
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("table.columns.owner")}</p>
                  {page.owner ? (
                    <div className="mt-1 space-y-1">
                      <p className="inline-flex items-center gap-2 font-medium">
                        <UserRound className="size-4" /> {page.owner.name}
                      </p>
                      <a className="flex items-center gap-2 text-primary hover:underline" href={`mailto:${page.owner.email}`}>
                        <Mail className="size-4" /> {page.owner.email}
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1 text-muted-foreground">{t("table.unknownOwner")}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("detail.publicPath")}</p>
                  <p className="mt-1 font-mono text-xs">{publicPath(page.publicUrl)}</p>
                  {page.status === "published" ? (
                    <a
                      className="mt-2 inline-flex items-center gap-2 font-medium text-primary hover:underline"
                      href={page.publicUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="size-4" /> {t("detail.openPublic")}
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("detail.draftNotice")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DetailStat icon={Eye} label={t("table.columns.views")} value={page.views} />
                  <DetailStat icon={MousePointerClick} label={t("table.columns.clicks")} value={page.clicks} />
                </div>

                {contentEntries.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t("detail.content")}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {contentEntries.map(([key, value]) => (
                        <Badge key={key} variant="outline">
                          {t(`content.${key}`, { count: value })}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label={t("detail.publishedAt")} value={page.publishedAt ? formatDate(page.publishedAt, locale) : t("detail.notPublished")} />
                  <DetailItem label={t("detail.createdAt")} value={formatDate(page.createdAt, locale)} />
                  <DetailItem label={t("table.columns.updated")} value={formatDate(page.updatedAt, locale)} />
                </div>
              </div>

              {canManage || canDelete ? (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {canManage ? (
                      <Button disabled={toggling} onClick={() => void toggleStatus()} variant="outline">
                        {toggling ? (
                          <Loader2 className="animate-spin" />
                        ) : page.status === "published" ? (
                          <EyeOff />
                        ) : (
                          <ShieldCheck />
                        )}
                        {page.status === "published" ? t("detail.unpublish") : t("detail.publish")}
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                        <Trash2 /> {t("detail.deleteButton")}
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={(next) => !deleting && setDeleteOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
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

function publicPath(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return value
  }
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className="grid size-9 place-items-center rounded-md bg-muted text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words">{value}</p>
    </div>
  );
}
