"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  CircleDollarSign,
  Copy,
  FileInput,
  GripVertical,
  Languages,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Save,
  Settings2,
  Trash2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getAdminLanguages } from "@/features/languages/api/languages.client";
import type { Language } from "@/features/languages/types";
import type { PublicationStatus } from "@/types/publication-status";

import {
  createAdminPaymentMethod,
  getAdminPaymentMethod,
  updateAdminPaymentMethod,
} from "../api/payment-methods.client";
import type {
  PaymentMethod,
  PaymentMethodFieldType,
  PaymentMethodPayload,
} from "../types";

type EditableField = {
  id: string;
  key: string;
  type: PaymentMethodFieldType;
  required: boolean;
  labels: Record<string, { label: string; placeholder: string }>;
  options: Array<{ id: string; value: string; label: string }>;
};

type FormState = {
  withdrawFee: string;
  minWithdrawAmount: string;
  status: PublicationStatus;
  names: Record<string, string>;
  fields: EditableField[];
};

function createEmptyForm(languages: Language[]): FormState {
  return {
    withdrawFee: "0",
    minWithdrawAmount: "0",
    status: "draft",
    names: Object.fromEntries(
      languages.map(({ locale }) => [locale, ""]),
    ),
    fields: [newField(languages)],
  };
}

function newField(languages: Language[]): EditableField {
  return {
    id: crypto.randomUUID(),
    key: "",
    type: "text",
    required: true,
    options: [],
    labels: Object.fromEntries(
      languages.map(({ locale }) => [
        locale,
        { label: "", placeholder: "" },
      ]),
    ),
  };
}

function methodToForm(
  method: PaymentMethod,
  languages: Language[],
): FormState {
  const defaultLocale = languages.find(({ isDefault }) => isDefault)?.locale;
  const base =
    method.translations.find(({ locale }) => locale === defaultLocale) ??
    method.translations[0];

  return {
    withdrawFee: method.withdrawFee,
    minWithdrawAmount: method.minWithdrawAmount,
    status: method.status,
    names: Object.fromEntries(
      languages.map(({ locale }) => [
        locale,
        method.translations.find(
          (translation) => translation.locale === locale,
        )?.name ?? "",
      ]),
    ),
    fields:
      base?.fields.map((field) => ({
        id: crypto.randomUUID(),
        key: field.key,
        type: field.type,
        required: field.required,
        options: (field.options ?? []).map((option) => ({
          id: crypto.randomUUID(),
          value: option.value,
          label: option.label,
        })),
        labels: Object.fromEntries(
          languages.map(({ locale }) => {
            const localized = method.translations
              .find((translation) => translation.locale === locale)
              ?.fields.find(({ key }) => key === field.key);

            return [
              locale,
              {
                label: localized?.label ?? field.label,
                placeholder: localized?.placeholder ?? "",
              },
            ];
          }),
        ),
      })) ?? [],
  };
}

function formToPayload(
  form: FormState,
  languages: Language[],
): PaymentMethodPayload {
  const translatedLanguages = languages.filter(
    ({ locale, isDefault }) =>
      isDefault || Boolean(form.names[locale]?.trim()),
  );

  return {
    withdrawFee: form.withdrawFee,
    minWithdrawAmount: form.minWithdrawAmount,
    status: form.status,
    translations: translatedLanguages.map(({ locale }) => ({
      locale,
      name: (form.names[locale] ?? "").trim(),
      fields: form.fields.map((field) => {
        const localized = field.labels[locale] ?? {
          label: "",
          placeholder: "",
        };

        return {
          key: field.key.trim(),
          type: field.type,
          required: field.required,
          label: localized.label.trim(),
          ...(localized.placeholder.trim()
            ? { placeholder: localized.placeholder.trim() }
            : {}),
          ...(field.type === "select"
            ? {
                options: field.options.map(({ value, label }) => ({
                  value: value.trim(),
                  label: label.trim(),
                })),
              }
            : {}),
        };
      }),
    })),
  };
}

const FIELD_TYPE_KEYS: Record<PaymentMethodFieldType, string> = {
  text: "fieldTypes.text",
  email: "fieldTypes.email",
  tel: "fieldTypes.tel",
  number: "fieldTypes.number",
  textarea: "fieldTypes.textarea",
  select: "fieldTypes.select",
};

export function PaymentMethodEditorPage({
  paymentMethodId,
}: {
  paymentMethodId?: number;
}) {
  const t = useTranslations("Admin.paymentMethods.editor");
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const editing = paymentMethodId !== undefined;

  const [method, setMethod] = React.useState<PaymentMethod | null>(null);
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [activeLocale, setActiveLocale] = React.useState("");

  React.useEffect(() => {
    let active = true;

    void Promise.all([
      getAdminLanguages(),
      paymentMethodId
        ? getAdminPaymentMethod(paymentMethodId)
        : Promise.resolve(null),
    ])
      .then(([languageResult, paymentMethod]) => {
        if (!active) return;

        const relevantLanguages = languageResult.data.filter(
          (language) =>
            language.status === "published" ||
            paymentMethod?.translations.some(
              ({ locale }) => locale === language.locale,
            ),
        );

        const defaultLanguage =
          relevantLanguages.find((language) => language.isDefault) ??
          relevantLanguages[0];

        setLanguages(relevantLanguages);
        setMethod(paymentMethod);
        setActiveLocale(defaultLanguage?.locale ?? "");
        setForm(
          paymentMethod
            ? methodToForm(paymentMethod, relevantLanguages)
            : createEmptyForm(relevantLanguages),
        );
      })
      .catch((loadError) => {
        if (!active) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : t("loadError"),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paymentMethodId, t]);

  const schemaLocked = Boolean(method?.userMethodCount);
  const activeLanguage =
    languages.find((language) => language.locale === activeLocale) ??
    languages[0];

  function updateField(id: string, patch: Partial<EditableField>) {
    setForm((current) =>
      current
        ? {
            ...current,
            fields: current.fields.map((field) =>
              field.id === id ? { ...field, ...patch } : field,
            ),
          }
        : current,
    );
  }

  function updateLocalizedField(
    fieldId: string,
    locale: string,
    patch: Partial<{ label: string; placeholder: string }>,
  ) {
    setForm((current) => {
      if (!current) return current;

      return {
        ...current,
        fields: current.fields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                labels: {
                  ...field.labels,
                  [locale]: {
                    label: field.labels[locale]?.label ?? "",
                    placeholder: field.labels[locale]?.placeholder ?? "",
                    ...patch,
                  },
                },
              }
            : field,
        ),
      };
    });
  }

  function addField() {
    setForm((current) =>
      current
        ? {
            ...current,
            fields: [...current.fields, newField(languages)],
          }
        : current,
    );
  }

  function removeField(id: string) {
    setForm((current) =>
      current
        ? {
            ...current,
            fields: current.fields.filter((field) => field.id !== id),
          }
        : current,
    );
  }

  function duplicateField(field: EditableField) {
    setForm((current) =>
      current
        ? {
            ...current,
            fields: [
              ...current.fields,
              {
                ...field,
                id: crypto.randomUUID(),
                key: field.key ? `${field.key}_copy` : "",
                options: field.options.map((option) => ({
                  ...option,
                  id: crypto.randomUUID(),
                })),
              },
            ],
          }
        : current,
    );
  }

  function validateForm(currentForm: FormState) {
    if (languages.length === 0) {
      return t("validation.noLanguage");
    }

    const defaultLanguage = languages.find((language) => language.isDefault);

    if (
      defaultLanguage &&
      !currentForm.names[defaultLanguage.locale]?.trim()
    ) {
      return t("validation.nameRequired", {
        language: defaultLanguage.nativeName || defaultLanguage.name,
      });
    }

    if (currentForm.fields.length === 0) {
      return t("validation.noFields");
    }

    const translatedLanguages = languages.filter(
      ({ locale, isDefault }) =>
        isDefault || Boolean(currentForm.names[locale]?.trim()),
    );

    const keys = currentForm.fields.map((field) => field.key.trim());
    const duplicatedKey = keys.find(
      (key, index) => key && keys.indexOf(key) !== index,
    );

    if (duplicatedKey) {
      return t("validation.duplicateKey", { key: duplicatedKey });
    }

    for (const field of currentForm.fields) {
      if (!field.key.trim()) {
        return t("validation.keyMissing");
      }

      if (!/^[a-z][a-z0-9_]*$/.test(field.key.trim())) {
        return t("validation.keyInvalid", { key: field.key });
      }

      if (
        translatedLanguages.some(
          ({ locale }) => !field.labels[locale]?.label.trim(),
        )
      ) {
        return t("validation.labelMissing", { key: field.key });
      }

      if (field.type === "select") {
        if (field.options.length === 0) {
          return t("validation.optionsMissing", { key: field.key });
        }

        if (
          field.options.some(
            ({ value, label }) => !value.trim() || !label.trim(),
          )
        ) {
          return t("validation.optionIncomplete", { key: field.key });
        }
      }
    }

    return "";
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = formToPayload(form, languages);

      if (paymentMethodId) {
        await updateAdminPaymentMethod(paymentMethodId, payload);
      } else {
        await createAdminPaymentMethod(payload);
      }

      toast.success(
        editing ? t("toast.updated") : t("toast.created"),
      );

      router.push("/admin/payment-methods");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("saveError"),
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="mx-auto flex min-h-[420px] w-full max-w-[1320px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl border bg-card shadow-sm">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 pb-10">
      <AdminPageHeader
        title={
          editing ? t("titleEdit") : t("titleCreate")
        }
        leading={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => router.push("/admin/payment-methods")}
          >
            <ArrowLeft />
          </Button>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={saving}
              onClick={() => router.push("/admin/payment-methods")}
            >
              {tc("cancel")}
            </Button>
            <Button
              form="payment-method-editor-form"
              type="submit"
              className="rounded-xl"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Save />
              )}
              {saving ? tc("saving") : tc("saveChanges")}
            </Button>
          </>
        }
      />

      {error ? (
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/30 bg-destructive/[0.04]"
        >
          <WalletCards />
          <AlertTitle>{t("alertTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {schemaLocked ? (
        <Alert className="rounded-2xl border-amber-500/20 bg-amber-500/[0.05] text-foreground">
          <LockKeyhole className="text-amber-600" />
          <AlertTitle>{t("locked.title")}</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {t.rich("locked.description", {
              count: method?.userMethodCount ?? 0,
              highlight: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        id="payment-method-editor-form"
        onSubmit={submit}
        className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="min-w-0 space-y-5">
          <SectionCard
            title={t("sections.display")}
            icon={<Languages />}
          >
            {languages.length ? (
              <LanguageTabs
                languages={languages}
                activeLocale={activeLocale}
                onActiveLocaleChange={setActiveLocale}
              >
                {activeLanguage ? (
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <Field
                      label={t("methodName")}
                      required={activeLanguage.isDefault}
                    >
                      <Input
                        value={form.names[activeLanguage.locale] ?? ""}
                        onChange={(event) =>
                          setForm((current) =>
                            current
                              ? {
                                  ...current,
                                  names: {
                                    ...current.names,
                                    [activeLanguage.locale]:
                                      event.target.value,
                                  },
                                }
                              : current,
                          )
                        }
                        placeholder={t("methodNamePlaceholder")}
                      />
                    </Field>

                    <div className="rounded-xl border bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("locale")}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="rounded-md bg-background px-2 py-1 text-xs font-medium">
                          {activeLanguage.locale}
                        </code>
                        {activeLanguage.isDefault ? (
                          <Badge variant="secondary">{t("default")}</Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </LanguageTabs>
            ) : (
              <Alert>
                <Languages />
                <AlertTitle>{t("noLanguage.title")}</AlertTitle>
                <AlertDescription>
                  {t("noLanguage.description")}
                </AlertDescription>
              </Alert>
            )}
          </SectionCard>

          <SectionCard
            title={t("sections.structure")}
            icon={<FileInput />}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={schemaLocked}
                onClick={addField}
              >
                <Plus />
                {t("addField")}
              </Button>
            }
          >
            <div className="space-y-4">
              {form.fields.length === 0 ? (
                <EmptyFields onAdd={addField} disabled={schemaLocked} />
              ) : (
                form.fields.map((field, index) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    index={index}
                    languages={languages}
                    activeLocale={activeLocale}
                    schemaLocked={schemaLocked}
                    onUpdate={(patch) => updateField(field.id, patch)}
                    onUpdateLocalized={(locale, patch) =>
                      updateLocalizedField(field.id, locale, patch)
                    }
                    onRemove={() => removeField(field.id)}
                    onDuplicate={() => duplicateField(field)}
                  />
                ))
              )}
            </div>

            {!schemaLocked && form.fields.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full rounded-xl border-dashed"
                onClick={addField}
              >
                <Plus />
                {t("addFieldNew")}
              </Button>
            ) : null}
          </SectionCard>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5">
          <SectionCard
            title={t("sections.payment")}
            icon={<CircleDollarSign />}
            compact
          >
            <div className="space-y-4">
              <Field label={t("withdrawFee")} required>
                <Input
                  inputMode="decimal"
                  value={form.withdrawFee}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? {
                            ...current,
                            withdrawFee: event.target.value,
                          }
                        : current,
                    )
                  }
                  placeholder="0"
                />
              </Field>

              <Field
                label={t("minWithdraw")}
                required
              >
                <Input
                  inputMode="decimal"
                  value={form.minWithdrawAmount}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? {
                            ...current,
                            minWithdrawAmount: event.target.value,
                          }
                        : current,
                    )
                  }
                  placeholder="0"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title={tc("status")}
            icon={<Settings2 />}
            compact
          >
            <Field label={tc("status")}>
              <Select
                value={form.status}
                onValueChange={(status: PublicationStatus) =>
                  setForm((current) =>
                    current ? { ...current, status } : current,
                  )
                }
              >
                <SelectTrigger
                  id="payment-method-status"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("statusDraft")}</SelectItem>
                  <SelectItem value="published">{t("statusPublished")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </SectionCard>

          <div className="hidden xl:block">
            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl"
            >
              {saving ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Save />
              )}
              {saving ? tc("saving") : tc("saveChanges")}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function LanguageTabs({
  languages,
  activeLocale,
  onActiveLocaleChange,
  children,
}: {
  languages: Language[];
  activeLocale: string;
  onActiveLocaleChange: (locale: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Tabs
      value={activeLocale}
      onValueChange={onActiveLocaleChange}
      className="gap-5"
    >
      <div className="overflow-x-auto">
        <TabsList className="h-auto min-w-max gap-1 rounded-xl bg-muted/60 p-1">
          {languages.map((language) => (
            <TabsTrigger
              key={language.id}
              value={language.locale}
              className="gap-2 rounded-lg px-3 py-2"
            >
              <span>{language.nativeName || language.name}</span>
              {language.isDefault ? (
                <span className="size-1.5 rounded-full bg-primary" />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {languages.map((language) => (
        <TabsContent
          key={language.id}
          value={language.locale}
          className="mt-0"
        >
          {children}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function FieldEditor({
  field,
  index,
  languages,
  activeLocale,
  schemaLocked,
  onUpdate,
  onUpdateLocalized,
  onRemove,
  onDuplicate,
}: {
  field: EditableField;
  index: number;
  languages: Language[];
  activeLocale: string;
  schemaLocked: boolean;
  onUpdate: (patch: Partial<EditableField>) => void;
  onUpdateLocalized: (
    locale: string,
    patch: Partial<{ label: string; placeholder: string }>,
  ) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const t = useTranslations("Admin.paymentMethods.editor");
  const tc = useTranslations("Admin.common");
  const [open, setOpen] = React.useState(true);
  const currentLanguage =
    languages.find((language) => language.locale === activeLocale) ??
    languages[0];

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm shadow-black/[0.02]">
      <div className="flex items-center gap-3 border-b bg-muted/[0.16] px-4 py-3 sm:px-5">
        <GripVertical className="size-4 shrink-0 text-muted-foreground/60" />

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-background font-mono text-[11px] font-semibold text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold">
                {field.key || t("fieldEditor.unnamed")}
              </p>
              <Badge variant="outline" className="font-normal">
                {t(FIELD_TYPE_KEYS[field.type])}
              </Badge>
              {field.required ? (
                <Badge variant="secondary" className="font-normal">
                  {tc("required")}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!schemaLocked ? (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg text-muted-foreground"
                aria-label={t("fieldEditor.duplicateAria", { index: index + 1 })}
                onClick={onDuplicate}
              >
                <Copy />
              </Button>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                aria-label={t("fieldEditor.removeAria", { index: index + 1 })}
                onClick={onRemove}
              >
                <Trash2 />
              </Button>
            </>
          ) : null}

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-lg"
            aria-label={
              open ? t("fieldEditor.collapse") : t("fieldEditor.expand")
            }
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronDown
              className={cn(
                "transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      {open ? (
        <div className="space-y-6 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field
              label={t("fieldEditor.key")}
              required
            >
              <Input
                value={field.key}
                disabled={schemaLocked}
                onChange={(event) => onUpdate({ key: event.target.value })}
                placeholder="account_number"
                className="font-mono"
              />
            </Field>

            <Field
              label={t("fieldEditor.dataType")}
              required
            >
              <Select
                value={field.type}
                disabled={schemaLocked}
                onValueChange={(type: PaymentMethodFieldType) =>
                  onUpdate({
                    type,
                    options: type === "select" ? field.options : [],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t("fieldTypeOptions.text")}</SelectItem>
                  <SelectItem value="email">{t("fieldTypeOptions.email")}</SelectItem>
                  <SelectItem value="tel">{t("fieldTypeOptions.tel")}</SelectItem>
                  <SelectItem value="number">
                    {t("fieldTypeOptions.number")}
                  </SelectItem>
                  <SelectItem value="textarea">
                    {t("fieldTypeOptions.textarea")}
                  </SelectItem>
                  <SelectItem value="select">
                    {t("fieldTypeOptions.select")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <label
            className={cn(
              "flex items-start gap-3 rounded-xl border bg-muted/[0.12] px-4 py-3.5",
              schemaLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer",
            )}
          >
            <Checkbox
              checked={field.required}
              disabled={schemaLocked}
              onCheckedChange={(checked) =>
                onUpdate({ required: checked === true })
              }
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">
                {t("fieldEditor.requiredInput")}
              </p>
            </div>
          </label>

          {field.type === "select" ? (
            <>
              <Separator />
              <SelectOptionsEditor
                field={field}
                schemaLocked={schemaLocked}
                onUpdate={onUpdate}
              />
            </>
          ) : null}

          <Separator />

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold">
                {t("fieldEditor.displayContent")}
              </p>
            </div>

            {currentLanguage ? (
              <div className="rounded-xl border bg-muted/[0.08] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {currentLanguage.nativeName || currentLanguage.name}
                    </span>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {currentLanguage.locale}
                    </code>
                  </div>
                  {currentLanguage.isDefault ? (
                    <Badge variant="secondary">{t("default")}</Badge>
                  ) : null}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field
                    label={t("fieldEditor.label")}
                    required
                    >
                    <Input
                      value={
                        field.labels[currentLanguage.locale]?.label ?? ""
                      }
                      onChange={(event) =>
                        onUpdateLocalized(currentLanguage.locale, {
                          label: event.target.value,
                        })
                      }
                      placeholder={t("fieldEditor.labelPlaceholder")}
                    />
                  </Field>

                  <Field
                    label={t("fieldEditor.placeholder")}
                  >
                    <Input
                      value={
                        field.labels[currentLanguage.locale]?.placeholder ?? ""
                      }
                      onChange={(event) =>
                        onUpdateLocalized(currentLanguage.locale, {
                          placeholder: event.target.value,
                        })
                      }
                      placeholder={t("fieldEditor.placeholderPlaceholder")}
                    />
                  </Field>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SelectOptionsEditor({
  field,
  schemaLocked,
  onUpdate,
}: {
  field: EditableField;
  schemaLocked: boolean;
  onUpdate: (patch: Partial<EditableField>) => void;
}) {
  const t = useTranslations("Admin.paymentMethods.editor.options");
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{t("title")}</p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-lg"
          disabled={schemaLocked}
          onClick={() =>
            onUpdate({
              options: [
                ...field.options,
                {
                  id: crypto.randomUUID(),
                  value: "",
                  label: "",
                },
              ],
            })
          }
        >
          <Plus />
          {t("add")}
        </Button>
      </div>

      {field.options.length ? (
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_40px] gap-2 border-b bg-muted/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>{t("value")}</span>
            <span>{t("label")}</span>
            <span />
          </div>

          <div className="divide-y">
            {field.options.map((option) => (
              <div
                key={option.id}
                className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_40px] gap-2 p-2.5"
              >
                <Input
                  value={option.value}
                  placeholder="VCB"
                  disabled={schemaLocked}
                  className="font-mono"
                  onChange={(event) =>
                    onUpdate({
                      options: field.options.map((item) =>
                        item.id === option.id
                          ? { ...item, value: event.target.value }
                          : item,
                      ),
                    })
                  }
                />

                <Input
                  value={option.label}
                  placeholder="Vietcombank"
                  onChange={(event) =>
                    onUpdate({
                      options: field.options.map((item) =>
                        item.id === option.id
                          ? { ...item, label: event.target.value }
                          : item,
                      ),
                    })
                  }
                />

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-10 rounded-lg text-muted-foreground hover:text-destructive"
                  aria-label={t("removeAria", { name: option.label || option.value })}
                  disabled={schemaLocked}
                  onClick={() =>
                    onUpdate({
                      options: field.options.filter(
                        (item) => item.id !== option.id,
                      ),
                    })
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/[0.08] px-4 py-6 text-center">
          <p className="text-sm font-medium">{t("empty")}</p>
        </div>
      )}
    </div>
  );
}

function EmptyFields({
  onAdd,
  disabled,
}: {
  onAdd: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("Admin.paymentMethods.editor.emptyFields");
  return (
    <div className="rounded-2xl border border-dashed bg-muted/[0.08] px-6 py-10 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-2xl border bg-background shadow-sm">
        <Settings2 className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-semibold">{t("title")}</p>

      <Button
        type="button"
        variant="outline"
        className="mt-4 rounded-xl"
        disabled={disabled}
        onClick={onAdd}
      >
        <Plus />
        {t("add")}
      </Button>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  compact = false,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-sm shadow-black/[0.02]">
      <div
        className={cn(
          "flex items-center justify-between gap-4 border-b",
          compact ? "px-5 py-4" : "px-5 py-4 sm:px-6",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>

          <div className="min-w-0">
            <h2 className="truncate font-semibold tracking-tight">
              {title}
            </h2>

            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <CardContent
        className={cn(
          compact ? "p-5" : "px-5 py-5 sm:px-6",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium">
          {label}
          {required ? (
            <span className="ml-1 text-destructive">*</span>
          ) : null}
        </Label>
      </div>

      {children}

      {hint ? (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
