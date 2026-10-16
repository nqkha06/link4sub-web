"use client"

import { useEffect, useId, useState, type FormEvent } from "react"
import { ArrowRight, Globe2, LoaderCircle, Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { Input } from "@/components/member/fields/input"
import { MEMBER_FIELD_BARE, MEMBER_FIELD_SHELL } from "@/components/member/fields/field-styles"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/member/fields/textarea"
import { getPublicLinkSettingsClient } from "@/features/link-settings/api/link-settings.client"
import { linkPath, type LinkSettings } from "@/features/link-settings/types"
import { createBioPage, type BioPageDto } from "@/lib/api-client"
import { cn } from "@/lib/utils"

import {
  BIO_DESCRIPTION_MAX_LENGTH,
  BIO_NAME_MAX_LENGTH,
  buildCreateBioPayload,
  previewAutoBioSlug,
  sanitizeBioSlugInput,
  type BioAccess,
  type CreateBioBasics,
} from "./create-bio-page"

const emptyBasics: CreateBioBasics = { name: "", slug: "", description: "", access: "draft" }

type SlugSettings = Pick<LinkSettings, "bioPrefix" | "socialPrefix" | "aliasCaseSensitive">

export function CreateBioDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (page: BioPageDto, access: BioAccess) => void
}) {
  const t = useTranslations("LinkInBio.create")
  const fieldId = useId()
  const [basics, setBasics] = useState<CreateBioBasics>(emptyBasics)
  const [nameError, setNameError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [linkSettings, setLinkSettings] = useState<SlugSettings>({
    bioPrefix: "b",
    socialPrefix: "",
    aliasCaseSensitive: false,
  })

  useEffect(() => {
    if (!open) return
    let active = true
    void getPublicLinkSettingsClient()
      .then((settings) => {
        if (active) setLinkSettings(settings)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [open])

  const update = <Key extends keyof CreateBioBasics>(key: Key, value: CreateBioBasics[Key]) => {
    setBasics((current) => ({ ...current, [key]: value }))
  }

  const handleOpenChange = (next: boolean) => {
    if (submitting) return
    if (!next) {
      setBasics(emptyBasics)
      setNameError("")
      setSubmitError("")
    }
    onOpenChange(next)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (!basics.name.trim()) {
      setNameError(t("nameRequired"))
      return
    }

    setSubmitting(true)
    setSubmitError("")
    try {
      const page = await createBioPage(buildCreateBioPayload(basics))
      toast.success(t("success"))
      // Giữ trạng thái đang gửi cho tới khi chuyển sang editor để tránh tạo trùng.
      onCreated(page, basics.access)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("errorFallback"))
      setSubmitting(false)
    }
  }

  const ids = {
    name: `${fieldId}-name`,
    slug: `${fieldId}-slug`,
    description: `${fieldId}-description`,
    nameError: `${fieldId}-name-error`,
  }

  const accessOptions: Array<{ value: BioAccess; icon: typeof Lock; label: string }> = [
    { value: "draft", icon: Lock, label: t("accessDraft") },
    { value: "published", icon: Globe2, label: t("accessPublic") },
  ]

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg" onCloseAutoFocus={(event: Event) => event.preventDefault()}>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t("title")}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <ResponsiveDialogBody className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor={ids.name}>
                {t("name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id={ids.name}
                value={basics.name}
                maxLength={BIO_NAME_MAX_LENGTH}
                data-autofocus
                autoComplete="off"
                placeholder={t("namePlaceholder")}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? ids.nameError : undefined}
                onChange={(event) => {
                  update("name", event.target.value)
                  if (nameError) setNameError("")
                }}
              />
              {nameError ? <p id={ids.nameError} className="text-xs text-destructive">{nameError}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids.slug}>
                {t("slug")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
              </Label>
              <div className={MEMBER_FIELD_SHELL}>
                <span className="inline-flex h-full max-w-[45%] shrink-0 items-center truncate border-r border-border bg-muted/35 px-3 text-muted-foreground">
                  {linkPath(linkSettings, "bio", "")}
                </span>
                <input
                  id={ids.slug}
                  value={basics.slug}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={previewAutoBioSlug(basics.name, linkSettings.aliasCaseSensitive) || t("slugPlaceholder")}
                  onChange={(event) => update("slug", sanitizeBioSlugInput(event.target.value, linkSettings.aliasCaseSensitive))}
                  className={`${MEMBER_FIELD_BARE} px-3 text-foreground`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={ids.description}>
                  {t("descriptionLabel")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {basics.description.length}/{BIO_DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id={ids.description}
                value={basics.description}
                maxLength={BIO_DESCRIPTION_MAX_LENGTH}
                rows={3}
                placeholder={t("descriptionPlaceholder")}
                onChange={(event) => update("description", event.target.value)}
                className="min-h-20 resize-none"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-foreground">{t("access")}</legend>
              <RadioGroup
                value={basics.access}
                onValueChange={(value) => update("access", value as BioAccess)}
                className="grid gap-2 sm:grid-cols-2"
              >
                {accessOptions.map((option) => {
                  const Icon = option.icon
                  const selected = basics.access === option.value
                  return (
                    <Label
                      key={option.value}
                      htmlFor={`${fieldId}-access-${option.value}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 font-normal transition-colors hover:bg-muted/40",
                        selected && "border-primary bg-primary/5 hover:bg-primary/5",
                      )}
                    >
                      <RadioGroupItem id={`${fieldId}-access-${option.value}`} value={option.value} />
                      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Icon className="size-3.5 text-muted-foreground" />
                        {option.label}
                      </span>
                    </Label>
                  )
                })}
              </RadioGroup>
            </fieldset>

            {submitError ? (
              <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {submitError}
              </p>
            ) : null}
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter className="flex-row justify-end gap-2 border-border bg-background">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => handleOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {submitting ? t("submitting") : t("submit")}
              {submitting ? null : <ArrowRight className="size-4" />}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
