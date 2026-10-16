"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Gift,
  Languages,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PublicationStatusCard } from "@/components/admin/publication-status-card";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  createLoyaltyTier,
  updateLoyaltyTier,
} from "@/features/admin-loyalty-tiers/api/loyalty-tiers.client";
import { LoyaltyTierIcon } from "@/features/admin-loyalty-tiers/components/loyalty-tier-icon";
import type {
  AdminLoyaltyBenefit,
  AdminLoyaltyTier,
  AdminLoyaltyTierPayload,
  AdminLoyaltyTierPerks,
  LoyaltySupportPriority,
  LoyaltyTierIconKey,
} from "@/features/admin-loyalty-tiers/types";
import { getAdminLanguages } from "@/features/languages/api/languages.client";
import type { Language } from "@/features/languages/types";
import type { PublicationStatus } from "@/types/publication-status";

type Translator = ReturnType<typeof useTranslations>;

const iconOptions: Array<{ value: LoyaltyTierIconKey; labelKey: string }> = [
  { value: "sparkles", labelKey: "editor.icons.sparkles" },
  { value: "shield-check", labelKey: "editor.icons.shieldCheck" },
  { value: "trophy", labelKey: "editor.icons.trophy" },
  { value: "gem", labelKey: "editor.icons.gem" },
];

const fallbackLanguages: Language[] = [
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
];

export function LoyaltyTierEditor({
  tier,
  template,
}: {
  tier: AdminLoyaltyTier | null;
  template?: AdminLoyaltyTier;
}) {
  const t = useTranslations("Admin.loyaltyTiers");
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const initialPayload = React.useMemo(
    () => initialValues(tier ?? template ?? null, Boolean(template)),
    [template, tier],
  );
  const [baseline] = React.useState(() => comparisonValue(initialPayload));
  const [values, setValues] =
    React.useState<AdminLoyaltyTierPayload>(initialPayload);
  const [languages, setLanguages] = React.useState(fallbackLanguages);
  const [activeTab, setActiveTab] = React.useState("general");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const mode = tier ? "update" : template ? "duplicate" : "create";
  const hasChanges = comparisonValue(values) !== baseline;

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
        if (!relevant.length) return;
        setLanguages(relevant);
        setValues((current) => ensureTranslations(current, relevant));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [initialPayload.translations]);

  React.useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges || saving) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasChanges, saving]);

  function leaveEditor() {
    router.push("/admin/loyalty");
  }

  function requestClose() {
    if (saving) return;
    if (hasChanges) setDiscardOpen(true);
    else leaveEditor();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate(values, languages, t);
    if (validationError) {
      setError(validationError.message);
      setActiveTab(validationError.tab);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...values,
        translations: values.translations.filter(({ name }) => name.trim()),
      };
      if (tier) {
        await updateLoyaltyTier(tier.id, payload);
        toast.success(t("editor.updated"));
      } else {
        await createLoyaltyTier(payload);
        toast.success(
          mode === "duplicate" ? t("editor.duplicated") : t("editor.created"),
        );
      }
      router.push("/admin/loyalty");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t("editor.saveError"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-6"
      >
        <AdminPageHeader
          title={
            mode === "update"
              ? t("editor.titleEdit")
              : mode === "duplicate"
                ? t("editor.titleDuplicate")
                : t("editor.titleCreate")
          }
          description={t("editor.pageDescription")}
          leading={
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("editor.backToList")}
              onClick={requestClose}
            >
              <ArrowLeft />
            </Button>
          }
          meta={<EditorStatus status={values.status} />}
          actions={
            <>
              <Button type="button" variant="outline" disabled={saving} onClick={requestClose}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={saving || (mode === "update" && !hasChanges)}>
                <Save /> {saving ? tc("saving") : mode === "update" ? tc("saveChanges") : t("editor.createTier")}
              </Button>
            </>
          }
        />

        <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
          <Tabs
            value={activeTab}
            onValueChange={(tab) => {
              setActiveTab(tab);
              setError("");
            }}
            className="min-w-0 gap-0"
          >
            <div className="overflow-x-auto border-b px-4 sm:px-6">
              <TabsList variant="line" className="h-12 min-w-max justify-start bg-transparent p-0">
                <TabsTrigger value="general"><Settings2 /> {t("editor.generalTab")}</TabsTrigger>
                <TabsTrigger value="perks"><Gift /> {t("editor.perksTab")}</TabsTrigger>
                {languages.map((language) => (
                  <TabsTrigger key={language.id} value={language.locale}>
                    <Languages /> {language.nativeName || language.name}
                    <CompletionDot complete={hasTranslation(values, language.locale)} />
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-6">
              <TabsContent value="general" className="mt-0">
                <GeneralFields values={values} setValues={setValues} />
              </TabsContent>
              <TabsContent value="perks" className="mt-0">
                <PerksFields values={values} setValues={setValues} />
              </TabsContent>
              {languages.map((language) => (
                <TabsContent key={language.id} value={language.locale} className="mt-0">
                  <TranslationFields
                    locale={language.locale}
                    languageName={language.nativeName || language.name}
                    values={values}
                    setValues={setValues}
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>

          <div className="sticky bottom-0 z-10 flex min-h-14 items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
            {error ? (
              <div role="alert" className="flex min-w-0 items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {hasChanges ? t("editor.unsaved") : t("editor.synced")}
              </p>
            )}
          </div>
        </div>
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

type EditorProps = {
  values: AdminLoyaltyTierPayload;
  setValues: React.Dispatch<React.SetStateAction<AdminLoyaltyTierPayload>>;
};

function GeneralFields({ values, setValues }: EditorProps) {
  const t = useTranslations("Admin.loyaltyTiers");
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="space-y-6">
        <SectionHeader
          title={t("general.title")}
          description={t("general.description")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("general.key")} htmlFor="loyalty-key">
            <Input
              id="loyalty-key"
              maxLength={50}
              value={values.key}
              placeholder="gold"
              onChange={(event) =>
                setValues((current) => ({ ...current, key: event.target.value.toLowerCase() }))
              }
            />
          </FormField>
          <FormField label={t("general.threshold")} htmlFor="loyalty-threshold">
            <Input
              id="loyalty-threshold"
              type="number"
              min={0}
              max={2_147_483_647}
              value={values.minimumValidViews}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  minimumValidViews: integerValue(event.target.value),
                }))
              }
            />
          </FormField>
          <FormField label={t("general.sortOrder")} htmlFor="loyalty-sort-order">
            <Input
              id="loyalty-sort-order"
              type="number"
              min={0}
              max={10_000}
              value={values.sortOrder}
              onChange={(event) =>
                setValues((current) => ({ ...current, sortOrder: integerValue(event.target.value) }))
              }
            />
          </FormField>
          <FormField label={t("general.icon")} htmlFor="loyalty-icon">
            <Select
              value={values.iconKey ?? "sparkles"}
              onValueChange={(iconKey: LoyaltyTierIconKey) =>
                setValues((current) => ({ ...current, iconKey }))
              }
            >
              <SelectTrigger id="loyalty-icon" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <LoyaltyTierIcon iconKey={option.value} className="size-4" /> {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <Card className="gap-0 py-0 shadow-none">
          <CardHeader className="border-b px-5 py-4">
            <h3 className="font-semibold">{t("general.rulesTitle")}</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("general.rulesDescription")}
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
            <div className="flex gap-2"><Check className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400" /> {t("general.ruleCheck")}</div>
            <div className="flex gap-2"><X className="mt-0.5 size-4 text-muted-foreground" /> {t("general.ruleCross")}</div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <PublicationStatusCard
          id="loyalty-status"
          status={values.status}
          onStatusChange={(status: PublicationStatus) =>
            setValues((current) => ({ ...current, status }))
          }
        />
        <TierPreview values={values} />
      </aside>
    </div>
  );
}

function TranslationFields({
  locale,
  languageName,
  values,
  setValues,
}: EditorProps & { locale: string; languageName: string }) {
  const t = useTranslations("Admin.loyaltyTiers");
  const tc = useTranslations("Admin.common");
  const translation = values.translations.find((item) => item.locale === locale) ?? {
    locale,
    name: "",
    description: "",
    benefits: [],
  };
  const updateTranslation = (patch: Partial<typeof translation>) =>
    setValues((current) => ({
      ...current,
      translations: current.translations.map((item) =>
        item.locale === locale ? { ...item, ...patch } : item,
      ),
    }));
  const addBenefit = () =>
    setValues((current) => {
      const count = current.translations[0]?.benefits.length ?? 0;
      const used = new Set(current.translations.flatMap((item) => item.benefits.map(({ key }) => key)));
      let index = count + 1;
      while (used.has(`benefit_${index}`)) index += 1;
      const key = `benefit_${index}`;
      return {
        ...current,
        translations: current.translations.map((item) => ({
          ...item,
          benefits: [...item.benefits, { key, label: "", included: true, value: null }],
        })),
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          title={t("translation.title", { language: languageName })}
          description={t("translation.description")}
        />
        <Button type="button" size="sm" onClick={addBenefit}><Plus /> {t("translation.addBenefit")}</Button>
      </div>
      <div className="grid gap-4">
        <FormField label={t("translation.displayName")} htmlFor={`loyalty-name-${locale}`}>
          <Input
            id={`loyalty-name-${locale}`}
            maxLength={100}
            value={translation.name}
            placeholder={t("translation.namePlaceholder", { language: languageName })}
            onChange={(event) => updateTranslation({ name: event.target.value })}
          />
        </FormField>
        <FormField label={tc("description")} htmlFor={`loyalty-description-${locale}`}>
          <Textarea
            id={`loyalty-description-${locale}`}
            rows={4}
            maxLength={500}
            value={translation.description ?? ""}
            placeholder={t("translation.descriptionPlaceholder", { language: languageName })}
            onChange={(event) => updateTranslation({ description: event.target.value })}
          />
        </FormField>
      </div>

      <section className="space-y-4 border-t pt-6">
        <SectionHeader
          title={t("translation.benefitsTitle")}
          description={t("translation.benefitsDescription")}
        />
        {translation.benefits.length ? (
          <div className="space-y-3">
            {translation.benefits.map((benefit, index) => (
              <BenefitEditor
                key={`${benefit.key}-${index}`}
                benefit={benefit}
                index={index}
                locale={locale}
                count={translation.benefits.length}
                setValues={setValues}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-5 py-8 text-center">
            <p className="font-medium">{t("translation.noBenefits")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("translation.noBenefitsHint")}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function BenefitEditor({
  benefit,
  index,
  locale,
  count,
  setValues,
}: {
  benefit: AdminLoyaltyBenefit;
  index: number;
  locale: string;
  count: number;
  setValues: EditorProps["setValues"];
}) {
  const t = useTranslations("Admin.loyaltyTiers");
  const updateLocalized = (patch: Partial<Pick<AdminLoyaltyBenefit, "label" | "value">>) =>
    setValues((current) => ({
      ...current,
      translations: current.translations.map((translation) => ({
        ...translation,
        benefits: translation.benefits.map((item, itemIndex) =>
          translation.locale === locale && itemIndex === index ? { ...item, ...patch } : item,
        ),
      })),
    }));
  const updateShared = (patch: Partial<Pick<AdminLoyaltyBenefit, "key" | "included">>) =>
    setValues((current) => ({
      ...current,
      translations: current.translations.map((translation) => ({
        ...translation,
        benefits: translation.benefits.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item,
        ),
      })),
    }));
  const remove = () =>
    setValues((current) => ({
      ...current,
      translations: current.translations.map((translation) => ({
        ...translation,
        benefits: translation.benefits.filter((_, itemIndex) => itemIndex !== index),
      })),
    }));
  const move = (direction: -1 | 1) =>
    setValues((current) => ({
      ...current,
      translations: current.translations.map((translation) => {
        const benefits = [...translation.benefits];
        const target = index + direction;
        if (!benefits[index] || !benefits[target]) return translation;
        [benefits[index], benefits[target]] = [benefits[target], benefits[index]];
        return { ...translation, benefits };
      }),
    }));

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(10rem,0.8fr)_minmax(12rem,1fr)_minmax(8rem,0.7fr)_auto]">
        <FormField label={t("benefit.sharedKey")} htmlFor={`benefit-key-${locale}-${index}`}>
          <Input
            id={`benefit-key-${locale}-${index}`}
            value={benefit.key}
            maxLength={64}
            onChange={(event) => updateShared({ key: event.target.value.toLowerCase() })}
          />
        </FormField>
        <FormField label={t("benefit.label")} htmlFor={`benefit-label-${locale}-${index}`}>
          <Input
            id={`benefit-label-${locale}-${index}`}
            value={benefit.label}
            maxLength={160}
            placeholder={t("benefit.labelPlaceholder")}
            onChange={(event) => updateLocalized({ label: event.target.value })}
          />
        </FormField>
        <FormField label={t("benefit.value")} htmlFor={`benefit-value-${locale}-${index}`}>
          <Input
            id={`benefit-value-${locale}-${index}`}
            value={benefit.value ?? ""}
            maxLength={100}
            placeholder={t("benefit.valuePlaceholder")}
            onChange={(event) => updateLocalized({ value: event.target.value || null })}
          />
        </FormField>
        <div className="flex items-end justify-between gap-2 lg:justify-end">
          <div className="flex h-9 items-center gap-2 rounded-md border px-3">
            {benefit.included ? (
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <X className="size-4 text-muted-foreground" />
            )}
            <Switch
              checked={benefit.included}
              aria-label={t("benefit.includedAria", { name: benefit.label || benefit.key })}
              onCheckedChange={(included) => updateShared({ included })}
            />
          </div>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" disabled={index === 0} aria-label={t("benefit.moveUp")} onClick={() => move(-1)}><ArrowUp /></Button>
            <Button type="button" variant="ghost" size="icon" disabled={index === count - 1} aria-label={t("benefit.moveDown")} onClick={() => move(1)}><ArrowDown /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label={t("benefit.remove")} onClick={remove}><Trash2 /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TierPreview({ values }: { values: AdminLoyaltyTierPayload }) {
  const t = useTranslations("Admin.loyaltyTiers");
  const locale = useLocale();
  const translation =
    values.translations.find(({ locale }) => locale === "vi") ?? values.translations[0];
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b px-5 py-4">
        <p className="text-sm font-medium text-muted-foreground">{t("preview.title")}</p>
      </CardHeader>
      <CardContent className="px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <LoyaltyTierIcon iconKey={values.iconKey} className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{translation?.name || t("preview.tierName")}</h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{values.key || "tier-key"}</p>
          </div>
        </div>
        <p className="mt-5 text-2xl font-semibold tabular-nums">
          {values.minimumValidViews.toLocaleString(locale)}
        </p>
        <p className="text-sm text-muted-foreground">{t("preview.validViews")}</p>
        <div className="mt-5 space-y-2 border-t pt-4">
          {(translation?.benefits ?? []).slice(0, 4).map((benefit) => (
            <div key={benefit.key} className="flex items-start gap-2 text-sm">
              {benefit.included ? (
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <span className={benefit.included ? "text-foreground/85" : "text-muted-foreground"}>
                {benefit.label || benefit.key}{benefit.value ? ` · ${benefit.value}` : ""}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const defaultPerks: AdminLoyaltyTierPerks = {
  minWithdrawAmount: null,
  cpmBonusPercent: 0,
  referralCommissionRate: null,
  apiAccess: false,
  storageQuotaMb: null,
  freeFastWithdrawalsPerMonth: 0,
  supportPriority: "normal",
};

const supportPriorities: LoyaltySupportPriority[] = ["normal", "high", "urgent"];

/** Ô trống = null (dùng cấu hình chung của hệ thống). */
function nullableNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function PerksFields({ values, setValues }: EditorProps) {
  const t = useTranslations("Admin.loyaltyTiers");
  const perks = values.perks;
  const patch = (change: Partial<AdminLoyaltyTierPerks>) =>
    setValues((current) => ({
      ...current,
      perks: { ...current.perks, ...change },
    }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("perks.title")}
        description={t("perks.description")}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FormField label={t("perks.minWithdraw")} htmlFor="loyalty-min-withdraw">
          <Input
            id="loyalty-min-withdraw"
            type="number"
            min={0}
            step="any"
            value={perks.minWithdrawAmount ?? ""}
            placeholder={t("perks.minWithdrawPlaceholder")}
            onChange={(event) =>
              patch({ minWithdrawAmount: nullableNumber(event.target.value) })
            }
          />
        </FormField>
        <FormField label={t("perks.cpmBonus")} htmlFor="loyalty-cpm-bonus">
          <Input
            id="loyalty-cpm-bonus"
            type="number"
            min={0}
            max={1000}
            step="any"
            value={perks.cpmBonusPercent}
            onChange={(event) =>
              patch({ cpmBonusPercent: nullableNumber(event.target.value) ?? 0 })
            }
          />
        </FormField>
        <FormField label={t("perks.referralRate")} htmlFor="loyalty-referral-rate">
          <Input
            id="loyalty-referral-rate"
            type="number"
            min={0}
            max={100}
            step="any"
            value={perks.referralCommissionRate ?? ""}
            placeholder={t("perks.globalPlaceholder")}
            onChange={(event) =>
              patch({
                referralCommissionRate: nullableNumber(event.target.value),
              })
            }
          />
        </FormField>
        <FormField label={t("perks.storage")} htmlFor="loyalty-storage">
          <Input
            id="loyalty-storage"
            type="number"
            min={0}
            step="any"
            value={
              perks.storageQuotaMb === null ? "" : perks.storageQuotaMb / 1024
            }
            placeholder={t("perks.globalPlaceholder")}
            onChange={(event) => {
              const gigabytes = nullableNumber(event.target.value);
              patch({
                storageQuotaMb: gigabytes
                  ? Math.max(1, Math.round(gigabytes * 1024))
                  : null,
              });
            }}
          />
        </FormField>
        <FormField label={t("perks.freeFast")} htmlFor="loyalty-free-fast">
          <Input
            id="loyalty-free-fast"
            type="number"
            min={0}
            max={1000}
            value={perks.freeFastWithdrawalsPerMonth}
            onChange={(event) =>
              patch({
                freeFastWithdrawalsPerMonth: Math.max(
                  0,
                  integerValue(event.target.value),
                ),
              })
            }
          />
        </FormField>
        <FormField label={t("perks.supportPriority")} htmlFor="loyalty-support">
          <Select
            value={perks.supportPriority}
            onValueChange={(supportPriority: LoyaltySupportPriority) =>
              patch({ supportPriority })
            }
          >
            <SelectTrigger id="loyalty-support" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportPriorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {t(`perks.support.${priority}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border p-4 sm:max-w-sm">
        <Label htmlFor="loyalty-api-access">{t("perks.apiAccess")}</Label>
        <Switch
          id="loyalty-api-access"
          checked={perks.apiAccess}
          onCheckedChange={(apiAccess) => patch({ apiAccess })}
        />
      </div>
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
  return <div className="grid gap-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-lg font-semibold tracking-tight">{title}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p></div>;
}

function EditorStatus({ status }: { status: PublicationStatus }) {
  const t = useTranslations("Admin.loyaltyTiers");
  return <Badge variant={status === "published" ? "default" : status === "pending" ? "secondary" : "outline"}>{t(`status.${status}`)}</Badge>;
}

function CompletionDot({ complete }: { complete: boolean }) {
  return <span aria-hidden className={complete ? "size-1.5 rounded-full bg-emerald-500" : "size-1.5 rounded-full bg-muted-foreground/35"} />;
}

function hasTranslation(values: AdminLoyaltyTierPayload, locale: string) {
  const translation = values.translations.find((item) => item.locale === locale);
  return Boolean(translation?.name.trim()) && translation!.benefits.every(({ label }) => label.trim());
}

function initialValues(source: AdminLoyaltyTier | null, duplicate: boolean): AdminLoyaltyTierPayload {
  if (source) {
    return {
      key: duplicate ? `${source.key}-copy` : source.key,
      minimumValidViews: duplicate ? source.minimumValidViews + 1 : source.minimumValidViews,
      sortOrder: duplicate ? source.sortOrder + 1 : source.sortOrder,
      iconKey: source.iconKey ?? "sparkles",
      status: duplicate ? "draft" : source.status,
      perks: { ...defaultPerks, ...source.perks },
      translations: source.translations.map((translation) => ({
        ...translation,
        name: duplicate ? `${translation.name} (Copy)` : translation.name,
        benefits: translation.benefits.map((benefit) => ({ ...benefit })),
      })),
    };
  }
  return {
    key: "",
    minimumValidViews: 0,
    sortOrder: 0,
    iconKey: "sparkles",
    status: "draft",
    perks: { ...defaultPerks },
    translations: fallbackLanguages.map(({ locale }) => ({
      locale,
      name: "",
      description: "",
      benefits: [],
    })),
  };
}

function ensureTranslations(values: AdminLoyaltyTierPayload, languages: Language[]) {
  const structure = values.translations[0]?.benefits ?? [];
  return {
    ...values,
    translations: [
      ...values.translations,
      ...languages
        .filter((language) => !values.translations.some(({ locale }) => locale === language.locale))
        .map(({ locale }) => ({
          locale,
          name: "",
          description: "",
          benefits: structure.map(({ key, included }) => ({ key, included, label: "", value: null })),
        })),
    ],
  };
}

function validate(
  values: AdminLoyaltyTierPayload,
  languages: Language[],
  t: Translator,
) {
  if (!/^[a-z][a-z0-9-]{1,49}$/.test(values.key)) {
    return { tab: "general", message: t("validation.key") };
  }
  if (!Number.isInteger(values.minimumValidViews) || values.minimumValidViews < 0) {
    return { tab: "general", message: t("validation.threshold") };
  }
  if (!Number.isInteger(values.sortOrder) || values.sortOrder < 0 || values.sortOrder > 10_000) {
    return { tab: "general", message: t("validation.sortOrder") };
  }
  const defaultLocale = languages.find(({ isDefault }) => isDefault)?.locale ?? "vi";
  const activeTranslations = values.translations.filter(({ name }) => name.trim());
  if (!values.translations.find(({ locale }) => locale === defaultLocale)?.name.trim()) {
    return { tab: defaultLocale, message: t("validation.defaultName") };
  }
  for (const translation of activeTranslations) {
    const keys = translation.benefits.map(({ key }) => key);
    if (keys.some((key) => !/^[a-z][a-z0-9_]{0,63}$/.test(key))) {
      return { tab: translation.locale, message: t("validation.benefitKey") };
    }
    if (new Set(keys).size !== keys.length) {
      return { tab: translation.locale, message: t("validation.benefitKeyDuplicate") };
    }
    if (translation.benefits.some(({ label }) => !label.trim())) {
      return { tab: translation.locale, message: t("validation.benefitLabel") };
    }
  }
  return null;
}

function integerValue(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function comparisonValue(values: AdminLoyaltyTierPayload) {
  return JSON.stringify({
    ...values,
    translations: values.translations.filter(({ name }) => name.trim()),
  });
}
