/**
 * Sao chép văn bản vào clipboard, dùng chung cho toàn bộ web.
 *
 * Trả về `true` nếu sao chép thành công, `false` nếu thất bại — KHÔNG throw,
 * để nơi gọi chỉ cần:
 *
 *   if (await copyToClipboard(text)) toast.success(...)
 *   else toast.error(...)
 *
 * Thứ tự thử:
 * 1. `navigator.clipboard.writeText` (cần HTTPS / localhost). Có thể bị từ chối
 *    do quyền, tab không được focus hoặc Safari mất "user activation".
 * 2. Dự phòng `document.execCommand("copy")` qua một <textarea> ẩn — chạy được
 *    trên HTTP và trình duyệt cũ.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (!text) return false;

  if (window.isSecureContext && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Rơi xuống cách dự phòng bên dưới.
    }
  }

  return legacyCopy(text);
}

/** Dự phòng cho HTTP hoặc trình duyệt cũ. */
export function legacyCopy(text: string): boolean {
  if (typeof document === "undefined" || !document.body) return false;

  const active = document.activeElement as HTMLElement | null;
  const previousFocus = active && typeof active.focus === "function" ? active : null;
  const selection = document.getSelection();
  const previousRanges: Range[] = [];
  if (selection) {
    for (let index = 0; index < selection.rangeCount; index += 1) previousRanges.push(selection.getRangeAt(index));
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  // readonly: không bật bàn phím ảo trên mobile.
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  textarea.tabIndex = -1;
  Object.assign(textarea.style, {
    // fixed + top/left 0: không làm trang nhảy cuộn khi focus.
    position: "fixed",
    top: "0",
    left: "0",
    width: "1px",
    height: "1px",
    padding: "0",
    border: "0",
    margin: "0",
    opacity: "0",
    pointerEvents: "none",
    // >= 16px: iOS không tự zoom khi focus ô nhập.
    fontSize: "16px",
  });

  // Gắn vào trong dialog đang mở (nếu có) thay vì <body>: focus trap của
  // Radix Dialog/Sheet sẽ kéo focus về lại dialog khi focus ra ngoài, làm
  // select() hụt và copy ra chuỗi rỗng.
  const container =
    previousFocus?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? document.body;

  let copied = false;
  try {
    container.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    // iOS Safari bỏ qua select(), cần chọn theo range.
    textarea.setSelectionRange(0, text.length);
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    textarea.remove();
    if (selection) {
      selection.removeAllRanges();
      for (const range of previousRanges) selection.addRange(range);
    }
    previousFocus?.focus({ preventScroll: true });
  }

  return copied;
}
