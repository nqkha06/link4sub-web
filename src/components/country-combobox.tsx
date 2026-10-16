"use client";

import { Check, ChevronsUpDown, Globe2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ISO_COUNTRY_CODES } from "@/contracts";
import { cn } from "@/lib/utils";

type CountryOption = {
  code: string;
  name: string;
  special?: boolean;
};

type CountryComboboxProps = {
  id: string;
  allowAll?: boolean;
  disabled?: boolean;
} & (
  | { multiple?: false; value: string; onChange: (countryCode: string) => void }
  | { multiple: true; value: string[]; onChange: (countryCodes: string[]) => void }
);

export function CountryCombobox(props: CountryComboboxProps) {
  const { id, allowAll = true, disabled = false } = props;
  const locale = useLocale();
  const t = useTranslations("Admin.monetizationLevels.country");
  const [open, setOpen] = React.useState(false);
  const options = React.useMemo(() => {
    const countryOptions = buildCountryOptions(locale, {
      all: t("all"),
      unknown: t("unknown"),
    });
    return allowAll
      ? countryOptions
      : countryOptions.filter((option) => option.code !== "ALL");
  }, [allowAll, locale, t]);
  const values = props.multiple ? props.value : [props.value];
  const normalizedValues = [...new Set(values.map((code) => code.toUpperCase()))];
  const selectedCodes = props.multiple && allowAll &&
    (normalizedValues.length === 0 || normalizedValues.includes("ALL"))
    ? ["ALL"]
    : normalizedValues;
  const selectedOptions = selectedCodes.map((code) =>
    options.find((option) => option.code === code) ?? { code, name: code },
  );
  const selectCountry = (code: string) => {
    if (!props.multiple) {
      props.onChange(code);
      setOpen(false);
      return;
    }
    if (code === "ALL") {
      props.onChange(["ALL"]);
      return;
    }
    const specificCodes = selectedCodes.filter((value) => value !== "ALL");
    const next = specificCodes.includes(code)
      ? specificCodes.filter((value) => value !== code)
      : [...specificCodes, code];
    props.onChange(next.length === 0 && allowAll ? ["ALL"] : next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          disabled={disabled}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={t("select")}
          className="h-auto min-h-9 w-full min-w-0 justify-between bg-background px-3 font-normal shadow-xs"
        >
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            {selectedOptions.slice(0, 2).map((selected) => (
              <span
                key={selected.code}
                className={cn(
                  "flex min-w-0 max-w-full items-center gap-2",
                  props.multiple && selectedOptions.length > 1 && "rounded bg-muted px-1.5 py-0.5",
                )}
              >
                <CountryFlag code={selected.code} />
                <span className="truncate">{selected.name}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {selected.code}
                </span>
              </span>
            ))}
            {selectedOptions.length > 2 ? (
              <span className="text-xs text-muted-foreground">
                {t("more", { count: selectedOptions.length - 2 })}
              </span>
            ) : null}
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">
                {t("select")}
              </span>
            ) : null}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-64 max-w-[calc(100vw-2rem)] p-0"
      >
        <Command>
          <CommandInput
            placeholder={t("searchPlaceholder")}
          />
          <CommandList>
            <CommandEmpty>{t("empty")}</CommandEmpty>
            <CommandGroup heading={t("systemValues")}>
              {options
                .filter((option) => option.special)
                .map((option) => (
                  <CountryItem
                    key={option.code}
                    option={option}
                    selected={selectedCodes.includes(option.code)}
                    onSelect={selectCountry}
                  />
                ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t("countries")}>
              {options
                .filter((option) => !option.special)
                .map((option) => (
                  <CountryItem
                    key={option.code}
                    option={option}
                    selected={selectedCodes.includes(option.code)}
                    onSelect={selectCountry}
                  />
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CountryItem({
  option,
  selected,
  onSelect,
}: {
  option: CountryOption;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <CommandItem
      value={`${option.code} ${option.name}`}
      onSelect={() => onSelect(option.code)}
    >
      <CountryFlag code={option.code} />
      <span className="min-w-0 flex-1 truncate">{option.name}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {option.code}
      </span>
      <Check
        className={cn(
          "size-4",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
    </CommandItem>
  );
}

export function CountryFlag({ code }: { code: string }) {
  if (code === "ALL") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary">
        <Globe2 className="size-3.5" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "fi shrink-0 rounded-[2px] shadow-sm ring-1 ring-black/5",
        `fi-${code === "ZZ" ? "xx" : code.toLowerCase()}`,
      )}
    />
  );
}

export function buildCountryOptions(
  locale: string,
  labels: { all: string; unknown: string },
): CountryOption[] {
  const displayNames = new Intl.DisplayNames([locale], {
    type: "region",
  });
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const countries = ISO_COUNTRY_CODES.map((code) => ({
    code,
    name: displayNames.of(code) ?? code,
  })).sort((left, right) => collator.compare(left.name, right.name));

  return [
    {
      code: "ALL",
      name: labels.all,
      special: true,
    },
    {
      code: "ZZ",
      name: labels.unknown,
      special: true,
    },
    ...countries,
  ];
}
