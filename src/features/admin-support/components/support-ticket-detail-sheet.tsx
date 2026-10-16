"use client";

import {
  Download,
  LoaderCircle,
  MessageCircle,
  Paperclip,
  Send,
  UserCheck,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import type {
  SupportRequestStatus,
  SupportTicketPriority,
} from "@/components/dashboard/support/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import {
  replyAdminSupportTicket,
  updateAdminSupportTicket,
} from "../api/admin-support.client";
import type { AdminSupportTicket } from "../types";
import {
  formatDate,
  PRIORITY_VALUES,
  PriorityBadge,
  STATUS_VALUES,
  StatusBadge,
} from "./support-ticket-badges";

export function TicketDetailSheet({
  open,
  onOpenChange,
  ticket,
  loading,
  canReply,
  canManage,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: AdminSupportTicket;
  loading: boolean;
  canReply: boolean;
  canManage: boolean;
  onUpdated: (ticket: AdminSupportTicket) => void;
}) {
  const t = useTranslations("Admin.support");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const update = async (input: Parameters<typeof updateAdminSupportTicket>[1]) => {
    if (!ticket) return;
    try {
      setBusy(true);
      const updated = await updateAdminSupportTicket(ticket.id, input);
      onUpdated(updated);
      toast.success(t("detail.updateSuccess"));
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message || t("errors.requestFailed") : t("errors.updateFailed"));
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!ticket || !reply.trim()) return;
    try {
      setBusy(true);
      const updated = await replyAdminSupportTicket(ticket.id, reply.trim());
      setReply("");
      onUpdated(updated);
      toast.success(t("detail.replySuccess"));
    } catch (replyError) {
      toast.error(replyError instanceof Error ? replyError.message || t("errors.requestFailed") : t("errors.replyFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        {loading || !ticket ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="border-b px-5 py-5 sm:px-6">
              <div className="pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">{ticket.reference}</Badge>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <SheetTitle className="mt-3">{ticket.subject}</SheetTitle>
                <SheetDescription className="mt-1">
                  {ticket.user.name} · {ticket.user.email}
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="space-y-6 px-5 py-5 sm:px-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">{tc("status")}</p>
                  <Select
                    value={ticket.status}
                    disabled={!canManage || busy}
                    onValueChange={(value) => void update({ status: value as SupportRequestStatus })}
                  >
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_VALUES.map((item) => <SelectItem key={item} value={item}>{t(`status.${item}`)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("detail.priority")}</p>
                  <Select
                    value={ticket.priority}
                    disabled={!canManage || busy}
                    onValueChange={(value) => void update({ priority: value as SupportTicketPriority })}
                  >
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITY_VALUES.map((item) => <SelectItem key={item} value={item}>{t(`priority.${item}`)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{t("detail.assignee")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ticket.assignedTo
                      ? `${ticket.assignedTo.name} · ${ticket.assignedTo.email}`
                      : t("detail.notAssigned")}
                  </p>
                </div>
                {canManage ? (
                  ticket.assignedTo ? (
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => void update({ unassign: true })}>
                      {t("detail.unassign")}
                    </Button>
                  ) : (
                    <Button size="sm" disabled={busy} onClick={() => void update({ assignToMe: true })}>
                      <UserCheck />{t("detail.assignToMe")}
                    </Button>
                  )
                ) : null}
              </div>

              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">{t("detail.category")}</dt><dd className="mt-1 font-medium">{t(`category.${ticket.categoryValue}`)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{tc("createdAt")}</dt><dd className="mt-1 font-medium">{formatDate(ticket.createdAt, locale)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{t("detail.relatedResource")}</dt><dd className="mt-1 font-medium">{ticket.relatedResource || tc("none")}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{t("detail.attachments")}</dt><dd className="mt-1 font-medium">{ticket.attachments.length}</dd></div>
              </dl>

              {ticket.technicalInfo ? (
                <details className="rounded-lg border bg-muted/20 p-3">
                  <summary className="cursor-pointer text-sm font-medium">{t("detail.technicalInfo")}</summary>
                  <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{prettyTechnicalInfo(ticket.technicalInfo)}</pre>
                </details>
              ) : null}

              <Separator />
              <div>
                <h3 className="text-sm font-semibold">{t("detail.conversation")}</h3>
                <div className="mt-4 space-y-4">
                  {ticket.messages.map((message) => (
                    <article
                      key={message.id}
                      className={message.senderRole === "system"
                        ? "rounded-lg border border-dashed bg-muted/20 px-3 py-2"
                        : "flex gap-3"}
                    >
                      {message.senderRole !== "system" ? (
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border bg-muted/30">
                          {message.senderRole === "support" ? <MessageCircle className="size-4 text-primary" /> : <UserRound className="size-4 text-muted-foreground" />}
                        </span>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{message.sender}</span>
                          {message.isInternal ? <Badge variant="outline">{t("detail.internal")}</Badge> : null}
                          <time className="text-xs text-muted-foreground">{formatDate(message.createdAt, locale)}</time>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{message.content}</p>
                        {message.attachments?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.attachments.map((file) => (
                              <Button key={file.id} asChild variant="outline" size="sm">
                                <a href={`/api/backend${file.downloadPath}`} target="_blank" rel="noreferrer">
                                  <Paperclip />{file.name}<Download />
                                </a>
                              </Button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="space-y-2">
                <label htmlFor="admin-support-reply" className="text-sm font-medium">{t("detail.replyLabel")}</label>
                <Textarea
                  id="admin-support-reply"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  disabled={!canReply || busy || ticket.status === "closed"}
                  placeholder={ticket.status === "closed" ? t("detail.replyPlaceholderClosed") : t("detail.replyPlaceholder")}
                  className="min-h-28 resize-y"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {t("detail.replyHint", { status: t("status.waiting_user") })}
                  </p>
                  <Button disabled={!canReply || busy || !reply.trim() || ticket.status === "closed"} onClick={() => void sendReply()}>
                    {busy ? <LoaderCircle className="animate-spin" /> : <Send />}
                    {t("detail.sendReply")}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function prettyTechnicalInfo(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
