"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateAdminSocialLink } from "@/features/admin-social-links/api/social-links.client"
import type {
  AdminSocialLink,
  AdminSocialLinkPayload,
} from "@/features/admin-social-links/types"

export function SocialLinkEditorDialog({
  link,
  onOpenChange,
  onSuccess,
}: {
  link: AdminSocialLink | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const t = useTranslations("Admin.socialLinks")
  const tc = useTranslations("Admin.common")
  const [values, setValues] = React.useState<AdminSocialLinkPayload>(() =>
    initialValues(link),
  )
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  if (!link) return null

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!link) return
    if (
      link.destinationType === "url" &&
      !/^https?:\/\/\S+$/i.test(values.destinationUrl ?? "")
    ) {
      setError(t("editor.invalidUrl"))
      return
    }

    setSaving(true)
    setError("")
    try {
      await updateAdminSocialLink(link.id, {
        title: values.title.trim(),
        subtitle: values.subtitle.trim(),
        status: values.status,
        ...(link.destinationType === "url"
          ? { destinationUrl: values.destinationUrl?.trim() }
          : {}),
      })
      toast.success(t("editor.success"))
      onOpenChange(false)
      onSuccess()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("editor.error"),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !saving && onOpenChange(open)}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("editor.title")}</DialogTitle>
          <DialogDescription>
            {t.rich("editor.description", {
              slug: link.slug,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="admin-link-title">{t("editor.titleLabel")}</Label>
            <Input
              id="admin-link-title"
              value={values.title}
              maxLength={160}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-link-subtitle">{tc("description")}</Label>
            <Textarea
              id="admin-link-subtitle"
              value={values.subtitle}
              maxLength={500}
              rows={4}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  subtitle: event.target.value,
                }))
              }
            />
          </div>
          {link.destinationType === "url" ? (
            <div className="grid gap-2">
              <Label htmlFor="admin-link-destination">
                {t("editor.destinationUrl")}
              </Label>
              <Input
                id="admin-link-destination"
                type="url"
                value={values.destinationUrl ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    destinationUrl: event.target.value,
                  }))
                }
              />
            </div>
          ) : (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {t.rich("editor.destinationManaged", {
                type: link.destinationType,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="admin-link-status">{tc("status")}</Label>
            <Select
              value={values.status}
              onValueChange={(status: AdminSocialLinkPayload["status"]) =>
                setValues((current) => ({ ...current, status }))
              }
            >
              <SelectTrigger id="admin-link-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{tc("active")}</SelectItem>
                <SelectItem value="inactive">{tc("inactive")}</SelectItem>
                <SelectItem value="paused">{t("status.paused")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? tc("saving") : tc("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function initialValues(
  link: AdminSocialLink | null,
): AdminSocialLinkPayload {
  return {
    title: link?.title ?? "",
    subtitle: link?.subtitle ?? "",
    status: link?.status ?? "inactive",
    destinationUrl: link?.destinationUrl ?? "",
  }
}
