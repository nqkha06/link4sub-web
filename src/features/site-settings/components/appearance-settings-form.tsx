"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  Contact,
  Globe2,
  ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { parseAsStringEnum, useQueryState } from "nuqs";
import * as React from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldPath,
} from "react-hook-form";
import { toast } from "sonner";

import { AdminMediaPicker } from "@/components/admin-media/admin-media-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { updateAppearanceSettings } from "@/features/site-settings/api/appearance.client";
import {
  createAppearanceSettingsSchema,
  type AppearanceSettingsValues,
} from "@/features/site-settings/schemas/appearance-schema";
import {
  appearanceTabs,
  socialPlatforms,
  type AdminWebsiteSettings,
  type SiteMedia,
} from "@/features/site-settings/types";
import {
  applyApiValidationErrors,
  getApiErrorMessage,
} from "@/lib/api-response";
import {
  DEFAULT_SITE_LOGO_URL,
  fallbackToDefaultSiteLogo,
} from "@/lib/branding/default-site-brand";
import type { AdminMedia } from "@/features/admin-media/types";
import { getPublicLanguages } from "@/features/languages/api/languages.client";
import type { PublicLanguagesResponse } from "@/features/languages/types";
import { LocalFaviconCard } from "./local-favicon-card";

const platformLabels = {
  facebook: "Facebook",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  github: "GitHub",
  discord: "Discord",
  telegram: "Telegram",
  zalo: "Zalo",
} as const;

type MediaField =
  | "logoLightId"
  | "logoDarkId"
  | "logoIconId"
  | "defaultOgImageId";
type MediaState = Record<MediaField, SiteMedia | null>;
type LanguageOption = PublicLanguagesResponse["data"][number];

export function AppearanceSettingsForm({
  initialSettings,
  canUpdate,
}: {
  initialSettings: AdminWebsiteSettings;
  canUpdate: boolean;
}) {
  const t = useTranslations("Admin.siteSettings");
  const tc = useTranslations("Admin.common");
  const schema = React.useMemo(
    () => createAppearanceSettingsSchema((key) => t(`validation.${key}`)),
    [t],
  );
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum([...appearanceTabs]).withDefault("general").withOptions({
      history: "push",
      shallow: true,
    }),
  );
  const [pickerField, setPickerField] = React.useState<MediaField | null>(null);
  const [savedSettings, setSavedSettings] = React.useState(initialSettings);
  const [submitError, setSubmitError] = React.useState("");
  const [media, setMedia] = React.useState<MediaState>(() =>
    mediaFromSettings(initialSettings),
  );
  const form = useForm<AppearanceSettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFromSettings(initialSettings),
  });
  const [defaultSiteName, defaultTagline, defaultDescription, translations] = useWatch({
    control: form.control,
    name: ["siteName", "siteTagline", "siteDescription", "translations"],
  });
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "socialLinks",
  });
  const { fields: translationFields } = useFieldArray({
    control: form.control,
    name: "translations",
  });
  const [languages, setLanguages] = React.useState<LanguageOption[]>([]);
  const [activeLocale, setActiveLocale] = React.useState<string>("__default__");

  React.useEffect(() => {
    void getPublicLanguages()
      .then((result) => {
        setLanguages(result.data);
        const defaultLocale = result.meta.defaultLocale ?? "vi";
        form.reset(
          valuesFromSettings(
            initialSettings,
            result.data
              .filter((language) => language.locale !== defaultLocale)
              .map((language) => language.locale),
            defaultLocale,
          ),
          { keepDirtyValues: true },
        );
      })
      .catch(() => undefined);
    // Load language tabs once; keep edits made before the response arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultLocale = languages.find((language) => language.isDefault)?.locale ?? "vi";
  const otherLanguages = React.useMemo(
    () => languages.filter((language) => language.locale !== defaultLocale),
    [languages, defaultLocale],
  );

  const activeTranslation = translations?.find((translation) => translation.locale === activeLocale);
  const previewSiteName = activeTranslation?.siteName || defaultSiteName;
  const previewTagline = activeTranslation?.siteTagline || defaultTagline;
  const previewDescription = activeTranslation?.siteDescription || defaultDescription;

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    const handleNavigation = (event: MouseEvent) => {
      if (!form.formState.isDirty) return;
      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname
      ) {
        return;
      }
      if (!window.confirm(t("unsavedChangesConfirm"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", handleNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleNavigation, true);
    };
  }, [form.formState.isDirty, t]);

  async function onSubmit(values: AppearanceSettingsValues) {
    try {
      setSubmitError("");
      const updated = await updateAppearanceSettings(
        {
          ...values,
          socialLinks: values.socialLinks.map((link, index) => ({
            ...link,
            sortOrder: index,
          })),
        },
        defaultLocale,
      );
      form.reset(valuesFromSettings(
        updated,
        otherLanguages.map((language) => language.locale),
        defaultLocale,
      ));
      setSavedSettings(updated);
      setMedia(mediaFromSettings(updated));
      toast.success(t("saveSuccess"));
    } catch (error) {
      applyApiValidationErrors(error, form.setError);
      const message = getApiErrorMessage(error);
      setSubmitError(message);
      toast.error(message);
    }
  }

  function resetForm() {
    if (form.formState.isDirty && !window.confirm(t("discardConfirm"))) {
      return;
    }
    form.reset(valuesFromSettings(
      savedSettings,
      otherLanguages.map((language) => language.locale),
      defaultLocale,
    ));
    setMedia(mediaFromSettings(savedSettings));
    setSubmitError("");
  }

  function chooseMedia(field: MediaField, file: AdminMedia) {
    form.setValue(field, file.id, { shouldDirty: true, shouldValidate: true });
    setMedia((current) => ({
      ...current,
      [field]: {
        id: file.id,
        alias: file.id,
        name: file.fileName,
        mimeType: file.mimeType,
        extension: file.extension,
        downloadUrl: file.url,
      },
    }));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={tab} onValueChange={(value) => void setTab(value as typeof tab)}>
          <div className="overflow-x-auto border-b">
            <TabsList variant="line" className="min-w-max">
              <TabsTrigger value="general"><Globe2 /> {t("tabs.general")}</TabsTrigger>
              <TabsTrigger value="branding"><ImageIcon /> {t("tabs.branding")}</TabsTrigger>
              <TabsTrigger value="social"><Share2 /> {t("tabs.social")}</TabsTrigger>
              <TabsTrigger value="contact"><Contact /> {t("tabs.contact")}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="mt-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card>
                <CardHeader>
                  <CardTitle>{t("general.cardTitle")}</CardTitle>
                  <CardDescription>
                    {t("general.cardDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <TextField
                    control={form.control}
                    name="siteUrl"
                    label={t("general.siteUrlLabel")}
                    placeholder="https://example.com"
                    description={t("general.siteUrlDescription")}
                  />

                  <div className="space-y-4 rounded-xl border p-4">
                    <div>
                      <p className="text-sm font-medium">{t("general.perLanguageTitle")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("general.perLanguageDescription")}
                      </p>
                    </div>

                    {otherLanguages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("general.singleLanguageNote")}
                      </p>
                    ) : (
                      <LanguageTabs
                        defaultLocale={defaultLocale}
                        defaultLanguage={languages.find((language) => language.isDefault) ?? null}
                        otherLanguages={otherLanguages}
                        activeLocale={activeLocale}
                        onActiveLocaleChange={setActiveLocale}
                      />
                    )}

                    {activeLocale === "__default__" ? (
                      <div className="grid gap-5">
                        <TextField control={form.control} name="siteName" label={t("general.siteName")} required />
                        <TextField
                          control={form.control}
                          name="siteShortName"
                          label={t("general.siteShortName")}
                          description={t("general.siteShortNameDescription")}
                        />
                        <TextField control={form.control} name="siteTagline" label={t("general.tagline")} />
                        <TextAreaField
                          control={form.control}
                          name="siteDescription"
                          label={t("general.siteDescription")}
                          rows={5}
                        />
                      </div>
                    ) : (
                      (() => {
                        const index = translationFields.findIndex(
                          (field) => field.locale === activeLocale,
                        );
                        if (index === -1) return null;
                        return (
                          <div className="grid gap-5">
                            <TextField
                              control={form.control}
                              name={`translations.${index}.siteName`}
                              label={t("general.siteName")}
                              description={t("general.siteNameFallbackDescription")}
                            />
                            <TextField
                              control={form.control}
                              name={`translations.${index}.siteShortName`}
                              label={t("general.siteShortName")}
                            />
                            <TextField
                              control={form.control}
                              name={`translations.${index}.siteTagline`}
                              label={t("general.tagline")}
                            />
                            <TextAreaField
                              control={form.control}
                              name={`translations.${index}.siteDescription`}
                              label={t("general.siteDescription")}
                              rows={5}
                            />
                          </div>
                        );
                      })()
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="showLanguageFlags"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div className="space-y-1">
                          <FormLabel>{t("general.showLanguageFlags")}</FormLabel>
                          <FormDescription>
                            {t("general.showLanguageFlagsDescription")}
                          </FormDescription>
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
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>{t("preview.title")}</CardTitle>
                  <CardDescription>{t("preview.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border bg-background p-5">
                    <div className="flex items-center gap-3">
                      {media.logoLightId ? (
                        <Image
                          src={media.logoLightId.downloadUrl}
                          alt=""
                          width={44}
                          height={44}
                          unoptimized
                          className="size-11 rounded-lg object-contain"
                        />
                      ) : (
                        <span className="relative block size-11 overflow-hidden rounded-lg">
                          <Image
                            src={DEFAULT_SITE_LOGO_URL}
                            alt=""
                            fill
                            sizes="44px"
                            unoptimized
                            className="object-contain"
                          />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {previewSiteName || t("preview.siteNamePlaceholder")}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {previewTagline || t("preview.taglinePlaceholder")}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {previewDescription || t("preview.descriptionPlaceholder")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <MediaCard
                title={t("branding.logoLightTitle")}
                description={t("branding.logoLightDescription")}
                field="logoLightId"
                file={media.logoLightId}
                fallbackUrl={DEFAULT_SITE_LOGO_URL}
                onChoose={setPickerField}
                onRemove={(field) => removeMedia(field, form, setMedia)}
              />
              <MediaCard
                title={t("branding.logoDarkTitle")}
                description={t("branding.logoDarkDescription")}
                field="logoDarkId"
                file={media.logoDarkId}
                fallbackUrl={DEFAULT_SITE_LOGO_URL}
                dark
                onChoose={setPickerField}
                onRemove={(field) => removeMedia(field, form, setMedia)}
              />
              <MediaCard
                title={t("branding.logoIconTitle")}
                description={t("branding.logoIconDescription")}
                field="logoIconId"
                file={media.logoIconId}
                fallbackUrl={DEFAULT_SITE_LOGO_URL}
                onChoose={setPickerField}
                onRemove={(field) => removeMedia(field, form, setMedia)}
              />
              <LocalFaviconCard canUpdate={canUpdate} />
              <div className="lg:col-span-2">
                <MediaCard
                  title={t("branding.ogTitle")}
                  description={t("branding.ogDescription")}
                  field="defaultOgImageId"
                  file={media.defaultOgImageId}
                  wide
                  onChoose={setPickerField}
                  onRemove={(field) => removeMedia(field, form, setMedia)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("social.cardTitle")}</CardTitle>
                <CardDescription>
                  {t("social.cardDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    {t("social.empty")}
                  </div>
                ) : null}
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-4 rounded-xl border p-4 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
                    <FormField
                      control={form.control}
                      name={`socialLinks.${index}.platform`}
                      render={({ field: input }) => (
                        <FormItem>
                          <FormLabel>{t("social.platform")}</FormLabel>
                          <Select value={input.value} onValueChange={input.onChange}>
                            <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {socialPlatforms.map((platform) => (
                                <SelectItem key={platform} value={platform}>
                                  {platformLabels[platform]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <TextField
                      control={form.control}
                      name={`socialLinks.${index}.url`}
                      label={t("social.url")}
                      placeholder="https://..."
                    />
                    <div className="flex items-end gap-1">
                      <FormField
                        control={form.control}
                        name={`socialLinks.${index}.isActive`}
                        render={({ field: input }) => (
                          <FormItem className="mr-2 flex h-9 items-center gap-2 rounded-md border px-3">
                            <FormControl><Switch checked={input.value} onCheckedChange={input.onChange} /></FormControl>
                            <FormLabel className="whitespace-nowrap">{t("social.show")}</FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="outline" size="icon" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={t("social.moveUp")}><ArrowUp /></Button>
                      <Button type="button" variant="outline" size="icon" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)} aria-label={t("social.moveDown")}><ArrowDown /></Button>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} aria-label={t("social.remove")}><Trash2 /></Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={fields.length >= socialPlatforms.length}
                  onClick={() => {
                    const used = new Set(form.getValues("socialLinks").map((link) => link.platform));
                    const platform = socialPlatforms.find((item) => !used.has(item));
                    if (platform) append({ platform, url: "", isActive: true, sortOrder: fields.length });
                  }}
                >
                  <Plus /> {t("social.add")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("contact.cardTitle")}</CardTitle>
                <CardDescription>
                  {t("contact.cardDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <TextField control={form.control} name="contactEmail" label={t("contact.contactEmail")} type="email" />
                <TextField control={form.control} name="supportEmail" label={t("contact.supportEmail")} type="email" />
                <TextField control={form.control} name="phone" label={t("contact.phone")} />
                <TextField control={form.control} name="workingHours" label={t("contact.workingHours")} />
                <div className="md:col-span-2">
                  <TextAreaField control={form.control} name="address" label={t("contact.address")} rows={3} />
                </div>
                <div className="md:col-span-2">
                  <TextField
                    control={form.control}
                    name="mapUrl"
                    label={t("contact.mapUrl")}
                    placeholder="https://maps.google.com/..."
                    description={t("contact.mapUrlDescription")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <p className={submitError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
            {submitError || (form.formState.isDirty ? t("footer.dirty") : t("footer.clean"))}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={form.formState.isSubmitting}>
              <RotateCcw /> {t("footer.restore")}
            </Button>
            <Button type="submit" disabled={!canUpdate || form.formState.isSubmitting || !form.formState.isDirty}>
              {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
              {tc("saveChanges")}
            </Button>
          </div>
        </div>
      </form>

      <AdminMediaPicker
        open={pickerField !== null}
        onOpenChange={(open) => {
          if (!open) setPickerField(null);
        }}
        selectedId={pickerField ? form.getValues(pickerField) : null}
        title={t("branding.pickerTitle")}
        onSelect={(file) => {
          if (pickerField) chooseMedia(pickerField, file);
          setPickerField(null);
        }}
      />
    </Form>
  );
}

function TextField<TName extends FieldPath<AppearanceSettingsValues>>({
  control,
  name,
  label,
  description,
  required,
  ...inputProps
}: {
  control: Control<AppearanceSettingsValues>;
  name: TName;
  label: string;
  description?: string;
  required?: boolean;
} & Omit<React.ComponentProps<typeof Input>, "name" | "defaultValue">) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}{required ? " *" : ""}</FormLabel>
          <FormControl><Input {...inputProps} {...field} value={typeof field.value === "string" ? field.value : ""} /></FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextAreaField<TName extends FieldPath<AppearanceSettingsValues>>({
  control,
  name,
  label,
  rows,
}: {
  control: Control<AppearanceSettingsValues>;
  name: TName;
  label: string;
  rows: number;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl><Textarea {...field} value={typeof field.value === "string" ? field.value : ""} rows={rows} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function LanguageTabs({
  defaultLocale,
  defaultLanguage,
  otherLanguages,
  activeLocale,
  onActiveLocaleChange,
}: {
  defaultLocale: string;
  defaultLanguage: LanguageOption | null;
  otherLanguages: LanguageOption[];
  activeLocale: string;
  onActiveLocaleChange: (locale: string) => void;
}) {
  const t = useTranslations("Admin.siteSettings");
  return (
    <Tabs value={activeLocale} onValueChange={onActiveLocaleChange}>
      <TabsList className="h-auto flex-wrap gap-1 rounded-lg bg-muted/60 p-1">
        <TabsTrigger value="__default__" className="gap-1.5 rounded-md px-3 py-1.5 text-xs">
          {defaultLanguage?.nativeName || defaultLanguage?.name || defaultLocale}
          <span className="text-muted-foreground">{t("general.defaultBadge")}</span>
        </TabsTrigger>
        {otherLanguages.map((language) => (
          <TabsTrigger
            key={language.locale}
            value={language.locale}
            className="rounded-md px-3 py-1.5 text-xs"
          >
            {language.nativeName || language.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function MediaCard({
  title,
  description,
  field,
  file,
  fallbackUrl,
  dark,
  wide,
  onChoose,
  onRemove,
}: {
  title: string;
  description: string;
  field: MediaField;
  file: SiteMedia | null;
  fallbackUrl?: string;
  dark?: boolean;
  wide?: boolean;
  onChoose: (field: MediaField) => void;
  onRemove: (field: MediaField) => void;
}) {
  const t = useTranslations("Admin.siteSettings.branding");
  const imageUrl = file?.downloadUrl ?? fallbackUrl;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid place-items-center overflow-hidden rounded-xl border ${wide ? "aspect-[1200/630]" : "aspect-[3/1]"} ${dark ? "bg-slate-950" : "bg-muted/30"}`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={file?.name ?? title}
              width={wide ? 1200 : 600}
              height={wide ? 630 : 200}
              unoptimized
              onError={fallbackUrl ? (event) => fallbackToDefaultSiteLogo(event.currentTarget) : undefined}
              className="size-full object-contain p-4"
            />
          ) : (
            <div className="text-center text-sm text-muted-foreground"><ImageIcon className="mx-auto mb-2" />{t("noImage")}</div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => onChoose(field)}><Upload /> {t("chooseFromMedia")}</Button>
          {file ? <Button type="button" variant="ghost" onClick={() => onRemove(field)}><Trash2 /> {t("removeImage")}</Button> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function valuesFromSettings(
  settings: AdminWebsiteSettings,
  locales?: string[],
  defaultLocale?: string,
): AppearanceSettingsValues {
  const savedTranslations = settings.translations ?? [];
  const translationLocales = [...new Set([
    ...(locales ?? []),
    ...savedTranslations
      .map((translation) => translation.locale)
      .filter((locale) => locale !== defaultLocale),
  ])];
  return {
    siteName: settings.siteName,
    siteShortName: settings.siteShortName ?? "",
    siteDescription: settings.siteDescription ?? "",
    siteTagline: settings.siteTagline ?? "",
    siteUrl: settings.siteUrl ?? "",
    logoLightId: settings.logoLightId,
    logoDarkId: settings.logoDarkId,
    logoIconId: settings.logoIconId,
    // Favicon được stu-web quản lý ở SITE_ICON_DIR, không còn tham chiếu
    // Admin Media/object storage trong website settings.
    faviconId: null,
    defaultOgImageId: settings.defaultOgImageId,
    socialLinks: settings.socialLinks,
    contactEmail: settings.contactEmail ?? "",
    supportEmail: settings.supportEmail ?? "",
    phone: settings.phone ?? "",
    address: settings.address ?? "",
    workingHours: settings.workingHours ?? "",
    mapUrl: settings.mapUrl ?? "",
    showLanguageFlags: settings.showLanguageFlags ?? true,
    translations: translationLocales.map((locale) => {
      const translation = savedTranslations.find((item) => item.locale === locale);
      return {
        locale,
        siteName: translation?.siteName ?? "",
        siteShortName: translation?.siteShortName ?? "",
        siteTagline: translation?.siteTagline ?? "",
        siteDescription: translation?.siteDescription ?? "",
      };
    }),
  };
}

function mediaFromSettings(settings: AdminWebsiteSettings): MediaState {
  return {
    logoLightId: settings.branding.logoLight,
    logoDarkId: settings.branding.logoDark,
    logoIconId: settings.branding.logoIcon,
    defaultOgImageId: settings.branding.defaultOgImage,
  };
}

function removeMedia(
  field: MediaField,
  form: ReturnType<typeof useForm<AppearanceSettingsValues>>,
  setMedia: React.Dispatch<React.SetStateAction<MediaState>>,
) {
  form.setValue(field, null, { shouldDirty: true, shouldValidate: true });
  setMedia((current) => ({ ...current, [field]: null }));
}
