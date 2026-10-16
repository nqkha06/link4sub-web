"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, Mail, Send, Settings2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { getEmailSettings } from "../api/emails.client";
import type { EmailSettings } from "../types";
import { EmailActivityTab } from "./email-activity";
import { EmailSettingsTab } from "./email-settings";
import { EmailStatusBadge } from "./email-ui";
import { EmailTemplatesTab, QuickTestEmailDialog } from "./email-templates";

const tabs = [
  { value: "settings", labelKey: "operations.tabs.settings", icon: Settings2, permissions: ["emails.read", "emails.settings.update"] },
  { value: "templates", labelKey: "operations.tabs.templates", icon: Mail, permissions: ["emails.templates.read", "emails.templates.create", "emails.templates.update"] },
  { value: "activity", labelKey: "operations.tabs.activity", icon: Activity, permissions: ["emails.logs.read"] },
] as const;

export function EmailOperationsCenter() {
  const t = useTranslations("Admin.emails");
  const permissions = useAdminPermissions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const availableTabs = tabs.filter((tab) => tab.permissions.some((permission) => permissions.includes(permission)));
  const requested = searchParams.get("tab");
  const activeTab = availableTabs.find((tab) => tab.value === requested)?.value || availableTabs[0]?.value || "settings";
  const [settings, setSettings] = React.useState<EmailSettings | null>(null);
  const [quickTestOpen, setQuickTestOpen] = React.useState(false);

  const reload = React.useCallback(() => {
    if (!permissions.includes("emails.read")) return;
    void getEmailSettings().then(setSettings).catch(() => setSettings(null));
  }, [permissions]);

  React.useEffect(() => {
    const timeout = window.setTimeout(reload, 0);
    return () => window.clearTimeout(timeout);
  }, [reload]);

  function changeTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "settings") params.delete("tab");
    else params.set("tab", value);
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  const provider = settings?.provider === "amazon_ses" ? "Amazon SES" : "SMTP";
  const status = settings?.providerStatus || "incomplete";

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-8">
      <AdminPageHeader
        title={t("operations.title")}
        description={t("operations.description")}
        meta={settings ? <div className="flex flex-wrap items-center gap-2"><EmailStatusBadge status={status} label={`${provider}: ${status === "configured" ? t("operations.configured") : t("operations.notReady")}`} /><span className="text-sm text-muted-foreground">{t("operations.from", { email: settings.sender?.emailAddress || t("operations.notConfigured") })}</span></div> : null}
        actions={permissions.includes("emails.test.send") ? <Button variant="outline" onClick={() => setQuickTestOpen(true)}><Send />{t("operations.sendTest")}</Button> : null}
      />
      <Tabs value={activeTab} onValueChange={changeTab}>
        <div className="overflow-x-auto border-b">
          <TabsList variant="line" className="h-11 min-w-max justify-start bg-transparent p-0">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return <TabsTrigger key={tab.value} value={tab.value} className="h-11"><Icon />{t(tab.labelKey)}</TabsTrigger>;
            })}
          </TabsList>
        </div>
        <TabsContent value="templates" className="mt-6"><EmailTemplatesTab /></TabsContent>
        <TabsContent value="activity" className="mt-6"><EmailActivityTab /></TabsContent>
        <TabsContent value="settings" className="mt-6"><EmailSettingsTab onUpdated={reload} /></TabsContent>
      </Tabs>
      <QuickTestEmailDialog open={quickTestOpen} onOpenChange={setQuickTestOpen} />
    </div>
  );
}
