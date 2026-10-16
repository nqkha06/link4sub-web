"use client";

import { useState } from "react";
import { AlertCircle, LoaderCircle, Paperclip, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/member/fields/input";
import { Textarea } from "@/components/member/fields/textarea";

import type { SupportController } from "./use-support-controller";

/**
 * Ô soạn tin nhắn nhanh ngay trên trang hỗ trợ. Gửi đi sẽ tạo một yêu cầu mới
 * với loại "Khác"; cần đính kèm tệp hoặc chọn loại thì mở biểu mẫu đầy đủ.
 */
export function SupportComposer({
  controller,
}: {
  controller: SupportController;
}) {
  const t = useTranslations("Support");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; content?: string }>(
    {},
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (subject.trim().length < 8) {
      nextErrors.subject = t("validation.subjectMin", { min: 8 });
    }
    if (content.trim().length < 20) {
      nextErrors.content = t("validation.contentMin", { min: 20 });
    }
    setErrors(nextErrors);
    if (nextErrors.subject || nextErrors.content) {
      document
        .getElementById(
          nextErrors.subject ? "support-quick-subject" : "support-quick-content",
        )
        ?.focus();
      return;
    }

    const created = await controller.createRequest({
      category: "other",
      subject: subject.trim(),
      content: content.trim(),
      relatedResource: "none",
      attachTechnicalInfo: true,
      attachments: [],
    });
    if (!created) return;
    // Màn hình "đã gửi" chỉ dành cho biểu mẫu đầy đủ.
    controller.setSuccessRequest(undefined);
    setSubject("");
    setContent("");
  };

  return (
    <form onSubmit={submit} className="space-y-3 px-5 py-5 sm:px-6">
      <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {t("composer.title")}
      </h2>

      <div className="space-y-1.5">
        <Input
          id="support-quick-subject"
          value={subject}
          onChange={(event) => {
            setSubject(event.target.value);
            if (errors.subject) setErrors((c) => ({ ...c, subject: undefined }));
          }}
          placeholder={t("composer.subjectPlaceholder")}
          aria-label={t("composer.subjectLabel")}
          aria-invalid={Boolean(errors.subject)}
          disabled={controller.submitting}
        />
        {errors.subject ? (
          <p role="alert" className="text-xs text-destructive">
            {errors.subject}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Textarea
          id="support-quick-content"
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            if (errors.content) setErrors((c) => ({ ...c, content: undefined }));
          }}
          placeholder={t("composer.contentPlaceholder")}
          aria-label={t("composer.contentLabel")}
          aria-invalid={Boolean(errors.content)}
          disabled={controller.submitting}
          className="min-h-36 resize-y"
        />
        {errors.content ? (
          <p role="alert" className="text-xs text-destructive">
            {errors.content}
          </p>
        ) : null}
      </div>

      {controller.submitError && !controller.requestSheetOpen ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{controller.submitError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          {t("composer.hint")}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={controller.submitting}
            onClick={() => controller.setRequestSheetOpen(true)}
          >
            <Paperclip aria-hidden />
            {t("composer.attach")}
          </Button>
          <Button type="submit" disabled={controller.submitting}>
            {controller.submitting ? (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <Send aria-hidden />
            )}
            {t("composer.send")}
          </Button>
        </div>
      </div>
    </form>
  );
}
