"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFilesUsage, getSnippetUsage, type DestinationUsageDto } from "@/lib/api-client";

export type DestinationKind = "snippet" | "file" | "files";

type DestinationDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which destination is being deleted; decides the usage endpoint and wording. */
  kind: DestinationKind;
  ids: string[];
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
};

/**
 * Delete confirmation for a Social Link destination (snippet or file). It looks up
 * which links still point at the destination and names them, because deleting it
 * leaves those links with a "deleted by creator" notice after unlock.
 */
export function DestinationDeleteDialog({ open, onOpenChange, ...props }: DestinationDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {open && props.ids.length ? <DialogBody key={`${props.kind}:${props.ids.join(",")}`} {...props} /> : null}
    </AlertDialog>
  );
}

type UsageState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; usage: DestinationUsageDto };

const aliasClassName = "rounded bg-muted px-1 py-0.5 font-mono text-[0.8125rem] text-foreground";

function DialogBody({ kind, ids, title, description, confirmLabel, onConfirm }: Omit<DestinationDeleteDialogProps, "open" | "onOpenChange">) {
  const t = useTranslations("DestinationUsage");
  const [state, setState] = useState<UsageState>({ status: "loading" });
  const idsKey = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    const ids = idsKey.split(",");
    const request = kind === "snippet" ? getSnippetUsage(ids[0]) : getFilesUsage(ids);
    request
      .then((usage) => { if (!cancelled) setState({ status: "ready", usage }); })
      .catch(() => { if (!cancelled) setState({ status: "error" }); });
    return () => { cancelled = true; };
  }, [kind, idsKey]);

  const alias = (chunks: ReactNode) => <code className={aliasClassName}>{chunks}</code>;
  const usage = state.status === "ready" ? state.usage : null;
  const links = usage?.links ?? [];
  const total = usage?.total ?? 0;

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>

      {state.status === "loading" ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {t("checking", { kind })}
        </p>
      ) : state.status === "error" ? (
        <Warning>{t("usageError", { kind })}</Warning>
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground">{t("unused", { kind })}</p>
      ) : (
        <Warning>
          {total === 1 && links.length === 1 ? (
            <p>{t.rich("affectedOne", { alias, a: `/${links[0].slug}` })}</p>
          ) : total === 2 && links.length === 2 ? (
            <p>{t.rich("affectedTwo", { alias, a: `/${links[0].slug}`, b: `/${links[1].slug}` })}</p>
          ) : (
            <>
              <p>{t("affectedMany", { count: total })}</p>
              <ScrollArea className="mt-2 max-h-48 rounded-md border border-border bg-background">
                <ul className="divide-y divide-border">
                  {links.map((link) => (
                    <li key={link.id}>
                      <Link href={`/member/links/${link.id}/edit`} className="flex min-w-0 items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted/50">
                        <span className="truncate text-foreground">{link.title}</span>
                        <code className="shrink-0 font-mono text-xs text-muted-foreground">/{link.slug}</code>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
              {total > links.length ? <p className="mt-1.5 text-xs">{t("andMore", { count: total - links.length })}</p> : null}
            </>
          )}
          <p className="mt-2">{t("consequence")}</p>
        </Warning>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
        <AlertDialogAction variant="destructive" disabled={state.status === "loading"} onClick={onConfirm}>
          {total > 0 ? t("confirmAffected") : confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground" role="alert">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-6">{children}</div>
    </div>
  );
}
