import type { LucideIcon } from "lucide-react";
import {
  Images,
  FileDown,
  Landmark,
  Link2,
  Share2,
  SeparatorHorizontal,
  Type,
  Video,
} from "lucide-react";

export type ContentBlockCategory = "links" | "content" | "media" | "business" | "other";

export type ContentBlockPickerType =
  | "link"
  | "download"
  | "gallery"
  | "social"
  | "divider"
  | "bank-details"
  | "embed"
  | "text";

export interface ContentBlockDefinition {
  type: ContentBlockPickerType;
  title: string;
  description: string;
  category: ContentBlockCategory;
  icon: LucideIcon;
  keywords: string[];
  isPopular?: boolean;
  isNew?: boolean;
  isAdvanced?: boolean;
  enabled: boolean;
}

export const contentBlockCategoryLabels: Record<ContentBlockCategory, string> = {
  links: "Liên kết",
  content: "Nội dung",
  media: "Hình ảnh & Video",
  business: "Kinh doanh",
  other: "Khác",
};

export const contentBlockRegistry: ContentBlockDefinition[] = [
  {
    type: "download", title: "Thẻ tải xuống", description: "Chia sẻ file từ thư viện để người xem tải về",
    category: "content", icon: FileDown, keywords: ["download", "file", "tai xuong", "tải xuống", "pdf", "zip"], isNew: true, enabled: true,
  },
  {
    type: "link",
    title: "Liên kết",
    description: "Nút dẫn đến website bất kỳ",
    category: "links",
    icon: Link2,
    keywords: ["url", "website", "button", "nút", "link"],
    isPopular: true,
    enabled: true,
  },
  {
    type: "gallery",
    title: "Bộ sưu tập",
    description: "Nhiều ảnh dạng lưới hoặc thanh trượt",
    category: "media",
    icon: Images,
    keywords: ["ảnh", "hình", "gallery", "slider", "album"],
    isPopular: true,
    isNew: true,
    enabled: true,
  },
  {
    type: "social",
    title: "Mạng xã hội",
    description: "Hàng icon dẫn đến các hồ sơ của bạn",
    category: "links",
    icon: Share2,
    keywords: ["social", "instagram", "facebook", "tiktok", "youtube"],
    isPopular: true,
    enabled: true,
  },
  {
    type: "divider",
    title: "Dấu phân cách",
    description: "Khoảng ngắt giữa các nhóm nội dung",
    category: "content",
    icon: SeparatorHorizontal,
    keywords: ["divider", "separator", "đường kẻ", "phân cách", "ngăn cách"],
    enabled: true,
  },
  {
    type: "bank-details",
    title: "Thông tin ngân hàng",
    description: "Số tài khoản để nhận chuyển khoản",
    category: "business",
    icon: Landmark,
    keywords: ["bank", "ngân hàng", "chuyển khoản", "số tài khoản", "thanh toán"],
    isNew: true,
    enabled: true,
  },
  {
    type: "embed",
    title: "Nhúng nội dung",
    description: "Video, nhạc hoặc bài đăng từ YouTube, TikTok, Spotify…",
    category: "media",
    icon: Video,
    keywords: ["youtube", "tiktok", "spotify", "instagram", "twitch", "audio", "nhung", "embed", "iframe", "video", "nhac"],
    isPopular: true,
    enabled: true,
  },
  {
    type: "text",
    title: "Văn bản / Tiêu đề",
    description: "Đoạn giới thiệu hoặc tiêu đề nhóm",
    category: "content",
    icon: Type,
    keywords: ["text", "văn bản", "tieu de", "tiêu đề", "heading", "title", "note", "ghi chu", "ghi chú", "doan van", "đoạn văn"],
    isNew: true,
    enabled: true,
  },
];

export function getContentBlockDefinition(type: ContentBlockPickerType) {
  return contentBlockRegistry.find((definition) => definition.type === type);
}

export function normalizeContentBlockSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .trim();
}
