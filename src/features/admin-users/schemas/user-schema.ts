import { z } from "zod";

import { userStatuses } from "../types.ts";

/**
 * Translator for validation messages. Keys are relative to the `Admin.users`
 * namespace (e.g. `validation.passwordMin`). The default export below uses an
 * identity translator so the schema stays usable outside React (tests, server).
 */
export type UserSchemaTranslate = (key: string) => string;

function createPasswordSchema(t: UserSchemaTranslate) {
  return z
    .string()
    .min(8, t("validation.passwordMin"))
    .max(128, t("validation.passwordMax"))
    .regex(/[a-z]/, t("validation.passwordLower"))
    .regex(/[A-Z]/, t("validation.passwordUpper"))
    .regex(/\d/, t("validation.passwordDigit"));
}

function createSharedFields(t: UserSchemaTranslate) {
  return {
    name: z
      .string()
      .trim()
      .min(2, t("validation.nameMin"))
      .max(100, t("validation.nameMax")),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email(t("validation.emailInvalid"))
      .max(254, t("validation.emailMax")),
    avatar: z
      .string()
      .trim()
      .max(2048, t("validation.avatarTooLong"))
      .refine(
        (value) => !value || URL.canParse(value),
        t("validation.avatarInvalid"),
      ),
    roles: z.array(z.string()).min(1, t("validation.rolesMin")),
    permissions: z.array(z.string()),
    monetizationLevelId: z.number().int().positive().nullable(),
    status: z.enum(userStatuses),
  };
}

export function createUserEditorFormSchema(t: UserSchemaTranslate) {
  const sharedFields = createSharedFields(t);
  return z.discriminatedUnion("mode", [
    z
      .object({
        mode: z.literal("create"),
        ...sharedFields,
        password: createPasswordSchema(t),
        confirmPassword: z.string(),
      })
      .refine((values) => values.password === values.confirmPassword, {
        path: ["confirmPassword"],
        message: t("validation.confirmMismatch"),
      }),
    z.object({
      mode: z.literal("edit"),
      ...sharedFields,
      password: z.literal(""),
      confirmPassword: z.literal(""),
    }),
  ]);
}

/** Schema with message keys as error messages (no i18n runtime needed). */
export const userEditorFormSchema = createUserEditorFormSchema((key) => key);

export type UserEditorFormValues = z.infer<typeof userEditorFormSchema>;
