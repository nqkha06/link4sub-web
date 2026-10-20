"use client";

import {
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RefreshCcw,
  SearchX,
  SlidersHorizontal,
  Timer,
  Zap,
  type LucideProps,
} from "lucide-react";
import { CopyFeedbackIcon } from "@/components/copy-feedback-icon";

import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { EmptyCard } from "@/components/dashboard/empty-card";
import { TablePagination } from "@/components/table-pagination";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/member/fields/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";

import type {
  WithdrawalStatus,
  WithdrawalTransaction,
  WithdrawalType,
} from "./types";

import type { WithdrawalController } from "./use-withdrawal-controller";

import {
  formatDateTime,
} from "./use-withdrawal-controller";
import { copyToClipboard } from "@/lib/clipboard";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type StatusFilter = WithdrawalStatus | "all";
type DateFilter = "all" | "30d" | "90d";
type SortFilter = "newest" | "oldest";

type StatusConfig = {
  icon: ComponentType<LucideProps>;
  className: string;
};

type TransactionWithPaidAt =
  WithdrawalTransaction & {
    paidAt?: string | null;
  };

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const STATUS_CONFIG: Record<
  WithdrawalStatus,
  StatusConfig
> = {
  pending: {
    icon: Clock3,
    className:
      "border-amber-500/20 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400",
  },

  processing: {
    icon: Clock3,
    className:
      "border-border bg-muted/70 text-foreground",
  },

  paid: {
    icon: CheckCircle2,
    className:
      "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400",
  },

  rejected: {
    icon: CircleAlert,
    className:
      "border-destructive/20 bg-destructive/[0.08] text-destructive",
  },

  cancelled: {
    icon: Ban,
    className:
      "border-border bg-muted/60 text-muted-foreground",
  },
};

const STATUS_OPTIONS: WithdrawalStatus[] = [
  "pending",
  "processing",
  "paid",
  "rejected",
  "cancelled",
];

const DATE_OPTIONS: DateFilter[] = [
  "all",
  "30d",
  "90d",
];

const SORT_OPTIONS: SortFilter[] = [
  "newest",
  "oldest",
];

const PAGE_SIZE_OPTIONS = [5, 10, 20];

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function getPaidAt(
  transaction: WithdrawalTransaction,
) {
  return (
    transaction as TransactionWithPaidAt
  ).paidAt;
}

async function copyTransactionId(
  id: string,
  successMessage: string,
) {
  if (await copyToClipboard(id)) toast.success(successMessage);
  else toast.error("Không thể sao chép mã giao dịch");
}

/* -------------------------------------------------------------------------- */
/*                                Status badge                                */
/* -------------------------------------------------------------------------- */

export function WithdrawalStatusBadge({
  status,
}: {
  status: WithdrawalStatus;
}) {
  const t = useTranslations("Withdraw");

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        `
          h-7
          gap-1.5
          rounded-lg
          px-2.5
          text-[11px]
          font-medium
          shadow-none
        `,
        config.className,
      )}
    >
      <Icon className="size-3.5" />

      {t(`status.${status}`)}
    </Badge>
  );
}

export function WithdrawalTypeBadge({
  type,
}: {
  type: WithdrawalType;
}) {
  const t = useTranslations("Withdraw");
  const Icon = type === "fast" ? Zap : Timer;
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 gap-1.5 rounded-lg px-2.5 text-[11px] font-medium shadow-none",
        type === "fast"
          ? "border-sky-500/25 bg-sky-500/[0.08] text-sky-700 dark:text-sky-400"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {t(`types.${type}.label`)}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Filters                                  */
/* -------------------------------------------------------------------------- */

function FilterSelect({
  value,
  label,
  ariaLabel,
  className,
  onValueChange,
  children,
}: {
  value: string;
  label: string;
  ariaLabel: string;
  className?: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          `
            w-full
            px-3
          `,
          className,
        )}
      >
        <SelectValue>
          {label}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
}

export function WithdrawalHistoryFilters({
  controller,
  onCriteriaChange,
}: {
  controller: WithdrawalController;
  onCriteriaChange?: () => void;
}) {
  const t = useTranslations("Withdraw");

  const statusLabel =
    controller.statusFilter === "all"
      ? t("filters.allStatuses")
      : t(
          `status.${controller.statusFilter}`,
        );

  const dateLabel = t(
    `filters.date.${controller.dateFilter}`,
  );

  const sortLabel = t(
    `filters.sort.${controller.sort}`,
  );

  return (
    <div
      className="
        flex
        w-full
        flex-col
        gap-2
        rounded-xl
        border
        border-border/60
        bg-muted/[0.22]
        p-2
        sm:flex-row
        sm:items-center
        lg:w-auto
      "
    >
      <div
        className="
          hidden
          size-8
          shrink-0
          place-items-center
          rounded-lg
          bg-background
          text-muted-foreground
          shadow-sm
          sm:grid
        "
      >
        <SlidersHorizontal className="size-3.5" />
      </div>

      <div
        className="
          grid
          flex-1
          grid-cols-2
          gap-2
          sm:flex
          sm:items-center
        "
      >
        <FilterSelect
          value={controller.statusFilter}
          label={statusLabel}
          ariaLabel={t(
            "filters.statusAria",
          )}
          className="sm:w-[145px]"
          onValueChange={(value) => {
            controller.setStatusFilter(
              value as StatusFilter,
            );

            onCriteriaChange?.();
          }}
        >
          <SelectItem value="all">
            {t("filters.allStatuses")}
          </SelectItem>

          {STATUS_OPTIONS.map(
            (status) => (
              <SelectItem
                key={status}
                value={status}
              >
                {t(`status.${status}`)}
              </SelectItem>
            ),
          )}
        </FilterSelect>

        <FilterSelect
          value={controller.dateFilter}
          label={dateLabel}
          ariaLabel={t(
            "filters.dateAria",
          )}
          className="sm:w-[125px]"
          onValueChange={(value) => {
            controller.setDateFilter(
              value as DateFilter,
            );

            onCriteriaChange?.();
          }}
        >
          {DATE_OPTIONS.map((date) => (
            <SelectItem
              key={date}
              value={date}
            >
              {t(
                `filters.date.${date}`,
              )}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={controller.sort}
          label={sortLabel}
          ariaLabel={t(
            "filters.sortAria",
          )}
          className="
            col-span-2
            sm:w-[125px]
          "
          onValueChange={(value) => {
            controller.setSort(
              value as SortFilter,
            );

            onCriteriaChange?.();
          }}
        >
          {SORT_OPTIONS.map((sort) => (
            <SelectItem
              key={sort}
              value={sort}
            >
              {t(
                `filters.sort.${sort}`,
              )}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Empty state                                */
/* -------------------------------------------------------------------------- */

export function WithdrawalEmptyState({
  filtered = false,
  onClear,
}: {
  filtered?: boolean;
  onClear?: () => void;
}) {
  const t = useTranslations("Withdraw");

  return (
    <EmptyCard
      icon={SearchX}
      title={
        filtered
          ? t("history.filteredEmptyTitle")
          : t("history.emptyTitle")
      }
      action={
        filtered && onClear
          ? {
              label: t("history.clearFilters"),
              onClick: onClear,
            }
          : undefined
      }
      className="min-h-[320px] rounded-none border-0 bg-transparent"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                             Transaction identity                           */
/* -------------------------------------------------------------------------- */

function TransactionIdentity({
  transaction,
  locale,
  onView,
}: {
  transaction: WithdrawalTransaction;
  locale: string;
  onView: () => void;
}) {
  const t = useTranslations("Withdraw");

  const paidAt = getPaidAt(transaction);

  return (
    <div
      className="
        flex
        items-start
        gap-3
      "
    >
      <div className="min-w-0">
        <div
          className="
            flex
            items-center
            gap-1
          "
        >
          <button
            type="button"
            onClick={onView}
            className="
              max-w-[180px]
              truncate
              font-mono
              text-xs
              font-semibold
              text-foreground
              transition-colors
              hover:text-primary
            "
          >
            #{transaction.id}
          </button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t(
              "actions.copyId",
            )}
            className="
              size-6
              shrink-0
              rounded-md
              text-muted-foreground
              hover:text-foreground
            "
            onClick={() =>
              void copyTransactionId(
                transaction.id,
                t(
                  "messages.copiedId",
                ),
              )
            }
          >
            <CopyFeedbackIcon className="size-3" />
          </Button>
        </div>

        <div
          className="
            mt-1.5
            flex
            flex-col
            gap-1
          "
        >
          <div
            className="
              flex
              items-center
              gap-1.5
              text-[11px]
              text-muted-foreground
            "
          >
            <span
              className="
                shrink-0
                text-muted-foreground/70
              "
            >
              Tạo:
            </span>

            <span className="whitespace-nowrap">
              {formatDateTime(
                transaction.createdAt,
                locale,
              )}
            </span>
          </div>

          <div
            className="
              flex
              items-center
              gap-1.5
              text-[11px]
            "
          >
            <span className="shrink-0 text-muted-foreground/70">
              Thanh toán:
            </span>

            {paidAt ? (
              <span
                className="
                  whitespace-nowrap
                  text-foreground/80
                "
              >
                {formatDateTime(
                  paidAt,
                  locale,
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">
                —
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Money block                                 */
/* -------------------------------------------------------------------------- */

function TransactionMoney({
  transaction,
  formatCurrency,
  align = "right",
}: {
  transaction: WithdrawalTransaction;
  formatCurrency: (
    value: number,
  ) => string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "right"
          ? "items-end text-right"
          : "items-start text-left",
      )}
    >
      <p
        className="
          text-sm
          font-semibold
          tabular-nums
          text-foreground
        "
      >
        {formatCurrency(
          transaction.netAmount,
        )}
      </p>

      <div
        className={cn(
          `
            mt-1.5
            flex
            flex-wrap
            items-center
            gap-x-2
            gap-y-1
            text-[11px]
            text-muted-foreground
          `,
          align === "right" &&
            "justify-end",
        )}
      >
        <span className="tabular-nums">
          Rút{" "}
          {formatCurrency(
            transaction.requestedAmount,
          )}
        </span>

        <span
          className="
            size-1
            rounded-full
            bg-border
          "
        />

        <span className="tabular-nums">
          Phí{" "}
          {formatCurrency(
            transaction.feeAmount,
          )}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Desktop Table                                 */
/* -------------------------------------------------------------------------- */

function WithdrawalDesktopTable({
  transactions,
  locale,
  formatCurrency,
  onView,
}: {
  transactions: WithdrawalTransaction[];
  locale: string;
  formatCurrency: (
    value: number,
  ) => string;
  onView: (
    transaction: WithdrawalTransaction,
  ) => void;
}) {
  const t = useTranslations("Withdraw");

  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow
            className="
              h-11
              border-border/70
              bg-muted/[0.28]
              hover:bg-muted/[0.28]
            "
          >
            <TableHead className="pl-5">
              {t(
                "history.columns.transaction",
              )}
            </TableHead>

            <TableHead>
              {t(
                "history.columns.method",
              )}
            </TableHead>

            <TableHead>
              {t("history.columns.type")}
            </TableHead>

            <TableHead className="text-right">
              Số tiền
            </TableHead>

            <TableHead className="pr-5 text-right">
              {t(
                "history.columns.status",
              )}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {transactions.map(
            (transaction) => (
              <TableRow
                key={
                  transaction.id
                }
                className="
                  h-[92px]
                  border-border/60
                  transition-colors
                  hover:bg-muted/[0.18]
                "
              >
                <TableCell className="pl-5">
                  <TransactionIdentity
                    transaction={
                      transaction
                    }
                    locale={locale}
                    onView={() =>
                      onView(
                        transaction,
                      )
                    }
                  />
                </TableCell>

                <TableCell>
                  <div
                    className="
                      max-w-[220px]
                    "
                  >
                    <p
                      className="
                        truncate
                        text-sm
                        font-medium
                        text-foreground
                      "
                    >
                      {
                        transaction
                          .method
                          .provider
                      }
                    </p>

                    <p
                      className="
                        mt-1
                        truncate
                        text-xs
                        text-muted-foreground
                      "
                    >
                      {
                        transaction
                          .method
                          .accountIdentifier
                      }
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <WithdrawalTypeBadge type={transaction.withdrawalType} />
                </TableCell>

                <TableCell className="text-right">
                  <TransactionMoney
                    transaction={
                      transaction
                    }
                    formatCurrency={
                      formatCurrency
                    }
                  />
                </TableCell>

                <TableCell className="pr-5 justify-end text-right">
                  <WithdrawalStatusBadge
                    status={
                      transaction.status
                    }
                  />
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Mobile Cards                                 */
/* -------------------------------------------------------------------------- */

function WithdrawalMobileList({
  transactions,
  locale,
  formatCurrency,
  onView,
}: {
  transactions: WithdrawalTransaction[];
  locale: string;
  formatCurrency: (
    value: number,
  ) => string;
  onView: (
    transaction: WithdrawalTransaction,
  ) => void;
}) {
  return (
    <div
      className="
        divide-y
        divide-border/60
        md:hidden
      "
    >
      {transactions.map(
        (transaction) => (
          <article
            key={transaction.id}
            className="
              px-4
              py-4
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-3
              "
            >
              <TransactionIdentity
                transaction={transaction}
                locale={locale}
                onView={() =>
                  onView(transaction)
                }
              />

              <WithdrawalStatusBadge
                status={
                  transaction.status
                }
              />
            </div>

            <div className="mt-3">
              <WithdrawalTypeBadge type={transaction.withdrawalType} />
            </div>

            <div
              className="
                mt-4
                flex
                items-center
                justify-between
                gap-4
                rounded-xl
                border
                border-border/50
                bg-muted/[0.22]
                p-3
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-xs
                    font-medium
                    text-foreground
                  "
                >
                  {
                    transaction
                      .method.provider
                  }
                </p>

                <p
                  className="
                    mt-1
                    truncate
                    text-[11px]
                    text-muted-foreground
                  "
                >
                  {
                    transaction
                      .method
                      .accountIdentifier
                  }
                </p>
              </div>

              <div className="shrink-0">
                <TransactionMoney
                  transaction={
                    transaction
                  }
                  formatCurrency={
                    formatCurrency
                  }
                  align="right"
                />
              </div>
            </div>
          </article>
        ),
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  History                                   */
/* -------------------------------------------------------------------------- */

export function WithdrawalHistory({
  controller,
}: {
  controller: WithdrawalController;
}) {
  const locale = useLocale();
  const t = useTranslations("Withdraw");

  const {
    data,
    historyError,
    filteredTransactions,
    setDetailTransaction,
    formatCurrency,
  } = controller;

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  const filtersActive =
    controller.statusFilter !== "all" ||
    controller.dateFilter !== "all";

  const totalItems =
    filteredTransactions.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalItems / pageSize,
    ),
  );

  const safePage = Math.min(
    Math.max(page, 1),
    totalPages,
  );

  const visibleTransactions =
    useMemo(() => {
      const start =
        (safePage - 1) *
        pageSize;

      return filteredTransactions.slice(
        start,
        start + pageSize,
      );
    }, [
      filteredTransactions,
      pageSize,
      safePage,
    ]);

  if (!data) return null;

  const filteredEmpty =
    filtersActive ||
    data.transactions.length > 0;

  return (
    <section
      aria-labelledby="withdrawal-history-title"
      className="
        overflow-hidden
        rounded-2xl
        border
        border-border/70
        bg-card
        shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_24px_-20px_rgba(0,0,0,0.15)]
      "
    >
      {/* HEADER */}
      <div
        className="
          flex
          flex-col
          gap-4
          border-b
          border-border/70
          px-4
          py-4
          sm:px-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <h2
                id="withdrawal-history-title"
                className="
                  text-[15px]
                  font-semibold
                  tracking-[-0.01em]
                  sm:text-base
                "
              >
                {t(
                  "history.title",
                )}
              </h2>
        </div>

        <WithdrawalHistoryFilters
          controller={controller}
          onCriteriaChange={() =>
            setPage(1)
          }
        />
      </div>

      {/* ERROR */}
      {historyError ? (
        <div className="p-4 sm:p-5">
          <Alert variant="destructive">
            <AlertCircle />

            <AlertTitle>
              {t(
                "errors.historyTitle",
              )}
            </AlertTitle>

            <AlertDescription>
              <p>{historyError}</p>

              <Button
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <RefreshCcw />

                {t(
                  "actions.retry",
                )}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : !filteredTransactions.length ? (
        <WithdrawalEmptyState
          filtered={filteredEmpty}
          onClear={
            filtersActive
              ? () => {
                  controller.setStatusFilter("all");
                  controller.setDateFilter("all");
                  setPage(1);
                }
              : undefined
          }
        />
      ) : (
        <>
          <WithdrawalDesktopTable
            transactions={
              visibleTransactions
            }
            locale={locale}
            formatCurrency={
              formatCurrency
            }
            onView={
              setDetailTransaction
            }
          />

          <WithdrawalMobileList
            transactions={
              visibleTransactions
            }
            locale={locale}
            formatCurrency={
              formatCurrency
            }
            onView={
              setDetailTransaction
            }
          />

          <footer
            className="
              border-t
              border-border/70
              bg-muted/[0.12]
              px-4
              py-3
              sm:px-5
            "
          >
            <TablePagination
              page={safePage}
              pageSize={pageSize}
              totalItems={
                filteredTransactions.length
              }
              pageSizeOptions={
                PAGE_SIZE_OPTIONS
              }
              onPageChange={
                setPage
              }
              onPageSizeChange={(
                size,
              ) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </footer>
        </>
      )}
    </section>
  );
}
