"use client";

import {
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  Database,
  FileText,
  Files,
  Globe2,
  LifeBuoy,
  Link2,
  Network,
  ReceiptText,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminUserDetail } from "@/features/admin-users/types";

type RelatedDataPermissions = {
  links: boolean;
  snippets: boolean;
  withdrawals: boolean;
  accessLogs: boolean;
};

export function UserRelatedDataTabs({
  user,
  permissions,
}: {
  user: AdminUserDetail;
  permissions: RelatedDataPermissions;
}) {
  const t = useTranslations("Admin.users.related");
  const { formatNumber, formatDate, formatMoney, formatBytes, formatCompactNumber } = useFormatters();
  const counts = user.relationshipCounts;

  const tabs: Array<{
    value: string;
    label: string;
    icon: LucideIcon;
    count: number;
    content: ReactNode;
  }> = [
    {
      value: "links",
      label: t("tabs.links"),
      icon: Link2,
      count: counts.links,
      content: (
        <PreviewPanel
          title={t("links.title")}
          total={counts.links}
          href={permissions.links ? `/admin/social-links?userId=${user.id}` : undefined}
          empty={t("links.empty")}
        >
          {user.recentData.links.map((item) => (
            <PreviewRow
              key={item.id}
              title={item.title}
              subtitle={`/l/${item.slug}`}
              badge={statusLabel(item.status, t)}
              meta={[
                t("links.views", { count: item.views }),
                t("links.actions", { count: item.actionsCount }),
                formatMoney(item.revenue, "USD"),
                formatDate(item.createdAt),
              ]}
              action={
                <Button variant="ghost" size="icon-sm" asChild>
                  <a href={`/l/${item.slug}`} target="_blank" rel="noreferrer" aria-label={t("openAria", { title: item.title })}>
                    <ArrowUpRight />
                  </a>
                </Button>
              }
            />
          ))}
        </PreviewPanel>
      ),
    },
    {
      value: "snippets",
      label: t("tabs.snippets"),
      icon: FileText,
      count: counts.snippets,
      content: (
        <PreviewPanel
          title={t("snippets.title")}
          total={counts.snippets}
          href={permissions.snippets ? `/admin/snippets?userId=${user.id}` : undefined}
          empty={t("snippets.emptyList")}
        >
          {user.recentData.snippets.map((item) => (
            <PreviewRow
              key={item.id}
              title={item.name}
              subtitle={compactText(item.content, t)}
              meta={[`#${item.id}`, formatDate(item.createdAt)]}
            />
          ))}
        </PreviewPanel>
      ),
    },
    {
      value: "bio-pages",
      label: t("tabs.bioPages"),
      icon: Globe2,
      count: counts.bioPages,
      content: (
        <PreviewPanel
          title={t("bioPages.title")}
          total={counts.bioPages}
          href="/admin/bio-pages"
          empty={t("bioPages.empty")}
        >
          {user.recentData.bioPages.map((item) => (
            <PreviewRow
              key={item.id}
              title={item.title || item.name}
              subtitle={`/b/${item.slug}`}
              badge={statusLabel(item.status, t)}
              meta={[
                t("links.views", { count: item.views }),
                t("bioPages.clicks", { count: item.clicks }),
                t("updatedOn", { date: formatDate(item.updatedAt) }),
              ]}
              action={
                <Button variant="ghost" size="icon-sm" asChild>
                  <a href={`/b/${item.slug}`} target="_blank" rel="noreferrer" aria-label={t("openAria", { title: item.title || item.name })}>
                    <ArrowUpRight />
                  </a>
                </Button>
              }
            />
          ))}
        </PreviewPanel>
      ),
    },
    {
      value: "files",
      label: t("tabs.files"),
      icon: Files,
      count: counts.files,
      content: (
        <PreviewPanel
          title={t("files.title")}
          total={counts.files}
          empty={t("files.empty")}
        >
          {user.recentData.files.map((item) => (
            <PreviewRow
              key={item.id}
              title={item.name || item.originalName}
              subtitle={item.mimeType}
              badge={statusLabel(item.status, t)}
              meta={[
                formatBytes(item.size),
                t("files.downloads", { count: item.downloadCount }),
                formatDate(item.createdAt),
              ]}
            />
          ))}
        </PreviewPanel>
      ),
    },
    {
      value: "withdrawals",
      label: t("tabs.withdrawals"),
      icon: ReceiptText,
      count: counts.withdrawals,
      content: (
        <PreviewPanel
          title={t("withdrawals.title")}
          total={counts.withdrawals}
          href={permissions.withdrawals ? `/admin/withdrawals?userId=${user.id}` : undefined}
          empty={t("withdrawals.empty")}
        >
          {user.recentData.withdrawals.map((item) => (
            <PreviewRow
              key={item.id}
              title={t("withdrawals.request", { id: item.id })}
              subtitle={t("withdrawals.netAndFee", {
                net: formatMoney(item.netAmount, item.currency),
                fee: formatMoney(item.feeAmount, item.currency),
              })}
              badge={statusLabel(item.status, t)}
              meta={[
                formatMoney(item.amount, item.currency),
                item.withdrawalType === "fast"
                  ? t("withdrawals.fast")
                  : t("withdrawals.standard"),
                formatDate(item.createdAt),
              ]}
            />
          ))}
        </PreviewPanel>
      ),
    },
    {
      value: "payment-methods",
      label: t("tabs.paymentMethods"),
      icon: CreditCard,
      count: counts.paymentMethods,
      content: (
        <PreviewPanel
          title={t("paymentMethods.title")}
          total={counts.paymentMethods}
          empty={t("paymentMethods.empty")}
        >
          {user.paymentMethods.map((item) => (
            <PreviewRow
              key={item.id}
              title={item.name}
              subtitle={
                item.details.length
                  ? item.details.map((detail) => `${detail.label}: ${detail.value}`).join(" · ")
                  : t("paymentMethods.noDetails")
              }
              badge={statusLabel(item.status, t)}
              meta={[`#${item.id}`, t("updatedOn", { date: formatDate(item.updatedAt) })]}
            />
          ))}
        </PreviewPanel>
      ),
    },
    {
      value: "referrals",
      label: t("tabs.referrals"),
      icon: UserPlus,
      count: counts.referrals,
      content: (
        <PreviewPanel
          title={t("referrals.title")}
          total={counts.referrals}
          href="/admin/users"
          empty={t("referrals.empty")}
        >
          {user.recentData.referrals.map((item) => (
            <PreviewRow
              key={item.id}
              title={item.name}
              subtitle={item.email}
              badge={statusLabel(item.status, t)}
              meta={[t("referrals.userId", { id: item.id }), formatDate(item.createdAt)]}
              action={
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link href={`/admin/users/${item.id}`} aria-label={t("referrals.viewAria", { name: item.name })}>
                    <ArrowUpRight />
                  </Link>
                </Button>
              }
            />
          ))}
        </PreviewPanel>
      ),
    },
    {
      value: "commissions",
      label: t("tabs.commissions"),
      icon: Network,
      count: counts.commissions,
      content: (
        <PreviewPanel
          title={t("commissions.title")}
          total={counts.commissions}
          empty={t("commissions.empty")}
        >
          {user.recentData.commissions.map((item) => (
            <PreviewRow
              key={item.id}
              title={formatMoney(item.amount, "USD")}
              subtitle={t("commissions.from", {
                name: item.fromUser.name,
                email: item.fromUser.email,
              })}
              badge={`${formatNumber(Number(item.rate) * 100, 2)}%`}
              meta={[
                humanize(item.commissionableType),
                item.note || t("commissions.noNote"),
                formatDate(item.createdAt),
              ]}
            />
          ))}
        </PreviewPanel>
      ),
    },
    {
      value: "support",
      label: t("tabs.support"),
      icon: LifeBuoy,
      count: counts.supportTickets,
      content: (
        <PreviewPanel
          title={t("support.title")}
          total={counts.supportTickets}
          href="/admin/support"
          empty={t("support.empty")}
        >
          {user.recentData.supportTickets.map((item) => (
            <PreviewRow
              key={item.id}
              title={item.subject}
              subtitle={`${item.reference} · ${humanize(item.category)}`}
              badge={statusLabel(item.status, t)}
              meta={[
                t("support.priority", { priority: statusLabel(item.priority, t) }),
                t("updatedOn", { date: formatDate(item.lastMessageAt) }),
              ]}
            />
          ))}
        </PreviewPanel>
      ),
    },
    {
      value: "sessions",
      label: t("tabs.sessions"),
      icon: Database,
      count: counts.sessions,
      content: (
        <PreviewPanel
          title={t("sessions.title")}
          total={counts.sessions}
          href={permissions.accessLogs ? `/admin/users/${user.id}/access-analysis` : undefined}
          empty={t("sessions.empty")}
        >
          {user.recentData.sessions.map((item) => (
            <PreviewRow
              key={item.id}
              title={sessionDevice(item.userAgent, t)}
              subtitle={item.ipAddress || t("sessions.noIp")}
              badge={sessionStatus(item, t)}
              meta={[
                humanize(item.authMethod),
                t("sessions.lastActive", { date: formatDate(item.lastActiveAt) }),
                t("sessions.created", { date: formatDate(item.createdAt) }),
              ]}
            />
          ))}
        </PreviewPanel>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Tabs defaultValue="links" className="gap-0">
          <ScrollArea type="hover" className="w-full border-b">
            <div className="w-max min-w-full px-4 pb-1.5">
              <TabsList variant="line" className="h-12 min-w-max justify-start gap-1 bg-transparent p-0">
                {tabs.map(({ value, label, icon: Icon, count }) => (
                  <TabsTrigger key={value} value={value} className="h-12 gap-2 px-3">
                    <Icon />
                    {label}
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                      {formatCompactNumber(count)}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <ScrollBar
              orientation="horizontal"
              className="h-1.5 px-1 [&_[data-slot=scroll-area-thumb]]:bg-muted-foreground/30"
            />
          </ScrollArea>
          {tabs.map(({ value, content }) => (
            <TabsContent key={value} value={value} className="m-0">
              {content}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PreviewPanel({
  title,
  total,
  href,
  empty,
  children,
}: {
  title: string;
  total: number;
  href?: string;
  empty: string;
  children: ReactNode;
}) {
  const t = useTranslations("Admin.users.related");
  const { formatNumber } = useFormatters();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        {href ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href}>
              {t("viewAll", { total: formatNumber(total) })} <ArrowUpRight />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled title={t("noAdminPage")}>
            {t("viewAll", { total: formatNumber(total) })}
          </Button>
        )}
      </div>
      <div className="border-t">
        {total ? (
          <div className="divide-y">{children}</div>
        ) : (
          <div className="grid min-h-40 place-items-center px-6 py-10 text-center">
            <div>
              <CircleDollarSign className="mx-auto size-5 text-muted-foreground/60" />
              <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewRow({
  title,
  subtitle,
  badge,
  meta,
  action,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  meta: string[];
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/20">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-medium text-sm">{title}</p>
          {badge ? <Badge variant="outline" className="shrink-0">{badge}</Badge> : null}
        </div>
        {subtitle ? <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {meta.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>
      {action}
    </div>
  );
}

function createFormatters(locale: string) {
  const formatNumber = (value: number, maximumFractionDigits = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
  return {
    formatNumber,
    formatDate: (value: string) =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value)),
    formatMoney: (value: string, currency: string) => {
      const amount = Number(value);
      if (!Number.isFinite(amount)) return value;
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `${formatNumber(amount, 2)} ${currency}`;
      }
    },
    formatBytes: (bytes: number) => {
      if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
      const units = ["B", "KB", "MB", "GB", "TB"];
      const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
      return `${formatNumber(bytes / 1024 ** index, bytes >= 1024 ? 1 : 0)} ${units[index]}`;
    },
    formatCompactNumber: (value: number) =>
      new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value),
  };
}

function useFormatters() {
  const locale = useLocale();
  return useMemo(() => createFormatters(locale), [locale]);
}

type Translate = (key: string, values?: Record<string, string | number>) => string;

function compactText(value: string, t: Translate) {
  return value.replace(/\s+/g, " ").trim().slice(0, 160) || t("snippets.empty");
}

function humanize(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/^./, (character) => character.toUpperCase());
}

const STATUS_LABEL_KEYS = new Set([
  "active",
  "pending",
  "processing",
  "completed",
  "approved",
  "rejected",
  "cancelled",
  "published",
  "draft",
  "archived",
  "suspended",
  "banned",
  "submitted",
  "in_progress",
  "waiting_user",
  "answered",
  "resolved",
  "closed",
  "low",
  "normal",
  "high",
  "urgent",
]);

function statusLabel(value: string, t: Translate) {
  return STATUS_LABEL_KEYS.has(value) ? t(`statusLabels.${value}`) : humanize(value);
}

function sessionStatus(session: AdminUserDetail["recentData"]["sessions"][number], t: Translate) {
  if (session.revokedAt) return t("sessionStatus.revoked");
  if (new Date(session.expiresAt).getTime() <= Date.now()) return t("sessionStatus.expired");
  return t("sessionStatus.active");
}

function sessionDevice(userAgent: string | null, t: Translate) {
  if (!userAgent) return t("sessionDevice.unknown");
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return t("sessionDevice.mobile");
  return t("sessionDevice.desktop");
}
