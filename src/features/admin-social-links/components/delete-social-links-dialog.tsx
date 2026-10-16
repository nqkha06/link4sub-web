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
import { deleteAdminSocialLinks } from "@/features/admin-social-links/api/social-links.client"
import type { AdminSocialLink } from "@/features/admin-social-links/types"

export function DeleteSocialLinksDialog({
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
  const [deleting, setDeleting] = React.useState(false)

  async function remove() {
    if (!links.length) return
    setDeleting(true)
    try {
      const result = await deleteAdminSocialLinks(
        links.map((link) => link.id),
      )
      toast.success(t("delete.success", { count: result.deleted }))
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("delete.error"),
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={links.length > 0}
      onOpenChange={(open) => !deleting && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("delete.title", { count: links.length })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={() => void remove()}
          >
            {deleting ? t("delete.processing") : t("delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
