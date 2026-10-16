"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FilePlus2, LoaderCircle, Paperclip, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/member/fields/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/member/fields/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/member/fields/textarea";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";

import { supportCategories, supportResources } from "./support-data-source";
import type { CreateSupportRequestInput, SupportCategory } from "./types";
import type { SupportController } from "./use-support-controller";
import { useFormatSupportDate } from "./use-support-controller";

const initialForm: Omit<CreateSupportRequestInput, "attachments"> = { category: "usage", subject: "", content: "", relatedResource: "none", attachTechnicalInfo: true };

export function SupportAttachmentUploader({ files, onChange, acceptedTypes, maxSizeMb, disabled }: { files: File[]; onChange: (files: File[]) => void; acceptedTypes: string; maxSizeMb: number; disabled: boolean }) {
  const t = useTranslations("Support.uploader");
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const selected = Array.from(incoming);
    const oversized = selected.find((file) => file.size > maxSizeMb * 1024 * 1024);
    if (oversized) {
      setError(t("tooLarge", { name: oversized.name, size: maxSizeMb }));
      return;
    }
    setError("");
    onChange([...files, ...selected].slice(0, 5));
  };
  return <div><input ref={inputRef} type="file" className="sr-only" accept={acceptedTypes} multiple disabled={disabled} onChange={(event) => addFiles(event.target.files)} /><button type="button" disabled={disabled} className="flex min-h-24 w-full items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 py-4 text-center outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" onClick={() => inputRef.current?.click()}><span><FilePlus2 className="mx-auto size-5 text-muted-foreground" /><span className="mt-2 block text-sm font-medium">{t("choose")}</span><span className="mt-1 block text-xs text-muted-foreground">{t("limits", { max: 5, size: maxSizeMb })}</span></span></button>{files.length ? <div className="mt-2 divide-y divide-border rounded-md border border-border">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex min-h-11 items-center gap-2 px-3 py-2"><Paperclip className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-xs">{file.name}</span><span className="text-[11px] tabular-nums text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span><Button type="button" variant="ghost" size="icon-sm" aria-label={t("remove", { name: file.name })} disabled={disabled} onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}><Trash2 /></Button></div>)}</div> : null}{error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}</div>;
}

export function CreateSupportRequestSheet({ controller }: { controller: SupportController }) {
  const t = useTranslations("Support");
  const brand = useSiteBrand();
  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const data = controller.data;
  if (!data) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.subject.trim()) nextErrors.subject = t("validation.subjectRequired");
    else if (form.subject.trim().length < 8) nextErrors.subject = t("validation.subjectMin", { min: 8 });
    if (!form.content.trim()) nextErrors.content = t("validation.contentRequired");
    else if (form.content.trim().length < 20) nextErrors.content = t("validation.contentMinDetailed", { min: 20 });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { document.getElementById(nextErrors.subject ? "support-subject" : "support-content")?.focus(); return; }
    await controller.createRequest({ ...form, subject: form.subject.trim(), content: form.content.trim(), attachments });
  };

  const close = () => {
    controller.setRequestSheetOpen(false);
    controller.setSuccessRequest(undefined);
    setForm(initialForm);
    setAttachments([]);
    setErrors({});
  };

  return (
    <Sheet
      open={controller.requestSheetOpen}
      onOpenChange={(open) => {
        if (controller.submitting) return;
        if (open) controller.setRequestSheetOpen(true);
        else close();
      }}
    >
      <SheetContent id="create-support-request" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 py-5 sm:px-6">
          <SheetTitle>{controller.successRequest ? t("sheet.successTitle") : t("sheet.title")}</SheetTitle>
          <SheetDescription>
            {controller.successRequest
              ? t("sheet.successDescription")
              : t("sheet.description", { brand: brand.siteName })}
          </SheetDescription>
        </SheetHeader>

        {controller.successRequest ? (
          <SupportRequestSuccess controller={controller} onClose={close} />
        ) : (
          <>
            <form id="create-support-request-form" onSubmit={submit} className="space-y-5 px-5 py-5 sm:px-6">
              <div className="space-y-2">
                <label htmlFor="support-category" className="text-sm font-medium">{t("sheet.category")}</label>
                <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value as SupportCategory }))} disabled={controller.submitting}>
                  <SelectTrigger id="support-category" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{supportCategories.map((value) => <SelectItem key={value} value={value}>{t(`categories.${value}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="support-subject" className="text-sm font-medium">{t("sheet.subject")}</label>
                <Input id="support-subject" value={form.subject} onChange={(event) => { setForm((current) => ({ ...current, subject: event.target.value })); if (errors.subject) setErrors((current) => ({ ...current, subject: "" })); }} placeholder={t("sheet.subjectPlaceholder")} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "support-subject-error" : undefined} disabled={controller.submitting} />
                {errors.subject ? <p id="support-subject-error" role="alert" className="text-xs text-destructive">{errors.subject}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="support-content" className="text-sm font-medium">{t("sheet.content")}</label>
                <Textarea id="support-content" value={form.content} onChange={(event) => { setForm((current) => ({ ...current, content: event.target.value })); if (errors.content) setErrors((current) => ({ ...current, content: "" })); }} placeholder={t("sheet.contentPlaceholder")} className="min-h-32 resize-y" aria-invalid={Boolean(errors.content)} aria-describedby={errors.content ? "support-content-error" : undefined} disabled={controller.submitting} />
                {errors.content ? <p id="support-content-error" role="alert" className="text-xs text-destructive">{errors.content}</p> : <p className="text-xs text-muted-foreground">{t("sheet.contentHint", { min: 20 })}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="support-resource" className="text-sm font-medium">{t("sheet.resource")}</label>
                <Select value={form.relatedResource} onValueChange={(value) => setForm((current) => ({ ...current, relatedResource: value }))} disabled={controller.submitting}>
                  <SelectTrigger id="support-resource" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{supportResources.map((value) => <SelectItem key={value} value={value}>{t(`resources.${value}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">{t("sheet.attachments")}</span>
                <SupportAttachmentUploader files={attachments} onChange={setAttachments} acceptedTypes={data.attachmentConfig.acceptedTypes} maxSizeMb={data.attachmentConfig.maxSizeMb} disabled={controller.submitting} />
              </div>
              <label className="flex items-start gap-3 rounded-md border border-border bg-muted/20 p-3">
                <Checkbox checked={form.attachTechnicalInfo} onCheckedChange={(checked) => setForm((current) => ({ ...current, attachTechnicalInfo: checked === true }))} disabled={controller.submitting} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium">{t("sheet.technicalInfo")}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t("sheet.technicalInfoHint")}</span>
                </span>
              </label>
              {controller.submitError ? <Alert variant="destructive"><AlertCircle /><AlertDescription>{controller.submitError}</AlertDescription></Alert> : null}
            </form>
            <SheetFooter className="border-t border-border px-5 py-4 sm:px-6">
              <Button type="button" variant="outline" disabled={controller.submitting} onClick={close}>{t("sheet.cancel")}</Button>
              <Button type="submit" form="create-support-request-form" disabled={controller.submitting}>
                {controller.submitting ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" />{t("sheet.sending")}</> : t("sheet.submit")}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function SupportRequestSuccess({ controller, onClose }: { controller: SupportController; onClose: () => void }) {
  const t = useTranslations("Support");
  const formatDate = useFormatSupportDate();
  const request = controller.successRequest;
  if (!request) return null;
  return <div className="flex flex-1 flex-col px-5 py-6 sm:px-6"><div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-5" /></div><h3 className="mt-5 text-lg font-semibold">{t("sheet.successTitle")}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{t("success.description")}</p><dl className="mt-6 divide-y divide-border border-y border-border text-sm"><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{t("success.reference")}</dt><dd className="font-mono font-medium">{request.reference}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{t("success.subject")}</dt><dd className="max-w-[65%] text-right font-medium">{request.subject}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{t("success.status")}</dt><dd className="font-medium">{t(`status.${request.status}`)}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{t("success.sentAt")}</dt><dd className="text-right font-medium tabular-nums">{formatDate(request.createdAt)}</dd></div></dl><div className="mt-auto grid gap-2 pt-8 sm:grid-cols-2"><Button variant="outline" onClick={() => { controller.setDetailRequest(request); controller.setRequestSheetOpen(false); controller.setSuccessRequest(undefined); }}>{t("success.view")}</Button><Button onClick={onClose}>{t("success.close")}</Button></div></div>;
}
