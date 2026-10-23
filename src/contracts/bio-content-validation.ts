/** Shared editor/API policy. DTOs still validate structure, enums and asset ownership. */
export type BioValidationCode = "required" | "url" | "tooLong" | "contentRequired" | "fileRequired";
export type BioContentValidationIssue = { path: string; code: BioValidationCode; limit?: number };
export const BIO_VALIDATION_MESSAGES: Record<BioValidationCode, string> = {
  required: "This field is required.",
  url: "Enter a valid HTTP or HTTPS URL.",
  tooLong: "This field exceeds the maximum length.",
  contentRequired: "Add at least one content block before publishing.",
  fileRequired: "Choose a file before publishing.",
};

export function isValidBioUrl(value: string): boolean {
  const raw = value.trim();
  if (!/^https?:\/\//i.test(raw) || /[\s<>\\]/.test(raw)) return false;
  try {
    const url = new URL(raw);
    if (url.username || url.password) return false;
    const host = url.hostname;
    if (host.startsWith("[") && host.endsWith("]")) return true;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return true;
    const labels = host.split(".");
    return labels.length > 1 && /^[a-z]{2,}$|^xn--[a-z0-9-]+$/i.test(labels[labels.length - 1] ?? "") &&
      labels.every((label) => label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));
  } catch { return false; }
}

export type BioContentValidationInput = {
  name?: string; title?: string; customSlug?: string; status?: "draft" | "published";
  socialLinks: { id: string; platform: string; url: string; enabled?: boolean }[];
  customLinks: { id: string; title: string; url: string; kind?: "link" | "download"; fileId?: string | null; description?: string; buttonText?: string }[];
  widgets: { id: string; type?: string; title: string; url: string; description?: string; enabled?: boolean }[];
  galleries?: { id: string; title?: string; images: { linkUrl?: string; alt?: string; caption?: string }[] }[];
  dividers?: { id: string; label?: string }[];
  bankDetails?: { id: string; title: string; bankName: string; accountName: string; accountNumber: string; branch?: string; note?: string; enabled: boolean }[];
  textBlocks?: { id: string; content: string }[];
};

export function validateBioContent(input: BioContentValidationInput): BioContentValidationIssue[] {
  const issues: BioContentValidationIssue[] = [];
  const published = input.status !== "draft";
  const text = (path: string, value: string | undefined, limit: number, required = false) => {
    if (required && !value?.trim()) issues.push({ path, code: "required" });
    if (value && [...value].length > limit) issues.push({ path, code: "tooLong", limit });
  };
  const url = (path: string, value: string | undefined, required = published) => {
    if (!value?.trim()) { if (required) issues.push({ path, code: "required" }); }
    else if (!isValidBioUrl(value)) issues.push({ path, code: "url" });
    text(path, value, 2084);
  };
  if (input.name !== undefined) text("name", input.name, 120, true);
  text("title", input.title, 160);
  text("customSlug", input.customSlug, 80);
  input.socialLinks.forEach((item, i) => {
    text(`socialLinks.${i}.platform`, item.platform, 80, true);
    url(`socialLinks.${i}.url`, item.url);
  });
  input.customLinks.forEach((item, i) => {
    text(`customLinks.${i}.title`, item.title, 120, published);
    if (item.kind === "download") {
      if (published && !item.fileId) issues.push({ path: `customLinks.${i}.fileId`, code: "fileRequired" });
      text(`customLinks.${i}.description`, item.description, 300);
      text(`customLinks.${i}.buttonText`, item.buttonText, 60);
    } else url(`customLinks.${i}.url`, item.url);
  });
  input.widgets.forEach((item, i) => {
    text(`widgets.${i}.title`, item.title, 120);
    text(`widgets.${i}.description`, item.description, 240);
    url(`widgets.${i}.url`, item.url);
  });
  input.galleries?.forEach((gallery, i) => {
    text(`galleries.${i}.title`, gallery.title, 120);
    gallery.images.forEach((image, n) => {
      const path = `galleries.${i}.images.${n}`;
      url(`${path}.linkUrl`, image.linkUrl, false);
      text(`${path}.linkUrl`, image.linkUrl, 1000);
      text(`${path}.alt`, image.alt, 300);
      text(`${path}.caption`, image.caption, 500);
    });
  });
  input.dividers?.forEach((item, i) => text(`dividers.${i}.label`, item.label, 80));
  input.bankDetails?.forEach((item, i) => {
    for (const [field, limit] of [["title", 120], ["bankName", 120], ["accountName", 160], ["accountNumber", 80], ["branch", 120], ["note", 300]] as const) {
      text(`bankDetails.${i}.${field}`, item[field], limit, published && item.enabled && ["bankName", "accountName", "accountNumber"].includes(field));
    }
  });
  input.textBlocks?.forEach((item, i) => text(`textBlocks.${i}.content`, item.content, 500));
  if (published && !input.socialLinks.length && !input.customLinks.length && !input.widgets.length &&
      !input.galleries?.some((g) => g.images.length) && !input.dividers?.length && !input.bankDetails?.length && !input.textBlocks?.length) {
    issues.push({ path: "content", code: "contentRequired" });
  }
  return issues;
}
