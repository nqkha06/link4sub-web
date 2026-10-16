"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Eye,
  ImageIcon,
  Loader2,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMediaPicker } from "@/components/admin-media/admin-media-picker";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { getAdminLanguages } from "@/features/languages/api/languages.client";
import type { Language } from "@/features/languages/types";
import {
  applyApiValidationErrors,
  getApiErrorMessage,
} from "@/lib/api-response";
import {
  createAdminPage,
  updateAdminPage,
  updateAdminPageStatus,
} from "@/features/admin-pages/api/pages.client";
import { PagePublicActions } from "@/features/admin-pages/components/page-public-actions";
import { PageStatusDialog } from "@/features/admin-pages/components/page-status-dialog";
import { PageStatusBadge } from "@/features/admin-pages/components/page-status-badge";
import {
  emptyTiptapDocument,
  createPageFormSchema,
  type PageFormValues,
  slugifyPageTitle,
} from "@/features/admin-pages/schemas/page-schema";
import { pageStatusConfig } from "@/features/admin-pages/page-status";
import type {
  AdminPage,
  AdminPagePayload,
  PageStatus,
} from "@/features/admin-pages/types";

const DEFAULT_LANGUAGE_TAB = "__default";

type LocalizedField =
  | "title"
  | "excerpt"
  | "contentJson"
  | "contentHtml"
  | "seoTitle"
  | "seoDescription"
  | "seoKeywords";

export function PageEditor({ page }: { page: AdminPage | null }) {
  const t = useTranslations("Admin.pages");
  const tc = useTranslations("Admin.common");
  const formSchema = React.useMemo(() => createPageFormSchema(t), [t]);
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canPublish = permissions.includes("pages.publish");
  const [saving, setSaving] = React.useState(false);
  const [imagePickerOpen, setImagePickerOpen] = React.useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = React.useState(
    page?.featuredImage?.url ?? null,
  );
  const [slugEdited, setSlugEdited] = React.useState(Boolean(page));
  const [selectedStatus, setSelectedStatus] = React.useState<PageStatus>(
    page?.status ?? "DRAFT",
  );
  const [savedStatus, setSavedStatus] = React.useState<PageStatus>(
    page?.status ?? "DRAFT",
  );
  const [savedSlug, setSavedSlug] = React.useState(page?.slug ?? "");
  const [pendingStatusChange, setPendingStatusChange] = React.useState<{
    values: PageFormValues;
    status: PageStatus;
  } | null>(null);
  const form = useForm<PageFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(page),
    mode: "onBlur",
  });
  const [title, featuredImageId, translations] = useWatch({
    control: form.control,
    name: ["title", "featuredImageId", "translations"],
  });
  const [languages, setLanguages] = React.useState<Language[]>([]);
  // null = ngôn ngữ mặc định (lưu ở chính trang); còn lại là locale của bản dịch.
  const [activeLocale, setActiveLocale] = React.useState<string | null>(null);
  const defaultLanguage = languages.find((language) => language.isDefault);
  const translationLanguages = languages.filter(
    (language) => !language.isDefault,
  );

  React.useEffect(() => {
    let active = true;
    const existing = new Set(page?.translations.map(({ locale }) => locale));
    void getAdminLanguages()
      .then((result) => {
        if (!active) return;
        setLanguages(
          result.data.filter(
            (language) =>
              language.isDefault ||
              language.status === "published" ||
              existing.has(language.locale),
          ),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [page]);

  /** Tên field theo ngôn ngữ đang chọn: field gốc hoặc `translations.<locale>.<field>`. */
  function fieldName<K extends LocalizedField>(key: K) {
    return (activeLocale ? `translations.${activeLocale}.${key}` : key) as K;
  }

  function showInvalidLanguage(errors: FieldErrors<PageFormValues>) {
    if (Object.keys(errors).some((key) => key !== "translations")) {
      setActiveLocale(null);
      return;
    }
    const locale = Object.keys(errors.translations ?? {})[0];
    if (locale) setActiveLocale(locale);
  }
  const hasChanges =
    form.formState.isDirty || selectedStatus !== savedStatus;

  React.useEffect(() => {
    if (!slugEdited) {
      form.setValue("slug", slugifyPageTitle(title), {
        shouldDirty: Boolean(title),
        shouldValidate: false,
      });
    }
  }, [form, slugEdited, title]);

  React.useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges || saving) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasChanges, saving]);

  function leaveEditor() {
    if (
      hasChanges &&
      !saving &&
      !window.confirm(t("editor.unsavedConfirm"))
    ) {
      return;
    }
    router.push("/admin/pages");
  }

  async function save(values: PageFormValues, targetStatus: PageStatus) {
    if (targetStatus === "PUBLISHED" && !canPublish) {
      toast.error(t("editor.noPublishPermission"));
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(
        values,
        targetStatus,
        defaultLanguage?.locale,
      );
      if (!page) {
        const created = await createAdminPage(payload);
        toast.success(
          created.status === "PUBLISHED"
            ? t("editor.createdAndPublished")
            : t("editor.created"),
        );
        router.replace(`/admin/pages/${created.id}/edit`);
        router.refresh();
        return;
      }

      await updateAdminPage(page.id, payload);
      if (targetStatus !== savedStatus) {
        await updateAdminPageStatus(page.id, targetStatus);
      }
      form.reset(values);
      setSelectedStatus(targetStatus);
      setSavedStatus(targetStatus);
      setSavedSlug(values.slug.trim());
      toast.success(t("editor.updated"));
      router.refresh();
    } catch (error) {
      applyApiValidationErrors(error, form.setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function requestSave(values: PageFormValues, status: PageStatus) {
    if (page && status !== savedStatus) {
      setPendingStatusChange({ values, status });
      return;
    }
    void save(values, status);
  }

  const persist = form.handleSubmit(
    (values) => requestSave(values, selectedStatus),
    showInvalidLanguage,
  );

  function persistAs(status: PageStatus) {
    void form.handleSubmit(
      (values) => requestSave(values, status),
      showInvalidLanguage,
    )();
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) return;
    await save(pendingStatusChange.values, pendingStatusChange.status);
    setPendingStatusChange(null);
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={persist}
          className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-6"
        >
          <AdminPageHeader
            title={
              page
                ? t("editor.editTitle", { title: page.title })
                : t("editor.createTitle")
            }
            description={t("editor.description")}
            meta={<PageStatusBadge status={selectedStatus} />}
            breadcrumbs={
              page
                ? [
                    { label: t("breadcrumbs.dashboard"), href: "/admin" },
                    { label: t("breadcrumbs.pages"), href: "/admin/pages" },
                    {
                      label: page.title,
                      href: `/admin/pages/${page.id}`,
                    },
                    { label: tc("edit") },
                  ]
                : undefined
            }
            leading={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label={t("editor.backToList")}
                onClick={leaveEditor}
              >
                <ArrowLeft />
              </Button>
            }
            actions={
              <>
                {page ? (
                  <Button variant="outline" asChild>
                    <Link
                      href={`/admin/pages/${page.id}/preview`}
                      target="_blank"
                    >
                      <Eye /> {t("editor.preview")}
                    </Link>
                  </Button>
                ) : null}
                {page ? (
                  <PagePublicActions
                    slug={savedSlug}
                    status={savedStatus}
                    showCopy={false}
                  />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => persistAs("DRAFT")}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save />}
                  {t("editor.saveDraft")}
                </Button>
                {page ? (
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={saving || !hasChanges}
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    {t("editor.update")}
                  </Button>
                ) : null}
                {canPublish ? (
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => persistAs("PUBLISHED")}
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Send />}
                    {page ? t("editor.updateAndPublish") : t("editor.publish")}
                  </Button>
                ) : !page ? (
                  <Button type="submit" disabled={saving || !hasChanges}>
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    {t("editor.update")}
                  </Button>
                ) : null}
              </>
            }
          />

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              {translationLanguages.length ? (
                <Tabs
                  value={activeLocale ?? DEFAULT_LANGUAGE_TAB}
                  onValueChange={(value) =>
                    setActiveLocale(
                      value === DEFAULT_LANGUAGE_TAB ? null : value,
                    )
                  }
                >
                  <TabsList
                    aria-label={tc("language")}
                    className="h-auto flex-wrap justify-start"
                  >
                    <TabsTrigger value={DEFAULT_LANGUAGE_TAB}>
                      {defaultLanguage
                        ? defaultLanguage.nativeName || defaultLanguage.name
                        : t("editor.defaultLanguage")}
                      {defaultLanguage ? (
                        <span className="text-muted-foreground">
                          ({t("editor.defaultLanguage")})
                        </span>
                      ) : null}
                    </TabsTrigger>
                    {translationLanguages.map((language) => (
                      <TabsTrigger key={language.locale} value={language.locale}>
                        {language.nativeName || language.name}
                        {hasTranslation(translations?.[language.locale]) ? (
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-primary"
                          />
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              ) : null}
              <Card>
                <CardHeader>
                  <CardTitle>{t("editor.contentCard.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField
                    control={form.control}
                    key={fieldName("title")}
                    name={fieldName("title")}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tc("title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            autoFocus={!page}
                            placeholder={
                              (activeLocale && title) ||
                              t("editor.titlePlaceholder")
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fields.slug")}</FormLabel>
                        <FormControl>
                          <div className="flex rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
                            <span className="flex items-center border-r px-3 font-mono text-muted-foreground text-sm">
                              /
                            </span>
                            <Input
                              {...field}
                              className="border-0 font-mono shadow-none focus-visible:ring-0"
                              placeholder={t("editor.slugPlaceholder")}
                              onChange={(event) => {
                                setSlugEdited(true);
                                field.onChange(
                                  slugifyPageTitle(event.target.value),
                                );
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {t("editor.slugHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    key={fieldName("excerpt")}
                    name={fieldName("excerpt")}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("editor.excerpt")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            rows={3}
                            placeholder={t("editor.excerptPlaceholder")}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("editor.charCount", { count: (field.value ?? "").length, max: 500 })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    key={fieldName("contentJson")}
                    name={fieldName("contentJson")}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("editor.pageContent")}</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            key={activeLocale ?? DEFAULT_LANGUAGE_TAB}
                            value={field.value ?? emptyTiptapDocument}
                            disabled={saving}
                            onChange={({ json, html }) => {
                              field.onChange(json);
                              form.setValue(fieldName("contentHtml"), html, {
                                shouldDirty: true,
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("editor.seo.cardTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <FormField
                    control={form.control}
                    key={fieldName("seoTitle")}
                    name={fieldName("seoTitle")}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("editor.seo.title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder={t("editor.seo.titlePlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    key={fieldName("seoDescription")}
                    name={fieldName("seoDescription")}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("editor.seo.metaDescription")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("editor.charCount", { count: (field.value ?? "").length, max: 320 })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    key={fieldName("seoKeywords")}
                    name={fieldName("seoKeywords")}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("editor.seo.keywords")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder={t("editor.seo.keywordsPlaceholder")}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("editor.seo.keywordsHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="canonicalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("editor.seo.canonicalUrl")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://example.com/page"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <BooleanField
                      control={form.control}
                      name="robotsIndex"
                      label={t("editor.seo.robotsIndex")}
                      description={t("editor.seo.robotsIndexHelp")}
                    />
                    <BooleanField
                      control={form.control}
                      name="robotsFollow"
                      label={t("editor.seo.robotsFollow")}
                      description={t("editor.seo.robotsFollowHelp")}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{tc("status")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={selectedStatus}
                    disabled={saving}
                    onValueChange={(value) =>
                      setSelectedStatus(value as PageStatus)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map(
                        (status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            disabled={status === "PUBLISHED" && !canPublish}
                          >
                            {t(pageStatusConfig[status].labelKey)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm leading-5 text-muted-foreground">
                    {t(pageStatusConfig[selectedStatus].descriptionKey)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("editor.featuredImage.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {featuredImageId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredImageUrl || ""}
                      alt={t("editor.featuredImage.title")}
                      className="aspect-video w-full rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="grid aspect-video place-items-center rounded-lg border border-dashed bg-muted/20 text-muted-foreground">
                      <ImageIcon className="size-8" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setImagePickerOpen(true)}
                  >
                    <ImageIcon /> {t("editor.featuredImage.choose")}
                  </Button>
                  {featuredImageId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => {
                        form.setValue("featuredImageId", null, {
                          shouldDirty: true,
                        });
                        setFeaturedImageUrl(null);
                      }}
                    >
                      <Trash2 /> {t("editor.featuredImage.remove")}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("editor.settings.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("editor.settings.sortOrder")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(event.target.valueAsNumber || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </aside>
          </div>
        </form>
      </Form>

      <AdminMediaPicker
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        selectedId={featuredImageId}
        title={t("editor.featuredImage.pickerTitle")}
        onSelect={(file) => {
          form.setValue("featuredImageId", file.id, {
            shouldDirty: true,
          });
          setFeaturedImageUrl(file.url);
        }}
      />
      <PageStatusDialog
        count={pendingStatusChange ? 1 : 0}
        status={pendingStatusChange?.status ?? null}
        busy={saving}
        onConfirm={() => void confirmStatusChange()}
        onOpenChange={(open) => {
          if (!open) setPendingStatusChange(null);
        }}
      />
    </>
  );
}

function BooleanField({
  control,
  name,
  label,
  description,
}: {
  control: ReturnType<typeof useForm<PageFormValues>>["control"];
  name: "robotsIndex" | "robotsFollow";
  label: string;
  description: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function getDefaultValues(page: AdminPage | null): PageFormValues {
  return {
    title: page?.title ?? "",
    slug: page?.slug ?? "",
    excerpt: page?.excerpt ?? "",
    contentJson: page?.contentJson ?? emptyTiptapDocument,
    contentHtml: page?.contentHtml ?? "",
    featuredImageId: page?.featuredImageId ?? null,
    seoTitle: page?.seoTitle ?? "",
    seoDescription: page?.seoDescription ?? "",
    seoKeywords: page?.seoKeywords ?? "",
    canonicalUrl: page?.canonicalUrl ?? "",
    robotsIndex: page?.robotsIndex ?? true,
    robotsFollow: page?.robotsFollow ?? true,
    sortOrder: page?.sortOrder ?? 0,
    translations: Object.fromEntries(
      (page?.translations ?? []).map((translation) => [
        translation.locale,
        {
          title: translation.title ?? "",
          excerpt: translation.excerpt ?? "",
          contentJson: translation.contentJson,
          contentHtml: translation.contentHtml,
          seoTitle: translation.seoTitle ?? "",
          seoDescription: translation.seoDescription ?? "",
          seoKeywords: translation.seoKeywords ?? "",
        },
      ]),
    ),
  };
}

type TranslationFormValues = PageFormValues["translations"][string];

function hasTranslation(translation?: TranslationFormValues) {
  if (!translation) return false;
  const html = translation.contentHtml ?? "";
  return Boolean(
    translation.title?.trim() ||
      translation.excerpt?.trim() ||
      translation.seoTitle?.trim() ||
      translation.seoDescription?.trim() ||
      translation.seoKeywords?.trim() ||
      /<(img|hr)\b/i.test(html) ||
      html.replace(/<[^>]*>/g, "").trim(),
  );
}

function toPayload(
  values: PageFormValues,
  status: PageStatus,
  defaultLocale?: string,
): AdminPagePayload {
  const nullable = (value?: string) => value?.trim() || null;
  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    excerpt: nullable(values.excerpt),
    contentJson: values.contentJson,
    contentHtml: values.contentHtml,
    featuredImageId: values.featuredImageId,
    seoTitle: nullable(values.seoTitle),
    seoDescription: nullable(values.seoDescription),
    seoKeywords: nullable(values.seoKeywords),
    canonicalUrl: nullable(values.canonicalUrl),
    robotsIndex: values.robotsIndex,
    robotsFollow: values.robotsFollow,
    sortOrder: values.sortOrder,
    status,
    translations: Object.entries(values.translations)
      .filter(
        ([locale, translation]) =>
          locale !== defaultLocale && hasTranslation(translation),
      )
      .map(([locale, translation]) => ({
        locale,
        title: nullable(translation.title),
        excerpt: nullable(translation.excerpt),
        contentJson: translation.contentJson,
        contentHtml: translation.contentHtml ?? "",
        seoTitle: nullable(translation.seoTitle),
        seoDescription: nullable(translation.seoDescription),
        seoKeywords: nullable(translation.seoKeywords),
      })),
  };
}
