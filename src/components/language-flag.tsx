import "flag-icons/css/flag-icons.min.css";

import { cn } from "@/lib/utils";

/**
 * Lá cờ quốc gia dạng SVG (thư viện flag-icons), không dùng emoji của thiết bị.
 * `code` là mã quốc gia ISO 3166-1 alpha-2, ví dụ "VN", "US".
 */
export function LanguageFlag({
  code,
  className,
}: {
  code: string | null | undefined;
  className?: string;
}) {
  const valid = Boolean(code && /^[A-Za-z]{2}$/.test(code));

  return (
    <span
      aria-hidden="true"
      className={cn(
        "fi shrink-0 rounded-[2px] shadow-sm ring-1 ring-black/10",
        // "xx" là lá cờ trống của flag-icons, dùng khi chưa có mã quốc gia.
        `fi-${valid ? code!.toLowerCase() : "xx"}`,
        className,
      )}
    />
  );
}
