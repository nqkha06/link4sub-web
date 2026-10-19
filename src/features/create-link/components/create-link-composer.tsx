"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { DEFAULT_LINK_BACKGROUND_EFFECTS } from "@/contracts"

import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link as LinkIcon,
  Lock,
  MessageSquare,
  MousePointerClick,
  PanelsTopLeft,
  PlayCircle,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { Input } from "@/components/member/fields/input"
import { MEMBER_FIELD_BARE, MEMBER_FIELD_SHELL } from "@/components/member/fields/field-styles"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/member/fields/textarea"

import { useBusinessConfig } from "@/features/business-settings/use-business-config"
import { getPublicLinkSettingsClient } from "@/features/link-settings/api/link-settings.client"
import { linkPath, type LinkSettings } from "@/features/link-settings/types"
import { actionCategories, type ActionCategory } from "@/features/link-creation/catalog"
import { LINK_BACKGROUND_IMAGE_PRESETS } from "@/features/link-creation/background-image-presets"
import { formatSnippetSize, getYouTubeEmbedUrl } from "@/features/link-creation/lib/media"
import { generateUuid } from "@/lib/id"
import { cn } from "@/lib/utils"

import { saveAnonymousDraft } from "../pending-draft"
import {
  getLocalDateInputValue,
  getPlatformIconClass,
  isValidUrl,
  popularActionOptions,
  socialPlatforms,
  toPlatformKey,
  type SocialAction,
} from "../social-catalog"
import type { AnonymousLinkDraft } from "../types"

function makeActionId() {
  return generateUuid()
}

function SectionTriggerLabel({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof SlidersHorizontal
  title: string
  description: string
}) {
  return (
    <span className="flex min-w-0 items-center gap-3 text-left">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
    </span>
  )
}

export function CreateLinkComposer() {
  const router = useRouter()
  const businessConfig = useBusinessConfig()
  const [linkSettings, setLinkSettings] = useState<LinkSettings>({
    publicDomain: "http://localhost:3000",
    socialPrefix: "",
    bioPrefix: "b",
    aliasLength: 8,
    aliasCaseSensitive: false,
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

  // --- Destination -----------------------------------------------------
  const [inputType, setInputType] = useState<"url" | "snippet">("url")
  const [destinationUrl, setDestinationUrl] = useState("")
  const [snippetContent, setSnippetContent] = useState("")
  const [title, setTitle] = useState("")

  // --- Actions -----------------------------------------------------------
  const [actions, setActions] = useState<SocialAction[]>([])
  const [isActionPickerOpen, setIsActionPickerOpen] = useState(false)
  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const [actionSearch, setActionSearch] = useState("")
  const [actionCategory, setActionCategory] = useState<ActionCategory>("all")

  // --- Layout / background ------------------------------------------------
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | undefined>(undefined)
  const [selectedBackgroundName, setSelectedBackgroundName] = useState<string | undefined>(undefined)
  const [backgroundMediaType, setBackgroundMediaType] = useState<"image" | "video" | "youtube" | undefined>(undefined)
  const [backgroundMediaUrl, setBackgroundMediaUrl] = useState<string | undefined>(undefined)
  const [backgroundImageCategory, setBackgroundImageCategory] = useState("All")
  const [backgroundVideoCategory, setBackgroundVideoCategory] = useState("All")
  const [youtubeBackgroundUrl, setYoutubeBackgroundUrl] = useState("")
  const [opacity, setOpacity] = useState(DEFAULT_LINK_BACKGROUND_EFFECTS.opacity)
  const [blur, setBlur] = useState(DEFAULT_LINK_BACKGROUND_EFFECTS.blur)
  const [saturation, setSaturation] = useState(DEFAULT_LINK_BACKGROUND_EFFECTS.saturation)
  const [contrast, setContrast] = useState(DEFAULT_LINK_BACKGROUND_EFFECTS.contrast)
  const [grayscale, setGrayscale] = useState(DEFAULT_LINK_BACKGROUND_EFFECTS.grayscale)

  // --- Extra options -------------------------------------------------------
  const [extraOptionsOpen, setExtraOptionsOpen] = useState(false)
  const [subtitle, setSubtitle] = useState("")
  const [customAlias, setCustomAlias] = useState("")

  // --- Expiry ---------------------------------------------------------------
  const [expiresOpen, setExpiresOpen] = useState(false)
  const [expiryEnabled, setExpiryEnabled] = useState(false)
  const [expiryType, setExpiryType] = useState<"date" | "clicks">("date")
  const [expiryDate, setExpiryDate] = useState(() => getLocalDateInputValue(new Date()))
  const [expiryTime, setExpiryTime] = useState("23:59")
  const [maxClicks, setMaxClicks] = useState("")

  // --- Submit -----------------------------------------------------------------
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const isDestinationValid =
    inputType === "url" ? isValidUrl(destinationUrl) : snippetContent.trim().length > 0

  const imagePresets = LINK_BACKGROUND_IMAGE_PRESETS
  const videoPresets = useMemo(
    () => businessConfig.presetLibrary.videos.filter((preset) => preset.enabled),
    [businessConfig.presetLibrary.videos],
  )
  const imageCategories = useMemo(
    () => ["All", ...Array.from(new Set(imagePresets.flatMap((preset) => preset.categories)))],
    [imagePresets],
  )
  const videoCategories = useMemo(
    () => ["All", ...Array.from(new Set(videoPresets.flatMap((preset) => preset.categories)))],
    [videoPresets],
  )
  const filteredImages = useMemo(
    () =>
      backgroundImageCategory === "All"
        ? imagePresets
        : imagePresets.filter((preset) => preset.categories.includes(backgroundImageCategory)),
    [imagePresets, backgroundImageCategory],
  )
  const filteredVideos = useMemo(
    () =>
      backgroundVideoCategory === "All"
        ? videoPresets
        : videoPresets.filter((preset) => preset.categories.includes(backgroundVideoCategory)),
    [videoPresets, backgroundVideoCategory],
  )

  const filteredPopularActions = useMemo(() => {
    if (actionCategory !== "all") {
      return popularActionOptions.filter(
        ({ platform }) => socialPlatforms[platform].category === actionCategory,
      )
    }
    return popularActionOptions
  }, [actionCategory])

  const filteredPlatforms = useMemo(() => {
    const query = actionSearch.trim().toLowerCase()
    return Object.entries(socialPlatforms).filter(([, platform]) => {
      const matchesCategory = actionCategory === "all" || platform.category === actionCategory
      if (!matchesCategory) return false
      if (!query) return true
      return (
        platform.name.toLowerCase().includes(query) ||
        platform.actions.some((action) => action.label.toLowerCase().includes(query))
      )
    })
  }, [actionCategory, actionSearch])

  function getActionIcon(platform: string, actionId: string) {
    const key = toPlatformKey(platform)
    const found = socialPlatforms[key].actions.find((item) => item.id === actionId)
    return found?.icon ?? socialPlatforms[key].icon
  }

  function getActionLabel(platform: string, actionId: string) {
    const key = toPlatformKey(platform)
    const found = socialPlatforms[key].actions.find((item) => item.id === actionId)
    return found?.label ?? actionId
  }

  function openActionPicker(existingActionId?: string) {
    setEditingActionId(existingActionId ?? null)
    setIsActionPickerOpen(true)
  }

  function commitActionSelection(platform: string, actionId: string) {
    const key = toPlatformKey(platform)
    if (editingActionId) {
      setActions((prev) =>
        prev.map((action) =>
          action.id === editingActionId
            ? { ...action, platform: key, action: actionId }
            : action,
        ),
      )
    } else {
      setActions((prev) => [
        ...prev,
        { id: makeActionId(), platform: key, action: actionId, url: "", isValid: false },
      ])
    }
    setIsActionPickerOpen(false)
    setEditingActionId(null)
  }

  function removeAction(id: string) {
    setActions((prev) => prev.filter((action) => action.id !== id))
  }

  function updateActionUrl(id: string, url: string) {
    setActions((prev) =>
      prev.map((action) => (action.id === id ? { ...action, url, isValid: isValidUrl(url) } : action)),
    )
  }

  function resetEffects() {
    setOpacity(DEFAULT_LINK_BACKGROUND_EFFECTS.opacity)
    setBlur(DEFAULT_LINK_BACKGROUND_EFFECTS.blur)
    setSaturation(DEFAULT_LINK_BACKGROUND_EFFECTS.saturation)
    setContrast(DEFAULT_LINK_BACKGROUND_EFFECTS.contrast)
    setGrayscale(DEFAULT_LINK_BACKGROUND_EFFECTS.grayscale)
  }

  function selectBackgroundImage(preset: (typeof imagePresets)[number]) {
    setSelectedBackgroundId(preset.id)
    setSelectedBackgroundName(preset.name)
    setBackgroundMediaType("image")
    setBackgroundMediaUrl(preset.imageUrl)
  }

  function selectBackgroundVideo(preset: (typeof videoPresets)[number]) {
    setSelectedBackgroundId(preset.id)
    setSelectedBackgroundName(preset.name)
    setBackgroundMediaType("video")
    setBackgroundMediaUrl(preset.videoUrl)
  }

  function useYouTubeBackground() {
    if (!getYouTubeEmbedUrl(youtubeBackgroundUrl)) return
    setSelectedBackgroundId(undefined)
    setSelectedBackgroundName("YouTube")
    setBackgroundMediaType("youtube")
    setBackgroundMediaUrl(youtubeBackgroundUrl)
  }

  function clearBackground() {
    setSelectedBackgroundId(undefined)
    setSelectedBackgroundName(undefined)
    setBackgroundMediaType(undefined)
    setBackgroundMediaUrl(undefined)
  }

  const youtubeEmbedUrl =
    backgroundMediaType === "youtube" && backgroundMediaUrl ? getYouTubeEmbedUrl(backgroundMediaUrl) : ""

  function buildDraft(): Omit<AnonymousLinkDraft, "createdAt"> {
    return {
      inputType,
      destinationUrl: inputType === "url" ? destinationUrl.trim() : undefined,
      snippetContent: inputType === "snippet" ? snippetContent : undefined,
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      customAlias: customAlias.trim() || undefined,
      actions: actions.map(({ platform, action, url }) => ({
        platform: String(platform),
        action,
        url,
      })),
      backgroundSettings: backgroundMediaUrl
        ? {
            selectedBackgroundId,
            selectedBackgroundName,
            backgroundMediaType,
            backgroundMediaUrl,
            effects: { opacity, blur, saturation, contrast, grayscale },
          }
        : undefined,
      expiryEnabled,
      expiryType,
      expiryDate: expiryEnabled && expiryType === "date" ? expiryDate : undefined,
      expiryTime: expiryEnabled && expiryType === "date" ? expiryTime : undefined,
      maxClicks: expiryEnabled && expiryType === "clicks" && maxClicks ? Number(maxClicks) : undefined,
    }
  }

  function handleSubmit() {
    setValidationAttempted(true)
    setSubmitError("")

    if (!isDestinationValid) {
      setSubmitError(
        inputType === "url"
          ? "Vui lòng nhập một đường dẫn hợp lệ (bắt đầu bằng http:// hoặc https://)."
          : "Vui lòng nhập nội dung văn bản bạn muốn khoá lại.",
      )
      return
    }

    const hasInvalidAction = actions.some((action) => !isValidUrl(action.url))
    if (hasInvalidAction) {
      setSubmitError("Vui lòng nhập URL hợp lệ cho mọi hành động đã thêm, hoặc xoá bớt hành động đó.")
      return
    }

    saveAnonymousDraft(buildDraft())
    const next = encodeURIComponent("/member/create?draft=1")
    router.push(`/register?callbackUrl=${next}`)
  }

  const nextParam = encodeURIComponent("/member/create?draft=1")

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] xl:items-start">
      {/* Left column — form */}
      <div className="min-w-0 space-y-4">
        {/* Destination */}
        <Card className="gap-0 overflow-hidden rounded-xl border-border bg-card py-0 shadow-none">
          <div className="space-y-4 px-4 py-4 sm:px-5">
            <Tabs value={inputType} onValueChange={(value) => setInputType(value as "url" | "snippet")} className="w-full min-w-0 !gap-0">
              <TabsList className="grid h-9 w-full grid-cols-2">
                <TabsTrigger value="url">
                  <LinkIcon className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">Đường dẫn</span>
                </TabsTrigger>
                <TabsTrigger value="snippet">
                  <MessageSquare className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">Văn bản</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="mt-4 space-y-3">
                <div>
                  <Input
                    aria-invalid={validationAttempted && !isDestinationValid && inputType === "url"}
                    placeholder="https://your-content-link.com"
                    value={destinationUrl}
                    onChange={(event) => setDestinationUrl(event.target.value)}
                    className={cn(
                      "text-foreground placeholder:text-muted-foreground",
                      validationAttempted && !isDestinationValid && inputType === "url" && "border-destructive",
                    )}
                  />
                  {validationAttempted && !isDestinationValid && inputType === "url" ? (
                    <p className="mt-1 text-sm text-destructive">Vui lòng nhập một đường dẫn hợp lệ.</p>
                  ) : null}
                </div>
                <Input
                  placeholder="Tiêu đề hiển thị cho người xem (không bắt buộc)"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="text-foreground placeholder:text-muted-foreground"
                />
              </TabsContent>

              <TabsContent value="snippet" className="mt-4 space-y-3">
                <div>
                  <Textarea
                    aria-invalid={validationAttempted && !isDestinationValid && inputType === "snippet"}
                    placeholder="Nhập đoạn văn bản bạn muốn khoá lại — mã giảm giá, hướng dẫn, ghi chú riêng..."
                    value={snippetContent}
                    onChange={(event) => setSnippetContent(event.target.value)}
                    rows={5}
                    className={cn(
                      "resize-none text-foreground placeholder:text-muted-foreground",
                      validationAttempted && !isDestinationValid && inputType === "snippet" && "border-destructive",
                    )}
                  />
                  {snippetContent ? (
                    <p className="mt-1 text-xs text-muted-foreground">{formatSnippetSize(snippetContent)}</p>
                  ) : null}
                  {validationAttempted && !isDestinationValid && inputType === "snippet" ? (
                    <p className="mt-1 text-sm text-destructive">Vui lòng nhập nội dung bạn muốn khoá lại.</p>
                  ) : null}
                </div>
                <Input
                  placeholder="Tiêu đề hiển thị cho người xem (không bắt buộc)"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="text-foreground placeholder:text-muted-foreground"
                />
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Actions */}
        <Card className="gap-0 overflow-hidden rounded-xl border-border bg-card py-0 shadow-none">
          <div className="space-y-1 px-4 py-3 sm:px-5">
            <SectionTriggerLabel
              icon={MousePointerClick}
              title="Hành động cần hoàn thành"
              description="Người xem phải làm những việc này trước khi được mở khoá."
            />
          </div>
          <div className="space-y-3 px-4 pt-0 pb-4 sm:px-5">
            {actions.map((action, index) => {
              const platform = socialPlatforms[action.platform]
              const Icon = getActionIcon(action.platform, action.action)
              const showError = !action.isValid && (validationAttempted || action.url.length > 0)

              return (
                <div key={action.id} className="space-y-2 rounded-lg border border-border bg-muted/15 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-2">
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">{index + 1}.</span>
                      <button
                        type="button"
                        onClick={() => openActionPicker(action.id)}
                        className="flex flex-1 items-center gap-2 rounded-md bg-muted px-3 py-2 text-left text-foreground transition-colors hover:bg-accent"
                      >
                        <Icon className={cn("size-4", getPlatformIconClass(action.platform))} />
                        <span className="text-sm">{getActionLabel(action.platform, action.action)}</span>
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div>
                    <Input
                      placeholder={`Nhập URL ${platform.name.toLowerCase()}...`}
                      value={action.url}
                      onChange={(event) => updateActionUrl(action.id, event.target.value)}
                      className={cn(
                        "text-foreground placeholder:text-muted-foreground",
                        showError && "border-destructive",
                      )}
                    />
                    {showError ? (
                      <p className="mt-1 text-sm text-destructive">
                        {action.url.trim() ? "URL không hợp lệ." : "Vui lòng nhập URL cho hành động này."}
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            })}

            <Button
              type="button"
              variant="outline"
              onClick={() => openActionPicker()}
              className="h-10 w-full rounded-lg border-dashed"
            >
              <Plus className="size-4" />
              Thêm hành động
            </Button>
          </div>
        </Card>

        {/* Action picker modal */}
        <ResponsiveDialog open={isActionPickerOpen} onOpenChange={setIsActionPickerOpen}>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>{editingActionId ? "Đổi hành động" : "Thêm hành động"}</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody className="max-h-[65dvh] space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={actionSearch}
                  onChange={(event) => setActionSearch(event.target.value)}
                  placeholder="Tìm nền tảng hoặc hành động..."
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {actionCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActionCategory(category)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition",
                      actionCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {category === "all" ? "Tất cả" : category}
                  </button>
                ))}
              </div>

              {filteredPopularActions.length > 0 && !actionSearch ? (
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 bg-muted/25 p-3">
                    <Sparkles className="size-4 text-primary" />
                    <span className="text-sm font-medium">Phổ biến</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/15 p-3">
                    {filteredPopularActions.map(({ platform, action }) => {
                      const PlatformIcon = socialPlatforms[platform].icon
                      return (
                        <Button
                          key={`${platform}-${action.id}`}
                          type="button"
                          size="sm"
                          onClick={() => commitActionSelection(platform, action.id)}
                          className={cn(socialPlatforms[platform].color, "max-w-full shrink-0 text-sm text-white hover:opacity-80")}
                        >
                          <PlatformIcon className="mr-1 size-4" />
                          {action.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                {filteredPlatforms.map(([key, platform]) => (
                  <div key={key} className="overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center gap-2 bg-muted/20 px-3 py-2">
                      <platform.icon className={cn("size-4", getPlatformIconClass(key))} />
                      <span className="text-sm font-medium text-foreground">{platform.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {platform.actions.map((action) => (
                        <Button
                          key={action.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => commitActionSelection(key, action.id)}
                          className="text-xs"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredPlatforms.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Không tìm thấy nền tảng phù hợp.</p>
                ) : null}
              </div>
            </ResponsiveDialogBody>
          </ResponsiveDialogContent>
        </ResponsiveDialog>

        {/* Layout */}
        <Collapsible open={layoutOpen} onOpenChange={setLayoutOpen}>
          <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/20 hover:bg-muted/20">
            <SectionTriggerLabel
              icon={PanelsTopLeft}
              title="Giao diện nền"
              description="Chọn ảnh, video hoặc nhúng YouTube làm nền cho trang mở khoá."
            />
            {layoutOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-4 rounded-lg border border-border bg-card p-4">
            {backgroundMediaUrl ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                <span className="truncate text-sm text-foreground">{selectedBackgroundName ?? "Nền đã chọn"}</span>
                <Button variant="ghost" size="sm" onClick={clearBackground} className="text-muted-foreground hover:text-destructive">
                  <X className="size-4" />
                  Bỏ chọn
                </Button>
              </div>
            ) : null}

            <Tabs defaultValue="images" className="w-full">
              <TabsList variant="line">
                <TabsTrigger value="images">Hình ảnh</TabsTrigger>
                <TabsTrigger value="videos">Video</TabsTrigger>
                <TabsTrigger value="embed">Nhúng YouTube</TabsTrigger>
              </TabsList>

              <TabsContent value="images">
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {imageCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setBackgroundImageCategory(category)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold transition",
                          backgroundImageCategory === category
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <div className="grid max-h-90 grid-cols-2 gap-3 overflow-y-auto pr-2 sm:grid-cols-3 lg:grid-cols-4">
                    {filteredImages.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectBackgroundImage(preset)}
                        title={preset.name}
                        className={cn(
                          "relative aspect-square w-full overflow-hidden rounded-lg transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selectedBackgroundId === preset.id ? "ring-2 ring-primary" : "hover:scale-105",
                        )}
                      >
                        <Image
                          src={preset.imageUrl}
                          alt={preset.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
                        <span className="absolute inset-x-0 bottom-0 p-2 text-left">
                          <span className="inline-flex rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                            {preset.name}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="videos">
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {videoCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setBackgroundVideoCategory(category)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold transition",
                          backgroundVideoCategory === category
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <div className="grid max-h-90 grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
                    {filteredVideos.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectBackgroundVideo(preset)}
                        title={preset.name}
                        className={cn(
                          "group relative aspect-video overflow-hidden rounded-lg text-left transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selectedBackgroundId === preset.id ? "ring-2 ring-primary" : "hover:scale-[1.02]",
                        )}
                      >
                        <video
                          src={preset.videoUrl}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          onMouseEnter={(event) => void event.currentTarget.play()}
                          onMouseLeave={(event) => event.currentTarget.pause()}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800">
                            <PlayCircle className="size-3" />
                            {preset.source}
                          </span>
                          <p className="mt-1 text-sm font-bold text-white">{preset.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="embed">
                <div className="space-y-3 rounded-lg border border-border bg-muted/15 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={youtubeBackgroundUrl}
                      onChange={(event) => setYoutubeBackgroundUrl(event.target.value)}
                      placeholder="Dán link video YouTube..."
                    />
                    <Button type="button" onClick={useYouTubeBackground} className="h-10 px-4 font-medium shadow-none">
                      Dùng video này
                    </Button>
                  </div>
                  {youtubeBackgroundUrl && !getYouTubeEmbedUrl(youtubeBackgroundUrl) ? (
                    <p className="text-sm font-medium text-destructive">Link YouTube không hợp lệ.</p>
                  ) : null}
                </div>
              </TabsContent>
            </Tabs>

            <div className="border-t border-border pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Hiệu ứng</h4>
                <Button variant="ghost" size="sm" onClick={resetEffects} className="h-6 text-xs text-primary hover:text-primary">
                  Đặt lại
                </Button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Độ trong suốt", value: opacity, setValue: setOpacity, min: 0, max: 100, unit: "%" },
                  { label: "Độ mờ", value: blur, setValue: setBlur, min: 0, max: 100, unit: "px" },
                  { label: "Độ bão hoà", value: saturation, setValue: setSaturation, min: 0, max: 200, unit: "%" },
                  { label: "Độ tương phản", value: contrast, setValue: setContrast, min: 0, max: 200, unit: "%" },
                  { label: "Đen trắng", value: grayscale, setValue: setGrayscale, min: 0, max: 100, unit: "%" },
                ].map((slider) => (
                  <div key={slider.label}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">{slider.label}</label>
                      <span className="text-sm text-muted-foreground">
                        {slider.value}
                        {slider.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      value={slider.value}
                      onChange={(event) => slider.setValue(Number(event.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Extra options */}
        <Collapsible open={extraOptionsOpen} onOpenChange={setExtraOptionsOpen}>
          <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/20 hover:bg-muted/20">
            <SectionTriggerLabel
              icon={SlidersHorizontal}
              title="Tuỳ chọn thêm"
              description="Phụ đề, alias riêng cho link của bạn."
            />
            {extraOptionsOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-4 rounded-lg border border-border bg-card p-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Phụ đề</label>
              <Input
                placeholder="Một dòng mô tả ngắn cho người xem"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Alias tuỳ chỉnh</label>
              <div className={`${MEMBER_FIELD_SHELL} px-3`}>
                <span className="shrink-0 text-muted-foreground">
                  {`${linkSettings.publicDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")}${linkPath(linkSettings, "social", "")}`}
                </span>
                <Input
                  placeholder="ten-link-cua-ban"
                  value={customAlias}
                  onChange={(event) => {
                    const source = linkSettings.aliasCaseSensitive
                      ? event.target.value
                      : event.target.value.toLowerCase()
                    const next = source
                      .replace(/[^a-zA-Z0-9_-]+/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/^-+/, "")
                    setCustomAlias(next)
                  }}
                  className={MEMBER_FIELD_BARE}
                />
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Chúng tôi sẽ kiểm tra alias này ngay khi bạn đăng nhập để tạo link — nếu đã có người dùng, bạn sẽ được đổi tên trước khi xuất bản.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/15 p-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-5 text-muted-foreground">
                Ảnh bìa và tải tệp lên trực tiếp cần một tài khoản Link4Sub để lưu trữ an toàn — hai tính năng này sẽ mở khoá ngay sau khi bạn đăng nhập.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Expiry */}
        <Collapsible open={expiresOpen} onOpenChange={setExpiresOpen}>
          <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/20 hover:bg-muted/20">
            <SectionTriggerLabel
              icon={CalendarClock}
              title="Hết hạn"
              description="Tự động khoá link sau một mốc thời gian hoặc số lượt bấm."
            />
            {expiresOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExpiryEnabled((value) => !value)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  expiryEnabled ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    expiryEnabled ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </button>
              <span className="text-sm text-muted-foreground">Bật hết hạn cho link này</span>
            </div>

            {expiryEnabled ? (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpiryType("date")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 transition-colors",
                      expiryType === "date"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    Theo ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryType("clicks")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 transition-colors",
                      expiryType === "clicks"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    Theo số lượt bấm
                  </button>
                </div>

                {expiryType === "date" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(event) => setExpiryDate(event.target.value)}
                    />
                    <Input
                      type="time"
                      value={expiryTime}
                      onChange={(event) => setExpiryTime(event.target.value)}
                    />
                  </div>
                ) : (
                  <Input
                    type="number"
                    min="1"
                    placeholder="Số lượt bấm tối đa"
                    value={maxClicks}
                    onChange={(event) => setMaxClicks(event.target.value)}
                  />
                )}
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Right column — live preview + publish */}
      <div className="min-w-0 space-y-3 xl:sticky xl:top-24 xl:self-start">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Xem trước</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Đây là những gì người xem sẽ thấy.</p>
        </div>

        <Card className="relative z-10 min-h-[420px] overflow-hidden rounded-xl border-border bg-slate-100 p-4 shadow-none dark:bg-[#010102] sm:p-5 lg:min-h-[520px]">
          {backgroundMediaType === "video" && backgroundMediaUrl ? (
            <video
              src={backgroundMediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{
                filter: `opacity(${opacity / 100}) blur(${blur}px) saturate(${saturation / 100}) contrast(${contrast / 100}) grayscale(${grayscale / 100})`,
              }}
            />
          ) : backgroundMediaType === "youtube" && youtubeEmbedUrl ? (
            <iframe
              src={youtubeEmbedUrl}
              title="YouTube background"
              allow="autoplay; encrypted-media; picture-in-picture"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[266%] -translate-x-1/2 -translate-y-1/2 sm:h-[130%] sm:w-[231%]"
              style={{
                filter: `opacity(${opacity / 100}) blur(${blur}px) saturate(${saturation / 100}) contrast(${contrast / 100}) grayscale(${grayscale / 100})`,
              }}
            />
          ) : (
            <div
              className="pointer-events-none absolute inset-0 bg-slate-100 dark:bg-[#010102]"
              style={{
                backgroundImage: backgroundMediaUrl ? `url(${backgroundMediaUrl})` : "none",
                backgroundSize: backgroundMediaUrl ? "cover" : "auto",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: `opacity(${opacity / 100}) blur(${blur}px) saturate(${saturation / 100}) contrast(${contrast / 100}) grayscale(${grayscale / 100})`,
              }}
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-white/70 dark:bg-black/70" />

          <Card className="relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-5 text-left text-slate-950 shadow-none backdrop-blur-md dark:border-white/10 dark:bg-[#0f1011]/95 dark:text-[#f7f8f8]">
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-[#f7f8f8]">
              {title || "Mở khoá link"}
            </h3>
            <p className="text-sm leading-6 text-slate-600 dark:text-[#8a8f98]">
              {subtitle || "Hoàn thành các bước bên dưới để mở khoá"}
            </p>

            {inputType === "snippet" && snippetContent ? (
              <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left dark:border-white/10 dark:bg-[#010102]">
                <div className="relative h-20 overflow-hidden px-3 py-2.5">
                  <pre className="select-none whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-600 blur-[3px] dark:text-[#8a8f98]">
                    {snippetContent}
                  </pre>
                  <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-[1px] dark:bg-[#010102]/60">
                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-[#141516] dark:text-[#8a8f98]">
                      Nội dung đã khoá
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {actions.length > 0 ? (
              <div className="w-full space-y-2 overflow-hidden">
                {actions.map((action) => {
                  const platform = socialPlatforms[action.platform]
                  const Icon = getActionIcon(action.platform, action.action)
                  return (
                    <div
                      key={action.id}
                      className={cn(
                        "flex max-h-11 w-full items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-white transition-all",
                        platform.color,
                        action.isValid ? "opacity-100" : "cursor-not-allowed opacity-60 brightness-75",
                      )}
                    >
                      <Icon className="size-4" />
                      <span className="min-w-0 truncate text-sm font-medium">
                        {getActionLabel(action.platform, action.action)}
                      </span>
                      <ExternalLink className={cn("size-3.5 shrink-0", action.isValid ? "text-white/80" : "text-white/50")} />
                    </div>
                  )
                })}
              </div>
            ) : null}

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-[#8a8f98]">
              <span>0/{actions.length} đã hoàn thành</span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#23252a]">
              <div className="h-1.5 rounded-full bg-primary transition-all duration-300" style={{ width: "0%" }} />
            </div>

            <Button
              type="button"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-100 font-medium text-slate-400 shadow-none disabled:opacity-100 dark:border-white/10 dark:bg-[#18191a] dark:text-[#62666d]"
              disabled
            >
              <Lock />
              {inputType === "snippet" ? "Xem nội dung" : "Mở khoá link"}
            </Button>
          </Card>
        </Card>

        {submitError ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            {submitError}
          </div>
        ) : null}

        <Button onClick={handleSubmit} className="h-11 w-full rounded-lg text-base font-medium shadow-none">
          Tạo link miễn phí
        </Button>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          Chúng tôi lưu tạm nội dung này và đưa bạn qua bước tạo tài khoản (mất chưa đầy 1 phút) để xuất bản.
          Đã có tài khoản?{" "}
          <a href={`/login?callbackUrl=${nextParam}`} className="font-medium text-primary underline-offset-4 hover:underline">
            Đăng nhập
          </a>
          .
        </p>
      </div>
    </div>
  )
}
