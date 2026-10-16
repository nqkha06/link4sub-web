"use client"

import { useRef, type KeyboardEvent } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type UnderlineTabItem<T extends string> = {
  id: T
  label: string
  icon?: LucideIcon
}

/**
 * Tab gạch chân tự viết cho khu thành viên (thay Tabs của shadcn, vốn làm vạch
 * active lệch khỏi đường viền dưới).
 *
 * - Vạch active là border-b-2 của chính nút, kéo -mb-px để đè đúng lên viền 1px
 *   của danh sách.
 * - Kích hoạt thủ công: mũi tên trái/phải, Home, End chỉ di chuyển focus;
 *   Enter/Space hoặc bấm mới đổi tab (để tab mở hộp thoại không tự bật khi
 *   focus quay lại).
 */
export function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: UnderlineTabItem<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null
    if (next === null) return
    event.preventDefault()
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex w-full items-stretch border-b border-border", className)}
    >
      {items.map((item, index) => {
        const active = item.id === value
        const Icon = item.icon
        return (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => moveFocus(event, index)}
            className={cn(
              "-mb-px inline-flex h-11 flex-1 items-center justify-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-5",
              "focus-visible:rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
