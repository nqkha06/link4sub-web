"use client";

import { CircleHelp, Plus } from "lucide-react";

import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";

// Nội dung FAQ tĩnh (chỉ giao diện, không gọi API); chữ nằm ở Support.faq.items.
const faqKeys = ["views", "revenue", "tiers", "withdraw", "brokenLink", "tracking"] as const;

export function SupportFaq() {
  const t = useTranslations("Support.faq");
  return (
    <Card
      aria-labelledby="support-faq-heading"
      className="gap-4 rounded-xl px-5 py-5 shadow-none sm:px-6"
    >
      <h2
        id="support-faq-heading"
        className="flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <CircleHelp className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {t("title")}
      </h2>

      <div className="space-y-2.5">
        {faqKeys.map((key) => (
          <details
            key={key}
            className="group rounded-lg border bg-background transition-colors open:bg-muted/20"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-4 py-3.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              {t(`items.${key}.question`)}
              <Plus
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                aria-hidden="true"
              />
            </summary>
            <p className="px-4 pb-4 text-sm leading-6 text-muted-foreground">
              {t(`items.${key}.answer`)}
            </p>
          </details>
        ))}
      </div>
    </Card>
  );
}
