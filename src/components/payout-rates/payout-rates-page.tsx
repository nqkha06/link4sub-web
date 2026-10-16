import {
  BadgeDollarSign,
  CircleDollarSign,
  Globe2,
  Info,
  Monitor,
  Smartphone,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { FAQ } from "@/components/landing-v2/faq";
import { FinalCTA } from "@/components/landing-v2/final-cta";
import { LandingFooter } from "@/components/landing-v2/footer";
import { LandingNavbar } from "@/components/landing-v2/navbar";
import {
  landingCompactSectionClassName,
  landingContentSectionClassName,
} from "@/components/landing-v2/section-rhythm";
import type { PublicMenusResponse } from "@/features/admin-menus/types";
import type {
  PublicPayoutRate,
  PublicPayoutRateLevel,
} from "@/features/public-payout-rates/types";
import type { PublicSiteSettings } from "@/features/site-settings/types";

type Translator = (key: string) => string;

type PayoutRatesPageProps = {
  dashboardHref: string | null;
  locale: string;
  menus?: PublicMenusResponse;
  payoutRateLevel: PublicPayoutRateLevel | null;
  settings: PublicSiteSettings;
  t: Translator;
};

type Benefit = {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
};

type PayoutRate = {
  countryCode: string;
  mobile: PayoutAmount | null;
  desktop: PayoutAmount | null;
};

type PayoutAmount = {
  value: number;
};

const benefits: Benefit[] = [
  {
    icon: CircleDollarSign,
    titleKey: "benefits.fastPayout.title",
    descriptionKey: "benefits.fastPayout.description",
  },
  {
    icon: Globe2,
    titleKey: "benefits.globalTraffic.title",
    descriptionKey: "benefits.globalTraffic.description",
  },
  {
    icon: UsersRound,
    titleKey: "benefits.referrals.title",
    descriptionKey: "benefits.referrals.description",
  },
];

const payoutFaqKeys = [
  "calculation",
  "updateFrequency",
  "levelImpact",
  "deviceDifference",
  "minimumPayout",
  "referralStack",
] as const;

function formatMoney(amount: PayoutAmount | null, locale: string) {
  if (!amount) return "—";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount.value);
}

function buildPayoutRates(
  level: PublicPayoutRateLevel | null,
): PayoutRate[] {
  if (!level) return [];

  const countryCodes = Array.from(
    new Set(level.rates.map((rate) => rate.countryCode)),
  );

  return countryCodes.map((countryCode) => ({
    countryCode,
    mobile: resolvePayoutAmount(level, countryCode, "mobile"),
    desktop: resolvePayoutAmount(level, countryCode, "desktop"),
  }));
}

function resolvePayoutAmount(
  level: PublicPayoutRateLevel | null,
  countryCode: string,
  deviceType: "mobile" | "desktop",
): PayoutAmount | null {
  if (!level) return null;

  const rate = findRate(level.rates, countryCode, deviceType);

  if (!rate) return null;

  const baseCpm = Number(rate.baseCpm);

  if (!Number.isFinite(baseCpm)) return null;

  return {
    value: baseCpm * (level.profitBps / 10_000),
  };
}

function findRate(
  rates: PublicPayoutRate[],
  countryCode: string,
  deviceType: "mobile" | "desktop",
) {
  return (
    rates.find(
      (rate) =>
        rate.countryCode === countryCode &&
        rate.deviceType === deviceType,
    ) ??
    rates.find(
      (rate) =>
        rate.countryCode === countryCode &&
        rate.deviceType === "any",
    )
  );
}

function CountryMark({
  code,
  label,
}: {
  code: string;
  label: string;
}) {
  if (code === "ALL") {
    return (
      <span
        aria-label={label}
        className="
          grid h-[26px] w-9 shrink-0 place-items-center
          rounded-md bg-muted/60
          text-muted-foreground
        "
        role="img"
      >
        <Globe2
          aria-hidden="true"
          className="size-4"
        />
      </span>
    );
  }

  const flagCode =
    code === "ZZ"
      ? "xx"
      : code.toLowerCase();

  return (
    <span
      aria-label={label}
      className={`
        fi fi-${flagCode}
        !h-[24px] !w-8
        shrink-0
        overflow-hidden
        rounded-[4px]
        !bg-cover
        !bg-center
        shadow-[0_0_0_1px_rgba(0,0,0,0.08)]
        dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]
      `}
      role="img"
    />
  );
}
function countryName(
  countryCode: string,
  locale: string,
  t: Translator,
) {
  if (countryCode === "ALL") {
    return t("countries.otherCountries");
  }

  if (countryCode === "ZZ") {
    return t("countries.unknownCountry");
  }

  return (
    new Intl.DisplayNames([locale], {
      type: "region",
    }).of(countryCode) ?? t("countries.unknownCountry")
  );
}

function BenefitCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        group relative overflow-hidden
        rounded-[22px] border border-border
        bg-card/60 p-6 backdrop-blur-sm
        transition-all duration-300
        hover:-translate-y-1 hover:border-primary/30
        hover:shadow-[0_20px_55px_-32px_rgba(0,0,0,0.28)]
      "
    >
      <div
        className="
          flex size-11 shrink-0 items-center justify-center
          rounded-[14px] bg-primary/10 text-primary
          transition-transform duration-300
          group-hover:-rotate-3 group-hover:scale-105
        "
      >
        <Icon aria-hidden="true" className="size-5" />
      </div>

      <h3 className="mt-4 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-foreground">
        {title}
      </h3>

      <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function RateValue({
  Icon,
  device,
  label,
  value,
  align = "left",
}: {
  Icon: LucideIcon;
  device: string;
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "min-w-0 lg:text-right"
          : "min-w-0"
      }
    >
      <div
        className={
          align === "right"
            ? "flex items-center gap-2 text-muted-foreground lg:justify-end"
            : "flex items-center gap-2 text-muted-foreground"
        }
      >
        <Icon
          aria-hidden="true"
          className="size-4 shrink-0"
        />

        <span className="text-xs font-medium uppercase tracking-[0.08em]">
          {device}
        </span>
      </div>

      <p
        className="
          mt-2 text-[1.15rem] font-semibold
          tracking-[-0.025em] text-foreground
          tabular-nums sm:text-xl
        "
      >
        {value}
      </p>

      <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function MobileRateCard({
  rate,
  countryLabel,
  locale,
  t,
}: {
  rate: PayoutRate;
  countryLabel: string;
  locale: string;
  t: Translator;
}) {
  return (
    <div
      className="
        overflow-hidden rounded-[18px]
        border border-border bg-card/60
        backdrop-blur-sm
      "
    >
      <div className="flex items-center gap-3.5 p-4">
        <CountryMark
          code={rate.countryCode}
          label={countryLabel}
        />

        <div className="min-w-0">
          <p className="font-semibold tracking-[-0.02em] text-foreground">
            {countryLabel}
          </p>

          {rate.countryCode !== "ALL" ? (
            <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {rate.countryCode}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-border">
        <div className="border-r border-border p-4">
          <RateValue
            Icon={Smartphone}
            device={t("devices.mobile")}
            label={t("perThousand")}
            value={formatMoney(rate.mobile, locale)}
          />
        </div>

        <div className="p-4">
          <RateValue
            Icon={Monitor}
            device={t("devices.desktop")}
            label={t("perThousand")}
            value={formatMoney(rate.desktop, locale)}
          />
        </div>
      </div>
    </div>
  );
}

function PayoutHeroBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="
          absolute left-1/2 top-[-10%]
          h-[520px] w-[900px]
          -translate-x-1/2
          rounded-full
          bg-primary/[0.06]
          blur-[130px]
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

export function PayoutRatesPage({
  dashboardHref,
  locale,
  menus,
  payoutRateLevel,
  settings,
  t,
}: PayoutRatesPageProps) {
  const payoutRates = buildPayoutRates(payoutRateLevel);
  const payoutFaqs = payoutFaqKeys.map((key) => ({
    question: t(`faq.items.${key}.question`),
    answer: t(`faq.items.${key}.answer`),
  }));

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
          <PayoutHeroBackground />

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
                <BadgeDollarSign
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
                {t("description")}
              </p>
            </div>

            {/* Benefit cards */}
            <div className="mx-auto mt-12 grid max-w-[980px] gap-4 sm:grid-cols-3">
              {benefits.map(
                ({
                  icon,
                  titleKey,
                  descriptionKey,
                }) => (
                  <BenefitCard
                    key={titleKey}
                    icon={icon}
                    title={t(titleKey)}
                    description={t(descriptionKey)}
                  />
                ),
              )}
            </div>
          </div>
        </section>

        {/* Rates */}
        <section
          aria-labelledby="rates-heading"
          className={`${landingCompactSectionClassName} bg-muted/30`}
        >
          <div className="mx-auto w-full max-w-[1120px] px-4 md:px-8">
            <div className="mb-9 max-w-[640px] sm:mb-12">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {t("ratesTitle")}
              </span>

              <h2
                className="
                  mt-4 text-balance
                  text-[2.2rem] font-semibold
                  leading-[1.05] tracking-[-0.045em]
                  text-foreground
                  sm:text-[2.6rem]
                "
                id="rates-heading"
              >
                {t("ratesTitle")}
              </h2>

              <p className="mt-3 text-[15px] leading-6 text-muted-foreground sm:text-base">
                {t("ratesDescription")}
              </p>
            </div>

            {payoutRates.length > 0 ? (
              <>
                {/* Desktop */}
                <div
                  className="
                    hidden overflow-hidden rounded-[22px]
                    border border-border bg-card/60
                    backdrop-blur-sm
                    md:block
                  "
                >
                  <div
                    className="
                      grid grid-cols-[minmax(15rem,1.3fr)_minmax(12rem,0.8fr)_minmax(12rem,0.8fr)]
                      items-center border-b border-border
                      bg-muted/40 px-6 py-3.5
                    "
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {t("ratesTitle")}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <Smartphone className="size-3.5" />
                      {t("devices.mobile")}
                    </div>

                    <div className="flex items-center justify-end gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <Monitor className="size-3.5" />
                      {t("devices.desktop")}
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {payoutRates.map((rate) => {
                      const countryLabel = countryName(
                        rate.countryCode,
                        locale,
                        t,
                      );

                      return (
                        <div
                          className="
                            grid grid-cols-[minmax(15rem,1.3fr)_minmax(12rem,0.8fr)_minmax(12rem,0.8fr)]
                            items-center gap-6 px-6 py-5
                            transition-colors
                            hover:bg-muted/30
                          "
                          key={rate.countryCode}
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <CountryMark
                              code={rate.countryCode}
                              label={countryLabel}
                            />

                            <div className="min-w-0">
                              <p
                                className="
                                  truncate font-semibold
                                  tracking-[-0.02em]
                                  text-foreground
                                "
                              >
                                {countryLabel}
                              </p>

                              {rate.countryCode !== "ALL" ? (
                                <p
                                  className="
                                    mt-1 text-xs font-medium
                                    uppercase tracking-[0.08em]
                                    text-muted-foreground
                                  "
                                >
                                  {rate.countryCode}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div>
                            <p
                              className="
                                text-lg font-semibold
                                tracking-[-0.025em]
                                text-foreground tabular-nums
                              "
                            >
                              {formatMoney(
                                rate.mobile,
                                locale,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("perThousand")}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className="
                                text-lg font-semibold
                                tracking-[-0.025em]
                                text-foreground tabular-nums
                              "
                            >
                              {formatMoney(
                                rate.desktop,
                                locale,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("perThousand")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-3 md:hidden">
                  {payoutRates.map((rate) => {
                    const countryLabel = countryName(
                      rate.countryCode,
                      locale,
                      t,
                    );

                    return (
                      <MobileRateCard
                        key={rate.countryCode}
                        rate={rate}
                        countryLabel={countryLabel}
                        locale={locale}
                        t={t}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <div
                className="
                  flex min-h-40 items-center justify-center
                  rounded-[22px] border border-dashed border-border
                  bg-card/40 p-8 text-center
                  backdrop-blur-sm
                "
              >
                <p className="text-sm text-muted-foreground">
                  {t("noRates")}
                </p>
              </div>
            )}

            {/* Note */}
            <div
              className="
                mt-5 flex items-start gap-3
                rounded-2xl border border-border
                bg-card/60 p-4
                backdrop-blur-sm
              "
              role="note"
            >
              <Info
                aria-hidden="true"
                className="
                  mt-0.5 size-[17px]
                  shrink-0 text-muted-foreground
                "
              />

              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t("noteTitle")}
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("note")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQ
          description={t("faq.description")}
          eyebrow={t("faq.eyebrow")}
          faqs={payoutFaqs}
          highlightedTitle={t("faq.highlightedTitle")}
          title={t("faq.title")}
        />

        {/* CTA */}
        <FinalCTA dashboardHref={dashboardHref} />
      </main>

      <LandingFooter
        menus={menus}
        settings={settings}
      />
    </div>
  );
}
