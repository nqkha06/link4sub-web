import { isUnfilledSocialUrl } from "./social-url-templates.ts";

/**
 * Các ô nội dung chưa điền xong / sai. Những mục này bị bỏ qua khi lưu, nên
 * editor đánh dấu ngay tại ô để người dùng biết cần sửa gì.
 */
export type ContentIssue = {
  /** Khối chứa ô lỗi (contentOrderKey: "social:socials", "link:<id>"…). */
  blockKey: string;
  /** id của ô nhập cần sửa (để focus). */
  fieldId: string;
  /** Tên ngắn của mục (Facebook, "Website của tôi"…). */
  label: string;
  message: string;
};

type Social = { id: string; platform: string; url: string };
type Link = { id: string; title: string; url: string };
type Widget = { id: string; title: string; url: string };

export function isValidContentUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isBlankUrl(value: string) {
  const trimmed = value.trim();
  return !trimmed || trimmed === "https://" || trimmed === "http://";
}

export function findContentIssues(input: { socialLinks: Social[]; customLinks: Link[]; widgets: Widget[] }): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const social of input.socialLinks) {
    const fieldId = `content-social-url-${social.id}`;
    if (isUnfilledSocialUrl(social.url)) {
      issues.push({ blockKey: "social:socials", fieldId, label: social.platform, message: `Thêm tên tài khoản ${social.platform} vào cuối link.` });
    } else if (!isValidContentUrl(social.url)) {
      issues.push({ blockKey: "social:socials", fieldId, label: social.platform, message: "Link không hợp lệ, cần bắt đầu bằng https://" });
    }
  }
  for (const link of input.customLinks) {
    const blockKey = `link:${link.id}`;
    const label = link.title.trim() || "Liên kết";
    if (!link.title.trim()) {
      issues.push({ blockKey, fieldId: `content-link-title-${link.id}`, label, message: "Nhập tiêu đề cho liên kết." });
    }
    if (isBlankUrl(link.url)) {
      issues.push({ blockKey, fieldId: `content-link-url-${link.id}`, label, message: "Nhập URL cho liên kết." });
    } else if (!isValidContentUrl(link.url)) {
      issues.push({ blockKey, fieldId: `content-link-url-${link.id}`, label, message: "URL không hợp lệ, cần bắt đầu bằng https://" });
    }
  }
  for (const widget of input.widgets) {
    const blockKey = `widget:${widget.id}`;
    const label = widget.title.trim() || "Nội dung nhúng";
    if (isBlankUrl(widget.url)) {
      issues.push({ blockKey, fieldId: `content-widget-url-${widget.id}`, label, message: "Nhập URL nội dung nhúng." });
    } else if (!isValidContentUrl(widget.url)) {
      issues.push({ blockKey, fieldId: `content-widget-url-${widget.id}`, label, message: "URL không hợp lệ, cần bắt đầu bằng https://" });
    }
  }
  return issues;
}

/** Tên các mục có lỗi, không trùng, tối đa `max` tên (vd. "Facebook, Instagram và 2 mục khác"). */
export function summarizeIssueLabels(issues: ContentIssue[], max = 3) {
  const labels = [...new Set(issues.map((issue) => issue.label))];
  if (labels.length <= max) return labels.join(", ");
  return `${labels.slice(0, max).join(", ")} và ${labels.length - max} mục khác`;
}
