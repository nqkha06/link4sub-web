"use client";

import { useEffect } from "react";
import { Headset } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  SupportErrorState,
  SupportSkeleton,
} from "@/components/dashboard/support/support-overview";
import { SupportFaq } from "@/components/dashboard/support/support-faq";
import { CreateSupportRequestSheet } from "@/components/dashboard/support/support-request-sheet";
import {
  SupportContactChannels,
  SupportRequestDetail,
  SupportTicketList,
} from "@/components/dashboard/support/support-requests";
import { SupportComposer } from "@/components/dashboard/support/support-composer";
import {
  useFormatSupportDate,
  useSupportController,
} from "@/components/dashboard/support/use-support-controller";
import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { Card } from "@/components/ui/card";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";

export function SupportView() {
  const t = useTranslations("Support");
  const formatDate = useFormatSupportDate();
  const controller = useSupportController();
  const brand = useSiteBrand();

  // Ctrl/⌘ + K: nhảy tới ô tìm kiếm yêu cầu.
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        const input = document.querySelector<HTMLInputElement>(
          "#support-ticket-search",
        );
        if (!input) return;
        event.preventDefault();
        input.focus();
        input.select();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  if (controller.loading) return <SupportSkeleton />;
  if (controller.error || !controller.data) {
    return <SupportErrorState onRetry={() => void controller.retry()} />;
  }

  const supportEmail = brand.contact.supportEmail ?? brand.contact.email;

  const requests = controller.data.requests;
  const lastSupportReply = requests
    .flatMap((request) => request.messages ?? [])
    .filter((message) => message.senderRole === "support")
    .reduce<string | null>(
      (latest, message) =>
        !latest || message.createdAt > latest ? message.createdAt : latest,
      null,
    );

  return (
    <PageContainer>
      <PageHeader title={t("title")} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-none">
          <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border bg-muted/40 text-foreground">
              <Headset className="size-5" aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-tight">
                {t("hero.title")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("hero.description", { brand: brand.siteName })}
              </p>
            </div>

            <div className="shrink-0 text-right max-sm:hidden">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {t("hero.lastReply")}
              </p>
              <p className="mt-1.5 text-sm tabular-nums text-foreground">
                {lastSupportReply ? formatDate(lastSupportReply) : "—"}
              </p>
            </div>
          </div>

          <div className="border-t">
            <SupportComposer controller={controller} />
          </div>

          <div className="flex items-center justify-between gap-4 border-y bg-muted/30 px-5 py-3.5 sm:px-6">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-foreground">
              {t("history.title")}
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {t("count", { count: requests.length })}
            </span>
          </div>

          <SupportTicketList controller={controller} embedded />
        </Card>

        <div className="space-y-6">
          <SupportFaq />

          <Card className="gap-0 rounded-xl px-5 py-5 shadow-none empty:hidden sm:px-6">
            <SupportContactChannels
              email={supportEmail}
              workingHours={brand.contact.workingHours}
              socialLinks={brand.socialLinks}
            />
          </Card>
        </div>
      </div>

      <CreateSupportRequestSheet controller={controller} />
      <SupportRequestDetail
        key={controller.detailRequest?.id ?? "none"}
        controller={controller}
      />
    </PageContainer>
  );
}
