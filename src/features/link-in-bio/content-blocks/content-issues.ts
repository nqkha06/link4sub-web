import {
  BIO_VALIDATION_MESSAGES, isValidBioUrl, validateBioContent,
  type BioContentValidationInput, type BioValidationCode,
} from "../../../contracts/bio-content-validation.ts";

export type ContentIssue = {
  blockKey: string;
  fieldId: string;
  label: string;
  message: string;
  kind: "unfilled" | "invalid";
  section?: "details" | "content" | "appearance";
  code?: BioValidationCode;
  limit?: number;
};
export const isValidContentUrl = isValidBioUrl;
type IssueInput = BioContentValidationInput;
type Binding = Pick<ContentIssue, "blockKey" | "fieldId" | "label" | "section">;
function bindings(input: IssueInput): Record<string, Binding> {
  const result: Record<string, Binding> = {};
  const bind = (path: string, blockKey: string, fieldId: string, label: string, section: Binding["section"] = "content") => {
    result[path] = { blockKey, fieldId, label, section };
  };
  for (const field of ["name", "title", "customSlug"]) bind(field, "details", `bio-${field}`, field, "details");
  bind("content", "content", "bio-content-issues", "content");
  input.socialLinks.forEach((item, i) => {
    bind(`socialLinks.${i}.url`, "social:socials", `content-social-url-${item.id}`, item.platform);
    bind(`socialLinks.${i}.platform`, "social:socials", `content-social-url-${item.id}`, item.platform);
  });
  input.customLinks.forEach((item, i) => {
    for (const field of ["url", "title", "fileId", "description", "buttonText"]) bind(`customLinks.${i}.${field}`, `link:${item.id}`, `content-link-${field}-${item.id}`, item.title || "Liên kết");
  });
  input.widgets.forEach((item, i) => {
    for (const field of ["url", "title", "description"]) bind(`widgets.${i}.${field}`, `widget:${item.id}`, `content-widget-${field}-${item.id}`, item.title || "Nội dung nhúng");
  });
  input.bankDetails?.forEach((item, i) => {
    for (const [field, prefix] of Object.entries({ title: "title", bankName: "name", accountName: "account-name", accountNumber: "account-number", branch: "branch", note: "note" })) {
      bind(`bankDetails.${i}.${field}`, `bank-details:${item.id}`, `bank-${prefix}-${item.id}`, item.title || "Ngân hàng");
    }
  });
  input.textBlocks?.forEach((item, i) => bind(`textBlocks.${i}.content`, `text:${item.id}`, `text-content-${item.id}`, "Văn bản"));
  input.dividers?.forEach((item, i) => bind(`dividers.${i}.label`, `divider:${item.id}`, `divider-label-${item.id}`, "Dấu phân cách"));
  input.galleries?.forEach((item, i) => {
    bind(`galleries.${i}.title`, `gallery:${item.id}`, `gallery-title-${item.id}`, item.title || "Bộ sưu tập");
    item.images.forEach((_, n) => {
      for (const field of ["linkUrl", "alt", "caption"]) bind(`galleries.${i}.images.${n}.${field}`, `gallery:${item.id}`, `gallery-title-${item.id}`, item.title || "Bộ sưu tập");
    });
  });
  return result;
}

export function findContentIssues(input: IssueInput): ContentIssue[] {
  const fields = bindings(input);
  return validateBioContent(input).map((issue) => ({
    ...fields[issue.path], ...issue,
    message: BIO_VALIDATION_MESSAGES[issue.code],
    kind: issue.code === "required" ? "unfilled" : "invalid",
  }));
}

export function summarizeIssueLabels(issues: ContentIssue[], max = 3) {
  const labels = [...new Set(issues.map((issue) => issue.label))];
  if (labels.length <= max) return labels.join(", ");
  return `${labels.slice(0, max).join(", ")} và ${labels.length - max} mục khác`;
}

/** Payload order must match editor order; nothing is silently filtered on save. */
export function issuesFromServerDetails(details: Record<string, string[]> | undefined, payload: IssueInput): { issues: ContentIssue[]; other: string[] } {
  const fields = bindings(payload);
  const issues: ContentIssue[] = [];
  const other: string[] = [];
  for (const [path, messages] of Object.entries(details ?? {})) {
    const message = messages[0] ?? "Invalid value.";
    const field = fields[path] ?? (path.startsWith("design.") ? { blockKey: "design", fieldId: "bio-design-issues", label: "Design", section: "appearance" as const } : undefined);
    if (!field) { other.push(message); continue; }
    const code = (Object.keys(BIO_VALIDATION_MESSAGES) as BioValidationCode[]).find((key) => BIO_VALIDATION_MESSAGES[key] === message)
      ?? (/must be a URL/i.test(message) ? "url" : undefined);
    issues.push({ ...field, message, code, kind: code === "required" ? "unfilled" : "invalid" });
  }
  return { issues, other };
}
