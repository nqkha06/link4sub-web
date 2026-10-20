"use client";

import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { FileUp, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { FileUploadItem } from "./file-upload-item";
import { formatBytes } from "./file-utils";
import type { UploadQueueItem } from "./types";

type FileUploadDialogProps = {
  open: boolean;
  queue: UploadQueueItem[];
  onOpenChange: (open: boolean) => void;
  onFilesSelected: (files: File[]) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  fileSizeLimit: number;
};

export function FileUploadDialog({ open, queue, onOpenChange, onFilesSelected, onRetry, onCancel, onRemove, fileSizeLimit }: FileUploadDialogProps) {
  const t = useTranslations("Files.uploadDialog");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasActiveUpload = queue.some(
    (item) =>
      item.status === "pending" ||
      item.status === "uploading" ||
      item.status === "finalizing",
  );

  const chooseFiles = () => inputRef.current?.click();
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); setDragging(false);
    if (event.dataTransfer.files.length) onFilesSelected(Array.from(event.dataTransfer.files));
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseFiles(); }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <ResponsiveDialogHeader className="border-b border-border sm:px-6 sm:py-5">
          <ResponsiveDialogTitle>{t("title")}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="p-5 sm:p-6">
          <div
            role="button"
            tabIndex={0}
            aria-label={t("dropzoneLabel")}
            onClick={chooseFiles}
            onKeyDown={handleKeyDown}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`grid min-h-36 place-items-center rounded-lg border border-dashed px-5 py-6 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40"}`}
          >
            <div><FileUp className="mx-auto size-6 text-primary" /><p className="mt-3 text-sm font-medium text-foreground">{t("dropzoneTitle")}</p><p id="supported-formats" className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("dropzoneHint", { size: formatBytes(fileSizeLimit) })}</p></div>
          </div>
          <input ref={inputRef} type="file" multiple className="sr-only" onChange={(event) => { if (event.target.files?.length) onFilesSelected(Array.from(event.target.files)); event.target.value = ""; }} />
        </ResponsiveDialogBody>

        {queue.length ? <div className="border-t border-border"><div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground"><span>{t("queue")}</span><span>{t("queueCount", { count: queue.length })}</span></div><ScrollArea className="max-h-64 border-t border-border"><div>{queue.map((item) => <FileUploadItem key={item.id} item={item} onRetry={onRetry} onCancel={onCancel} onRemove={onRemove} />)}</div></ScrollArea></div> : null}

        <ResponsiveDialogFooter className="sm:px-6"><Button variant="outline" onClick={() => onOpenChange(false)}>{hasActiveUpload ? t("closeBackground") : t("close")}</Button><Button onClick={chooseFiles}><Upload />{t("chooseMore")}</Button></ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
