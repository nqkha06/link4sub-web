"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Dialog dùng cho khu thành viên, thay cho Credenza.
 *
 * - Từ `sm` trở lên: dialog giữa màn hình như `Dialog`.
 * - Dưới `sm`: tấm trượt từ dưới lên giống drawer nhưng KHÔNG có cử chỉ kéo/vuốt
 *   để đóng (đóng bằng nút X, nút Hủy, chạm nền hoặc phím Esc).
 *
 * API giữ giống Credenza để thay thế trực tiếp. Không phụ thuộc và không sửa
 * `dialog.tsx`, `drawer.tsx`, `credenza.tsx`.
 */

function ResponsiveDialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="responsive-dialog" {...props} />
}

function ResponsiveDialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="responsive-dialog-trigger" {...props} />
}

function ResponsiveDialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="responsive-dialog-close" {...props} />
}

/**
 * Thiết bị cảm ứng: không tự focus vào ô nhập khi mở (tránh bật bàn phím),
 * focus vào chính khung dialog. Desktop: nếu có phần tử `data-autofocus` thì
 * focus vào nó, ngược lại giữ hành vi mặc định của Radix.
 */
function handleOpenAutoFocus(event: Event) {
  const content = event.currentTarget as HTMLElement | null
  if (!content) return
  if (window.matchMedia("(pointer: coarse)").matches) {
    event.preventDefault()
    content.focus({ preventScroll: true })
    return
  }
  const target = content.querySelector<HTMLElement>("[data-autofocus]")
  if (target) {
    event.preventDefault()
    target.focus()
  }
}

function ResponsiveDialogContent({
  className,
  children,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="responsive-dialog-overlay"
        className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />
      <DialogPrimitive.Content
        data-slot="responsive-dialog-content"
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-background shadow-lg outline-none duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          // Mobile: tấm dưới đáy, trượt lên khi mở và trượt xuống khi đóng.
          "inset-x-0 bottom-0 max-h-[92dvh] w-full rounded-t-2xl border-t",
          "max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom",
          // Desktop: dialog giữa màn hình.
          "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-h-[min(90dvh,860px)] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:gap-4 sm:rounded-lg sm:border",
          "sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95",
          className,
        )}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event)
          if (!event.defaultPrevented) handleOpenAutoFocus(event)
        }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** Tiêu đề (và mô tả) bên trái, nút X đóng bên phải. */
function ResponsiveDialogHeader({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="responsive-dialog-header"
      className={cn("flex shrink-0 items-start gap-3 px-5 py-4", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left">{children}</div>
      {showCloseButton ? (
        <DialogPrimitive.Close
          aria-label="Đóng"
          className="-mt-1 -mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none"
        >
          <XIcon className="size-4" />
        </DialogPrimitive.Close>
      ) : null}
    </div>
  )
}

function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="responsive-dialog-title"
      className={cn("text-left text-lg leading-snug font-semibold", className)}
      {...props}
    />
  )
}

function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="responsive-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ResponsiveDialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="responsive-dialog-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-5 pb-5", className)}
      {...props}
    />
  )
}

function ResponsiveDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="responsive-dialog-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-5 py-4 sm:flex-row sm:justify-end",
        className,
        // Đặt sau className để luôn áp dụng trên mobile, kể cả khi nơi gọi đặt
        // flex-col/py-*:
        // - chừa 40px phía dưới cho dễ bấm;
        // - các nút xếp trên một hàng, chia đều chiều rộng, chỉ xuống dòng khi
        //   không đủ chỗ (flex-wrap + min-width theo nội dung);
        // - nhóm nút bọc trong <div> cũng giãn đều; dòng chữ thông tin (div không
        //   chứa nút) nằm riêng một hàng, div rỗng thì ẩn.
        "max-sm:flex-row max-sm:flex-wrap max-sm:items-center max-sm:pb-10",
        "max-sm:[&>button]:flex-1 max-sm:[&>a]:flex-1",
        "max-sm:[&>div:has(button)]:flex max-sm:[&>div:has(button)]:flex-1 max-sm:[&>div>button]:flex-1",
        "max-sm:[&>div:not(:has(button))]:basis-full max-sm:[&>div:empty]:hidden",
      )}
      {...props}
    />
  )
}

export {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}
