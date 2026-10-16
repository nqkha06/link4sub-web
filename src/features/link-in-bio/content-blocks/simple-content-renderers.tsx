"use client";

import { Check, Copy, Landmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { BioBankDetailsBlockDto, BioDividerBlockDto, BioTextBlockDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  BIO_MUTED_SURFACE_CLASS,
} from "../theme-classes";
import { BIO_BARE_BLOCK_INSET_CLASS } from "../bio-spacing";

const dividerSpacing = { sm: "py-1", md: "py-3", lg: "py-5" } as const;
const dividerStyle = { solid: "border-solid", dashed: "border-dashed", dotted: "border-dotted" } as const;
const textBlockStyle = {
  heading: "text-xl font-bold leading-snug sm:text-2xl",
  subheading: "text-base font-semibold leading-snug",
  paragraph: "text-sm font-normal leading-6",
} as const;
const textBlockAlign = { left: "text-left", center: "text-center", right: "text-right" } as const;

export function TextBlockRenderer({ block }: { block: BioTextBlockDto }) {
  if (!block.enabled || !block.content.trim()) return null;
  return (
    <p
      className={cn(
        "whitespace-pre-wrap break-words text-[color:var(--bio-text,var(--foreground))]",
        BIO_BARE_BLOCK_INSET_CLASS,
        textBlockStyle[block.style],
        textBlockAlign[block.align],
      )}
    >
      {block.content}
    </p>
  );
}

export function DividerRenderer({ block }: { block: BioDividerBlockDto }) {
  if (!block.enabled) return null;
  const line = <span aria-hidden className={cn("h-0 min-w-4 flex-1 border-t border-current opacity-35", dividerStyle[block.style])} />;
  return <div className={cn("flex items-center gap-3 text-[color:var(--bio-muted-text,var(--muted-foreground))]", dividerSpacing[block.spacing])} role="separator" aria-label={block.showLabel && block.label ? block.label : "Dấu phân cách"}>{line}{block.showLabel && block.label ? <span className="max-w-[70%] truncate text-xs font-medium">{block.label}</span> : null}{block.showLabel && block.label ? line : null}</div>;
}

export function BankDetailsRenderer({ block }: { block: BioBankDetailsBlockDto }) {
  const [copied, setCopied] = useState(false);
  if (!block.enabled || (!block.bankName && !block.accountName && !block.accountNumber)) return null;

  async function copyAccountNumber() {
    if (!block.accountNumber) return;
    try {
      await navigator.clipboard.writeText(block.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Không thể sao chép số tài khoản.");
    }
  }

  const rows = [
    ["Ngân hàng", block.bankName],
    ["Chủ tài khoản", block.accountName],
    ["Số tài khoản", block.accountNumber],
    ["Chi nhánh", block.branch],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--bio-section-border,var(--border))] bg-[color:var(--bio-section-bg,var(--card))] text-[color:var(--bio-text,var(--card-foreground))] shadow-sm" aria-label={block.title || "Thông tin ngân hàng"}>
      <div className="flex items-center gap-3 border-b border-[color:var(--bio-section-border,var(--border))] px-4 py-3"><span className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-[color:var(--bio-muted-text,var(--muted-foreground))]", BIO_MUTED_SURFACE_CLASS)}><Landmark className="size-[18px]" /></span><h2 className="min-w-0 truncate text-sm font-semibold">{block.title || "Thông tin ngân hàng"}</h2></div>
      <dl className="divide-y divide-[color:var(--bio-section-border,var(--border))] px-4">
        {rows.map(([label, value]) => {
          const isAccountNumber = label === "Số tài khoản";
          const canCopy = isAccountNumber && block.showCopyButton;
          return (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-3">
              <dt className="text-xs text-[color:var(--bio-muted-text,var(--muted-foreground))]">{label}</dt>
              <dd className={cn("min-w-0 text-sm font-medium", canCopy && "flex items-center gap-2")}>
                <span className={cn("min-w-0 break-words", isAccountNumber && "font-mono tracking-wide")}>{value}</span>
                {canCopy ? (
                  <button
                    type="button"
                    onClick={() => void copyAccountNumber()}
                    aria-label={copied ? "Đã sao chép" : "Sao chép số tài khoản"}
                    title={copied ? "Đã sao chép" : "Sao chép số tài khoản"}
                    className="-my-1.5 grid size-8 shrink-0 place-items-center rounded-lg text-[color:var(--bio-muted-text,var(--muted-foreground))] outline-none transition-colors hover:bg-[color:var(--bio-accent)]/12 hover:text-[color:var(--bio-text,var(--foreground))] focus-visible:ring-2 focus-visible:ring-[color:var(--bio-accent)]/50"
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </button>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
      {block.note ? <p className="border-t border-[color:var(--bio-section-border,var(--border))] px-4 py-3 text-xs leading-5 text-[color:var(--bio-muted-text,var(--muted-foreground))]">{block.note}</p> : null}
    </section>
  );
}
