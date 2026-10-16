"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { restoreAdminSocialLinks } from "@/features/admin-social-links/api/social-links.client"
import type { AdminSocialLink } from "@/features/admin-social-links/types"

export function RestoreSocialLinksDialog({
  links,
  onOpenChange,
  onSuccess,
}: {
  links: AdminSocialLink[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const t = useTranslations("Admin.socialLinks")
  const tc = useTranslations("Admin.common")
  const [restoring, setRestoring] = React.useState(false)

  async function restore() {
    if (!links.length) return
    setRestoring(true)
    try {
      const result = await restoreAdminSocialLinks(
        links.map((link) => link.id),
      )
      toast.success(t("restore.success", { count: result.restored }))
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("restore.error"),
      )
    } finally {
      setRestoring(false)
    }
  }

  return (
    <AlertDialog
      open={links.length > 0}
      onOpenChange={(open) => !restoring && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("restore.title", { count: links.length })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("restore.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={restoring}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={restoring}
            onClick={() => void restore()}
          >
            {restoring ? t("restore.processing") : t("restore.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
