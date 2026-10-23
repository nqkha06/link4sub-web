"use client"

import { useEffect, useRef, useState } from "react"
import { Blend, Check, ChevronLeft, ChevronRight, Clapperboard, History, ImageIcon, Loader2, MousePointer2, PaintBucket, Pencil, Plus, Redo2, RotateCcw, Undo2, X } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DEFAULT_BIO_DESIGN,
  bioCursorTrailTypes,
  isBioBuiltinAssetId,
  type BioCursorTrailType,
  type BioDesign,
  type BioHorizontalAlign,
} from "@/contracts"
import { BIO_DESIGN_TEMPLATES, type BioDesignTemplate } from "./bio-design-templates"
import { cn } from "@/lib/utils"

import { AudioManagerField, type UploadedAudio } from "./audio-manager-dialog"
import { BackgroundEffectPicker } from "./background-effect-picker"
import { ColorPickerInput } from "./color-picker-field"
import { FontFamilyPicker } from "./font-family-picker"
import { MediaAssetTile } from "./media-asset-tile"
import { UsernameEffectPicker } from "./username-effect-picker"

type DesignSection = keyof Pick<BioDesign, "profile" | "background" | "appearance" | "effects" | "audio">

const BACKGROUND_TYPE_TABS = [
  { type: "color", icon: PaintBucket },
  { type: "gradient", icon: Blend },
  { type: "image", icon: ImageIcon },
  { type: "video", icon: Clapperboard },
] as const satisfies ReadonlyArray<{ type: BioDesign["background"]["type"]; icon: unknown }>

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

function RangeField({
  label, value, min, max, step = 1, unit = "", onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <Slider className="flex-1" value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} />
        <span className="min-w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-[11px] tabular-nums text-muted-foreground">
          {value}{unit}
        </span>
      </div>
    </Field>
  )
}

function ToggleField({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background px-3 py-2.5">
      <span>
        <span className="block text-xs font-medium text-foreground">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <ColorPickerInput value={value} onChange={onChange} />
    </Field>
  )
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}


const TEMPLATES_PER_PAGE = 6

/** Số trang hiển thị: 1 … 4 5 6 … 19 (luôn có trang đầu/cuối và 1 trang mỗi bên trang hiện tại). */
function getPageItems(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  const items: Array<number | "…"> = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("…")
    items.push(page)
  })
  return items
}

const DESIGN_SECTIONS: DesignSection[] = ["profile", "background", "appearance", "effects", "audio"]
const TEMPLATE_STEPS = ["background", "colors", "effects", "media"] as const
const TEMPLATE_STEP_MS = 380

/** Tải trước video nền của template (tối đa 4 giây) để xem trước có hình ngay khi áp dụng. */
function preloadVideo(url: string | null) {
  if (!url) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const video = document.createElement("video")
    const done = () => {
      window.clearTimeout(timer)
      video.removeAttribute("src")
      video.load()
      resolve()
    }
    const timer = window.setTimeout(done, 4000)
    video.muted = true
    video.preload = "auto"
    video.addEventListener("canplay", done, { once: true })
    video.addEventListener("error", done, { once: true })
    video.src = url
  })
}

export function BioDesignStudio({
  value,
  onChange,
  onPickBackgroundAsset,
  onPickMusicAsset,
  musicTrackUrls,
  onUploadMusic,
  onMusicTrackUploaded,
  onPickCursorAsset,
  cursorPreviewUrl,
  backgroundPreviewUrls,
  cursorProcessing = false,
  previewName = "",
  onTemplateApplied,
}: {
  previewName?: string
  /** Gọi sau khi một template được áp dụng (trang xem trước phát lại hiệu ứng xuất hiện). */
  onTemplateApplied?: () => void
  value: BioDesign
  onChange: (value: BioDesign) => void
  onPickBackgroundAsset?: (kind: "image" | "video") => void
  onPickMusicAsset?: () => void
  /** URL nghe thử của các bài nhạc (theo assetId). */
  musicTrackUrls?: Record<string, string | undefined>
  onUploadMusic?: (file: File, onProgress: (value: number) => void) => Promise<UploadedAudio>
  onMusicTrackUploaded?: (assetId: string, url: string | undefined) => void
  /** Mở thư viện ảnh để chọn ảnh con trỏ. */
  onPickCursorAsset?: () => void
  /** URL ảnh con trỏ đang dùng (để xem trước trong panel Con trỏ). */
  cursorPreviewUrl?: string
  /** URL ảnh / video nền đang dùng (xem trước trong Background Source). */
  backgroundPreviewUrls?: { image?: string; video?: string }
  /** Đang thu nhỏ / tải ảnh con trỏ. */
  cursorProcessing?: boolean
}) {
  const t = useTranslations("BioStudio")
  const historyRef = useRef<BioDesign[]>([value])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [historyLength, setHistoryLength] = useState(1)

  const commit = (next: BioDesign) => {
    const history = [...historyRef.current.slice(0, historyIndex + 1), next].slice(-50)
    historyRef.current = history
    setHistoryIndex(history.length - 1)
    setHistoryLength(history.length)
    onChange(next)
  }
  const undo = () => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    setHistoryIndex(nextIndex)
    onChange(historyRef.current[nextIndex])
  }
  const redo = () => {
    if (historyIndex >= historyRef.current.length - 1) return
    const nextIndex = historyIndex + 1
    setHistoryIndex(nextIndex)
    onChange(historyRef.current[nextIndex])
  }
  /* ------------------------------------------------------------ Template */
  const [activeTab, setActiveTab] = useState<string>("profile")
  /** Phân trang tab Templates: chỉ render (và tải ảnh) TEMPLATES_PER_PAGE mẫu mỗi lần. */
  const [templatePage, setTemplatePage] = useState(1)
  const templatePageCount = Math.max(1, Math.ceil(BIO_DESIGN_TEMPLATES.length / TEMPLATES_PER_PAGE))
  const currentTemplatePage = Math.min(templatePage, templatePageCount)
  const visibleTemplates = BIO_DESIGN_TEMPLATES.slice((currentTemplatePage - 1) * TEMPLATES_PER_PAGE, currentTemplatePage * TEMPLATES_PER_PAGE)
  const templateGridRef = useRef<HTMLDivElement>(null)
  const goToTemplatePage = (page: number) => {
    const next = Math.min(templatePageCount, Math.max(1, page))
    if (next === currentTemplatePage) return
    setTemplatePage(next)
    // Sau khi trang mới render: cuộn lên đầu danh sách mẫu (nhất là trên điện thoại, nút
    // phân trang nằm cuối danh sách). scroll-margin của lưới chừa chỗ cho header dính.
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      templateGridRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" })
    })
  }
  /** Các tab có thiết lập vừa được template thay đổi (chấm nhỏ trên tab, mất khi mở tab). */
  const [changedTabs, setChangedTabs] = useState<DesignSection[]>([])
  const [applying, setApplying] = useState<{ id: string; step: number } | null>(null)
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null)
  const applyTimers = useRef<number[]>([])
  useEffect(() => () => applyTimers.current.forEach((timer) => window.clearTimeout(timer)), [])

  const applyTemplate = (template: BioDesignTemplate) => {
    if (applying) return
    const before = value
    setApplying({ id: template.id, step: 0 })
    // Các bước hiển thị (giả lập) chạy song song với việc tải trước video nền thật.
    TEMPLATE_STEPS.forEach((_, index) => {
      applyTimers.current.push(window.setTimeout(() => setApplying({ id: template.id, step: index }), index * TEMPLATE_STEP_MS))
    })
    const minimum = new Promise<void>((resolve) => { applyTimers.current.push(window.setTimeout(resolve, TEMPLATE_STEPS.length * TEMPLATE_STEP_MS)) })
    void Promise.all([minimum, preloadVideo(template.videoUrl)]).then(() => {
      const next = template.apply(before)
      commit(next)
      setChangedTabs(DESIGN_SECTIONS.filter((section) => JSON.stringify(before[section]) !== JSON.stringify(next[section])))
      setApplying(null)
      setAppliedTemplateId(template.id)
      onTemplateApplied?.()
      toast.success(t("templateApplied", { name: template.name }), {
        description: t("templateAppliedHint"),
        action: { label: t("templateUndo"), onClick: () => { commit(before); setAppliedTemplateId(null); setChangedTabs([]) } },
      })
    })
  }

  const resetSection = (section: DesignSection) => commit({ ...value, [section]: DEFAULT_BIO_DESIGN[section] })

  const sectionHeader = (section: DesignSection, label: string) => (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Button type="button" variant="ghost" size="sm" onClick={() => resetSection(section)} className="h-8 gap-1.5 px-2 text-xs text-muted-foreground">
        <RotateCcw className="size-3.5" /> {t("resetSection")}
      </Button>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><History className="size-4" /> {t("history")}</span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={undo} disabled={historyIndex <= 0} aria-label={t("undo")}><Undo2 className="size-4" /></Button>
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={redo} disabled={historyIndex >= historyLength - 1} aria-label={t("redo")}><Redo2 className="size-4" /></Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); setChangedTabs((current) => current.filter((item) => item !== tab)) }} className="gap-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-muted/60 p-1">
          {(["profile", "background", "appearance", "effects", "audio", "templates"] as const).map((id) => (
            <TabsTrigger key={id} value={id} className="relative shrink-0 px-3">
              {t(`tabs.${id}`)}
              {(changedTabs as string[]).includes(id) ? <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" aria-label={t("templateChangedTab")} /> : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {sectionHeader("profile", t("profileDescription"))}
          <Panel title={t("profileLayout")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("layout")}>
                <Select value={value.profile.layoutMode} onValueChange={(layoutMode) => commit({ ...value, profile: { ...value.profile, layoutMode: layoutMode as BioDesign["profile"]["layoutMode"] } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="classic">Classic</SelectItem><SelectItem value="modern">Modern</SelectItem><SelectItem value="compact">Compact</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label={t("horizontalAlign")}>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                  {(["left", "center", "right"] as BioHorizontalAlign[]).map((align) => <button key={align} type="button" onClick={() => commit({ ...value, profile: { ...value.profile, horizontalAlign: align } })} className={cn("rounded-md px-2 py-1.5 text-xs capitalize", value.profile.horizontalAlign === align ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground")}>{align}</button>)}
                </div>
              </Field>
            </div>
            <RangeField label={t("maxWidth")} value={value.profile.maxWidth} min={320} max={960} unit="px" onChange={(maxWidth) => commit({ ...value, profile: { ...value.profile, maxWidth } })} />
            <div className="grid gap-4 sm:grid-cols-2"><RangeField label={t("padding")} value={value.profile.padding} min={0} max={64} unit="px" onChange={(padding) => commit({ ...value, profile: { ...value.profile, padding } })} /><RangeField label={t("contentGap")} value={value.profile.contentGap} min={0} max={48} unit="px" onChange={(contentGap) => commit({ ...value, profile: { ...value.profile, contentGap } })} /></div>
          </Panel>

          <Panel title={t("profileCard")} description={t("profileCardHint")}>
            <ToggleField label={t("cardEnabled")} checked={value.profile.card.enabled} onChange={(enabled) => commit({ ...value, profile: { ...value.profile, card: { ...value.profile.card, enabled } } })} />
            {value.profile.card.enabled ? <div className="space-y-4 border-l-2 border-border pl-4"><div className="grid gap-4 sm:grid-cols-2"><ColorField label={t("backgroundColor")} value={value.profile.card.backgroundColor} onChange={(backgroundColor) => commit({ ...value, profile: { ...value.profile, card: { ...value.profile.card, backgroundColor } } })} /><RangeField label={t("opacity")} value={value.profile.card.backgroundOpacity} min={0} max={100} unit="%" onChange={(backgroundOpacity) => commit({ ...value, profile: { ...value.profile, card: { ...value.profile.card, backgroundOpacity } } })} /></div><RangeField label={t("backdropBlur")} value={value.profile.card.backdropBlur} min={0} max={40} unit="px" onChange={(backdropBlur) => commit({ ...value, profile: { ...value.profile, card: { ...value.profile.card, backdropBlur } } })} /><RangeField label={t("radius")} value={value.profile.card.borderRadius} min={0} max={48} unit="px" onChange={(borderRadius) => commit({ ...value, profile: { ...value.profile, card: { ...value.profile.card, borderRadius } } })} /><ToggleField label={t("borderEnabled")} checked={value.profile.card.borderEnabled} onChange={(borderEnabled) => commit({ ...value, profile: { ...value.profile, card: { ...value.profile.card, borderEnabled } } })} /><ToggleField label={t("cardGradient")} hint={t("cardGradientHint")} checked={value.profile.card.gradientEnabled} onChange={(gradientEnabled) => commit({ ...value, profile: { ...value.profile, card: { ...value.profile.card, gradientEnabled } } })} />{value.profile.card.gradientEnabled ? <div className="grid gap-4 sm:grid-cols-2"><ColorField label={t("gradientFrom")} value={value.profile.card.gradientFrom} onChange={(gradientFrom) => commit({ ...value, profile: { ...value.profile, card: { ...value.profile.card, gradientFrom } } })} /><ColorField label={t("gradientTo")} value={value.profile.card.gradientTo} onChange={(gradientTo) => commit({ ...value, profile: { ...value.profile, card: { ...value.profile.card, gradientTo } } })} /></div> : null}</div> : null}
          </Panel>

          <Panel title={t("avatarDisplay")}>
            <div className="grid gap-4 sm:grid-cols-2"><RangeField label={t("avatarSize")} value={value.profile.avatar.size} min={32} max={180} unit="px" onChange={(size) => commit({ ...value, profile: { ...value.profile, avatar: { ...value.profile.avatar, size } } })} /><Field label={t("shape")}><Select value={value.profile.avatar.shape} onValueChange={(shape) => commit({ ...value, profile: { ...value.profile, avatar: { ...value.profile.avatar, shape: shape as BioDesign["profile"]["avatar"]["shape"] } } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="circle">Circle</SelectItem><SelectItem value="rounded">Rounded</SelectItem><SelectItem value="square">Square</SelectItem></SelectContent></Select></Field></div>
            <ToggleField label={t("showAvatar")} checked={value.profile.display.showAvatar} onChange={(showAvatar) => commit({ ...value, profile: { ...value.profile, display: { ...value.profile.display, showAvatar } } })} />
            <ToggleField label={t("showDescription")} checked={value.profile.display.showDescription} onChange={(showDescription) => commit({ ...value, profile: { ...value.profile, display: { ...value.profile.display, showDescription } } })} />
          </Panel>
        </TabsContent>

        <TabsContent value="background" className="space-y-4">
          {sectionHeader("background", t("backgroundDescription"))}
          <Panel title={t("backgroundSource")}>
            <Field label={t("backgroundType")}>
              <Tabs value={value.background.type} onValueChange={(type) => commit({ ...value, background: { ...value.background, type: type as BioDesign["background"]["type"] } })}>
                <TabsList className="grid h-auto w-full grid-cols-4 rounded-xl bg-muted/60 p-1">
                  {BACKGROUND_TYPE_TABS.map(({ type, icon: Icon }) => (
                    <TabsTrigger key={type} value={type} className="h-9 gap-1.5 rounded-lg px-1.5 text-xs">
                      <Icon className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{t(`backgroundTypes.${type}`)}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </Field>
            {value.background.type === "color" ? <ColorField label={t("backgroundColor")} value={value.background.color} onChange={(color) => commit({ ...value, background: { ...value.background, color } })} /> : null}
            {value.background.type === "gradient" ? <div className="grid gap-4 sm:grid-cols-2"><ColorField label="Gradient From" value={value.background.gradientFrom} onChange={(gradientFrom) => commit({ ...value, background: { ...value.background, gradientFrom } })} /><ColorField label="Gradient To" value={value.background.gradientTo} onChange={(gradientTo) => commit({ ...value, background: { ...value.background, gradientTo } })} /><RangeField label="Góc" value={value.background.gradientAngle} min={0} max={360} unit="°" onChange={(gradientAngle) => commit({ ...value, background: { ...value.background, gradientAngle } })} /></div> : null}
            {value.background.type === "image" ? (
              <MediaAssetTile
                kind="image"
                url={backgroundPreviewUrls?.image}
                hasAsset={Boolean(value.background.imageAssetId)}
                chooseLabel={t("chooseImage")}
                changeLabel={t("changeImage")}
                removeLabel={t("removeBackgroundMedia")}
                onPick={() => onPickBackgroundAsset?.("image")}
                onRemove={() => commit({ ...value, background: { ...value.background, imageAssetId: null } })}
                note={isBioBuiltinAssetId(value.background.imageAssetId) ? t("templateAsset") : undefined}
              />
            ) : null}
            {value.background.type === "video" ? (
              <MediaAssetTile
                kind="video"
                url={backgroundPreviewUrls?.video}
                hasAsset={Boolean(value.background.videoAssetId)}
                chooseLabel={t("chooseVideo")}
                changeLabel={t("changeVideo")}
                removeLabel={t("removeBackgroundMedia")}
                onPick={() => onPickBackgroundAsset?.("video")}
                onRemove={() => commit({ ...value, background: { ...value.background, videoAssetId: null } })}
                note={isBioBuiltinAssetId(value.background.videoAssetId) ? t("templateAsset") : undefined}
              />
            ) : null}
          </Panel>
          <Panel title={t("overlayFilters")}>
            <ToggleField label={t("overlayEnabled")} checked={value.background.overlay.enabled} onChange={(enabled) => commit({ ...value, background: { ...value.background, overlay: { ...value.background.overlay, enabled } } })} />
            {value.background.overlay.enabled ? <div className="grid gap-4 border-l-2 border-border pl-4 sm:grid-cols-2"><ColorField label={t("overlayColor")} value={value.background.overlay.color} onChange={(color) => commit({ ...value, background: { ...value.background, overlay: { ...value.background.overlay, color } } })} /><RangeField label={t("overlayOpacity")} value={value.background.overlay.opacity} min={0} max={100} unit="%" onChange={(opacity) => commit({ ...value, background: { ...value.background, overlay: { ...value.background.overlay, opacity } } })} /></div> : null}
            <RangeField label="Blur" value={value.background.filter.blur} min={0} max={40} unit="px" onChange={(blur) => commit({ ...value, background: { ...value.background, filter: { ...value.background.filter, blur } } })} />
            <RangeField label="Brightness" value={value.background.filter.brightness} min={0} max={200} unit="%" onChange={(brightness) => commit({ ...value, background: { ...value.background, filter: { ...value.background.filter, brightness } } })} />
          </Panel>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          {sectionHeader("appearance", t("appearanceDescription"))}
          <Panel title={t("themeColors")}><div className="grid gap-4 sm:grid-cols-2">{(["primary", "secondary", "accent", "text", "textMuted", "icon", "link", "surface", "border", "success"] as const).map((key) => <ColorField key={key} label={key} value={value.appearance.colors[key]} onChange={(color) => commit({ ...value, appearance: { ...value.appearance, colors: { ...value.appearance.colors, [key]: color } } })} />)}</div></Panel>
          <Panel title={t("typography")}><div className="grid gap-4 sm:grid-cols-2"><Field label={t("fontFamily")}><FontFamilyPicker value={value.appearance.font.family} onChange={(family) => commit({ ...value, appearance: { ...value.appearance, font: { ...value.appearance.font, family, usernameFamily: family } } })} /></Field><RangeField label={t("usernameSize")} value={value.appearance.font.usernameSize} min={16} max={72} unit="px" onChange={(usernameSize) => commit({ ...value, appearance: { ...value.appearance, font: { ...value.appearance.font, usernameSize } } })} /></div></Panel>
          <Panel title={t("linksAppearance")}><div className="grid gap-4 sm:grid-cols-2"><Field label={t("variant")}><Select value={value.appearance.links.variant} onValueChange={(variant) => commit({ ...value, appearance: { ...value.appearance, links: { ...value.appearance.links, variant: variant as BioDesign["appearance"]["links"]["variant"] } } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["card", "button", "outline", "minimal", "glass"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><RangeField label={t("radius")} value={value.appearance.links.radius} min={0} max={40} unit="px" onChange={(radius) => commit({ ...value, appearance: { ...value.appearance, links: { ...value.appearance.links, radius } } })} /></div><div className="grid gap-4 sm:grid-cols-2"><ColorField label={t("linkBackground")} value={value.appearance.links.backgroundColor} onChange={(backgroundColor) => commit({ ...value, appearance: { ...value.appearance, links: { ...value.appearance.links, backgroundColor } } })} /><ColorField label={t("textColor")} value={value.appearance.links.textColor} onChange={(textColor) => commit({ ...value, appearance: { ...value.appearance, links: { ...value.appearance.links, textColor } } })} /></div></Panel>
        </TabsContent>

        <TabsContent value="effects" className="space-y-4">
          {sectionHeader("effects", t("effectsDescription"))}
          <Panel title={t("backgroundEffects")}><BackgroundEffectPicker value={value.effects.background} onChange={(type) => commit({ ...value, effects: { ...value.effects, background: { ...value.effects.background, type } } })} />{value.effects.background.type !== "none" ? <div className="space-y-4 border-l-2 border-border pl-4"><ColorField label={t("effectColor")} value={value.effects.background.color} onChange={(color) => commit({ ...value, effects: { ...value.effects, background: { ...value.effects.background, color } } })} /><RangeField label={t("opacity")} value={value.effects.background.opacity} min={0} max={100} unit="%" onChange={(opacity) => commit({ ...value, effects: { ...value.effects, background: { ...value.effects.background, opacity } } })} /><RangeField label={t("intensity")} value={value.effects.background.intensity} min={0} max={100} unit="%" onChange={(intensity) => commit({ ...value, effects: { ...value.effects, background: { ...value.effects.background, intensity } } })} /></div> : null}</Panel>
          <Panel title={t("nameEffects.title")}>
            <UsernameEffectPicker
              value={value.effects.username.type}
              name={previewName}
              fontFamily={value.appearance.font.usernameFamily}
              previewStyle={{
                backgroundColor: value.profile.card.enabled ? `color-mix(in srgb, ${value.profile.card.backgroundColor} ${value.profile.card.backgroundOpacity}%, transparent)` : "transparent",
                color: value.appearance.colors.text,
                fontWeight: value.appearance.font.usernameWeight,
              }}
              onChange={(type) => commit({ ...value, effects: { ...value.effects, username: { ...value.effects.username, type } } })}
            />
          </Panel>
          <Panel title={t("glow.title")} description={t("glow.hint")}>
            <ToggleField label={t("glow.username")} checked={value.effects.username.glowEnabled} onChange={(glowEnabled) => commit({ ...value, effects: { ...value.effects, username: { ...value.effects.username, glowEnabled } } })} />
            {value.effects.username.glowEnabled ? <div className="border-l-2 border-border pl-4"><ColorField label={t("glow.color")} value={value.effects.username.glowColor} onChange={(glowColor) => commit({ ...value, effects: { ...value.effects, username: { ...value.effects.username, glowColor } } })} /></div> : null}
            <ToggleField label={t("glow.social")} checked={value.effects.social.glowEnabled} onChange={(glowEnabled) => commit({ ...value, effects: { ...value.effects, social: { ...value.effects.social, glowEnabled } } })} />
            {value.effects.social.glowEnabled ? <div className="border-l-2 border-border pl-4"><ColorField label={t("glow.color")} value={value.effects.social.glowColor} onChange={(glowColor) => commit({ ...value, effects: { ...value.effects, social: { ...value.effects.social, glowColor } } })} /></div> : null}
            <ToggleField label={t("glow.badges")} checked={value.effects.badges.glowEnabled} onChange={(glowEnabled) => commit({ ...value, effects: { ...value.effects, badges: { ...value.effects.badges, glowEnabled } } })} />
          </Panel>
          <Panel title={t("cursor.title")} description={t("cursor.hint")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("cursor.effect")}>
                <Select
                  value={value.effects.cursor.trailEnabled ? value.effects.cursor.trailType : "none"}
                  onValueChange={(type) => commit({ ...value, effects: { ...value.effects, cursor: { ...value.effects.cursor, trailType: type as BioCursorTrailType, trailEnabled: type !== "none" } } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bioCursorTrailTypes.map((type) => <SelectItem key={type} value={type}>{t(`cursor.effects.${type}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              {value.effects.cursor.trailEnabled && value.effects.cursor.trailType !== "none" && value.effects.cursor.trailType !== "rainbow" ? (
                <ColorField label={t("cursor.effectColor")} value={value.effects.cursor.trailColor} onChange={(trailColor) => commit({ ...value, effects: { ...value.effects, cursor: { ...value.effects.cursor, trailColor } } })} />
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative size-16 shrink-0">
                <button
                  type="button"
                  onClick={onPickCursorAsset}
                  disabled={cursorProcessing}
                  aria-label={value.effects.cursor.assetId ? t("cursor.change") : t("cursor.choose")}
                  title={value.effects.cursor.assetId ? t("cursor.change") : t("cursor.choose")}
                  className="relative grid size-16 place-items-center overflow-hidden rounded-2xl border border-border text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait"
                  style={{ background: "repeating-conic-gradient(color-mix(in srgb, currentColor 14%, transparent) 0% 25%, transparent 0% 50%) 50% / 10px 10px" }}
                >
                  {cursorProcessing ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : value.effects.cursor.assetId && cursorPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ảnh con trỏ nhỏ (≤ 32px)
                    <img src={cursorPreviewUrl} alt="" className="max-h-10 max-w-10 object-contain [image-rendering:pixelated]" />
                  ) : (
                    <MousePointer2 className="size-6" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onPickCursorAsset}
                  disabled={cursorProcessing}
                  aria-label={value.effects.cursor.assetId ? t("cursor.change") : t("cursor.choose")}
                  className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {value.effects.cursor.assetId ? <Pencil className="size-3" aria-hidden /> : <Plus className="size-3" aria-hidden />}
                </button>
                {value.effects.cursor.assetId && !cursorProcessing ? (
                  <button
                    type="button"
                    onClick={() => commit({ ...value, effects: { ...value.effects, cursor: { ...value.effects.cursor, type: "default", assetId: null } } })}
                    aria-label={t("cursor.remove")}
                    title={t("cursor.remove")}
                    className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm hover:bg-destructive hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                ) : null}
              </div>
              <div className="min-w-0 text-xs leading-5">
                <p className="font-medium text-foreground">
                  {cursorProcessing ? t("cursor.processing") : value.effects.cursor.assetId ? t("cursor.change") : t("cursor.choose")}
                </p>
                <p className="text-muted-foreground">{t("cursor.autoResize")}</p>
              </div>
            </div>
            {isBioBuiltinAssetId(value.effects.cursor.assetId) ? <p className="text-[11px] leading-4 text-muted-foreground">{t("templateAsset")}</p> : null}
            <ToggleField
              label={t("cursor.custom")}
              hint={value.effects.cursor.assetId ? undefined : t("cursor.noAsset")}
              checked={value.effects.cursor.type === "custom" && Boolean(value.effects.cursor.assetId)}
              onChange={(custom) => { if (value.effects.cursor.assetId) commit({ ...value, effects: { ...value.effects, cursor: { ...value.effects.cursor, type: custom ? "custom" : "default" } } }) }}
            />
            {value.effects.cursor.type === "custom" && value.effects.cursor.assetId ? (
              <div className="grid gap-4 border-l-2 border-border pl-4 sm:grid-cols-2">
                <RangeField label={t("cursor.hotspotX")} value={value.effects.cursor.hotspotX} min={0} max={64} unit="px" onChange={(hotspotX) => commit({ ...value, effects: { ...value.effects, cursor: { ...value.effects.cursor, hotspotX } } })} />
                <RangeField label={t("cursor.hotspotY")} value={value.effects.cursor.hotspotY} min={0} max={64} unit="px" onChange={(hotspotY) => commit({ ...value, effects: { ...value.effects, cursor: { ...value.effects.cursor, hotspotY } } })} />
              </div>
            ) : null}
          </Panel>
          <Panel title={t("profileAnimation")}>
            <Field label={t("animation")}>
              <Select value={value.effects.profile.type} onValueChange={(type) => commit({ ...value, effects: { ...value.effects, profile: { ...value.effects.profile, type: type as BioDesign["effects"]["profile"]["type"] } } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["none", "zoom", "fade", "slide-up", "unfold", "bounce"] as const).map((item) => <SelectItem key={item} value={item}>{t(`animationTypes.${item}`)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </Panel>
          <Panel title={t("enterScreen")}><ToggleField label={t("enterEnabled")} checked={value.effects.enter.enabled} onChange={(enabled) => commit({ ...value, effects: { ...value.effects, enter: { ...value.effects.enter, enabled } } })} />{value.effects.enter.enabled ? <div className="space-y-3 border-l-2 border-border pl-4"><Field label={t("title")}><Input value={value.effects.enter.title} onChange={(event) => commit({ ...value, effects: { ...value.effects, enter: { ...value.effects.enter, title: event.target.value } } })} /></Field><Field label={t("buttonText")}><Input value={value.effects.enter.buttonText} onChange={(event) => commit({ ...value, effects: { ...value.effects, enter: { ...value.effects.enter, buttonText: event.target.value } } })} /></Field></div> : null}</Panel>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          {sectionHeader("audio", t("audioDescription"))}
          <Panel title={t("backgroundMusic")}><ToggleField label={t("musicEnabled")} checked={value.audio.music.enabled} onChange={(enabled) => commit({ ...value, audio: { ...value.audio, music: { ...value.audio.music, enabled } } })} />{value.audio.music.enabled ? <div className="space-y-4 border-l-2 border-border pl-4"><AudioManagerField music={value.audio.music} playerVisible={value.audio.player.visible} trackUrls={musicTrackUrls ?? {}} onUpload={onUploadMusic} onBrowseLibrary={onPickMusicAsset} onTrackUploaded={onMusicTrackUploaded} onChange={(music) => commit({ ...value, audio: { ...value.audio, music } })} onPlayerVisibleChange={(visible) => commit({ ...value, audio: { ...value.audio, player: { ...value.audio.player, visible } } })} /><RangeField label={t("volume")} value={value.audio.music.volume} min={0} max={100} unit="%" onChange={(volume) => commit({ ...value, audio: { ...value.audio, music: { ...value.audio.music, volume } } })} /><Field label={t("startMode")}><Select value={value.audio.music.startMode} onValueChange={(startMode) => commit({ ...value, audio: { ...value.audio, music: { ...value.audio.music, startMode: startMode as "manual" | "on-enter" } } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="on-enter">On Enter</SelectItem></SelectContent></Select></Field></div> : null}</Panel>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div ref={templateGridRef} className="grid scroll-mt-[calc(var(--header-height,0px)+12px)] gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {visibleTemplates.map((template) => {
              const isApplying = applying?.id === template.id
              const isActive = appliedTemplateId === template.id && !isApplying
              return (
                <article
                  key={template.id}
                  aria-busy={isApplying}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition",
                    isActive || isApplying ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40",
                    applying && !isApplying && "opacity-50",
                  )}
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tĩnh nhỏ (webp 640px) */}
                    <img src={template.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105" />
                    {template.features.length ? (
                      <span className="absolute bottom-2 left-2 flex gap-1">
                        {template.features.map((feature) => (
                          <span key={feature} className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">{t(`templateFeatures.${feature}`)}</span>
                        ))}
                      </span>
                    ) : null}
                    {isActive ? (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"><Check className="size-3" />{t("templateActive")}</span>
                    ) : null}
                    {isApplying ? (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 px-4 text-white backdrop-blur-sm" role="status">
                        <Loader2 className="size-5 animate-spin" />
                        <span className="text-xs font-medium">{t(`templateSteps.${TEMPLATE_STEPS[applying.step]}`)}</span>
                        <span className="h-1 w-full max-w-40 overflow-hidden rounded-full bg-white/20">
                          <span className="block h-full rounded-full bg-white transition-[width] duration-300" style={{ width: `${((applying.step + 1) / TEMPLATE_STEPS.length) * 100}%` }} />
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="truncate text-sm font-semibold text-foreground">{template.name}</h4>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{t("templateBy", { creator: template.creator })}</span>
                      </div>
                      <p className="mt-1 text-xs leading-4 text-muted-foreground">{template.description}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isActive ? "secondary" : "default"}
                      className="mt-auto w-full"
                      disabled={Boolean(applying)}
                      onClick={() => applyTemplate(template)}
                    >
                      {isApplying ? (
                        <><Loader2 className="size-3.5 animate-spin" />{t("templateApplying")}</>
                      ) : isActive ? (
                        <><Check className="size-3.5" />{t("templateActive")}</>
                      ) : (
                        t("templateUse")
                      )}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
          {templatePageCount > 1 ? (
            <nav aria-label={t("templatePagination")} className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {t("templatePageInfo", { page: currentTemplatePage, pages: templatePageCount, total: BIO_DESIGN_TEMPLATES.length })}
              </p>
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" className="size-8" onClick={() => goToTemplatePage(currentTemplatePage - 1)} disabled={currentTemplatePage <= 1} aria-label={t("templatePrev")}>
                  <ChevronLeft className="size-4" />
                </Button>
                {getPageItems(currentTemplatePage, templatePageCount).map((item, index) =>
                  item === "…" ? (
                    <span key={`gap-${index}`} className="px-1 text-xs text-muted-foreground" aria-hidden>…</span>
                  ) : (
                    <Button
                      key={item}
                      type="button"
                      size="sm"
                      variant={item === currentTemplatePage ? "default" : "ghost"}
                      className="h-8 min-w-8 px-2 tabular-nums"
                      aria-current={item === currentTemplatePage ? "page" : undefined}
                      onClick={() => goToTemplatePage(item)}
                    >
                      {item}
                    </Button>
                  ),
                )}
                <Button type="button" variant="outline" size="icon" className="size-8" onClick={() => goToTemplatePage(currentTemplatePage + 1)} disabled={currentTemplatePage >= templatePageCount} aria-label={t("templateNext")}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </nav>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
