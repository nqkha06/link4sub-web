"use client";
/* eslint-disable @next/next/no-img-element */

import { Check, ImageIcon } from "lucide-react";
import { useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  bioBackgroundPresetCategoryLabels,
  bioBackgroundPresets,
  type BioBackgroundPreset,
  type BioBackgroundPresetCategory,
} from "./background-presets";

type PresetCategory = "all" | BioBackgroundPresetCategory;

const presetCategories: PresetCategory[] = [
  "all",
  "vietnam",
  "nature",
  "dreamy",
  "modern",
  "culture",
  "lifestyle",
  "abstract",
  "retro",
  "winter",
  "holiday",
  "solid",
];

const presetCategoryRank = new Map(
  presetCategories.map((value, index) => [value, index]),
);

export function BackgroundPresetPicker({
  selectedPresetId,
  onSelect,
}: {
  selectedPresetId?: string;
  onSelect: (preset: BioBackgroundPreset) => void;
}) {
  const [category, setCategory] = useState<PresetCategory>("all");
  const filteredPresets = category === "all"
    ? [...bioBackgroundPresets].sort(
      (left, right) =>
        (presetCategoryRank.get(left.category) ?? 99) -
        (presetCategoryRank.get(right.category) ?? 99),
    )
    : bioBackgroundPresets.filter((preset) => preset.category === category);

  return (
    <div className="space-y-3">
      <ScrollArea className="w-full whitespace-nowrap">
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(value) => value && setCategory(value as PresetCategory)}
          variant="outline"
          spacing={1}
          className="w-max"
          aria-label="Lọc background theo chủ đề"
        >
          {presetCategories.map((value) => (
            <ToggleGroupItem key={value} value={value} size="sm">
              {value === "all" ? "Tất cả" : bioBackgroundPresetCategoryLabels[value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ScrollArea>

      <div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto p-1 sm:grid-cols-5 md:grid-cols-6">
        {filteredPresets.map((preset) => {
          const selected = selectedPresetId === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              aria-label={`Chọn background ${preset.name}`}
              aria-pressed={selected}
              title={preset.name}
              onClick={() => onSelect(preset)}
              className={`group relative aspect-square min-w-0 overflow-hidden rounded-md border bg-muted text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none ${
                selected
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md motion-reduce:hover:translate-y-0"
              }`}
            >
              {preset.imageUrl ? (
                <img
                  src={preset.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              ) : (
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: preset.backgroundColor, backgroundImage: preset.backgroundGradient }}
                  aria-hidden
                />
              )}
              <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute inset-x-1 bottom-1 block truncate text-[9px] font-medium leading-tight text-white">
                {preset.name}
              </span>
              {selected ? (
                <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Check className="size-2.5" aria-hidden />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {filteredPresets.length === 0 ? (
        <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center">
          <div>
            <ImageIcon className="mx-auto size-5 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium text-foreground">Chưa có background trong chủ đề này</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
