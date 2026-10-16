"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Code2,
  Copy,
  Cpu,
  Crosshair,
  Globe2,
  Image as ImageIcon,
  Link2,
  Languages,
  Megaphone,
  MonitorSmartphone,
  PanelsTopLeft,
  Plus,
  Route as RouteIcon,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { defaultRouteTargeting, normalizeRouteTargeting } from "@/contracts";
import { RouteTargetingEditor } from "./route-targeting-editor";
import type { MonetizationActionIconKey } from "@/contracts";
import { monetizationActionIconOptions } from "@/lib/monetization-action-icons";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import {
  createMonetizationLevel,
  updateMonetizationLevel,
} from "@/features/admin-monetization-levels/api/monetization-levels.client";
import { CountryCombobox } from "@/components/country-combobox";
import type {
  AdminMonetizationLevel,
  AdminMonetizationLevelPayload,
  MonetizationAdDensity,
  MonetizationAd,
  MonetizationAdFormat,
  MonetizationAdPlacement,
  MonetizationAdTargetingExclusions,
  MonetizationActionCooldownBehavior,
  MonetizationActionCooldownScope,
  MonetizationActionDisplayMode,
  MonetizationActionPositionMode,
  MonetizationBrowserFamily,
  MonetizationDeviceType,
  MonetizationLevelStatus,
  MonetizationOperatingSystem,
  MonetizationRate,
  MonetizationRoute,
  MonetizationSmartlink,
  MonetizationSmartlinkAppendParam,
  MonetizationSmartlinkOverrides,
} from "@/features/admin-monetization-levels/types";
import { getAdminLanguages } from "@/features/languages/api/languages.client";
import type { Language } from "@/features/languages/types";
import {
  publicationStatuses,
  type PublicationStatus,
} from "@/types/publication-status";

const NS = "Admin.monetizationLevels";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type SelectOption<T extends string> = {
  value: T;
  label: string;
  description: string;
};

const densityValues: MonetizationAdDensity[] = ["none", "limited", "maximum"];
const deviceValues: MonetizationDeviceType[] = [
  "any",
  "desktop",
  "mobile",
  "tablet",
];
const browserValues: MonetizationBrowserFamily[] = [
  "any",
  "chrome",
  "safari",
  "firefox",
  "edge",
  "other",
];
type NewMonetizationAdKind = "smartlink" | "popunder" | "action" | "inject_html";

const legacyAdFormatKeys: Partial<Record<MonetizationAdFormat, string>> = {
  action: "legacyFormat.action",
  banner: "legacyFormat.banner",
  script: "legacyFormat.script",
};
const adPlacementValues: MonetizationAdPlacement[] = [
  "unlock_redirect",
  "popunder",
  "action_list",
  "stu_before",
  "stu_after",
  "safe_overlay_top",
  "safe_overlay_bottom",
];
const actionPositionModeValues: MonetizationActionPositionMode[] = [
  "start",
  "end",
  "middle",
  "random",
];
const actionCooldownBehaviorValues: MonetizationActionCooldownBehavior[] = [
  "replace",
  "hide",
];
const actionCooldownScopeValues: MonetizationActionCooldownScope[] = [
  "visitor",
  "link",
];
const actionDisplayModeValues: MonetizationActionDisplayMode[] = [
  "all",
  "sequential",
];
const operatingSystemValues: MonetizationOperatingSystem[] = [
  "any",
  "android",
  "ios",
  "windows",
  "macos",
  "linux",
  "other",
];
function buildOptions<T extends string>(
  t: TranslateFn,
  group: string,
  values: readonly T[],
  withDescription = false,
): SelectOption<T>[] {
  return values.map((value) => ({
    value,
    label: t(`options.${group}.${value}`),
    description: withDescription
      ? t(`options.${group}Description.${value}`)
      : "",
  }));
}

function useEditorOptions() {
  const t = useTranslations(NS);
  return React.useMemo(
    () => ({
      densityOptions: buildOptions(t, "density", densityValues),
      deviceOptions: buildOptions(t, "device", deviceValues),
      browserOptions: buildOptions(t, "browser", browserValues),
      adPlacementOptions: buildOptions(t, "placement", adPlacementValues),
      actionPositionModeOptions: buildOptions(
        t,
        "actionPosition",
        actionPositionModeValues,
        true,
      ),
      actionCooldownBehaviorOptions: buildOptions(
        t,
        "cooldownBehavior",
        actionCooldownBehaviorValues,
        true,
      ),
      actionCooldownScopeOptions: buildOptions(
        t,
        "cooldownScope",
        actionCooldownScopeValues,
        true,
      ),
      actionDisplayModeOptions: buildOptions(
        t,
        "displayMode",
        actionDisplayModeValues,
        true,
      ),
      operatingSystemOptions: buildOptions(t, "os", operatingSystemValues),
      statusOptions: buildOptions(t, "status", publicationStatuses, true),
    }),
    [t],
  );
}

export function MonetizationLevelEditor({
  level,
  template,
}: {
  level: AdminMonetizationLevel | null;
  template?: AdminMonetizationLevel;
}) {
  const t = useTranslations(NS);
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const initialPayload = React.useMemo(
    () => initialValues(level ?? template ?? null, Boolean(template), t),
    [level, template, t],
  );
  const [baseline] = React.useState(() => JSON.stringify(initialPayload));
  const [values, setValues] =
    React.useState<AdminMonetizationLevelPayload>(initialPayload);
  const [languages, setLanguages] = React.useState<Language[]>([
    {
      id: -1,
      name: "Vietnamese",
      nativeName: "Tiếng Việt",
      locale: "vi",
      code: "vi",
      regional: "vi-VN",
      flag: "VN",
      isDefault: true,
      status: "published",
      sortOrder: 10,
      isRtl: false,
    },
    {
      id: -2,
      name: "English",
      nativeName: "English",
      locale: "en",
      code: "en",
      regional: "en-US",
      flag: "US",
      isDefault: false,
      status: "published",
      sortOrder: 20,
      isRtl: false,
    },
  ]);
  const [activeTab, setActiveTab] = React.useState("general");
  const [activeTranslationLocale, setActiveTranslationLocale] = React.useState(
    initialPayload.translations[0]?.locale ?? "vi",
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const mode = level ? "update" : template ? "duplicate" : "create";
  const hasChanges = JSON.stringify(values) !== baseline;
  const canSubmit = mode === "update" ? hasChanges : true;

  React.useEffect(() => {
    let active = true;
    void getAdminLanguages()
      .then((result) => {
        if (!active) return;
        const relevant = result.data.filter(
          (language) =>
            language.status === "published" ||
            initialPayload.translations.some(
              ({ locale }) => locale === language.locale,
            ),
        );
        setLanguages(relevant);
        setValues((current) => ({
          ...current,
          translations: [
            ...current.translations,
            ...relevant
              .filter(
                (language) =>
                  !current.translations.some(
                    ({ locale }) => locale === language.locale,
                  ),
              )
              .map(({ locale }) => ({
                locale,
                name: "",
                description: "",
              })),
          ],
        }));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [initialPayload.translations]);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges || saving) return;
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, saving]);

  function leaveEditor() {
    router.push("/admin/monetization-levels");
  }

  function requestClose() {
    if (saving) return;
    if (hasChanges) {
      setDiscardOpen(true);
      return;
    }
    leaveEditor();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate(values, languages, t);
    if (validationError) {
      setError(validationError.message);
      setActiveTab(validationError.tab);
      if ("locale" in validationError && validationError.locale) {
        setActiveTranslationLocale(validationError.locale);
      }
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...values,
        translations: values.translations.filter(
          (translation) =>
            languages.find(
              ({ locale }) => locale === translation.locale,
            )?.isDefault || Boolean(translation.name.trim()),
        ),
      };
      if (level) {
        await updateMonetizationLevel(level.id, payload);
        toast.success(t("editor.toast.updated"));
      } else {
        await createMonetizationLevel(payload);
        toast.success(t("editor.toast.created"));
      }
      router.push("/admin/monetization-levels");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("editor.toast.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="mx-auto flex w-full max-w-[1560px] min-w-0 flex-col gap-6"
      >
        <AdminPageHeader
          title={
            mode === "update"
              ? t("editor.title.update")
              : mode === "duplicate"
                ? t("editor.title.duplicate")
                : t("editor.title.create")
          }
          description={
            mode === "update"
              ? t("editor.description.update")
              : mode === "duplicate"
                ? t("editor.description.duplicate")
                : t("editor.description.create")
          }
          leading={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-0.5 shrink-0"
              aria-label={t("editor.backToList")}
              onClick={requestClose}
            >
              <ArrowLeft />
            </Button>
          }
          meta={
            <>
              <EditorStatus status={values.status} />
              {values.isDefault ? (
                <Badge variant="secondary">{t("table.default")}</Badge>
              ) : null}
            </>
          }
          actions={
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={requestClose}
              >
                {tc("cancel")}
              </Button>
              <SubmitButton saving={saving} disabled={!canSubmit} mode={mode} />
            </div>
          }
        />

        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            setActiveTab(tab);
            setError("");
          }}
          className="grid min-w-0 items-start gap-5 xl:grid-cols-[220px_minmax(0,1fr)_300px] xl:gap-6"
        >
          <nav
            aria-label={t("editor.navigationLabel")}
            className="w-full rounded-xl border border-border/60 bg-card p-2.5 xl:sticky xl:top-6 xl:p-3"
          >
            <div className="xl:hidden">
              <ScrollArea className="w-full whitespace-nowrap">
                <TabsList className="h-auto min-w-max justify-start gap-1 bg-transparent p-0">
                  <EditorNavigationItems values={values} />
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            <TabsList className="hidden h-auto w-full flex-col items-stretch justify-start gap-2 bg-transparent p-0 xl:flex">
              <EditorNavigationItems values={values} />
            </TabsList>
          </nav>

          <main className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="min-w-0 p-5 sm:p-6 lg:p-8">
              <TabsContent value="general" className="mt-0">
                <GeneralFields
                  values={values}
                  setValues={setValues}
                  languages={languages}
                  activeTranslationLocale={activeTranslationLocale}
                  onActiveTranslationLocaleChange={setActiveTranslationLocale}
                />
              </TabsContent>
              <TabsContent value="show" className="mt-0">
                <ShowFields values={values} setValues={setValues} />
              </TabsContent>
              <TabsContent value="routes" className="mt-0">
                <RoutesFields values={values} setValues={setValues} />
              </TabsContent>
              <TabsContent value="rates" className="mt-0">
                <RatesFields values={values} setValues={setValues} />
              </TabsContent>
              <TabsContent value="ads" className="mt-0">
                <AdsFields values={values} setValues={setValues} />
              </TabsContent>
            </div>

            <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
              {error ? (
                <div
                  role="alert"
                  className="flex min-w-0 items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={
                      hasChanges
                        ? "size-2 rounded-full bg-amber-500"
                        : "size-2 rounded-full bg-emerald-500"
                    }
                  />
                  <span>
                    {hasChanges
                      ? t("editor.status.unsaved")
                      : mode === "update"
                        ? t("editor.status.synced")
                        : mode === "duplicate"
                          ? t("editor.status.duplicateNotCreated")
                          : t("editor.status.notCreated")}
                  </span>
                </div>
              )}
              <div className="flex shrink-0 justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={requestClose}
                >
                  {tc("cancel")}
                </Button>
                <SubmitButton
                  saving={saving}
                  disabled={!canSubmit}
                  mode={mode}
                />
              </div>
            </div>
          </main>

          <aside className="min-w-0 xl:sticky xl:top-6">
            <ConfigurationSummary
              values={values}
              setValues={setValues}
              activeTab={activeTab}
            />
          </aside>
        </Tabs>
      </form>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("editor.discard.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("editor.discard.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("editor.discard.keepEditing")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={leaveEditor}>
              {t("editor.discard.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SubmitButton({
  saving,
  disabled,
  mode,
}: {
  saving: boolean;
  disabled: boolean;
  mode: "create" | "duplicate" | "update";
}) {
  const t = useTranslations(NS);
  return (
    <Button type="submit" disabled={saving || disabled}>
      <Save />
      {saving
        ? t("editor.submit.saving")
        : mode === "update"
          ? t("editor.submit.update")
          : mode === "duplicate"
            ? t("editor.submit.duplicate")
            : t("editor.submit.create")}
    </Button>
  );
}

function EditorNavigationItems({
  values,
}: {
  values: AdminMonetizationLevelPayload;
}) {
  const t = useTranslations(NS);
  return (
    <>
      <NavigationGroup label={t("editor.nav.configuration")}>
        <EditorTabTrigger value="general" icon={Settings2}>
          {t("editor.nav.general")}
        </EditorTabTrigger>
        <EditorTabTrigger value="show" icon={MonitorSmartphone}>
          {t("editor.nav.show")}
        </EditorTabTrigger>
      </NavigationGroup>

      <NavigationGroup label={t("editor.nav.monetization")}>
        <EditorTabTrigger
          value="routes"
          icon={RouteIcon}
          trailing={<CountBadge value={values.routes.length} />}
        >
          {t("editor.nav.routes")}
        </EditorTabTrigger>
        <EditorTabTrigger
          value="rates"
          icon={CircleDollarSign}
          trailing={<CountBadge value={values.rates.length} />}
        >
          {t("editor.nav.rates")}
        </EditorTabTrigger>
        <EditorTabTrigger
          value="ads"
          icon={Megaphone}
          trailing={<CountBadge value={values.ads.length} />}
        >
          {t("editor.nav.ads")}
        </EditorTabTrigger>
      </NavigationGroup>
    </>
  );
}

function NavigationGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="contents xl:block xl:w-full xl:space-y-1">
      <p className="hidden px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground first:pt-1 xl:block">
        {label}
      </p>
      {children}
    </div>
  );
}

function EditorTabTrigger({
  value,
  icon: Icon,
  trailing,
  children,
}: {
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-9 w-auto flex-none justify-start rounded-lg px-3 after:hidden data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none xl:w-full"
    >
      <Icon className="size-4" />
      <span className="truncate">{children}</span>
      {trailing ? <span className="ml-auto">{trailing}</span> : null}
    </TabsTrigger>
  );
}

function GeneralFields({
  values,
  setValues,
  languages,
  activeTranslationLocale,
  onActiveTranslationLocaleChange,
}: EditorSectionProps & {
  languages: Language[];
  activeTranslationLocale: string;
  onActiveTranslationLocaleChange: (locale: string) => void;
}) {
  const t = useTranslations(NS);
  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <SectionHeader
          title={t("editor.general.system.title")}
          description={t("editor.general.system.description")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Key" htmlFor="monetization-key">
            <Input
              id="monetization-key"
              value={values.key}
              placeholder="balanced"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  key: event.target.value.toLowerCase(),
                }))
              }
            />
          </FormField>
          <FormField label={t("editor.general.sortOrder")} htmlFor="monetization-sort-order">
            <Input
              id="monetization-sort-order"
              type="number"
              min={0}
              max={10000}
              value={values.sortOrder}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  sortOrder: integerValue(event.target.value),
                }))
              }
            />
          </FormField>
          <div className="grid gap-2">
            <Label htmlFor="monetization-default">{t("editor.general.defaultLevel")}</Label>
            <div className="flex h-9 items-center justify-between rounded-lg border border-border/60 px-3">
              <span className="text-sm text-muted-foreground">
                {t("editor.general.autoAssign")}
              </span>
              <Switch
                id="monetization-default"
                checked={values.isDefault}
                onCheckedChange={(isDefault) =>
                  setValues((current) => ({
                    ...current,
                    isDefault,
                    status: isDefault ? "published" : current.status,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </section>

      <Separator className="bg-border/60" />

      <TranslationsEditor
        values={values}
        setValues={setValues}
        languages={languages}
        activeLocale={activeTranslationLocale}
        onActiveLocaleChange={onActiveTranslationLocaleChange}
      />

      <Separator className="bg-border/60" />

      <section className="space-y-5">
        <SectionHeader
          title={t("editor.general.performance.title")}
          description={t("editor.general.performance.description")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label={t("editor.general.profitPercent")} htmlFor="monetization-profit">
            <Input
              id="monetization-profit"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={values.metaData.profitBps / 100}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  metaData: {
                    ...current.metaData,
                    profitBps: Math.round(
                      Number(event.target.value || 0) * 100,
                    ),
                  },
                }))
              }
            />
          </FormField>
        </div>
      </section>

      <Separator className="bg-border/60" />

      <section className="space-y-5">
        <SectionHeader
          title={t("editor.general.experience.title")}
          description={t("editor.general.experience.description")}
        />
        <div className="overflow-hidden rounded-xl border border-border/60">
          <ExperienceField
            icon={Megaphone}
            label={t("editor.general.experience.popup.label")}
            description={t("editor.general.experience.popup.description")}
            value={values.metaData.visitorExperience.popup}
            onChange={(popup) => updateExperience(setValues, { popup })}
          />
          <Separator className="bg-border/60" />
          <ExperienceField
            icon={ImageIcon}
            label={t("editor.general.experience.banner.label")}
            description={t("editor.general.experience.banner.description")}
            value={values.metaData.visitorExperience.banner}
            onChange={(banner) => updateExperience(setValues, { banner })}
          />
          <Separator className="bg-border/60" />
          <ExperienceField
            icon={MonitorSmartphone}
            label={t("editor.general.experience.interstitial.label")}
            description={t("editor.general.experience.interstitial.description")}
            value={values.metaData.visitorExperience.interstitial}
            onChange={(interstitial) =>
              updateExperience(setValues, { interstitial })
            }
          />
          <Separator className="bg-border/60" />
          <ExperienceField
            icon={BellRing}
            label={t("editor.general.experience.notification.label")}
            description={t("editor.general.experience.notification.description")}
            value={values.metaData.visitorExperience.notification}
            onChange={(notification) =>
              updateExperience(setValues, { notification })
            }
          />
        </div>
      </section>
    </div>
  );
}

function ShowFields({ values, setValues }: EditorSectionProps) {
  const t = useTranslations(NS);
  const pageCount = values.metaData.stepCount;
  const previewCounts = splitActionCounts(5, Math.min(pageCount, 5));

  return (
    <div className="space-y-8">
      <SectionHeader
        title={t("editor.show.title")}
        description={t("editor.show.description")}
      />
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="space-y-4">
          <FormField label={t("editor.show.pageCount")} htmlFor="monetization-show-pages">
            <Input
              id="monetization-show-pages"
              type="number"
              min={1}
              max={20}
              value={pageCount}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  metaData: {
                    ...current.metaData,
                    stepCount: integerValue(event.target.value),
                  },
                }))
              }
            />
          </FormField>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
            {t("editor.show.note")}
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t("editor.show.exampleTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("editor.show.exampleNote")}</p>
            </div>
            <Badge variant="secondary">
              {t("editor.show.actualPages", { count: previewCounts.length })}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {previewCounts.map((count, index) => (
              <div key={index} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">
                    {t("editor.show.pageN", { number: index + 1 })}
                  </span>
                  <Badge variant="outline">
                    {t("editor.show.actionCount", { count })}
                  </Badge>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {index === previewCounts.length - 1
                    ? t("editor.show.destinationHere")
                    : t("editor.show.nextPage", { number: index + 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TranslationsEditor({
  values,
  setValues,
  languages,
  activeLocale,
  onActiveLocaleChange,
}: EditorSectionProps & {
  languages: Language[];
  activeLocale: string;
  onActiveLocaleChange: (locale: string) => void;
}) {
  const t = useTranslations(NS);
  const fallbackLocale =
    languages.find((language) => language.isDefault)?.locale ??
    languages[0]?.locale ??
    "vi";

  React.useEffect(() => {
    if (!languages.length) return;
    if (languages.some((language) => language.locale === activeLocale)) return;
    onActiveLocaleChange(fallbackLocale);
  }, [activeLocale, fallbackLocale, languages, onActiveLocaleChange]);

  const completed = languages.filter((language) =>
    hasTranslation(values, language.locale),
  ).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          title={t("editor.translations.title")}
          description={t("editor.translations.description")}
        />
        <Badge variant="outline" className="w-fit shrink-0">
          {t("editor.translations.progress", {
            completed,
            total: languages.length,
          })}
        </Badge>
      </div>

      {languages.length ? (
        <Tabs
          value={activeLocale}
          onValueChange={onActiveLocaleChange}
          className="overflow-hidden rounded-xl border border-border/60 bg-background"
        >
          <div className="border-b border-border/60 bg-muted/20 px-2 pt-2">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="h-auto min-w-max justify-start gap-1 bg-transparent p-0">
                {languages.map((language) => {
                  const languageName = language.nativeName || language.name;
                  const complete = hasTranslation(values, language.locale);

                  return (
                    <TabsTrigger
                      key={language.id}
                      value={language.locale}
                      className="h-10 gap-2 rounded-t-lg rounded-b-none border border-transparent px-3 text-muted-foreground shadow-none after:hidden data-[state=active]:border-border/60 data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                      <Languages className="size-4" />
                      <span>{languageName}</span>
                      {language.isDefault ? (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {t("table.default")}
                        </span>
                      ) : (
                        <CompletionDot complete={complete} />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {languages.map((language) => (
            <TabsContent
              key={language.id}
              value={language.locale}
              className="mt-0 p-4 sm:p-5"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {language.nativeName || language.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("editor.translations.locale")}{" "}
                    <span className="font-mono">{language.locale}</span>
                    {language.isDefault
                      ? t("editor.translations.defaultRequired")
                      : t("editor.translations.optional")}
                  </p>
                </div>
                <CompletionDot
                  complete={hasTranslation(values, language.locale)}
                />
              </div>

              <TranslationFields
                locale={language.locale}
                languageName={language.nativeName || language.name}
                values={values}
                setValues={setValues}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
          {t("editor.translations.noLanguages")}
        </div>
      )}
    </section>
  );
}

function TranslationFields({
  locale,
  languageName,
  values,
  setValues,
}: EditorSectionProps & { locale: string; languageName: string }) {
  const t = useTranslations(NS);
  const tc = useTranslations("Admin.common");
  const translation = values.translations.find(
    (item) => item.locale === locale,
  ) ?? { locale, name: "", description: "" };
  const update = (patch: Partial<(typeof values.translations)[number]>) => {
    setValues((current) => {
      const exists = current.translations.some((item) => item.locale === locale);
      return {
        ...current,
        translations: exists
          ? current.translations.map((item) =>
              item.locale === locale ? { ...item, ...patch } : item,
            )
          : [
              ...current.translations,
              { locale, name: "", description: "", ...patch },
            ],
      };
    });
  };

  return (
    <div className="grid gap-5">
      <FormField label={t("editor.translations.displayName")} htmlFor={`level-name-${locale}`}>
        <Input
          id={`level-name-${locale}`}
          maxLength={100}
          value={translation.name}
          placeholder={t("editor.translations.namePlaceholder", { language: languageName })}
          onChange={(event) => update({ name: event.target.value })}
        />
      </FormField>
      <FormField
        label={tc("description")}
        htmlFor={`level-description-${locale}`}
      >
        <Textarea
          id={`level-description-${locale}`}
          rows={5}
          maxLength={500}
          value={translation.description ?? ""}
          placeholder={t("editor.translations.descriptionPlaceholder", { language: languageName })}
          onChange={(event) => update({ description: event.target.value })}
        />
      </FormField>
    </div>
  );
}

function ConfigurationSummary({
  values,
  setValues,
  activeTab,
}: EditorSectionProps & { activeTab: string }) {
  const t = useTranslations(NS);
  const tc = useTranslations("Admin.common");
  const name =
    values.translations.find((translation) => translation.locale === "vi")
      ?.name ||
    values.translations.find((translation) => translation.name.trim())?.name ||
    t("editor.summary.unnamedLevel");
  const experience = values.metaData.visitorExperience;
  const { statusOptions } = useEditorOptions();
  const locale = useLocale();
  const selectedStatus = statusOptions.find(
    (option) => option.value === values.status,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold">{t("editor.summary.title")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("editor.summary.subtitle")}
          </p>
        </div>
        <EditorStatus status={values.status} />
      </div>

      <div className="space-y-5 p-4">
        <div className="space-y-2">
          <Label htmlFor="monetization-status">{tc("status")}</Label>
          <Select
            value={values.status}
            disabled={values.isDefault}
            onValueChange={(status: PublicationStatus) =>
              setValues((current) => ({ ...current, status }))
            }
          >
            <SelectTrigger id="monetization-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs leading-5 text-muted-foreground">
            {values.isDefault
              ? t("editor.summary.defaultMustPublish")
              : selectedStatus?.description}
          </p>
        </div>

        {activeTab === "routes" ? (
          <RoutesConfigurationSummary routes={values.routes} />
        ) : (
          <>
            <Separator className="bg-border/60" />

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("editor.summary.identity")}
              </p>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{name}</h3>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {values.key || "level-key"}
                  </p>
                </div>
                {values.isDefault ? (
                  <Badge variant="secondary">{t("table.default")}</Badge>
                ) : null}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border/60">
              <div className="grid grid-cols-2 divide-x divide-border/60">
                <div className="p-3">
                  <p className="text-[11px] text-muted-foreground">
                    {t("table.columns.profit")}
                  </p>
                  <p className="mt-1 text-base font-semibold tabular-nums">
                    {(values.metaData.profitBps / 100).toLocaleString(locale, {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-[11px] text-muted-foreground">{t("editor.show.pageCount")}</p>
                  <p className="mt-1 text-base font-semibold tabular-nums">
                    {values.metaData.stepCount}
                  </p>
                </div>
              </div>
              <Separator className="bg-border/60" />
              <div className="grid grid-cols-2 divide-x divide-border/60">
                <div className="p-3">
                  <p className="text-[11px] text-muted-foreground">
                    {t("table.columns.routes")}
                  </p>
                  <p className="mt-1 text-base font-semibold tabular-nums">
                    {values.routes.length}
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-[11px] text-muted-foreground">
                    {t("table.columns.rates")}
                  </p>
                  <p className="mt-1 text-base font-semibold tabular-nums">
                    {values.rates.length}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-border/60" />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("editor.summary.adDensity")}
              </p>
              <div className="mt-3 space-y-2.5">
                <PreviewRow label={t("editor.summary.popup")}
                  value={densityLabel(t, experience.popup)} />
                <PreviewRow
                  label={t("editor.summary.banner")}
                  value={densityLabel(t, experience.banner)}
                />
                <PreviewRow
                  label={t("editor.summary.interstitial")}
                  value={densityLabel(t, experience.interstitial)}
                />
                <PreviewRow
                  label={t("editor.summary.notification")}
                  value={densityLabel(t, experience.notification)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}

function routeHasNoTargeting(route: MonetizationRoute) {
  return [
    route.targeting.countries,
    route.targeting.devices,
    route.targeting.operatingSystems,
    route.targeting.browsers,
  ].every(
    (list) => list.include.length === 0 && list.exclude.length === 0,
  );
}

function routeTargetingGroupCount(route: MonetizationRoute) {
  return [
    route.targeting.countries,
    route.targeting.devices,
    route.targeting.operatingSystems,
    route.targeting.browsers,
  ].reduce(
    (count, list) => count + Number(list.include.length > 0) + Number(list.exclude.length > 0),
    0,
  );
}

function formatRouteDestination(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname === "/" ? "" : url.pathname;
    return `${url.host}${path}`;
  } catch {
    return value || "—";
  }
}

function RoutesConfigurationSummary({ routes }: { routes: MonetizationRoute[] }) {
  const t = useTranslations(NS);
  const enabledRoutes = routes.filter((route) => route.enabled);
  const fallbackRoutes = enabledRoutes.filter(routeHasNoTargeting);
  const priorityGroups = new Set(enabledRoutes.map((route) => route.priority)).size;

  const selectionSteps = [
    {
      title: t("editor.routes.summary.conditions"),
      description: t("editor.routes.summary.conditionsDescription"),
    },
    {
      title: t("editor.routes.summary.priority"),
      description: t("editor.routes.summary.priorityDescription"),
    },
    {
      title: t("editor.routes.summary.weight"),
      description: t("editor.routes.summary.weightDescription"),
    },
  ];

  return (
    <>
      <Separator className="bg-border/60" />

      <section>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("editor.routes.summary.title")}
          </p>
          <Badge variant="secondary" className="rounded-md">
            {t("editor.routes.summary.enabledCount", {
              enabled: enabledRoutes.length,
              total: routes.length,
            })}
          </Badge>
        </div>

        <div className="mt-3 grid grid-cols-3 divide-x divide-border/60 overflow-hidden rounded-lg border border-border/60">
          <div className="p-3 text-center">
            <p className="text-lg font-semibold tabular-nums">{routes.length}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t("editor.routes.summary.routes")}
            </p>
          </div>
          <div className="p-3 text-center">
            <p className="text-lg font-semibold tabular-nums">{priorityGroups}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t("editor.routes.summary.priorityGroups")}
            </p>
          </div>
          <div className="p-3 text-center">
            <p className="text-lg font-semibold tabular-nums">{fallbackRoutes.length}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t("editor.routes.summary.fallbacks")}
            </p>
          </div>
        </div>
      </section>

      <Separator className="bg-border/60" />

      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("editor.routes.summary.selectionOrder")}
        </p>
        <ol className="mt-3 space-y-3">
          {selectionSteps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-md border bg-muted/40 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium">{step.title}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Separator className="bg-border/60" />

      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("editor.routes.summary.configuredRoutes")}
        </p>
        {routes.length ? (
          <ul className="mt-3 space-y-2">
            {routes.map((route, index) => {
              const targetingGroups = routeTargetingGroupCount(route);
              return (
                <li
                  key={route.id}
                  className={`rounded-lg border border-border/60 px-3 py-2.5 ${
                    route.enabled ? "bg-muted/15" : "border-dashed opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium">
                      {t("editor.routes.routeNumber", { number: index + 1 })}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      P{route.priority} · W{route.weight}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground" title={route.targetUrl}>
                    {formatRouteDestination(route.targetUrl)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {targetingGroups === 0
                      ? t("editor.routes.summary.allTraffic")
                      : t("editor.routes.summary.restrictedGroups", { count: targetingGroups })}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {t("editor.routes.empty.description")}
          </p>
        )}
      </section>
    </>
  );
}

function RoutesFields({ values, setValues }: EditorSectionProps) {
  const t = useTranslations(NS);
  const { revealedKey, revealItem } = useNewItemReveal();
  const hasFallbackRoute = values.routes.some(
    (route) => route.enabled && routeHasNoTargeting(route),
  );

  const addRoute = () => {
    const routeId = nextRouteId();
    setValues((current) => ({
      ...current,
      routes: [
        ...current.routes,
        {
          id: routeId,
          targeting: defaultRouteTargeting(),
          targetUrl: "https://",
          priority: current.routes.length * 10,
          weight: 100,
          enabled: true,
        },
      ],
    }));
    revealItem(routeId, `new-route-${routeId}`);
  };

  const updateRoute = (index: number, patch: Partial<MonetizationRoute>) =>
    setValues((current) => ({
      ...current,
      routes: current.routes.map((route, routeIndex) =>
        routeIndex === index ? { ...route, ...patch } : route,
      ),
    }));

  const removeRoute = (index: number) =>
    setValues((current) => ({
      ...current,
      routes: current.routes.filter((_, routeIndex) => routeIndex !== index),
    }));

  return (
    <div className="space-y-5">
      <CollectionSectionHeader
        icon={RouteIcon}
        title={t("editor.routes.title")}
        description={t("editor.routes.description")}
        countText={t("editor.routes.count", { count: values.routes.length })}
        actions={
          <Button type="button" size="sm" onClick={addRoute}>
            <Plus /> {t("editor.routes.add")}
          </Button>
        }
      />

      <ConfigurationNotice
        healthy={hasFallbackRoute || values.routes.length === 0}
        title={
          values.routes.length === 0
            ? t("editor.routes.notice.defaultFlow")
            : hasFallbackRoute
              ? t("editor.routes.notice.hasFallback")
              : t("editor.routes.notice.missingFallback")
        }
        description={
          values.routes.length === 0
            ? t("editor.routes.notice.defaultFlowDescription")
            : hasFallbackRoute
              ? t("editor.routes.notice.hasFallbackDescription")
              : t("editor.routes.notice.missingFallbackDescription")
        }
      />

      {values.routes.length ? (
        <div className="space-y-3">
          {values.routes.map((route, index) => {
            const isFallback = routeHasNoTargeting(route);
            const targetingGroups = routeTargetingGroupCount(route);

            return (
              <article
                key={route.id}
                id={`new-route-${route.id}`}
                className={`scroll-m-24 overflow-hidden rounded-xl border bg-card transition-[border-color,background-color,box-shadow] duration-700 ${
                  revealedKey === route.id
                    ? "animate-in border-primary/60 bg-primary/[0.025] ring-2 ring-primary/20 fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
                    : route.enabled
                      ? "border-border/70"
                      : "border-dashed border-border/70"
                }`}
              >
                <header className="flex flex-col gap-3 border-b border-border/60 bg-muted/15 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md border bg-background text-[11px] font-semibold tabular-nums text-muted-foreground shadow-xs">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-sm font-semibold">
                          {t("editor.routes.routeNumber", { number: index + 1 })}
                        </h4>
                        {isFallback ? (
                          <SummaryBadge variant="outline">
                            {t("editor.routes.fallback")}
                          </SummaryBadge>
                        ) : null}
                        <SummaryBadge variant="outline">P{route.priority}</SummaryBadge>
                        <SummaryBadge variant="outline">W{route.weight}</SummaryBadge>
                        {revealedKey === route.id ? <NewItemBadge /> : null}
                      </div>
                      <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground" title={route.targetUrl}>
                        {formatRouteDestination(route.targetUrl)} · {targetingGroups === 0
                          ? t("editor.routes.summary.allTraffic")
                          : t("editor.routes.summary.restrictedGroups", { count: targetingGroups })}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <label className="flex h-8 items-center gap-2 rounded-lg border bg-background px-2.5 text-[11px] text-muted-foreground">
                      {route.enabled
                        ? t("editor.item.enabledNow")
                        : t("editor.item.disabledNow")}
                      <Switch
                        checked={route.enabled}
                        onCheckedChange={(enabled) => updateRoute(index, { enabled })}
                        aria-label={t("editor.routes.toggleRoute", { number: index + 1 })}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("editor.routes.deleteRoute", { id: route.id })}
                      onClick={() => removeRoute(index)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </header>

                <div className={route.enabled ? "" : "opacity-70"}>
                  <section className="p-4 sm:p-5">
                    <div className="mb-4 flex items-start gap-2.5">
                      <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <h5 className="text-sm font-semibold">
                          {t("editor.routes.destinationTitle")}
                        </h5>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {t("editor.routes.destinationDescription")}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                      <div className="md:col-span-2 xl:col-span-4">
                        <FormField
                          label={t("editor.routes.targetUrl")}
                          htmlFor={`route-url-${index}`}
                        >
                          <Input
                            id={`route-url-${index}`}
                            data-new-item-focus
                            type="text"
                            inputMode="url"
                            value={route.targetUrl}
                            placeholder="http://localhost:3100/l/."
                            className="font-mono text-[13px]"
                            onChange={(event) =>
                              updateRoute(index, { targetUrl: event.target.value })
                            }
                          />
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {t.rich("editor.routes.aliasHint", {
                              code: (chunks) => <code>{chunks}</code>,
                            })}
                          </p>
                        </FormField>
                      </div>

                      <FormField
                        label={t("editor.routes.priority")}
                        htmlFor={`route-priority-${index}`}
                      >
                        <Input
                          id={`route-priority-${index}`}
                          type="number"
                          min={0}
                          max={10000}
                          value={route.priority}
                          onChange={(event) =>
                            updateRoute(index, {
                              priority: integerValue(event.target.value),
                            })
                          }
                        />
                      </FormField>

                      <FormField
                        label={t("editor.routes.weight")}
                        htmlFor={`route-weight-${index}`}
                      >
                        <Input
                          id={`route-weight-${index}`}
                          type="number"
                          min={1}
                          max={100}
                          value={route.weight}
                          onChange={(event) =>
                            updateRoute(index, {
                              weight: integerValue(event.target.value),
                            })
                          }
                        />
                      </FormField>
                    </div>
                  </section>

                  <div className="border-t border-border/60 p-4 sm:p-5">
                    <RouteTargetingEditor
                      value={route.targeting}
                      onChange={(targeting) => updateRoute(index, { targeting })}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyConfiguration
          icon={RouteIcon}
          title={t("editor.routes.empty.title")}
          description={t("editor.routes.empty.description")}
          actionLabel={t("editor.routes.empty.action")}
          onAction={addRoute}
        />
      )}
    </div>
  );
}

function AdsFields({ values, setValues }: EditorSectionProps) {
  const t = useTranslations(NS);
  const { revealedKey, revealItem } = useNewItemReveal();

  const addAd = (kind: NewMonetizationAdKind) => {
    const ad = newMonetizationAd(
      kind,
      kind === "smartlink" || kind === "popunder"
        ? 100
        : values.ads.length * 10,
      t,
    );
    setValues((current) => ({
      ...current,
      ads: [...current.ads, ad],
    }));
    revealItem(ad.id, `new-ad-${ad.id}`);
  };

  const updateAd = (index: number, patch: Partial<MonetizationAd>) =>
    setValues((current) => ({
      ...current,
      ads: current.ads.map((ad, adIndex) =>
        adIndex === index ? { ...ad, ...patch } : ad,
      ),
    }));

  const removeAd = (index: number) =>
    setValues((current) => ({
      ...current,
      ads: current.ads.filter((_, adIndex) => adIndex !== index),
    }));

  const duplicateAd = (index: number) => {
    const source = values.ads[index];
    if (!source) return;

    const copy = structuredClone(source);
    copy.id = nextAdId();
    copy.name = t("editor.ads.copyName", { name: source.name });
    copy.enabled = false;
    copy.content.smartlinks = copy.content.smartlinks?.map((smartlink) => ({
      ...smartlink,
      id: nextSmartlinkId(),
    }));

    setValues((current) => {
      const sourceIndex = current.ads.findIndex((ad) => ad.id === source.id);
      const insertAt = sourceIndex >= 0 ? sourceIndex + 1 : current.ads.length;
      return {
        ...current,
        ads: [
          ...current.ads.slice(0, insertAt),
          copy,
          ...current.ads.slice(insertAt),
        ],
      };
    });
    revealItem(copy.id, `new-ad-${copy.id}`);
  };

  const smartlinks = values.ads.filter((ad) => ad.format === "smartlink");
  const hasUncappedSmartlinkFallback = smartlinks.some(
    (ad) =>
      ad.enabled &&
      ad.content.smartlinks?.some(
        (smartlink) =>
          smartlink.enabled &&
          (smartlink.overrides?.maxRedirectsPerSession ??
            ad.content.maxRedirectsPerSession ??
            0) === 0 &&
          (smartlink.overrides?.maxRedirectsPerVisitor ??
            ad.content.maxRedirectsPerVisitor ??
            0) === 0 &&
          (smartlink.overrides?.cooldownMinutes ??
            ad.content.cooldownMinutes ??
            0) === 0 &&
          !(smartlink.overrides?.startAt ?? ad.content.startAt) &&
          !(smartlink.overrides?.endAt ?? ad.content.endAt),
      ) &&
      isUnrestrictedAdTargeting(ad.targeting),
  );

  return (
    <div className="space-y-5">
      <CollectionSectionHeader
        icon={Megaphone}
        title={t("editor.ads.title")}
        description={t("editor.ads.description")}
        countText={t("editor.ads.count", { count: values.ads.length })}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => addAd("smartlink")}>
              <Plus /> Smartlink
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addAd("popunder")}
            >
              <Plus /> Popunder
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addAd("action")}
            >
              <Plus /> Ads Action
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addAd("inject_html")}
            >
              <Plus /> Inject HTML
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <ConfigurationNotice
          healthy={
            values.ads.length === 0 ||
            values.ads.some(
              (ad) => ad.enabled && isUnrestrictedAdTargeting(ad.targeting),
            )
          }
          title={
            values.ads.length
              ? t("editor.ads.notice.fallbackTargeting")
              : t("editor.ads.notice.none")
          }
          description={
            values.ads.length
              ? t("editor.ads.notice.fallbackTargetingDescription")
              : t("editor.ads.notice.noneDescription")
          }
        />

        {smartlinks.length ? (
          <ConfigurationNotice
            healthy={hasUncappedSmartlinkFallback}
            title={
              hasUncappedSmartlinkFallback
                ? t("editor.ads.notice.smartlinkReady")
                : t("editor.ads.notice.smartlinkMissing")
            }
            description={
              hasUncappedSmartlinkFallback
                ? t("editor.ads.notice.smartlinkReadyDescription")
                : t("editor.ads.notice.smartlinkMissingDescription")
            }
          />
        ) : (
          <ConfigurationNotice
            healthy
            title={t("editor.ads.notice.noSmartlink")}
            description={t("editor.ads.notice.noSmartlinkDescription")}
          />
        )}
      </div>

      {values.ads.length ? (
        <div className="space-y-4">
          {values.ads.map((ad, index) => (
            <AdManagerCard
              key={ad.id}
              ad={ad}
              index={index}
              isNew={revealedKey === ad.id}
              onChange={(patch) => updateAd(index, patch)}
              onDuplicate={() => duplicateAd(index)}
              onDelete={() => removeAd(index)}
            />
          ))}
        </div>
      ) : (
        <EmptyConfiguration
          icon={Megaphone}
          title={t("editor.ads.empty.title")}
          description={t("editor.ads.empty.description")}
          actionLabel={t("editor.ads.empty.action")}
          onAction={() => addAd("smartlink")}
        />
      )}
    </div>
  );
}

function AdManagerCard({
  ad,
  index,
  isNew,
  onChange,
  onDuplicate,
  onDelete,
}: {
  ad: MonetizationAd;
  index: number;
  isNew: boolean;
  onChange: (patch: Partial<MonetizationAd>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations(NS);
  const tc = useTranslations("Admin.common");
  const ti = useTranslations("Admin.monetizationActionIcons");
  const {
    adPlacementOptions,
    actionPositionModeOptions,
    actionDisplayModeOptions,
    actionCooldownScopeOptions,
    actionCooldownBehaviorOptions,
  } = useEditorOptions();
  const {
    revealedKey: revealedSmartlinkKey,
    revealItem: revealSmartlink,
  } = useNewItemReveal();
  const updateContent = (
    patch: Partial<MonetizationAd["content"]>,
  ) =>
    onChange({
      content: {
        ...ad.content,
        ...patch,
      },
    });

  const updateSmartlink = (
    smartlinkIndex: number,
    patch: Partial<MonetizationSmartlink>,
  ) =>
    updateContent({
      smartlinks: (ad.content.smartlinks ?? []).map((item, itemIndex) =>
        itemIndex === smartlinkIndex
          ? { ...item, ...patch }
          : item,
      ),
    });

  const addSmartlink = () => {
    const smartlink = newSmartlink((ad.content.smartlinks?.length ?? 0) * 10);
    updateContent({
      smartlinks: [...(ad.content.smartlinks ?? []), smartlink],
    });
    revealSmartlink(smartlink.id, `new-smartlink-${smartlink.id}`);
  };

  const deleteSmartlink = (smartlinkIndex: number) =>
    updateContent({
      smartlinks: (ad.content.smartlinks ?? []).filter(
        (_, itemIndex) => itemIndex !== smartlinkIndex,
      ),
    });

  const duplicateSmartlink = (smartlinkIndex: number) => {
    const source = ad.content.smartlinks?.[smartlinkIndex];

    if (!source) return;

    const copy = {
      ...structuredClone(source),
      id: nextSmartlinkId(),
      sortOrder: source.sortOrder + 1,
      enabled: false,
    };

    updateContent({
      smartlinks: [
        ...(ad.content.smartlinks ?? []).slice(0, smartlinkIndex + 1),
        copy,
        ...(ad.content.smartlinks ?? []).slice(smartlinkIndex + 1),
      ],
    });
    revealSmartlink(copy.id, `new-smartlink-${copy.id}`);
  };

  const formatLabel =
    ad.format === "smartlink"
      ? ad.placements.includes("popunder")
        ? "Smartlink Popunder"
        : "Smartlink"
      : ad.format === "inject_html"
        ? "Inject HTML"
        : legacyAdFormatKeys[ad.format]
          ? t(`options.${legacyAdFormatKeys[ad.format]}`)
          : ad.format;

  const Icon =
    ad.format === "inject_html"
      ? Code2
      : ad.format === "banner"
      ? ImageIcon
      : ad.format === "script"
        ? Settings2
        : ad.format === "smartlink"
          ? Link2
          : Megaphone;

  const enabledSmartlinks =
    ad.content.smartlinks?.filter((item) => item.enabled).length ?? 0;
  const activeTargetingGroups = countActiveAdTargetingGroups(ad.targeting);
  const selectedActionPositionMode = getActionPositionMode(ad.content);

  return (
    <ConfigItemShell id={`new-ad-${ad.id}`} isNew={isNew}>
      <ConfigItemHeader
        icon={Icon}
        title={ad.name || t("editor.card.unnamed")}
        description={<span className="font-mono">{ad.id}</span>}
        badges={
          <>
            <SummaryBadge variant="outline">{formatLabel}</SummaryBadge>
            <SummaryBadge variant="outline">P{ad.priority}</SummaryBadge>
            {ad.format !== "smartlink" ? (
              <SummaryBadge variant="outline">W{ad.weight}</SummaryBadge>
            ) : null}
          </>
        }
        isNew={isNew}
        enabled={ad.enabled}
        statusLabel={
          ad.enabled ? t("editor.card.running") : t("editor.item.disabledNow")
        }
        onEnabledChange={(enabled) => onChange({ enabled })}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        duplicateLabel={t("editor.card.duplicateName", { name: ad.name })}
        deleteLabel={t("editor.card.deleteName", { name: ad.name })}
      />

      <div className="space-y-3 p-3 sm:p-4">

        <AdSummarySection
          defaultOpen
          title={t("editor.card.info.title")}
          description={t("editor.card.info.description")}
          icon={Megaphone}
          summary={
            <>
              <SummaryBadge>{formatLabel}</SummaryBadge>

              <SummaryBadge variant="outline">
                {t("editor.card.placementCount", { count: ad.placements.length })}
              </SummaryBadge>
            </>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField
              label={t("editor.card.info.name")}
              htmlFor={`ad-name-${index}`}
            >
              <Input
                id={`ad-name-${index}`}
                data-new-item-focus
                maxLength={120}
                value={ad.name}
                placeholder={t("editor.card.info.namePlaceholder")}
                onChange={(event) =>
                  onChange({
                    name: event.target.value,
                  })
                }
              />
            </FormField>

            <FormField
              label="ID"
              htmlFor={`ad-id-${index}`}
            >
              <Input
                id={`ad-id-${index}`}
                maxLength={64}
                value={ad.id}
                className="font-mono"
                onChange={(event) =>
                  onChange({
                    id: event.target.value,
                  })
                }
              />
            </FormField>

            <div
              className={
                ad.format === "smartlink"
                  ? ""
                  : "grid grid-cols-2 gap-3"
              }
            >
              <FormField
                label="Priority"
                htmlFor={`ad-priority-${index}`}
              >
                <Input
                  id={`ad-priority-${index}`}
                  type="number"
                  min={0}
                  max={10000}
                  value={ad.priority}
                  onChange={(event) =>
                    onChange({
                      priority: integerValue(event.target.value),
                    })
                  }
                />
              </FormField>

              {ad.format !== "smartlink" ? (
                <FormField
                  label="Weight"
                  htmlFor={`ad-weight-${index}`}
                >
                  <Input
                    id={`ad-weight-${index}`}
                    type="number"
                    min={1}
                    max={100}
                    value={ad.weight}
                    onChange={(event) =>
                      onChange({
                        weight: integerValue(event.target.value),
                      })
                    }
                  />
                </FormField>
              ) : null}
            </div>

            <div className="lg:col-span-2">
              <Label>Placement</Label>

              {ad.format === "inject_html" ? (
                <OptionButtons
                  className="mt-2"
                  options={adPlacementOptions.filter((option) =>
                    isInjectHtmlPlacement(option.value),
                  )}
                  values={ad.placements}
                  onChange={(placements) =>
                    onChange({
                      placements: placements.length ? placements : ad.placements,
                    })
                  }
                />
              ) : ad.format === "smartlink" ? (
                <div className="mt-2">
                  <Badge variant="outline" className="rounded-md bg-background">
                    {ad.placements.includes("popunder")
                      ? t("options.placement.popunder")
                      : t("options.placement.unlock_redirect")}
                  </Badge>
                </div>
              ) : (
                <OptionButtons
                  className="mt-2"
                  options={adPlacementOptions.filter((option) =>
                    ad.format === "action"
                      ? option.value === "action_list"
                      : !isActionPlacement(option.value) &&
                        !isSmartlinkPlacement(option.value),
                  )}
                  values={ad.placements}
                  onChange={(placements) =>
                    onChange({
                      placements:
                        ad.format === "action"
                          ? placements.length
                            ? [placements[placements.length - 1]!]
                            : ad.placements
                          : placements,
                    })
                  }
                />
              )}
            </div>
          </div>

          {ad.format === "smartlink" &&
          ad.placements.includes("popunder") ? (
            <div className="mt-4">
              <ConfigurationNotice
                healthy
                title={t("editor.card.popunderNotice.title")}
                description={t("editor.card.popunderNotice.description")}
              />
            </div>
          ) : null}
        </AdSummarySection>

        {ad.format === "smartlink" ? (
          <AdSummarySection
            defaultOpen={(ad.content.smartlinks ?? []).every(
              (item) => !item.url.trim() || item.url.trim() === "https://",
            )}
            title="Smartlinks"
            description={t("editor.card.smartlinks.description")}
            icon={Link2}
            summary={
              <>
                <SummaryBadge>
                  {t("editor.card.smartlinks.linkCount", { count: ad.content.smartlinks?.length ?? 0 })}
                </SummaryBadge>

                <SummaryBadge variant="outline">
                  {t("editor.card.smartlinks.activeCount", { count: enabledSmartlinks })}
                </SummaryBadge>
              </>
            }
          >
            <SmartlinkSection
              ad={ad}
              index={index}
              newItemKey={revealedSmartlinkKey}
              onAdd={addSmartlink}
              onUpdate={updateSmartlink}
              onDelete={deleteSmartlink}
              onDuplicate={duplicateSmartlink}
            />
          </AdSummarySection>
        ) : null}

        {ad.format === "inject_html" ? (
          <AdSummarySection
            defaultOpen
            title={t("editor.card.embed.title")}
            description={t("editor.card.embed.description")}
            icon={Code2}
            summary={
              ad.content.html?.trim() ||
              ad.content.css?.trim() ||
              ad.content.javascript?.trim() ? (
                <SummaryBadge variant="outline">{t("editor.card.embed.hasContent")}</SummaryBadge>
              ) : (
                <SummaryBadge>{t("editor.card.embed.noContent")}</SummaryBadge>
              )
            }
          >
            <div className="grid gap-4">
              <FormField
                label="HTML"
                htmlFor={`ad-inject-html-${index}`}
              >
                <Textarea
                  id={`ad-inject-html-${index}`}
                  rows={10}
                  maxLength={200_000}
                  value={ad.content.html ?? ""}
                  className="font-mono text-xs"
                  placeholder={`<div class="ad-slot">${t("editor.card.embed.adContent")}</div>`}
                  onChange={(event) => updateContent({ html: event.target.value })}
                />
              </FormField>

              <FormField
                label="CSS"
                htmlFor={`ad-inject-css-${index}`}
              >
                <Textarea
                  id={`ad-inject-css-${index}`}
                  rows={7}
                  maxLength={100_000}
                  value={ad.content.css ?? ""}
                  className="font-mono text-xs"
                  placeholder=".ad-slot { display: grid; place-items: center; }"
                  onChange={(event) => updateContent({ css: event.target.value })}
                />
              </FormField>

              <FormField
                label="JavaScript"
                htmlFor={`ad-inject-javascript-${index}`}
              >
                <Textarea
                  id={`ad-inject-javascript-${index}`}
                  rows={7}
                  maxLength={100_000}
                  value={ad.content.javascript ?? ""}
                  className="font-mono text-xs"
                  placeholder={t("editor.card.embed.jsPlaceholder")}
                  onChange={(event) => updateContent({ javascript: event.target.value })}
                />
              </FormField>

              <FormField
                label={t("editor.card.embed.iframeHeight")}
                htmlFor={`ad-inject-height-${index}`}
              >
                <Input
                  id={`ad-inject-height-${index}`}
                  type="number"
                  min={40}
                  max={2000}
                  value={ad.content.height ?? 250}
                  onChange={(event) =>
                    updateContent({ height: integerValue(event.target.value) })
                  }
                />
              </FormField>
            </div>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {t("editor.card.embed.note")}
            </p>
          </AdSummarySection>
        ) : null}

        {ad.format === "action" ? (
          <AdSummarySection
            title={t("editor.card.action.title")}
            description={t("editor.card.action.description")}
            icon={Link2}
            summary={
              <>
                <SummaryBadge variant="outline">
                  {actionPositionModeOptions.find(
                    (option) => option.value === selectedActionPositionMode,
                  )?.label}
                </SummaryBadge>
                {(ad.content.actionCooldownMinutes ?? 0) > 0 ? (
                  <SummaryBadge variant="outline">
                    {t("editor.card.action.hideMinutes", { minutes: ad.content.actionCooldownMinutes ?? 0 })}
                  </SummaryBadge>
                ) : null}
                {ad.content.actionRotationGroup ? (
                  <SummaryBadge variant="outline">
                    {t("editor.card.action.group", { group: ad.content.actionRotationGroup })}
                  </SummaryBadge>
                ) : null}
                <SummaryBadge variant="outline">
                  {(ad.content.actionDisplayMode ?? "sequential") === "all"
                    ? t("options.displayMode.all")
                    : t("options.displayMode.sequential")}
                </SummaryBadge>
              </>
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <FormField
                  label={t("editor.card.action.adLink")}
                  htmlFor={`ad-action-url-${index}`}
                >
                  <Input
                    id={`ad-action-url-${index}`}
                    type="url"
                    value={ad.content.targetUrl ?? ""}
                    placeholder="https://advertiser.example/landing"
                    onChange={(event) =>
                      updateContent({
                        targetUrl: event.target.value,
                      })
                    }
                  />
                </FormField>
              </div>

              <FormField
                label={t("editor.card.action.label")}
                htmlFor={`ad-action-label-${index}`}
              >
                <Input
                  id={`ad-action-label-${index}`}
                  maxLength={80}
                  value={ad.content.actionLabel ?? ""}
                  placeholder={t("editor.card.action.labelPlaceholder")}
                  onChange={(event) =>
                    updateContent({
                      actionLabel: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Icon" htmlFor={`ad-action-icon-${index}`}>
                <Select
                  value={ad.content.actionIcon ?? "auto"}
                  onValueChange={(value) =>
                    updateContent({
                      actionIcon: value === "auto" ? undefined : value as MonetizationActionIconKey,
                    })
                  }
                >
                  <SelectTrigger id={`ad-action-icon-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">{t("editor.card.action.iconAuto")}</SelectItem>
                    {monetizationActionIconOptions.map(({ value, labelKey, icon: Icon }) => (
                      <SelectItem key={value} value={value}>
                        <Icon className="size-4" aria-hidden="true" />
                        {ti(labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Platform"
                htmlFor={`ad-action-platform-${index}`}
              >
                <Input
                  id={`ad-action-platform-${index}`}
                  maxLength={64}
                  value={ad.content.actionPlatform ?? "other"}
                  placeholder="youtube, facebook, other..."
                  onChange={(event) =>
                    updateContent({
                      actionPlatform: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label="Action key"
                htmlFor={`ad-action-type-${index}`}
              >
                <Input
                  id={`ad-action-type-${index}`}
                  maxLength={64}
                  value={ad.content.actionType ?? "other-visit"}
                  className="font-mono"
                  placeholder="other-visit"
                  onChange={(event) =>
                    updateContent({
                      actionType: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label={t("editor.card.action.position")}
                htmlFor={`ad-action-position-${index}`}
              >
                <Select
                  value={selectedActionPositionMode}
                  onValueChange={(value) =>
                    updateContent({
                      actionPositionMode: value as MonetizationActionPositionMode,
                      actionPosition: undefined,
                    })
                  }
                >
                  <SelectTrigger id={`ad-action-position-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionPositionModeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-muted-foreground">
                  {actionPositionModeOptions.find(
                    (option) => option.value === selectedActionPositionMode,
                  )?.description}
                </p>
              </FormField>

              <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 lg:col-span-2 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <p className="text-sm font-medium">{t("editor.card.action.cooldownTitle")}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("editor.card.action.cooldownDescription")}
                  </p>
                </div>

                <div className="lg:col-span-2">
                  <FormField
                    label={t("editor.card.action.displayMode")}
                    htmlFor={`ad-action-display-mode-${index}`}
                  >
                    <Select
                      value={ad.content.actionDisplayMode ?? "sequential"}
                      onValueChange={(value) =>
                        updateContent({
                          actionDisplayMode: value as MonetizationActionDisplayMode,
                        })
                      }
                    >
                      <SelectTrigger id={`ad-action-display-mode-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionDisplayModeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {actionDisplayModeOptions.find(
                        (option) => option.value === (ad.content.actionDisplayMode ?? "sequential"),
                      )?.description}
                    </p>
                  </FormField>
                </div>

                <FormField
                  label={t("editor.card.action.hideFor")}
                  htmlFor={`ad-action-cooldown-${index}`}
                >
                  <Input
                    id={`ad-action-cooldown-${index}`}
                    type="number"
                    min={0}
                    max={525600}
                    value={ad.content.actionCooldownMinutes ?? 0}
                    onChange={(event) =>
                      updateContent({
                        actionCooldownMinutes: integerValue(event.target.value),
                      })
                    }
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("editor.card.action.hideForHint")}
                  </p>
                </FormField>

                <FormField
                  label={t("editor.card.action.scope")}
                  htmlFor={`ad-action-cooldown-scope-${index}`}
                >
                  <Select
                    value={ad.content.actionCooldownScope ?? "visitor"}
                    onValueChange={(value) =>
                      updateContent({
                        actionCooldownScope: value as MonetizationActionCooldownScope,
                      })
                    }
                  >
                    <SelectTrigger id={`ad-action-cooldown-scope-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionCooldownScopeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {actionCooldownScopeOptions.find(
                      (option) => option.value === (ad.content.actionCooldownScope ?? "visitor"),
                    )?.description}
                  </p>
                </FormField>

                <FormField
                  label={t("editor.card.action.rotationGroup")}
                  htmlFor={`ad-action-rotation-group-${index}`}
                >
                  <Input
                    id={`ad-action-rotation-group-${index}`}
                    maxLength={64}
                    value={ad.content.actionRotationGroup ?? ""}
                    className="font-mono"
                    placeholder="sponsor"
                    onChange={(event) =>
                      updateContent({
                        actionRotationGroup: event.target.value || undefined,
                      })
                    }
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("editor.card.action.rotationGroupHint")}
                  </p>
                </FormField>

                <FormField
                  label={t("editor.card.action.whenHidden")}
                  htmlFor={`ad-action-cooldown-behavior-${index}`}
                >
                  <Select
                    value={ad.content.actionCooldownBehavior ?? "replace"}
                    onValueChange={(value) =>
                      updateContent({
                        actionCooldownBehavior: value as MonetizationActionCooldownBehavior,
                      })
                    }
                  >
                    <SelectTrigger id={`ad-action-cooldown-behavior-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionCooldownBehaviorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {actionCooldownBehaviorOptions.find(
                      (option) => option.value === (ad.content.actionCooldownBehavior ?? "replace"),
                    )?.description}
                  </p>
                </FormField>
              </div>
            </div>
          </AdSummarySection>
        ) : null}

        {ad.format === "banner" ? (
          <AdSummarySection
            title="Creative"
            description={t("editor.card.banner.description")}
            icon={ImageIcon}
            summary={
              ad.content.imageUrl && ad.content.imageUrl.trim() !== "https://" ? (
                <SummaryBadge variant="outline">
                  {t("editor.card.banner.hasCreative")}
                </SummaryBadge>
              ) : (
                <SummaryBadge>{t("editor.card.banner.missingCreative")}</SummaryBadge>
              )
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                label="Image URL"
                htmlFor={`ad-image-${index}`}
              >
                <Input
                  id={`ad-image-${index}`}
                  type="url"
                  value={ad.content.imageUrl ?? ""}
                  placeholder="https://..."
                  onChange={(event) =>
                    updateContent({
                      imageUrl: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label="Click URL"
                htmlFor={`ad-click-${index}`}
              >
                <Input
                  id={`ad-click-${index}`}
                  type="url"
                  value={ad.content.clickUrl ?? ""}
                  placeholder="https://..."
                  onChange={(event) =>
                    updateContent({
                      clickUrl: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label={tc("title")}
                htmlFor={`ad-title-${index}`}
              >
                <Input
                  id={`ad-title-${index}`}
                  value={ad.content.title ?? ""}
                  onChange={(event) =>
                    updateContent({
                      title: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label="CTA"
                htmlFor={`ad-cta-${index}`}
              >
                <Input
                  id={`ad-cta-${index}`}
                  value={ad.content.ctaLabel ?? ""}
                  placeholder={t("editor.card.banner.ctaPlaceholder")}
                  onChange={(event) =>
                    updateContent({
                      ctaLabel: event.target.value,
                    })
                  }
                />
              </FormField>

              <div className="lg:col-span-2">
                <FormField
                  label={tc("description")}
                  htmlFor={`ad-description-${index}`}
                >
                  <Textarea
                    id={`ad-description-${index}`}
                    rows={3}
                    value={ad.content.description ?? ""}
                    onChange={(event) =>
                      updateContent({
                        description: event.target.value,
                      })
                    }
                  />
                </FormField>
              </div>

              <div
                className="
                  flex items-center justify-between
                  rounded-lg border bg-muted/20 px-3 py-2.5
                "
              >
                <div>
                  <Label htmlFor={`ad-new-tab-${index}`}>{t("editor.card.banner.newTab")}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("editor.card.banner.newTabHint")}
                  </p>
                </div>

                <Switch
                  id={`ad-new-tab-${index}`}
                  checked={Boolean(ad.content.newTab)}
                  onCheckedChange={(newTab) =>
                    updateContent({ newTab })
                  }
                />
              </div>
            </div>
          </AdSummarySection>
        ) : null}

        {ad.format === "script" ? (
          <AdSummarySection
            title="Script integration"
            description={t("editor.card.script.description")}
            icon={Settings2}
            summary={
              ad.content.zoneId ? (
                <SummaryBadge variant="outline">
                  Zone {ad.content.zoneId}
                </SummaryBadge>
              ) : undefined
            }
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <FormField
                label="Adapter"
                htmlFor={`ad-adapter-${index}`}
              >
                <Input
                  id={`ad-adapter-${index}`}
                  value={
                    ad.content.adapter ??
                    "external-script-v1"
                  }
                  className="font-mono"
                  onChange={(event) =>
                    updateContent({
                      adapter: event.target.value,
                    })
                  }
                />
              </FormField>

              <div className="lg:col-span-2">
                <FormField
                  label="Script URL"
                  htmlFor={`ad-script-${index}`}
                >
                  <Input
                    id={`ad-script-${index}`}
                    type="url"
                    value={ad.content.scriptUrl ?? ""}
                    onChange={(event) =>
                      updateContent({
                        scriptUrl: event.target.value,
                      })
                    }
                  />
                </FormField>
              </div>

              <FormField
                label="Zone ID"
                htmlFor={`ad-zone-${index}`}
              >
                <Input
                  id={`ad-zone-${index}`}
                  value={ad.content.zoneId ?? ""}
                  className="font-mono"
                  onChange={(event) =>
                    updateContent({
                      zoneId: event.target.value,
                    })
                  }
                />
              </FormField>
            </div>
          </AdSummarySection>
        ) : null}

        {ad.format === "smartlink" ? (
          <AdSummarySection
            title="Frequency & Redirect"
            description={t("editor.card.frequency.description")}
            icon={Clock3}
            summary={
              <>
                <SummaryBadge variant="outline">
                  {ad.content.cooldownMinutes ?? 0}m cooldown
                </SummaryBadge>

                <SummaryBadge variant="outline">
                  {ad.content.frequencyWindowHours ?? 24}h window
                </SummaryBadge>
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <FormField
                label={t("editor.card.frequency.redirectDelay")}
                htmlFor={`ad-delay-${index}`}
              >
                <Input
                  id={`ad-delay-${index}`}
                  type="number"
                  min={0}
                  max={300}
                  value={
                    ad.content.redirectDelaySeconds ?? 5
                  }
                  onChange={(event) =>
                    updateContent({
                      redirectDelaySeconds: integerValue(
                        event.target.value,
                      ),
                    })
                  }
                />
              </FormField>

              <FormField
                label={t("editor.card.frequency.capPerSession")}
                htmlFor={`ad-session-cap-${index}`}
              >
                <Input
                  id={`ad-session-cap-${index}`}
                  type="number"
                  min={0}
                  max={20}
                  value={
                    ad.content.maxRedirectsPerSession ?? 0
                  }
                  onChange={(event) =>
                    updateContent({
                      maxRedirectsPerSession: integerValue(
                        event.target.value,
                      ),
                    })
                  }
                />
              </FormField>

              <FormField
                label={t("editor.card.frequency.capPerVisitor")}
                htmlFor={`ad-visitor-cap-${index}`}
              >
                <Input
                  id={`ad-visitor-cap-${index}`}
                  type="number"
                  min={0}
                  max={20}
                  value={
                    ad.content.maxRedirectsPerVisitor ?? 0
                  }
                  onChange={(event) =>
                    updateContent({
                      maxRedirectsPerVisitor: integerValue(
                        event.target.value,
                      ),
                    })
                  }
                />
              </FormField>

              <FormField
                label={t("editor.card.frequency.capWindow")}
                htmlFor={`ad-window-${index}`}
              >
                <Input
                  id={`ad-window-${index}`}
                  type="number"
                  min={1}
                  max={720}
                  value={
                    ad.content.frequencyWindowHours ?? 24
                  }
                  onChange={(event) =>
                    updateContent({
                      frequencyWindowHours: integerValue(
                        event.target.value,
                      ),
                    })
                  }
                />
              </FormField>

              <FormField
                label={t("editor.card.frequency.cooldown")}
                htmlFor={`ad-cooldown-${index}`}
              >
                <Input
                  id={`ad-cooldown-${index}`}
                  type="number"
                  min={0}
                  max={10080}
                  value={
                    ad.content.cooldownMinutes ?? 0
                  }
                  onChange={(event) =>
                    updateContent({
                      cooldownMinutes: integerValue(
                        event.target.value,
                      ),
                    })
                  }
                />
              </FormField>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {t("editor.card.frequency.note")}
            </p>
          </AdSummarySection>
        ) : null}

        {ad.format === "smartlink" ||
        ad.format === "action" ||
        ad.format === "inject_html" ? (
          <AdSummarySection
            title={t("editor.card.schedule.title")}
            description={t("editor.card.schedule.description")}
            icon={CalendarClock}
            summary={
              ad.content.startAt || ad.content.endAt ? (
                <SummaryBadge variant="outline">
                  {t("editor.card.schedule.scheduled")}
                </SummaryBadge>
              ) : (
                <SummaryBadge variant="outline">
                  {t("editor.card.schedule.unlimited")}
                </SummaryBadge>
              )
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                label={t("editor.card.schedule.start")}
                htmlFor={`ad-start-${index}`}
              >
                <Input
                  id={`ad-start-${index}`}
                  type="datetime-local"
                  value={toDateTimeLocal(
                    ad.content.startAt,
                  )}
                  onChange={(event) =>
                    updateContent({
                      startAt: fromDateTimeLocal(
                        event.target.value,
                      ),
                    })
                  }
                />
              </FormField>

              <FormField
                label={t("editor.card.schedule.end")}
                htmlFor={`ad-end-${index}`}
              >
                <Input
                  id={`ad-end-${index}`}
                  type="datetime-local"
                  value={toDateTimeLocal(
                    ad.content.endAt,
                  )}
                  onChange={(event) =>
                    updateContent({
                      endAt: fromDateTimeLocal(
                        event.target.value,
                      ),
                    })
                  }
                />
              </FormField>
            </div>
          </AdSummarySection>
        ) : null}

        <AdSummarySection
          title="Targeting"
          description={t("editor.card.targeting.description")}
          icon={Crosshair}
          summary={
            <SummaryBadge variant={activeTargetingGroups > 0 ? "secondary" : "outline"}>
              {activeTargetingGroups > 0
                ? t("editor.card.targeting.limitedGroups", { count: activeTargetingGroups })
                : t("editor.card.schedule.unlimited")}
            </SummaryBadge>
          }
        >
          <TargetingSection
            ad={ad}
            onChange={onChange}
          />
        </AdSummarySection>
      </div>
    </ConfigItemShell>
  );
}

function AdSummarySection({
  title,
  description,
  icon: Icon,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group overflow-hidden rounded-xl border border-border/60 bg-background transition-[border-color,box-shadow] open:border-border open:shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring group-open:bg-muted/20 [&::-webkit-details-marker]:hidden sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-transparent bg-muted text-muted-foreground transition-colors group-open:border-primary/15 group-open:bg-primary/10 group-open:text-primary">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold leading-none">{title}</h3>
              {summary}
            </div>
            {description ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors group-hover:bg-background/80 group-open:bg-background group-open:shadow-xs">
          <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
        </span>
      </summary>
      <div className="border-t border-border/50 bg-muted/[0.08] px-4 py-4 sm:px-5 sm:py-5">
        {children}
      </div>
    </details>
  );
}

function SummaryBadge({
  children,
  variant = "secondary",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline";
}) {
  return (
    <Badge
      variant={variant}
      className="h-5 rounded-md px-1.5 text-[10px] font-medium"
    >
      {children}
    </Badge>
  );
}

function SmartlinkSection({
  ad,
  index,
  newItemKey,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  ad: MonetizationAd;
  index: number;
  newItemKey: string | null;
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<MonetizationSmartlink>) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
}) {
  const t = useTranslations(NS);
  const smartlinks = ad.content.smartlinks ?? [];
  const enabledCount = smartlinks.filter((item) => item.enabled).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">{t("editor.smartlink.pool")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("editor.smartlink.enabledCount", {
              enabled: enabledCount,
              total: smartlinks.length,
            })}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus /> {t("editor.smartlink.add")}
        </Button>
      </div>

      {smartlinks.length ? (
        <div className="space-y-3">
          {smartlinks.map((smartlink, smartlinkIndex) => (
            <SmartlinkRow
              key={smartlink.id}
              campaign={ad}
              campaignIndex={index}
              smartlink={smartlink}
              index={smartlinkIndex}
              share={estimatedSmartlinkShare(smartlinks, smartlink)}
              isNew={newItemKey === smartlink.id}
              onChange={(patch) => onUpdate(smartlinkIndex, patch)}
              onDelete={() => onDelete(smartlinkIndex)}
              onDuplicate={() => onDuplicate(smartlinkIndex)}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-border/70 bg-muted/[0.08] p-5 text-center">
          <div>
            <Link2 className="mx-auto size-4 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">{t("editor.smartlink.empty.title")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("editor.smartlink.empty.description")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SmartlinkRow({
  campaign,
  campaignIndex,
  smartlink,
  index,
  share,
  isNew,
  onChange,
  onDelete,
  onDuplicate,
}: {
  campaign: MonetizationAd;
  campaignIndex: number;
  smartlink: MonetizationSmartlink;
  index: number;
  share: number;
  isNew: boolean;
  onChange: (patch: Partial<MonetizationSmartlink>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const t = useTranslations(NS);
  const hasOverride = Boolean(smartlink.overrides);
  const { revealedKey: revealedOverride, revealItem: revealOverride } =
    useNewItemReveal();

  const setOverride = (patch: Partial<MonetizationSmartlinkOverrides>) =>
    onChange({ overrides: { ...smartlink.overrides, ...patch } });

  const toggleOverride = () => {
    if (hasOverride) {
      onChange({ overrides: undefined });
      return;
    }
    onChange({ overrides: {} });
    revealOverride("override", `new-smartlink-override-${smartlink.id}`);
  };

  return (
    <ConfigItemShell
      id={`new-smartlink-${smartlink.id}`}
      isNew={isNew}
      compact
    >
      <ConfigItemHeader
        compact
        icon={Link2}
        title={t("editor.smartlink.number", { number: index + 1 })}
        description={<span className="font-mono">{smartlink.id}</span>}
        badges={
          <>
            <SummaryBadge variant="outline">{t("editor.smartlink.trafficShare", { share })}</SummaryBadge>
            {hasOverride ? (
              <SummaryBadge variant="outline">Override</SummaryBadge>
            ) : null}
          </>
        }
        isNew={isNew}
        enabled={smartlink.enabled}
        onEnabledChange={(enabled) => onChange({ enabled })}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        duplicateLabel={t("editor.smartlink.duplicate")}
        deleteLabel={t("editor.smartlink.delete")}
        extraActions={
          <Button
            type="button"
            size="sm"
            variant={hasOverride ? "secondary" : "ghost"}
            className="h-8 px-2.5 text-xs"
            onClick={toggleOverride}
          >
            {hasOverride
              ? t("editor.smartlink.overrideOff")
              : t("editor.smartlink.override")}
          </Button>
        }
      />

      <div className="p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_110px_110px] lg:items-end">
          <FormField
            label="URL"
            htmlFor={`smartlink-url-${campaignIndex}-${index}`}
          >
            <Input
              id={`smartlink-url-${campaignIndex}-${index}`}
              data-new-item-focus
              type="url"
              value={smartlink.url}
              placeholder="https://provider.example/smartlink"
              onChange={(event) => onChange({ url: event.target.value })}
            />
          </FormField>

          <FormField
            label="Weight"
            htmlFor={`smartlink-weight-${campaignIndex}-${index}`}
          >
            <Input
              id={`smartlink-weight-${campaignIndex}-${index}`}
              type="number"
              min={1}
              max={100}
              value={smartlink.weight}
              onChange={(event) =>
                onChange({ weight: integerValue(event.target.value) })
              }
            />
          </FormField>

          <FormField
            label={t("editor.general.sortOrder")}
            htmlFor={`smartlink-order-${campaignIndex}-${index}`}
          >
            <Input
              id={`smartlink-order-${campaignIndex}-${index}`}
              type="number"
              min={0}
              max={10000}
              value={smartlink.sortOrder}
              onChange={(event) =>
                onChange({ sortOrder: integerValue(event.target.value) })
              }
            />
          </FormField>
        </div>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium">
            {t("editor.smartlink.appendParams")}
          </legend>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("editor.smartlink.appendParamsHint")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {smartlinkAppendParams.map((param) => {
              const selected =
                smartlink.appendParams ?? smartlinkAppendParams;
              const checked = selected.includes(param);
              return (
                <label
                  key={param}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    className="size-3.5 accent-primary"
                    checked={checked}
                    onChange={() =>
                      onChange({
                        appendParams: smartlinkAppendParams.filter(
                          (item) =>
                            item === param
                              ? !checked
                              : selected.includes(item),
                        ),
                      })
                    }
                  />
                  <code className="font-mono font-medium">{param}</code>
                </label>
              );
            })}
          </div>
        </fieldset>

        {hasOverride ? (
          <div
            id={`new-smartlink-override-${smartlink.id}`}
            className={`mt-4 grid scroll-m-24 gap-3 rounded-xl border bg-muted/20 p-3 transition-[border-color,background-color,box-shadow] duration-700 sm:grid-cols-2 lg:grid-cols-3 ${
              revealedOverride === "override"
                ? "animate-in border-primary/60 ring-2 ring-primary/20 fade-in-0 slide-in-from-top-2 duration-500 motion-reduce:animate-none"
                : "border-border/60"
            }`}
          >
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-muted-foreground" />
                <p className="text-xs font-medium">{t("editor.smartlink.overrideTitle")}</p>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("editor.smartlink.overrideHint")}
              </p>
            </div>

            <FormField
              label={t("editor.smartlink.delayDefault", {
                seconds: campaign.content.redirectDelaySeconds ?? 5,
              })}
              htmlFor={`sl-delay-${campaignIndex}-${index}`}
            >
              <Input
                id={`sl-delay-${campaignIndex}-${index}`}
                data-new-item-focus
                type="number"
                min={0}
                max={300}
                value={smartlink.overrides?.redirectDelaySeconds ?? ""}
                placeholder={String(campaign.content.redirectDelaySeconds ?? 5)}
                onChange={(event) =>
                  setOverride({
                    redirectDelaySeconds:
                      event.target.value === ""
                        ? undefined
                        : integerValue(event.target.value),
                  })
                }
              />
            </FormField>

            <FormField
              label={t("editor.smartlink.capSession")}
              htmlFor={`sl-session-${campaignIndex}-${index}`}
            >
              <Input
                id={`sl-session-${campaignIndex}-${index}`}
                type="number"
                min={0}
                max={20}
                value={smartlink.overrides?.maxRedirectsPerSession ?? ""}
                placeholder={String(campaign.content.maxRedirectsPerSession ?? 0)}
                onChange={(event) =>
                  setOverride({
                    maxRedirectsPerSession:
                      event.target.value === ""
                        ? undefined
                        : integerValue(event.target.value),
                  })
                }
              />
            </FormField>

            <FormField
              label={t("editor.smartlink.capVisitor")}
              htmlFor={`sl-visitor-${campaignIndex}-${index}`}
            >
              <Input
                id={`sl-visitor-${campaignIndex}-${index}`}
                type="number"
                min={0}
                max={20}
                value={smartlink.overrides?.maxRedirectsPerVisitor ?? ""}
                placeholder={String(campaign.content.maxRedirectsPerVisitor ?? 0)}
                onChange={(event) =>
                  setOverride({
                    maxRedirectsPerVisitor:
                      event.target.value === ""
                        ? undefined
                        : integerValue(event.target.value),
                  })
                }
              />
            </FormField>

            <FormField
              label={t("editor.smartlink.window")}
              htmlFor={`sl-window-${campaignIndex}-${index}`}
            >
              <Input
                id={`sl-window-${campaignIndex}-${index}`}
                type="number"
                min={1}
                max={720}
                value={smartlink.overrides?.frequencyWindowHours ?? ""}
                placeholder={String(campaign.content.frequencyWindowHours ?? 24)}
                onChange={(event) =>
                  setOverride({
                    frequencyWindowHours:
                      event.target.value === ""
                        ? undefined
                        : integerValue(event.target.value),
                  })
                }
              />
            </FormField>

            <FormField
              label={t("editor.card.frequency.cooldown")}
              htmlFor={`sl-cooldown-${campaignIndex}-${index}`}
            >
              <Input
                id={`sl-cooldown-${campaignIndex}-${index}`}
                type="number"
                min={0}
                max={10080}
                value={smartlink.overrides?.cooldownMinutes ?? ""}
                placeholder={String(campaign.content.cooldownMinutes ?? 0)}
                onChange={(event) =>
                  setOverride({
                    cooldownMinutes:
                      event.target.value === ""
                        ? undefined
                        : integerValue(event.target.value),
                  })
                }
              />
            </FormField>

            <FormField
              label={t("editor.card.schedule.start")}
              htmlFor={`sl-start-${campaignIndex}-${index}`}
            >
              <Input
                id={`sl-start-${campaignIndex}-${index}`}
                type="datetime-local"
                value={toDateTimeLocal(smartlink.overrides?.startAt)}
                onChange={(event) =>
                  setOverride({ startAt: fromDateTimeLocal(event.target.value) })
                }
              />
            </FormField>

            <FormField
              label={t("editor.card.schedule.end")}
              htmlFor={`sl-end-${campaignIndex}-${index}`}
            >
              <Input
                id={`sl-end-${campaignIndex}-${index}`}
                type="datetime-local"
                value={toDateTimeLocal(smartlink.overrides?.endAt)}
                onChange={(event) =>
                  setOverride({ endAt: fromDateTimeLocal(event.target.value) })
                }
              />
            </FormField>

          </div>
        ) : null}
      </div>
    </ConfigItemShell>
  );
}

function TargetingSection({ ad, onChange }: { ad: MonetizationAd; onChange: (patch: Partial<MonetizationAd>) => void }) {
  const t = useTranslations(NS);
  const { deviceOptions, browserOptions, operatingSystemOptions } = useEditorOptions();
  const sideLabel = (side: "include" | "exclude", group: string) =>
    t(side === "include" ? "editor.targeting.includeLabel" : "editor.targeting.excludeLabel", {
      group: t(`editor.targeting.groups.${group}.label`).toLowerCase(),
    });
  const activeGroups = countActiveAdTargetingGroups(ad.targeting);
  const exclusions = ad.targeting.exclusions ?? emptyAdTargetingExclusions();
  const countryIncludeId = React.useId();
  const countryExcludeId = React.useId();

  const updateSide = (
    key: keyof MonetizationAdTargetingExclusions,
    side: "include" | "exclude",
    nextValues: Array<string | number>,
  ) => {
    const normalized = [...new Set(nextValues)];
    const conflicts = new Set(
      normalized.map((value) => String(value).toLowerCase()),
    );

    if (side === "include") {
      onChange({
        targeting: {
          ...ad.targeting,
          [key]: normalized,
          exclusions: {
            ...exclusions,
            [key]: exclusions[key].filter(
              (value) => !conflicts.has(String(value).toLowerCase()),
            ),
          },
        } as MonetizationAd["targeting"],
      });
      return;
    }

    const currentIncluded = (ad.targeting[key] as Array<string | number>)
      .filter((value) => !conflicts.has(String(value).toLowerCase()));
    const includeFallback = key === "countries"
      ? ["ALL"]
      : ["devices", "operatingSystems", "browsers"].includes(key)
        ? ["any"]
        : [];

    onChange({
      targeting: {
        ...ad.targeting,
        [key]: currentIncluded.length ? currentIncluded : includeFallback,
        exclusions: { ...exclusions, [key]: normalized },
      } as MonetizationAd["targeting"],
    });
  };

  const specificDeviceOptions = deviceOptions.filter(({ value }) => value !== "any");
  const specificBrowserOptions = browserOptions.filter(({ value }) => value !== "any");
  const specificOperatingSystemOptions = operatingSystemOptions.filter(({ value }) => value !== "any");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-primary/[0.04] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Crosshair className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("editor.targeting.logicTitle")}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("editor.targeting.logicDescription")}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit shrink-0 rounded-md bg-background px-2 py-1 text-[11px] font-medium">
          {t("editor.targeting.activeGroups", { active: activeGroups, total: configurableAdTargetingKeys.length })}
        </Badge>
      </div>

      <TargetingPanel title={t("editor.targeting.panels.device.title")} description={t("editor.targeting.panels.device.description")}>
        <TargetingRow icon={Globe2} label={t("editor.targeting.groups.countries.label")} description={t("editor.targeting.groups.countries.description")}>
          <TargetingSides
            include={<CountryCombobox id={countryIncludeId} multiple value={ad.targeting.countries} onChange={(values) => updateSide("countries", "include", values)} />}
            exclude={<CountryCombobox id={countryExcludeId} multiple allowAll={false} value={exclusions.countries} onChange={(values) => updateSide("countries", "exclude", values)} />}
          />
        </TargetingRow>
        <TargetingRow icon={MonitorSmartphone} label={t("editor.targeting.groups.devices.label")} description={t("editor.targeting.groups.devices.description")}>
          <TargetingSides
            include={<TargetOptionGroup label={sideLabel("include", "devices")} options={deviceOptions} values={ad.targeting.devices} onChange={(values) => updateSide("devices", "include", values)} />}
            exclude={<TargetOptionGroup label={sideLabel("exclude", "devices")} options={specificDeviceOptions} values={exclusions.devices} allowEmpty onChange={(values) => updateSide("devices", "exclude", values)} />}
          />
        </TargetingRow>
        <TargetingRow icon={PanelsTopLeft} label={t("editor.targeting.groups.browsers.label")} description={t("editor.targeting.groups.browsers.description")}>
          <TargetingSides
            include={<TargetOptionGroup label={sideLabel("include", "browsers")} options={browserOptions} values={ad.targeting.browsers} onChange={(values) => updateSide("browsers", "include", values)} />}
            exclude={<TargetOptionGroup label={sideLabel("exclude", "browsers")} options={specificBrowserOptions} values={exclusions.browsers} allowEmpty onChange={(values) => updateSide("browsers", "exclude", values)} />}
          />
        </TargetingRow>
        <TargetingRow icon={Cpu} label={t("editor.targeting.groups.operatingSystems.label")} description={t("editor.targeting.groups.operatingSystems.description")}>
          <TargetingSides
            include={<TargetOptionGroup label={sideLabel("include", "operatingSystems")} options={operatingSystemOptions} values={ad.targeting.operatingSystems} onChange={(values) => updateSide("operatingSystems", "include", values)} />}
            exclude={<TargetOptionGroup label={sideLabel("exclude", "operatingSystems")} options={specificOperatingSystemOptions} values={exclusions.operatingSystems} allowEmpty onChange={(values) => updateSide("operatingSystems", "exclude", values)} />}
          />
        </TargetingRow>
      </TargetingPanel>

    </div>
  );
}

function TargetingPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const t = useTranslations(NS);
  return (
    <section className="overflow-hidden rounded-xl border border-border/60 bg-background">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-3 lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-5">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground lg:hidden">{description}</p>
        </div>
        <div className="hidden grid-cols-2 gap-3 lg:grid">
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
          <p className="text-xs font-medium leading-5 text-destructive/80">{t("editor.targeting.panels.exclusionNote")}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TargetingRow({ icon: Icon, label, description, children }: { icon: React.ElementType; label: string; description: string; children: React.ReactNode }) {
  const labelContent = (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{description}</span>
      </span>
    </>
  );

  return (
    <div className="grid gap-3 border-b border-border/50 px-4 py-4 last:border-b-0 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-start lg:gap-5">
      <div className="flex items-start gap-2.5 lg:pt-6">{labelContent}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function TargetingSides({ include, exclude }: { include: React.ReactNode; exclude: React.ReactNode }) {
  const t = useTranslations(NS);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="min-w-0 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.035] p-3">
        <p className="mb-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">{t("editor.targeting.include")}</p>
        {include}
      </div>
      <div className="min-w-0 rounded-lg border border-destructive/20 bg-destructive/[0.025] p-3">
        <p className="mb-2 text-xs font-medium text-destructive">{t("editor.targeting.exclude")}</p>
        {exclude}
      </div>
    </div>
  );
}

function OptionButtons<T extends string>({ options, values, onChange, className = "" }: { options: Array<{ value: T; label: string }>; values: T[]; onChange: (values: T[]) => void; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => {
        const active = values.includes(option.value);
        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            onClick={() => onChange(active ? values.filter((value) => value !== option.value) : [...values, option.value])}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function TargetOptionGroup<T extends string>({ label, options, values, allowEmpty = false, onChange }: { label: string; options: Array<{ value: T; label: string }>; values: T[]; allowEmpty?: boolean; onChange: (values: T[]) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = values.includes(option.value);
        const toggleOption = () => {
          if (option.value === "any") {
            onChange([option.value]);
            return;
          }
          const specificValues = values.filter((value) => value !== "any");
          const nextValues = active
            ? specificValues.filter((value) => value !== option.value)
            : [...specificValues, option.value];
          onChange(nextValues.length > 0 || allowEmpty ? nextValues : ["any" as T]);
        };
        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={active}
            className={active
              ? "h-8 rounded-lg border-primary/25 bg-primary/10 px-2.5 text-xs text-primary shadow-none hover:bg-primary/15 hover:text-primary"
              : "h-8 rounded-lg px-2.5 text-xs font-normal text-muted-foreground shadow-none"}
            onClick={toggleOption}
          >
            {active ? <CheckCircle2 className="size-3.5" /> : null}
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

const adTargetingKeys: Array<keyof MonetizationAdTargetingExclusions> = [
  "countries",
  "devices",
  "operatingSystems",
  "browsers",
  "niches",
  "postTypes",
  "categoryIds",
];

const configurableAdTargetingKeys = adTargetingKeys.filter(
  (key) => !["niches", "postTypes", "categoryIds"].includes(key),
);

function emptyAdTargetingExclusions(): MonetizationAdTargetingExclusions {
  return {
    countries: [],
    devices: [],
    operatingSystems: [],
    browsers: [],
    niches: [],
    postTypes: [],
    categoryIds: [],
  };
}

function normalizeAdTargeting(
  targeting: MonetizationAd["targeting"],
): MonetizationAd["targeting"] {
  const emptyExclusions = emptyAdTargetingExclusions();
  return {
    countries: [...targeting.countries],
    devices: [...targeting.devices],
    operatingSystems: [...targeting.operatingSystems],
    browsers: [...targeting.browsers],
    niches: ["any"],
    postTypes: [],
    categoryIds: [],
    exclusions: Object.fromEntries(
      adTargetingKeys.map((key) => [
        key,
        ["niches", "postTypes", "categoryIds"].includes(key)
          ? []
          : [...(targeting.exclusions?.[key] ?? emptyExclusions[key])],
      ]),
    ) as MonetizationAdTargetingExclusions,
  };
}

function isUnrestrictedAdTargeting(targeting: MonetizationAd["targeting"]) {
  const exclusions = targeting.exclusions;
  return targeting.countries.includes("ALL") &&
    targeting.devices.includes("any") &&
    targeting.operatingSystems.includes("any") &&
    targeting.browsers.includes("any") &&
    (!exclusions || adTargetingKeys.every((key) => exclusions[key].length === 0));
}

function countActiveAdTargetingGroups(targeting: MonetizationAd["targeting"]) {
  return configurableAdTargetingKeys.filter((key) => {
    const values = targeting[key];
    const hasExclusions = (targeting.exclusions?.[key].length ?? 0) > 0;
    if (hasExclusions) return true;
    if (values.length === 0) return false;
    if (key === "countries") return !(values as string[]).includes("ALL");
    if (["devices", "operatingSystems", "browsers"].includes(key)) {
      return !(values as string[]).includes("any");
    }
    return true;
  }).length;
}

function getActionPositionMode(
  content: MonetizationAd["content"],
): MonetizationActionPositionMode {
  if (content.actionPositionMode) return content.actionPositionMode;

  // Convert legacy numeric positions into the closest supported mode.
  if (content.actionPosition === undefined || content.actionPosition === 0) {
    return "start";
  }
  if (content.actionPosition >= 100) return "end";
  return "middle";
}

function defaultContent(
  kind: NewMonetizationAdKind,
  t: TranslateFn,
): MonetizationAd["content"] {
  if (kind === "inject_html") {
    return { html: "", css: "", javascript: "", height: 250 };
  }
  if (kind === "action") {
    return {
      targetUrl: "https://",
      actionLabel: t("editor.card.action.labelPlaceholder"),
      actionPlatform: "other",
      actionType: "other-visit",
      actionPositionMode: "middle",
      actionCooldownMinutes: 1_440,
      actionCooldownBehavior: "replace",
      actionCooldownScope: "visitor",
      actionDisplayMode: "sequential",
      actionRotationGroup: "sponsor",
    };
  }
  return { smartlinks: [newSmartlink(0)], redirectDelaySeconds: 5, maxRedirectsPerSession: 2, maxRedirectsPerVisitor: 4, frequencyWindowHours: 24, cooldownMinutes: 10 };
}

function newMonetizationAd(
  kind: NewMonetizationAdKind,
  priority: number,
  t: TranslateFn,
): MonetizationAd {
  const format: MonetizationAdFormat =
    kind === "inject_html" ? "inject_html" : kind === "action" ? "action" : "smartlink";
  return {
    id: nextAdId(),
    name:
      kind === "smartlink"
        ? t("editor.ads.newName.smartlink")
        : kind === "popunder"
          ? t("editor.ads.newName.popunder")
          : kind === "action"
            ? t("editor.ads.newName.action")
            : t("editor.ads.newName.injectHtml"),
    enabled: true,
    format,
    placements: defaultAdPlacements(kind),
    priority,
    weight: 100,
    targeting: {
      countries: ["ALL"],
      devices: ["any"],
      operatingSystems: ["any"],
      browsers: ["any"],
      niches: ["any"],
      postTypes: [],
      categoryIds: [],
      exclusions: emptyAdTargetingExclusions(),
    },
    content: defaultContent(kind, t),
  };
}

const smartlinkAppendParams: MonetizationSmartlinkAppendParam[] = [
  "slug",
  "dataUrl",
];

function newSmartlink(sortOrder: number): MonetizationSmartlink {
  return { id: nextSmartlinkId(), url: "https://", enabled: true, weight: 100, sortOrder };
}

function estimatedSmartlinkShare(smartlinks: MonetizationSmartlink[], current: MonetizationSmartlink) {
  if (!current.enabled) return 0;
  const total = smartlinks.filter((item) => item.enabled).reduce((sum, item) => sum + Math.max(1, item.weight), 0);
  return total > 0 ? Math.round(Math.max(1, current.weight) / total * 100) : 0;
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function defaultAdPlacements(kind: NewMonetizationAdKind): MonetizationAdPlacement[] {
  if (kind === "smartlink") return ["unlock_redirect"];
  if (kind === "popunder") return ["popunder"];
  if (kind === "action") return ["action_list"];
  return ["stu_after"];
}

function isSmartlinkPlacement(
  value: string | undefined,
): value is "unlock_redirect" | "popunder" {
  return value === "unlock_redirect" || value === "popunder";
}

function isActionPlacement(value: string | undefined): value is "action_list" {
  return value === "action_list";
}

function isInjectHtmlPlacement(
  value: string | undefined,
): value is "stu_before" | "stu_after" | "safe_overlay_top" | "safe_overlay_bottom" {
  return (
    value === "stu_before" ||
    value === "stu_after" ||
    value === "safe_overlay_top" ||
    value === "safe_overlay_bottom"
  );
}


function RatesFields({ values, setValues }: EditorSectionProps) {
  const t = useTranslations(NS);
  const { revealedKey, revealItem } = useNewItemReveal();
  const hasFallbackRate = values.rates.some(
    (rate) =>
      rate.enabled && rate.countryCode === "ALL" && rate.deviceType === "any",
  );

  const addRate = () => {
    const newIndex = values.rates.length;
    setValues((current) => ({
      ...current,
      rates: [
        ...current.rates,
        {
          countryCode: hasFallbackRate ? "VN" : "ALL",
          deviceType: "any",
          baseCpm: "1.00",
          dailyLimit: null,
          enabled: true,
        },
      ],
    }));
    revealItem(`rate-${newIndex}`, `new-rate-${newIndex}`);
  };

  const updateRate = (index: number, patch: Partial<MonetizationRate>) =>
    setValues((current) => ({
      ...current,
      rates: current.rates.map((rate, rateIndex) =>
        rateIndex === index ? { ...rate, ...patch } : rate,
      ),
    }));

  const removeRate = (index: number) =>
    setValues((current) => ({
      ...current,
      rates: current.rates.filter((_, rateIndex) => rateIndex !== index),
    }));

  return (
    <div className="space-y-5">
      <CollectionSectionHeader
        icon={WalletCards}
        title={t("editor.rates.title")}
        description={t("editor.rates.description")}
        countText={t("editor.rates.count", { count: values.rates.length })}
        actions={
          <Button type="button" size="sm" onClick={addRate}>
            <Plus /> {t("editor.rates.add")}
          </Button>
        }
      />

      <ConfigurationNotice
        healthy={hasFallbackRate || values.rates.length === 0}
        title={
          values.rates.length === 0
            ? t("editor.rates.notice.none")
            : hasFallbackRate
              ? t("editor.rates.notice.hasFallback")
              : t("editor.rates.notice.missingFallback")
        }
        description={
          values.rates.length === 0
            ? t("editor.rates.notice.noneDescription")
            : hasFallbackRate
              ? t("editor.rates.notice.hasFallbackDescription")
              : t("editor.rates.notice.missingFallbackDescription")
        }
      />

      {values.rates.length ? (
        <div className="space-y-3">
          {values.rates.map((rate, index) => {
            const itemKey = `rate-${index}`;
            const isFallback =
              rate.countryCode === "ALL" && rate.deviceType === "any";

            return (
              <ConfigItemShell
                key={itemKey}
                id={`new-rate-${index}`}
                isNew={revealedKey === itemKey}
              >
                <ConfigItemHeader
                  icon={WalletCards}
                  title={t("editor.rates.rateNumber", { number: index + 1 })}
                  description={`${rate.countryCode} · ${densityDeviceLabel(t, rate.deviceType)}`}
                  isNew={revealedKey === itemKey}
                  enabled={rate.enabled}
                  onEnabledChange={(enabled) => updateRate(index, { enabled })}
                  onDelete={() => removeRate(index)}
                  deleteLabel={t("editor.rates.deleteRate", { number: index + 1 })}
                  badges={
                    <>
                      {isFallback ? (
                        <SummaryBadge variant="outline">
                          {t("editor.routes.fallback")}
                        </SummaryBadge>
                      ) : null}
                      <SummaryBadge variant="outline">
                        CPM {rate.baseCpm || "0"}
                      </SummaryBadge>
                      {rate.dailyLimit ? (
                        <SummaryBadge variant="outline">
                          {t("editor.rates.perDay", { count: rate.dailyLimit })}
                        </SummaryBadge>
                      ) : null}
                    </>
                  }
                />

                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
                  <FormField
                    label={t("editor.rates.country")}
                    htmlFor={`rate-country-${index}`}
                  >
                    <CountryCombobox
                      id={`rate-country-${index}`}
                      value={rate.countryCode}
                      onChange={(countryCode) => updateRate(index, { countryCode })}
                    />
                  </FormField>

                  <FormField
                    label={t("editor.rates.device")}
                    htmlFor={`rate-device-${index}`}
                  >
                    <DeviceSelect
                      id={`rate-device-${index}`}
                      value={rate.deviceType}
                      onChange={(deviceType) => updateRate(index, { deviceType })}
                    />
                  </FormField>

                  <FormField label="Base CPM" htmlFor={`rate-cpm-${index}`}>
                    <Input
                      id={`rate-cpm-${index}`}
                      data-new-item-focus
                      inputMode="decimal"
                      value={rate.baseCpm}
                      placeholder="1.50"
                      onChange={(event) =>
                        updateRate(index, { baseCpm: event.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    label={t("editor.rates.dailyLimit")}
                    htmlFor={`rate-limit-${index}`}
                  >
                    <Input
                      id={`rate-limit-${index}`}
                      type="number"
                      min={1}
                      placeholder={t("editor.card.schedule.unlimited")}
                      value={rate.dailyLimit ?? ""}
                      onChange={(event) =>
                        updateRate(index, {
                          dailyLimit: event.target.value
                            ? integerValue(event.target.value)
                            : null,
                        })
                      }
                    />
                  </FormField>
                </div>
              </ConfigItemShell>
            );
          })}
        </div>
      ) : (
        <EmptyConfiguration
          icon={WalletCards}
          title={t("editor.rates.empty.title")}
          description={t("editor.rates.empty.description")}
          actionLabel={t("editor.rates.empty.action")}
          onAction={addRate}
        />
      )}
    </div>
  );
}

function DeviceSelect({
  id,
  value,
  allowAny = true,
  onChange,
}: {
  id: string;
  value: MonetizationDeviceType;
  allowAny?: boolean;
  onChange: (value: MonetizationDeviceType) => void;
}) {
  const { deviceOptions } = useEditorOptions();
  const options = allowAny
    ? deviceOptions
    : deviceOptions.filter((option) => option.value !== "any");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ExperienceField({
  icon: Icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  value: MonetizationAdDensity;
  onChange: (value: MonetizationAdDensity) => void;
}) {
  const { densityOptions } = useEditorOptions();
  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full shrink-0 rounded-lg sm:w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {densityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CollectionSectionHeader({
  icon: Icon,
  title,
  description,
  countText,
  actions,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  countText: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border bg-background text-muted-foreground shadow-xs">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-[-0.01em]">{title}</h3>
            <Badge variant="secondary" className="rounded-md">
              {countText}
            </Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

function ConfigItemShell({
  id,
  isNew = false,
  compact = false,
  children,
}: {
  id?: string;
  isNew?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      id={id}
      className={`scroll-m-24 overflow-hidden border bg-card transition-[border-color,background-color,box-shadow] duration-700 ${
        compact ? "rounded-xl shadow-none" : "rounded-2xl shadow-sm"
      } ${
        isNew
          ? "animate-in border-primary/60 bg-primary/[0.025] ring-2 ring-primary/20 fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
          : "border-border/70"
      }`}
    >
      {children}
    </article>
  );
}

function ConfigItemHeader({
  icon: Icon,
  title,
  description,
  badges,
  isNew = false,
  enabled,
  statusLabel,
  onEnabledChange,
  onDuplicate,
  onDelete,
  duplicateLabel,
  deleteLabel,
  extraActions,
  compact = false,
}: {
  icon: React.ElementType;
  title: React.ReactNode;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  isNew?: boolean;
  enabled: boolean;
  statusLabel?: string;
  onEnabledChange: (enabled: boolean) => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  duplicateLabel?: string;
  deleteLabel?: string;
  extraActions?: React.ReactNode;
  compact?: boolean;
}) {
  const t = useTranslations(NS);
  const tc = useTranslations("Admin.common");
  return (
    <header
      className={`flex flex-col gap-3 border-b border-border/60 bg-muted/10 sm:flex-row sm:items-center sm:justify-between ${
        compact ? "px-3 py-3" : "px-4 py-4 sm:px-5"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`grid shrink-0 place-items-center border bg-background text-muted-foreground shadow-xs ${
            compact ? "size-8 rounded-lg" : "size-10 rounded-xl"
          }`}
        >
          <Icon className={compact ? "size-3.5" : "size-4.5"} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="min-w-0 truncate text-sm font-semibold">{title}</h4>
            <Badge
              variant={enabled ? "default" : "secondary"}
              className="h-5 rounded-md px-1.5 text-[10px] font-medium"
            >
              {statusLabel ??
                (enabled ? t("editor.item.enabledNow") : t("editor.item.disabledNow"))}
            </Badge>
            {badges}
            {isNew ? <NewItemBadge /> : null}
          </div>

          {description ? (
            <div className="mt-1 truncate text-xs text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        {extraActions}
        <div className="flex h-8 items-center gap-2 rounded-lg border bg-background px-2.5">
          <span className="text-[11px] text-muted-foreground">
            {enabled ? tc("enabled") : tc("disabled")}
          </span>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>

        {onDuplicate ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={duplicateLabel ?? t("editor.item.duplicate")}
            onClick={onDuplicate}
          >
            <Copy className="size-4" />
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={deleteLabel ?? tc("delete")}
          onClick={onDelete}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </header>
  );
}

function densityDeviceLabel(t: TranslateFn, value: MonetizationDeviceType) {
  return deviceValues.includes(value) ? t(`options.device.${value}`) : value;
}

function EmptyConfiguration({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="grid min-h-56 place-items-center rounded-lg border border-dashed bg-muted/10 p-6 text-center">
      <div>
        <div className="mx-auto grid size-10 place-items-center rounded-md border bg-background">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-medium">{title}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onAction}
        >
          <Plus /> {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function ConfigurationNotice({
  healthy,
  title,
  description,
}: {
  healthy: boolean;
  title: string;
  description: string;
}) {
  const Icon = healthy ? CheckCircle2 : AlertTriangle;
  return (
    <div
      className={
        healthy
          ? "flex gap-3 rounded-lg border bg-muted/15 px-4 py-3"
          : "flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"
      }
    >
      <Icon
        className={
          healthy
            ? "mt-0.5 size-4 shrink-0 text-emerald-600"
            : "mt-0.5 size-4 shrink-0 text-amber-600"
        }
      />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
      {value}
    </span>
  );
}

function CompletionDot({ complete }: { complete: boolean }) {
  const t = useTranslations(NS);
  return (
    <span
      aria-label={
        complete ? t("editor.item.complete") : t("editor.item.incomplete")
      }
      className={
        complete
          ? "size-1.5 rounded-full bg-emerald-500"
          : "size-1.5 rounded-full bg-amber-500"
      }
    />
  );
}

function EditorStatus({ status }: { status: MonetizationLevelStatus }) {
  const t = useTranslations(NS);
  return (
    <span
      className={
        status === "published"
          ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
      }
    >
      {publicationStatuses.includes(status)
        ? t(`options.status.${status}`)
        : status}
    </span>
  );
}

type EditorSectionProps = {
  values: AdminMonetizationLevelPayload;
  setValues: React.Dispatch<
    React.SetStateAction<AdminMonetizationLevelPayload>
  >;
};

function initialValues(
  level: AdminMonetizationLevel | null,
  duplicate: boolean,
  t: TranslateFn,
): AdminMonetizationLevelPayload {
  if (level) {
    const translations = level.translations.map((translation) => ({
      ...translation,
    }));
    for (const locale of ["vi", "en"]) {
      if (!translations.some((translation) => translation.locale === locale)) {
        translations.push({ locale, name: "", description: "" });
      }
    }
    return {
      key: duplicate
        ? `${level.key.slice(0, 44).replace(/-+$/, "")}-copy`
        : level.key,
      status: duplicate ? "draft" : level.status,
      isDefault: duplicate ? false : level.isDefault,
      sortOrder: duplicate ? level.sortOrder + 1 : level.sortOrder,
      translations,
      routes: level.routes.map((route) => ({
        id: route.id,
        enabled: route.enabled,
        targetUrl: route.targetUrl,
        priority: route.priority,
        weight: route.weight,
        targeting: normalizeRouteTargeting(route),
      })),
      rates: level.rates.map((rate) => ({ ...rate })),
      ads: structuredClone(level.ads ?? []).map((ad) => {
        const normalizedSmartlinks = ad.format === "smartlink"
          ? (ad.content.smartlinks ?? (ad.content.targetUrl
            ? [{ id: nextSmartlinkId(), url: ad.content.targetUrl, enabled: true, weight: ad.weight, sortOrder: 0 }]
            : [])).map((smartlink, index) => ({
              ...smartlink,
              sortOrder: smartlink.sortOrder ?? index * 10,
            }))
          : undefined;
        const content = { ...ad.content };
        if (ad.format === "smartlink") delete content.targetUrl;
        if (ad.format === "action") delete content.actionPosition;
        return {
          ...ad,
          placements:
            ad.format === "smartlink"
              ? [ad.placements.find(isSmartlinkPlacement) ?? "unlock_redirect"]
              : ad.format === "action"
                ? ["action_list"]
                : (ad.placements.filter(
                  (placement) =>
                    !isSmartlinkPlacement(placement) &&
                    !isActionPlacement(placement),
                ).length
                  ? ad.placements.filter(
                    (placement) =>
                      !isSmartlinkPlacement(placement) &&
                      !isActionPlacement(placement),
                  )
                  : ["safe_overlay_top"]),
          targeting: normalizeAdTargeting(ad.targeting),
          content: {
            ...content,
            ...(ad.format === "smartlink"
              ? {
                smartlinks: normalizedSmartlinks,
                redirectDelaySeconds: ad.content.redirectDelaySeconds ?? 5,
                maxRedirectsPerSession: ad.content.maxRedirectsPerSession ?? 0,
                maxRedirectsPerVisitor: ad.content.maxRedirectsPerVisitor ?? 0,
                frequencyWindowHours: ad.content.frequencyWindowHours ?? 24,
                cooldownMinutes: ad.content.cooldownMinutes ?? 0,
              }
              : ad.format === "action"
                ? {
                  targetUrl: ad.content.targetUrl ?? "https://",
                  actionLabel:
                    ad.content.actionLabel ?? t("editor.card.action.labelPlaceholder"),
                  actionPlatform: ad.content.actionPlatform ?? "other",
                  actionType: ad.content.actionType ?? "other-visit",
                  actionPositionMode: getActionPositionMode(ad.content),
                  actionCooldownMinutes: ad.content.actionCooldownMinutes ?? 0,
                  actionCooldownBehavior:
                    ad.content.actionCooldownBehavior ?? "replace",
                  actionCooldownScope:
                    ad.content.actionCooldownScope ?? "visitor",
                  actionDisplayMode:
                    ad.content.actionDisplayMode ?? "sequential",
                  actionRotationGroup:
                    ad.content.actionRotationGroup ?? undefined,
                }
                : ad.format === "inject_html"
                  ? {
                    html: ad.content.html ?? "",
                    css: ad.content.css ?? "",
                    javascript: ad.content.javascript ?? "",
                    height: ad.content.height ?? 250,
                  }
                : {}),
          },
        };
      }),
      metaData: structuredClone(level.metaData),
    };
  }
  return {
    key: "",
    status: "draft",
    isDefault: false,
    sortOrder: 0,
    translations: [
      { locale: "vi", name: "", description: "" },
      { locale: "en", name: "", description: "" },
    ],
    routes: [],
    rates: [],
    ads: [],
    metaData: {
      version: 1,
      profitBps: 100,
      stepCount: 1,
      visitorExperience: {
        popup: "limited",
        banner: "none",
        interstitial: "none",
        notification: "none",
      },
    },
  };
}

function validate(
  values: AdminMonetizationLevelPayload,
  languages: Language[],
  t: TranslateFn,
) {
  if (!/^[a-z][a-z0-9-]{1,49}$/.test(values.key)) {
    return {
      tab: "general",
      message:
        t("validation.keyFormat"),
    };
  }
  if (values.isDefault && values.status !== "published") {
    return {
      tab: "general",
      message: t("validation.defaultMustPublish"),
    };
  }
  if (values.metaData.profitBps < 0 || values.metaData.profitBps > 10_000) {
    return { tab: "general", message: t("validation.profitRange") };
  }
  if (values.metaData.stepCount < 1 || values.metaData.stepCount > 20) {
    return { tab: "show", message: t("validation.pageCountRange") };
  }
  for (const language of languages.filter(({ isDefault }) => isDefault)) {
    const locale = language.locale;
    if (
      !values.translations.find((item) => item.locale === locale)?.name.trim()
    ) {
      return {
        tab: "general",
        locale,
        message: t("validation.displayNameRequired", { language: language.nativeName || language.name }),
      };
    }
  }
  const routeIds = values.routes.map((route) => route.id);
  if (new Set(routeIds).size !== routeIds.length) {
    return { tab: "routes", message: t("validation.routeIdDuplicate") };
  }
  for (const route of values.routes) {
    const countries = [...route.targeting.countries.include, ...route.targeting.countries.exclude];
    if (countries.some((code) => !/^[A-Z]{2}$/.test(code))) {
      return { tab: "routes", message: t("validation.routeCountryInvalid") };
    }
    if (!/^https?:\/\/.+/i.test(route.targetUrl)) {
      return {
        tab: "routes",
        message: t("validation.routeUrlInvalid", { id: route.id }),
      };
    }
  }
  const rateKeys = values.rates.map(
    (rate) => `${rate.countryCode}:${rate.deviceType}`,
  );
  if (new Set(rateKeys).size !== rateKeys.length) {
    return {
      tab: "rates",
      message: t("validation.rateDuplicate"),
    };
  }
  for (const rate of values.rates) {
    if (!/^(?:[A-Z]{2}|ALL|ZZ)$/.test(rate.countryCode)) {
      return {
        tab: "rates",
        message: t("validation.rateCountryInvalid", { code: rate.countryCode }),
      };
    }
    if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,6})?$/.test(rate.baseCpm)) {
      return {
        tab: "rates",
        message: t("validation.rateCpmInvalid", { cpm: rate.baseCpm }),
      };
    }
    if (rate.enabled && Number(rate.baseCpm) <= 0) {
      return {
        tab: "rates",
        message: t("validation.rateCpmPositive"),
      };
    }
  }
  const adIds = values.ads.map((ad) => ad.id);
  if (new Set(adIds).size !== adIds.length) {
    return { tab: "ads", message: t("validation.adIdDuplicate") };
  }
  const smartlinkIds = values.ads.flatMap((ad) => ad.content.smartlinks?.map((smartlink) => smartlink.id) ?? []);
  const deliveryIds = [...adIds, ...smartlinkIds];
  if (new Set(deliveryIds).size !== deliveryIds.length) {
    return { tab: "ads", message: t("validation.adSmartlinkIdDuplicate") };
  }
  for (const ad of values.ads) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(ad.id)) {
      return { tab: "ads", message: t("validation.adIdInvalid", { id: ad.id }) };
    }
    if (!ad.name.trim() || ad.placements.length === 0) {
      return { tab: "ads", message: t("validation.adNameAndPlacement", { id: ad.id }) };
    }
    if (ad.priority < 0 || ad.priority > 10_000 || ad.weight < 1 || ad.weight > 100) {
      return { tab: "ads", message: t("validation.adPriorityWeight", { id: ad.id }) };
    }
    if (ad.targeting.countries.some((country) => !/^(?:[A-Z]{2}|ALL|ZZ)$/.test(country))) {
      return { tab: "ads", message: t("validation.adCountryInvalid", { id: ad.id }) };
    }
    if (ad.targeting.exclusions?.countries.some((country) => !/^[A-Z]{2}$/.test(country))) {
      return { tab: "ads", message: t("validation.adExcludedCountryInvalid", { id: ad.id }) };
    }
    if (ad.format === "smartlink" && (ad.placements.length !== 1 || !isSmartlinkPlacement(ad.placements[0]))) {
      return { tab: "ads", message: t("validation.smartlinkPlacement", { id: ad.id }) };
    }
    if (ad.format === "smartlink" && !ad.content.smartlinks?.length) {
      return { tab: "ads", message: t("validation.smartlinkNeedsLink", { id: ad.id }) };
    }
    if (ad.format === "action" && (ad.placements.length !== 1 || ad.placements[0] !== "action_list")) {
      return { tab: "ads", message: t("validation.actionPlacement", { id: ad.id }) };
    }
    if (ad.format === "action" && (!/^https?:\/\/.+/i.test(ad.content.targetUrl ?? "") || !ad.content.actionLabel?.trim())) {
      return { tab: "ads", message: t("validation.actionLinkLabel", { id: ad.id }) };
    }
    if (ad.format === "action" && (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(ad.content.actionPlatform ?? "") || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(ad.content.actionType ?? ""))) {
      return { tab: "ads", message: t("validation.actionPlatformKey", { id: ad.id }) };
    }
    if (ad.format === "action" && !actionPositionModeValues.includes(getActionPositionMode(ad.content))) {
      return { tab: "ads", message: t("validation.actionPosition", { id: ad.id }) };
    }
    if (ad.format === "action" && ((ad.content.actionCooldownMinutes ?? 0) < 0 || (ad.content.actionCooldownMinutes ?? 0) > 525_600)) {
      return { tab: "ads", message: t("validation.actionHideRange", { id: ad.id }) };
    }
    if (ad.format === "action" && !actionCooldownBehaviorValues.includes(ad.content.actionCooldownBehavior ?? "replace")) {
      return { tab: "ads", message: t("validation.actionCooldownBehavior", { id: ad.id }) };
    }
    if (ad.format === "action" && !actionCooldownScopeValues.includes(ad.content.actionCooldownScope ?? "visitor")) {
      return { tab: "ads", message: t("validation.actionCooldownScope", { id: ad.id }) };
    }
    if (ad.format === "action" && !actionDisplayModeValues.includes(ad.content.actionDisplayMode ?? "sequential")) {
      return { tab: "ads", message: t("validation.actionDisplayMode", { id: ad.id }) };
    }
    if (ad.format === "action" && ad.content.actionRotationGroup && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(ad.content.actionRotationGroup)) {
      return { tab: "ads", message: t("validation.actionRotationGroup", { id: ad.id }) };
    }
    if (ad.format === "inject_html" && ad.placements.some((placement) => !isInjectHtmlPlacement(placement))) {
      return { tab: "ads", message: t("validation.injectPlacement", { id: ad.id }) };
    }
    if (ad.format === "inject_html" && !ad.content.html?.trim() && !ad.content.css?.trim() && !ad.content.javascript?.trim()) {
      return { tab: "ads", message: t("validation.injectContent", { id: ad.id }) };
    }
    if (ad.format === "inject_html" && ((ad.content.height ?? 250) < 40 || (ad.content.height ?? 250) > 2_000)) {
      return { tab: "ads", message: t("validation.injectHeight", { id: ad.id }) };
    }
    for (const smartlink of ad.format === "smartlink" ? ad.content.smartlinks ?? [] : []) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(smartlink.id)) {
        return { tab: "ads", message: t("validation.smartlinkIdInvalid", { id: smartlink.id }) };
      }
      if (!/^https?:\/\/.+/i.test(smartlink.url)) {
        return { tab: "ads", message: t("validation.smartlinkUrlInvalid", { id: smartlink.id }) };
      }
      if (smartlink.weight < 1 || smartlink.weight > 100 || smartlink.sortOrder < 0 || smartlink.sortOrder > 10_000) {
        return { tab: "ads", message: t("validation.smartlinkWeightOrder", { id: smartlink.id }) };
      }
      const override = smartlink.overrides;
      if (override && ((override.redirectDelaySeconds ?? 0) < 0 || (override.redirectDelaySeconds ?? 0) > 300 || (override.maxRedirectsPerSession ?? 0) < 0 || (override.maxRedirectsPerSession ?? 0) > 20 || (override.maxRedirectsPerVisitor ?? 0) < 0 || (override.maxRedirectsPerVisitor ?? 0) > 20)) {
        return { tab: "ads", message: t("validation.smartlinkOverrideLimit", { id: smartlink.id }) };
      }
      if (override && ((override.frequencyWindowHours ?? 24) < 1 || (override.frequencyWindowHours ?? 24) > 720 || (override.cooldownMinutes ?? 0) < 0 || (override.cooldownMinutes ?? 0) > 10_080)) {
        return { tab: "ads", message: t("validation.smartlinkOverrideWindow", { id: smartlink.id }) };
      }
      if (override?.startAt && override.endAt && Date.parse(override.endAt) <= Date.parse(override.startAt)) {
        return { tab: "ads", message: t("validation.smartlinkOverrideSchedule", { id: smartlink.id }) };
      }
    }
    if (ad.format === "smartlink" && ((ad.content.redirectDelaySeconds ?? 5) < 0 || (ad.content.redirectDelaySeconds ?? 5) > 300)) {
      return { tab: "ads", message: t("validation.smartlinkDelayRange", { id: ad.id }) };
    }
    if (ad.format === "smartlink" && ((ad.content.maxRedirectsPerSession ?? 0) < 0 || (ad.content.maxRedirectsPerSession ?? 0) > 20 || (ad.content.maxRedirectsPerVisitor ?? 0) < 0 || (ad.content.maxRedirectsPerVisitor ?? 0) > 20)) {
      return { tab: "ads", message: t("validation.smartlinkCapRange", { id: ad.id }) };
    }
    if (ad.format === "smartlink" && ((ad.content.frequencyWindowHours ?? 24) < 1 || (ad.content.frequencyWindowHours ?? 24) > 720 || (ad.content.cooldownMinutes ?? 0) < 0 || (ad.content.cooldownMinutes ?? 0) > 10_080)) {
      return { tab: "ads", message: t("validation.smartlinkWindowCooldown", { id: ad.id }) };
    }
    if ((ad.format === "smartlink" || ad.format === "action" || ad.format === "inject_html") && ad.content.startAt && ad.content.endAt && Date.parse(ad.content.endAt) <= Date.parse(ad.content.startAt)) {
      return { tab: "ads", message: t("validation.adScheduleOrder", { id: ad.id }) };
    }
    if (ad.format !== "smartlink" && ad.placements.some(isSmartlinkPlacement)) {
      return { tab: "ads", message: t("validation.smartlinkPlacementOnly") };
    }
    if (ad.format !== "action" && ad.placements.some(isActionPlacement)) {
      return { tab: "ads", message: t("validation.actionPlacementOnly") };
    }
    if (ad.format === "banner" && (!/^https?:\/\/.+/i.test(ad.content.imageUrl ?? "") || !/^https?:\/\/.+/i.test(ad.content.clickUrl ?? ""))) {
      return { tab: "ads", message: t("validation.bannerUrls", { id: ad.id }) };
    }
    if (ad.format === "script" && (!ad.content.adapter || !/^https?:\/\/.+/i.test(ad.content.scriptUrl ?? ""))) {
      return { tab: "ads", message: t("validation.scriptAdapter", { id: ad.id }) };
    }
  }
  return null;
}

function hasTranslation(values: AdminMonetizationLevelPayload, locale: string) {
  return Boolean(
    values.translations
      .find((translation) => translation.locale === locale)
      ?.name.trim(),
  );
}

function densityLabel(t: TranslateFn, value: MonetizationAdDensity) {
  return densityValues.includes(value) ? t(`options.density.${value}`) : value;
}

function updateExperience(
  setValues: EditorSectionProps["setValues"],
  patch: Partial<
    AdminMonetizationLevelPayload["metaData"]["visitorExperience"]
  >,
) {
  setValues((current) => ({
    ...current,
    metaData: {
      ...current.metaData,
      visitorExperience: {
        ...current.metaData.visitorExperience,
        ...patch,
      },
    },
  }));
}

function integerValue(value: string) {
  const parsed = Number.parseInt(value || "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function useNewItemReveal() {
  const [revealedKey, setRevealedKey] = React.useState<string | null>(null);
  const clearTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    },
    [],
  );

  const revealItem = React.useCallback((key: string, containerId: string) => {
    setRevealedKey(key);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    window.setTimeout(() => {
      const container = document.getElementById(containerId);
      if (!container) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      container.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      const focusTarget = container.querySelector<HTMLElement>(
        "[data-new-item-focus]",
      );
      focusTarget?.focus({ preventScroll: true });
      if (focusTarget instanceof HTMLInputElement) focusTarget.select();
    }, 0);

    clearTimerRef.current = setTimeout(() => {
      setRevealedKey((current) => (current === key ? null : current));
    }, 1_800);
  }, []);

  return { revealedKey, revealItem };
}

function revealItemClassName(active: boolean) {
  return active
    ? "scroll-m-24 animate-in border-primary/60 bg-primary/[0.035] ring-2 ring-primary/20 fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
    : "border-border/60 bg-background/40";
}

function NewItemBadge() {
  const t = useTranslations(NS);
  return (
    <Badge className="gap-1 rounded-md bg-primary/10 text-primary hover:bg-primary/10">
      <Sparkles className="size-3" /> {t("editor.item.justAdded")}
    </Badge>
  );
}

function splitActionCounts(actionCount: number, requestedPageCount: number) {
  const pages = Math.max(1, Math.min(requestedPageCount, Math.max(1, actionCount)));
  const baseSize = Math.floor(actionCount / pages);
  const remainder = actionCount % pages;
  return Array.from({ length: pages }, (_, index) => baseSize + (index < remainder ? 1 : 0));
}

function nextRouteId() {
  return `route-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now()}`;
}

function nextAdId() {
  return `ad-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now()}`;
}

function nextSmartlinkId() {
  return `sl-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now()}`;
}
