"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";

import { ShowHeader } from "@/components/show-header";
import { cn } from "@/lib/utils";

type PublicCreatorLayoutProps = {
  background?: ReactNode;
  topAction?: ReactNode;
  afterHeader?: ReactNode;
  children: ReactNode;
  variant?: "default" | "linear";

  /**
   * "column": bố cục trang bio — mobile nền phủ kín màn hình, desktop là một
   * cột bo góc ở giữa, phần ngoài cột là nền bị làm tối.
   */
  layout?: "default" | "column";

  /**
   * Nền vẽ riêng bên trong cột (desktop) khi layout="column". Bỏ trống thì
   * cột trong suốt và dùng chung lớp nền toàn màn hình (vd. nền video, để
   * không phải phát hai video cùng lúc).
   */
  columnBackground?: ReactNode;

  /**
   * Class cho vùng chứa nội dung chính.
   */
  className?: string;

  /**
   * Class cho thẻ main ngoài cùng.
   */
  rootClassName?: string;

  /**
   * Khi true, các lớp nền dự phòng (fallback) luôn dùng màu sáng cố định,
   * bỏ qua dark mode toàn app. Dùng cho trang bio công khai — nơi toàn bộ
   * màu sắc phải đồng bộ theo theme riêng của trang, không đổi theo
   * dark/light mode của trình duyệt/app.
   */
  forceLightFallback?: boolean;

  /**
   * Biến CSS (--bio-*) của theme trang bio. Được gắn lên <main> để cả
   * header (ShowHeader) lẫn nội dung bên trong đều đọc được cùng một bộ
   * màu theme — vì header là phần tử anh em (sibling) của <article>, không
   * phải hậu duệ, nên không tự thừa hưởng CSS variable đặt riêng trên
   * <article>.
   */
  themeVars?: CSSProperties;
};

async function copyTextToClipboard(
  value: string,
): Promise<void> {
  if (
    window.isSecureContext &&
    navigator.clipboard?.writeText
  ) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute(
    "aria-hidden",
    "true",
  );

  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "1px",
    height: "1px",
    padding: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy command failed");
  }
}

export function PublicCreatorLayout({
  background,
  topAction,
  afterHeader,
  children,
  className,
  rootClassName,
  variant = "default",
  layout = "default",
  columnBackground,
  forceLightFallback = false,
  themeVars,
}: PublicCreatorLayoutProps) {
  const shareCurrentLink =
    useCallback(async () => {
      const url = window.location.href;
      const title =
        document.title || "Shared link";

      if (navigator.share) {
        try {
          await navigator.share({
            title,
            url,
          });

          return;
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          /*
           * Một số trình duyệt có navigator.share
           * nhưng vẫn có thể báo lỗi.
           * Thử copy link thay vì dừng luôn.
           */
        }
      }

      try {
        await copyTextToClipboard(url);
        toast.success("Đã sao chép link");
      } catch {
        toast.error(
          "Không thể sao chép link",
        );
      }
    }, []);

  if (layout === "column") {
    return (
      <main
        style={themeVars}
        className={cn(
          "relative isolate flex min-h-[100svh] flex-col overflow-x-clip bg-slate-100 text-slate-950",
          "supports-[height:100dvh]:min-h-[100dvh]",
          rootClassName,
        )}
      >
        {/* Nền toàn màn hình: mobile hiện nguyên bản, desktop là phần ngoài cột */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
        >
          <div
            className={cn(
              "absolute inset-0",
              columnBackground && "sm:scale-110 sm:blur-2xl",
            )}
          >
            {background}
          </div>

          {columnBackground ? (
            <div className="absolute inset-0 hidden bg-black/30 sm:block" />
          ) : null}
        </div>

        <div
          className={cn(
            "relative z-10 mx-auto flex w-full flex-1 flex-col",
            "sm:mt-10 sm:max-w-[37.5rem] sm:overflow-clip sm:rounded-t-[2rem]",
            columnBackground
              ? "sm:shadow-[0_24px_80px_rgba(2,6,23,0.35)]"
              : "sm:shadow-[0_0_0_100vmax_rgba(0,0,0,0.3)]",
          )}
        >
          {/* Nền của cột: dính theo màn hình khi cuộn */}
          {columnBackground ? (
            <div
              aria-hidden="true"
              className="pointer-events-none sticky top-0 -z-10 -mb-[100vh] hidden h-screen shrink-0 overflow-hidden sm:block"
            >
              {columnBackground}
            </div>
          ) : null}

          <ShowHeader onShare={shareCurrentLink} variant="bio" />

          {afterHeader}

          <section
            className={cn(
              "flex w-full flex-1 justify-center",
              className,
            )}
          >
            {children}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      style={themeVars}
      className={cn(
        "relative isolate flex min-h-[100svh] flex-col overflow-x-clip",
        variant === "linear"
          ? forceLightFallback
            ? "bg-slate-50 text-slate-950"
            : "bg-slate-50 text-slate-950 dark:bg-[#010102] dark:text-[#f7f8f8]"
          : forceLightFallback
            ? "bg-slate-100 text-slate-950"
            : "bg-slate-100 text-slate-950 dark:bg-slate-950",
        "supports-[height:100dvh]:min-h-[100dvh]",
        rootClassName,
      )}
    >
      {/* Fallback background */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0 -z-30",
          variant === "linear"
            ? forceLightFallback
              ? "bg-slate-50"
              : "bg-slate-50 dark:bg-[#010102]"
            : forceLightFallback
              ? "bg-slate-100"
              : "bg-slate-100 dark:bg-slate-950",
        )}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      >
        {/* Background do page truyền vào */}
        <div className="absolute inset-0">
          {background}
        </div>

        {variant === "linear" ? (
          <div
            className={cn(
              "absolute inset-0 bg-white/75",
              !forceLightFallback && "dark:bg-black/70",
            )}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-slate-950/45" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_42%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/10 to-slate-950/55" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_85%,rgba(14,165,233,0.12),transparent_35%)]" />
          </>
        )}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 shrink-0">
        <ShowHeader
          onShare={shareCurrentLink}
          variant={variant}
        />
      </div>

      {/* Action nổi như nút bật âm thanh */}
      {topAction ? (
        <div
          className={cn(
            "fixed right-3 z-40 sm:right-5",
            "top-[calc(env(safe-area-inset-top)+4.75rem)] sm:top-24",
          )}
        >
          {topAction}
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Chỉ tạo khoảng không khi có nội dung */}
        {afterHeader ? (
          <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
            {afterHeader}
          </div>
        ) : null}

        <section
          className={cn(
            "mx-auto flex w-full flex-1 items-center justify-center",
            variant === "linear"
              ? "px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-[max(3rem,env(safe-area-inset-bottom))] sm:pt-10"
              : "px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-[max(2rem,env(safe-area-inset-bottom))] sm:pt-6",
            className,
          )}
        >
          {children}
        </section>
      </div>
    </main>
  );
}
