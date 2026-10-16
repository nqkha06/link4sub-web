"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  publicationStatuses,
  type PublicationStatus,
} from "@/types/publication-status";

export function PublicationStatusCard({
  status,
  onStatusChange,
  id = "publication-status",
  disabled = false,
  disabledReason,
}: {
  status: PublicationStatus;
  onStatusChange: (status: PublicationStatus) => void;
  id?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const t = useTranslations("Admin.shell.publicationStatus");

  return (
    <Card className="gap-0 rounded-2xl border-border/80 bg-background/95 py-0 shadow-sm">
      <CardHeader className="px-6 py-5">
        <h2 className="font-semibold leading-none tracking-tight">
          {t("title")}
        </h2>
        <p className="text-sm leading-5 text-muted-foreground">
          {t("description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 px-6 pb-6">
        <Label htmlFor={id}>{t("label")}</Label>
        <Select
          value={status}
          disabled={disabled}
          onValueChange={onStatusChange}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {publicationStatuses.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`options.${value}.label`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm leading-5 text-muted-foreground">
          {disabled && disabledReason
            ? disabledReason
            : t(`options.${status}.description`)}
        </p>
      </CardContent>
    </Card>
  );
}
