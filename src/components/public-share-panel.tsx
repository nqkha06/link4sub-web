"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Link as LinkIcon, Mail, MoreHorizontal, Share2, X as CloseIcon } from "lucide-react";
import { SiFacebook, SiTelegram, SiWhatsapp, SiX } from "@icons-pack/react-simple-icons";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeaderVariant = "default" | "linear" | "bio";

function buildShareTargets(url: string, text: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return [
    {
      key: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      badgeClassName: "bg-black",
      Icon: SiX,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      badgeClassName: "bg-[#0866FF]",
      Icon: SiFacebook,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      badgeClassName: "bg-[#25D366]",
      Icon: SiWhatsapp,
    },
    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      badgeClassName: "bg-[#26A5E4]",
      Icon: SiTelegram,
    },
  ] as const;
}

export function PublicSharePanel({
  variant,
  onShare,
}: {
  variant: HeaderVariant;
  onShare?: () => void | Promise<void>;
}) {
  const publicT = useTranslations("PublicLink");
  const [open, setOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const copyLink = async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API can be unavailable — silently ignore.
    }
  };

  const shareMore = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        if (onShare) {
          await onShare();
          return;
        }
        await navigator.share({ title: pageTitle, url: pageUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }
    await copyLink();
  };

  const shareTargets = buildShareTargets(pageUrl, pageTitle);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setPageUrl(window.location.href);
          setPageTitle(document.title || "");
          setCopied(false);
          setOpen(true);
        }}
        aria-label={publicT("sharePage")}
        className={
          variant === "bio"
            ? "size-11 rounded-2xl border border-[color:var(--bio-surface-border,var(--border))] bg-[color:var(--bio-surface-bg,var(--background))] p-0 text-[color:var(--bio-text,var(--foreground))] shadow-sm backdrop-blur-md transition-transform hover:scale-[1.03] hover:bg-[color:var(--bio-surface-bg,var(--background))] hover:text-[color:var(--bio-text,var(--foreground))]"
            : variant === "linear"
            ? "h-9 gap-2 rounded-lg border border-border bg-card/90 px-2.5 text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-foreground dark:border-white/10 dark:bg-[#0f1011] dark:text-[#d0d6e0] dark:hover:bg-[#18191a] dark:hover:text-white"
            : "h-10 gap-2 rounded-xl px-2.5 text-[color:var(--bio-muted-text,var(--muted-foreground))] shadow-none transition-colors hover:bg-[color:var(--bio-accent)]/10 hover:text-[color:var(--bio-text,var(--foreground))]"
        }
      >
        <Share2 className="size-4" />
        {variant === "bio" ? null : (
          <span className="hidden text-xs font-medium md:inline">{publicT("sharePage")}</span>
        )}
      </Button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="public-share-panel-heading"
                className="relative max-h-[85dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-b-0 border-border bg-popover p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-popover-foreground shadow-2xl sm:max-w-sm sm:rounded-3xl sm:border-b sm:pb-5"
              >
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CloseIcon className="size-4" />
                </button>

                <h2 id="public-share-panel-heading" className="pr-8 text-base font-semibold text-foreground">
                  Chia sẻ
                </h2>

                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="mt-4 flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background text-muted-foreground">
                    <LinkIcon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{pageUrl}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
                    {copied ? <Check className="size-3.5" /> : null}
                    {copied ? "Đã sao chép" : "Sao chép"}
                  </span>
                </button>

                <p className="mt-5 text-xs font-medium text-muted-foreground">Chia sẻ đến</p>
                <div className="mt-2.5 grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {shareTargets.map(({ key, label, href, badgeClassName, Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                      className="flex min-w-0 flex-col items-center gap-1.5 text-center"
                    >
                      <span className={cn("grid size-11 place-items-center rounded-full shadow-sm", badgeClassName)}>
                        <Icon size={20} color="#fff" />
                      </span>
                      <span className="w-full truncate text-[11px] font-medium text-muted-foreground">{label}</span>
                    </a>
                  ))}

                  <a
                    href={`mailto:?subject=${encodeURIComponent(pageTitle)}&body=${encodeURIComponent(pageUrl)}`}
                    aria-label="Email"
                    title="Email"
                    className="flex min-w-0 flex-col items-center gap-1.5 text-center"
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                      <Mail className="size-[18px]" />
                    </span>
                    <span className="w-full truncate text-[11px] font-medium text-muted-foreground">Email</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => void shareMore()}
                    aria-label="Thêm tùy chọn chia sẻ"
                    title="Thêm"
                    className="flex min-w-0 flex-col items-center gap-1.5 text-center"
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                      <MoreHorizontal className="size-[18px]" />
                    </span>
                    <span className="w-full truncate text-[11px] font-medium text-muted-foreground">Thêm</span>
                  </button>
                </div>

                <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/25 p-3.5">
                  <p className="text-xs font-semibold text-foreground">Tạo trang Link-in-bio miễn phí của bạn</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    Một trang chia sẻ như thế này, cho link riêng của bạn — sẵn sàng chỉ trong vài giây.
                  </p>
                  <a
                    href="/member/create"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Tạo link của bạn
                  </a>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
