"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Copy,
  ExternalLink,
  GripVertical,
  Languages,
  Link2,
  LoaderCircle,
  Menu,
  Monitor,
  MoreHorizontal,
  PanelRight,
  Plus,
  Save,
  Send,
  Smartphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  getMenu,
  getMenuEditorOptions,
  publishMenu,
  saveMenuTree,
  updateMenu,
} from "../api/menus.client";
import type {
  LanguageOption,
  PageOption,
  WebsiteMenu,
  WebsiteMenuItem,
  WebsiteMenuItemType,
} from "../types";

let nextTemporaryId = -1;

type Translate = (key: string, values?: Record<string, string | number>) => string;

const itemTypeKeys: Record<WebsiteMenuItemType, string> = {
  CUSTOM_URL: "itemTypes.customUrl",
  PAGE: "itemTypes.page",
  ANCHOR: "itemTypes.anchor",
  GROUP: "itemTypes.group",
};

export function MenuEditor({ menuId }: { menuId: number }) {
  const t = useTranslations("Admin.menus.editor");
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const permissions = useAdminPermissions();

  const canUpdate = permissions.includes("menus.update");
  const canPublish = permissions.includes("menus.publish");

  const [menu, setMenu] = React.useState<WebsiteMenu | null>(null);
  const [items, setItems] = React.useState<WebsiteMenuItem[]>([]);
  const [languages, setLanguages] = React.useState<LanguageOption[]>([]);
  const [pages, setPages] = React.useState<PageOption[]>([]);
  const [locale, setLocale] = React.useState("vi");
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [treeDirty, setTreeDirty] = React.useState(false);
  const [metadataDirty, setMetadataDirty] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState<"desktop" | "mobile">(
    "desktop",
  );
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [menuResult, options] = await Promise.all([
        getMenu(menuId),
        getMenuEditorOptions(),
      ]);

      const publishedLanguages = options.languages.filter(
        (item) => item.status === "published",
      );

      const defaultLocale =
        publishedLanguages.find((item) => item.isDefault)?.locale ??
        publishedLanguages[0]?.locale ??
        "vi";

      setMenu(menuResult);
      setItems(menuResult.items);
      setLanguages(publishedLanguages);
      setPages(options.pages);
      setLocale(defaultLocale);
      setSelectedId(menuResult.items[0]?.id ?? null);
      setTreeDirty(false);
      setMetadataDirty(false);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [menuId, t]);

  React.useEffect(() => {
    let active = true;

    void Promise.all([getMenu(menuId), getMenuEditorOptions()])
      .then(([menuResult, options]) => {
        if (!active) return;

        const publishedLanguages = options.languages.filter(
          (item) => item.status === "published",
        );

        const defaultLocale =
          publishedLanguages.find((item) => item.isDefault)?.locale ??
          publishedLanguages[0]?.locale ??
          "vi";

        setMenu(menuResult);
        setItems(menuResult.items);
        setLanguages(publishedLanguages);
        setPages(options.pages);
        setLocale(defaultLocale);
        setSelectedId(menuResult.items[0]?.id ?? null);
      })
      .catch((loadError: unknown) => {
        if (!active) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : t("loadFailed"),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [menuId, t]);

  const defaultLocale =
    languages.find((language) => language.isDefault)?.locale ??
    languages[0]?.locale ??
    "vi";

  const activeLanguage =
    languages.find((language) => language.locale === locale) ?? languages[0];

  const selected =
    selectedId === null ? null : findItem(items, selectedId);

  const totalItems = React.useMemo(() => countItems(items), [items]);
  const enabledItems = React.useMemo(
    () => countEnabledItems(items),
    [items],
  );

  const localeProgress = React.useMemo(
    () => getLocaleProgress(items, locale),
    [items, locale],
  );

  const hasChanges = treeDirty || metadataDirty || menu?.isDirty;

  function updateItems(next: WebsiteMenuItem[]) {
    setItems(next);
    setTreeDirty(true);
  }

  function updateSelected(patch: Partial<WebsiteMenuItem>) {
    if (selectedId === null) return;

    updateItems(
      mapItem(items, selectedId, (item) => ({
        ...item,
        ...patch,
      })),
    );
  }

  function updateTranslation(
    translationPatch: Partial<WebsiteMenuItem["translations"][number]>,
  ) {
    if (!selected) return;

    const current = selected.translations.find(
      (translation) => translation.locale === locale,
    );

    const nextTranslation = {
      locale,
      label: "",
      title: null,
      ariaLabel: null,
      urlOverride: null,
      ...current,
      ...translationPatch,
    };

    updateSelected({
      translations: current
        ? selected.translations.map((translation) =>
            translation.locale === locale ? nextTranslation : translation,
          )
        : [...selected.translations, nextTranslation],
    });
  }

  function copySelectedTranslationFromDefault() {
    if (!selected || locale === defaultLocale) return;

    const source = selected.translations.find(
      (translation) => translation.locale === defaultLocale,
    );

    if (!source) {
      toast.error(t("toasts.copyMissingSource"));
      return;
    }

    updateTranslation({
      label: source.label,
      title: source.title,
      ariaLabel: source.ariaLabel,
      urlOverride: source.urlOverride,
    });

    toast.success(t("toasts.copied"));
  }

  function addItem(parentId: number | null = null) {
    const item = createEmptyItem(defaultLocale, t("newItemLabel"));

    updateItems(
      parentId === null
        ? [...items, item]
        : mapItem(items, parentId, (parent) => ({
            ...parent,
            children: [...parent.children, item],
          })),
    );

    setSelectedId(item.id);
  }

  function removeSelected() {
    if (selectedId === null) return;

    const nextItems = removeItem(items, selectedId);
    updateItems(nextItems);
    setSelectedId(nextItems[0]?.id ?? null);
  }

  async function saveMetadata() {
    if (!menu) return;

    setSaving(true);

    try {
      const result = await updateMenu(menu.id, {
        name: menu.name,
        description: menu.description ?? "",
        translations: menu.translations.map((translation) => ({
          locale: translation.locale,
          title: translation.title ?? "",
        })),
      });

      setMenu(result);
      setMetadataDirty(false);

      toast.success(t("toasts.metadataSaved"));
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : t("toasts.metadataSaveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    if (!menu || (!treeDirty && !metadataDirty)) return;

    setSaving(true);

    try {
      let current = menu;

      if (metadataDirty) {
        current = await updateMenu(current.id, {
          name: current.name,
          description: current.description ?? "",
          translations: current.translations.map((translation) => ({
            locale: translation.locale,
            title: translation.title ?? "",
          })),
        });
      }

      if (treeDirty) {
        current = await saveMenuTree(
          current.id,
          current.draftVersion,
          items,
        );
      }

      setMenu(current);
      setItems(current.items);
      setTreeDirty(false);
      setMetadataDirty(false);

      toast.success(t("toasts.allSaved"));
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : t("toasts.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!menu) return;

    setPublishing(true);

    try {
      let current = menu;

      if (metadataDirty) {
        current = await updateMenu(current.id, {
          name: current.name,
          description: current.description ?? "",
          translations: current.translations.map((translation) => ({
            locale: translation.locale,
            title: translation.title ?? "",
          })),
        });
      }

      if (treeDirty) {
        current = await saveMenuTree(
          current.id,
          current.draftVersion,
          items,
        );
      }

      const result = await publishMenu(current.id);

      setMenu(result);
      setItems(result.items);
      setTreeDirty(false);
      setMetadataDirty(false);

      toast.success(t("toasts.published"));
    } catch (publishError) {
      toast.error(
        publishError instanceof Error
          ? publishError.message
          : t("toasts.publishFailed"),
      );
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <StatePanel
        icon={<LoaderCircle className="size-5 animate-spin" />}
        title={t("loadingTitle")}
        description={t("loadingDescription")}
      />
    );
  }

  if (error || !menu) {
    return (
      <StatePanel
        icon={<CircleAlert className="size-5" />}
        title={t("openFailedTitle")}
        description={error || t("notFound")}
        action={
          <Button variant="outline" onClick={() => void load()}>
            {tc("retry")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 pb-10">
      <AdminPageHeader
        title={menu.name}
        description={t("description")}
        breadcrumbs={[
          { label: t("breadcrumbs.dashboard"), href: "/admin" },
          { label: t("breadcrumbs.menus"), href: "/admin/menus" },
          { label: menu.name },
        ]}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                menu.status === "published"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted/40 text-muted-foreground",
              )}
            >
              {menu.status === "published"
                ? t("status.published")
                : t("status.draft")}
            </Badge>

            {hasChanges ? (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
              >
                {t("unsavedBadge")}
              </Badge>
            ) : null}
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/menus")}
            >
              <ArrowLeft />
              {t("backToList")}
            </Button>

            {canUpdate ? (
              <Button
                variant="outline"
                disabled={
                  (!treeDirty && !metadataDirty) ||
                  saving ||
                  publishing
                }
                onClick={() => void saveAll()}
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Save />
                )}
                {tc("saveChanges")}
              </Button>
            ) : null}

            {canPublish ? (
              <Button
                disabled={publishing || saving}
                onClick={() => void publish()}
              >
                {publishing ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Send />
                )}
                {t("publish")}
              </Button>
            ) : null}
          </div>
        }
      />

      <EditorToolbar
        languages={languages}
        locale={locale}
        onLocaleChange={setLocale}
        totalItems={totalItems}
        enabledItems={enabledItems}
        translated={localeProgress.translated}
        missing={localeProgress.missing}
        activeLanguage={activeLanguage}
      />

      <Card className="overflow-hidden border-border/70 shadow-none">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_1.4fr_1fr_auto] lg:items-end">
          <div className="grid gap-2">
            <Label htmlFor="menu-name">{t("meta.nameLabel")}</Label>
            <Input
              id="menu-name"
              disabled={!canUpdate}
              value={menu.name}
              onChange={(event) => {
                setMetadataDirty(true);
                setMenu((current) =>
                  current
                    ? { ...current, name: event.target.value }
                    : current,
                );
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="menu-description">{tc("description")}</Label>
            <Input
              id="menu-description"
              disabled={!canUpdate}
              placeholder={t("meta.descriptionPlaceholder")}
              value={menu.description ?? ""}
              onChange={(event) => {
                setMetadataDirty(true);
                setMenu((current) =>
                  current
                    ? {
                        ...current,
                        description: event.target.value,
                      }
                    : current,
                );
              }}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="menu-title">
                {t("meta.titleLabel", {
                  language: activeLanguage?.nativeName ?? locale,
                })}
              </Label>

              {locale !== defaultLocale ? (
                <span className="text-xs text-muted-foreground">
                  {t("meta.translatingFrom", {
                    locale: defaultLocale.toUpperCase(),
                  })}
                </span>
              ) : null}
            </div>

            <Input
              id="menu-title"
              disabled={!canUpdate}
              placeholder={t("meta.titlePlaceholder")}
              value={
                menu.translations.find(
                  (translation) => translation.locale === locale,
                )?.title ?? ""
              }
              onChange={(event) => {
                const existing = menu.translations.some(
                  (translation) => translation.locale === locale,
                );

                setMetadataDirty(true);
                setMenu({
                  ...menu,
                  translations: existing
                    ? menu.translations.map((translation) =>
                        translation.locale === locale
                          ? {
                              ...translation,
                              title: event.target.value,
                            }
                          : translation,
                      )
                    : [
                        ...menu.translations,
                        {
                          locale,
                          title: event.target.value,
                        },
                      ],
                });
              }}
            />
          </div>

          <Button
            variant="outline"
            disabled={!metadataDirty || !canUpdate || saving}
            onClick={() => void saveMetadata()}
          >
            {saving ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Save />
            )}
            {t("meta.save")}
          </Button>
        </CardContent>
      </Card>

      <div className="grid min-h-[720px] gap-4 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <Card className="gap-0 overflow-hidden border-border/70 shadow-none">
          <CardHeader className="flex-row items-center justify-between gap-3 border-b bg-muted/10 px-4 py-3">
            <div className="min-w-0">
              <CardTitle className="text-sm">{t("tree.title")}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("tree.summary", { count: totalItems })}
              </p>
            </div>

            {canUpdate ? (
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => addItem()}
              >
                <Plus />
                <span className="sr-only">{t("tree.addItem")}</span>
              </Button>
            ) : null}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[660px]">
              {items.length ? (
                <div className="p-3">
                  <MenuTree
                    items={items}
                    locale={locale}
                    defaultLocale={defaultLocale}
                    selectedId={selectedId}
                    disabled={!canUpdate}
                    onChange={updateItems}
                    onSelect={setSelectedId}
                    onAddChild={addItem}
                  />
                </div>
              ) : (
                <EmptyStructure
                  canUpdate={canUpdate}
                  onAdd={() => addItem()}
                />
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden border-border/70 shadow-none">
          <CardHeader className="border-b bg-muted/10 px-5 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <PanelRight className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm">
                    {t("item.title")}
                  </CardTitle>
                </div>

                {selected ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {getItemLabel(
                      selected,
                      locale,
                      defaultLocale,
                      t("tree.untitled"),
                    )}
                  </p>
                ) : null}
              </div>

              {selected ? (
                <TranslationStatus
                  item={selected}
                  locale={locale}
                />
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {selected ? (
              <ScrollArea className="h-[660px]">
                <div className="space-y-6 p-5">
                  <ItemOverview
                    item={selected}
                    locale={locale}
                    defaultLocale={defaultLocale}
                    canUpdate={canUpdate}
                    onEnabledChange={(checked) =>
                      updateSelected({ isEnabled: checked })
                    }
                  />

                  <EditorSection
                    title={t("destination.title")}
                    description={t("destination.description")}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t("destination.linkType")}>
                        <Select
                          disabled={!canUpdate}
                          value={selected.type}
                          onValueChange={(value) =>
                            updateSelected({
                              type: value as WebsiteMenuItemType,
                              pageId:
                                value === "PAGE"
                                  ? selected.pageId
                                  : null,
                              url:
                                value === "CUSTOM_URL" ||
                                value === "ANCHOR"
                                  ? selected.url
                                  : null,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="CUSTOM_URL">
                              {t("destination.types.customUrl")}
                            </SelectItem>
                            <SelectItem value="PAGE">
                              {t("destination.types.page")}
                            </SelectItem>
                            <SelectItem value="ANCHOR">
                              {t("destination.types.anchor")}
                            </SelectItem>
                            <SelectItem value="GROUP">
                              {t("destination.types.group")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      {selected.type === "PAGE" ? (
                        <Field label={t("destination.targetPage")}>
                          <Select
                            disabled={!canUpdate}
                            value={selected.pageId?.toString()}
                            onValueChange={(value) =>
                              updateSelected({
                                pageId: Number(value),
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("destination.selectPage")} />
                            </SelectTrigger>

                            <SelectContent>
                              {pages.map((page) => (
                                <SelectItem
                                  key={page.id}
                                  value={page.id.toString()}
                                >
                                  {page.title} · /{page.slug}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      ) : selected.type === "CUSTOM_URL" ||
                        selected.type === "ANCHOR" ? (
                        <Field
                          label={
                            selected.type === "ANCHOR"
                              ? t("destination.anchorLabel")
                              : t("destination.urlLabel")
                          }
                        >
                          <Input
                            disabled={!canUpdate}
                            placeholder={
                              selected.type === "ANCHOR"
                                ? "#section-name"
                                : t("destination.urlPlaceholder")
                            }
                            value={selected.url ?? ""}
                            onChange={(event) =>
                              updateSelected({
                                url: event.target.value,
                              })
                            }
                          />
                        </Field>
                      ) : (
                        <div />
                      )}

                      {selected.type !== "GROUP" ? (
                        <>
                          <Field
                            label={t("destination.iconKey")}
                            hint={t("destination.iconKeyHint")}
                          >
                            <Input
                              disabled={!canUpdate}
                              maxLength={50}
                              placeholder="youtube"
                              value={selected.iconKey ?? ""}
                              onChange={(event) =>
                                updateSelected({
                                  iconKey:
                                    event.target.value
                                      .toLowerCase()
                                      .replace(
                                        /[^a-z0-9-]/g,
                                        "",
                                      ) || null,
                                })
                              }
                            />
                          </Field>

                          <Field label={t("destination.openIn")}>
                            <Select
                              disabled={!canUpdate}
                              value={selected.target}
                              onValueChange={(value) =>
                                updateSelected({
                                  target: value as
                                    | "SELF"
                                    | "BLANK",
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>

                              <SelectContent>
                                <SelectItem value="SELF">
                                  {t("destination.targets.self")}
                                </SelectItem>
                                <SelectItem value="BLANK">
                                  {t("destination.targets.blank")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        </>
                      ) : null}
                    </div>
                  </EditorSection>

                  <EditorSection
                    title={t("content.title", {
                      language: activeLanguage?.nativeName ?? locale,
                    })}
                    description={
                      locale === defaultLocale
                        ? t("content.defaultDescription")
                        : t("content.translatingDescription", {
                            locale: locale.toUpperCase(),
                          })
                    }
                    action={
                      locale !== defaultLocale && canUpdate ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={
                            copySelectedTranslationFromDefault
                          }
                        >
                          <Copy />
                          {t("content.copyFrom", {
                            locale: defaultLocale.toUpperCase(),
                          })}
                        </Button>
                      ) : null
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t("content.label")}>
                        <Input
                          disabled={!canUpdate}
                          maxLength={100}
                          placeholder={t("content.labelPlaceholder")}
                          value={
                            selected.translations.find(
                              (translation) =>
                                translation.locale === locale,
                            )?.label ?? ""
                          }
                          onChange={(event) =>
                            updateTranslation({
                              label: event.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label={t("content.titleTooltip")}>
                        <Input
                          disabled={!canUpdate}
                          maxLength={160}
                          placeholder={tc("optional")}
                          value={
                            selected.translations.find(
                              (translation) =>
                                translation.locale === locale,
                            )?.title ?? ""
                          }
                          onChange={(event) =>
                            updateTranslation({
                              title: event.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label={t("content.ariaLabel")}>
                        <Input
                          disabled={!canUpdate}
                          maxLength={160}
                          placeholder={t("content.ariaPlaceholder")}
                          value={
                            selected.translations.find(
                              (translation) =>
                                translation.locale === locale,
                            )?.ariaLabel ?? ""
                          }
                          onChange={(event) =>
                            updateTranslation({
                              ariaLabel: event.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field
                        label={t("content.urlOverride")}
                        hint={t("content.urlOverrideHint")}
                      >
                        <Input
                          disabled={!canUpdate}
                          placeholder="/en/about"
                          value={
                            selected.translations.find(
                              (translation) =>
                                translation.locale === locale,
                            )?.urlOverride ?? ""
                          }
                          onChange={(event) =>
                            updateTranslation({
                              urlOverride: event.target.value,
                            })
                          }
                        />
                      </Field>
                    </div>
                  </EditorSection>

                  <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row">
                    <Button
                      disabled={!canUpdate}
                      variant="outline"
                      onClick={() => addItem(selected.id)}
                    >
                      <Plus />
                      {t("addChild")}
                    </Button>

                    <Button
                      disabled={!canUpdate}
                      variant="destructive"
                      onClick={removeSelected}
                    >
                      <Trash2 />
                      {t("removeItem")}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <EmptySelection />
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden border-border/70 shadow-none">
          <CardHeader className="border-b bg-muted/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">{t("preview.title")}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeLanguage?.nativeName ?? locale}
                </p>
              </div>

              <div className="flex rounded-lg border p-0.5">
                <Button
                  size="icon-sm"
                  variant={
                    previewMode === "desktop"
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor />
                  <span className="sr-only">{t("preview.desktop")}</span>
                </Button>

                <Button
                  size="icon-sm"
                  variant={
                    previewMode === "mobile"
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone />
                  <span className="sr-only">{t("preview.mobile")}</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <MenuPreview
              items={items}
              locale={locale}
              defaultLocale={defaultLocale}
              menuTitle={
                menu.translations.find(
                  (translation) => translation.locale === locale,
                )?.title ??
                menu.translations.find(
                  (translation) =>
                    translation.locale === defaultLocale,
                )?.title ??
                menu.name
              }
              mode={previewMode}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EditorToolbar({
  languages,
  locale,
  onLocaleChange,
  totalItems,
  enabledItems,
  translated,
  missing,
  activeLanguage,
}: {
  languages: LanguageOption[];
  locale: string;
  onLocaleChange: (locale: string) => void;
  totalItems: number;
  enabledItems: number;
  translated: number;
  missing: number;
  activeLanguage?: LanguageOption;
}) {
  const t = useTranslations("Admin.menus.editor");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
        <MiniStat label={t("toolbar.totalItems")} value={totalItems} />
        <MiniStat label={t("toolbar.visible")} value={enabledItems} />
        <MiniStat label={t("toolbar.translated")} value={translated} />

        {missing > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <CircleAlert className="size-3.5" />
            {t("toolbar.missing", { count: missing })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            {t("toolbar.complete")}
          </div>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <Languages className="size-4" />
          {t("toolbar.contentLanguage")}
        </div>

        <Select value={locale} onValueChange={onLocaleChange}>
          <SelectTrigger className="w-full bg-background sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {languages.map((language) => (
              <SelectItem
                key={language.locale}
                value={language.locale}
              >
                <span className="flex items-center gap-2">
                  <span>
                    {language.nativeName || language.locale}
                  </span>
                  <span className="text-xs uppercase text-muted-foreground">
                    {language.locale}
                  </span>
                  {language.isDefault ? (
                    <span className="text-xs text-muted-foreground">
                      {t("toolbar.default")}
                    </span>
                  ) : null}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="outline" className="hidden sm:inline-flex">
          {activeLanguage?.locale.toUpperCase() ?? locale.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function ItemOverview({
  item,
  locale,
  defaultLocale,
  canUpdate,
  onEnabledChange,
}: {
  item: WebsiteMenuItem;
  locale: string;
  defaultLocale: string;
  canUpdate: boolean;
  onEnabledChange: (checked: boolean) => void;
}) {
  const t = useTranslations("Admin.menus.editor");
  const label = getItemLabel(item, locale, defaultLocale, t("tree.untitled"));

  return (
    <div className="rounded-xl border bg-muted/[0.12] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
              {item.type === "GROUP" ? (
                <Menu className="size-4 text-muted-foreground" />
              ) : (
                <Link2 className="size-4 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {label}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {t(itemTypeKeys[item.type])} · {getItemDestination(item, t)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {item.isEnabled ? t("overview.shown") : t("overview.hidden")}
          </span>
          <Switch
            checked={item.isEnabled}
            disabled={!canUpdate}
            onCheckedChange={onEnabledChange}
          />
        </div>
      </div>
    </div>
  );
}

function TranslationStatus({
  item,
  locale,
}: {
  item: WebsiteMenuItem;
  locale: string;
}) {
  const translation = item.translations.find(
    (entry) => entry.locale === locale,
  );
  const t = useTranslations("Admin.menus.editor");
  const complete = Boolean(translation?.label?.trim());

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0",
        complete
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
      )}
    >
      {complete ? (
        <>
          <Check className="mr-1 size-3" />
          {t("translationStatus.translated")}
        </>
      ) : (
        <>
          <CircleAlert className="mr-1 size-3" />
          {t("translationStatus.missing")}
        </>
      )}
    </Badge>
  );
}

function EditorSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t pt-5 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        {hint ? (
          <span className="text-xs text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function EmptyStructure({
  canUpdate,
  onAdd,
}: {
  canUpdate: boolean;
  onAdd: () => void;
}) {
  const t = useTranslations("Admin.menus.editor");

  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/30">
        <Menu className="size-5 text-muted-foreground" />
      </div>

      <p className="mt-4 text-sm font-medium">
        {t("empty.structureTitle")}
      </p>

      <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">
        {t("empty.structureDescription")}
      </p>

      {canUpdate ? (
        <Button className="mt-4" onClick={onAdd}>
          <Plus />
          {t("empty.addFirst")}
        </Button>
      ) : null}
    </div>
  );
}

function EmptySelection() {
  const t = useTranslations("Admin.menus.editor");

  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-8 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl border bg-muted/30">
        <PanelRight className="size-5 text-muted-foreground" />
      </div>

      <p className="mt-4 text-sm font-medium">
        {t("empty.selectionTitle")}
      </p>

      <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">
        {t("empty.selectionDescription")}
      </p>
    </div>
  );
}

function MenuTree({
  items,
  locale,
  defaultLocale,
  selectedId,
  disabled,
  onChange,
  onSelect,
  onAddChild,
  depth = 0,
}: {
  items: WebsiteMenuItem[];
  locale: string;
  defaultLocale: string;
  selectedId: number | null;
  disabled: boolean;
  onChange: (items: WebsiteMenuItem[]) => void;
  onSelect: (id: number) => void;
  onAddChild: (id: number) => void;
  depth?: number;
}) {
  const t = useTranslations("Admin.menus.editor");
  const tc = useTranslations("Admin.common");

  return (
    <Sortable
      value={items}
      getItemValue={(item) => item.id}
      onValueChange={onChange}
    >
      <SortableContent className="space-y-1.5">
        {items.map((item) => {
          const currentTranslation = item.translations.find(
            (entry) => entry.locale === locale,
          );
          const fallbackTranslation = item.translations.find(
            (entry) => entry.locale === defaultLocale,
          );
          const hasLocaleLabel = Boolean(
            currentTranslation?.label?.trim(),
          );

          const label =
            currentTranslation?.label ||
            fallbackTranslation?.label ||
            item.translations[0]?.label ||
            t("tree.untitled");

          const selected = selectedId === item.id;

          return (
            <SortableItem
              disabled={disabled}
              key={item.id}
              value={item.id}
            >
              <div
                className={cn(
                  "overflow-hidden rounded-lg border transition-colors",
                  selected
                    ? "border-primary/40 bg-primary/[0.035] ring-1 ring-primary/10"
                    : "border-transparent bg-background hover:border-border hover:bg-muted/[0.18]",
                  !item.isEnabled && "opacity-60",
                )}
              >
                <div className="flex min-h-12 items-center gap-1.5 px-1.5 py-1.5">
                  <SortableItemHandle asChild>
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground",
                        disabled
                          ? "cursor-default"
                          : "cursor-grab hover:bg-muted active:cursor-grabbing",
                      )}
                    >
                      <GripVertical className="size-3.5" />
                    </span>
                  </SortableItemHandle>

                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    onClick={() => onSelect(item.id)}
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-card">
                      {item.type === "GROUP" ? (
                        <Menu className="size-3.5 text-muted-foreground" />
                      ) : (
                        <Link2 className="size-3.5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {label}
                        </span>

                        {!hasLocaleLabel ? (
                          <span
                            className="size-1.5 shrink-0 rounded-full bg-amber-500"
                            title={t("tree.missingTranslation", {
                              locale: locale.toUpperCase(),
                            })}
                          />
                        ) : null}
                      </div>

                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {getItemDestination(item, t)}
                      </p>
                    </div>
                  </button>

                  {!disabled && depth < 2 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <MoreHorizontal />
                          <span className="sr-only">{tc("actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => onAddChild(item.id)}
                        >
                          <Plus />
                          {t("addChild")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>

                {item.children.length ? (
                  <div className="border-t bg-muted/[0.06] py-1.5 pl-4 pr-1.5">
                    <div className="border-l pl-2">
                      <MenuTree
                        depth={depth + 1}
                        disabled={disabled}
                        items={item.children}
                        locale={locale}
                        defaultLocale={defaultLocale}
                        selectedId={selectedId}
                        onAddChild={onAddChild}
                        onChange={(children) =>
                          onChange(
                            items.map((candidate) =>
                              candidate.id === item.id
                                ? {
                                    ...candidate,
                                    children,
                                  }
                                : candidate,
                            ),
                          )
                        }
                        onSelect={onSelect}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </SortableItem>
          );
        })}
      </SortableContent>
    </Sortable>
  );
}

function MenuPreview({
  items,
  locale,
  defaultLocale,
  menuTitle,
  mode,
}: {
  items: WebsiteMenuItem[];
  locale: string;
  defaultLocale: string;
  menuTitle: string;
  mode: "desktop" | "mobile";
}) {
  const t = useTranslations("Admin.menus.editor");
  const untitled = t("tree.untitled");
  const visibleItems = items.filter((item) => item.isEnabled);

  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-xl border bg-background shadow-sm",
        mode === "mobile" ? "max-w-[280px]" : "w-full",
      )}
    >
      {mode === "desktop" ? (
        <>
          <div className="flex h-14 items-center justify-between gap-3 border-b px-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
                <Sparkles className="size-3.5" />
              </div>

              <span className="truncate text-xs font-semibold">
                {menuTitle || t("preview.siteFallback")}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-0.5 overflow-hidden">
              {visibleItems.slice(0, 4).map((item) => (
                <PreviewNavItem
                  key={item.id}
                  item={item}
                  locale={locale}
                  defaultLocale={defaultLocale}
                />
              ))}

              {visibleItems.length > 4 ? (
                <span className="px-1.5 text-xs text-muted-foreground">
                  +{visibleItems.length - 4}
                </span>
              ) : null}
            </div>
          </div>

          <PreviewBody visibleItems={visibleItems} />
        </>
      ) : (
        <>
          <div className="flex h-14 items-center justify-between border-b px-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
                <Sparkles className="size-3.5" />
              </div>
              <span className="max-w-[150px] truncate text-xs font-semibold">
                {menuTitle || t("preview.siteFallback")}
              </span>
            </div>

            <Menu className="size-4 text-muted-foreground" />
          </div>

          <div className="space-y-1 p-2">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex min-h-9 items-center justify-between gap-2 rounded-lg px-2 text-xs"
              >
                <span className="truncate">
                  {getItemLabel(item, locale, defaultLocale, untitled)}
                </span>

                {item.children.some((child) => child.isEnabled) ? (
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                ) : item.target === "BLANK" ? (
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PreviewNavItem({
  item,
  locale,
  defaultLocale,
}: {
  item: WebsiteMenuItem;
  locale: string;
  defaultLocale: string;
}) {
  const t = useTranslations("Admin.menus.editor");

  return (
    <span className="inline-flex max-w-[90px] items-center gap-1 truncate rounded-md px-1.5 py-1 text-[11px] text-muted-foreground">
      <span className="truncate">
        {getItemLabel(item, locale, defaultLocale, t("tree.untitled"))}
      </span>

      {item.children.some((child) => child.isEnabled) ? (
        <ChevronDown className="size-3 shrink-0" />
      ) : null}
    </span>
  );
}

function PreviewBody({
  visibleItems,
}: {
  visibleItems: WebsiteMenuItem[];
}) {
  const t = useTranslations("Admin.menus.editor");

  return (
    <div className="grid min-h-48 place-items-center bg-muted/[0.06] p-5 text-center">
      <div>
        <div className="mx-auto flex size-9 items-center justify-center rounded-lg border bg-background">
          <Menu className="size-4 text-muted-foreground" />
        </div>

        <p className="mt-3 text-xs font-medium">
          {t("preview.itemsVisible", { count: visibleItems.length })}
        </p>

        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
          {t("preview.hierarchyNote")}
        </p>
      </div>
    </div>
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
    <div className="mx-auto flex min-h-96 w-full max-w-[1240px] flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl border bg-muted/30 text-muted-foreground">
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium text-foreground">
        {title}
      </p>

      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function createEmptyItem(
  defaultLocale: string,
  label: string,
): WebsiteMenuItem {
  return {
    id: nextTemporaryId--,
    type: "CUSTOM_URL",
    pageId: null,
    url: "/",
    target: "SELF",
    rel: null,
    iconKey: null,
    isEnabled: true,
    translations: [
      {
        locale: defaultLocale,
        label,
        title: null,
        ariaLabel: null,
        urlOverride: null,
      },
    ],
    page: null,
    children: [],
  };
}

function getItemLabel(
  item: WebsiteMenuItem,
  locale: string,
  defaultLocale: string,
  untitledLabel: string,
) {
  return (
    item.translations.find(
      (translation) => translation.locale === locale,
    )?.label ||
    item.translations.find(
      (translation) => translation.locale === defaultLocale,
    )?.label ||
    item.translations[0]?.label ||
    untitledLabel
  );
}

function getItemDestination(item: WebsiteMenuItem, t: Translate) {
  if (item.type === "PAGE") {
    return item.page?.title
      ? `${item.page.title}${
          item.page.slug ? ` · /${item.page.slug}` : ""
        }`
      : t("destination.pageNotSelected");
  }

  if (item.type === "GROUP") {
    return t("destination.childCount", { count: item.children.length });
  }

  if (item.type === "ANCHOR") {
    return item.url || t("destination.anchorMissing");
  }

  return item.url || t("destination.urlMissing");
}

function getLocaleProgress(
  items: WebsiteMenuItem[],
  locale: string,
): {
  translated: number;
  missing: number;
} {
  let translated = 0;
  let missing = 0;

  function walk(nodes: WebsiteMenuItem[]) {
    for (const item of nodes) {
      const translation = item.translations.find(
        (entry) => entry.locale === locale,
      );

      if (translation?.label?.trim()) {
        translated += 1;
      } else {
        missing += 1;
      }

      walk(item.children);
    }
  }

  walk(items);

  return { translated, missing };
}

function countItems(items: WebsiteMenuItem[]): number {
  return items.reduce(
    (total, item) => total + 1 + countItems(item.children),
    0,
  );
}

function countEnabledItems(items: WebsiteMenuItem[]): number {
  return items.reduce(
    (total, item) =>
      total +
      (item.isEnabled ? 1 : 0) +
      countEnabledItems(item.children),
    0,
  );
}

function findItem(
  items: WebsiteMenuItem[],
  id: number,
): WebsiteMenuItem | null {
  for (const item of items) {
    if (item.id === id) return item;

    const child = findItem(item.children, id);
    if (child) return child;
  }

  return null;
}

function mapItem(
  items: WebsiteMenuItem[],
  id: number,
  mapper: (item: WebsiteMenuItem) => WebsiteMenuItem,
): WebsiteMenuItem[] {
  return items.map((item) =>
    item.id === id
      ? mapper(item)
      : {
          ...item,
          children: mapItem(item.children, id, mapper),
        },
  );
}

function removeItem(
  items: WebsiteMenuItem[],
  id: number,
): WebsiteMenuItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: removeItem(item.children, id),
    }));
}
