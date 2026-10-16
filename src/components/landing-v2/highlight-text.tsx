import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type HighlightTextProps = ComponentPropsWithoutRef<"span">;

/**
 * Landing-only text marker. The absolutely positioned wash sits behind the
 * glyphs, so it adds emphasis without changing the heading's line box.
 */
export function HighlightText({
  children,
  className,
  style,
  ...props
}: HighlightTextProps) {
  return (
    <span
      className={cn(
        "-mx-[0.05em] px-[0.05em] text-primary [box-decoration-break:clone] [-webkit-box-decoration-break:clone]",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(to bottom, transparent 58%, color-mix(in oklab, var(--primary) 10%, transparent) 58%, color-mix(in oklab, var(--primary) 10%, transparent) 94%, transparent 94%)",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
