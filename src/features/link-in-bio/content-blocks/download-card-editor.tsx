"use client";

import { FileDown, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ManagedImagePicker } from "@/components/media/managed-image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/member/fields/input";
import { Textarea } from "@/components/member/fields/textarea";
import { Label } from "@/components/ui/label";
import type { BioCustomLinkDto } from "@/lib/api-client";
import type { ContentIssue } from "./content-issues";

const ALL_FILE_TYPES = [""] as const;

export function DownloadCardEditor({ block, onChange, disabled, issues }: {
  block: BioCustomLinkDto;
  onChange: (patch: Partial<BioCustomLinkDto>) => void;
  disabled?: boolean;
  issues: ContentIssue[];
}) {
  const t = useTranslations("BioDownload");
  const [pickerOpen, setPickerOpen] = useState(false);
  const fieldId = (field: string) => `content-link-${field}-${block.id}`;
  const issue = (field: string) => issues.find((entry) => entry.fieldId === fieldId(field));
  const invalidProps = (field: string) => ({ "aria-invalid": Boolean(issue(field)), "aria-describedby": issue(field) ? `${fieldId(field)}-issue` : undefined });
  const fieldError = (field: string) => issue(field) ? <p id={`${fieldId(field)}-issue`} className="text-xs text-destructive">{issue(field)?.message}</p> : null;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={fieldId("fileId")}>{t("file")}</Label>
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background p-3">
          <FileDown className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="min-w-0 flex-1 break-words text-sm">{block.downloadFile?.name || (block.fileId ? t("unavailable") : t("noFile"))}</p>
          {block.fileId ? <Button type="button" variant="ghost" size="icon-sm" aria-label={t("removeFile")} disabled={disabled} onClick={() => onChange({ fileId: null, downloadFile: undefined })}><X /></Button> : null}
        </div>
        <Button type="button" id={fieldId("fileId")} aria-label={block.fileId ? t("changeFile") : t("chooseFile")} {...invalidProps("fileId")} variant="outline" className="min-h-11 w-full" disabled={disabled} onClick={() => setPickerOpen(true)}>{block.fileId ? t("changeFile") : t("chooseFile")}</Button>
        {fieldError("fileId")}
        <p className="text-xs text-muted-foreground">{t("publicHint")}</p>
      </div>
      <div className="space-y-2"><Label htmlFor={fieldId("title")}>{t("title")}</Label><Input id={fieldId("title")} maxLength={120} {...invalidProps("title")} value={block.title} disabled={disabled} onChange={(event) => onChange({ title: event.target.value })} />{fieldError("title")}</div>
      <div className="space-y-2"><Label htmlFor={fieldId("description")}>{t("description")}</Label><Textarea id={fieldId("description")} maxLength={300} rows={3} {...invalidProps("description")} value={block.description || ""} disabled={disabled} onChange={(event) => onChange({ description: event.target.value })} />{fieldError("description")}</div>
      <div className="space-y-2"><Label htmlFor={fieldId("buttonText")}>{t("buttonText")}</Label><Input id={fieldId("buttonText")} maxLength={60} {...invalidProps("buttonText")} value={block.buttonText || ""} placeholder={t("download")} disabled={disabled} onChange={(event) => onChange({ buttonText: event.target.value })} />{fieldError("buttonText")}</div>
      <ManagedImagePicker open={pickerOpen} onOpenChange={setPickerOpen} selectedFileId={block.fileId} title={t("chooseFile")} assetLabel={t("file")} accept="*/*" acceptedMimePrefixes={ALL_FILE_TYPES} uploadPurpose="file" onSelect={(file) => onChange({
        fileId: file.id, title: block.title.trim() || file.name.slice(0, 120),
        downloadFile: { name: file.name, size: file.size, mimeType: file.mimeType },
      })} />
    </div>
  );
}
