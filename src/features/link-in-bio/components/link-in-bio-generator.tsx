"use client"
/* eslint-disable @next/next/no-img-element */

import { SiteBrandMark } from "@/components/site-brand"
import type React from "react"

import { useEffect, useState, type ComponentType } from "react"
import {
  ChevronDown,
  CircleCheck,
  Layers3,
  Music,
  Palette,
  Settings,
  Pencil,
  Shield,
  Users,
  X,
  Share2,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import {
  SiFacebook,
  SiInstagram,
  SiLinkerd,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons"

import { BioWidgetEmbed } from "@/components/bio-widget-embed"
import { getYouTubeEmbedUrl, type BackgroundMedia } from "@/components/image-picker"
import { ManagedImagePicker } from "@/components/media/managed-image-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/member/fields/input"
import { MEMBER_FIELD_BARE, MEMBER_FIELD_SHELL } from "@/components/member/fields/field-styles"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/member/fields/select"
import { Slider } from "@/components/ui/slider"
import {
  createBioPage,
  updateBioPage,
  type BioBankDetailsBlockDto,
  type BioPageDto,
  type BioContentOrderItemDto,
  type BioDividerBlockDto,
  type BioGalleryBlockDto,
  type BioTextBlockDto,
  type CreateBioPagePayload,
  type LinkAnimationEffect,
  getFilePreviewUrl,
} from "@/lib/api-client"
import { getPublicLinkSettingsClient } from "@/features/link-settings/api/link-settings.client"
import { linkPath, linkUrl, type LinkSettings } from "@/features/link-settings/types"
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider"
import {
  bioButtonStyles,
  normalizeBioButtonStyle,
} from "./bio-appearance"
import { BioLinkButton } from "./bio-link-button"
import { ContentSection } from "../content-blocks/content-section"
import { BackgroundPresetPicker } from "../backgrounds/background-preset-picker"
import {
  DEFAULT_BIO_BACKGROUND_PRESET_ID,
  getBioBackgroundPresetById,
  getBioBackgroundPresetByImage,
  getBioPresetTheme,
  type BioBackgroundPreset,
} from "../backgrounds/background-presets"
import { BankDetailsRenderer, DividerRenderer, TextBlockRenderer } from "../content-blocks/simple-content-renderers"
import { hasCompleteBankDetails } from "../content-blocks/simple-content-types"
import { GalleryRenderer } from "../gallery/gallery-renderer"
import {
  BIO_CONTENT_STACK_CLASS,
  BIO_FOOTER_CLASS,
  BIO_HEADER,
  BIO_SOCIAL_ICON_CLASS,
  BIO_SOCIAL_ROW_CLASS,
} from "../bio-spacing"
import { cn } from "@/lib/utils"
import {
  contentOrderKey,
  GALLERY_ACCEPTED_MIME_TYPES,
  normalizeContentOrder,
} from "../gallery/gallery-types"
import { useBusinessConfig } from "@/features/business-settings/use-business-config"
import { generateId } from "@/lib/id"
import { createStarterBioContent } from "../create/create-bio-page"

function isEmptyBio(bio?: BioPageDto | null) {
  if (!bio) return false
  return bio.socialLinks.length === 0 && bio.customLinks.length === 0 && bio.widgets.length === 0 &&
    bio.galleries.length === 0 && bio.dividers.length === 0 && bio.bankDetails.length === 0 && bio.textBlocks.length === 0
}

interface SocialLink {
  id: string
  platform: string
  url: string
  enabled?: boolean
}

interface CustomLink {
  id: string
  title: string
  url: string
  animationEffect?: LinkAnimationEffect
  iconFileId?: string
  iconUrl?: string
}

interface ProfileDetails {
  name: string
  title: string
  avatarFileId?: string
  avatarUrl?: string
}

interface AppearanceSettings {
  buttonStyle: string
  backgroundColor: string
  backgroundImage?: string
  backgroundMediaType?: "image" | "video" | "youtube"
  backgroundMediaUrl?: string
  backgroundFileId?: string
  selectedBackgroundId?: string
  backgroundBlur?: number
  backgroundOverlay?: number
  backgroundBrightness?: number
}

interface Widget {
  id: string
  type: string
  title: string
  url: string
  description?: string
  enabled?: boolean
}

type EditorSectionKey = "details" | "content" | "appearance" | "admin"

function EditorSection({
  title,
  icon: Icon,
  open,
  onOpenChange,
  count,
  children,
}: {
  title: string
  icon: ComponentType<{ className?: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
  count?: number
  children: React.ReactNode
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="overflow-hidden rounded-xl border border-border bg-card">
      <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none sm:px-5">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/35 text-muted-foreground">
            <Icon className="size-[18px]" />
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{title}</span>
            {typeof count === "number" ? <Badge variant="secondary" className="h-5 px-1.5 text-[10px] tabular-nums">{count}</Badge> : null}
          </span>
        </span>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 border-t border-border px-4 py-4 sm:px-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-2 block text-xs font-medium text-foreground">
      {children}{required ? <span className="ml-1 text-destructive">*</span> : null}
    </label>
  )
}

export default function LinkInBioGenerator({
  initialBio,
  initialStatus,
  starterContent = false,
  onSaved,
  onSavingChange,
}: {
  initialBio?: BioPageDto | null
  /** Ghi đè trạng thái ban đầu, ví dụ khi người dùng chọn "Công khai" lúc tạo trang. */
  initialStatus?: "published" | "draft"
  /** Bật sẵn khối mạng xã hội và liên kết gợi ý khi trang mới chưa có nội dung. */
  starterContent?: boolean
  onSaved?: (bioPage: BioPageDto) => void
  onSavingChange?: (saving: boolean) => void
}) {
  const brand = useSiteBrand()
  const businessConfig = useBusinessConfig()
  const [linkSettings, setLinkSettings] = useState<LinkSettings>({
    publicDomain: "http://localhost:3000",
    socialPrefix: "",
    bioPrefix: "b",
    aliasLength: 8,
    aliasCaseSensitive: false,
  })
  const [expandedSections, setExpandedSections] = useState<Record<EditorSectionKey, boolean>>({
    details: true,
    content: true,
    appearance: false,
    admin: false,
  })
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({
    name: initialBio?.name || "",
    title: initialBio?.title || "",
    avatarFileId: initialBio?.appearance.avatarFileId || undefined,
    avatarUrl: initialBio?.appearance.avatarUrl || undefined,
  })
  const [customSlug, setCustomSlug] = useState(initialBio?.slug || "")
  const [status, setStatus] = useState<"published" | "draft">(
    initialStatus ?? (initialBio?.status === "draft" ? "draft" : "published"),
  )
  const [starter] = useState(() =>
    starterContent && isEmptyBio(initialBio)
      ? createStarterBioContent((prefix) => `${prefix}-${generateId({ length: 10 })}`)
      : null,
  )
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(starter?.socialLinks ?? initialBio?.socialLinks ?? [])
  const [customLinks, setCustomLinks] = useState<CustomLink[]>(starter?.customLinks ?? initialBio?.customLinks ?? [])
  const [widgets, setWidgets] = useState<Widget[]>(initialBio?.widgets || [])
  const [galleries, setGalleries] = useState<BioGalleryBlockDto[]>(initialBio?.galleries || [])
  const [dividers, setDividers] = useState<BioDividerBlockDto[]>(initialBio?.dividers || [])
  const [bankDetails, setBankDetails] = useState<BioBankDetailsBlockDto[]>(initialBio?.bankDetails || [])
  const [textBlocks, setTextBlocks] = useState<BioTextBlockDto[]>(initialBio?.textBlocks || [])
  const [contentOrder, setContentOrder] = useState<BioContentOrderItemDto[]>(() => starter ? starter.contentOrder : normalizeContentOrder(
    initialBio?.contentOrder,
    {
      socials: initialBio?.socialLinks || [],
      widgets: initialBio?.widgets || [],
      galleries: initialBio?.galleries || [],
      dividers: initialBio?.dividers || [],
      bankDetails: initialBio?.bankDetails || [],
      textBlocks: initialBio?.textBlocks || [],
      links: initialBio?.customLinks || [],
    },
  ))
  const initialBackgroundPreset =
    getBioBackgroundPresetById(initialBio?.appearance.selectedBackgroundId) ||
    getBioBackgroundPresetByImage(initialBio?.appearance.backgroundImage) ||
    (!initialBio ? getBioBackgroundPresetById(DEFAULT_BIO_BACKGROUND_PRESET_ID) : undefined)
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    buttonStyle: normalizeBioButtonStyle(initialBio?.appearance.buttonStyle || "rounded"),
    backgroundColor: initialBackgroundPreset?.theme.accentColor || initialBio?.appearance.backgroundColor || "#ffffff",
    backgroundImage: initialBackgroundPreset
      ? initialBackgroundPreset.imageUrl || undefined
      : initialBio?.appearance.backgroundImage || undefined,
    backgroundMediaType: initialBio?.appearance.backgroundMediaType || undefined,
    backgroundMediaUrl: initialBio?.appearance.backgroundMediaUrl || undefined,
    backgroundFileId: initialBio?.appearance.backgroundFileId || undefined,
    selectedBackgroundId: initialBackgroundPreset?.id || initialBio?.appearance.selectedBackgroundId || undefined,
    backgroundBlur: initialBio?.appearance.backgroundBlur ?? 0,
    backgroundOverlay: initialBio?.appearance.backgroundOverlay ?? 0,
    backgroundBrightness: initialBio?.appearance.backgroundBrightness ?? 100,
  })
  const [hiddenLinks, setHiddenLinks] = useState<string[]>(initialBio?.hiddenLinks || [])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [savedBio, setSavedBio] = useState<BioPageDto | null>(null)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)

  useEffect(() => {
    let active = true
    void getPublicLinkSettingsClient()
      .then((settings) => {
        if (active) setLinkSettings(settings)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const setSectionOpen = (section: EditorSectionKey, open: boolean) => {
    setExpandedSections((current) => ({ ...current, [section]: open }))
  }

  const updateProfileDetails = (field: keyof ProfileDetails, value: string) => {
    setProfileDetails((current) => ({ ...current, [field]: value }))
  }

  const updateAppearanceSettings = (field: keyof AppearanceSettings, value: string | number | undefined) => {
    setAppearanceSettings((current) => ({ ...current, [field]: value }))
  }

  const isValidUrl = (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  const buildBioPayload = (statusOverride: "published" | "draft" = status): CreateBioPagePayload => ({
    name: profileDetails.name.trim(),
    title: profileDetails.title || undefined,
    customSlug: customSlug || undefined,
    status: statusOverride,
    socialLinks: socialLinks.filter((link) => link.platform && isValidUrl(link.url)),
    // iconUrl chỉ để xem trước; API chỉ nhận iconFileId và tự trả lại iconUrl.
    customLinks: customLinks
      .filter((link) => link.title.trim() && isValidUrl(link.url))
      .map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        animationEffect: link.animationEffect,
        ...(link.iconFileId ? { iconFileId: String(link.iconFileId) } : {}),
      })),
    widgets: widgets.filter((widget) => isValidUrl(widget.url)).map((widget) => ({ ...widget, title: widget.title.trim() })),
    galleries: galleries.map((gallery) => ({
      ...gallery,
      title: gallery.title?.trim() || undefined,
      images: gallery.images.map((image, sortOrder) => ({
        ...image,
        sortOrder,
        linkUrl: image.linkUrl && isValidUrl(image.linkUrl) ? image.linkUrl : undefined,
      })),
    })),
    dividers: dividers.map((block) => ({
      ...block,
      label: block.label?.trim() || undefined,
    })),
    bankDetails: bankDetails.map((block) => ({
      ...block,
      title: block.title.trim(),
      bankName: block.bankName.trim(),
      accountName: block.accountName.trim(),
      accountNumber: block.accountNumber.trim(),
      branch: block.branch?.trim() || undefined,
      note: block.note?.trim() || undefined,
    })),
    textBlocks: textBlocks.map((block) => ({
      ...block,
      content: block.content.trim(),
    })),
    contentOrder: normalizeContentOrder(contentOrder, { socials: socialLinks, widgets, galleries, dividers, bankDetails, textBlocks, links: customLinks }),
    hiddenLinks,
    appearance: {
      ...appearanceSettings,
      backgroundImage: appearanceSettings.backgroundFileId ? undefined : appearanceSettings.backgroundImage,
      backgroundMediaUrl: appearanceSettings.backgroundFileId ? undefined : appearanceSettings.backgroundMediaUrl,
      avatarFileId: profileDetails.avatarFileId,
    },
  })

  const handleSaveBio = async (saveMode: "draft" | "published" | "current" = "current") => {
    if (isSaving) return

    const nextStatus = saveMode === "current" ? status : saveMode
    const payload = buildBioPayload(nextStatus)
    if (!payload.name) {
      setSaveError("Tên trang là bắt buộc.")
      return
    }
    if (nextStatus === "published" && payload.socialLinks.length === 0 && payload.customLinks.length === 0 && payload.widgets.length === 0 && payload.galleries.every((gallery) => gallery.images.length === 0) && payload.dividers.length === 0 && payload.bankDetails.length === 0 && payload.textBlocks.length === 0) {
      setSaveError("Thêm ít nhất một khối nội dung hợp lệ trước khi xuất bản, hoặc lưu dưới dạng bản nháp.")
      return
    }
    if (nextStatus === "published" && payload.bankDetails.some((block) => block.enabled && !hasCompleteBankDetails(block))) {
      setSaveError("Hãy nhập tên ngân hàng, chủ tài khoản và số tài khoản trước khi xuất bản.")
      return
    }

    setIsSaving(true)
    onSavingChange?.(true)
    setSaveError("")
    try {
      const bioPage = initialBio
        ? await updateBioPage(initialBio.id, payload)
        : await createBioPage(payload)
      setSavedBio(bioPage)
      onSaved?.(bioPage)
      toast.success("Đã lưu trang Link-in-bio")
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Không lưu được trang Link-in-bio.")
      toast.error(error instanceof Error ? error.message : "Không lưu được trang Link-in-bio.")
    } finally {
      setIsSaving(false)
      onSavingChange?.(false)
    }
  }

  const getSocialIcon = (platform: string) => {
    const className = "size-5"
    switch (platform.toLowerCase()) {
      case "youtube": return <SiYoutube className={className} />
      case "instagram": return <SiInstagram className={className} />
      case "facebook": return <SiFacebook className={className} />
      case "twitter": return <SiX className={className} />
      case "linkedin": return <SiLinkerd className={className} />
      case "tiktok": return <SiTiktok className={className} />
      case "twitch": return <SiTwitch className={className} />
      case "spotify":
      case "apple music": return <Music className={className} />
      default: return <Users className={className} />
    }
  }

  const selectedBackgroundMedia: BackgroundMedia | null = appearanceSettings.backgroundMediaType && appearanceSettings.backgroundMediaUrl
    ? { id: appearanceSettings.selectedBackgroundId || appearanceSettings.backgroundMediaType, fileId: appearanceSettings.backgroundFileId, type: appearanceSettings.backgroundMediaType, url: appearanceSettings.backgroundMediaUrl }
    : appearanceSettings.backgroundImage
      ? { id: appearanceSettings.selectedBackgroundId || "legacy-image", type: "image", url: appearanceSettings.backgroundImage }
      : null

  const selectBackgroundPreset = (preset: BioBackgroundPreset) => {
    setAppearanceSettings((current) => ({
      ...current,
      backgroundColor: preset.theme.accentColor,
      backgroundImage: preset.imageUrl || undefined,
      backgroundMediaType: undefined,
      backgroundMediaUrl: undefined,
      backgroundFileId: undefined,
      selectedBackgroundId: preset.id,
    }))
  }

  const backgroundStyle: React.CSSProperties = selectedBackgroundMedia?.type === "image"
    ? { backgroundImage: `url('${selectedBackgroundMedia.url}')`, backgroundPosition: "center", backgroundSize: "cover" }
    : {
        backgroundColor:
          getBioBackgroundPresetById(appearanceSettings.selectedBackgroundId)?.backgroundColor ||
          appearanceSettings.backgroundColor ||
          "#f4f7fb",
        backgroundImage:
          getBioBackgroundPresetById(appearanceSettings.selectedBackgroundId)?.backgroundGradient,
      }
  const backgroundFilter = [
    appearanceSettings.backgroundBlur ? `blur(${appearanceSettings.backgroundBlur}px)` : "",
    appearanceSettings.backgroundBrightness && appearanceSettings.backgroundBrightness !== 100
      ? `brightness(${appearanceSettings.backgroundBrightness}%)`
      : "",
  ].filter(Boolean).join(" ") || undefined
  const backgroundOverlayOpacity = Math.min(80, Math.max(0, appearanceSettings.backgroundOverlay || 0)) / 100
  const activeTheme = getBioPresetTheme(
    appearanceSettings.selectedBackgroundId,
    appearanceSettings.backgroundImage,
    appearanceSettings.backgroundColor,
  )
  const selectedButtonStyle = normalizeBioButtonStyle(appearanceSettings.buttonStyle)
  const previewThemeVariables = {
    "--bio-accent": activeTheme.accentColor,
    "--bio-section-bg": activeTheme.sectionColor,
    "--bio-section-border": activeTheme.sectionBorderColor,
    "--bio-text": activeTheme.textColor,
    "--bio-muted-text": activeTheme.mutedTextColor,
  } as React.CSSProperties
  const normalizedOrder = normalizeContentOrder(contentOrder, { socials: socialLinks, widgets, galleries, dividers, bankDetails, textBlocks, links: customLinks })

  return (
    <form id="link-in-bio-editor-form" className="space-y-5" onSubmit={(event) => {
      event.preventDefault()
      const submitter = event.nativeEvent.submitter as HTMLButtonElement | null
      const saveMode = submitter?.value === "draft" || submitter?.value === "published" ? submitter.value : "current"
      void handleSaveBio(saveMode)
    }}>
      {saveError ? <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">{saveError}</div> : null}
      {savedBio ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-medium text-foreground"><CircleCheck className="size-4 text-primary" />Đã lưu trang Link-in-bio.</span>
          <a href={savedBio.publicUrl} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">Mở {linkPath(linkSettings, "bio", savedBio.slug)}</a>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-start">
        <div className="min-w-0 space-y-3">
          <EditorSection title="Thông tin trang" icon={Settings} open={expandedSections.details} onOpenChange={(open) => setSectionOpen("details", open)}>
            {/* Ảnh đại diện: bấm ảnh hoặc nút bút để chọn/đổi, nút X để gỡ. */}
            <div className="relative size-16">
              <button
                type="button"
                onClick={() => setAvatarPickerOpen(true)}
                aria-label={profileDetails.avatarFileId ? "Đổi ảnh đại diện" : "Chọn ảnh đại diện"}
                title={profileDetails.avatarFileId ? "Đổi ảnh đại diện" : "Chọn ảnh đại diện"}
                className="relative grid size-16 place-items-center overflow-hidden rounded-2xl border border-border bg-slate-950 text-lg font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span>{profileDetails.name.trim().slice(0, 1).toUpperCase() || "R"}</span>
                {profileDetails.avatarUrl ? (
                  <img
                    src={profileDetails.avatarUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    onError={(event) => {
                      event.currentTarget.hidden = true
                    }}
                  />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setAvatarPickerOpen(true)}
                aria-label={profileDetails.avatarFileId ? "Đổi ảnh đại diện" : "Chọn ảnh đại diện"}
                className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Pencil className="size-3" />
              </button>
              {profileDetails.avatarFileId ? (
                <button
                  type="button"
                  onClick={() =>
                    setProfileDetails((current) => ({
                      ...current,
                      avatarFileId: undefined,
                      avatarUrl: undefined,
                    }))
                  }
                  aria-label="Gỡ ảnh đại diện"
                  title="Gỡ ảnh đại diện"
                  className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm hover:bg-destructive hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>Tên trang</FieldLabel>
                <Input value={profileDetails.name} onChange={(event) => updateProfileDetails("name", event.target.value)} placeholder="Tên của bạn hoặc thương hiệu" />
              </div>
              <div>
                <FieldLabel>Mô tả ngắn</FieldLabel>
                <Input value={profileDetails.title} onChange={(event) => updateProfileDetails("title", event.target.value)} placeholder="Creator, designer, streamer..." />
              </div>
            </div>
            <div>
              <FieldLabel>Slug công khai</FieldLabel>
              <div className={MEMBER_FIELD_SHELL}>
                <span className="inline-flex h-full shrink-0 items-center border-r border-border bg-muted/35 px-3 text-muted-foreground">{linkPath(linkSettings, "bio", "")}</span>
                {/* Trang đã tạo thì không cho đổi đường dẫn (tránh làm hỏng link đã chia sẻ). */}
                <input
                  value={customSlug}
                  readOnly={Boolean(initialBio)}
                  aria-readonly={Boolean(initialBio) || undefined}
                  onChange={(event) => {
                    if (initialBio) return
                    const source = linkSettings.aliasCaseSensitive ? event.target.value : event.target.value.toLowerCase()
                    setCustomSlug(source.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-+/, ""))
                  }}
                  placeholder="ten-cua-ban"
                  className={`${MEMBER_FIELD_BARE} px-3 ${initialBio ? "cursor-default text-muted-foreground" : "text-foreground"}`}
                />
              </div>
            </div>
          </EditorSection>

          <EditorSection title="Nội dung" icon={Layers3} count={normalizedOrder.length} open={expandedSections.content} onOpenChange={(open) => setSectionOpen("content", open)}>
            <ContentSection
              customLinks={customLinks}
              socialLinks={socialLinks}
              widgets={widgets}
              galleries={galleries}
              dividers={dividers}
              bankDetails={bankDetails}
              textBlocks={textBlocks}
              hiddenLinks={hiddenLinks}
              contentOrder={normalizedOrder}
              disabled={isSaving}
              onCustomLinksChange={setCustomLinks}
              onSocialLinksChange={setSocialLinks}
              onWidgetsChange={setWidgets}
              onGalleriesChange={setGalleries}
              onDividersChange={setDividers}
              onBankDetailsChange={setBankDetails}
              onTextBlocksChange={setTextBlocks}
              onHiddenLinksChange={setHiddenLinks}
              onContentOrderChange={setContentOrder}
            />
          </EditorSection>

  <EditorSection
  title="Giao diện"
  icon={Palette}
  open={expandedSections.appearance}
  onOpenChange={(open) => setSectionOpen("appearance", open)}
>
  <div className="space-y-5">
    {/* Background preset */}
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-4">
        <div className="text-sm font-semibold text-foreground">
          Mẫu giao diện
        </div>
      </div>

      <BackgroundPresetPicker
        selectedPresetId={appearanceSettings.selectedBackgroundId}
        onSelect={selectBackgroundPreset}
      />
    </div>

    {/* Background effects */}
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">
            Hiệu ứng nền
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            updateAppearanceSettings("backgroundBlur", 0);
            updateAppearanceSettings("backgroundOverlay", 0);
            updateAppearanceSettings("backgroundBrightness", 100);
          }}
          className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Đặt lại
        </button>
      </div>

      <div className="space-y-5">
        {/* Blur */}
        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-foreground">
              Độ mờ
            </span>

            <span className="min-w-11 rounded-md bg-background px-2 py-1 text-center text-[11px] font-medium tabular-nums text-muted-foreground shadow-sm ring-1 ring-border">
              {appearanceSettings.backgroundBlur ?? 0}px
            </span>
          </div>

          <Slider
            value={[appearanceSettings.backgroundBlur ?? 0]}
            min={0}
            max={24}
            step={1}
            onValueChange={([value]) =>
              updateAppearanceSettings("backgroundBlur", value)
            }
            aria-label="Độ mờ background"
          />
        </div>

        {/* Overlay */}
        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-foreground">
              Lớp phủ tối
            </span>

            <span className="min-w-11 rounded-md bg-background px-2 py-1 text-center text-[11px] font-medium tabular-nums text-muted-foreground shadow-sm ring-1 ring-border">
              {appearanceSettings.backgroundOverlay ?? 0}%
            </span>
          </div>

          <Slider
            value={[appearanceSettings.backgroundOverlay ?? 0]}
            min={0}
            max={80}
            step={1}
            onValueChange={([value]) =>
              updateAppearanceSettings("backgroundOverlay", value)
            }
            aria-label="Độ tối lớp phủ background"
          />
        </div>

        {/* Brightness */}
        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-foreground">
              Độ sáng
            </span>

            <span className="min-w-11 rounded-md bg-background px-2 py-1 text-center text-[11px] font-medium tabular-nums text-muted-foreground shadow-sm ring-1 ring-border">
              {appearanceSettings.backgroundBrightness ?? 100}%
            </span>
          </div>

          <Slider
            value={[appearanceSettings.backgroundBrightness ?? 100]}
            min={50}
            max={150}
            step={5}
            onValueChange={([value]) =>
              updateAppearanceSettings("backgroundBrightness", value)
            }
            aria-label="Độ sáng background"
          />
        </div>
      </div>
    </div>

    {/* Button shape */}
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-4">
        <div className="text-sm font-semibold text-foreground">
          Kiểu nút
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-2"
        role="radiogroup"
        aria-label="Chọn hình dáng nút"
      >
        {bioButtonStyles.map((style) => {
          const selected = selectedButtonStyle === style.value;

          const radiusClass =
            style.value === "rounded-border"
              ? "rounded-full"
              : style.value === "mineral-square"
                ? "rounded-[4px]"
                : "rounded-lg";

          return (
            <button
              key={style.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() =>
                updateAppearanceSettings("buttonStyle", style.value)
              }
              className={`
                group relative min-w-0 rounded-xl border p-2.5
                text-center transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-ring focus-visible:ring-offset-2
                ${
                  selected
                    ? "border-primary bg-primary/[0.06] shadow-sm ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-foreground/20 hover:bg-muted/30"
                }
              `}
            >
              {/* Selected indicator */}
              <span
                className={`
                  absolute right-2 top-2 flex size-4 items-center justify-center
                  rounded-full border transition-all
                  ${
                    selected
                      ? "border-primary bg-primary"
                      : "border-border bg-background opacity-0 group-hover:opacity-100"
                  }
                `}
                aria-hidden
              >
                {selected && (
                  <span className="size-1.5 rounded-full bg-primary-foreground" />
                )}
              </span>

              {/* Preview */}
              <div className="flex h-11 items-center justify-center px-1">
                <span
                  className={`
                    block h-7 w-full max-w-20 border-2
                    transition-transform duration-200
                    group-hover:scale-[1.03]
                    ${radiusClass}
                  `}
                  style={{
                    backgroundColor: activeTheme.buttonColor,
                    borderColor: activeTheme.buttonBorderColor,
                    boxShadow:
                      style.value === "mineral-square"
                        ? `3px 3px 0 ${activeTheme.buttonBorderColor}`
                        : undefined,
                  }}
                  aria-hidden
                />
              </div>

              <span
                className={`
                  mt-1 block truncate text-[11px]
                  ${
                    selected
                      ? "font-semibold text-foreground"
                      : "font-medium text-muted-foreground"
                  }
                `}
              >
                {style.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
</EditorSection>

          <EditorSection title="Xuất bản" icon={Shield} open={expandedSections.admin} onOpenChange={(open) => setSectionOpen("admin", open)}>
            <div><FieldLabel>Trạng thái</FieldLabel><Select value={status} onValueChange={(value) => setStatus(value as "published" | "draft")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Đã xuất bản</SelectItem><SelectItem value="draft">Bản nháp</SelectItem></SelectContent></Select></div>
            <p className="text-xs leading-5 text-muted-foreground">Trang đã xuất bản có thể mở công khai tại {linkPath(linkSettings, "bio", customSlug || "ten-cua-ban")}.</p>
          </EditorSection>

        </div>

        <aside className="min-w-0 xl:sticky xl:top-0">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Xem trước trực tiếp</h3>

              <div className="flex flex-wrap items-center gap-2">
                {initialBio?.publicUrl ? (
                  <Button asChild variant="outline" size="sm" className="h-9 px-3 shadow-none">
                    <a href={initialBio.publicUrl} target="_blank" rel="noreferrer">
                      Xem trang
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                ) : null}

                <Button
                  type="submit"
                  name="saveMode"
                  value={initialBio ? "current" : "published"}
                  size="sm"
                  disabled={isSaving}
                  className="h-9 rounded-lg px-4 font-medium shadow-none"
                >
                  {isSaving ? "Đang lưu…" : "Lưu thay đổi"}
                </Button>
              </div>
            </div>

            <div className="bg-muted/20 p-3 sm:p-4">
              <div className="relative min-h-[600px] overflow-hidden rounded-xl border border-border bg-[#f4f7fb]">
                <div className="pointer-events-none absolute inset-0" style={{ ...backgroundStyle, filter: backgroundFilter }} />
                {selectedBackgroundMedia?.type === "video" ? <video src={selectedBackgroundMedia.url} autoPlay muted loop playsInline className="pointer-events-none absolute inset-0 size-full object-cover" style={{ filter: backgroundFilter }} /> : null}
                {selectedBackgroundMedia?.type === "youtube" && getYouTubeEmbedUrl(selectedBackgroundMedia.url) ? <iframe src={getYouTubeEmbedUrl(selectedBackgroundMedia.url)} title="Xem trước background YouTube" allow="autoplay; encrypted-media; picture-in-picture" className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[266%] -translate-x-1/2 -translate-y-1/2" style={{ filter: backgroundFilter }} /> : null}
                {backgroundOverlayOpacity > 0 ? <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${backgroundOverlayOpacity})` }} /> : null}
                <div className="relative z-10 flex min-h-[600px] flex-col">
                  <div
                    className="mx-auto flex w-full max-w-md flex-1 flex-col"
                    style={{
                      ...previewThemeVariables,
                      color: activeTheme.textColor,
                    }}
                  >
                    <div className="flex items-center justify-between px-4 pt-4" aria-hidden>
                      <span
                        className="grid size-10 place-items-center rounded-2xl border shadow-sm backdrop-blur-md"
                        style={{ backgroundColor: activeTheme.surfaceColor, borderColor: activeTheme.surfaceBorderColor }}
                      >
                        <SiteBrandMark className="size-6 rounded-lg border-0 bg-transparent" />
                      </span>
                      <span
                        className="grid size-10 place-items-center rounded-2xl border shadow-sm backdrop-blur-md"
                        style={{ backgroundColor: activeTheme.surfaceColor, borderColor: activeTheme.surfaceBorderColor }}
                      >
                        <Share2 className="size-4" />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col px-4 pb-6 pt-5">
                      <header className="text-center">
                        <div className={BIO_HEADER.avatar} style={{ boxShadow: `0 10px 30px rgba(2,6,23,.20), 0 0 0 1px ${activeTheme.surfaceBorderColor}` }}>
                          <span>{profileDetails.name.trim().slice(0, 1).toUpperCase() || "R"}</span>
                          {profileDetails.avatarUrl ? <img src={profileDetails.avatarUrl} alt="" className="absolute inset-0 size-full object-cover" onError={(event) => { event.currentTarget.hidden = true }} /> : null}
                        </div>
                        <h4 className={cn(BIO_HEADER.name, "truncate")} style={{ color: activeTheme.textColor }}>{profileDetails.name || "Tên của bạn"}</h4>
                        <p className={cn(BIO_HEADER.handle, "truncate")} style={{ color: activeTheme.mutedTextColor }}>
                          {linkUrl(linkSettings, "bio", customSlug || "ten-cua-ban")}
                        </p>
                        <p className={BIO_HEADER.description} style={{ color: activeTheme.mutedTextColor }}>{profileDetails.title || "Thêm một mô tả ngắn để mọi người biết bạn là ai và nội dung bạn chia sẻ."}</p>
                      </header>

                      <div className={BIO_CONTENT_STACK_CLASS}>
                        {normalizedOrder.map((item, contentIndex) => {
                          if (item.type === "social") {
                            const visibleSocials = socialLinks.filter((social) => social.enabled !== false).slice(0, 8)
                            return visibleSocials.length ? <div key={contentOrderKey(item)} className={BIO_SOCIAL_ROW_CLASS}>{visibleSocials.map((social) => <button key={social.id} type="button" title={social.platform} className={BIO_SOCIAL_ICON_CLASS} style={{ backgroundColor: activeTheme.sectionColor, borderColor: activeTheme.sectionBorderColor, color: activeTheme.textColor }}>{getSocialIcon(social.platform)}</button>)}</div> : null
                          }
                          if (item.type === "gallery") {
                            const gallery = galleries.find((entry) => entry.id === item.id)
                            return gallery ? <GalleryRenderer key={contentOrderKey(item)} gallery={gallery} emptyState={<div className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-500">Chưa có ảnh trong bộ sưu tập.</div>} /> : null
                          }
                          if (item.type === "divider") {
                            const block = dividers.find((entry) => entry.id === item.id)
                            return block ? <DividerRenderer key={contentOrderKey(item)} block={block} /> : null
                          }
                          if (item.type === "bank-details") {
                            const block = bankDetails.find((entry) => entry.id === item.id)
                            return block ? <BankDetailsRenderer key={contentOrderKey(item)} block={block} /> : null
                          }
                          if (item.type === "text") {
                            const block = textBlocks.find((entry) => entry.id === item.id)
                            return block ? <TextBlockRenderer key={contentOrderKey(item)} block={block} /> : null
                          }
                          if (item.type === "widget") {
                            const widget = widgets.find((entry) => entry.id === item.id)
                            return widget && widget.enabled !== false ? <BioWidgetEmbed key={contentOrderKey(item)} widget={widget} /> : null
                          }
                          const link = customLinks.find((entry) => entry.id === item.id)
                          if (!link || hiddenLinks.includes(link.id)) return null
                          return <BioLinkButton key={`${contentOrderKey(item)}:${link.animationEffect || "none"}`} link={link} buttonStyle={selectedButtonStyle} theme={activeTheme} contentIndex={contentIndex} preview />
                        })}
                        {customLinks.every((link) => hiddenLinks.includes(link.id)) && socialLinks.every((social) => social.enabled === false) && widgets.every((widget) => widget.enabled === false) && galleries.every((gallery) => !gallery.enabled || gallery.images.length === 0) && dividers.every((block) => !block.enabled) && bankDetails.every((block) => !block.enabled || !hasCompleteBankDetails(block)) && textBlocks.every((block) => !block.enabled || !block.content.trim()) ? <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm" style={{ backgroundColor: activeTheme.sectionColor, borderColor: activeTheme.sectionBorderColor, color: activeTheme.mutedTextColor }}>Thêm nội dung để xem trước tại đây.</div> : null}
                      </div>
                      <div className={BIO_FOOTER_CLASS}>
                        <span className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-center text-[13px] font-semibold text-slate-950 shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
                          Tạo trang của bạn trên {brand.siteName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <ManagedImagePicker
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        selectedFileId={profileDetails.avatarFileId}
        acceptedMimeTypes={GALLERY_ACCEPTED_MIME_TYPES}
        maxSize={businessConfig.uploads.coverImageMaxBytes}
        title="Chọn ảnh đại diện"
        onSelect={(file) => setProfileDetails((current) => ({
          ...current,
          avatarFileId: file.id,
          avatarUrl: getFilePreviewUrl(file),
        }))}
      />
    </form>
  )
}
