/**
 * URL mẫu cho từng nền tảng mạng xã hội: điền sẵn để người dùng gõ thêm tên
 * tài khoản. URL mẫu là link hợp lệ nên được lưu như bình thường.
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

/** URL rỗng hoặc đúng y URL mẫu của một nền tảng (dùng khi đổi nền tảng). */
export function isUnfilledSocialUrl(url: string) {
  const value = url.trim();
  return !value || Object.values(SOCIAL_URL_TEMPLATES).includes(value);
}

/** Đổi nền tảng: nếu URL chưa điền thì thay bằng URL mẫu của nền tảng mới. */
export function socialUrlForPlatformChange(currentUrl: string, platform: string) {
  return isUnfilledSocialUrl(currentUrl) ? socialUrlTemplate(platform) : currentUrl;
}
