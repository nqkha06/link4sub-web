"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { templateVariableUsage } from "../template-variables";
import type { EmailTemplateVariable, EmailTemplateVariableCatalogEntry } from "../types";

export type TemplateContentField = "subject" | "preheader" | "htmlContent" | "textContent";

const fieldLabelKeys: Record<TemplateContentField, string> = {
  subject: "guide.fields.subject",
  preheader: "guide.fields.preheader",
  htmlContent: "guide.fields.html",
  textContent: "guide.fields.plainText",
};

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function TemplateVariableGuide({
  variables,
  globalVariables,
  catalog,
  catalogUnavailable,
  content,
  target,
  disabled,
  onTargetChange,
  onInsert,
}: {
  variables: EmailTemplateVariable[];
  globalVariables: EmailTemplateVariable[];
  catalog: EmailTemplateVariableCatalogEntry | null;
  catalogUnavailable: boolean;
  content: Record<TemplateContentField, string>;
  target: TemplateContentField;
  disabled: boolean;
  onTargetChange: (target: TemplateContentField) => void;
  onInsert: (variable: EmailTemplateVariable, target: TemplateContentField) => void;
}) {
  const t = useTranslations("Admin.emails");
  const [search, setSearch] = React.useState("");
  const usage = templateVariableUsage(Object.values(content), variables.map((variable) => variable.key));
  const declaredKeys = new Set(variables.map((variable) => variable.key));
  const catalogVariables = [...globalVariables, ...(catalog?.variables || [])];
  const catalogKeys = new Set(catalogVariables.map((variable) => variable.key));
  const available = [
    ...catalogVariables,
    ...variables.filter((variable) => !catalogKeys.has(variable.key)),
  ];
  const query = normalizeSearch(search.trim());
  const matches = available.filter((variable) =>
    [variable.key, variable.label, variable.description || ""]
      .some((value) => normalizeSearch(value).includes(query)),
  );

  return (
    <section className="space-y-3 rounded-xl border bg-muted/20 p-4" aria-label={t("guide.ariaLabel")}>
      <div>
        <h3 className="text-sm font-semibold">{t("guide.title")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.rich("guide.syntax", { code: (chunks) => <code>{chunks}</code> })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {catalog
            ? t("guide.catalogInfo", { code: catalog.code, name: catalog.name.toLocaleLowerCase() })
            : t("guide.noCatalogInfo")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("guide.globalInfo")}
        </p>
      </div>
      {catalogUnavailable ? <p className="text-xs text-destructive">{t("guide.catalogUnavailable")}</p> : null}
      {usage.undeclared.length > 0 ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">
          {t("guide.undeclared", { variables: usage.undeclared.map((key) => `{{${key}}}`).join(", ") })}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("guide.searchPlaceholder")} className="pl-9" aria-label={t("guide.searchAria")} />
        </div>
        <Select value={target} onValueChange={(value) => onTargetChange(value as TemplateContentField)}>
          <SelectTrigger className="w-full sm:w-36" aria-label={t("guide.targetAria")}><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(fieldLabelKeys).map(([key, labelKey]) => <SelectItem key={key} value={key}>{t(labelKey)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="max-h-52 space-y-2 overflow-y-auto">
        {matches.length ? matches.map((variable, index) => (
          <div key={`${variable.key}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <code className="break-all text-xs font-semibold">{`{{${variable.key}}}`}</code>
                {usage.used.includes(variable.key) ? <span className="text-[11px] text-primary">{t("guide.inUse")}</span> : null}
                {catalogKeys.has(variable.key) && !declaredKeys.has(variable.key) ? <span className="text-[11px] text-amber-700 dark:text-amber-400">{t("guide.notDeclared")}</span> : null}
                {catalog && !catalogKeys.has(variable.key) ? <span className="text-[11px] text-muted-foreground">{t("guide.selfDeclared")}</span> : null}
              </div>
              <p className="text-xs text-foreground">{variable.label}{variable.required ? ` · ${t("guide.requiredSuffix")}` : ""}</p>
              {variable.description ? <p className="text-xs text-muted-foreground">{variable.description}</p> : null}
              {variable.example !== undefined && variable.example !== null && String(variable.example) !== "" ? (
                <p className="text-xs text-muted-foreground">{t("guide.example", { value: String(variable.example) })}</p>
              ) : null}
            </div>
            <Button type="button" variant="outline" size="sm" disabled={disabled || !/^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*$/.test(variable.key)} onClick={() => onInsert(variable, target)}>
              {t("guide.insert")}
            </Button>
          </div>
        )) : <p className="rounded-lg border border-dashed px-3 py-5 text-center text-xs text-muted-foreground">
          {available.length ? t("guide.noMatches") : t("guide.noVariables")}
        </p>}
      </div>
    </section>
  );
}
