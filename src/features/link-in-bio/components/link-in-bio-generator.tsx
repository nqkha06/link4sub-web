"use client"
/* eslint-disable @next/next/no-img-element */

import type React from "react"

import { useEffect, useRef, useState, type ComponentType } from "react"
import {
  ChevronDown,
  CircleCheck,
  Layers3,
  Palette,
  Settings,
  Pencil,
  Shield,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { ManagedImagePicker } from "@/components/media/managed-image-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/member/fields/input"
import { MEMBER_FIELD_BARE, MEMBER_FIELD_SHELL } from "@/components/member/fields/field-styles"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/member/fields/select"
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
  uploadFile,
} from "@/lib/api-client"
import { getPublicLinkSettingsClient } from "@/features/link-settings/api/link-settings.client"
import { linkPath, type LinkSettings } from "@/features/link-settings/types"
import {
  normalizeBioButtonStyle,
} from "./bio-appearance"
import { ContentSection } from "../content-blocks/content-section"
import {
  DEFAULT_BIO_BACKGROUND_PRESET_ID,
  getBioBackgroundPresetById,
  getBioBackgroundPresetByImage,
} from "../backgrounds/background-presets"
import { hasCompleteBankDetails } from "../content-blocks/simple-content-types"
import { cn } from "@/lib/utils"
import {
  GALLERY_ACCEPTED_MIME_TYPES,
  normalizeContentOrder,
} from "../gallery/gallery-types"
import { useBusinessConfig } from "@/features/business-settings/use-business-config"
import { generateId } from "@/lib/id"
import { AUDIO_UPLOAD_ACCEPT, getUploadMimeType } from "@/lib/upload-compatibility"
import { uploadErrorMessage } from "@/lib/upload-request"
import { useTranslations } from "next-intl"
import { createStarterBioContent } from "../create/create-bio-page"
import { DEFAULT_BIO_DESIGN, getBioMusicTracks, type BioDesign } from "@/contracts"
import { addMusicTrack, titleFromFileName } from "../design/music-tracks"
import { isUnfilledSocialUrl } from "../content-blocks/social-url-templates"
import { findContentIssues, summarizeIssueLabels } from "../content-blocks/content-issues"
import type { ContentSectionHandle } from "../content-blocks/content-section"
import { BioDesignStudio } from "../design/bio-design-studio"
import { normalizeDesignColors } from "../design/normalize-design-colors"
import { PublicBioView } from "@/app/(public)/b/[slug]/public-bio-view"
import publicBioStyles from "../public/VEXRO.module.css"
import { withBuiltinDesignAssets } from "../public/bio-public-model"
import { CURSOR_MAX_SIZE, prepareCursorImage } from "../design/prepare-cursor-image"

const VIDEO_MIME_PREFIXES = ["video/"] as const
const AUDIO_MIME_PREFIXES = ["audio/"] as const

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

/**
 * Trang cũ (chưa có Bio Design): giữ nguyên style mặc định (thẻ kính tối) và
 * chỉ chuyển phần nền. Không chép màu của mẫu nền cũ — đó là màu sáng dạng
 * `rgba(...)`, API chỉ nhận hex nên sẽ từ chối khi lưu.
 */
function legacyCompatibleDesign(bio?: BioPageDto | null): BioDesign {
  if (!bio || bio.hasDesign) return bio?.design ?? DEFAULT_BIO_DESIGN
  const legacyMedia = bio.appearance.backgroundMediaType === "video" ? "video" : bio.appearance.backgroundImage || bio.appearance.backgroundMediaUrl ? "image" : null
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
  return {
    ...DEFAULT_BIO_DESIGN,
    background: {
      ...DEFAULT_BIO_DESIGN.background,
      type: legacyMedia ?? DEFAULT_BIO_DESIGN.background.type,
      overlay: {
        ...DEFAULT_BIO_DESIGN.background.overlay,
        enabled: Boolean(bio.appearance.backgroundOverlay),
        opacity: clamp(bio.appearance.backgroundOverlay ?? 0, 0, 100),
      },
      filter: {
        ...DEFAULT_BIO_DESIGN.background.filter,
        blur: clamp(bio.appearance.backgroundBlur ?? 0, 0, 40),
        brightness: clamp(bio.appearance.backgroundBrightness ?? 100, 0, 200),
      },
    },
  }
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

type LinkInBioGeneratorProps = {
  initialBio?: BioPageDto | null
  /** Ghi đè trạng thái ban đầu, ví dụ khi người dùng chọn "Công khai" lúc tạo trang. */
  initialStatus?: "published" | "draft"
  /** Bật sẵn khối mạng xã hội và liên kết gợi ý khi trang mới chưa có nội dung. */
  starterContent?: boolean
  onSaved?: (bioPage: BioPageDto) => void
  onSavingChange?: (saving: boolean) => void
}

/**
 * Bọc trình chỉnh sửa để "Đặt lại" (bỏ thay đổi chưa lưu) dựng lại form từ bản đã
 * lưu gần nhất: đổi `key` → React tạo lại toàn bộ state từ `initialBio`.
 */
export default function LinkInBioGenerator({ initialBio, onSaved, ...props }: LinkInBioGeneratorProps) {
  const [savedBase, setSavedBase] = useState(initialBio)
  const [resetKey, setResetKey] = useState(0)
  return (
    <LinkInBioGeneratorForm
      key={resetKey}
      {...props}
      initialBio={savedBase}
      onSaved={(bioPage) => {
        setSavedBase(bioPage)
        onSaved?.(bioPage)
      }}
      onReset={() => setResetKey((key) => key + 1)}
    />
  )
}

function LinkInBioGeneratorForm({
  initialBio,
  initialStatus,
  starterContent = false,
  onSaved,
  onSavingChange,
  onReset,
}: LinkInBioGeneratorProps & { onReset: () => void }) {
  const businessConfig = useBusinessConfig()
  const [linkSettings, setLinkSettings] = useState<LinkSettings>({
    publicDomain: "http://localhost:3000",
    socialPrefix: "",
    bioPrefix: "b",
    aliasLength: 8,
    aliasCaseSensitive: false,
  })
  // Trang vừa tạo (?new=1): tên/slug đã đặt lúc tạo, nên thu gọn "Thông tin trang"
  // và mở sẵn "Nội dung" để người dùng thêm link ngay.
  const [expandedSections, setExpandedSections] = useState<Record<EditorSectionKey, boolean>>(() => ({
    details: !starterContent,
    content: true,
    appearance: false,
    admin: false,
  }))
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
  // Giữ nguyên thiết lập nền cũ của trang (thư viện nền đã bỏ, không còn đổi ở đây).
  const [appearanceSettings] = useState<AppearanceSettings>({
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
  const [bioDesign, setBioDesign] = useState<BioDesign>(() => legacyCompatibleDesign(initialBio))
  const [hiddenLinks, setHiddenLinks] = useState<string[]>(initialBio?.hiddenLinks || [])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  // Chỉ đánh dấu ô lỗi sau khi người dùng đã bấm lưu (không làm phiền lúc đang gõ).
  const [showContentIssues, setShowContentIssues] = useState(false)
  const contentSectionRef = useRef<ContentSectionHandle>(null)
  const [savedBio, setSavedBio] = useState<BioPageDto | null>(null)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)
  const [designAssetPicker, setDesignAssetPicker] = useState<"image" | "video" | "music" | "cursor" | null>(null)
  // Trang mới chưa có ngày tạo: cố định một mốc khi mở trình chỉnh sửa.
  // Đổi key để khung xem trước dựng lại và phát lại hiệu ứng xuất hiện (sau khi áp template).
  const [previewKey, setPreviewKey] = useState(0)
  const [previewCreatedAt] = useState(() => initialBio?.createdAt ?? new Date().toISOString())
  const [cursorProcessing, setCursorProcessing] = useState(false)
  const uploadT = useTranslations("Uploads")
  // URL nghe thử của từng bài nhạc theo assetId (bài đã lưu + bài vừa tải lên).
  const [musicTrackUrls, setMusicTrackUrls] = useState<Record<string, string | undefined>>(() => {
    const urls: Record<string, string | undefined> = {}
    for (const track of initialBio?.designAssets.musicTracks ?? []) urls[track.assetId] = track.url
    const activeId = initialBio?.design?.audio.music.assetId
    if (activeId && initialBio?.designAssets.musicUrl) urls[activeId] ??= initialBio.designAssets.musicUrl
    return urls
  })
  const uploadMusic = async (file: File, onProgress: (value: number) => void) => {
    if (!getUploadMimeType(file).startsWith("audio/")) throw new Error("File không phải âm thanh (mp3, aac, m4a).")
    if (file.size > businessConfig.uploads.memberFileMaxBytes) throw new Error("File âm thanh vượt quá dung lượng cho phép.")
    try {
      const uploaded = await uploadFile(file, { purpose: "file", onProgress })
      return { assetId: uploaded.id, url: getFilePreviewUrl(uploaded) }
    } catch (error) {
      throw new Error(uploadErrorMessage(error, uploadT, uploadT("failed")))
    }
  }
  const [designAssetPreviews, setDesignAssetPreviews] = useState({
    image: initialBio?.designAssets.backgroundImageUrl,
    video: initialBio?.designAssets.backgroundVideoUrl,
    music: initialBio?.designAssets.musicUrl,
    cursor: initialBio?.designAssets.cursorUrl,
  })

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
    socialLinks: socialLinks.filter((link) => link.platform && !isUnfilledSocialUrl(link.url) && isValidUrl(link.url)),
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
    design: normalizeDesignColors(bioDesign),
  })

  /*
   * Thay đổi chưa lưu: so payload hiện tại với payload của bản đã lưu (lấy ở lần
   * render đầu và sau mỗi lần lưu thành công).
   */
  const currentPayloadJson = JSON.stringify(buildBioPayload())
  const [savedPayloadJson, setSavedPayloadJson] = useState<string | null>(null)
  if (savedPayloadJson === null) setSavedPayloadJson(currentPayloadJson)
  const hasUnsavedChanges = savedPayloadJson !== null && currentPayloadJson !== savedPayloadJson

  const handleSaveBio = async (saveMode: "draft" | "published" | "current" = "current") => {
    if (isSaving) return

    const nextStatus = saveMode === "current" ? status : saveMode
    const payload = buildBioPayload(nextStatus)
    if (!payload.name) {
      setSaveError("Tên trang là bắt buộc.")
      return
    }
    const contentIssues = findContentIssues({ socialLinks, customLinks, widgets })
    const hasPublishableContent = !(payload.socialLinks.length === 0 && payload.customLinks.length === 0 && payload.widgets.length === 0 && payload.galleries.every((gallery) => gallery.images.length === 0) && payload.dividers.length === 0 && payload.bankDetails.length === 0 && payload.textBlocks.length === 0)
    if (nextStatus === "published" && !hasPublishableContent) {
      setSaveError("")
      setShowContentIssues(true)
      setSectionOpen("content", true)
      const firstIssue = contentIssues[0]
      if (firstIssue) contentSectionRef.current?.revealIssue(firstIssue)
      toast.error(firstIssue ? "Điền xong ít nhất một mục để xuất bản" : "Trang chưa có nội dung để xuất bản", {
        description: firstIssue
          ? `Chưa điền xong: ${summarizeIssueLabels(contentIssues)}. Các ô cần sửa đã được đánh dấu đỏ.`
          : "Thêm một liên kết, mạng xã hội hoặc khối nội dung bất kỳ.",
        action: { label: "Lưu nháp", onClick: () => void handleSaveBio("draft") },
      })
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
      setSavedPayloadJson(JSON.stringify(buildBioPayload()))
      onSaved?.(bioPage)
      if (contentIssues.length) {
        // Lưu được nhưng có mục chưa điền: báo rõ mục nào bị bỏ qua và đánh dấu tại chỗ.
        setShowContentIssues(true)
        toast.success("Đã lưu trang Link-in-bio", {
          description: `Bỏ qua mục chưa điền xong: ${summarizeIssueLabels(contentIssues)}.`,
        })
      } else {
        toast.success("Đã lưu trang Link-in-bio")
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Không lưu được trang Link-in-bio.")
      toast.error(error instanceof Error ? error.message : "Không lưu được trang Link-in-bio.")
    } finally {
      setIsSaving(false)
      onSavingChange?.(false)
    }
  }

  const normalizedOrder = normalizeContentOrder(contentOrder, { socials: socialLinks, widgets, galleries, dividers, bankDetails, textBlocks, links: customLinks })
  /* Dữ liệu cho khung xem trước: dựng BioPageDto từ trạng thái đang sửa (chưa lưu). */
  const previewBioPage: BioPageDto = {
    id: initialBio?.id ?? 0,
    slug: customSlug || initialBio?.slug || "ten-cua-ban",
    publicUrl: initialBio?.publicUrl ?? "",
    name: profileDetails.name.trim() || "Tên của bạn",
    title: profileDetails.title || null,
    status,
    views: initialBio?.views ?? 0,
    clicks: initialBio?.clicks ?? 0,
    socialLinks,
    customLinks,
    widgets,
    galleries,
    dividers,
    bankDetails,
    textBlocks,
    contentOrder: normalizedOrder,
    hiddenLinks,
    appearance: {
      ...appearanceSettings,
      avatarFileId: profileDetails.avatarFileId,
      avatarUrl: profileDetails.avatarUrl,
    },
    design: bioDesign,
    hasDesign: true,
    // Asset dựng sẵn của template (builtin:...) đè lên file đã chọn trong thư viện.
    designAssets: withBuiltinDesignAssets(bioDesign, {
      ...initialBio?.designAssets,
      backgroundImageUrl: designAssetPreviews.image,
      backgroundVideoUrl: designAssetPreviews.video,
      musicUrl: (bioDesign.audio.music.assetId ? musicTrackUrls[bioDesign.audio.music.assetId] : undefined) ?? designAssetPreviews.music,
      musicTracks: getBioMusicTracks(bioDesign.audio.music).flatMap((track) => {
        const url = musicTrackUrls[track.assetId]
        return url ? [{ assetId: track.assetId, title: track.title, url }] : []
      }),
      cursorUrl: designAssetPreviews.cursor,
    }),
    createdAt: previewCreatedAt,
    updatedAt: previewCreatedAt,
  }

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
              ref={contentSectionRef}
              issues={showContentIssues ? findContentIssues({ socialLinks, customLinks, widgets }) : undefined}
            />
          </EditorSection>

          <EditorSection
            title="Design"
            icon={Palette}
            open={expandedSections.appearance}
            onOpenChange={(open) => setSectionOpen("appearance", open)}
          >
            <BioDesignStudio
              previewName={profileDetails.name}
              onTemplateApplied={() => setPreviewKey((key) => key + 1)}
              value={bioDesign}
              onChange={setBioDesign}
              onPickBackgroundAsset={setDesignAssetPicker}
              onPickMusicAsset={() => setDesignAssetPicker("music")}
              onPickCursorAsset={() => setDesignAssetPicker("cursor")}
              musicTrackUrls={musicTrackUrls}
              onUploadMusic={uploadMusic}
              onMusicTrackUploaded={(assetId, url) => setMusicTrackUrls((current) => ({ ...current, [assetId]: url }))}
              cursorPreviewUrl={previewBioPage.designAssets.cursorUrl}
              backgroundPreviewUrls={{ image: previewBioPage.designAssets.backgroundImageUrl, video: previewBioPage.designAssets.backgroundVideoUrl }}
              cursorProcessing={cursorProcessing}
            />
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

              {/* Điện thoại: ẩn — dùng thanh "thay đổi chưa lưu" ở đáy màn hình. */}
              <div className="hidden flex-wrap items-center gap-2 sm:flex">
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
              {/* Dùng đúng component của trang công khai /b/[slug] với dữ liệu đang sửa. */}
              <div className={cn(publicBioStyles.previewFrame, "h-[min(820px,calc(100dvh-150px))] min-h-[560px] rounded-xl border border-border bg-black")}>
                <PublicBioView key={previewKey} bioPage={previewBioPage} preview />
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
      <ManagedImagePicker
        open={designAssetPicker === "cursor"}
        onOpenChange={(open) => { if (!open) setDesignAssetPicker(null) }}
        selectedFileId={bioDesign.effects.cursor.assetId}
        title="Chọn ảnh con trỏ"
        onSelect={(picked) => {
          setDesignAssetPicker(null)
          setCursorProcessing(true)
          // Ảnh lớn hơn 32px được thu nhỏ thành PNG và tải lên thành file mới.
          void prepareCursorImage(picked).then(({ file, resized }) => {
            setBioDesign((current) => ({
              ...current,
              effects: { ...current.effects, cursor: { ...current.effects.cursor, type: "custom", assetId: file.id, hotspotX: 0, hotspotY: 0 } },
            }))
            setDesignAssetPreviews((current) => ({ ...current, cursor: getFilePreviewUrl(file) }))
            if (resized) toast.success(`Đã tự thu nhỏ ảnh con trỏ về ${CURSOR_MAX_SIZE}px.`)
          }).finally(() => setCursorProcessing(false))
        }}
      />
      <ManagedImagePicker
        open={designAssetPicker === "image"}
        onOpenChange={(open) => { if (!open) setDesignAssetPicker(null) }}
        selectedFileId={bioDesign.background.imageAssetId}
        title="Chọn ảnh nền Bio"
        onSelect={(file) => {
          setBioDesign((current) => ({
            ...current,
            background: { ...current.background, type: "image", imageAssetId: file.id },
          }))
          setDesignAssetPreviews((current) => ({ ...current, image: getFilePreviewUrl(file) }))
          setDesignAssetPicker(null)
        }}
      />
      <ManagedImagePicker
        open={designAssetPicker === "video"}
        onOpenChange={(open) => { if (!open) setDesignAssetPicker(null) }}
        selectedFileId={bioDesign.background.videoAssetId}
        acceptedMimePrefixes={VIDEO_MIME_PREFIXES}
        assetLabel="video"
        accept="video/*"
        uploadPurpose="file"
        title="Chọn video nền Bio"
        onSelect={(file) => {
          setBioDesign((current) => ({
            ...current,
            background: { ...current.background, type: "video", videoAssetId: file.id },
          }))
          setDesignAssetPreviews((current) => ({ ...current, video: getFilePreviewUrl(file) }))
          setDesignAssetPicker(null)
        }}
      />
      <ManagedImagePicker
        open={designAssetPicker === "music"}
        onOpenChange={(open) => { if (!open) setDesignAssetPicker(null) }}
        selectedFileId={null}
        acceptedMimePrefixes={AUDIO_MIME_PREFIXES}
        assetLabel="âm thanh"
        accept={AUDIO_UPLOAD_ACCEPT}
        uploadPurpose="file"
        title="Thêm nhạc vào danh sách"
        onSelect={(file) => {
          // Chọn từ thư viện = thêm một bài vào Audio Manager.
          setBioDesign((current) => ({
            ...current,
            audio: { ...current.audio, music: addMusicTrack(current.audio.music, { assetId: file.id, title: titleFromFileName(file.originalName || file.name) }) },
          }))
          setMusicTrackUrls((current) => ({ ...current, [file.id]: getFilePreviewUrl(file) }))
          setDesignAssetPicker(null)
        }}
      />
      {/* Điện thoại: thanh "thay đổi chưa lưu" kiểu guns.lol, trượt lên khi có thay đổi. */}
      <div
        aria-hidden={!hasUnsavedChanges}
        className={cn(
          "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1.75rem)] z-40 transition-all duration-300 sm:hidden",
          hasUnsavedChanges || isSaving ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[150%] opacity-0",
        )}
      >
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-popover/75 p-3 pl-4 text-popover-foreground shadow-2xl backdrop-blur-xl backdrop-saturate-150">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{isSaving ? "Đang lưu…" : "Bạn có thay đổi chưa lưu!"}</p>
          <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0 px-3" disabled={isSaving} tabIndex={hasUnsavedChanges ? 0 : -1} onClick={onReset}>
            Đặt lại
          </Button>
          <Button type="submit" name="saveMode" value={initialBio ? "current" : "published"} size="sm" className="h-9 shrink-0 rounded-lg px-4 font-medium shadow-none" disabled={isSaving} tabIndex={hasUnsavedChanges ? 0 : -1}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </form>
  )
}
