import {
  BadgeCheck,
  Banknote,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { FAQ } from "@/components/landing-v2/faq";
import { FinalCTA } from "@/components/landing-v2/final-cta";
import { LandingFooter } from "@/components/landing-v2/footer";
import { LandingNavbar } from "@/components/landing-v2/navbar";
import {
  landingCompactSectionClassName,
  landingContentSectionClassName,
} from "@/components/landing-v2/section-rhythm";
import { buttonVariants } from "@/components/ui/button";
import type { PublicMenusResponse } from "@/features/admin-menus/types";
import type {
  PublicPaymentProof,
  PublicPaymentProofList,
  PublicPaymentProofSummary,
} from "@/features/public-payment-proofs/types";
import type { PublicSiteSettings } from "@/features/site-settings/types";
import { cn } from "@/lib/utils";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type PaymentProofPageProps = {
  dashboardHref: string | null;
  locale: string;
  menus?: PublicMenusResponse;
  proofs: PublicPaymentProofList | null;
  settings: PublicSiteSettings;
  summary: PublicPaymentProofSummary | null;
  t: Translator;
};

const ROUTE = "/payment-proof";

const faqKeys = ["source", "masked", "amount", "update", "withdraw"] as const;

function formatMoney(amount: string, currency: string, locale: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(value);
  } catch {
    // Mã tiền tệ tuỳ biến không thuộc ISO 4217.
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(value)} ${currency}`;
  }
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function pageHref(page: number) {
  return page <= 1 ? ROUTE : `${ROUTE}?page=${page}`;
}

function HeroBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="
          absolute left-1/2 top-[-10%]
          h-[520px] w-[900px] -translate-x-1/2
          rounded-full bg-primary/[0.06] blur-[130px]
        "
      />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--foreground) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 70% 70% at 50% 20%, black 10%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 70% at 50% 20%, black 10%, transparent 80%)",
        }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-[22px] border border-border
        bg-card/60 p-6 text-left backdrop-blur-sm
      "
    >
      <div
        className="
          flex size-11 items-center justify-center
          rounded-[14px] bg-primary/10 text-primary
        "
      >
        <Icon aria-hidden="true" className="size-5" />
      </div>

      <p
        className="
          mt-4 break-words text-[1.6rem] font-semibold
          leading-tight tracking-[-0.03em]
          text-foreground tabular-nums
        "
      >
        {value}
      </p>

      <p className="mt-1 text-[14px] leading-6 text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function MemberCell({ name }: { name: string }) {
  const initial = Array.from(name)[0]?.toUpperCase() ?? "•";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="
          grid size-9 shrink-0 place-items-center
          rounded-full bg-primary/10
          text-sm font-semibold text-primary
        "
      >
        {initial === "*" ? "•" : initial}
      </span>

      <span className="truncate text-[15px] font-medium text-foreground">
        {name}
      </span>
    </div>
  );
}

function PaidBadge({ label }: { label: string }) {
  return (
    <span
      className="
        inline-flex items-center gap-1.5
        rounded-full bg-emerald-500/10 px-2.5 py-1
        text-xs font-medium text-emerald-600
        dark:text-emerald-400
      "
    >
      <BadgeCheck aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

function MobileProofCard({
  proof,
  locale,
  t,
}: {
  proof: PublicPaymentProof;
  locale: string;
  t: Translator;
}) {
  return (
    <li
      className="
        rounded-[18px] border border-border
        bg-card/60 p-4 backdrop-blur-sm
      "
    >
      <div className="flex items-center justify-between gap-3">
        <MemberCell name={proof.memberName} />
        <PaidBadge label={t("status.paid")} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">
            {t("columns.amount")}
          </dt>
          <dd className="mt-0.5 font-semibold text-foreground tabular-nums">
            {formatMoney(proof.amount, proof.currency, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            {t("columns.method")}
          </dt>
          <dd className="mt-0.5 truncate text-foreground">
            {proof.paymentMethodName}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted-foreground">
            {t("columns.date")}
          </dt>
          <dd className="mt-0.5 text-foreground">
            {formatDate(proof.paidAt, locale)}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function ProofPagination({
  page,
  totalPages,
  t,
}: {
  page: number;
  totalPages: number;
  t: Translator;
}) {
  const linkClassName = buttonVariants({ variant: "outline", size: "sm" });
  const disabledClassName = cn(linkClassName, "pointer-events-none opacity-50");

  return (
    <nav
      aria-label={t("pagination.label")}
      className="mt-6 flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link className={linkClassName} href={pageHref(page - 1)} rel="prev">
          <ChevronLeft aria-hidden="true" className="size-4" />
          {t("pagination.previous")}
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClassName}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          {t("pagination.previous")}
        </span>
      )}

      <p className="text-sm text-muted-foreground tabular-nums">
        {t("pagination.page", { page, totalPages })}
      </p>

      {page < totalPages ? (
        <Link className={linkClassName} href={pageHref(page + 1)} rel="next">
          {t("pagination.next")}
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClassName}>
          {t("pagination.next")}
          <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      )}
    </nav>
  );
}

export function PaymentProofPage({
  dashboardHref,
  locale,
  menus,
  proofs,
  settings,
  summary,
  t,
}: PaymentProofPageProps) {
  const items = proofs?.items ?? [];
  const numberFormat = new Intl.NumberFormat(locale);
  const totalPaid =
    summary && summary.totals.length > 0
      ? summary.totals
          .map((total) => formatMoney(total.amount, total.currency, locale))
          .join(" + ")
      : "—";
  const description =
    summary && summary.paymentCount > 0
      ? t("description", {
          count: numberFormat.format(summary.paymentCount),
          total: totalPaid,
        })
      : t("metaDescription");
  const faqs = faqKeys.map((key) => ({
    question: t(`faq.items.${key}.question`),
    answer: t(`faq.items.${key}.answer`),
  }));
  const gridClassName =
    "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_150px] items-center gap-5 px-6";

  return (
    <div
      className="
        min-w-[320px] overflow-x-clip
        bg-background text-foreground
      "
      id="top"
    >
      <LandingNavbar
        dashboardHref={dashboardHref}
        menus={menus}
        settings={settings}
      />

      <main>
        {/* Hero */}
        <section className={landingContentSectionClassName}>
          <HeroBackground />

          <div className="mx-auto w-full max-w-[1120px] px-4 md:px-8">
            <div className="mx-auto max-w-[720px] text-center">
              <span
                className="
                  inline-flex items-center gap-2
                  rounded-full border border-border
                  bg-background/70 px-3 py-1.5
                  text-xs font-medium text-muted-foreground
                  backdrop-blur-sm
                "
              >
                <BadgeCheck
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
                {t("eyebrow")}
              </span>

              <h1
                className="
                  mt-5 text-balance
                  text-[2.9rem] font-semibold
                  leading-[1] tracking-[-0.055em]
                  text-foreground
                  sm:text-[3.8rem] md:text-[4.4rem]
                "
              >
                {t("title")}
              </h1>

              <p
                className="
                  mx-auto mt-6 max-w-[600px]
                  text-pretty text-[16px] leading-7
                  text-muted-foreground sm:text-[18px]
                "
              >
                {description}
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-[980px] gap-4 sm:grid-cols-3">
              <StatCard
                icon={Banknote}
                label={t("stats.totalPaid")}
                value={totalPaid}
              />
              <StatCard
                icon={ReceiptText}
                label={t("stats.payments")}
                value={summary ? numberFormat.format(summary.paymentCount) : "—"}
              />
              <StatCard
                icon={UsersRound}
                label={t("stats.members")}
                value={summary ? numberFormat.format(summary.memberCount) : "—"}
              />
            </div>
          </div>
        </section>

        {/* Payments */}
        <section
          aria-labelledby="payments-heading"
          className={`${landingCompactSectionClassName} bg-muted/30`}
        >
          <div className="mx-auto w-full max-w-[1120px] px-4 md:px-8">
            <div className="mb-9 max-w-[640px] sm:mb-12">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {t("listEyebrow")}
              </span>

              <h2
                className="
                  mt-4 text-balance
                  text-[2.2rem] font-semibold
                  leading-[1.05] tracking-[-0.045em]
                  text-foreground sm:text-[2.6rem]
                "
                id="payments-heading"
              >
                {t("listTitle")}
              </h2>

              <p className="mt-4 text-[16px] leading-7 text-muted-foreground">
                {t("listDescription")}
              </p>
            </div>

            {items.length > 0 ? (
              <>
                {/* Desktop */}
                <div
                  className="
                    hidden overflow-hidden rounded-[22px]
                    border border-border bg-card/60
                    backdrop-blur-sm md:block
                  "
                  role="table"
                >
                  <div
                    className={cn(
                      gridClassName,
                      "border-b border-border py-4 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground",
                    )}
                    role="row"
                  >
                    <span role="columnheader">{t("columns.member")}</span>
                    <span role="columnheader">{t("columns.method")}</span>
                    <span role="columnheader">{t("columns.amount")}</span>
                    <span role="columnheader">{t("columns.date")}</span>
                    <span className="text-right" role="columnheader">
                      {t("columns.status")}
                    </span>
                  </div>

                  <div className="divide-y divide-border" role="rowgroup">
                    {items.map((proof) => (
                      <div
                        className={cn(gridClassName, "py-4")}
                        key={proof.id}
                        role="row"
                      >
                        <div className="min-w-0" role="cell">
                          <MemberCell name={proof.memberName} />
                        </div>
                        <span
                          className="truncate text-sm text-muted-foreground"
                          role="cell"
                        >
                          {proof.paymentMethodName}
                        </span>
                        <span
                          className="text-[15px] font-semibold text-foreground tabular-nums"
                          role="cell"
                        >
                          {formatMoney(proof.amount, proof.currency, locale)}
                        </span>
                        <span
                          className="text-sm text-muted-foreground"
                          role="cell"
                        >
                          {formatDate(proof.paidAt, locale)}
                        </span>
                        <span className="text-right" role="cell">
                          <PaidBadge label={t("status.paid")} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile */}
                <ul className="space-y-3 md:hidden">
                  {items.map((proof) => (
                    <MobileProofCard
                      key={proof.id}
                      locale={locale}
                      proof={proof}
                      t={t}
                    />
                  ))}
                </ul>

                <ProofPagination
                  page={proofs?.page ?? 1}
                  t={t}
                  totalPages={proofs?.totalPages ?? 1}
                />
              </>
            ) : (
              <div
                className="
                  flex min-h-40 flex-col items-center justify-center gap-3
                  rounded-[22px] border border-dashed border-border
                  bg-card/40 p-8 text-center backdrop-blur-sm
                "
              >
                <p className="text-sm text-muted-foreground">
                  {proofs ? t("empty") : t("unavailable")}
                </p>

                {proofs && proofs.page > 1 ? (
                  <Link
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    href={ROUTE}
                  >
                    {t("pagination.first")}
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <FAQ
          description={t("faq.description")}
          eyebrow={t("faq.eyebrow")}
          faqs={faqs}
          highlightedTitle={t("faq.highlightedTitle")}
          title={t("faq.title")}
        />

        <FinalCTA dashboardHref={dashboardHref} />
      </main>

      <LandingFooter menus={menus} settings={settings} />
    </div>
  );
}
