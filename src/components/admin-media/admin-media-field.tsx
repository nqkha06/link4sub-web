"use client";

import { ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { AdminMediaPicker } from "@/components/admin-media/admin-media-picker";
import { Button } from "@/components/ui/button";
import type { AdminMedia } from "@/features/admin-media/types";

export function AdminMediaField({
  value,
  onChange,
  label,
  accept,
  disabled = false,
}: {
  value: AdminMedia | null;
  onChange: (file: AdminMedia | null) => void;
  label?: string;
  accept?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("Admin.shell.media.field");
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/10 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.thumbnailUrl || value.url}
            alt={value.altText || ""}
            className="size-12 rounded-md border object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {value.fileName}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            <X />
            <span className="sr-only">{t("removeSelection")}</span>
          </Button>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <ImagePlus />
        {label ?? t("chooseImage")}
      </Button>
      <AdminMediaPicker
        open={open}
        onOpenChange={setOpen}
        selectedId={value?.id}
        accept={accept}
        allowClear
        onClear={() => onChange(null)}
        onSelect={onChange}
      />
    </div>
  );
}
