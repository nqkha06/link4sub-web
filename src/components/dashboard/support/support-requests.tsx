"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  ExternalLink,
  LifeBuoy,
  LoaderCircle,
  Mail,
  MessageCircle,
  MessagesSquare,
  Search,
  SearchX,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { CopyFeedbackIcon } from "@/components/copy-feedback-icon";
import {
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiTelegram,
  SiTiktok,
  SiX,
  SiYoutube,
  SiZalo,
} from "@icons-pack/react-simple-icons";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/member/fields/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/member/fields/textarea";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";

import type { WebsiteSocialLink } from "@/features/site-settings/types";

import type {
  SupportAttachment,
  SupportRequest,
  SupportRequestStatus,
} from "./types";
import type {
  SupportController,
  SupportTicketFilter,
} from "./use-support-controller";
import { useFormatSupportDate } from "./use-support-controller";

/* -------------------------------------------------------------------------- */
/*                                   Status                                   */
/* -------------------------------------------------------------------------- */

const statusConfig: Record<
  SupportRequestStatus,
  {
    icon: typeof Clock3;
    className: string;
  }
> = {
  submitted: {
    icon: Send,
    className: "bg-muted text-muted-foreground",
  },
  in_progress: {
    icon: Clock3,
    className: "bg-info/10 text-info",
  },
  waiting_user: {
    icon: MessageCircle,
    className: "bg-warning/10 text-warning",
  },
  answered: {
    icon: MessagesSquare,
    className: "bg-primary/10 text-primary",
  },
  resolved: {
    icon: CheckCircle2,
    className: "bg-success/10 text-success",
  },
  closed: {
    icon: CircleDot,
    className: "bg-muted text-muted-foreground",
  },
};

export function SupportStatusBadge({
  status,
}: {
  status: SupportRequestStatus;
}) {
  const t = useTranslations("Support.status");
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-6 gap-1.5 rounded-full border-0 px-2.5 text-[11px] font-medium whitespace-nowrap shadow-none",
        config.className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {t(status)}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Contact channels                              */
/* -------------------------------------------------------------------------- */

// `color: null` = icon đơn sắc, đi theo màu chữ để đọc được ở cả light/dark.
const socialChannelMeta: Partial<
  Record<
    WebsiteSocialLink["platform"],
    { label: string; Icon: typeof SiX; color: string | null }
  >
> = {
  x: { label: "X (Twitter)", Icon: SiX, color: null },
  facebook: { label: "Facebook", Icon: SiFacebook, color: "#0866FF" },
  tiktok: { label: "TikTok", Icon: SiTiktok, color: null },
  zalo: { label: "Zalo", Icon: SiZalo, color: "#0068FF" },
  youtube: { label: "YouTube", Icon: SiYoutube, color: "#FF0000" },
  instagram: { label: "Instagram", Icon: SiInstagram, color: "#E4405F" },
  telegram: { label: "Telegram", Icon: SiTelegram, color: "#26A5E4" },
  discord: { label: "Discord", Icon: SiDiscord, color: "#5865F2" },
  github: { label: "GitHub", Icon: SiGithub, color: null },
};

function ChannelIconLink({
  href,
  external,
  label,
  title,
  children,
}: {
  href: string;
  external?: boolean;
  label: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={title ?? label}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "grid size-10 place-items-center rounded-lg border border-border bg-background text-foreground",
        "transition-colors hover:bg-muted/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {children}
    </a>
  );
}

export function SupportContactChannels({
  email,
  workingHours,
  socialLinks = [],
}: {
  email?: string | null;
  workingHours?: string | null;
  socialLinks?: WebsiteSocialLink[];
}) {
  const t = useTranslations("Support.channels");
  const activeSocialLinks = socialLinks
    .filter((link) => link.isActive && socialChannelMeta[link.platform])
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!email && activeSocialLinks.length === 0) return null;

  return (
    <section aria-labelledby="support-channels-title" className="space-y-3">
      <p
        id="support-channels-title"
        className="text-sm leading-6 text-muted-foreground"
      >
        {t("intro")}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {email ? (
          <ChannelIconLink href={`mailto:${email}`} label={t("email")} title={email}>
            <Mail className="size-[18px]" aria-hidden />
          </ChannelIconLink>
        ) : null}

        {activeSocialLinks.map((link) => {
          const meta = socialChannelMeta[link.platform];
          if (!meta) return null;
          const Icon = meta.Icon;

          return (
            <ChannelIconLink
              key={link.platform}
              href={link.url}
              external
              label={meta.label}
            >
              <Icon size={18} color={meta.color ?? "currentColor"} aria-hidden />
            </ChannelIconLink>
          );
        })}
      </div>

      {workingHours ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="size-3.5 shrink-0" aria-hidden />
          {workingHours}
        </p>
      ) : null}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Ticket list                                 */
/* -------------------------------------------------------------------------- */

const COLLAPSED_LIMIT = 6;

const FILTERS: SupportTicketFilter[] = ["all", "active", "waiting_user", "resolved"];

function countByFilter(items: SupportRequest[]): Record<SupportTicketFilter, number> {
  return {
    all: items.length,
    active: items.filter((item) =>
      ["submitted", "in_progress", "answered"].includes(item.status),
    ).length,
    waiting_user: items.filter((item) => item.status === "waiting_user").length,
    resolved: items.filter((item) =>
      ["resolved", "closed"].includes(item.status),
    ).length,
  };
}

export function SupportTicketList({
  controller,
  embedded = false,
}: {
  controller: SupportController;
  /** Nằm trong một card khác: bỏ tiêu đề riêng và khung viền của danh sách. */
  embedded?: boolean;
}) {
  const t = useTranslations("Support");
  const [showAll, setShowAll] = useState(false);

  const allItems = useMemo(
    () => controller.data?.requests ?? [],
    [controller.data?.requests],
  );
  const counts = useMemo(() => countByFilter(allItems), [allItems]);

  // Yêu cầu đang chờ người dùng phản hồi luôn nằm trên cùng.
  const items = useMemo(
    () =>
      [...controller.filteredRequests].sort(
        (a, b) =>
          Number(b.status === "waiting_user") -
          Number(a.status === "waiting_user"),
      ),
    [controller.filteredRequests],
  );

  const collapsed = !showAll && !controller.hasFilters;
  const visibleItems = collapsed ? items.slice(0, COLLAPSED_LIMIT) : items;
  const showToolbar = allItems.length >= 4 || controller.hasFilters;

  return (
    <section
      id="support-tickets"
      aria-labelledby={embedded ? undefined : "support-tickets-title"}
      aria-label={embedded ? t("list.label") : undefined}
    >
      <div className={cn("mb-3", embedded && "hidden")}>
        <h2
          id="support-tickets-title"
          className="text-base font-semibold tracking-tight"
        >
          {t("list.label")}
        </h2>
        <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
          {t("count", { count: allItems.length })}
        </p>
      </div>

      {allItems.length === 0 ? (
        <div className={cn(embedded && "p-5 sm:p-6")}>
          <SupportEmptyState />
        </div>
      ) : (
        <div className="space-y-3">
          {showToolbar ? (
            <div
              className={cn(
                "flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between",
                embedded && "px-5 pt-4 sm:px-6",
              )}
            >
              <div
                role="group"
                aria-label={t("filters.label")}
                className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {FILTERS.map((filter) => {
                  const active = controller.statusFilter === filter;
                  const highlight =
                    filter === "waiting_user" &&
                    counts.waiting_user > 0 &&
                    !active;

                  return (
                    <button
                      key={filter}
                      type="button"
                      aria-pressed={active}
                      onClick={() => controller.setStatusFilter(filter)}
                      className={cn(
                        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      {t(`filters.${filter}`)}
                      <span
                        className={cn(
                          "tabular-nums",
                          highlight
                            ? "rounded-full bg-warning/15 px-1.5 text-warning"
                            : "opacity-70",
                        )}
                      >
                        {counts[filter]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-64">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="support-ticket-search"
                  type="search"
                  value={controller.query}
                  onChange={(event) => controller.setQuery(event.target.value)}
                  placeholder={t("list.searchPlaceholder")}
                  aria-label={t("list.searchLabel")}
                  autoComplete="off"
                  className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
                />
                {controller.query ? (
                  <button
                    type="button"
                    aria-label={t("list.clearSearch")}
                    onClick={() => controller.setQuery("")}
                    className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <p className="sr-only" role="status" aria-live="polite">
            {t("count", { count: items.length })}
          </p>

          {items.length ? (
            <Card
              className={cn(
                "gap-0 overflow-hidden rounded-xl py-0 shadow-none",
                embedded && "rounded-none border-0 bg-transparent",
              )}
            >
              <ul className="divide-y divide-border/70">
                {visibleItems.map((request) => (
                  <li key={request.id}>
                    <TicketItem
                      request={request}
                      onOpen={controller.openRequest}
                    />
                  </li>
                ))}
              </ul>

              {collapsed && items.length > COLLAPSED_LIMIT ? (
                <div className="border-t border-border/70 px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setShowAll(true)}
                  >
                    {t("list.showAll", { count: items.length })}
                    <ChevronDown className="size-4" aria-hidden />
                  </Button>
                </div>
              ) : null}
            </Card>
          ) : (
            <div className={cn(embedded && "px-5 pb-5 sm:px-6")}>
              <SupportNoResults onClear={controller.clearFilters} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function TicketItem({
  request,
  onOpen,
}: {
  request: SupportRequest;
  onOpen: (request: SupportRequest) => void;
}) {
  const t = useTranslations("Support");
  const formatDate = useFormatSupportDate();
  const needsAction = request.status === "waiting_user";

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-start gap-3 border-l-2 px-4 py-3.5 text-left sm:px-5",
        "transition-colors hover:bg-muted/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        needsAction ? "border-l-warning bg-warning/[0.04]" : "border-l-transparent",
      )}
      onClick={() => onOpen(request)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium">
            {request.subject}
          </p>

          <div className="hidden shrink-0 sm:block">
            <SupportStatusBadge status={request.status} />
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
          <span className="sm:hidden">
            <SupportStatusBadge status={request.status} />
          </span>

          <span className="font-mono text-[11px]">{request.reference}</span>
          <span aria-hidden className="text-muted-foreground/40">·</span>
          <span>{t(`categories.${request.categoryValue}`)}</span>
          <span aria-hidden className="text-muted-foreground/40">·</span>
          <time
            dateTime={request.updatedAt}
            className="tabular-nums"
            title={t("list.updatedAt")}
          >
            {formatDate(request.updatedAt)}
          </time>
        </div>
      </div>

      <ChevronRight
        aria-hidden
        className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Empty states                                */
/* -------------------------------------------------------------------------- */

export function SupportEmptyState() {
  const t = useTranslations("Support.empty");
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-lg bg-muted text-muted-foreground">
        <MessageCircle className="size-6" aria-hidden />
      </div>
      <p className="text-sm font-medium">{t("title")}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {t("description")}
      </p>
    </div>
  );
}

function SupportNoResults({ onClear }: { onClear: () => void }) {
  const t = useTranslations("Support.noResults");
  return (
    <Card className="items-center rounded-xl border-dashed px-5 py-8 text-center shadow-none">
      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-4" aria-hidden />
      </div>

      <p className="mt-3 text-sm font-medium">{t("title")}</p>

      <p className="mt-1 text-sm text-muted-foreground">
        {t("description")}
      </p>

      <Button variant="outline" size="sm" className="mt-4 shadow-none" onClick={onClear}>
        {t("clear")}
      </Button>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Ticket detail                                */
/* -------------------------------------------------------------------------- */

export function SupportRequestDetail({
  controller,
}: {
  controller: SupportController;
}) {
  const t = useTranslations("Support");
  const formatDate = useFormatSupportDate();
  const request = controller.detailRequest;

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!request) return null;

  const replyDisabled = request.status === "closed";

  const sendReply = async () => {
    if (sending) return;

    if (!reply.trim()) {
      setError(t("validation.replyRequired"));
      return;
    }

    try {
      setSending(true);
      setError("");

      await controller.reply(request.id, reply.trim());

      setReply("");
    } catch (replyError) {
      setError(
        replyError instanceof Error
          ? replyError.message
          : t("detail.replyFailed"),
      );
    } finally {
      setSending(false);
    }
  };

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(request.reference);
      toast.success(t("detail.copied"));
    } catch {
      toast.error(t("detail.copyFailed"));
    }
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !sending) {
          controller.setDetailRequest(undefined);
        }
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-5 text-left sm:px-6">
          <div className="pr-8">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <SupportStatusBadge status={request.status} />

              <button
                type="button"
                onClick={() => void copyReference()}
                aria-label={t("detail.copyReference", { reference: request.reference })}
                className="inline-flex items-center gap-1 rounded font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {request.reference}
                <CopyFeedbackIcon className="size-3" />
              </button>
            </div>

            <SheetTitle className="text-lg leading-6">
              {request.subject}
            </SheetTitle>

            <SheetDescription className="mt-1.5 leading-5">
              {t(`categories.${request.categoryValue}`)}
              <span aria-hidden className="mx-1.5 text-muted-foreground/40">·</span>
              {t("detail.createdAt", { date: formatDate(request.createdAt) })}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {request.attachments.length ? (
            <>
              <div className="px-5 py-4 sm:px-6">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t("detail.attachments")}
                </p>
                <AttachmentLinks attachments={request.attachments} />
              </div>

              <Separator />
            </>
          ) : null}

          <div className="px-5 py-6 sm:px-6">
            <SupportConversation request={request} />
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-background px-4 py-4 sm:px-6">
          {replyDisabled ? (
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              {t("detail.closed")}
            </div>
          ) : (
            <div>
              {request.status === "waiting_user" ? (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
                  <MessageCircle className="size-3.5 shrink-0" aria-hidden />
                  {t("detail.waitingYou")}
                </div>
              ) : null}

              <label htmlFor="support-reply" className="sr-only">
                {t("detail.replyLabel")}
              </label>
              <Textarea
                id="support-reply"
                value={reply}
                onChange={(event) => {
                  setReply(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    void sendReply();
                  }
                }}
                placeholder={t("detail.replyPlaceholder")}
                disabled={sending}
                className="min-h-20 resize-none sm:min-h-24"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "support-reply-error" : undefined}
              />

              {error ? (
                <p
                  id="support-reply-error"
                  role="alert"
                  className="mt-2 text-xs text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {t("detail.shortcut")}
                </p>

                <Button
                  className="w-full sm:w-auto"
                  disabled={sending || !reply.trim()}
                  onClick={() => void sendReply()}
                >
                  {sending ? (
                    <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                  ) : (
                    <Send />
                  )}

                  {sending ? t("detail.sending") : t("detail.send")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Conversation                                 */
/* -------------------------------------------------------------------------- */

export function SupportConversation({
  request,
}: {
  request: SupportRequest;
}) {
  const t = useTranslations("Support.conversation");
  const formatDate = useFormatSupportDate();
  const brand = useSiteBrand();
  const endRef = useRef<HTMLDivElement>(null);

  // Luôn cuộn tới tin nhắn mới nhất khi mở ticket hoặc có phản hồi mới.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [request.id, request.messages.length]);

  return (
    <section aria-labelledby="support-conversation-title">
      <h3
        id="support-conversation-title"
        className="text-sm font-semibold"
      >
        {t("title")}
      </h3>

      <div className="mt-5 space-y-5">
        {request.messages.map((message) => {
          const isSupport = message.senderRole === "support";

          return (
            <article
              key={message.id}
              className={cn(
                "flex gap-2.5",
                !isSupport && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  isSupport
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isSupport ? (
                  <LifeBuoy className="size-4" aria-hidden />
                ) : (
                  <UserRound className="size-4" aria-hidden />
                )}
              </div>

              <div
                className={cn(
                  "min-w-0 max-w-[85%]",
                  !isSupport && "text-right",
                )}
              >
                <div
                  className={cn(
                    "mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1",
                    !isSupport && "justify-end",
                  )}
                >
                  <span className="text-xs font-medium">
                    {isSupport
                      ? t("team", { brand: brand.siteName })
                      : t("you")}
                  </span>

                  <time
                    dateTime={message.createdAt}
                    className="text-[11px] tabular-nums text-muted-foreground"
                  >
                    {formatDate(message.createdAt)}
                  </time>
                </div>

                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-left",
                    isSupport
                      ? "rounded-tl-md bg-muted/60"
                      : "rounded-tr-md bg-primary text-primary-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {message.content}
                  </p>
                </div>

                {message.attachments?.length ? (
                  <div
                    className={cn(
                      "mt-2",
                      !isSupport && "flex justify-end",
                    )}
                  >
                    <AttachmentLinks
                      attachments={message.attachments}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div ref={endRef} aria-hidden />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Attachments                                 */
/* -------------------------------------------------------------------------- */

function AttachmentLinks({
  attachments,
}: {
  attachments: SupportAttachment[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {attachments.map((attachment) => (
        <Button
          key={attachment.id}
          asChild
          variant="outline"
          size="sm"
          className="h-8 rounded-lg bg-background text-xs shadow-none"
        >
          <a
            href={`/api/backend${attachment.downloadPath}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            <span className="max-w-48 truncate">
              {attachment.name}
            </span>
          </a>
        </Button>
      ))}
    </div>
  );
}
