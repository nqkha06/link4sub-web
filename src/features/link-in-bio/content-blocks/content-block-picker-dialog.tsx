"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Input } from "@/components/member/fields/input";
import { cn } from "@/lib/utils";
import {
  contentBlockCategoryLabels,
  contentBlockRegistry,
  normalizeContentBlockSearch,
  type ContentBlockCategory,
  type ContentBlockDefinition,
  type ContentBlockPickerType,
} from "./content-block-registry";

const enabledContentBlocks = contentBlockRegistry.filter((definition) => definition.enabled);

/** Picker sections: display-only grouping on top of the registry categories. */
const pickerSections: {
  key: string;
  label: string;
  types: ContentBlockPickerType[];
  tone: string;
}[] = [
  { key: "basic", label: "Cơ bản", types: ["link", "text", "social", "divider"], tone: "bg-primary/12 text-primary" },
  { key: "media", label: "Hình ảnh & Video", types: ["gallery", "embed"], tone: "bg-violet-500/12 text-violet-500 dark:text-violet-400" },
  { key: "business", label: "Kinh doanh", types: ["bank-details"], tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
];

const sectionedTypes = new Set(pickerSections.flatMap((section) => section.types));
const fallbackSection = {
  key: "other",
  label: "Khác",
  types: enabledContentBlocks.map((definition) => definition.type).filter((type) => !sectionedTypes.has(type)),
  tone: "bg-muted text-muted-foreground",
};

function matchesQuery(definition: ContentBlockDefinition, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return normalizeContentBlockSearch([
    definition.title,
    definition.description,
    contentBlockCategoryLabels[definition.category as ContentBlockCategory],
    ...definition.keywords,
  ].join(" ")).includes(normalizedQuery);
}

export function ContentBlockPickerDialog({
  open,
  onOpenChange,
  onSelect,
  isTypeAdded,
  onEditExisting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: ContentBlockPickerType) => void;
  /** Single-instance blocks (e.g. social) that already exist on the page. */
  isTypeAdded?: (type: ContentBlockPickerType) => boolean;
  onEditExisting?: (type: ContentBlockPickerType) => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeContentBlockSearch(query);

  const sections = [...pickerSections, fallbackSection]
    .map((section) => ({
      ...section,
      items: section.types
        .map((type) => enabledContentBlocks.find((definition) => definition.type === type))
        .filter((definition): definition is ContentBlockDefinition => Boolean(definition) && matchesQuery(definition!, normalizedQuery)),
    }))
    .filter((section) => section.items.length > 0);

  function select(type: ContentBlockPickerType) {
    if (isTypeAdded?.(type)) onEditExisting?.(type);
    else onSelect(type);
    handleOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) setQuery("");
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader className="bg-card">
          <ResponsiveDialogTitle>Thêm nội dung</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="p-0">
          <div className="px-4 pb-3 sm:px-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm khối..." aria-label="Tìm khối" className="pl-9" />
            </div>
          </div>
          <div className="max-h-[62dvh] overflow-y-auto px-2 pb-4 sm:px-3">
            {sections.length ? (
              sections.map((section) => (
                <section key={section.key} className="pt-3 first:pt-1">
                  <h3 className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</h3>
                  <div className="grid">
                    {section.items.map((definition) => {
                      const Icon = definition.icon;
                      const added = isTypeAdded?.(definition.type) ?? false;
                      return (
                        <button
                          key={definition.type}
                          type="button"
                          onClick={() => select(definition.type)}
                          className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", section.tone)}>
                            <Icon className="size-[18px]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{definition.title}</span>
                              {definition.isNew && !added ? <span className="text-xs font-semibold text-primary">Mới</span> : null}
                            </span>
                            <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{definition.description}</span>
                          </span>
                          {added ? (
                            <span className="shrink-0 text-right text-xs font-medium text-muted-foreground">Đã thêm · Chỉnh sửa</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <div className="grid min-h-44 place-items-center px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-foreground">Không tìm thấy khối phù hợp</p>
                  <button type="button" onClick={() => setQuery("")} className="mt-1 text-xs font-medium text-primary hover:underline">Xóa tìm kiếm</button>
                </div>
              </div>
            )}
          </div>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
