"use client";

import { Filter, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/member/fields/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/member/fields/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import type { FileSortOption, FilesFilters, FileTypeFilter } from "./types";

type FilesToolbarProps = {
  query: string;
  filters: FilesFilters;
  sort: FileSortOption;
  loading?: boolean;
  onQueryChange: (value: string) => void;
  onTypeChange: (value: FileTypeFilter) => void;
  onSortChange: (value: FileSortOption) => void;
  onClear: () => void;
};

const typeOptions: FileTypeFilter[] = ["all", "image", "video", "audio", "document", "archive", "other"];
const sortOptions: Array<{ value: FileSortOption; key: "newest" | "oldest" | "nameAsc" | "nameDesc" | "sizeDesc" | "sizeAsc" }> = [
  { value: "newest", key: "newest" }, { value: "oldest", key: "oldest" }, { value: "name-asc", key: "nameAsc" }, { value: "name-desc", key: "nameDesc" }, { value: "size-desc", key: "sizeDesc" }, { value: "size-asc", key: "sizeAsc" },
];

function FilterSelects({ filters, sort, onTypeChange, onSortChange, showLabels = false }: Pick<FilesToolbarProps, "filters" | "sort" | "onTypeChange" | "onSortChange"> & { showLabels?: boolean }) {
  const t = useTranslations("Files");
  return (
    <>
      <div className={showLabels ? "space-y-2" : ""}>{showLabels ? <p className="text-sm font-medium text-foreground">{t("toolbar.type")}</p> : null}<Select value={filters.type} onValueChange={(value) => onTypeChange(value as FileTypeFilter)}><SelectTrigger className={`h-10! w-full bg-background shadow-none ${showLabels ? "" : "lg:w-36"}`} aria-label={t("toolbar.typeAria")}><SelectValue /></SelectTrigger><SelectContent>{typeOptions.map((option) => <SelectItem key={option} value={option}>{t(`types.${option}`)}</SelectItem>)}</SelectContent></Select></div>
      <div className={showLabels ? "space-y-2" : ""}>{showLabels ? <p className="text-sm font-medium text-foreground">{t("toolbar.sort")}</p> : null}<Select value={sort} onValueChange={(value) => onSortChange(value as FileSortOption)}><SelectTrigger className={`h-10! w-full bg-background shadow-none ${showLabels ? "" : "lg:w-44"}`} aria-label={t("toolbar.sortAria")}><SelectValue /></SelectTrigger><SelectContent>{sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{t(`sort.${option.key}`)}</SelectItem>)}</SelectContent></Select></div>
    </>
  );
}

export function FilesToolbar(props: FilesToolbarProps) {
  const t = useTranslations("Files.toolbar");
  const activeCount = Number(props.filters.type !== "all");
  const hasCriteria = Boolean(props.query) || activeCount > 0 || props.sort !== "newest";

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center" role="search">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder={t("searchPlaceholder")} className="pl-9 pr-9" aria-label={t("searchLabel")} />
          {props.query ? <button type="button" className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => props.onQueryChange("")} aria-label={t("clearSearch")}><X className="size-3.5" /></button> : null}
        </div>

        <div className="hidden items-center gap-2 lg:flex"><FilterSelects {...props} /></div>

        <div className="flex items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" className="h-11 flex-1 bg-background shadow-none"><Filter />{t("filters")}{activeCount ? <Badge className="ml-1 min-w-5 px-1.5">{activeCount}</Badge> : null}</Button></SheetTrigger>
            <SheetContent className="w-full sm:max-w-sm">
              <SheetHeader className="border-b border-border"><SheetTitle>{t("filtersTitle")}</SheetTitle><SheetDescription>{t("filtersDescription")}</SheetDescription></SheetHeader>
              <div className="space-y-5 px-4"><FilterSelects {...props} showLabels /></div>
              <SheetFooter className="border-t border-border"><Button variant="outline" onClick={props.onClear} disabled={!hasCriteria}>{t("clearFilters")}</Button></SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
