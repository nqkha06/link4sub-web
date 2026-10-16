"use client";

import * as React from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { checkEmailConnection, getEmailSettings } from "../api/emails.client";
import type { EmailSettings } from "../types";
import { EmailEmptyState, EmailStatusBadge } from "./email-ui";

export function EmailSettingsTab({ onUpdated }: { onUpdated: () => void }) {
  const t = useTranslations("Admin.emails");
  const permissions = useAdminPermissions();
  const [settings, setSettings] = React.useState<EmailSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [checking, setChecking] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { setSettings(await getEmailSettings()); }
    catch (error) { toast.error(error instanceof Error ? error.message : t("settings.loadError")); }
    finally { setLoading(false); }
  }, [t]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function checkConnection() {
    setChecking(true);
    try {
      const health = await checkEmailConnection();
      setSettings((current) => current ? { ...current, providerStatus: health.status, providerHealth: health } : current);
      if (health.status === "configured") toast.success(health.message);
      else toast.warning(health.message);
      onUpdated();
    } catch (error) { toast.error(error instanceof Error ? error.message : t("settings.checkError")); }
    finally { setChecking(false); }
  }

  if (loading) return <div className="flex h-52 items-center justify-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>;
  if (!settings) return <EmailEmptyState title={t("settings.loadFailedTitle")} description={t("settings.loadFailedDescription")} warning action={<Button onClick={() => void load()}><RefreshCw />{t("settings.retry")}</Button>} />;

  const isSmtp = settings.provider === "smtp";
  const health = settings.providerHealth;
  return (
    <div className="space-y-5">
      <div><h2 className="text-lg font-semibold">{t("settings.title")}</h2><p className="text-sm text-muted-foreground">{t.rich("settings.subtitle", { code: (chunks) => <code>{chunks}</code> })}</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("settings.provider")}</CardTitle><CardDescription>{t.rich("settings.providerHint", { code: (chunks) => <code>{chunks}</code> })}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4"><span className="font-medium">{isSmtp ? "SMTP" : "Amazon SES"}</span><EmailStatusBadge status={health.status} /></div>
            <p className="text-sm text-muted-foreground">{health.message}</p>
            <p className="text-xs text-muted-foreground">{isSmtp ? t("settings.smtpRequirements") : t("settings.sesRequirements")}</p>
            {permissions.includes("emails.settings.update") ? <Button variant="outline" onClick={() => void checkConnection()} disabled={checking}>{checking ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}{isSmtp ? t("settings.checkConnection") : t("settings.checkConfig")}</Button> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("settings.sender")}</CardTitle><CardDescription>{t("settings.senderDescription")}</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t("settings.fromLabel")}</span> <span className="font-medium">{settings.sender ? `${settings.sender.displayName ? `${settings.sender.displayName} ` : ""}<${settings.sender.emailAddress}>` : t("settings.mailFromMissing")}</span></div>
            <div><span className="text-muted-foreground">{t("settings.replyToLabel")}</span> <span className="font-medium">{settings.sender?.replyToEmail || t("settings.replyToDefault")}</span></div>
            <p className="text-xs text-muted-foreground">{t.rich("settings.senderHint", { code: (chunks) => <code>{chunks}</code> })}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
