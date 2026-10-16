"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  FilePenLine,
  Globe2,
  LayoutGrid,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  assignMenuLocation,
  createMenu,
  deleteMenu,
  duplicateMenu,
  getMenuEditorOptions,
  getMenus,
  publishMenu,
  unpublishMenu,
  unassignMenuLocation,
} from "../api/menus.client";
import {
  type LanguageOption,
  type WebsiteMenu,
  type WebsiteMenuLocation,
  type WebsiteMenuLocationDefinition,
} from "../types";

function formatMenuDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function MenusPage() {
  const t = useTranslations("Admin.menus");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const permissions = useAdminPermissions();

  const canCreate = permissions.includes("menus.create");
  const canUpdate = permissions.includes("menus.update");
  const canDelete = permissions.includes("menus.delete");
  const canPublish = permissions.includes("menus.publish");
  const canAssign = permissions.includes("menus.assign");

  const [menus, setMenus] = React.useState<WebsiteMenu[]>([]);
  const [locations, setLocations] = React.useState<WebsiteMenuLocationDefinition[]>([]);
  const [languages, setLanguages] = React.useState<LanguageOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [assigningLocation, setAssigningLocation] =
    React.useState<WebsiteMenuLocation | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [menuResponse, options] = await Promise.all([
        getMenus(),
        getMenuEditorOptions(),
      ]);

      setMenus(menuResponse.data);
      setLocations(menuResponse.meta.locations ?? []);
      setLanguages(options.languages);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("list.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    let active = true;

    void Promise.all([getMenus(), getMenuEditorOptions()])
      .then(([menuResponse, options]) => {
        if (!active) return;

        setMenus(menuResponse.data);
        setLocations(menuResponse.meta.locations ?? []);
        setLanguages(options.languages);
      })
      .catch((loadError: unknown) => {
        if (!active) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : t("list.loadFailed"),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  async function mutate(
    menu: WebsiteMenu,
    action: () => Promise<unknown>,
    message: string,
  ) {
    setBusyId(menu.id);

    try {
      await action();
      toast.success(message);
      await load();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : t("list.mutateFailed"),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function assign(location: WebsiteMenuLocation, menuId: string) {
    setAssigningLocation(location);

    try {
      if (menuId === "none") {
        await unassignMenuLocation(location);
      } else {
        await assignMenuLocation(location, Number(menuId));
      }

      toast.success(
        t("list.locationUpdated", {
          location:
            locations.find((item) => item.key === location)?.label ??
            location,
        }),
      );
      await load();
    } catch (assignmentError) {
      toast.error(
        assignmentError instanceof Error
          ? assignmentError.message
          : t("list.assignFailed"),
      );
    } finally {
      setAssigningLocation(null);
    }
  }

  const assignedMenu = React.useCallback(
    (location: WebsiteMenuLocation) =>
      menus.find((menu) =>
        menu.locations.some((item) => item.location === location),
      ),
    [menus],
  );

  const publishedCount = menus.filter(
    (menu) => menu.status === "published",
  ).length;

  const draftCount = menus.length - publishedCount;

  const assignedLocationCount = locations.filter(({ key }) =>
    assignedMenu(key),
  ).length;
  const locationLabel = (key: string) => locations.find((item) => item.key === key)?.label ?? key;

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 pb-10">
      <AdminPageHeader
        title={t("list.title")}
        description={t("list.description")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              {tc("refresh")}
            </Button>

            {canCreate ? (
              <Button onClick={() => setCreating(true)}>
                <Plus />
                {t("create.submit")}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Menu}
          label={t("list.metrics.total.label")}
          value={menus.length}
          helper={t("list.metrics.total.helper")}
        />
        <MetricCard
          icon={CheckCircle2}
          label={t("status.published")}
          value={publishedCount}
          helper={t("list.metrics.published.helper")}
        />
        <MetricCard
          icon={FilePenLine}
          label={t("status.draft")}
          value={draftCount}
          helper={t("list.metrics.draft.helper")}
        />
        <MetricCard
          icon={LayoutGrid}
          label={t("list.metrics.assigned.label")}
          value={`${assignedLocationCount}/${locations.length}`}
          helper={t("list.metrics.assigned.helper")}
        />
      </div>

      <Card className="overflow-hidden border-border/70 shadow-none">
        <CardHeader className="border-b bg-muted/20 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">
                {t("list.locations.title")}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("list.locations.description")}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe2 className="size-3.5" />
              <span>
                {t("list.locations.activeCount", {
                  assigned: assignedLocationCount,
                  total: locations.length,
                })}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-3">
            {locations.map(({ key: location, label, description }) => {
              const current = assignedMenu(location);
              const isAssigning = assigningLocation === location;

              return (
                <div
                  key={location}
                  className="flex min-h-[154px] flex-col justify-between gap-5 bg-card p-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {label}
                          </p>

                          {current ? (
                            <span className="inline-flex size-2 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="inline-flex size-2 rounded-full bg-muted-foreground/30" />
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {description}
                        </p>
                      </div>

                      {isAssigning ? (
                        <LoaderCircle className="mt-0.5 size-4 animate-spin text-muted-foreground" />
                      ) : null}
                    </div>

                    {current ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{current.key}</span>
                        <span>•</span>
                        <span>
                          {t("list.locations.itemCount", {
                            count: current.itemCount ?? 0,
                          })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Unlink className="size-3.5" />
                        {t("list.locations.unassigned")}
                      </div>
                    )}
                  </div>

                  <Select
                    disabled={!canAssign || menus.length === 0 || isAssigning}
                    value={current?.id.toString() ?? "none"}
                    onValueChange={(value) => void assign(location, value)}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder={t("list.unassigned")} />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="none">
                        {t("list.locations.none")}
                      </SelectItem>

                      {menus.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id.toString()}>
                          {menu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              {t("list.heading")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("list.subheading")}
            </p>
          </div>

          {!loading && menus.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("list.summary", {
                total: menus.length,
                published: publishedCount,
              })}
            </p>
          ) : null}
        </div>

        {loading ? (
          <StatePanel
            icon={
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
            }
            title={t("list.loadingTitle")}
            description={t("list.loadingDescription")}
          />
        ) : error ? (
          <StatePanel
            icon={<RefreshCw className="size-5 text-destructive" />}
            title={t("list.errorTitle")}
            description={error}
            action={
              <Button variant="outline" onClick={() => void load()}>
                <RefreshCw />
                {tc("retry")}
              </Button>
            }
          />
        ) : menus.length === 0 ? (
          <StatePanel
            icon={<Menu className="size-6 text-muted-foreground" />}
            title={t("list.emptyTitle")}
            description={t("list.emptyDescription")}
            action={
              canCreate ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus />
                  {t("list.createFirst")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-5">
                      {t("list.columns.menu")}
                    </TableHead>
                    <TableHead>{tc("status")}</TableHead>
                    <TableHead>{t("list.columns.location")}</TableHead>
                    <TableHead className="text-right">
                      {t("list.columns.items")}
                    </TableHead>
                    <TableHead>{t("list.columns.updated")}</TableHead>
                    <TableHead className="w-14 pr-3">
                      <span className="sr-only">{tc("actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {menus.map((menu) => (
                    <TableRow
                      key={menu.id}
                      className="group h-[76px] hover:bg-muted/20"
                    >
                      <TableCell className="pl-5">
                        <Link
                          href={`/admin/menus/${menu.id}/edit`}
                          className="inline-flex max-w-[300px] flex-col"
                        >
                          <span className="font-medium transition-colors group-hover:text-primary">
                            {menu.name}
                          </span>
                          <span className="mt-1 truncate font-mono text-xs text-muted-foreground">
                            {menu.key}
                          </span>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <StatusBadge menu={menu} />
                      </TableCell>

                      <TableCell>
                        {menu.locations.length ? (
                          <div className="flex max-w-[360px] flex-wrap gap-1.5">
                            {menu.locations.slice(0, 2).map(({ location }) => (
                              <Badge
                                key={location}
                                variant="outline"
                                className="font-normal"
                              >
                                {locationLabel(location)}
                              </Badge>
                            ))}

                            {menu.locations.length > 2 ? (
                              <Badge
                                variant="secondary"
                                className="font-normal"
                              >
                                +{menu.locations.length - 2}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {t("list.unassigned")}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {menu.itemCount ?? 0}
                      </TableCell>

                      <TableCell>
                        <div className="min-w-[160px]">
                          <p className="text-sm">
                            {formatMenuDate(menu.updatedAt, locale)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="pr-3 text-right [&>*]:ml-auto">
                        <MenuActions
                          menu={menu}
                          busy={busyId === menu.id}
                          canUpdate={canUpdate}
                          canPublish={canPublish}
                          canCreate={canCreate}
                          canDelete={canDelete}
                          onMutate={mutate}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {menus.map((menu) => (
                <MobileMenuCard
                  key={menu.id}
                  menu={menu}
                  busy={busyId === menu.id}
                  canUpdate={canUpdate}
                  canPublish={canPublish}
                  canCreate={canCreate}
                  canDelete={canDelete}
                  onMutate={mutate}
                  locationLabel={locationLabel}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <CreateMenuDialog
        languages={languages}
        open={creating}
        onOpenChange={setCreating}
        onCreated={() => void load()}
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  helper: string;
}) {
  return (
    <Card className="gap-0 border-border/70 shadow-none">
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>

        <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/30">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ menu }: { menu: WebsiteMenu }) {
  const t = useTranslations("Admin.menus.status");
  const published = menu.status === "published";

  if (published && menu.isDirty) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
          {t("published")}
        </Badge>
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
        >
          {t("changed")}
        </Badge>
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        published
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {published ? t("published") : t("draft")}
    </Badge>
  );
}

function MobileMenuCard({
  menu,
  busy,
  canUpdate,
  canPublish,
  canCreate,
  canDelete,
  onMutate,
  locationLabel,
}: {
  menu: WebsiteMenu;
  busy: boolean;
  canUpdate: boolean;
  canPublish: boolean;
  canCreate: boolean;
  canDelete: boolean;
  locationLabel: (key: string) => string;
  onMutate: (
    menu: WebsiteMenu,
    action: () => Promise<unknown>,
    message: string,
  ) => Promise<void>;
}) {
  const t = useTranslations("Admin.menus");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();

  return (
    <Card className="gap-0 overflow-hidden border-border/70 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <Link
              href={`/admin/menus/${menu.id}/edit`}
              className="inline-flex max-w-full items-center gap-1 font-medium"
            >
              <span className="truncate">{menu.name}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>

            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {menu.key}
            </p>
          </div>

          <MenuActions
            menu={menu}
            busy={busy}
            canUpdate={canUpdate}
            canPublish={canPublish}
            canCreate={canCreate}
            canDelete={canDelete}
            onMutate={onMutate}
          />
        </div>

        <div className="grid grid-cols-2 gap-px border-y bg-border">
          <div className="bg-card p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {tc("status")}
            </p>
            <div className="mt-2">
              <StatusBadge menu={menu} />
            </div>
          </div>

          <div className="bg-card p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {t("list.mobile.itemCount")}
            </p>
            <p className="mt-2 text-sm font-medium tabular-nums">
              {menu.itemCount ?? 0}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {t("list.columns.location")}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {menu.locations.length ? (
                menu.locations.map(({ location }) => (
                  <Badge
                    key={location}
                    variant="outline"
                    className="font-normal"
                  >
                    {locationLabel(location)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t("list.unassigned")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
            <span>{t("list.mobile.lastUpdated")}</span>
            <span className="text-right">
              {formatMenuDate(menu.updatedAt, locale)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MenuActions({
  menu,
  busy,
  canUpdate,
  canPublish,
  canCreate,
  canDelete,
  onMutate,
}: {
  menu: WebsiteMenu;
  busy: boolean;
  canUpdate: boolean;
  canPublish: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onMutate: (
    menu: WebsiteMenu,
    action: () => Promise<unknown>,
    message: string,
  ) => Promise<void>;
}) {
  const t = useTranslations("Admin.menus.actions");
  const tc = useTranslations("Admin.common");
  const isPublishedClean =
    menu.status === "published" && !menu.isDirty;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" disabled={busy}>
          {busy ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <MoreHorizontal />
          )}
          <span className="sr-only">{t("open")}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {canUpdate ? (
          <DropdownMenuItem asChild>
            <Link href={`/admin/menus/${menu.id}/edit`}>
              <ExternalLink />
              {tc("edit")}
            </Link>
          </DropdownMenuItem>
        ) : null}

        {canPublish ? (
          <DropdownMenuItem
            onSelect={() =>
              void onMutate(
                menu,
                () =>
                  isPublishedClean
                    ? unpublishMenu(menu.id)
                    : publishMenu(menu.id),
                isPublishedClean
                  ? t("unpublished")
                  : t("published"),
              )
            }
          >
            <Send />
            {isPublishedClean ? t("unpublish") : t("publish")}
          </DropdownMenuItem>
        ) : null}

        {canCreate ? (
          <DropdownMenuItem
            onSelect={() =>
              void onMutate(
                menu,
                () => duplicateMenu(menu.id),
                t("duplicated"),
              )
            }
          >
            <Copy />
            {t("duplicate")}
          </DropdownMenuItem>
        ) : null}

        {canDelete ? (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() =>
                void onMutate(
                  menu,
                  () => deleteMenu(menu.id),
                  t("deleted"),
                )
              }
            >
              <Trash2 />
              {tc("delete")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatePanel({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl border bg-muted/30">
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium text-foreground">{title}</p>

      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function CreateMenuDialog({
  languages,
  open,
  onOpenChange,
  onCreated,
}: {
  languages: LanguageOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const t = useTranslations("Admin.menus.create");
  const tc = useTranslations("Admin.common");
  const [name, setName] = React.useState("");
  const [key, setKey] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [keyTouched, setKeyTouched] = React.useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setName("");
      setKey("");
      setDescription("");
      setKeyTouched(false);
      setSaving(false);
    }
    onOpenChange(nextOpen);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const publishedLanguages = languages.filter(
      (language) => language.status === "published",
    );

    const defaultLanguage =
      publishedLanguages.find((language) => language.isDefault) ??
      publishedLanguages[0];

    if (!defaultLanguage) {
      toast.error(t("needLanguage"));
      return;
    }

    setSaving(true);

    try {
      await createMenu({
        name,
        key,
        description,
        translations: [{ locale: defaultLanguage.locale, title: name }],
      });

      toast.success(t("created"));
      handleOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("failed"),
      );
    } finally {
      setSaving(false);
    }
  }

  function generateKey(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl border bg-muted/40">
              <Sparkles className="size-4 text-muted-foreground" />
            </div>

            <DialogTitle>{t("title")}</DialogTitle>

            <DialogDescription className="leading-6">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-6">
            <div className="grid gap-2">
              <Label htmlFor="menu-name">{t("nameLabel")}</Label>
              <Input
                id="menu-name"
                autoFocus
                maxLength={100}
                placeholder={t("namePlaceholder")}
                required
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);

                  if (!keyTouched) {
                    setKey(generateKey(value));
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("nameHelp")}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="menu-key">{t("keyLabel")}</Label>
              <Input
                id="menu-key"
                className="font-mono"
                pattern="[a-z][a-z0-9-]{1,49}"
                placeholder="main-navigation"
                required
                value={key}
                onChange={(event) => {
                  setKeyTouched(true);
                  setKey(event.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t.rich("keyHelp", {
                  mono: (chunks) => (
                    <span className="font-mono">{chunks}</span>
                  ),
                })}
              </p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="menu-description">{tc("description")}</Label>
                <span className="text-xs text-muted-foreground">
                  {description.length}/500
                </span>
              </div>

              <Textarea
                id="menu-description"
                maxLength={500}
                rows={4}
                placeholder={t("descriptionPlaceholder")}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              {tc("cancel")}
            </Button>

            <Button disabled={saving} type="submit">
              {saving ? <LoaderCircle className="animate-spin" /> : <Plus />}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
