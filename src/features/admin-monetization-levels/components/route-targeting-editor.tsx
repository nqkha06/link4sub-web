"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Cpu, Globe2, ListFilter, MonitorSmartphone, PanelsTopLeft, Plus, Trash2, X } from "lucide-react";
import {
  routeBrowserValues,
  routeDeviceValues,
  routeOperatingSystemValues,
  type RouteTargeting,
  type TargetingList,
} from "@/contracts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildCountryOptions, CountryFlag } from "@/components/country-combobox";

type Option = { value: string; label: string; icon?: React.ReactNode };
type TargetingKey = "countries" | "devices" | "operatingSystems" | "browsers";
type TargetingSide = keyof TargetingList;
type DraftCondition = { id: string; field: TargetingKey; side: TargetingSide };

const targetingKeys: TargetingKey[] = ["countries", "devices", "operatingSystems", "browsers"];

function conditionsFromTargeting(value: RouteTargeting): DraftCondition[] {
  return targetingKeys.flatMap((field) => (["include", "exclude"] as const)
    .filter((side) => value[field][side].length > 0)
    .map((side) => ({ id: `${field}-${side}`, field, side })));
}

function cloneTargeting(value: RouteTargeting): RouteTargeting {
  return {
    ...value,
    countries: { ...value.countries },
    devices: { ...value.devices },
    operatingSystems: { ...value.operatingSystems },
    browsers: { ...value.browsers },
  };
}

function TargetingMultiSelect({ values, options, placeholder, label, blocked = [], onChange }: {
  values: string[];
  options: Option[];
  placeholder: string;
  label: string;
  blocked?: string[];
  onChange: (values: string[]) => void;
}) {
  const t = useTranslations("Admin.monetizationLevels.routeTargeting");
  const [open, setOpen] = React.useState(false);
  const triggerId = React.useId();
  return (
    <div className="min-w-0">
      <Label htmlFor={triggerId} className="sr-only">{label}</Label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-background p-1.5">
        {values.map((value) => {
          const option = options.find((item) => item.value === value);
          return (
            <span key={value} className="flex max-w-full items-center gap-1.5 rounded bg-muted py-1 pl-2 pr-1 text-xs">
              {option?.icon}
              <span className="truncate">{option?.label ?? value}</span>
              <button type="button" className="shrink-0 rounded p-1 hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={t("removeFrom", { option: option?.label ?? value, label: label.toLowerCase() })}
                onClick={() => onChange(values.filter((item) => item !== value))}>
                <X className="size-3" />
              </button>
            </span>
          );
        })}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button id={triggerId} type="button" variant="ghost" size="sm"
              aria-label={label} aria-expanded={open}
              className="h-7 min-w-0 px-2 text-xs font-normal text-muted-foreground">
              {values.length === 0 ? <span className="truncate">{placeholder}</span> : null}
              <Plus className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)] p-0">
            <Command>
              <CommandInput placeholder={t("searchPlaceholder")} aria-label={t("searchLabel", { label: label.toLowerCase() })} />
              <CommandList>
                <CommandEmpty>{t("empty")}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem key={option.value} value={`${option.value} ${option.label}`}
                      disabled={blocked.includes(option.value) && !values.includes(option.value)}
                      onSelect={() => onChange(values.includes(option.value)
                        ? values.filter((value) => value !== option.value)
                        : [...values, option.value])}>
                      {option.icon}
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{blocked.includes(option.value) ? t("alreadyExcluded") : option.value}</span>
                      <Check aria-hidden="true" className={values.includes(option.value) ? "size-4" : "size-4 opacity-0"} />
                      {values.includes(option.value) ? <span className="sr-only">{t("selected")}</span> : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export function RouteTargetingEditor({ value, onChange }: {
  value: RouteTargeting;
  onChange: (value: RouteTargeting) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Admin.monetizationLevels.routeTargeting");
  const tCountry = useTranslations("Admin.monetizationLevels.country");
  const countries = React.useMemo(() => buildCountryOptions(locale, { all: tCountry("all"), unknown: tCountry("unknown") })
    .filter((option) => option.code !== "ALL")
    .map((option) => ({ value: option.code, label: option.name, icon: <CountryFlag code={option.code} /> })), [locale, tCountry]);
  const fields = [
    { key: "countries" as const, label: t("countries"), icon: Globe2, options: countries },
    { key: "devices" as const, label: t("devices"), icon: MonitorSmartphone,
      options: routeDeviceValues.map((item) => ({ value: item, label: ({ desktop: "Desktop", mobile: "Mobile", tablet: "Tablet" })[item] })) },
    { key: "operatingSystems" as const, label: t("operatingSystems"), icon: Cpu,
      options: routeOperatingSystemValues.map((item) => ({ value: item, label: ({ android: "Android", ios: "iOS", windows: "Windows", macos: "macOS", linux: "Linux", other: t("other") })[item] })) },
    { key: "browsers" as const, label: t("browsers"), icon: PanelsTopLeft,
      options: routeBrowserValues.map((item) => ({ value: item, label: ({ chrome: "Chrome", safari: "Safari", firefox: "Firefox", edge: "Edge", opera: "Opera", other: t("other") })[item] })) },
  ];
  const [conditions, setConditions] = React.useState<DraftCondition[]>(() => conditionsFromTargeting(value));
  const nextConditionId = React.useRef(0);

  function updateList(key: TargetingKey, side: TargetingSide, values: string[]) {
    const current = value[key];
    const next = side === "exclude"
      ? { include: current.include.filter((item) => !values.includes(item)), exclude: values }
      : { ...current, include: values.filter((item) => !current.exclude.includes(item)) };
    onChange({ ...value, [key]: next });
  }

  function moveCondition(condition: DraftCondition, field: TargetingKey, side: TargetingSide) {
    if (condition.field === field && condition.side === side) return;
    if (conditions.some((item) => item.id !== condition.id && item.field === field && item.side === side)) return;
    const next = cloneTargeting(value);
    const values = next[condition.field][condition.side];
    next[condition.field][condition.side] = [];
    next[field][side] = values.filter((item) => !next[field][side === "include" ? "exclude" : "include"].includes(item));
    setConditions((current) => current.map((item) => item.id === condition.id ? { ...item, field, side } : item));
    onChange(next);
  }

  function removeCondition(condition: DraftCondition) {
    const next = cloneTargeting(value);
    next[condition.field][condition.side] = [];
    setConditions((current) => current.filter((item) => item.id !== condition.id));
    onChange(next);
  }

  function addCondition() {
    const available = targetingKeys.flatMap((field) => (["include", "exclude"] as const).map((side) => ({ field, side })))
      .find((candidate) => !conditions.some((condition) => condition.field === candidate.field && condition.side === candidate.side));
    if (!available) return;
    nextConditionId.current += 1;
    setConditions((current) => [...current, { id: `draft-${nextConditionId.current}`, ...available }]);
  }

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold"><ListFilter className="size-4" /> {t("title")}</h3>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("description")}</p>
        </div>
        <div role="radiogroup" aria-label={t("matchModeLabel")} className="grid shrink-0 grid-cols-2 gap-1 rounded-md border bg-muted/40 p-1">
          {(["all", "any"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={value.matchMode === mode}
              onClick={() => onChange({ ...value, matchMode: mode })}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${value.matchMode === mode ? "bg-background text-foreground shadow-sm ring-1 ring-primary/30" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t(mode === "all" ? "matchAll" : "matchAny")}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 mt-4 text-xs text-muted-foreground">
        {conditions.length === 0
          ? t("noConditions")
          : t(value.matchMode === "all" ? "allMustMatch" : "anyMustMatch")}
      </p>

      <div className="flex flex-col">
        {conditions.map((condition, index) => {
          const field = fields.find((item) => item.key === condition.field) ?? fields[0];
          if (!field) return null;
          const oppositeSide: TargetingSide = condition.side === "include" ? "exclude" : "include";
          return (
            <React.Fragment key={condition.id}>
              {index > 0 ? (
                <div className="flex items-center gap-2 py-1.5 pl-3" aria-hidden="true">
                  <span className="h-3 w-px bg-border" />
                  <span className="rounded bg-muted px-1.5 py-px font-mono text-[10px] font-semibold text-muted-foreground">
                    {value.matchMode === "all" ? "AND" : "OR"}
                  </span>
                </div>
              ) : null}
              <div className="rounded-md border bg-card p-3">
                <div className="grid items-start gap-2 sm:grid-cols-[minmax(0,150px)_minmax(0,140px)_minmax(0,1fr)_auto]">
                  <Select value={condition.field} onValueChange={(next) => moveCondition(condition, next as TargetingKey, condition.side)}>
                    <SelectTrigger className="w-full" aria-label={t("fieldLabel")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map(({ key, label, icon: Icon }) => (
                        <SelectItem key={key} value={key} disabled={conditions.some((item) => item.id !== condition.id && item.field === key && item.side === condition.side)}>
                          <Icon className="size-4" /> {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={condition.side} onValueChange={(next) => moveCondition(condition, condition.field, next as TargetingSide)}>
                    <SelectTrigger className="w-full font-mono text-xs" aria-label={t("operatorLabel")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="include" disabled={conditions.some((item) => item.id !== condition.id && item.field === condition.field && item.side === "include")}>{t("operatorIn")}</SelectItem>
                      <SelectItem value="exclude" disabled={conditions.some((item) => item.id !== condition.id && item.field === condition.field && item.side === "exclude")}>{t("operatorNotIn")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <TargetingMultiSelect
                    values={value[condition.field][condition.side]}
                    options={field.options}
                    blocked={value[condition.field][oppositeSide]}
                    label={t("valueLabel", { group: field.label.toLowerCase() })}
                    placeholder={t("selectValues", { group: field.label.toLowerCase() })}
                    onChange={(values) => updateList(condition.field, condition.side, values)}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(condition)}
                    className="justify-self-end text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t("removeCondition", { group: field.label })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addCondition} disabled={conditions.length >= targetingKeys.length * 2} className="mt-3">
        <Plus className="size-4" /> {t("addCondition")}
      </Button>
    </section>
  );
}
