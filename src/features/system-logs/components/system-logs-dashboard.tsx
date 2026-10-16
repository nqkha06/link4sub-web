"use client";

import {
  AlertTriangle,
  Bug,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Clock3,
  Eye,
  Filter,
  Info,
  RotateCcw,
  Search,
  Settings2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  bulkDeleteSystemLogs,
  cleanupSystemLogs,
  createSystemLogCategory,
  deleteSystemLog,
  getSystemLog,
  updateSystemLogCategory,
  updateSystemLogSettings,
} from "../api/system-logs.client";
import type { SystemLogsQuery } from "../query/system-logs-search-params";
import type { SystemLog, SystemLogDetail, SystemLogSettings, SystemLogsResponse, SystemLogStats } from "../types";

type Props = {
  result: SystemLogsResponse;
  stats: SystemLogStats;
  settings: SystemLogSettings;
  query: SystemLogsQuery;
  canDelete: boolean;
  canManageSettings: boolean;
};

export function SystemLogsDashboard(props: Props) {
  const t = useTranslations("Admin.systemLogs");
  const tc = useTranslations("Admin.common");
  const { date, time, number } = useFormatters();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [detailId, setDetailId] = React.useState<number | null>(null);
  const [deleteIds, setDeleteIds] = React.useState<number[]>([]);
  const [cleanupOpen, setCleanupOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const allSelected = props.result.data.length > 0 && props.result.data.every((log) => selectedIds.includes(log.id));

  async function confirmDelete() {
    setBusy(true);
    try {
      const result = deleteIds.length === 1
        ? await deleteSystemLog(deleteIds[0])
        : await bulkDeleteSystemLogs(deleteIds);
      toast.success(t("deleted", { count: result.deletedCount }));
      setSelectedIds([]);
      setDeleteIds([]);
      router.refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-5">
    <StatsGrid stats={props.stats} />
    <Filters query={props.query} categories={props.settings.categories.filter((item) => item.isActive).map((item) => item.key)} />
    <Card className="overflow-hidden rounded-xl border-border/60 shadow-none">
      <CardContent className="p-0">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="text-sm font-medium">{t("countLabel", { count: number(props.result.meta.total) })}</p>
            <p className="text-xs text-muted-foreground">{t("sortNote")}</p>
          </div>
          <div className="flex items-center gap-2">
            {props.canDelete && selectedIds.length ? <Button size="sm" variant="destructive" onClick={() => setDeleteIds(selectedIds)}><Trash2 /> {t("deleteSelected", { count: selectedIds.length })}</Button> : null}
            {props.canDelete ? <Button size="sm" variant="outline" onClick={() => setCleanupOpen(true)}><Clock3 /> {t("cleanup")}</Button> : null}
            {props.canManageSettings ? <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}><Settings2 /> {t("retention")}</Button> : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
              {props.canDelete ? <TableHead className="w-10"><Checkbox checked={allSelected} aria-label={t("selectAllAria")} onCheckedChange={(checked) => setSelectedIds(checked ? props.result.data.map((item) => item.id) : [])} /></TableHead> : null}
              <TableHead className="min-w-36">{t("columns.time")}</TableHead><TableHead>{t("columns.level")}</TableHead><TableHead>{t("columns.category")}</TableHead><TableHead className="min-w-40">{t("columns.context")}</TableHead><TableHead className="min-w-40">{t("columns.event")}</TableHead><TableHead className="min-w-72">{t("columns.message")}</TableHead><TableHead className="min-w-48">{t("columns.actor")}</TableHead><TableHead className="min-w-32">{t("columns.ip")}</TableHead><TableHead className="w-20" />
            </TableRow></TableHeader>
            <TableBody>
              {props.result.data.length ? props.result.data.map((log) => <TableRow key={log.id} className="cursor-pointer" onClick={() => setDetailId(log.id)}>
                {props.canDelete ? <TableCell onClick={(event) => event.stopPropagation()}><Checkbox checked={selectedIds.includes(log.id)} aria-label={t("selectLogAria", { id: log.id })} onCheckedChange={(checked) => setSelectedIds((current) => checked ? [...new Set([...current, log.id])] : current.filter((id) => id !== log.id))} /></TableCell> : null}
                <TableCell><p className="whitespace-nowrap text-sm font-medium">{date(log.createdAt)}</p><p className="text-xs text-muted-foreground">{time(log.createdAt)}</p></TableCell>
                <TableCell><LevelBadge level={log.level} /></TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-[11px]">{log.category}</Badge></TableCell>
                <TableCell className="text-sm">{log.context || "—"}</TableCell>
                <TableCell><code className="text-xs">{log.event || "—"}</code></TableCell>
                <TableCell><p className="line-clamp-2 max-w-lg text-sm">{log.message}</p></TableCell>
                <TableCell><Actor log={log} /></TableCell>
                <TableCell><code className="text-xs">{log.ipAddress || "—"}</code></TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}><div className="flex justify-end">
                  <Button variant="ghost" size="icon-sm" aria-label={t("viewDetail")} onClick={() => setDetailId(log.id)}><Eye /></Button>
                  {props.canDelete ? <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={t("deleteLog")} onClick={() => setDeleteIds([log.id])}><Trash2 /></Button> : null}
                </div></TableCell>
              </TableRow>) : <TableRow><TableCell colSpan={props.canDelete ? 10 : 9} className="h-36 text-center text-muted-foreground">{t("empty")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        <Pagination result={props.result} query={props.query} />
      </CardContent>
    </Card>
    {detailId ? <LogDetailSheet key={detailId} id={detailId} onClose={() => setDetailId(null)} /> : null}
    {props.canDelete ? <CleanupDialog open={cleanupOpen} onOpenChange={setCleanupOpen} onDone={() => router.refresh()} /> : null}
    {props.canManageSettings && settingsOpen ? <SettingsDialog open onOpenChange={setSettingsOpen} initial={props.settings} onDone={() => router.refresh()} /> : null}
    <AlertDialog open={deleteIds.length > 0} onOpenChange={(open) => !open && setDeleteIds([])}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("deleteDialog.title", { count: deleteIds.length })}</AlertDialogTitle><AlertDialogDescription>{t("deleteDialog.description")}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void confirmDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{busy ? tc("deleting") : t("deleteDialog.confirm", { count: deleteIds.length })}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
}

function StatsGrid({ stats }: { stats: SystemLogStats }) {
  const t = useTranslations("Admin.systemLogs.stats");
  const { number } = useFormatters();
  const cards = [
    [t("total"), stats.total, Info],
    [t("errors"), stats.errors, Bug],
    [t("warnings"), stats.warnings, AlertTriangle],
    [t("security"), stats.security, ShieldAlert],
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <Card key={label} className="rounded-xl border-border/60 shadow-none"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{number(value)}</p></div><div className="flex size-9 items-center justify-center rounded-lg border bg-muted/30"><Icon className="size-4 text-muted-foreground" /></div></CardContent></Card>)}</div>;
}

function Filters({ query, categories }: { query: SystemLogsQuery; categories: string[] }) {
  const t = useTranslations("Admin.systemLogs.filters");
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const [filters, setFilters] = React.useState({ keyword: query.keyword, level: query.level || "all", category: query.category || "all", context: query.context, event: query.event, user: query.user, from: localDate(query.from), to: localDate(query.to) });
  const set = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  function apply() {
    const params = new URLSearchParams({ page: "1", perPage: String(query.perPage) });
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || value === "all") return;
      params.set(key, key === "from" || key === "to" ? new Date(value).toISOString() : value);
    });
    router.push(`/admin/system-logs?${params}`);
  }
  return <Card className="rounded-xl border-border/60 shadow-none"><CardContent className="space-y-4 p-4">
    <div className="grid gap-3 lg:grid-cols-[minmax(220px,2fr)_repeat(3,minmax(140px,1fr))_auto]">
      <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={filters.keyword} onChange={(e) => set("keyword", e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()} placeholder={t("searchPlaceholder")} className="pl-9" /></div>
      <Select value={filters.level} onValueChange={(value) => set("level", value)}><SelectTrigger><SelectValue placeholder={t("levelPlaceholder")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("allLevels")}</SelectItem>{["info", "warn", "error", "debug"].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select>
      <Select value={filters.category} onValueChange={(value) => set("category", value)}><SelectTrigger><SelectValue placeholder={t("categoryPlaceholder")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("allCategories")}</SelectItem>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select>
      <Input value={filters.user} onChange={(e) => set("user", e.target.value)} placeholder={t("userPlaceholder")} />
      <Button onClick={apply}><Filter /> {tc("filter")}</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Input value={filters.context} onChange={(e) => set("context", e.target.value)} placeholder={t("contextPlaceholder")} />
      <Input value={filters.event} onChange={(e) => set("event", e.target.value)} placeholder={t("eventPlaceholder")} />
      <Input type="datetime-local" value={filters.from} onChange={(e) => set("from", e.target.value)} aria-label={t("fromAria")} />
      <Input type="datetime-local" value={filters.to} onChange={(e) => set("to", e.target.value)} aria-label={t("toAria")} />
      <Button variant="ghost" onClick={() => router.push("/admin/system-logs")}><RotateCcw /> {t("reset")}</Button>
    </div>
  </CardContent></Card>;
}

function Pagination({ result, query }: { result: SystemLogsResponse; query: SystemLogsQuery }) {
  const t = useTranslations("Admin.systemLogs.pagination");
  const { number } = useFormatters();
  const router = useRouter();
  const go = (page: number) => { const params = new URLSearchParams(window.location.search); params.set("page", String(page)); router.push(`/admin/system-logs?${params}`); };
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"><p className="text-xs text-muted-foreground">{t("summary", { page: result.meta.page, pageCount: result.meta.totalPages, total: number(result.meta.total) })}</p><div className="flex items-center gap-2"><Select value={String(query.perPage)} onValueChange={(value) => { const params = new URLSearchParams(window.location.search); params.set("perPage", value); params.set("page", "1"); router.push(`/admin/system-logs?${params}`); }}><SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger><SelectContent>{[20, 50, 100].map((value) => <SelectItem key={value} value={String(value)}>{t("perPage", { count: value })}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon-sm" disabled={result.meta.page <= 1} onClick={() => go(result.meta.page - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon-sm" disabled={result.meta.page >= result.meta.totalPages} onClick={() => go(result.meta.page + 1)}><ChevronRight /></Button></div></div>;
}

function LogDetailSheet({ id, onClose }: { id: number; onClose: () => void }) {
  const t = useTranslations("Admin.systemLogs.detail");
  const { date, time } = useFormatters();
  const [log, setLog] = React.useState<SystemLogDetail | null>(null);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    let live = true;
    getSystemLog(id).then((value) => live && setLog(value)).catch((reason) => live && setError(message(reason)));
    return () => { live = false; };
  }, [id]);
  return <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}><SheetContent className="w-full p-0 sm:max-w-2xl"><SheetHeader className="border-b px-6 py-5"><SheetTitle>{t("title")}</SheetTitle><SheetDescription>{id || ""}</SheetDescription></SheetHeader><ScrollArea className="h-[calc(100vh-96px)]"><div className="space-y-6 p-6">{error ? <p className="text-sm text-destructive">{error}</p> : !log ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : <>
    <div className="grid gap-4 sm:grid-cols-2"><Detail label={t("timestamp")} value={`${date(log.createdAt)} ${time(log.createdAt)}`} /><Detail label={t("level")} value={<LevelBadge level={log.level} />} /><Detail label={t("category")} value={log.category} /><Detail label={t("context")} value={log.context || "—"} /><Detail label={t("event")} value={log.event || "—"} /><Detail label={t("requestId")} value={log.requestId || "—"} mono /><Detail label={t("userId")} value={log.userId || "—"} /><Detail label={t("adminId")} value={log.adminId || "—"} /><Detail label={t("ip")} value={log.ipAddress || "—"} mono /><Detail label={t("userAgent")} value={log.userAgent || "—"} /></div>
    <Separator /><section><Label>{t("message")}</Label><p className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm">{log.message}</p></section>
    <JsonBlock title={t("metadata")} value={log.metadata} />
    {log.stack ? <JsonBlock title={t("stack")} value={log.stack} plain /> : null}
  </>}</div></ScrollArea></SheetContent></Sheet>;
}

function CleanupDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; onDone: () => void }) {
  const t = useTranslations("Admin.systemLogs");
  const tc = useTranslations("Admin.common");
  const { number } = useFormatters();
  const [mode, setMode] = React.useState("30");
  const [before, setBefore] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [matched, setMatched] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);
  const payload = (dryRun: boolean) => mode === "range" ? { mode: "range", from: new Date(from).toISOString(), to: new Date(to).toISOString(), dryRun } : mode === "custom" ? { mode: "older_than", before: new Date(before).toISOString(), dryRun } : { mode: "older_than", days: Number(mode), dryRun };
  async function preview() { setBusy(true); try { const result = await cleanupSystemLogs(payload(true)); setMatched(result.matchedCount); } catch (error) { toast.error(message(error)); } finally { setBusy(false); } }
  async function remove() { setBusy(true); try { const result = await cleanupSystemLogs(payload(false)); toast.success(t("deleted", { count: result.deletedCount })); onOpenChange(false); onDone(); } catch (error) { toast.error(message(error)); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); setMatched(null); }}><DialogContent><DialogHeader><DialogTitle>{t("cleanupDialog.title")}</DialogTitle><DialogDescription>{t("cleanupDialog.description")}</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-1.5"><Label>{t("cleanupDialog.scope")}</Label><Select value={mode} onValueChange={(value) => { setMode(value); setMatched(null); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[7,30,60,90].map((days) => <SelectItem key={days} value={String(days)}>{t("cleanupDialog.olderThanDays", { days })}</SelectItem>)}<SelectItem value="custom">{t("cleanupDialog.olderCustom")}</SelectItem><SelectItem value="range">{t("cleanupDialog.range")}</SelectItem></SelectContent></Select></div>{mode === "custom" ? <Input type="datetime-local" value={before} onChange={(e) => { setBefore(e.target.value); setMatched(null); }} /> : null}{mode === "range" ? <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>{tc("from")}</Label><Input type="datetime-local" value={from} onChange={(e) => { setFrom(e.target.value); setMatched(null); }} /></div><div className="space-y-1.5"><Label>{tc("to")}</Label><Input type="datetime-local" value={to} onChange={(e) => { setTo(e.target.value); setMatched(null); }} /></div></div> : null}{matched !== null ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"><p className="font-medium">{t("cleanupDialog.willDelete", { count: number(matched) })}</p><p className="text-xs text-muted-foreground">{t("cleanupDialog.irreversible")}</p></div> : null}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>{matched === null ? <Button disabled={busy || (mode === "custom" && !before) || (mode === "range" && (!from || !to))} onClick={preview}>{t("cleanupDialog.countLogs")}</Button> : <Button variant="destructive" disabled={busy || matched === 0} onClick={remove}>{busy ? tc("deleting") : t("cleanupDialog.confirmDelete", { count: matched })}</Button>}</DialogFooter></DialogContent></Dialog>;
}

function SettingsDialog({ open, onOpenChange, initial, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; initial: SystemLogSettings; onDone: () => void }) {
  const t = useTranslations("Admin.systemLogs.settingsDialog");
  const tc = useTranslations("Admin.common");
  const [globalDays, setGlobalDays] = React.useState(initial.globalRetentionDays);
  const [categories, setCategories] = React.useState(initial.categories);
  const [days, setDays] = React.useState<Record<string, number>>(() => Object.fromEntries(initial.rules.map((rule) => [rule.scope, rule.retentionDays])));
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() => Object.fromEntries(initial.rules.map((rule) => [rule.scope, rule.enabled])));
  const [newKey, setNewKey] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scopes = [...categories.map((category) => `CATEGORY:${category.key}`), "LEVEL:DEBUG"];
  async function save() { setBusy(true); try { await Promise.all(categories.map((category) => updateSystemLogCategory(category.id, { name: category.name, description: category.description || "", isActive: category.isActive, sortOrder: category.sortOrder }))); await updateSystemLogSettings({ globalRetentionDays: globalDays, rules: scopes.map((scope) => ({ scope, retentionDays: days[scope] || globalDays, enabled: enabled[scope] ?? Boolean(days[scope]) })) }); toast.success(t("saved")); onOpenChange(false); onDone(); } catch (error) { toast.error(message(error)); } finally { setBusy(false); } }
  async function addCategory() { setBusy(true); try { await createSystemLogCategory({ key: newKey.toUpperCase(), name: newName, isActive: true, sortOrder: (categories.length + 1) * 10 }); toast.success(t("categoryAdded")); setNewKey(""); setNewName(""); onDone(); onOpenChange(false); } catch (error) { toast.error(message(error)); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden"><DialogHeader><DialogTitle>{t("title")}</DialogTitle><DialogDescription>{t("description")}</DialogDescription></DialogHeader><Tabs defaultValue="retention" className="min-h-0"><TabsList><TabsTrigger value="retention">{t("tabRetention")}</TabsTrigger><TabsTrigger value="categories">{t("tabCategories")}</TabsTrigger></TabsList><ScrollArea className="mt-4 max-h-[58vh] pr-3"><TabsContent value="retention" className="m-0 space-y-4"><div className="flex items-center justify-between rounded-lg border p-4"><div><p className="font-medium">{t("globalRetention")}</p><p className="text-xs text-muted-foreground">{t("globalDescription")}</p></div><DaysInput value={globalDays} onChange={setGlobalDays} /></div><div className="rounded-lg border">{scopes.map((scope, index) => <React.Fragment key={scope}>{index ? <Separator /> : null}<div className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-40"><p className="font-medium">{scope.replace("CATEGORY:", "").replace("LEVEL:", "")}</p><p className="text-xs text-muted-foreground">{scope.startsWith("LEVEL:") ? t("byLevel") : t("byCategory")}</p></div><div className="flex items-center gap-3"><Switch checked={enabled[scope] ?? Boolean(days[scope])} onCheckedChange={(value) => setEnabled((current) => ({ ...current, [scope]: value }))} /><DaysInput value={days[scope] || globalDays} onChange={(value) => setDays((current) => ({ ...current, [scope]: value }))} /></div></div></React.Fragment>)}</div></TabsContent><TabsContent value="categories" className="m-0 space-y-4"><div className="grid gap-2 rounded-lg border p-4 sm:grid-cols-[1fr_1.5fr_auto]"><Input placeholder={t("newKeyPlaceholder")} value={newKey} onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} /><Input placeholder={t("newNamePlaceholder")} value={newName} onChange={(e) => setNewName(e.target.value)} /><Button disabled={busy || newKey.length < 2 || !newName.trim()} onClick={addCategory}>{tc("add")}</Button></div><div className="rounded-lg border">{categories.map((category, index) => <React.Fragment key={category.id}>{index ? <Separator /> : null}<div className="grid items-center gap-3 p-4 sm:grid-cols-[110px_1fr_auto]"><code className="text-xs font-semibold">{category.key}</code><div className="space-y-2"><Input value={category.name} onChange={(e) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, name: e.target.value } : item))} /><Input value={category.description || ""} onChange={(e) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, description: e.target.value } : item))} placeholder={tc("description")} /></div><Switch checked={category.isActive} onCheckedChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, isActive: value } : item))} /></div></React.Fragment>)}</div></TabsContent></ScrollArea></Tabs><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button><Button disabled={busy} onClick={save}>{busy ? tc("saving") : tc("saveChanges")}</Button></DialogFooter></DialogContent></Dialog>;
}

function DaysInput({ value, onChange }: { value: number; onChange: (value: number) => void }) { const t = useTranslations("Admin.systemLogs.settingsDialog"); return <div className="flex items-center gap-2"><Input className="w-24" type="number" min={1} max={3650} value={value} onChange={(e) => onChange(Number(e.target.value))} /><span className="text-sm text-muted-foreground">{t("days")}</span></div>; }
function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) { return <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><div className={`mt-1 break-all text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</div></div>; }
function JsonBlock({ title, value, plain }: { title: string; value: unknown; plain?: boolean }) { const t = useTranslations("Admin.systemLogs.detail"); const text = plain ? String(value) : JSON.stringify(value, null, 2); return <section><div className="mb-2 flex items-center justify-between"><Label>{title}</Label><Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(text).then(() => toast.success(t("copied")))}><Clipboard /> {t("copy")}</Button></div><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-5">{text}</pre></section>; }
function Actor({ log }: { log: SystemLog }) { const t = useTranslations("Admin.systemLogs.actor"); const actor = log.admin || log.user; return actor ? <div className="max-w-52"><p className="truncate text-sm font-medium">{actor.name}</p><p className="truncate text-xs text-muted-foreground">{log.admin ? t("admin") : t("user")} #{actor.id} · {actor.email}</p></div> : <span className="text-muted-foreground">—</span>; }
function LevelBadge({ level }: { level: SystemLog["level"] }) { const styles = { info: "border-blue-500/30 text-blue-700 dark:text-blue-400", warn: "border-amber-500/30 text-amber-700 dark:text-amber-400", error: "border-red-500/30 text-red-700 dark:text-red-400", debug: "border-violet-500/30 text-violet-700 dark:text-violet-400" }; return <Badge variant="outline" className={styles[level]}>{level}</Badge>; }
function useFormatters() {
  const locale = useLocale();
  return React.useMemo(() => ({
    date: (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(value)),
    time: (value: string) => new Intl.DateTimeFormat(locale, { timeStyle: "medium" }).format(new Date(value)),
    number: (value: number) => new Intl.NumberFormat(locale).format(value),
  }), [locale]);
}
function localDate(value?: string | null) { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
function message(error: unknown) { return error instanceof Error ? error.message : String(error); }
