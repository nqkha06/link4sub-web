"use client";

import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  RefreshCw,
  Search,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { cleanupLogFiles, deleteLogFile, logFileDownloadUrl } from "../api/log-files.client";
import type { LogFilesQuery } from "../query/log-files-search-params";
import type { LogEntriesResponse, LogEntry, LogFile, LogFilesListing, LogLevel } from "../types";

type Props = {
  listing: LogFilesListing;
  query: LogFilesQuery;
  selectedName: string | null;
  entries: LogEntriesResponse | null;
  canDelete: boolean;
};

const LEVEL_STYLE: Record<LogLevel, string> = {
  debug: "border-border text-muted-foreground",
  info: "border-info/40 text-info",
  warning: "border-warning/40 text-warning",
  error: "border-destructive/40 text-destructive",
};

const LIVE_REFRESH_MS = 5_000;

export function LogFilesViewer({ listing, query, selectedName, entries, canDelete }: Props) {
  const t = useTranslations("Admin.logFiles");
  const tc = useTranslations("Admin.common");
  const { dateTime, number } = useFormatters();
  const router = useRouter();
  const [live, setLive] = React.useState(false);
  const [search, setSearch] = React.useState(query.q);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [cleanupDays, setCleanupDays] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);

  const visibleFiles = listing.files.filter((file) => !query.channel || file.channel === query.channel);

  const navigate = React.useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const text = params.toString();
      router.push(text ? `/admin/log-files?${text}` : "/admin/log-files");
    },
    [router],
  );

  React.useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => router.refresh(), LIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [live, router]);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteLogFile(deleting);
      toast.success(t("deleteSuccess"));
      setDeleting(null);
      navigate({ file: null, page: "1" });
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmCleanup() {
    if (cleanupDays === null) return;
    setBusy(true);
    try {
      const result = await cleanupLogFiles(cleanupDays);
      toast.success(t("cleanupSuccess", { count: result.deletedCount }));
      setCleanupDays(null);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit rounded-xl border-border/60 shadow-none">
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="group" aria-label={t("channelGroupAria")}>
            {([null, "queue", "worker"] as const).map((channel) => (
              <button
                key={channel ?? "all"}
                type="button"
                aria-pressed={query.channel === channel}
                onClick={() => navigate({ channel, file: null, page: "1" })}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                  query.channel === channel ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {channel ? t(`channel.${channel}`) : t("all")}
              </button>
            ))}
          </div>

          <ul className="max-h-[480px] space-y-1 overflow-y-auto" aria-label={t("fileListAria")}>
            {visibleFiles.length ? (
              visibleFiles.map((file) => (
                <FileItem
                  key={file.name}
                  file={file}
                  selected={file.name === selectedName}
                  onSelect={() => navigate({ file: file.name, page: "1" })}
                />
              ))
            ) : (
              <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("emptyFiles")}
              </li>
            )}
          </ul>

          <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
            <span>
              {t("listingSummary", { count: visibleFiles.length, size: formatBytes(listing.totalSizeBytes), days: listing.retentionDays })}
            </span>
            {canDelete ? (
              <Button size="sm" variant="outline" onClick={() => setCleanupDays(listing.retentionDays)}>
                <Trash2 /> {t("cleanupOld")}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden rounded-xl border-border/60 shadow-none">
        <CardContent className="p-0">
          {entries ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-medium">{entries.meta.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("fileMeta", { size: formatBytes(entries.meta.file.sizeBytes), date: dateTime(entries.meta.file.modifiedAt) })}
                    {entries.meta.truncated ? t("truncatedNote") : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 pr-1">
                    <Switch id="log-live" checked={live} onCheckedChange={setLive} />
                    <Label htmlFor="log-live" className="text-xs">{t("autoRefresh")}</Label>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.refresh()}>
                    <RefreshCw /> {t("refresh")}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={logFileDownloadUrl(entries.meta.file.name)} download={entries.meta.file.name}>
                      <Download /> {t("download")}
                    </a>
                  </Button>
                  {canDelete ? (
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleting(entries.meta.file.name)}>
                      <Trash2 /> {t("delete")}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
                <form
                  className="relative min-w-56 flex-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    navigate({ q: search.trim(), page: "1" });
                  }}
                >
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                    placeholder={t("searchPlaceholder")}
                    aria-label={t("searchAria")}
                  />
                </form>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("levelFilterAria")}>
                  <LevelChip
                    label={t("all")}
                    count={Object.values(entries.meta.levelCounts).reduce((total, value) => total + value, 0)}
                    active={!query.level}
                    onClick={() => navigate({ level: null, page: "1" })}
                  />
                  {listing.levels.map((level) => (
                    <LevelChip
                      key={level}
                      label={t(`level.${level}`)}
                      count={entries.meta.levelCounts[level]}
                      active={query.level === level}
                      onClick={() => navigate({ level, page: "1" })}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate({ order: query.order === "desc" ? "asc" : null, page: "1" })}
                >
                  <ArrowDownUp /> {query.order === "desc" ? t("newestFirst") : t("oldestFirst")}
                </Button>
              </div>

              {entries.data.length ? (
                <ul className="divide-y">
                  {entries.data.map((entry) => (
                    <EntryRow key={entry.index} entry={entry} />
                  ))}
                </ul>
              ) : (
                <p className="p-10 text-center text-sm text-muted-foreground">
                  {t("noEntries")}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {t("pageSummary", { page: entries.meta.page, pageCount: entries.meta.totalPages, total: number(entries.meta.total) })}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={entries.meta.page <= 1} onClick={() => navigate({ page: String(entries.meta.page - 1) })}>
                    <ChevronLeft /> {t("previous")}
                  </Button>
                  <Button size="sm" variant="outline" disabled={entries.meta.page >= entries.meta.totalPages} onClick={() => navigate({ page: String(entries.meta.page + 1) })}>
                    {t("next")} <ChevronRight />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-10 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">{t("selectFileTitle")}</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {t("selectFileHint")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title", { name: deleting ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDialog.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cleanupDays !== null} onOpenChange={(open) => !open && setCleanupDays(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cleanupDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cleanupDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Label htmlFor="cleanup-days" className="shrink-0">{t("cleanupDialog.olderThan")}</Label>
            <Input
              id="cleanup-days"
              type="number"
              min={0}
              max={365}
              className="w-24"
              value={cleanupDays ?? 0}
              onChange={(event) => setCleanupDays(Math.min(365, Math.max(0, Number(event.target.value) || 0)))}
            />
            <span className="text-sm text-muted-foreground">{t("cleanupDialog.daysHint")}</span>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void confirmCleanup(); }}>
              {t("cleanupDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FileItem({ file, selected, onSelect }: { file: LogFile; selected: boolean; onSelect: () => void }) {
  const t = useTranslations("Admin.logFiles.channel");
  return (
    <li>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
          selected ? "border-primary/50 bg-primary/5" : "border-transparent hover:bg-muted/60",
        )}
      >
        <span className="min-w-0">
          <span className="block truncate font-mono text-xs font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
        </span>
        <Badge variant="outline" className="shrink-0">{t(file.channel)}</Badge>
      </button>
    </li>
  );
}

function LevelChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  const { number } = useFormatters();
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted/60",
      )}
    >
      {label} <span className="tabular-nums opacity-70">{number(count)}</span>
    </button>
  );
}

function EntryRow({ entry }: { entry: LogEntry }) {
  const t = useTranslations("Admin.logFiles.entry");
  const { dateTime } = useFormatters();
  const [open, setOpen] = React.useState(false);
  const expandable = Boolean(entry.meta || entry.stack || entry.message.length > 160 || entry.message.includes("\n"));
  return (
    <li className="px-4 py-2.5">
      <div className="flex items-start gap-3">
        <time className="w-36 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground" dateTime={entry.timestamp}>
          {dateTime(entry.timestamp)}
        </time>
        <Badge variant="outline" className={cn("w-[4.5rem] shrink-0 justify-center text-[11px] uppercase", LEVEL_STYLE[entry.level])}>
          {entry.level}
        </Badge>
        <div className="min-w-0 flex-1">
          {entry.context ? <span className="mr-2 font-mono text-xs text-muted-foreground">{entry.context}</span> : null}
          <button
            type="button"
            disabled={!expandable}
            aria-expanded={expandable ? open : undefined}
            onClick={() => setOpen((value) => !value)}
            className={cn("text-left font-mono text-[13px] leading-relaxed", !open && "line-clamp-2", expandable && "cursor-pointer")}
          >
            {entry.message}
          </button>
          {open ? (
            <div className="mt-2 space-y-2">
              {entry.meta ? <Block title={t("context")} text={JSON.stringify(entry.meta, null, 2)} /> : null}
              {entry.stack ? <Block title={t("stack")} text={entry.stack} /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs leading-relaxed">{text}</pre>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function useFormatters() {
  const locale = useLocale();
  return React.useMemo(
    () => ({
      number: (value: number) => new Intl.NumberFormat(locale).format(value),
      dateTime: (value: string) =>
        new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" }).format(new Date(value)),
    }),
    [locale],
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
