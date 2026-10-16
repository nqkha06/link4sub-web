import type { EmailTemplatePayload } from "./emails.client";

export function toEmailTemplatePayload(form: EmailTemplatePayload): EmailTemplatePayload {
  return {
    name: form.name,
    description: form.description,
    category: form.category,
    status: form.status,
    subject: form.subject,
    preheader: form.preheader,
    htmlContent: form.htmlContent,
    textContent: form.textContent,
    variables: form.variables.map((variable) => ({
      key: variable.key,
      label: variable.label,
      type: variable.type,
      required: variable.required,
      example: variable.example,
      description: variable.description,
    })),
    senderId: form.senderId,
    translations: form.translations?.map((translation) => ({
      locale: translation.locale,
      subject: translation.subject,
      preheader: translation.preheader,
      htmlContent: translation.htmlContent,
      textContent: translation.textContent,
    })),
  };
}
