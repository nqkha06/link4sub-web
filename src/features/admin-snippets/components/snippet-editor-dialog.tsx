"use client"

import { Loader2, Save } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateAdminSnippet } from "@/features/admin-snippets/api/snippets.client"
import type { AdminSnippet } from "@/features/admin-snippets/types"

export function SnippetEditorDialog({
  snippet,
  onOpenChange,
  onSuccess,
}: {
  snippet: AdminSnippet | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const t = useTranslations("Admin.snippets.editor")
  const tc = useTranslations("Admin.common")
  const locale = useLocale()
  const numberFormat = new Intl.NumberFormat(locale)
  const [name, setName] = React.useState(snippet?.name ?? "")
  const [content, setContent] = React.useState(snippet?.content ?? "")
  const [pending, setPending] = React.useState(false)
  const nameError = name.trim() ? "" : t("nameRequired")
  const contentError = content.trim() ? "" : t("contentRequired")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!snippet || nameError || contentError) return
    setPending(true)
    try {
      await updateAdminSnippet(snippet.id, {
        name: name.trim(),
        content: content.trim(),
      })
      toast.success(t("updated"))
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("updateFailed"),
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={Boolean(snippet)}
      onOpenChange={(open) => !pending && onOpenChange(open)}
    >
      <DialogContent className="sm:max-w-3xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              {t("description", { owner: snippet?.owner.name ?? "" })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="admin-snippet-name">{t("nameLabel")}</Label>
            <Input
              id="admin-snippet-name"
              value={name}
              maxLength={120}
              disabled={pending}
              onChange={(event) => setName(event.target.value)}
            />
            {nameError ? (
              <p className="text-destructive text-xs">{nameError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="admin-snippet-content">{t("contentLabel")}</Label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {t("charCounter", {
                  count: numberFormat.format(content.length),
                  max: numberFormat.format(100_000),
                })}
              </span>
            </div>
            <Textarea
              id="admin-snippet-content"
              value={content}
              maxLength={100_000}
              disabled={pending}
              className="min-h-80 resize-y font-mono text-xs leading-6"
              onChange={(event) => setContent(event.target.value)}
            />
            {contentError ? (
              <p className="text-destructive text-xs">{contentError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending || Boolean(nameError || contentError)}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {tc("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
