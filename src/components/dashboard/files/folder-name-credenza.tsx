"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Input } from "@/components/member/fields/input";
import { Label } from "@/components/ui/label";

type FolderNameCredenzaProps = {
  mode: "create" | "rename" | null;
  initialName?: string;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => Promise<boolean>;
};

export function FolderNameCredenza({ mode, initialName = "", ...props }: FolderNameCredenzaProps) {
  if (!mode) return null;
  return <FolderNameContent key={`${mode}:${initialName}`} mode={mode} initialName={initialName} {...props} />;
}

function FolderNameContent({
  mode,
  initialName,
  saving = false,
  onOpenChange,
  onSave,
}: Omit<FolderNameCredenzaProps, "mode"> & { mode: "create" | "rename"; initialName: string }) {
  const t = useTranslations("Files.folders.nameDialog");
  const inputId = useId();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = name.trim().replace(/\s+/g, " ");
    if (!normalized) {
      setError(t("empty"));
      return;
    }
    if (normalized.length > 100) {
      setError(t("tooLong"));
      return;
    }
    if (mode === "rename" && normalized === initialName) {
      onOpenChange(false);
      return;
    }
    setError("");
    if (await onSave(normalized)) onOpenChange(false);
  }

  return (
    <ResponsiveDialog open onOpenChange={(open) => !saving && onOpenChange(open)}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <ResponsiveDialogHeader className="border-b border-border">
            <ResponsiveDialogTitle>{mode === "create" ? t("createTitle") : t("renameTitle")}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-2 pt-5">
            <Label htmlFor={inputId}>{t("label")}</Label>
            <Input
              id={inputId}
              value={name}
              maxLength={100}
              data-autofocus
              disabled={saving}
              placeholder={t("placeholder")}
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError("");
              }}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter className="border-border bg-background">
            <ResponsiveDialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>{t("cancel")}</Button>
            </ResponsiveDialogClose>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : null}
              {mode === "create" ? t("create") : t("save")}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
