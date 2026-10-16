import { useLocale, useTranslations } from "next-intl";

import { loyaltyCardClass } from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";
import type { LoyaltyHistoryRow } from "@/features/loyalty/types";
import { cn } from "@/lib/utils";

export function LoyaltyHistory({
  history,
  windowDays,
}: {
  history: LoyaltyHistoryRow[];
  windowDays: number;
}) {
  const t = useTranslations("SimplePages.loyalty");

  return (
    <SoftCard
      className={cn(
        loyaltyCardClass,
        "overflow-hidden p-0",
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
        <h2 className="min-w-0 font-semibold text-foreground">
          {t("historyTitle")}
        </h2>

        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
          {history.length} ngày
        </span>
      </header>

      {history.length ? (
        <>
          <div>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-sm">
                <caption className="sr-only">
                  {t("historyCaption", {
                    days: windowDays,
                  })}
                </caption>

                <thead className="border-b bg-muted/20">
                  <tr className="text-left text-xs font-medium text-muted-foreground">
                    <th
                      scope="col"
                      className="px-4 py-3.5 sm:px-6 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        {t("date")}
                      </span>
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3.5 text-right font-medium"
                    >
                      <span className="flex items-center justify-end gap-2">
                        {t("dailyViews")}
                      </span>
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3.5 text-right font-medium"
                    >
                      <span className="flex items-center justify-end gap-2">
                        {t("rollingViews", {
                          days: windowDays,
                        })}
                      </span>
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3.5 sm:px-6 text-right font-medium"
                    >
                      <span className="flex items-center justify-end gap-2">
                        {t("tier")}
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {history.map((row) => (
                    <HistoryRow
                      key={row.date}
                      row={row}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <EmptyHistory />
      )}
    </SoftCard>
  );
}

/* =========================================================
   DESKTOP ROW
========================================================= */

function HistoryRow({
  row,
}: {
  row: LoyaltyHistoryRow;
}) {
  const locale = useLocale();
  const t = useTranslations("SimplePages.loyalty");

  const number = new Intl.NumberFormat(locale);

  const formattedDate = formatHistoryDate(
    row.date,
    locale,
  );

  return (
    <tr className="group transition-colors hover:bg-muted/20">
      <th
        scope="row"
        className="whitespace-nowrap px-4 py-4 sm:px-6 text-left font-medium text-foreground"
      >
        {formattedDate}
      </th>

      <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-muted-foreground">
        {number.format(row.dailyValidViews)}
      </td>

      <td className="whitespace-nowrap px-4 py-4 text-right">
        <span className="font-semibold tabular-nums text-foreground">
          {number.format(row.rollingValidViews)}
        </span>
      </td>

      <td className="px-4 py-4 sm:px-6 text-right">
        <TierBadge
          name={row.tier?.name ?? t("unranked")}
        />
      </td>
    </tr>
  );
}

/* =========================================================
   TIER BADGE
========================================================= */

function TierBadge({
  name,
}: {
  name: string;
}) {
  const normalized = name.toLowerCase();

  const tone =
    normalized.includes("kim cương") ||
    normalized.includes("diamond")
      ? "violet"
      : normalized.includes("vàng") ||
          normalized.includes("gold")
        ? "yellow"
        : normalized.includes("đồng") ||
            normalized.includes("bronze")
          ? "amber"
          : normalized.includes("khởi đầu") ||
              normalized.includes("starter")
            ? "blue"
            : "neutral";

  const styles = {
    blue:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-400",

    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400",

    yellow:
      "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-400",

    violet:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-400",

    neutral:
      "border-border bg-muted/40 text-muted-foreground",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[tone],
      )}
    >
      {name}
    </span>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyHistory() {
  const t = useTranslations("SimplePages.loyalty");

  return (
    <div className="px-5 py-14 text-center sm:px-6">
      <p className="text-sm font-semibold">
        Chưa có lịch sử
      </p>

      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        Dữ liệu lượt xem và thay đổi hạng sẽ xuất hiện tại đây khi hệ thống bắt đầu ghi nhận hoạt động.
      </p>
    </div>
  );
}

/* =========================================================
   DATE
========================================================= */

function formatHistoryDate(
  value: string,
  locale: string,
) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}