"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, LoaderCircle, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { getAdminLanguages } from "@/features/languages/api/languages.client";
import type { Language } from "@/features/languages/types";
import { cn } from "@/lib/utils";
import {
  createAdminAnnouncement,
  getAdminAnnouncement,
  publishAdminAnnouncement,
  updateAdminAnnouncement,
} from "../api/announcements.client";
import type {
  AdminAnnouncement,
  AnnouncementDisplay,
  AnnouncementPayload,
  AnnouncementPriority,
  AnnouncementTargetType,
  AnnouncementType,
} from "../types";
import { announcementDisplayKeys, announcementStatusKeys, announcementTypeKeys } from "../types";

type FormState = {
  slug: string;
  translations: Record<string, TranslationForm>;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  displayType: AnnouncementDisplay;
  targetType: AnnouncementTargetType;
  targetValues: string;
  actionUrl: string;
  startsAt: string;
  endsAt: string;
  isDismissible: boolean;
  requiresAcknowledgement: boolean;
};

type TranslationForm = {
  title: string;
  summary: string;
  content: string;
  actionLabel: string;
};

const emptyTranslation: TranslationForm = { title: "", summary: "", content: "", actionLabel: "" };

const fallbackLanguages: Language[] = [
  { id: -1, name: "Vietnamese", nativeName: "Tiếng Việt", locale: "vi", code: "vi", regional: "vi-VN", flag: "VN", isDefault: true, status: "published", sortOrder: 10, isRtl: false },
  { id: -2, name: "English", nativeName: "English", locale: "en", code: "en", regional: "en-US", flag: "US", isDefault: false, status: "published", sortOrder: 20, isRtl: false },
];

const emptyForm: FormState = {
  slug: "", translations: { vi: { ...emptyTranslation } }, type: "info", priority: "normal", displayType: "notification", targetType: "all", targetValues: "", actionUrl: "", startsAt: "", endsAt: "", isDismissible: true, requiresAcknowledgement: false,
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromAnnouncement(item: AdminAnnouncement): FormState {
  return {
    slug: item.slug,
    translations: Object.fromEntries(item.translations.map((translation) => [translation.locale, {
      title: translation.title,
      summary: translation.summary || "",
      content: translation.content,
      actionLabel: translation.actionLabel || "",
    }])),
    type: item.type,
    priority: item.priority,
    displayType: item.displayType,
    targetType: item.targetType,
    targetValues: item.targetType === "users" ? (item.targetRules.userIds || []).join(", ") : item.targetType === "roles" ? (item.targetRules.roles || []).join(", ") : "",
    actionUrl: item.actionUrl || "",
    startsAt: toLocalInput(item.startsAt),
    endsAt: toLocalInput(item.endsAt),
    isDismissible: item.isDismissible,
    requiresAcknowledgement: item.requiresAcknowledgement,
  };
}

function payloadFromForm(form: FormState): AnnouncementPayload {
  const values = form.targetValues.split(",").map((value) => value.trim()).filter(Boolean);
  return {
    translations: Object.entries(form.translations)
      .filter(([, translation]) => Boolean(translation.title.trim() || translation.summary.trim() || translation.content.trim() || translation.actionLabel.trim()))
      .map(([locale, translation]) => ({
        locale,
        title: translation.title.trim(),
        summary: translation.summary.trim(),
        content: translation.content.trim(),
        actionLabel: translation.actionLabel.trim(),
      })),
    slug: form.slug.trim() || undefined,
    type: form.type,
    priority: form.priority,
    displayType: form.displayType,
    status: "draft",
    targetType: form.targetType,
    targetRules: form.targetType === "users" ? { userIds: values.map(Number).filter(Number.isInteger) } : form.targetType === "roles" ? { roles: values } : {},
    actionUrl: form.actionUrl.trim(),
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    isDismissible: form.isDismissible,
    requiresAcknowledgement: form.requiresAcknowledgement,
  };
}

export function AnnouncementEditor({ id }: { id?: number }) {
  const t = useTranslations("Admin.announcements");
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canPublish = permissions.includes("announcements.publish");
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [record, setRecord] = React.useState<AdminAnnouncement | null>(null);
  const [loading, setLoading] = React.useState(Boolean(id));
  const [saving, setSaving] = React.useState(false);
  const [languages, setLanguages] = React.useState<Language[]>(fallbackLanguages);
  const [activeLocale, setActiveLocale] = React.useState("vi");

  const defaultLocale = languages.find((language) => language.isDefault)?.locale || "vi";
  const translation = form.translations[activeLocale] || emptyTranslation;
  const defaultTranslation = form.translations[defaultLocale] || emptyTranslation;

  React.useEffect(() => {
    if (!id) return;
    void getAdminAnnouncement(id).then((item) => { setRecord(item); setForm(fromAnnouncement(item)); }).catch((error) => toast.error(error instanceof Error ? error.message : t("toast.loadError"))).finally(() => setLoading(false));
  }, [id, t]);

  React.useEffect(() => {
    let active = true;
    void getAdminLanguages().then((result) => {
      if (!active) return;
      const visible = result.data.filter((language) => language.status === "published" || language.isDefault);
      if (!visible.length) return;
      setLanguages(visible);
      setActiveLocale((current) => visible.some((language) => language.locale === current) ? current : (visible.find((language) => language.isDefault)?.locale || visible[0].locale));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function patchTranslation<K extends keyof TranslationForm>(key: K, value: TranslationForm[K]) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeLocale]: { ...(current.translations[activeLocale] || emptyTranslation), [key]: value },
      },
    }));
  }

  async function save(publish: boolean) {
    setSaving(true);
    try {
      const saved = id ? await updateAdminAnnouncement(id, payloadFromForm(form)) : await createAdminAnnouncement(payloadFromForm(form));
      if (publish) await publishAdminAnnouncement(saved.id);
      toast.success(publish ? t("toast.published") : id ? t("editor.toast.saved") : t("editor.toast.savedDraft"));
      router.push("/admin/announcements");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("editor.toast.saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-80 items-center justify-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>;

  const canSave = Boolean(defaultTranslation.title.trim() && defaultTranslation.content.trim());
  const hasContent = (locale: string) => {
    const item = form.translations[locale];
    return Boolean(item && (item.title.trim() || item.content.trim()));
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6">
      <AdminPageHeader
        title={id ? t("editor.titleEdit") : t("editor.titleCreate")}
        description={t("editor.description")}
        meta={record ? <Badge variant="outline">{t(announcementStatusKeys[record.status])}</Badge> : undefined}
        actions={
          <Button variant="outline" onClick={() => router.push("/admin/announcements")}>
            <ArrowLeft />
            {t("editor.backToList")}
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column: what members read */}
        <div className="flex min-w-0 flex-col gap-6">
          <Section title={t("editor.content.title")} description={t("editor.content.localeHint")}>
            <div role="tablist" aria-label={tc("language")} className="flex flex-wrap gap-2">
              {languages.map((language) => {
                const selected = language.locale === activeLocale;
                return (
                  <button
                    key={language.locale}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveLocale(language.locale)}
                    className={cn(
                      "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full",
                        hasContent(language.locale) ? "bg-emerald-500" : "bg-muted-foreground/30",
                      )}
                    />
                    {language.nativeName || language.name}
                    {language.isDefault ? (
                      <span className="text-xs font-normal opacity-70">({t("editor.content.defaultLabel")})</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <Field
              id="announcement-title"
              label={tc("title")}
              required={activeLocale === defaultLocale}
              counter={`${translation.title.length}/160`}
            >
              <Input
                id="announcement-title"
                maxLength={160}
                value={translation.title}
                onChange={(event) => patchTranslation("title", event.target.value)}
                placeholder={t("editor.content.titlePlaceholder")}
              />
            </Field>

            <Field
              id="announcement-summary"
              label={t("editor.content.summary")}
              counter={`${translation.summary.length}/300`}
            >
              <Textarea
                id="announcement-summary"
                rows={2}
                maxLength={300}
                className="resize-none"
                value={translation.summary}
                onChange={(event) => patchTranslation("summary", event.target.value)}
              />
            </Field>

            <Field
              id="announcement-content"
              label={t("editor.content.body")}
              required={activeLocale === defaultLocale}
              hint={t("editor.content.bodyHint")}
            >
              <Textarea
                id="announcement-content"
                rows={12}
                maxLength={20_000}
                className="min-h-56"
                value={translation.content}
                onChange={(event) => patchTranslation("content", event.target.value)}
                placeholder={t("editor.content.bodyPlaceholder")}
              />
            </Field>
          </Section>

          <Section title={t("editor.interaction.title")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="announcement-action-label" label={t("editor.content.actionLabel")}>
                <Input
                  id="announcement-action-label"
                  value={translation.actionLabel}
                  onChange={(event) => patchTranslation("actionLabel", event.target.value)}
                  placeholder={t("editor.content.actionLabelPlaceholder")}
                />
              </Field>
              <Field id="announcement-action-url" label={t("editor.interaction.actionUrl")}>
                <Input
                  id="announcement-action-url"
                  value={form.actionUrl}
                  onChange={(event) => patch("actionUrl", event.target.value)}
                  placeholder={t("editor.interaction.actionUrlPlaceholder")}
                />
              </Field>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">{t("editor.interaction.actionUrlHint")}</p>

            <div className="divide-y rounded-lg border">
              <ToggleRow
                label={t("editor.interaction.dismissible")}
                hint={t("editor.interaction.dismissibleHint")}
                checked={form.isDismissible}
                onChange={(checked) => patch("isDismissible", checked)}
              />
              <ToggleRow
                label={t("editor.interaction.acknowledge")}
                hint={t("editor.interaction.acknowledgeHint")}
                checked={form.requiresAcknowledgement}
                onChange={(checked) => patch("requiresAcknowledgement", checked)}
              />
            </div>
          </Section>
        </div>

        {/* Side column: how and to whom it is delivered */}
        <aside className="flex min-w-0 flex-col gap-6">
          <Section title={t("editor.classification.title")}>
            <Field label={tc("type")}>
              <Select value={form.type} onValueChange={(value) => patch("type", value as AnnouncementType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(announcementTypeKeys).map(([value, key]) => (
                    <SelectItem key={value} value={value}>{t(key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("editor.classification.priority")}>
              <Select value={form.priority} onValueChange={(value) => patch("priority", value as AnnouncementPriority)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("priority.low")}</SelectItem>
                  <SelectItem value="normal">{t("priority.normal")}</SelectItem>
                  <SelectItem value="high">{t("priority.high")}</SelectItem>
                  <SelectItem value="critical">{t("priority.critical")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("editor.classification.displayType")}>
              <Select value={form.displayType} onValueChange={(value) => patch("displayType", value as AnnouncementDisplay)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(announcementDisplayKeys).map(([value, key]) => (
                    <SelectItem key={value} value={value}>{t(key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="announcement-slug" label={t("editor.content.slug")}>
              <Input
                id="announcement-slug"
                value={form.slug}
                onChange={(event) => patch("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-+/, ""))}
                placeholder={t("editor.content.slugPlaceholder")}
              />
            </Field>
          </Section>

          <Section title={t("editor.audience.title")}>
            <Field label={t("editor.audience.recipients")}>
              <Select
                value={form.targetType}
                onValueChange={(value) => { patch("targetType", value as AnnouncementTargetType); patch("targetValues", ""); }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("editor.audience.allUsers")}</SelectItem>
                  <SelectItem value="users">{t("editor.audience.specificUsers")}</SelectItem>
                  <SelectItem value="roles">{t("editor.audience.byRole")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.targetType !== "all" ? (
              <Field
                id="announcement-target-values"
                label={form.targetType === "users" ? t("editor.audience.userId") : t("editor.audience.roleKey")}
                hint={t("editor.audience.valuesHint")}
              >
                <Input
                  id="announcement-target-values"
                  value={form.targetValues}
                  onChange={(event) => patch("targetValues", event.target.value)}
                  placeholder={form.targetType === "users" ? "12, 18, 35" : "member, admin"}
                />
              </Field>
            ) : null}
            <Field id="starts-at" label={t("editor.audience.startsAt")}>
              <Input id="starts-at" type="datetime-local" value={form.startsAt} onChange={(event) => patch("startsAt", event.target.value)} />
            </Field>
            <Field id="ends-at" label={t("editor.audience.endsAt")}>
              <Input id="ends-at" type="datetime-local" value={form.endsAt} onChange={(event) => patch("endsAt", event.target.value)} />
            </Field>
          </Section>
        </aside>
      </div>

      {/* Sticky action bar: always reachable while scrolling the form */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-auto border-t bg-background/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
            {form.startsAt ? t("editor.sidebar.scheduled") : t("editor.sidebar.immediate")}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" disabled={saving || !canSave} onClick={() => void save(false)}>
              {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
              {t("editor.sidebar.saveDraft")}
            </Button>
            {canPublish ? (
              <Button disabled={saving || !canSave} onClick={() => void save(true)}>
                <Send />
                {record?.status === "active" ? t("editor.sidebar.saveAndUpdate") : t("editor.sidebar.saveAndPublish")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="gap-0 py-0">
      <div className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-5 p-5">{children}</div>
    </Card>
  );
}

function Field({
  id,
  label,
  required,
  counter,
  hint,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  counter?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive" aria-hidden="true">*</span> : null}
        </Label>
        {counter ? <span className="text-xs tabular-nums text-muted-foreground">{counter}</span> : null}
      </div>
      {children}
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
