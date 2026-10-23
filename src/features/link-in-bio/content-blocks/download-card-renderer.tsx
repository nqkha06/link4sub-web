"use client";

import { Download, FileDown } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import type { BioCustomLinkDto } from "@/lib/api-client";

export function DownloadCardRenderer({ block, slug, preview, onDownload }: {
  block: BioCustomLinkDto; slug: string; preview?: boolean; onDownload: () => void;
}) {
  const t = useTranslations("BioDownload");
  const format = useFormatter();
  const file = block.downloadFile;
  const size = file ? file.size < 1024 * 1024 ? `${format.number(file.size / 1024, { maximumFractionDigits: 1 })} KB` : `${format.number(file.size / 1024 / 1024, { maximumFractionDigits: 1 })} MB` : "";
  const actionClass = "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--bio-section-border,var(--border))] px-4 py-2 text-sm font-semibold outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[color:var(--bio-accent)]";
  return (
    <section aria-label={block.title || t("blockTitle")} className="min-w-0 space-y-3 rounded-2xl border border-[color:var(--bio-section-border,var(--border))] bg-[color:var(--bio-section-bg,var(--card))] p-4 text-left text-[color:var(--bio-text,var(--foreground))]">
      <div className="flex min-w-0 items-start gap-3">
        <FileDown className="mt-1 size-6 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1"><h2 className="break-words text-sm font-semibold">{block.title || file?.name || t("blockTitle")}</h2>{file ? <p className="mt-1 break-all text-xs opacity-70">{file.name} · {size}</p> : <p className="mt-1 text-xs opacity-70">{block.fileId ? t("unavailable") : t("noFile")}</p>}</div>
      </div>
      {block.description ? <p className="whitespace-pre-wrap break-words text-sm leading-6 opacity-80">{block.description}</p> : null}
      {file && block.fileId ? <a className={actionClass} href={preview ? `/api/backend/member/files/${encodeURIComponent(block.fileId)}/download` : `/api/public/bio/${encodeURIComponent(slug)}/downloads/${encodeURIComponent(block.id)}`} download onClick={onDownload}><Download className="size-4 shrink-0" aria-hidden /><span className="min-w-0 break-words">{block.buttonText?.trim() || t("download")}</span></a> : <button type="button" className={`${actionClass} cursor-default opacity-50`} disabled><Download className="size-4 shrink-0" aria-hidden /><span className="min-w-0 break-words">{block.buttonText?.trim() || t("download")}</span></button>}
    </section>
  );
}
