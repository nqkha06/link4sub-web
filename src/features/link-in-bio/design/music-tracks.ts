import {
  BIO_MUSIC_MAX_TRACKS,
  BIO_MUSIC_TITLE_MAX_LENGTH,
  getBioMusicTracks,
  type BioDesign,
  type BioMusicTrack,
} from "../../../contracts/bio-design.ts"

/**
 * Thao tác trên danh sách nhạc (Audio Manager). Bài "Active" luôn được phản ánh
 * vào `music.assetId`/`music.title` để trang cũ và trình phát hiện tại vẫn chạy.
 */
type Music = BioDesign["audio"]["music"]

export function newMusicTrackId() {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function cleanMusicTitle(title: string) {
  return title.trim().slice(0, BIO_MUSIC_TITLE_MAX_LENGTH)
}

/** Tên mặc định lấy từ tên file: bỏ đuôi, đổi _ / - thành khoảng trắng. */
export function titleFromFileName(name: string) {
  return cleanMusicTitle(name.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " "))
}

function withActive(music: Music, tracks: BioMusicTrack[], active: BioMusicTrack | undefined): Music {
  return {
    ...music,
    tracks,
    assetId: active?.assetId ?? null,
    title: active?.title ?? "",
    enabled: active ? music.enabled : false,
  }
}

export function addMusicTrack(music: Music, track: Omit<BioMusicTrack, "id">, id = newMusicTrackId()): Music {
  const tracks = getBioMusicTracks(music)
  // File đã có trong danh sách: chọn lại thì chỉ đặt nó làm bài đang phát.
  const existing = tracks.find((item) => item.assetId === track.assetId)
  if (existing) return setActiveMusicTrack(music, existing.id)
  if (tracks.length >= BIO_MUSIC_MAX_TRACKS) return music
  const added = { id, assetId: track.assetId, title: cleanMusicTitle(track.title) }
  const next = [...tracks, added]
  // Chưa có bài active → bài vừa thêm thành active và bật nhạc.
  if (!music.assetId) return { ...withActive(music, next, added), enabled: true }
  return { ...music, tracks: next }
}

export function setActiveMusicTrack(music: Music, id: string): Music {
  const tracks = getBioMusicTracks(music)
  const active = tracks.find((track) => track.id === id)
  return active ? { ...withActive(music, tracks, active), enabled: true } : music
}

export function renameMusicTrack(music: Music, id: string, title: string): Music {
  const clean = cleanMusicTitle(title)
  const tracks = getBioMusicTracks(music).map((track) => (track.id === id ? { ...track, title: clean } : track))
  const renamed = tracks.find((track) => track.id === id)
  const isActive = renamed?.assetId === music.assetId
  return { ...music, tracks, ...(isActive ? { title: clean } : {}) }
}

export function removeMusicTrack(music: Music, id: string): Music {
  const tracks = getBioMusicTracks(music)
  const removed = tracks.find((track) => track.id === id)
  if (!removed) return music
  const next = tracks.filter((track) => track.id !== id)
  if (removed.assetId !== music.assetId) return { ...music, tracks: next }
  return withActive(music, next, next[0])
}
