"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Check, ChevronRight, FolderOpen, Loader2, Music2, Pause, Pencil, Play, Plus, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { Switch } from "@/components/ui/switch"
import {
  BIO_MUSIC_MAX_TRACKS,
  BIO_MUSIC_TITLE_MAX_LENGTH,
  getBioMusicTracks,
  isBioBuiltinAssetId,
  resolveBioBuiltinAssetUrl,
  type BioDesign,
  type BioMusicTrack,
} from "@/contracts"
import { cn } from "@/lib/utils"

import { addMusicTrack, removeMusicTrack, renameMusicTrack, setActiveMusicTrack, titleFromFileName } from "./music-tracks"

type Music = BioDesign["audio"]["music"]

/** Định dạng nhận khi tải nhạc lên (giống guns.lol: mp3, aac, m4a). */
export const AUDIO_MANAGER_ACCEPT = ".mp3,.aac,.m4a,audio/mpeg,audio/aac,audio/mp4,audio/x-m4a"

export type UploadedAudio = { assetId: string; url?: string }

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

/** Thời lượng bài nhạc, đọc từ metadata của file (không tải cả file). */
function useAudioDuration(url: string | undefined) {
  const [duration, setDuration] = useState<{ url: string; value: number } | null>(null)
  useEffect(() => {
    if (!url) return
    const audio = new Audio()
    audio.preload = "metadata"
    const onLoaded = () => {
      if (Number.isFinite(audio.duration)) setDuration({ url, value: audio.duration })
    }
    audio.addEventListener("loadedmetadata", onLoaded)
    audio.src = url
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeAttribute("src")
      audio.load()
    }
  }, [url])
  return duration && duration.url === url ? duration.value : null
}

function TrackRow({
  track,
  url,
  main,
  shuffle,
  playing,
  onSelect,
  onTogglePreview,
  onEdit,
  onRemove,
}: {
  track: BioMusicTrack
  url?: string
  /** Bài chính (phát khi khách mở trang, nếu không bật phát ngẫu nhiên). */
  main: boolean
  shuffle: boolean
  playing: boolean
  onSelect: () => void
  onTogglePreview: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  const t = useTranslations("BioStudio.audioManager")
  const duration = useAudioDuration(url)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  // Hết 3 giây không xác nhận thì nút xoá trở lại bình thường.
  useEffect(() => {
    if (!confirmingRemove) return
    const timer = window.setTimeout(() => setConfirmingRemove(false), 3000)
    return () => window.clearTimeout(timer)
  }, [confirmingRemove])
  const selected = main && !shuffle

  return (
    <li
      className={cn(
        "flex items-center gap-1 rounded-xl border bg-background p-1.5 pr-1.5 transition-colors",
        selected ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-foreground/25",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!url}
        onClick={onTogglePreview}
        aria-label={playing ? t("previewPause") : t("previewPlay")}
        title={playing ? t("previewPause") : t("previewPlay")}
        className={cn("size-10 shrink-0 rounded-lg", playing ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "bg-muted text-foreground")}
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
      </Button>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={shuffle}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{track.title || t("untitled")}</span>
          <span className="block truncate text-xs tabular-nums text-muted-foreground">
            {duration === null ? "--:--" : formatDuration(duration)}
            {isBioBuiltinAssetId(track.assetId) ? ` · ${t("templateTrack")}` : ""}
          </span>
        </span>
        {shuffle ? null : selected ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            <Check className="size-3" aria-hidden />
            {t("main")}
          </span>
        ) : (
          <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{t("setMain")}</span>
        )}
      </button>
      <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground" aria-label={t("edit")} title={t("edit")} onClick={onEdit}>
        <Pencil className="size-4" aria-hidden />
      </Button>
      {confirmingRemove ? (
        <Button type="button" variant="destructive" size="sm" className="h-8 shrink-0 px-2 text-xs" onClick={onRemove}>
          {t("confirmRemove")}
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground hover:text-destructive" aria-label={t("remove")} title={t("remove")} onClick={() => setConfirmingRemove(true)}>
          <Trash2 className="size-4" aria-hidden />
        </Button>
      )}
    </li>
  )
}

/** Nghe thử: một thẻ audio dùng chung, mỗi lúc chỉ phát một bài. */
function usePreviewPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const stop = () => {
    audioRef.current?.pause()
    setPlayingId(null)
  }
  const toggle = (id: string, url: string | undefined) => {
    if (!url) return
    if (playingId === id) return stop()
    const audio = audioRef.current ?? new Audio()
    audioRef.current = audio
    audio.onended = () => setPlayingId(null)
    audio.src = url
    audio.currentTime = 0
    setPlayingId(id)
    void audio.play().catch(() => setPlayingId(null))
  }
  useEffect(() => () => audioRef.current?.pause(), [])
  return { playingId, toggle, stop }
}

function SwitchRow({ title, hint, note, checked, disabled, onChange }: { title: string; hint: string; note?: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-3.5 py-3">
      <label htmlFor={id} className={cn("min-w-0", disabled && "opacity-60")}>
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{hint}</span>
        {note ? <span className="mt-1 block text-[11px] font-medium leading-4 text-amber-600 dark:text-amber-400">{note}</span> : null}
      </label>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}

/** Dialog "Add an Audio" / sửa tên bài: ô tải file + tên bài. */
function TrackEditorDialog({
  open,
  onOpenChange,
  editing,
  onUpload,
  onBrowseLibrary,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Có giá trị = sửa tên bài đó; null = thêm bài mới. */
  editing: BioMusicTrack | null
  onUpload?: (file: File, onProgress: (value: number) => void) => Promise<UploadedAudio>
  onBrowseLibrary?: () => void
  onSubmit: (track: { assetId: string; title: string; url?: string }) => void
}) {
  const t = useTranslations("BioStudio.audioManager")
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(editing?.title ?? "")
  const [uploaded, setUploaded] = useState<(UploadedAudio & { fileName: string }) | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState("")
  const uploading = progress !== null

  async function handleFile(file: File | undefined) {
    if (!file || !onUpload || uploading) return
    setError("")
    setProgress(0)
    try {
      const result = await onUpload(file, setProgress)
      setUploaded({ ...result, fileName: file.name })
      setTitle((current) => current.trim() ? current : titleFromFileName(file.name))
    } catch (uploadError) {
      setError(uploadError instanceof Error && uploadError.message ? uploadError.message : t("uploadFailed"))
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const canSubmit = !uploading && (editing ? true : Boolean(uploaded))

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => { if (!uploading) onOpenChange(next) }}>
      <ResponsiveDialogContent aria-describedby={undefined} className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{editing ? t("editTitle") : t("addTitle")}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form
            id="bio-audio-track-form"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (!canSubmit) return
              if (editing) onSubmit({ assetId: editing.assetId, title })
              else if (uploaded) onSubmit({ assetId: uploaded.assetId, title: title || titleFromFileName(uploaded.fileName), url: uploaded.url })
            }}
          >
            {editing ? null : (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={uploading || !onUpload}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "flex h-[110px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    uploaded ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
                  )}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                      <span className="text-sm font-medium text-foreground">{t("uploading", { progress: progress ?? 0 })}</span>
                    </>
                  ) : uploaded ? (
                    <>
                      <Check className="size-5 text-primary" aria-hidden />
                      <span className="max-w-full truncate text-sm font-medium text-foreground">{uploaded.fileName}</span>
                      <span className="text-xs text-muted-foreground">{t("uploadReplace")}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-5 text-muted-foreground" aria-hidden />
                      <span className="text-sm font-medium text-foreground">{t("uploadPrompt")}</span>
                      <span className="text-xs text-muted-foreground">{t("uploadFormats")}</span>
                    </>
                  )}
                </button>
                <input ref={inputRef} type="file" accept={AUDIO_MANAGER_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden onChange={(event) => void handleFile(event.target.files?.[0])} />
                {onBrowseLibrary ? (
                  <button type="button" disabled={uploading} onClick={onBrowseLibrary} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50">
                    <FolderOpen className="size-3.5" aria-hidden />
                    {t("browseLibrary")}
                  </button>
                ) : null}
                {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="bio-audio-track-title" className="text-xs font-medium text-foreground">{t("trackTitle")}</label>
              <div className="relative">
                <Music2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="bio-audio-track-title"
                  data-autofocus={editing ? true : undefined}
                  value={title}
                  maxLength={BIO_MUSIC_TITLE_MAX_LENGTH}
                  placeholder={t("titlePlaceholder")}
                  className="pr-14 pl-9"
                  onChange={(event) => setTitle(event.target.value)}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground">
                  {title.length}/{BIO_MUSIC_TITLE_MAX_LENGTH}
                </span>
              </div>
            </div>
          </form>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button type="submit" form="bio-audio-track-form" className="w-full sm:w-auto" disabled={!canSubmit}>
            {editing ? t("save") : <><Music2 className="size-4" aria-hidden />{t("add")}</>}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/**
 * Trường "Âm nhạc" kiểu guns.lol: bấm vào mở Audio Manager (danh sách tối đa
 * 4 bài, chọn bài active, Shuffle Audios, Audio Player, thêm bài).
 */
export function AudioManagerField({
  music,
  playerVisible,
  trackUrls,
  onChange,
  onPlayerVisibleChange,
  onUpload,
  onBrowseLibrary,
  onTrackUploaded,
}: {
  music: Music
  playerVisible: boolean
  /** URL nghe thử theo assetId (file thư viện); asset của template tự suy ra. */
  trackUrls: Record<string, string | undefined>
  onChange: (music: Music) => void
  onPlayerVisibleChange: (visible: boolean) => void
  onUpload?: (file: File, onProgress: (value: number) => void) => Promise<UploadedAudio>
  /**
   * Mở Media Manager (mặc định của nút "Thêm nhạc": chọn file có sẵn hoặc tải lên ở đó);
   * file chọn được do nơi gọi tự thêm vào danh sách. Không truyền thì dùng dialog tải lên.
   */
  onBrowseLibrary?: () => void
  onTrackUploaded?: (assetId: string, url: string | undefined) => void
}) {
  const t = useTranslations("BioStudio.audioManager")
  const [open, setOpen] = useState(false)
  const [editor, setEditor] = useState<{ key: number; track: BioMusicTrack | null } | null>(null)
  const preview = usePreviewPlayer()
  const tracks = getBioMusicTracks(music)
  const active = tracks.find((track) => track.assetId === music.assetId)
  const full = tracks.length >= BIO_MUSIC_MAX_TRACKS
  const urlOf = (track: BioMusicTrack) => resolveBioBuiltinAssetUrl(track.assetId) ?? trackUrls[track.assetId]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-2.5 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          <Music2 className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{music.shuffle && tracks.length > 1 ? t("shuffleSummary") : active ? active.title || t("untitled") : t("empty")}</span>
          <span className="block text-xs text-muted-foreground">
            {t("count", { count: tracks.length, max: BIO_MUSIC_MAX_TRACKS })}
            {tracks.length ? ` · ${t("manage")}` : ""}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <ResponsiveDialog open={open} onOpenChange={(next) => { if (!next) preview.stop(); setOpen(next) }}>
        <ResponsiveDialogContent aria-describedby={undefined} className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t("title")}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-5">
            <section className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{t("listTitle")}</h3>
                <span className="text-xs tabular-nums text-muted-foreground">{t("count", { count: tracks.length, max: BIO_MUSIC_MAX_TRACKS })}</span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{music.shuffle ? t("instructionsShuffle") : t("instructions")}</p>
              {tracks.length ? (
                <ul role="radiogroup" aria-label={t("listTitle")} className="space-y-2">
                  {tracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      url={urlOf(track)}
                      main={track.assetId === music.assetId}
                      shuffle={music.shuffle && tracks.length > 1}
                      playing={preview.playingId === track.id}
                      onSelect={() => onChange(setActiveMusicTrack(music, track.id))}
                      onTogglePreview={() => preview.toggle(track.id, urlOf(track))}
                      onEdit={() => setEditor({ key: Date.now(), track })}
                      onRemove={() => {
                        if (preview.playingId === track.id) preview.stop()
                        onChange(removeMusicTrack(music, track.id))
                      }}
                    />
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <Music2 className="size-5 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">{t("emptyList")}</p>
                </div>
              )}
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{t("settingsTitle")}</h3>
              <SwitchRow
                title={t("shuffle")}
                hint={t("shuffleHint")}
                note={tracks.length < 2 ? t("shuffleNeedsTwo") : undefined}
                checked={music.shuffle && tracks.length > 1}
                disabled={tracks.length < 2}
                onChange={(shuffle) => onChange({ ...music, shuffle })}
              />
              <SwitchRow title={t("player")} hint={t("playerHint")} checked={playerVisible} onChange={onPlayerVisibleChange} />
            </section>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button type="button" variant="outline">{t("close")}</Button>
            </ResponsiveDialogClose>
            <Button type="button" disabled={full} onClick={() => (onBrowseLibrary ? onBrowseLibrary() : setEditor({ key: Date.now(), track: null }))}>
              <Plus className="size-4" aria-hidden />
              {full ? t("full") : t("add")}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {editor ? (
        <TrackEditorDialog
          key={editor.key}
          open
          editing={editor.track}
          onOpenChange={(next) => { if (!next) setEditor(null) }}
          onUpload={onUpload}
          onBrowseLibrary={onBrowseLibrary ? () => { setEditor(null); onBrowseLibrary() } : undefined}
          onSubmit={(track) => {
            if (editor.track) onChange(renameMusicTrack(music, editor.track.id, track.title))
            else {
              onTrackUploaded?.(track.assetId, track.url)
              onChange(addMusicTrack(music, track))
            }
            setEditor(null)
          }}
        />
      ) : null}
    </>
  )
}
