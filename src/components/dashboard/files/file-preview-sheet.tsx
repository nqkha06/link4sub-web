"use client";

import { Download } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getFilePreviewUrl, type ManagedFileDto } from "@/lib/api-client";

import { FileTypeIcon, formatFileDate } from "./file-utils";

type FilePreviewSheetProps = {
  file: ManagedFileDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (file: ManagedFileDto) => void;
};

export function FilePreviewSheet({ file, ...props }: FilePreviewSheetProps) {
  if (!file) return null;
  return <FilePreviewSheetContent key={file.id} file={file} {...props} />;
}

function FilePreviewSheetContent({ file, open, onOpenChange, onDownload }: Omit<FilePreviewSheetProps, "file"> & { file: ManagedFileDto }) {
  const t = useTranslations("Files.preview");
  const locale = useLocale();
  const isImage = file.mimeType.startsWith("image/");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 bg-card p-0 sm:max-w-[460px]">
        <SheetHeader className="border-b border-border px-5 py-5 pr-12 sm:px-6"><SheetTitle className="truncate">{file.name}</SheetTitle><SheetDescription>{t("description")}</SheetDescription></SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5 sm:p-6">
            <div className="grid min-h-56 place-items-center overflow-hidden rounded-lg border border-border bg-muted/30">
              {isImage ? <Image src={getFilePreviewUrl(file)} alt={t("imageAlt", { name: file.name })} width={720} height={480} unoptimized className="max-h-72 w-full object-contain" /> : <div className="text-center text-muted-foreground"><FileTypeIcon file={file} className="mx-auto size-20 rounded-xl bg-background" iconClassName="size-12" /><p className="mt-3 text-xs">{t("unsupported")}</p></div>}
            </div>

            <div className="mt-5 rounded-lg border border-border bg-card p-3">
              <div className="min-w-0"><p className="text-xs text-muted-foreground">{t("fileName")}</p><p className="mt-1 break-words text-sm font-medium text-foreground">{file.name}</p></div>
            </div>

            <Separator className="my-5" />
            <div className="rounded-lg border border-border bg-card px-3">
              <dl className="divide-y divide-border text-sm">
                <Metadata label={t("alias")} value={`/${file.alias}`} />
                <Metadata label={t("mimeType")} value={file.mimeType} />
                <Metadata label={t("size")} value={file.sizeLabel} />
                <Metadata label={t("uploadedAt")} value={formatFileDate(file.createdAt, true, locale)} />
                <Metadata label={t("uploadedBy")} value={t("you")} />
                <Metadata label={t("usedBy")} value={String(file.usageCount)} />
              </dl>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="border-t border-border px-5 py-4 sm:px-6">
          <Button onClick={() => onDownload(file)}><Download aria-hidden />{t("download")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Metadata({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5 first:pt-3 last:pb-3"><dt className="text-muted-foreground">{label}</dt><dd className={`text-right text-foreground ${breakAll ? "break-all" : "break-words"}`}>{value}</dd></div>;
}
