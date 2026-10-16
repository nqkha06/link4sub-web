"use client";

import {
  KeyRound,
  Laptop,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAdminUserSessions,
  revokeAdminUserSession,
  revokeAdminUserSessions,
} from "@/features/admin-users/api/users.client";
import type { AdminUserSession } from "@/features/admin-users/types";

export function UserSessionsCard({
  userId,
  userName,
  isSelf,
}: {
  userId: number;
  userName: string;
  isSelf: boolean;
}) {
  const t = useTranslations("Admin.users.sessions");
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const [sessions, setSessions] = React.useState<AdminUserSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedSession, setSelectedSession] =
    React.useState<AdminUserSession | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = React.useState(false);
  const [revoking, setRevoking] = React.useState(false);

  const loadSessions = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSessions(await getAdminUserSessions(userId));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  React.useEffect(() => {
    let cancelled = false;
    getAdminUserSessions(userId)
      .then((response) => {
        if (!cancelled) setSessions(response);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("loadFailed"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, t]);

  async function revokeSelectedSession() {
    if (!selectedSession) return;
    setRevoking(true);
    try {
      const result = await revokeAdminUserSession(userId, selectedSession.id);
      toast.success(
        result.revoked
          ? t("toast.revoked")
          : t("toast.alreadyExpired"),
      );
      setSelectedSession(null);
      await loadSessions();
      router.refresh();
    } catch (revokeError) {
      toast.error(
        revokeError instanceof Error
          ? revokeError.message
          : t("toast.revokeFailed"),
      );
    } finally {
      setRevoking(false);
    }
  }

  async function revokeAllSessions() {
    setRevoking(true);
    try {
      const result = await revokeAdminUserSessions(userId);
      toast.success(t("toast.revokedAll", { count: result.revokedSessions }));
      setRevokeAllOpen(false);
      await loadSessions();
      router.refresh();
    } catch (revokeError) {
      toast.error(
        revokeError instanceof Error
          ? revokeError.message
          : t("toast.revokeAllFailed"),
      );
    } finally {
      setRevoking(false);
    }
  }

  const activeSessions = sessions.filter(
    (session) => session.status === "active",
  );
  const inactiveSessions = sessions.filter(
    (session) => session.status !== "active",
  );

  return (
    <>
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{t("title")}</CardTitle>
              {!loading ? (
                <Badge variant="secondary">
                  {t("activeBadge", { count: activeSessions.length })}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadSessions()}
              disabled={loading || revoking}
            >
              <RefreshCw className={loading ? "animate-spin" : undefined} />
              {tc("refresh")}
            </Button>
            {!isSelf && activeSessions.length > 0 ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setRevokeAllOpen(true)}
                disabled={revoking}
              >
                <LogOut /> {t("signOutAll")}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void loadSessions()}>
                {tc("retry")}
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
              <KeyRound className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("empty")}
              </p>
            </div>
          ) : (
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  {t("tabs.active", { count: activeSessions.length })}
                </TabsTrigger>
                <TabsTrigger value="history">
                  {t("tabs.history", { count: inactiveSessions.length })}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <SessionList
                  sessions={activeSessions}
                  emptyText={t("emptyActive")}
                  disabled={revoking}
                  onRevoke={setSelectedSession}
                />
              </TabsContent>
              <TabsContent value="history">
                <SessionList
                  sessions={inactiveSessions}
                  emptyText={t("emptyHistory")}
                  disabled={revoking}
                  onRevoke={setSelectedSession}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(selectedSession)}
        onOpenChange={(open) => !open && !revoking && setSelectedSession(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("revokeOne.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("revokeOne.description", {
                device: selectedSession
                  ? describeUserAgent(selectedSession.userAgent, t)
                  : t("revokeOne.selectedDevice"),
                userName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revoking}
              onClick={(event) => {
                event.preventDefault();
                void revokeSelectedSession();
              }}
            >
              {revoking ? <LoaderCircle className="animate-spin" /> : <LogOut />}
              {t("signOut")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={revokeAllOpen}
        onOpenChange={(open) => !revoking && setRevokeAllOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("revokeAll.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("revokeAll.description", {
                count: activeSessions.length,
                userName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revoking}
              onClick={(event) => {
                event.preventDefault();
                void revokeAllSessions();
              }}
            >
              {revoking ? <LoaderCircle className="animate-spin" /> : <LogOut />}
              {t("signOutAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SessionList({
  sessions,
  emptyText,
  disabled,
  onRevoke,
}: {
  sessions: AdminUserSession[];
  emptyText: string;
  disabled: boolean;
  onRevoke: (session: AdminUserSession) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  const content = (
    <div className="divide-y rounded-lg border">
      {sessions.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          disabled={disabled}
          onRevoke={() => onRevoke(session)}
        />
      ))}
    </div>
  );

  return sessions.length > 5 ? (
    <ScrollArea className="h-[32rem] pe-3">{content}</ScrollArea>
  ) : (
    content
  );
}

function SessionRow({
  session,
  disabled,
  onRevoke,
}: {
  session: AdminUserSession;
  disabled: boolean;
  onRevoke: () => void;
}) {
  const t = useTranslations("Admin.users.sessions");
  const locale = useLocale();
  const active = session.status === "active";

  return (
    <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <SessionDeviceIcon userAgent={session.userAgent} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-sm">
              {describeUserAgent(session.userAgent, t)}
            </p>
            {session.isCurrent ? (
              <Badge variant="outline">{t("current")}</Badge>
            ) : null}
            <SessionStatusBadge status={session.status} />
            <Badge variant="secondary">
              {session.authMethod === "google" ? "Google" : t("authPassword")}
            </Badge>
          </div>
          <p className="break-all text-xs text-muted-foreground" title={session.userAgent || undefined}>
            {t("row.ipLastActive", {
              ip: session.ipAddress || t("row.unknownIp"),
              time: formatTimestamp(session.lastActiveAt, locale),
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("row.signedInExpires", {
              signedIn: formatTimestamp(session.createdAt, locale),
              expires: formatTimestamp(session.expiresAt, locale),
            })}
          </p>
        </div>
      </div>
      {active ? (
        <Button
          variant="outline"
          size="sm"
          className="self-end md:self-auto"
          onClick={onRevoke}
          disabled={disabled || session.isCurrent}
          title={session.isCurrent ? t("row.cannotRevokeCurrent") : undefined}
        >
          <LogOut /> {t("signOut")}
        </Button>
      ) : null}
    </div>
  );
}

function SessionStatusBadge({ status }: { status: AdminUserSession["status"] }) {
  const t = useTranslations("Admin.users.sessions");
  if (status === "active") return <Badge>{t("status.active")}</Badge>;
  if (status === "revoked") {
    return <Badge variant="destructive">{t("status.revoked")}</Badge>;
  }
  return <Badge variant="outline">{t("status.expired")}</Badge>;
}

function describeUserAgent(
  userAgent: string | null,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (!userAgent) return t("device.unknown");
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Firefox\//.test(userAgent)
      ? "Firefox"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : t("device.otherBrowser");
  const platform = /iPhone/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent)
      ? "iPad"
      : /Android/.test(userAgent)
        ? "Android"
        : /Windows/.test(userAgent)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(userAgent)
            ? "macOS"
            : /Linux/.test(userAgent)
              ? "Linux"
              : t("device.unknownPlatform");
  return t("device.browserOnPlatform", { browser, platform });
}

function SessionDeviceIcon({ userAgent }: { userAgent: string | null }) {
  const className = "size-5 text-muted-foreground";
  if (userAgent && /iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) {
    return <Tablet className={className} />;
  }
  if (userAgent && /Mobile|iPhone|Android/i.test(userAgent)) {
    return <Smartphone className={className} />;
  }
  return <Laptop className={className} />;
}

function formatTimestamp(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
