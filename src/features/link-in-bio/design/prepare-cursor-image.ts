import { getFilePreviewUrl, uploadFile, type ManagedFileDto } from "@/lib/api-client"

/** Kích thước con trỏ khuyến nghị (trình duyệt bỏ qua ảnh con trỏ lớn hơn 128px). */
export const CURSOR_MAX_SIZE = 32

/**
 * URL cùng origin cho file media (`/media/...`): API có thể trả URL tuyệt đối theo
 * ASSET_URL (khác origin trang) — đọc bằng đường dẫn tương đối để không vướng CORS.
 */
function sameOriginUrl(url: string) {
  try {
    const parsed = new URL(url, window.location.href)
    return parsed.pathname.startsWith("/media/") ? `${parsed.pathname}${parsed.search}` : parsed.href
  } catch {
    return url
  }
}

/**
 * Chuẩn bị ảnh con trỏ: ảnh lớn hơn CURSOR_MAX_SIZE được thu nhỏ (giữ tỉ lệ) thành
 * PNG rồi tải lên thư viện làm file mới; ảnh đã đủ nhỏ thì dùng nguyên file.
 * Lỗi (không đọc/tải được) → trả lại file gốc để không chặn người dùng.
 */
export async function prepareCursorImage(file: ManagedFileDto): Promise<{ file: ManagedFileDto; resized: boolean }> {
  try {
    const response = await fetch(sameOriginUrl(getFilePreviewUrl(file)), { credentials: "include" })
    if (!response.ok) return { file, resized: false }
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    const { width, height } = bitmap
    if (width <= CURSOR_MAX_SIZE && height <= CURSOR_MAX_SIZE) {
      bitmap.close()
      return { file, resized: false }
    }
    const scale = CURSOR_MAX_SIZE / Math.max(width, height)
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext("2d")
    if (!context) return { file, resized: false }
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
    if (!png) return { file, resized: false }
    const baseName = (file.name || "cursor").replace(/\.[^.]+$/, "")
    const uploaded = await uploadFile(new File([png], `${baseName}-cursor-${canvas.width}x${canvas.height}.png`, { type: "image/png" }), { folderId: file.folderId ?? null })
    return { file: uploaded, resized: true }
  } catch {
    return { file, resized: false }
  }
}
