"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/member/fields/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/member/fields/select";

import type { SnippetSortOption } from "./types";

type SnippetsToolbarProps = {
  query: string;
  sort: SnippetSortOption;
  loading?: boolean;
  onQueryChange: (value: string) => void;
  onSortChange: (value: SnippetSortOption) => void;
};

const sortOptions: Array<{ value: SnippetSortOption; key: "newest" | "oldest" | "nameAsc" | "nameDesc" }> = [
  { value: "newest", key: "newest" },
  { value: "oldest", key: "oldest" },
  { value: "name-asc", key: "nameAsc" },
  { value: "name-desc", key: "nameDesc" },
];

export function SnippetsToolbar(props: SnippetsToolbarProps) {
  const t = useTranslations("Snippets.toolbar");
  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center" role="search">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9 pr-9"
            aria-label={t("searchLabel")}
          />
          {props.query ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => props.onQueryChange("")}
              aria-label={t("clearSearch")}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <Select value={props.sort} onValueChange={(value) => props.onSortChange(value as SnippetSortOption)}>
          <SelectTrigger className="w-full lg:w-44" aria-label={t("sortAria")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{t(`sort.${option.key}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
