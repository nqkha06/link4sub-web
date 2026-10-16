"use client";

import { AlertCircle, FileCode2, RotateCcw, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyCard } from "@/components/dashboard/empty-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function SnippetsEmptyState() {
  const t = useTranslations("Snippets");
  return <EmptyCard icon={FileCode2} title={t("states.emptyTitle")} />;
}

export function SnippetsNoResults({ onClear }: { onClear: () => void }) {
  const t = useTranslations("Snippets.states");
  return (
    <EmptyCard
      icon={SearchX}
      title={t("noResultsTitle")}
      action={{ label: t("clearFilters"), onClick: onClear }}
    />
  );
}

export function SnippetsSkeleton() {
  const t = useTranslations("Snippets.states");
  return (
    <div aria-label={t("loading")} aria-busy="true">
      <div className="flex gap-3 border-b border-border py-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-10" />
      </div>
      <div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex h-16 items-center gap-4 border-b border-border px-3">
            <Skeleton className="size-9" />
            <div className="flex-1">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="mt-2 h-3 w-72" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SnippetsErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const t = useTranslations("Snippets.states");
  return (
    <Alert variant="destructive" className="items-center">
      <AlertCircle /><AlertTitle>{t("errorTitle")}</AlertTitle>
      <AlertDescription>
        <span>{t("errorHint")}</span>
        {message ? <span className="text-xs opacity-80">{message}</span> : null}
        <Button variant="outline" size="sm" className="mt-2 border-destructive/30 bg-background text-destructive" onClick={onRetry}>
          <RotateCcw />{t("retry")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
