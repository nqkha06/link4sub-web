import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Trạng thái trống tối giản dùng chung cho các trang member: một icon và một dòng chữ.
 * `action` (tuỳ chọn) hiện thêm một dòng chữ bấm được, ví dụ để xoá bộ lọc.
 */
export function EmptyCard({
  icon: Icon,
  title,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-52 place-items-center rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
