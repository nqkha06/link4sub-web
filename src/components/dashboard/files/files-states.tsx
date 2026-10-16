"use client";

import { AlertCircle, FileUp, FolderOpen, FolderPlus, Loader2, RotateCcw, SearchX, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyCard } from "@/components/dashboard/empty-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function FilesEmptyState() {
  const t = useTranslations("Files");
  return <EmptyCard icon={FileUp} title={t("states.emptyTitle")} />;
}

/**
 * Vòng xoay đè lên danh sách cũ khi đang mở thư mục. Giữ nguyên chiều cao
 * danh sách để trang không bị co lại và nhảy thanh cuộn.
 */
export function FolderLoadingOverlay({ name }: { name?: string | null }) {
  const t = useTranslations("Files.folders");
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex justify-center" aria-live="polite">
      <div className="sticky top-1/3 mt-10 flex h-fit items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
        <Loader2 className="size-4 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
        {name ? t("opening", { name }) : t("openingRoot")}
      </div>
    </div>
  );
}

export function FolderEmptyState({ onUpload, onCreateFolder }: { onUpload: () => void; onCreateFolder: () => void }) {
  const t = useTranslations("Files");
  return (
    <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-14 text-center">
      <FolderOpen className="size-8 text-muted-foreground" />
      <h2 className="mt-4 text-base font-medium">{t("folders.emptyTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("folders.emptyDescription")}</p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Button variant="outline" onClick={onCreateFolder}><FolderPlus />{t("folders.create")}</Button>
        <Button onClick={onUpload}><Upload />{t("upload")}</Button>
      </div>
    </section>
  );
}

export function FilesNoResults({ onClear }: { onClear: () => void }) {
  const t = useTranslations("Files");
  return (
    <EmptyCard
      icon={SearchX}
      title={t("states.noResultsTitle")}
      action={{ label: t("states.clearFilters"), onClick: onClear }}
    />
  );
}

export function FilesSkeleton() {
  const t = useTranslations("Files.states");
  return (
    <div aria-label={t("loading")} aria-busy="true">
      <div className="border-y border-border py-4"><Skeleton className="h-4 w-72" /><Skeleton className="mt-3 h-1.5 w-full" /></div>
      <div className="flex gap-3 border-b border-border py-4"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-36" /><Skeleton className="h-10 w-36" /></div>
      <div>{Array.from({ length: 7 }).map((_, index) => <div key={index} className="flex h-16 items-center gap-4 border-b border-border px-3"><Skeleton className="size-4" /><Skeleton className="size-9" /><div className="flex-1"><Skeleton className="h-4 w-52" /><Skeleton className="mt-2 h-3 w-28" /></div><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-24" /></div>)}</div>
    </div>
  );
}

export function FilesErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const t = useTranslations("Files.states");
  return (
    <Alert variant="destructive" className="items-center">
      <AlertCircle /><AlertTitle>{t("errorTitle")}</AlertTitle>
      <AlertDescription><span>{t("errorHint")}</span>{message ? <span className="text-xs opacity-80">{message}</span> : null}<Button variant="outline" size="sm" className="mt-2 border-destructive/30 bg-background text-destructive" onClick={onRetry}><RotateCcw />{t("retry")}</Button></AlertDescription>
    </Alert>
  );
}
