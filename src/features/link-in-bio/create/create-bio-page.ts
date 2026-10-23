import type {
  BioContentOrderItemDto,
  CreateBioPagePayload,
  BioCustomLinkDto,
  BioSocialLinkDto,
} from "@/lib/api-client";

import {
  bioBackgroundPresets,
  DEFAULT_BIO_BACKGROUND_PRESET_ID,
  getBioBackgroundPresetById,
} from "../backgrounds/background-presets.ts";
import { socialUrlTemplate } from "../content-blocks/social-url-templates.ts";

export type BioAccess = "draft" | "published";

export type CreateBioBasics = {
  name: string;
  slug: string;
  description: string;
  access: BioAccess;
};

export const BIO_NAME_MAX_LENGTH = 120;
export const BIO_SLUG_MAX_LENGTH = 80;
export const BIO_DESCRIPTION_MAX_LENGTH = 160;

/** Query param báo cho editor biết người dùng muốn công khai trang ở lần lưu đầu. */
export const BIO_PUBLISH_INTENT_PARAM = "publish";
/** Query param đánh dấu trang vừa được tạo: editor bật sẵn các khối gợi ý. */
export const BIO_NEW_PAGE_PARAM = "new";

/** Chọn ngẫu nhiên một nền có sẵn cho trang mới. */
export function pickRandomBioBackgroundPreset(random: () => number = Math.random) {
  if (bioBackgroundPresets.length === 0) return getBioBackgroundPresetById(DEFAULT_BIO_BACKGROUND_PRESET_ID);
  const index = Math.min(Math.floor(random() * bioBackgroundPresets.length), bioBackgroundPresets.length - 1);
  return bioBackgroundPresets[index];
}

export type StarterBioContent = {
  socialLinks: BioSocialLinkDto[];
  customLinks: BioCustomLinkDto[];
  contentOrder: BioContentOrderItemDto[];
};

export const STARTER_SOCIAL_PLATFORMS = ["Facebook", "Instagram", "TikTok", "YouTube"] as const;

/**
 * Các khối gợi ý bật sẵn khi mở editor lần đầu cho trang mới. Mạng xã hội điền
 * sẵn URL mẫu (vd. https://tiktok.com/@); khối nào người dùng không điền thêm sẽ
 * bị bỏ qua khi lưu (buildBioPayload lọc URL mẫu / URL không hợp lệ).
 */
export function createStarterBioContent(createId: (prefix: string) => string): StarterBioContent {
  const socialLinks = STARTER_SOCIAL_PLATFORMS.map((platform) => ({
    id: createId("social"),
    platform,
    url: socialUrlTemplate(platform),
    enabled: true,
  }));
  const customLinks: BioCustomLinkDto[] = [
    { id: createId("link"), title: "Website của tôi", url: "", animationEffect: "none" },
  ];

  return {
    socialLinks,
    customLinks,
    contentOrder: [
      { type: "social", id: "socials" },
      ...customLinks.map(({ id }) => ({ type: "link" as const, id })),
    ],
  };
}

/** Làm sạch slug khi người dùng gõ — cùng quy tắc với ô slug trong editor. */
export function sanitizeBioSlugInput(value: string, caseSensitive: boolean) {
  const source = caseSensitive ? value : value.toLowerCase();
  return source
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .slice(0, BIO_SLUG_MAX_LENGTH);
}

/**
 * Đường dẫn server sẽ tự tạo khi ô slug để trống: cùng quy tắc với
 * `normalizeConfiguredAlias` + `createUniqueSlug` ở API (bỏ dấu, ký tự lạ thành
 * "-", cắt 64 ký tự). Dùng làm placeholder để người dùng thấy trước kết quả.
 * Nếu trùng, server thêm hậu tố "-1", "-2"…
 */
export function previewAutoBioSlug(name: string, caseSensitive: boolean) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (caseSensitive ? normalized : normalized.toLowerCase()).slice(0, 64);
}

/**
 * Payload tạo trang chỉ với thông tin cơ bản. Trang luôn được tạo ở dạng bản
 * nháp vì chưa có nội dung; ý định "công khai" được chuyển sang editor để áp
 * dụng khi người dùng lưu lần đầu sau khi thêm nội dung.
 */
export function buildCreateBioPayload(
  basics: CreateBioBasics,
  random: () => number = Math.random,
): CreateBioPagePayload {
  const preset = pickRandomBioBackgroundPreset(random);
  const slug = basics.slug.replace(/-+$/, "");
  const description = basics.description.trim();

  return {
    name: basics.name.trim(),
    title: description || undefined,
    customSlug: slug || undefined,
    status: "draft",
    socialLinks: [],
    customLinks: [],
    widgets: [],
    galleries: [],
    dividers: [],
    bankDetails: [],
    textBlocks: [],
    contentOrder: [],
    hiddenLinks: [],
    appearance: {
      buttonStyle: "rounded",
      backgroundColor: preset?.theme.accentColor || "#ffffff",
      backgroundImage: preset?.imageUrl || undefined,
      selectedBackgroundId: preset?.id,
      backgroundBlur: 0,
      backgroundOverlay: 0,
      backgroundBrightness: 100,
    },
  };
}
