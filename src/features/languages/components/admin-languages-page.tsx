"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { BUNDLED_UI_LOCALES } from "@/contracts";
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  BookOpenText,
  Ellipsis,
  Info,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { LanguageFlag } from "@/components/language-flag";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";

import {
  deleteLanguage,
  getAdminLanguages,
  reorderLanguages,
  setDefaultLanguage,
} from "../api/languages.client";
import type { Language } from "../types";

export function AdminLanguagesPage() {
  const t = useTranslations("Admin.languages.list");
  const tc = useTranslations("Admin.common");
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("languages.create");
  const canUpdate = permissions.includes("languages.update");
  const canDelete = permissions.includes("languages.delete");
  const [items, setItems] = React.useState<Language[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [deleting, setDeleting] = React.useState<Language | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems((await getAdminLanguages()).data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    let active = true;
    void getAdminLanguages()
      .then((result) => {
        if (active) setItems(result.data);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("loadError"),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  async function mutate(
    language: Language,
    action: () => Promise<unknown>,
    success: string,
  ) {
    setBusyId(language.id);
    try {
      await action();
      toast.success(success);
      await load();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : t("updateError"),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function move(language: Language, direction: -1 | 1) {
    const index = items.findIndex(({ id }) => id === language.id);
    const target = items[index + direction];
    if (!target) return;
    await mutate(
      language,
      () =>
        reorderLanguages([
          { id: language.id, sortOrder: target.sortOrder },
          { id: target.id, sortOrder: language.sortOrder },
        ]),
      t("toast.orderUpdated"),
    );
  }

  const [search, setSearch] = React.useState("");
  // Đổi thứ tự chỉ có nghĩa khi đang xem toàn bộ danh sách.
  const reorderLocked = !canUpdate || busyId !== null || search.trim() !== "";

  const columns: ColumnDef<Language>[] = [
    {
      id: "language",
      header: t("title"),
      cell: ({ row }) => (
        <div className="flex min-w-56 items-center gap-3">
          <LanguageFlag code={row.original.flag} className="text-xl" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.nativeName || row.original.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.name}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "locale",
      header: t("meta.locale"),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.locale}</span>
      ),
    },
    {
      id: "regional",
      header: t("meta.regional"),
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.regional || "—"}
        </span>
      ),
    },
    {
      id: "direction",
      header: t("meta.direction"),
      cell: ({ row }) => (
        <span className="text-xs">{row.original.isRtl ? "RTL" : "LTR"}</span>
      ),
    },
    {
      id: "status",
      header: tc("status"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Badge
            variant={
              row.original.status === "published" ? "secondary" : "outline"
            }
          >
            {t(`publicationStatus.${row.original.status}`)}
          </Badge>
          {row.original.isDefault ? (
            <Badge variant="secondary">
              <Star />
              {t("defaultBadge")}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      id: "progress",
      header: t("progress.title"),
      cell: ({ row }) => <UiTranslationProgress language={row.original} />,
    },
    {
      id: "sortOrder",
      header: t("meta.order"),
      cell: ({ row }) => {
        const index = items.findIndex(({ id }) => id === row.original.id);
        return (
          <div className="flex items-center gap-1">
            <span className="w-6 text-sm tabular-nums">
              {row.original.sortOrder}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label={t("moveUp")}
              disabled={reorderLocked || index === 0}
              onClick={() => void move(row.original, -1)}
            >
              <ArrowUp />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label={t("moveDown")}
              disabled={reorderLocked || index === items.length - 1}
              onClick={() => void move(row.original, 1)}
            >
              <ArrowDown />
            </Button>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const language = row.original;
        const name = language.nativeName || language.name;
        if (!canUpdate && !canDelete) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={t("openMenu", { name })}
                  variant="ghost"
                  className="flex size-8 p-0 data-[state=open]:bg-muted"
                >
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {canUpdate ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/languages/${language.id}/edit`}>
                        <Pencil /> {tc("edit")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/admin/languages/${language.id}/translations`}
                      >
                        <BookOpenText /> {t("translateUi")}
                      </Link>
                    </DropdownMenuItem>
                    {!language.isDefault ? (
                      <DropdownMenuItem
                        disabled={busyId !== null}
                        onSelect={() =>
                          void mutate(
                            language,
                            () => setDefaultLanguage(language.id),
                            t("toast.setDefault", { name }),
                          )
                        }
                      >
                        <Star /> {t("setDefault")}
                      </DropdownMenuItem>
                    ) : null}
                  </>
                ) : null}
                {canDelete ? (
                  <>
                    {canUpdate ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={language.isDefault}
                      onSelect={() => setDeleting(language)}
                    >
                      <Trash2 /> {tc("delete")}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _columnId, value: string) => {
      const query = value.trim().toLowerCase();
      if (!query) return true;
      const { name, nativeName, locale, regional } = row.original;
      return [name, nativeName, locale, regional].some((field) =>
        field?.toLowerCase().includes(query),
      );
    },
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-8">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/admin/languages/create">
                <Plus />
                {t("add")}
              </Link>
            </Button>
          ) : null
        }
      />
      <Alert>
        <Info aria-hidden="true" />
        <AlertTitle>{t("info.title")}</AlertTitle>
        <AlertDescription>
          {t("info.description")}
        </AlertDescription>
      </Alert>

      {loading ? (
        <DataTableSkeleton columnCount={8} filterCount={1} shrinkZero />
      ) : error ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border bg-card p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw />
            {tc("retry")}
          </Button>
        </div>
      ) : (
        <DataTable
          table={table}
          emptyMessage={search ? tc("noResults") : t("empty")}
        >
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="h-8 pl-8"
            />
          </div>
        </DataTable>
      )}

      <DeleteLanguageDialog
        language={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => void load()}
      />
    </div>
  );
}

function UiTranslationProgress({ language }: { language: Language }) {
  const t = useTranslations("Admin.languages.list.progress");
  const bundled = BUNDLED_UI_LOCALES.includes(
    language.locale as (typeof BUNDLED_UI_LOCALES)[number],
  );
  const total = bundled
    ? Math.max(language.uiTranslation?.catalogSize ?? 0, 1)
    : (language.uiTranslation?.catalogSize ?? 0);
  const translated = bundled
    ? total
    : (language.uiTranslation?.translatedKeys ?? 0);
  const percentage = total ? Math.round((translated / total) * 100) : 0;
  return (
    <div className="w-40 space-y-1.5">
      <span className="block text-xs text-muted-foreground">
        {bundled ? t("bundled") : t("keys", { translated, total: total || "—" })}
      </span>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}

function DeleteLanguageDialog({
  language,
  onOpenChange,
  onDeleted,
}: {
  language: Language | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("Admin.languages.list");
  const tc = useTranslations("Admin.common");
  const [busy, setBusy] = React.useState(false);

  async function remove() {
    if (!language) return;
    setBusy(true);
    try {
      await deleteLanguage(language.id);
      toast.success(t("toast.deleted"));
      onOpenChange(false);
      onDeleted();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : t("deleteError"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={Boolean(language)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              void remove();
            }}
          >
            {busy ? tc("deleting") : t("deleteConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
