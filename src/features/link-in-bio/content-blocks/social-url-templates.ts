/**
 * URL mẫu cho từng nền tảng mạng xã hội: điền sẵn phần đầu để người dùng chỉ
 * cần gõ thêm tên tài khoản. URL còn đúng y mẫu (chưa gõ gì thêm) coi như
 * chưa điền và bị bỏ qua khi lưu.
 */
export const SOCIAL_URL_TEMPLATES: Record<string, string> = {
  Instagram: "https://instagram.com/",
  Twitter: "https://x.com/",
  Facebook: "https://facebook.com/",
  TikTok: "https://tiktok.com/@",
  YouTube: "https://youtube.com/@",
  LinkedIn: "https://linkedin.com/in/",
  PayPal: "https://paypal.me/",
  Venmo: "https://venmo.com/u/",
  CashApp: "https://cash.app/$",
  Spotify: "https://open.spotify.com/user/",
  "Apple Music": "https://music.apple.com/profile/",
  Reddit: "https://reddit.com/user/",
  Discord: "https://discord.gg/",
  Twitch: "https://twitch.tv/",
};

export function socialUrlTemplate(platform: string) {
  return SOCIAL_URL_TEMPLATES[platform] ?? "";
}

/** URL rỗng hoặc chỉ là URL mẫu của một nền tảng (chưa có tên tài khoản). */
export function isUnfilledSocialUrl(url: string) {
  const value = url.trim();
  return !value || Object.values(SOCIAL_URL_TEMPLATES).includes(value);
}

/** Đổi nền tảng: nếu URL chưa điền thì thay bằng URL mẫu của nền tảng mới. */
export function socialUrlForPlatformChange(currentUrl: string, platform: string) {
  return isUnfilledSocialUrl(currentUrl) ? socialUrlTemplate(platform) : currentUrl;
}
