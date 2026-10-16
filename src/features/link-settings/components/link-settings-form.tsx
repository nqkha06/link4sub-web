"use client";

import { Globe2, Link2, Loader2, RefreshCw, Save, Trash2, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getLinkCleanupPreview, updateLinkSettings } from "../api/link-settings.client";
import { linkUrl, type AdminLinkSettings, type LinkCleanupPreview } from "../types";

const PREFIX_PATTERN = /^(?:[a-z0-9][a-z0-9_-]{0,31})?$/;

export function LinkSettingsForm({
  initialSettings,
  canUpdate,
}: {
  initialSettings: AdminLinkSettings;
  canUpdate: boolean;
}) {
  const t = useTranslations("Admin.linkSettings");
  const [saved, setSaved] = React.useState(initialSettings);
  const [settings, setSettings] = React.useState(initialSettings);
  const [saving, setSaving] = React.useState(false);
  const [previewing, setPreviewing] = React.useState(false);
  const [preview, setPreview] = React.useState<LinkCleanupPreview | null>(null);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const exampleAlias = settings.aliasCaseSensitive ? "AbC123" : "abc123";
  const prefixValid =
    PREFIX_PATTERN.test(settings.socialPrefix) &&
    PREFIX_PATTERN.test(settings.bioPrefix) &&
    !(settings.socialPrefix === settings.bioPrefix && settings.socialPrefix !== "") &&
    Boolean(settings.socialPrefix || settings.bioPrefix);

  function patch(values: Partial<AdminLinkSettings>) {
    setSettings((current) => ({ ...current, ...values }));
    setPreview(null);
  }

  async function save() {
    try {
      setSaving(true);
      const updated = await updateLinkSettings(settings);
      setSaved(updated);
      setSettings(updated);
      toast.success(t("saveSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function refreshCleanupPreview() {
    try {
      setPreviewing(true);
      setPreview(await getLinkCleanupPreview());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("cleanup.previewError"));
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe2 className="size-4" /> {t("domain.title")}
          </CardTitle>
          <CardDescription>{t("domain.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="publicDomain">{t("domain.label")}</Label>
          <Input
            id="publicDomain"
            type="url"
            placeholder="https://example.com"
            value={settings.publicDomain}
            disabled={!canUpdate}
            onChange={(event) => patch({ publicDomain: event.target.value.trim() })}
          />
          <p className="text-xs text-muted-foreground">{t("domain.help")}</p>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <PrefixCard
          icon={Link2}
          title={t("social.title")}
          description={t("social.description")}
          label={t("prefixLabel")}
          help={t("social.help")}
          value={settings.socialPrefix}
          preview={linkUrl(settings, "social", exampleAlias)}
          disabled={!canUpdate}
          onChange={(socialPrefix) => patch({ socialPrefix })}
        />
        <PrefixCard
          icon={UserRound}
          title={t("bio.title")}
          description={t("bio.description")}
          label={t("prefixLabel")}
          help={t("bio.help")}
          value={settings.bioPrefix}
          preview={linkUrl(settings, "bio", exampleAlias)}
          disabled={!canUpdate}
          onChange={(bioPrefix) => patch({ bioPrefix })}
        />
      </div>

      {!prefixValid ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t("prefixError")}
        </p>
      ) : null}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash2 className="size-4" /> {t("cleanup.title")}
          </CardTitle>
          <CardDescription>{t("cleanup.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CleanupRuleRow
            id="cleanup-inactive"
            title={t("cleanup.inactive.title")}
            description={t("cleanup.inactive.description")}
            enabled={settings.cleanupInactiveEnabled}
            days={settings.cleanupInactiveDays}
            matched={preview?.rules.inactive.matched}
            disabled={!canUpdate}
            onEnabledChange={(cleanupInactiveEnabled) => patch({ cleanupInactiveEnabled })}
            onDaysChange={(cleanupInactiveDays) => patch({ cleanupInactiveDays })}
            countLabel={(count) => t("cleanup.matched", { count })}
            daysLabel={t("cleanup.days")}
          />
          <CleanupRuleRow
            id="cleanup-api"
            title={t("cleanup.api.title")}
            description={t("cleanup.api.description")}
            enabled={settings.cleanupApiEnabled}
            days={settings.cleanupApiDays}
            matched={preview?.rules.api_age.matched}
            disabled={!canUpdate}
            onEnabledChange={(cleanupApiEnabled) => patch({ cleanupApiEnabled })}
            onDaysChange={(cleanupApiDays) => patch({ cleanupApiDays })}
            countLabel={(count) => t("cleanup.matched", { count })}
            daysLabel={t("cleanup.days")}
          />
          <CleanupRuleRow
            id="cleanup-expired"
            title={t("cleanup.expired.title")}
            description={t("cleanup.expired.description")}
            enabled={settings.cleanupExpiredEnabled}
            days={settings.cleanupExpiredDays}
            matched={preview?.rules.expired.matched}
            disabled={!canUpdate}
            onEnabledChange={(cleanupExpiredEnabled) => patch({ cleanupExpiredEnabled })}
            onDaysChange={(cleanupExpiredDays) => patch({ cleanupExpiredDays })}
            countLabel={(count) => t("cleanup.matched", { count })}
            daysLabel={t("cleanup.days")}
          />
          <CleanupRuleRow
            id="cleanup-trash"
            title={t("cleanup.trash.title")}
            description={t("cleanup.trash.description")}
            enabled={settings.cleanupTrashEnabled}
            days={settings.cleanupTrashDays}
            matched={preview?.rules.trash_retention.matched}
            disabled={!canUpdate}
            onEnabledChange={(cleanupTrashEnabled) => patch({ cleanupTrashEnabled })}
            onDaysChange={(cleanupTrashDays) => patch({ cleanupTrashDays })}
            countLabel={(count) => t("cleanup.matched", { count })}
            daysLabel={t("cleanup.days")}
          />

          <div className="rounded-lg border border-border p-4">
            <NumberSetting
              id="cleanup-access-retention"
              label={t("cleanup.accessRetention")}
              help={t("cleanup.accessRetentionHelp")}
              value={settings.cleanupAccessLogRetentionDays}
              disabled={!canUpdate}
              onChange={(cleanupAccessLogRetentionDays) => patch({ cleanupAccessLogRetentionDays })}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{t("cleanup.scheduleHint")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={previewing || dirty}
              onClick={() => void refreshCleanupPreview()}
            >
              <RefreshCw className={previewing ? "animate-spin" : undefined} />
              {t("cleanup.preview")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">{t("alias.title")}</CardTitle>
          <CardDescription>{t("alias.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="aliasLength">{t("alias.length")}</Label>
            <Input
              id="aliasLength"
              type="number"
              min={3}
              max={64}
              value={settings.aliasLength}
              disabled={!canUpdate}
              onChange={(event) =>
                patch({ aliasLength: Math.max(3, Math.min(64, Number(event.target.value) || 3)) })
              }
            />
            <p className="text-xs text-muted-foreground">{t("alias.lengthHelp")}</p>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="aliasCaseSensitive">{t("alias.caseSensitive")}</Label>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("alias.caseSensitiveHelp")}
              </p>
            </div>
            <Switch
              id="aliasCaseSensitive"
              checked={settings.aliasCaseSensitive}
              disabled={!canUpdate}
              onCheckedChange={(aliasCaseSensitive) => patch({ aliasCaseSensitive })}
            />
          </div>
        </CardContent>
      </Card>

      {canUpdate ? (
        <div className="flex justify-end">
          <Button onClick={() => void save()} disabled={!dirty || saving || !prefixValid}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function CleanupRuleRow({
  id,
  title,
  description,
  enabled,
  days,
  matched,
  disabled,
  onEnabledChange,
  onDaysChange,
  countLabel,
  daysLabel,
}: {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  days: number;
  matched?: number;
  disabled: boolean;
  onEnabledChange: (value: boolean) => void;
  onDaysChange: (value: number) => void;
  countLabel: (count: number) => string;
  daysLabel: string;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={id}>{title}</Label>
          {matched !== undefined ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {countLabel(matched)}
            </span>
          ) : null}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Input
            className="w-24"
            type="number"
            min={1}
            max={3650}
            value={days}
            disabled={disabled || !enabled}
            onChange={(event) => onDaysChange(clampDays(event.target.value))}
          />
          <span className="text-sm text-muted-foreground">{daysLabel}</span>
        </div>
        <Switch id={id} checked={enabled} disabled={disabled} onCheckedChange={onEnabledChange} />
      </div>
    </div>
  );
}

function NumberSetting({
  id,
  label,
  help,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={1} max={3650} value={value} disabled={disabled} onChange={(event) => onChange(clampDays(event.target.value))} />
      <p className="text-xs leading-5 text-muted-foreground">{help}</p>
    </div>
  );
}

function clampDays(value: string) {
  return Math.max(1, Math.min(3650, Number(value) || 1));
}
function PrefixCard({
  icon: Icon,
  title,
  description,
  label,
  help,
  value,
  preview,
  disabled,
  onChange,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  label: string;
  help: string;
  value: string;
  preview: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input
            value={value}
            placeholder="Để trống"
            disabled={disabled}
            onChange={(event) => onChange(event.target.value.trim().toLowerCase())}
          />
          <p className="text-xs text-muted-foreground">{help}</p>
        </div>
        <div className="rounded-md bg-muted/40 px-3 py-2 font-mono text-xs break-all">
          {preview}
        </div>
      </CardContent>
    </Card>
  );
}
