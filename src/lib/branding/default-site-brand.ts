export const DEFAULT_SITE_LOGO_URL = "/brand/stu-logo.png";

export const DEFAULT_SITE_ICON_URLS = {
  faviconIco: "/brand/favicon.ico",
  favicon32: "/brand/favicon-32.png",
  favicon48: "/brand/favicon-48.png",
  appleTouchIcon: "/brand/apple-touch-icon.png",
  icon192: "/brand/icon-192.png",
  icon512: "/brand/icon-512.png",
} as const;

/** Ảnh admin bị thiếu thì giữ giao diện có logo mặc định thay vì ảnh vỡ. */
export function fallbackToDefaultSiteLogo(image: HTMLImageElement) {
  const fallbackUrl = new URL(DEFAULT_SITE_LOGO_URL, image.baseURI).href;
  if (image.src !== fallbackUrl) image.src = fallbackUrl;
}
