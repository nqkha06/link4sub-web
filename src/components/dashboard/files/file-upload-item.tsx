"use client";

import { CircleCheck, CircleX, Clock3, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { FileTypeIcon } from "@/components/file-type-icon";
import { Button } from "@/components/ui/button";

import { formatBytes } from "./file-utils";
import type { UploadQueueItem } from "./types";

export function FileUploadItem({
  item,
  onRetry,
  onCancel,
  onRemove,
}: {
  item: UploadQueueItem;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("Files.uploadItem");
  const isActive =
    item.status === "uploading" ||
    item.status === "pending" ||
    item.status === "finalizing";
  const isTransferring =
    item.status === "uploading" || item.status === "finalizing";
  const canCancel =
    item.status === "uploading" || item.status === "pending";
  const isIndeterminateProgress =
    item.indeterminate && item.status === "uploading";

  const statusText =
    item.status === "pending"
      ? t("pending")
      : item.status === "uploading"
        ? item.indeterminate
          ? t("uploading")
          : t("uploadingProgress", { progress: item.progress })
        : item.status === "finalizing"
          ? t("finalizing")
          : item.status === "success"
            ? t("success")
            : item.status === "cancelled"
              ? t("cancelled")
              : item.error || t("failed");

  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <FileTypeIcon file={item.file} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {item.file.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatBytes(item.file.size)} · {statusText}
          </p>
        </div>
        <span className="mt-2.5 text-muted-foreground">
          {item.status === "pending" ? (
            <Clock3 className="size-4" />
          ) : isTransferring ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : item.status === "success" ? (
            <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CircleX className="size-4 text-destructive" />
          )}
        </span>
        {item.status === "error" && item.retryable !== false ? <Button variant="ghost" size="icon-sm" onClick={() => onRetry(item.id)} aria-label={t("retry", { name: item.file.name })}><RotateCcw /></Button> : null}
        {canCancel ? <Button variant="ghost" size="icon-sm" onClick={() => onCancel(item.id)} aria-label={t("cancel", { name: item.file.name })}><X /></Button> : null}
        {!isActive ? <Button variant="ghost" size="icon-sm" onClick={() => onRemove(item.id)} aria-label={t("remove", { name: item.file.name })}><X /></Button> : null}
      </div>
      {isTransferring ? (
        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={t("progress", { name: item.file.name })}
          aria-valuemin={isIndeterminateProgress ? undefined : 0}
          aria-valuemax={isIndeterminateProgress ? undefined : 100}
          aria-valuenow={
            isIndeterminateProgress ? undefined : item.progress
          }
          aria-valuetext={
            isIndeterminateProgress ? statusText : undefined
          }
        >
          <div
            className={
              isIndeterminateProgress
                ? "h-full w-2/3 animate-pulse rounded-full bg-primary/70 motion-reduce:animate-none"
                : "h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none"
            }
            style={
              isIndeterminateProgress
                ? undefined
                : { width: `${item.progress}%` }
            }
          />
        </div>
      ) : null}
    </div>
  );
}
