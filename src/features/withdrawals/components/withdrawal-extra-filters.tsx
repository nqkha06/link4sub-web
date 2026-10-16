"use client";

import { WITHDRAWAL_PROCESSING_HOURS } from "@/contracts";
import {
  AlarmClock,
  CalendarCheck,
  CalendarDays,
  Check,
  KeyRound,
  Landmark,
  type LucideIcon,
  Timer,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { parseAsInteger, useQueryStates } from "nuqs";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { enUS, id as idLocale, vi } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { withdrawalFilterParsers } from "@/features/withdrawals/query/withdrawals-search-params";
import { formatWithdrawalMoney } from "@/features/withdrawals/withdrawal-status";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                               URL state hook                               */
/* -------------------------------------------------------------------------- */

const emptyFilters = {
  type: null,
  method: null,
  account: null,
  minAmount: null,
  maxAmount: null,
  createdFrom: null,
  createdTo: null,
  processedFrom: null,
  processedTo: null,
  overdue: null,
} as const;

/**
 * Đọc/ghi các bộ lọc bổ sung trên URL. Mọi thay đổi đều đưa về trang 1 và
 * kích hoạt tải lại dữ liệu từ server (shallow: false).
 */
export function useWithdrawalExtraFilters() {
  const [values, setValues] = useQueryStates(
    { ...withdrawalFilterParsers, page: parseAsInteger },
    { shallow: false, clearOnDefault: true },
  );

  const update = React.useCallback(
    (patch: Partial<Record<keyof typeof emptyFilters, unknown>>) => {
      void setValues({ ...patch, page: null } as Parameters<
        typeof setValues
      >[0]);
    },
    [setValues],
  );

  const reset = React.useCallback(() => {
    void setValues({ ...emptyFilters, page: null });
  }, [setValues]);

  const activeCount =
    (values.type ? 1 : 0) +
    (values.method.length ? 1 : 0) +
    (values.account ? 1 : 0) +
    (values.minAmount !== null || values.maxAmount !== null ? 1 : 0) +
    (values.createdFrom !== null || values.createdTo !== null ? 1 : 0) +
    (values.processedFrom !== null || values.processedTo !== null ? 1 : 0) +
    (values.overdue ? 1 : 0);

  return { values, update, reset, activeCount };
}

export type WithdrawalExtraFilterState = ReturnType<
  typeof useWithdrawalExtraFilters
>;

/* -------------------------------------------------------------------------- */
/*                                 Filter bar                                 */
/* -------------------------------------------------------------------------- */

const typeOptions = [
  { value: "standard", labelKey: "typeStandard", icon: Timer },
  { value: "fast", labelKey: "typeFast", icon: Zap },
] as const;

const calendarLocales = { vi, en: enUS, id: idLocale } as const;

export function WithdrawalExtraFilters({
  filters,
  paymentMethods,
  currency,
}: {
  filters: WithdrawalExtraFilterState;
  paymentMethods: string[];
  currency?: string;
}) {
  const t = useTranslations("Admin.withdrawals.filters");
  const tc = useTranslations("Admin.common");
  const { values, update } = filters;
  const hours = WITHDRAWAL_PROCESSING_HOURS;

  return (
    <>
      <OptionFilter
        icon={Timer}
        title={t("type")}
        options={typeOptions.map(({ value, labelKey, icon }) => ({
          value,
          label: t(labelKey),
          icon,
        }))}
        value={values.type ? [values.type] : []}
        onChange={(next) => update({ type: next[0] ?? null })}
      />

      {paymentMethods.length > 0 ? (
        <OptionFilter
          icon={Landmark}
          title={t("method")}
          multiple
          searchable={paymentMethods.length > 6}
          options={paymentMethods.map((name) => ({ value: name, label: name }))}
          value={values.method}
          onChange={(next) => update({ method: next.length ? next : null })}
        />
      ) : null}

      <AmountRangeFilter
        min={values.minAmount}
        max={values.maxAmount}
        currency={currency}
        onChange={(min, max) => update({ minAmount: min, maxAmount: max })}
      />

      <DateRangeFilter
        icon={CalendarDays}
        title={tc("createdAt")}
        from={values.createdFrom}
        to={values.createdTo}
        onChange={(from, to) => update({ createdFrom: from, createdTo: to })}
      />

      <DateRangeFilter
        icon={CalendarCheck}
        title={t("processedDate")}
        from={values.processedFrom}
        to={values.processedTo}
        onChange={(from, to) =>
          update({ processedFrom: from, processedTo: to })
        }
      />

      <TextFilter
        icon={KeyRound}
        title={t("account")}
        placeholder={t("accountPlaceholder")}
        description={t("accountDescription")}
        value={values.account}
        onChange={(next) => update({ account: next || null })}
      />

      <Button
        type="button"
        variant="outline"
        aria-pressed={values.overdue}
        title={t("overdueHint", {
          fastHours: hours.fast.max,
          standardDays: hours.standard.max / 24,
        })}
        onClick={() => update({ overdue: values.overdue ? null : true })}
        className={cn(
          "border-dashed font-normal",
          values.overdue &&
            "border-solid border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive",
        )}
      >
        <AlarmClock />
        {t("overdue")}
      </Button>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Shared trigger                               */
/* -------------------------------------------------------------------------- */

function FilterTrigger({
  icon: Icon,
  title,
  summary,
  onClear,
  className,
  ...props
}: {
  icon: LucideIcon;
  title: string;
  summary: string | null;
  onClear: () => void;
} & Omit<React.ComponentProps<typeof Button>, "title" | "children">) {
  const t = useTranslations("Admin.withdrawals.filters");
  const active = summary !== null;

  return (
    <Button
      type="button"
      variant="outline"
      {...props}
      className={cn(
        "border-dashed font-normal",
        active && "border-solid border-primary/40 bg-primary/5",
        className,
      )}
    >
      {active ? (
        <span
          role="button"
          tabIndex={0}
          aria-label={t("clearFilterAria", { title })}
          onClick={(event) => {
            event.stopPropagation();
            onClear();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onClear();
            }
          }}
          className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <XCircle />
        </span>
      ) : (
        <Icon />
      )}
      {title}
      {active ? (
        <>
          <Separator
            orientation="vertical"
            className="mx-0.5 data-[orientation=vertical]:h-4"
          />
          <span className="max-w-44 truncate">{summary}</span>
        </>
      ) : null}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Option (select)                               */
/* -------------------------------------------------------------------------- */

type FilterOption = { value: string; label: string; icon?: LucideIcon };

function OptionFilter({
  icon,
  title,
  options,
  value,
  onChange,
  multiple = false,
  searchable = false,
}: {
  icon: LucideIcon;
  title: string;
  options: FilterOption[];
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
}) {
  const t = useTranslations("Admin.withdrawals.filters");
  const [open, setOpen] = React.useState(false);
  const selected = new Set(value);

  const labels = options
    .filter((option) => selected.has(option.value))
    .map((option) => option.label);
  const summary =
    labels.length === 0
      ? null
      : labels.length <= 2
        ? labels.join(", ")
        : t("selectedCount", { count: labels.length });

  function toggle(option: FilterOption) {
    if (!multiple) {
      onChange(selected.has(option.value) ? [] : [option.value]);
      setOpen(false);
      return;
    }
    const next = new Set(selected);
    if (next.has(option.value)) next.delete(option.value);
    else next.add(option.value);
    onChange(Array.from(next));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterTrigger
          icon={icon}
          title={title}
          summary={summary}
          onClear={() => onChange([])}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          {searchable ? (
            <CommandInput placeholder={t("searchPlaceholder", { title: title.toLowerCase() })} />
          ) : null}
          <CommandList>
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value);
                const OptionIcon = option.icon;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option)}
                  >
                    {multiple ? (
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                    {OptionIcon ? (
                      <OptionIcon className="text-muted-foreground" />
                    ) : null}
                    <span className="truncate">{option.label}</span>
                    {!multiple && isSelected ? (
                      <Check className="ml-auto size-4" />
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {value.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    {t("clearSelection")}
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Date range                                 */
/* -------------------------------------------------------------------------- */

function createDateFormatter(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

const datePresets: Array<{
  labelKey: string;
  range: () => [Date, Date];
}> = [
  { labelKey: "presets.today", range: () => [new Date(), new Date()] },
  { labelKey: "presets.yesterday", range: () => [daysAgo(1), daysAgo(1)] },
  { labelKey: "presets.last7", range: () => [daysAgo(6), new Date()] },
  { labelKey: "presets.last30", range: () => [daysAgo(29), new Date()] },
  {
    labelKey: "presets.thisMonth",
    range: () => {
      const now = new Date();
      return [new Date(now.getFullYear(), now.getMonth(), 1), now];
    },
  },
  {
    labelKey: "presets.lastMonth",
    range: () => {
      const now = new Date();
      return [
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
        new Date(now.getFullYear(), now.getMonth(), 0),
      ];
    },
  },
];

function DateRangeFilter({
  icon,
  title,
  from,
  to,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  from: number | null;
  to: number | null;
  onChange: (from: number | null, to: number | null) => void;
}) {
  const t = useTranslations("Admin.withdrawals.filters");
  const locale = useLocale();
  const dateFormatter = React.useMemo(
    () => createDateFormatter(locale),
    [locale],
  );
  const [open, setOpen] = React.useState(false);

  const summary =
    from !== null && to !== null
      ? `${dateFormatter.format(from)} – ${dateFormatter.format(to)}`
      : from !== null
        ? t("fromDate", { date: dateFormatter.format(from) })
        : to !== null
          ? t("toDate", { date: dateFormatter.format(to) })
          : null;

  const selected: DateRange = {
    from: from !== null ? new Date(from) : undefined,
    to: to !== null ? new Date(to) : undefined,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterTrigger
          icon={icon}
          title={title}
          summary={summary}
          onClear={() => onChange(null, null)}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-row flex-wrap gap-1 border-b p-2 sm:w-36 sm:flex-col sm:flex-nowrap sm:border-r sm:border-b-0">
            {datePresets.map((preset) => (
              <Button
                key={preset.labelKey}
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => {
                  const [start, end] = preset.range();
                  onChange(
                    startOfDay(start).getTime(),
                    endOfDay(end).getTime(),
                  );
                  setOpen(false);
                }}
              >
                {t(preset.labelKey)}
              </Button>
            ))}
            {from !== null || to !== null ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start font-normal text-muted-foreground"
                onClick={() => {
                  onChange(null, null);
                  setOpen(false);
                }}
              >
                {t("clearRange")}
              </Button>
            ) : null}
          </div>
          <Calendar
            autoFocus
            mode="range"
            locale={calendarLocales[locale as keyof typeof calendarLocales] ?? vi}
            weekStartsOn={1}
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected.from}
            onSelect={(range) =>
              onChange(
                range?.from ? startOfDay(range.from).getTime() : null,
                range?.to ? endOfDay(range.to).getTime() : null,
              )
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Amount range                                */
/* -------------------------------------------------------------------------- */

function AmountRangeFilter({
  min,
  max,
  currency,
  onChange,
}: {
  min: number | null;
  max: number | null;
  currency?: string;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const t = useTranslations("Admin.withdrawals.filters");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [draftMin, setDraftMin] = React.useState("");
  const [draftMax, setDraftMax] = React.useState("");
  const [error, setError] = React.useState("");

  const format = (value: number) =>
    currency
      ? formatWithdrawalMoney(String(value), currency, locale)
      : new Intl.NumberFormat(locale).format(value);

  const summary =
    min !== null && max !== null
      ? `${format(min)} – ${format(max)}`
      : min !== null
        ? t("fromDate", { date: format(min) })
        : max !== null
          ? t("toDate", { date: format(max) })
          : null;

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraftMin(min !== null ? String(min) : "");
      setDraftMax(max !== null ? String(max) : "");
      setError("");
    }
    setOpen(next);
  }

  function apply(event?: React.FormEvent) {
    event?.preventDefault();
    const nextMin = draftMin.trim() === "" ? null : Number(draftMin);
    const nextMax = draftMax.trim() === "" ? null : Number(draftMax);

    if (
      (nextMin !== null && (!Number.isFinite(nextMin) || nextMin < 0)) ||
      (nextMax !== null && (!Number.isFinite(nextMax) || nextMax < 0))
    ) {
      setError(t("errorNegative"));
      return;
    }
    if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
      setError(t("errorRange"));
      return;
    }
    onChange(nextMin, nextMax);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <FilterTrigger
          icon={WalletCards}
          title={t("amount")}
          summary={summary}
          onClear={() => onChange(null, null)}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form onSubmit={apply} className="space-y-3">
          <p className="text-sm font-medium">
            {t("amountTitle")}
            {currency ? ` (${currency})` : ""}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              {t("min")}
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="0"
                value={draftMin}
                onChange={(event) => setDraftMin(event.target.value)}
                className="h-8 text-foreground"
                autoFocus
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              {t("max")}
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder={t("maxPlaceholder")}
                value={draftMax}
                onChange={(event) => setDraftMax(event.target.value)}
                className="h-8 text-foreground"
              />
            </label>
          </div>
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(null, null);
                setOpen(false);
              }}
            >
              {t("clear")}
            </Button>
            <Button type="submit" size="sm">
              {tc("apply")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Text                                    */
/* -------------------------------------------------------------------------- */

function TextFilter({
  icon,
  title,
  placeholder,
  description,
  value,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  placeholder: string;
  description?: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const t = useTranslations("Admin.withdrawals.filters");
  const tc = useTranslations("Admin.common");
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(value);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <FilterTrigger
          icon={icon}
          title={title}
          summary={value || null}
          onClear={() => onChange("")}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onChange(draft.trim());
            setOpen(false);
          }}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">{title}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            maxLength={100}
            className="h-8"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {t("clear")}
            </Button>
            <Button type="submit" size="sm">
              {tc("apply")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
