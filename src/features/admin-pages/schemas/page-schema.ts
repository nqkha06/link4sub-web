import { z } from "zod";

export const emptyTiptapDocument: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * Builds the page form schema with localized validation messages.
 * `t` must be a translator scoped to the `Admin.pages` namespace.
 */
export function createPageFormSchema(t: Translate) {
  return z.object({
  title: z
    .string()
    .trim()
    .min(1, t("validation.titleRequired"))
    .max(200, t("validation.titleMax", { max: 200 })),
  slug: z
    .string()
    .trim()
    .min(1, t("validation.slugRequired"))
    .max(180, t("validation.slugMax", { max: 180 }))
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      t("validation.slugFormat"),
    ),
  excerpt: z.string().max(500, t("validation.excerptMax", { max: 500 })),
  contentJson: z.custom<Record<string, unknown>>(
    (value) =>
      Boolean(value) &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).type === "doc",
    t("validation.contentInvalid"),
  ),
  contentHtml: z.string(),
  featuredImageId: z.number().int().positive().nullable(),
  seoTitle: z.string().max(200, t("validation.seoTitleMax", { max: 200 })),
  seoDescription: z
    .string()
    .max(320, t("validation.seoDescriptionMax", { max: 320 })),
  seoKeywords: z.string().max(500, t("validation.seoKeywordsMax", { max: 500 })),
  canonicalUrl: z
    .string()
    .refine(
      (value) => !value || URL.canParse(value),
      t("validation.canonicalInvalid"),
    ),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  sortOrder: z
    .number()
    .int(t("validation.sortOrderInteger"))
    .min(-1_000_000)
    .max(1_000_000),
  // Bản dịch theo locale; trường để trống sẽ dùng nội dung ngôn ngữ mặc định.
  translations: z.record(
    z.string(),
    z.object({
      title: z
        .string()
        .max(200, t("validation.titleMax", { max: 200 }))
        .optional(),
      excerpt: z
        .string()
        .max(500, t("validation.excerptMax", { max: 500 }))
        .optional(),
      contentJson: z.custom<Record<string, unknown>>().optional(),
      contentHtml: z.string().optional(),
      seoTitle: z
        .string()
        .max(200, t("validation.seoTitleMax", { max: 200 }))
        .optional(),
      seoDescription: z
        .string()
        .max(320, t("validation.seoDescriptionMax", { max: 320 }))
        .optional(),
      seoKeywords: z
        .string()
        .max(500, t("validation.seoKeywordsMax", { max: 500 }))
        .optional(),
    }),
  ),
  });
}

export type PageFormValues = z.infer<ReturnType<typeof createPageFormSchema>>;

export function slugifyPageTitle(value: string) {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[đĐ]/g, (character) => (character === "đ" ? "d" : "D"))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}
