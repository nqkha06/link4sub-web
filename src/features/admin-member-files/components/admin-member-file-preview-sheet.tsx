"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { FileTypeIcon } from "@/components/file-type-icon";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  downloadAdminMemberFile,
  getAdminMemberFilePreviewUrl,
} from "@/features/admin-member-files/api/admin-member-files.client";
import { formatFileSize } from "@/features/admin-member-files/components/admin-member-files-table-columns";
import type { AdminMemberFile } from "@/features/admin-member-files/types";

type AdminMemberFilePreviewSheetProps = {
  file: AdminMemberFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadError: () => void;
};

export function AdminMemberFilePreviewSheet({
  file,
  ...props
}: AdminMemberFilePreviewSheetProps) {
  if (!file) return null;
  return <PreviewSheetContent key={file.id} file={file} {...props} />;
}

function PreviewSheetContent({
  file,
  open,
  onOpenChange,
  onDownloadError,
}: Omit<AdminMemberFilePreviewSheetProps, "file"> & {
  file: AdminMemberFile;
}) {
  const t = useTranslations("Admin.memberFiles.preview");
  const ta = useTranslations("Admin.memberFiles.actions");
  const locale = useLocale();
  const previewUrl = getAdminMemberFilePreviewUrl(file);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 bg-card p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b px-5 py-5 pr-12 sm:px-6">
          <SheetTitle className="truncate">{file.name}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5 sm:p-6">
            <div className="grid min-h-64 place-items-center overflow-hidden rounded-xl border bg-muted/30">
              <FilePreview file={file} url={previewUrl} />
            </div>

            <Separator className="my-5" />

            <div className="rounded-lg border bg-card px-3">
              <dl className="divide-y text-sm">
                <Metadata label={t("fileName")} value={file.name} />
                <Metadata label={t("alias")} value={file.alias} breakAll />
                <Metadata label={t("mimeType")} value={file.mimeType} breakAll />
                <Metadata label={t("size")} value={formatFileSize(file.size)} />
                <Metadata
                  label={t("uploadedAt")}
                  value={new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(file.createdAt))}
                />
                <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5 first:pt-3 last:pb-3">
                  <dt className="text-muted-foreground">{t("owner")}</dt>
                  <dd className="min-w-0 text-right">
                    <Link
                      href={`/admin/users/${file.owner.id}`}
                      className="font-medium hover:underline"
                    >
                      {file.owner.name}
                    </Link>
                    <span className="block truncate text-xs text-muted-foreground">
                      {file.owner.email}
                    </span>
                  </dd>
                </div>
                <Metadata label={t("usage")} value={String(file.usageCount)} />
              </dl>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t px-5 py-4 sm:px-6">
          <Button
            onClick={() => {
              void downloadAdminMemberFile(file.id, file.name).catch(
                onDownloadError,
              );
            }}
          >
            {ta("download")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FilePreview({ file, url }: { file: AdminMemberFile; url: string }) {
  const t = useTranslations("Admin.memberFiles.preview");

  if (
    file.mimeType.startsWith("image/") &&
    file.mimeType !== "image/svg+xml"
  ) {
    return (
      <Image
        src={url}
        alt={t("imageAlt", { name: file.name })}
        width={900}
        height={640}
        unoptimized
        className="max-h-[26rem] w-full object-contain"
      />
    );
  }

  if (file.mimeType.startsWith("video/")) {
    return (
      <video
        controls
        preload="metadata"
        className="max-h-[26rem] w-full bg-black object-contain"
        aria-label={t("videoLabel", { name: file.name })}
      >
        <source src={url} type={file.mimeType} />
      </video>
    );
  }

  if (file.mimeType.startsWith("audio/")) {
    return (
      <div className="w-full p-8 text-center">
        <FileTypeIcon
          file={file}
          className="mx-auto size-20"
          iconClassName="size-16"
        />
        <audio
          controls
          preload="metadata"
          className="mt-6 w-full"
          aria-label={t("audioLabel", { name: file.name })}
        >
          <source src={url} type={file.mimeType} />
        </audio>
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-muted-foreground">
      <FileTypeIcon
        file={file}
        className="mx-auto size-20"
        iconClassName="size-16"
      />
      <p className="mt-4 text-sm">{t("unsupported")}</p>
    </div>
  );
}

function Metadata({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5 first:pt-3 last:pb-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`text-right text-foreground ${breakAll ? "break-all" : "break-words"}`}
      >
        {value}
      </dd>
    </div>
  );
}
