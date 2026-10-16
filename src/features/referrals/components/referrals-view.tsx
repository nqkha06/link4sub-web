"use client";

import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BadgeDollarSign,
  CheckCircle2,
  CircleDollarSign,
  Gift,
  Link as LinkIcon,
  MousePointerClick,
  Share2,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { CopyFeedbackIcon } from "@/components/copy-feedback-icon";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { EmptyCard } from "@/components/dashboard/empty-card";
import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";
import type { ReferralsDashboard } from "@/features/referrals/types";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";

export function ReferralsView({ data }: { data: ReferralsDashboard }) {
  const t = useTranslations("SimplePages.referrals");
  const brand = useSiteBrand();
  const locale = useLocale();
  const { formatCurrency } = useMemberCurrency();

  const money = (value: string) =>
    formatCurrency(value, {
      sourceCurrency: data.currency,
    });

  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
      : "—";

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const shareTargets = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        data.referralUrl,
      )}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        data.referralUrl,
      )}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(data.referralUrl)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(data.referralUrl)}`,
    },
  ];

  const steps = [
    {
      icon: LinkIcon,
      title: t("steps.copyTitle"),
      description: t("steps.copyDescription"),
    },
    {
      icon: UserCheck,
      title: t("steps.signupTitle"),
      description: t("steps.signupDescription"),
    },
    {
      icon: CircleDollarSign,
      title: t("steps.earnTitle"),
      description: t("steps.earnDescription"),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
      />

      {/* Referral hero */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          {/* Intro */}
          <div className="flex min-w-0 flex-col justify-center border-b p-6 lg:border-r lg:border-b-0 lg:p-8">
            <h2 className="font-semibold text-lg tracking-tight">
              {t("shareTitle")}
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              {t("shareDescription")}
            </p>

            {/* Commission */}
            <div className="mt-6 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {Number(data.commissionRate).toLocaleString(locale)}%
              </span>

              <span className="pb-1 text-sm text-muted-foreground">
                {t("commissionLabel")}
              </span>
            </div>

            {/* Context */}
            <div className="mt-5 flex max-w-lg gap-2.5 border-t pt-5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <p className="text-sm leading-5 text-muted-foreground">
                {t("paidOnlyContext")}
              </p>
            </div>
          </div>

          {/* Referral link */}
          <div className="min-w-0 p-6 lg:p-8">
            <div className="mb-5">
              <p className="text-sm font-semibold">
                {t("shareTitle")}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {brand.siteName}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex h-11 w-full min-w-0 shrink-0 items-center gap-2.5 rounded-lg border bg-background px-3.5 sm:w-auto sm:flex-1">
                <LinkIcon className="size-4 shrink-0 text-muted-foreground" />

                <span className="min-w-0 flex-1 truncate font-mono text-xs sm:text-sm">
                  {data.referralUrl}
                </span>
              </div>

              <Button
                type="button"
                className="h-11 shrink-0 px-5"
                onClick={() =>
                  void copy(data.referralUrl, t("copiedLink"))
                }
              >
                <CopyFeedbackIcon className="size-4" />
                {t("copy")}
              </Button>
            </div>

            {/* Share */}
            <div className="mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Share
              </p>

              <div className="flex flex-wrap gap-2">
                {shareTargets.map((target) => (
                  <Button
                    key={target.label}
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 bg-transparent"
                  >
                    <a
                      href={target.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Share2 className="size-3.5" />
                      {target.label}
                      <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        aria-label={t("summary")}
      >
        <ReferralMetric
          icon={<UsersRound />}
          label={t("totalReferrals")}
          value={data.summary.totalReferrals.toLocaleString(locale)}
        />

        <ReferralMetric
          icon={<BadgeDollarSign />}
          label={t("commissionLabel")}
          value={`${Number(data.commissionRate).toLocaleString(locale)}%`}
        />

        <ReferralMetric
          icon={<CircleDollarSign />}
          label={t("totalCommission")}
          value={money(data.summary.totalCommission)}
        />
      </section>

      {/* How it works */}
      <Card className="overflow-hidden py-0">
        <div className="grid lg:grid-cols-[0.38fr_0.62fr]">
          <CardHeader className="relative min-w-0 overflow-hidden border-b bg-muted/20 px-5 py-6 sm:px-6 lg:border-r lg:border-b-0 lg:p-7">
            <div
              aria-hidden="true"
              className="absolute -left-16 -top-16 size-40 rounded-full bg-primary/10 blur-3xl"
            />

            <div className="relative">
              <span className="mb-4 grid size-10 place-items-center rounded-xl border bg-background text-primary shadow-sm">
                <MousePointerClick className="size-5" />
              </span>

              <CardTitle className="text-lg">{t("howTitle")}</CardTitle>

              <CardDescription className="mt-2 max-w-sm leading-6">
                {t("howDescription")}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="min-w-0 p-5 sm:p-6 lg:p-7">
            <div className="grid gap-0 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.title}
                    className={cn(
                      "relative flex gap-4 py-4 first:pt-0 last:pb-0 md:block md:px-5 md:py-0 md:first:pl-0 md:last:pr-0",
                      index !== steps.length - 1 &&
                      "border-b md:border-r md:border-b-0",
                    )}
                  >
                    <div className="relative shrink-0">
                      <span className="grid size-10 place-items-center rounded-xl border bg-muted/40 text-foreground shadow-sm">
                        <Icon className="size-4.5" />
                      </span>

                      <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                        {index + 1}
                      </span>
                    </div>

                    <div className="min-w-0 md:mt-4">
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Referrals */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-col gap-3 border-b bg-muted/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <CardTitle>{t("tableTitle")}</CardTitle>
          </div>

          <Badge
            variant="secondary"
            className="w-fit rounded-full px-3 py-1"
          >
            <UsersRound className="mr-1.5 size-3.5" />
            {t("referralCount", {
              count: data.summary.totalReferrals,
            })}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {data.referrals.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                  <caption className="sr-only">{t("tableTitle")}</caption>

                  <thead className="border-b bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3.5">
                        {t("table.details")}
                      </th>
                      <th className="px-5 py-3.5">
                        {t("table.date")}
                      </th>
                      <th className="px-5 py-3.5">
                        {t("table.lastEarning")}
                      </th>
                      <th className="px-6 py-3.5 text-right">
                        {t("table.totalEarnings")}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {data.referrals.map((referral) => (
                      <tr
                        key={referral.id}
                        className="group transition-colors hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10 rounded-xl border shadow-sm">
                              <AvatarImage
                                src={referral.avatar || undefined}
                                alt={referral.name}
                              />
                              <AvatarFallback className="rounded-xl bg-muted text-xs font-semibold">
                                {initials(referral.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {referral.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {referral.maskedEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-muted-foreground">
                            {date(referral.joinedAt)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-muted-foreground">
                            {date(referral.lastCommissionAt)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <p className="font-semibold tabular-nums">
                            {money(referral.totalCommission)}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("withdrawalsCount", {
                              count: referral.successfulWithdrawals,
                            })}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          ) : (
            <EmptyCard
              icon={UsersRound}
              title={t("emptyTitle")}
              className="rounded-none border-0 bg-transparent"
            />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

type MetricTone = "primary" | "violet" | "emerald";

const metricToneStyles: Record<
  MetricTone,
  {
    card: string;
    icon: string;
    glow: string;
  }
> = {
  primary: {
    card:
      "border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-card",
    icon: "bg-primary/10 text-primary ring-primary/10",
    glow: "bg-primary/10",
  },

  violet: {
    card:
      "border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-card to-card dark:border-violet-900/50 dark:from-violet-950/20",
    icon:
      "bg-violet-100 text-violet-600 ring-violet-200/50 dark:bg-violet-950 dark:text-violet-400 dark:ring-violet-900",
    glow: "bg-violet-500/10",
  },

  emerald: {
    card:
      "border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-card to-card dark:border-emerald-900/50 dark:from-emerald-950/20",
    icon:
      "bg-emerald-100 text-emerald-600 ring-emerald-200/50 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-900",
    glow: "bg-emerald-500/10",
  },
};

function ReferralMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        </div>

        <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted/30 text-muted-foreground [&_svg]:size-4">
          {icon}
        </span>
      </div>
    </div>
  );
}
function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}
