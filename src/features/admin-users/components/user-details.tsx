"use client";

import {
  Award,
  Ban,
  CheckCircle2,
  HardDrive,
  LogIn,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  Shield,
  ShieldAlert,
  Trash2,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateAdminUserStatus,
} from "@/features/admin-users/api/users.client";
import {
  UserActionDialog,
  type UserConfirmationAction,
} from "@/features/admin-users/components/user-action-dialog";
import { UserRelatedDataTabs } from "@/features/admin-users/components/user-related-data-tabs";
import { UserStatusBadge } from "@/features/admin-users/components/user-status-badge";
import { UserSessionsCard } from "@/features/admin-users/components/user-sessions-card";
import type { AdminUserDetail, UserStatus } from "@/features/admin-users/types";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { useAuthUser } from "@/features/auth/components/auth-user-provider";

export function UserDetails({ user }: { user: AdminUserDetail }) {
  const t = useTranslations("Admin.users");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const router = useRouter();
  const currentUserId = useAuthUser().id;
  const permissions = useAdminPermissions();
  const canUpdate = permissions.includes("users.update");
  const canDelete = permissions.includes("users.delete");
  const canManageStatus = permissions.includes("users.manage-status");
  const canRevokeSessions = permissions.includes("users.revoke-sessions");
  const canImpersonate = permissions.includes("users.impersonate");
  const canViewSocialLinks = permissions.includes("links.read");
  const canViewSnippets = permissions.includes("snippets.read");
  const canViewWithdrawals = permissions.includes("withdrawals.read");
  const canViewAccessLogs = permissions.includes("stu_access_logs.view");
  const isSelf = user.id === currentUserId;
  const [action, setAction] = React.useState<UserConfirmationAction | null>(
    null,
  );
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  async function changeStatus(status: UserStatus) {
    setUpdatingStatus(true);
    try {
      await updateAdminUserStatus(user.id, status);
      toast.success(t("table.toast.statusUpdated"));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("table.toast.statusUpdateFailed"),
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  const deleting = action?.type === "delete";
  const showImpersonate =
    canImpersonate &&
    !isSelf &&
    user.status === "active" &&
    !user.permissions.includes("admin.access");
  const showStatusActions = canManageStatus && !isSelf;
  const showDelete = canDelete && !isSelf;
  const hasMoreActions =
    canViewAccessLogs || showImpersonate || showStatusActions || showDelete;

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-6">
        <AdminPageHeader
          title={user.name}
          description={user.email}
          breadcrumbs={[
            { label: t("details.breadcrumbs.dashboard"), href: "/admin" },
            { label: t("details.breadcrumbs.users"), href: "/admin/users" },
            { label: user.name },
          ]}
          leading={
            <Avatar className="size-12 rounded-xl border">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="rounded-xl">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          }
          meta={
            <>
              <UserStatusBadge status={user.status} />
              {isSelf ? <Badge variant="outline">{t("table.you")}</Badge> : null}
            </>
          }
          actions={
            <>
              {canUpdate ? (
                <Button asChild>
                  <Link href={`/admin/users/${user.id}/edit`}>
                    <Pencil /> {tc("edit")}
                  </Link>
                </Button>
              ) : null}
              {hasMoreActions ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={tc("actions")}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-52">
                    {canViewAccessLogs ? (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}/access-analysis`}>
                          <ShieldAlert /> {t("details.actions.trafficAnalysis")}
                        </Link>
                      </DropdownMenuItem>
                    ) : null}
                    {showImpersonate ? (
                      <DropdownMenuItem
                        onSelect={() =>
                          setAction({ type: "impersonate", users: [user] })
                        }
                      >
                        <LogIn /> {t("table.actions.impersonate")}
                      </DropdownMenuItem>
                    ) : null}
                    {showStatusActions ? (
                      <>
                        {canViewAccessLogs || showImpersonate ? (
                          <DropdownMenuSeparator />
                        ) : null}
                        {user.status === "active" ? (
                          <>
                            <DropdownMenuItem
                              disabled={updatingStatus}
                              onSelect={() => void changeStatus("suspended")}
                            >
                              <PauseCircle /> {t("table.actions.suspend")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={updatingStatus}
                              onSelect={() => void changeStatus("banned")}
                            >
                              <Ban /> {t("table.actions.ban")}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            disabled={updatingStatus}
                            onSelect={() => void changeStatus("active")}
                          >
                            <CheckCircle2 /> {t("table.actions.activate")}
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : null}
                    {showDelete ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() =>
                            setAction({ type: "delete", users: [user] })
                          }
                        >
                          <Trash2 /> {t("table.actions.deleteUser")}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            icon={WalletCards}
            label={t("details.summary.balance")}
            value={formatMoney(user.balance, locale)}
            description={t("details.summary.withdrawalsCount", {
              count: user.withdrawalsCount,
            })}
          />
          <SummaryMetric
            icon={Award}
            label={t("details.summary.currentTier")}
            value={user.loyaltyTier?.name || t("details.summary.noTier")}
            description={t("details.summary.tierProgress", {
              views: user.loyaltyCurrentValue.toLocaleString(locale),
              days: user.loyaltyWindowDays,
            })}
          />
          <SummaryMetric
            icon={Zap}
            label={t("table.columns.monetizationLevel")}
            value={
              user.monetizationLevel?.name || t("table.notConfigured")
            }
            description={
              user.usesDefaultMonetizationLevel
                ? t("details.summary.usingDefault")
                : t("details.summary.customAssigned")
            }
          />
          <SummaryMetric
            icon={HardDrive}
            label={t("details.summary.storage")}
            value={formatBytes(user.storage.usedBytes, locale)}
            description={
              user.storage.limitBytes
                ? t("details.summary.storageLimit", {
                    limit: formatBytes(user.storage.limitBytes, locale),
                  })
                : t("details.summary.storageDefault")
            }
          />
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("details.profile.title")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <DetailRow
                label={t("details.profile.userId")}
                value={String(user.id)}
              />
              <DetailRow
                label={tc("createdAt")}
                value={formatTimestamp(user.createdAt, locale)}
              />
              <DetailRow
                label={t("table.columns.updated")}
                value={formatTimestamp(user.updatedAt, locale)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("details.access.title")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <div className="flex items-start justify-between gap-6 pb-3">
                <span className="text-sm text-muted-foreground">
                  {t("details.access.rolesCount")}
                </span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {user.roles.length ? (
                    user.roles.map((role) => (
                      <Badge key={role.id} variant="secondary">
                        <Shield className="size-3" /> {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm font-medium">{tc("none")}</span>
                  )}
                </div>
              </div>
              <DetailRow
                label={t("details.access.effectivePermissions")}
                value={String(user.permissions.length)}
              />
              {user.directPermissions.length ? (
                <p className="pt-3 text-xs leading-5 text-muted-foreground">
                  {t("details.access.directPermissions", {
                    count: user.directPermissions.length,
                  })}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("details.referral.title")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <DetailRow
                label={t("details.referral.code")}
                value={user.referralCode || t("details.referral.noCode")}
              />
              <DetailRow
                label={t("details.referral.referredBy")}
                value={user.referrer?.name || tc("none")}
              />
              <div className="flex items-start justify-between gap-6 pt-3">
                <span className="text-sm text-muted-foreground">
                  {t("details.referral.linkedAccounts")}
                </span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {user.socialAccounts.length ? (
                    user.socialAccounts.map((account) => (
                      <Badge key={account.id} variant="outline">
                        {formatProvider(account.provider)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm font-medium">{tc("none")}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <UserRelatedDataTabs
          user={user}
          permissions={{
            links: canViewSocialLinks,
            snippets: canViewSnippets,
            withdrawals: canViewWithdrawals,
            accessLogs: canViewAccessLogs,
          }}
        />

        {canRevokeSessions ? (
          <UserSessionsCard
            userId={user.id}
            userName={user.name}
            isSelf={isSelf}
          />
        ) : null}

      </div>

      <UserActionDialog
        action={action}
        onOpenChange={() => setAction(null)}
        onSuccess={() => {
          if (deleting) {
            router.replace("/admin/users");
          } else {
            router.refresh();
          }
        }}
      />
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-right font-medium text-sm">{value}</span>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="@container/stat h-full gap-4 border-border/70 py-5 shadow-none">
      <CardHeader className="gap-2 px-5">
        <CardDescription className="font-medium">{label}</CardDescription>
        <CardTitle
          className="truncate text-2xl font-semibold tracking-[-0.03em] tabular-nums @[250px]/stat:text-3xl"
          title={value}
        >
          {value}
        </CardTitle>
        <CardAction>
          <span className="grid size-9 place-items-center rounded-lg border bg-muted/30 text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </CardAction>
      </CardHeader>
      <CardFooter className="mt-auto px-5 text-xs leading-5 text-muted-foreground">
        {description}
      </CardFooter>
    </Card>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function formatTimestamp(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: string, locale: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatBytes(value: string, locale: string) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const amount = bytes / 1024 ** index;
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: amount >= 10 ? 0 : 1,
  }).format(amount)} ${units[index]}`;
}

function formatProvider(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
