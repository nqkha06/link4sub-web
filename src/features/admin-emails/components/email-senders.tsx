"use client";

import * as React from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Ellipsis,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  checkSenderVerification,
  createEmailSender,
  deleteEmailSender,
  listEmailSenders,
  setDefaultEmailSender,
} from "../api/emails.client";
import type { EmailCategory, EmailSender } from "../types";
import { EmailEmptyState, EmailStatusBadge, useFormatEmailDate } from "./email-ui";
import { copyToClipboard } from "@/lib/clipboard";

export function EmailSendersTab() {
  const t = useTranslations("Admin.emails");
  const formatEmailDate = useFormatEmailDate();
  const permissions = useAdminPermissions();
  const canManage = permissions.includes("emails.senders.manage");
  const [items, setItems] = React.useState<EmailSender[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({ page: 1, perPage: 20, total: 0, totalPages: 1 });
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [details, setDetails] = React.useState<EmailSender | null>(null);
  const [mutating, setMutating] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEmailSenders({ search, type, status, page });
      setItems(result.data);
      setPagination(result.meta);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("senders.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, type, t]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function mutate(sender: EmailSender, action: "check" | "default" | "delete") {
    setMutating(sender.id);
    try {
      if (action === "check") {
        const updated = await checkSenderVerification(sender.id);
        setDetails(updated);
        toast.success(t("senders.checkedToast"));
      } else if (action === "default") {
        await setDefaultEmailSender(sender.id);
        toast.success(t("senders.defaultToast"));
      } else {
        await deleteEmailSender(sender.id);
        toast.success(t("senders.disabledToast"));
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("senders.updateError"));
    } finally {
      setMutating(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-semibold">{t("senders.title")}</h2><p className="text-sm text-muted-foreground">{t("senders.subtitle")}</p></div>
        {canManage ? <Button onClick={() => setWizardOpen(true)}><Plus />{t("senders.create")}</Button> : null}
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-56 flex-1 lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t("senders.searchPlaceholder")} className="pl-9" /></div>
          <Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("filters.allTypes")}</SelectItem><SelectItem value="transactional">{t("category.transactional")}</SelectItem><SelectItem value="marketing">{t("category.marketing")}</SelectItem></SelectContent></Select>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("filters.allStatuses")}</SelectItem><SelectItem value="draft">{t("senders.filterDraft")}</SelectItem><SelectItem value="pending_verification">{t("senders.filterPending")}</SelectItem><SelectItem value="verified">{t("senders.filterVerified")}</SelectItem><SelectItem value="failed">{t("senders.filterFailed")}</SelectItem><SelectItem value="disabled">{t("senders.filterDisabled")}</SelectItem></SelectContent></Select>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label={t("senders.refreshAria")}><RefreshCw className={loading ? "animate-spin" : ""} /></Button>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader><TableRow><TableHead>{t("senders.columnSender")}</TableHead><TableHead>{t("table.type")}</TableHead><TableHead>{t("settings.provider")}</TableHead><TableHead>{t("senders.columnVerification")}</TableHead><TableHead>{t("senders.columnDefault")}</TableHead><TableHead>{t("senders.columnLastChecked")}</TableHead><TableHead className="text-right">{t("senders.columnActions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} className="h-52 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /></TableCell></TableRow> : items.length ? items.map((sender) => (
                <TableRow key={sender.id}>
                  <TableCell><div className="max-w-72"><p className="truncate text-sm font-medium">{sender.displayName} &lt;{sender.emailAddress}&gt;</p><p className="mt-1 truncate font-mono text-xs text-muted-foreground">{sender.domain}</p></div></TableCell>
                  <TableCell className="capitalize">{t(`category.${sender.type}`)}</TableCell>
                  <TableCell>Amazon SES</TableCell>
                  <TableCell><div className="space-y-1"><EmailStatusBadge status={sender.status} label={t(`senders.statusLabels.${sender.status}`)} />{sender.verificationError ? <p className="max-w-56 truncate text-xs text-destructive" title={sender.verificationError}>{sender.verificationError}</p> : null}</div></TableCell>
                  <TableCell>{sender.isDefault ? <EmailStatusBadge status="verified" label={t("senders.default")} /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatEmailDate(sender.lastCheckedAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={t("senders.actionsAria", { email: sender.emailAddress ?? "" })}><Ellipsis /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onSelect={() => setDetails(sender)}><ShieldCheck />{t("senders.viewDetails")}</DropdownMenuItem>
                      {canManage && sender.status !== "disabled" ? <DropdownMenuItem disabled={mutating === sender.id} onSelect={() => void mutate(sender, "check")}><RefreshCw />{t("senders.checkVerification")}</DropdownMenuItem> : null}
                      {canManage && sender.status === "verified" && !sender.isDefault ? <DropdownMenuItem disabled={mutating === sender.id} onSelect={() => void mutate(sender, "default")}><CheckCircle2 />{t("senders.setDefault")}</DropdownMenuItem> : null}
                      {canManage && !sender.isDefault ? <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" disabled={mutating === sender.id} onSelect={() => void mutate(sender, "delete")}><Trash2 />{t("senders.disable")}</DropdownMenuItem></> : null}
                    </DropdownMenuContent></DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={7} className="p-0"><EmailEmptyState title={t("overview.senderNotConfigured")} description={t("senders.emptyDescription")} action={canManage ? <Button onClick={() => setWizardOpen(true)}><Plus />{t("senders.create")}</Button> : undefined} /></TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        {pagination.total > 0 ? <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>{t("senders.pagination", { total: pagination.total, page: pagination.page, pages: pagination.totalPages })}</span><div className="flex gap-1"><Button variant="outline" size="icon-sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon-sm" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button></div></div> : null}
      </Card>
      <CreateSenderWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={(sender) => { setDetails(sender); void load(); }} />
      <SenderDetailsDialog sender={details} onOpenChange={(open) => !open && setDetails(null)} />
    </div>
  );
}

function CreateSenderWizard({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: (sender: EmailSender) => void }) {
  const t = useTranslations("Admin.emails");
  const [step, setStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ type: "transactional" as EmailCategory, displayName: "", emailAddress: "", domain: "", replyToEmail: "" });
  const [created, setCreated] = React.useState<EmailSender | null>(null);

  React.useEffect(() => {
    if (open) return;
    const timeout = window.setTimeout(() => {
      setStep(1);
      setCreated(null);
      setForm({ type: "transactional", displayName: "", emailAddress: "", domain: "", replyToEmail: "" });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open]);

  async function submit() {
    setSaving(true);
    try {
      const sender = await createEmailSender({ ...form, replyToEmail: form.replyToEmail || null });
      setCreated(sender); setStep(4); onCreated(sender);
      toast.success(t("senders.createdToast"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("senders.createError"));
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{t("senders.wizardTitle", { step })}</DialogTitle><DialogDescription>{step === 1 ? t("senders.step1") : step === 2 ? t("senders.step2") : step === 3 ? t("senders.step3") : t("senders.step4")}</DialogDescription></DialogHeader>
        {step === 1 ? <div className="grid gap-3 sm:grid-cols-2">{(["transactional", "marketing"] as const).map((value) => <button key={value} type="button" onClick={() => setForm((current) => ({ ...current, type: value }))} className={`rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring ${form.type === value ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}><Send className="size-5" /><p className="mt-3 font-medium capitalize">{t(`category.${value}`)}</p><p className="mt-1 text-sm text-muted-foreground">{value === "marketing" ? t("senders.marketingHint") : t("senders.transactionalHint")}</p></button>)}</div> : null}
        {step === 2 ? <div className="grid gap-4 sm:grid-cols-2"><Field label={t("senders.fields.fromName")}><Input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Link4Sub Notifications" /></Field><Field label={t("senders.fields.fromEmail")}><Input type="email" value={form.emailAddress} onChange={(event) => setForm({ ...form, emailAddress: event.target.value })} placeholder="no-reply@notify.domain.com" /></Field><Field label={t("senders.fields.domain")}><Input value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })} placeholder="notify.domain.com" /></Field><Field label={t("senders.fields.replyTo")}><Input type="email" value={form.replyToEmail} onChange={(event) => setForm({ ...form, replyToEmail: event.target.value })} placeholder="support@domain.com" /></Field></div> : null}
        {step === 3 ? <div className="space-y-3 rounded-xl border bg-muted/20 p-4"><Review label={t("senders.review.type")} value={t(`category.${form.type}`)} /><Review label={t("senders.review.from")} value={`${form.displayName} <${form.emailAddress}>`} /><Review label={t("senders.review.domainIdentity")} value={form.domain} /><Review label={t("senders.review.replyTo")} value={form.replyToEmail || "—"} /><Alert><ShieldCheck /><AlertTitle>{t("senders.noAutoDnsTitle")}</AlertTitle><AlertDescription>{t("senders.noAutoDnsDescription")}</AlertDescription></Alert></div> : null}
        {step === 4 && created ? <DnsRecords sender={created} /> : null}
        <DialogFooter>
          {step > 1 && step < 4 ? <Button variant="outline" onClick={() => setStep((value) => value - 1)}>{t("senders.back")}</Button> : null}
          {step < 3 ? <Button onClick={() => setStep((value) => value + 1)} disabled={step === 2 && (!form.displayName || !form.emailAddress || !form.domain)}>{t("senders.continue")}</Button> : null}
          {step === 3 ? <Button onClick={() => void submit()} disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}{t("senders.createSesIdentity")}</Button> : null}
          {step === 4 ? <Button onClick={() => onOpenChange(false)}>{t("senders.done")}</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SenderDetailsDialog({ sender, onOpenChange }: { sender: EmailSender | null; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Admin.emails");
  return <Dialog open={Boolean(sender)} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{sender?.displayName || t("senders.details")}</DialogTitle><DialogDescription>{sender?.emailAddress} · {sender?.domain}</DialogDescription></DialogHeader>{sender ? <DnsRecords sender={sender} /> : null}</DialogContent></Dialog>;
}

function DnsRecords({ sender }: { sender: EmailSender }) {
  const t = useTranslations("Admin.emails");
  const tCommon = useTranslations("Common");
  const records = sender.dnsRecords || [];
  return <div className="space-y-4"><div className="flex flex-wrap gap-2"><EmailStatusBadge status={sender.status} label={t(`senders.statusLabels.${sender.status}`)} />{sender.isDefault ? <EmailStatusBadge status="verified" label={t("senders.defaultSender")} /> : null}</div>{sender.verificationError ? <Alert variant="destructive"><AlertTitle>{t("senders.verifyFailed")}</AlertTitle><AlertDescription>{sender.verificationError}</AlertDescription></Alert> : null}{records.length ? <div className="space-y-2">{records.map((record, index) => <div key={`${record.name}-${index}`} className="grid gap-2 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[72px_minmax(0,1fr)_minmax(0,1.4fr)_36px]"><span className="font-mono text-xs font-semibold">{record.type}</span><code className="break-all text-xs">{record.name}</code><code className="break-all text-xs text-muted-foreground">{record.value}</code><Button variant="ghost" size="icon-sm" aria-label={t("senders.copyDns")} onClick={() => void copyToClipboard(`${record.name}\t${record.value}`).then((copied) => copied ? toast.success(t("senders.copiedDns")) : toast.error(tCommon("copyFailed")))}><Clipboard /></Button></div>)}</div> : <EmailEmptyState title={t("senders.noDnsTitle")} description={t("senders.noDnsDescription")} warning />}{[...(sender.warnings || []), ...sender.recommendations].map((warning) => <p key={warning} className="text-xs text-warning">• {warning}</p>)}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Review({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-right text-sm font-medium">{value}</span></div>; }
