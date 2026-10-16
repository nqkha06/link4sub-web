"use client"

import { useId, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { Input } from "@/components/member/fields/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/member/fields/textarea"
import type { SnippetDto } from "@/lib/api-client"

/** Khớp `@MaxLength(100_000)` ở API; chỉ báo số ký tự còn lại khi gần chạm giới hạn. */
const CONTENT_MAX_LENGTH = 100_000
const CONTENT_WARN_AT = 5_000

type SnippetFormCredenzaProps = {
  open: boolean
  snippet: SnippetDto | null
  saving?: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: { name?: string; content: string }) => Promise<boolean>
}

export function SnippetFormCredenza({
  open,
  snippet,
  saving = false,
  onOpenChange,
  onSave,
}: SnippetFormCredenzaProps) {
  return (
    <SnippetFormCredenzaContent
      key={snippet?.id ?? "create"}
      open={open}
      snippet={snippet}
      saving={saving}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  )
}

function SnippetFormCredenzaContent({
  open,
  snippet,
  saving,
  onOpenChange,
  onSave,
}: SnippetFormCredenzaProps) {
  const t = useTranslations("Snippets.form")
  const nameId = useId()
  const contentId = useId()
  const isEdit = Boolean(snippet)
  const [name, setName] = useState(snippet?.name ?? "")
  const [content, setContent] = useState(snippet?.content ?? "")
  const [error, setError] = useState("")
  const remaining = CONTENT_MAX_LENGTH - content.length

  const handleOpenChange = (nextOpen: boolean) => {
    if (saving) return
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      setError(t("contentRequired"))
      return
    }

    setError("")
    const saved = await onSave({
      name: name.trim() || undefined,
      content: trimmedContent,
    })
    if (saved) onOpenChange(false)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <ResponsiveDialogHeader className="border-b border-border">
            <ResponsiveDialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <ResponsiveDialogBody className="space-y-4 pt-5">
            <div className="grid gap-2">
              <Label htmlFor={nameId}>{t("name")}</Label>
              <Input
                id={nameId}
                value={name}
                maxLength={120}
                data-autofocus
                disabled={saving}
                placeholder={t("namePlaceholder")}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={contentId}>{t("content")}</Label>
              <Textarea
                id={contentId}
                value={content}
                disabled={saving}
                placeholder={t("contentPlaceholder")}
                className="min-h-64 resize-y font-mono leading-relaxed"
                aria-invalid={Boolean(error)}
                onChange={(event) => {
                  setContent(event.target.value)
                  if (error) setError("")
                }}
              />
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : remaining <= CONTENT_WARN_AT ? (
                <p className={remaining < 0 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                  {remaining < 0 ? t("contentOverLimit", { count: -remaining }) : t("contentRemaining", { count: remaining })}
                </p>
              ) : null}
            </div>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter className="border-border bg-background">
            <ResponsiveDialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>{t("cancel")}</Button>
            </ResponsiveDialogClose>
            <Button type="submit" disabled={saving || !content.trim()}>
              {saving ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : null}
              {saving ? t("saving") : isEdit ? t("save") : t("submitCreate")}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
