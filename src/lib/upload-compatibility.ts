const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav",
  flac: "audio/flac", ogg: "audio/ogg", oga: "audio/ogg", opus: "audio/ogg",
  aif: "audio/aiff", aiff: "audio/aiff",
};
const PROVIDER_TYPES: Record<string, string> = {
  ...AUDIO_TYPES,
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", avif: "image/avif", heic: "image/heic", heif: "image/heif",
  mp4: "video/mp4", mov: "video/quicktime", m4v: "video/x-m4v", webm: "video/webm",
};

// iOS maps audio/* to a movie picker. Explicit extensions avoid that mapping.
export const AUDIO_UPLOAD_ACCEPT = Object.keys(AUDIO_TYPES).map((ext) => `.${ext}`).join(",");

export function getUploadMimeType(file: Pick<File, "name" | "type">): string {
  const type = file.type.trim().toLowerCase();
  if (type && type !== "application/octet-stream") return type;
  return PROVIDER_TYPES[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? type;
}
