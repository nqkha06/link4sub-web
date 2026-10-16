"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RotateCw,
  MessageCircle,
  Tickets,
} from "lucide-react";

import { useTranslations } from "next-intl";

import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";

import type { SupportRequest } from "./types";

const summaryItems = [
  { key: "total", icon: Tickets },
  { key: "active", icon: Clock3 },
  { key: "waiting", icon: MessageCircle },
  { key: "resolved", icon: CheckCircle2 },
] as const;

export function SupportTicketSummary({ items }: { items: SupportRequest[] }) {
  const t = useTranslations("Support.summary");
  const counts = {
    total: items.length,
    active: items.filter((item) =>
      ["submitted", "in_progress", "answered"].includes(item.status),
    ).length,
    waiting: items.filter((item) => item.status === "waiting_user").length,
    resolved: items.filter((item) =>
      ["resolved", "closed"].includes(item.status),
    ).length,
  };

  return (
    <section
      aria-label={t("label")}
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {summaryItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.key}
            className="gap-0 rounded-xl px-4 py-4 shadow-none sm:px-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{t(`${item.key}.label`)}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.025em]">
                  {counts[item.key]}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {t(`${item.key}.description`)}
                </p>
              </div>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-md border bg-muted/30 text-muted-foreground",
                  item.key === "waiting" &&
                    counts.waiting > 0 &&
                    "border-primary/20 bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-4" />
              </span>
            </div>
          </Card>
        );
      })}
    </section>
  );
}

export function SupportSkeleton() {
  const t = useTranslations("Support");
  return (
    <PageContainer aria-busy="true" aria-label={t("loading")}>
      <Skeleton className="h-8 w-32" />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Skeleton className="h-[560px] rounded-xl" />
        <Skeleton className="h-[460px] rounded-xl" />
      </div>
    </PageContainer>
  );
}

export function SupportErrorState({ onRetry }: { onRetry: () => void }) {
  const brand = useSiteBrand();
  const t = useTranslations("Support");
  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("error.description", { brand: brand.siteName })}
      />
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>{t("error.title")}</AlertTitle>
        <AlertDescription>
          <p>{t("error.hint")}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 bg-background"
            onClick={onRetry}
          >
            <RotateCw />
            {t("error.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    </PageContainer>
  );
}
