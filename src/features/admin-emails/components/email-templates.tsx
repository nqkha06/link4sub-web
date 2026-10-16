"use client";

import * as React from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { useUiLanguages } from "@/features/languages/hooks/use-ui-languages";
import { defaultLocale as emailTemplateDefaultLocale } from "@/i18n/config";

import {
  archiveEmailTemplate,
  createEmailTemplate,
  listEmailTemplateVariableCatalog,
  listEmailTemplates,
  previewEmailTemplate,
  sendTemplateTest,
  updateEmailTemplate,
  type EmailTemplatePayload,
} from "../api/emails.client";
import { toEmailTemplatePayload } from "../api/email-template-payload";
import { insertTemplateVariable } from "../template-variables";
import type {
  EmailCategory,
  EmailTemplate,
  EmailTemplateTranslation,
  EmailTemplateVariable,
  EmailTemplateVariableCatalogEntry,
} from "../types";
import {
  EmailEmptyState,
  EmailStatusBadge,
  useFormatEmailDate,
} from "./email-ui";
import {
  TemplateVariableGuide,
  type TemplateContentField,
} from "./template-variable-guide";

const emptyTemplate: EmailTemplatePayload & { code: string } = {
  code: "",
  name: "",
  description: "",
  category: "transactional",
  status: "draft",
  subject: "",
  preheader: "",
  htmlContent:
    "<h1>Xin chào {{user.name}}</h1>\n<p>Nội dung email của bạn.</p>",
  textContent: "",
  variables: [
    {
      key: "user.name",
      label: "Tên người dùng",
      type: "string",
      required: true,
      example: "Nguyễn An",
      description: "Tên hiển thị.",
    },
  ],
  senderId: null,
  translations: [],
};

/* -------------------------------------------------------------------------- */
/*                                Templates tab                               */
/* -------------------------------------------------------------------------- */

export function EmailTemplatesTab() {
  const t = useTranslations("Admin.emails");
  const formatEmailDate = useFormatEmailDate();
  const permissions = useAdminPermissions();

  const canCreate = permissions.includes("emails.templates.create");
  const canUpdate = permissions.includes("emails.templates.update");
  const canDelete = permissions.includes("emails.templates.delete");
  const canTest = permissions.includes("emails.test.send");

  const [items, setItems] = React.useState<EmailTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  const [page, setPage] = React.useState(1);

  const [pagination, setPagination] = React.useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 1,
  });

  const [editing, setEditing] = React.useState<
    EmailTemplate | "new" | null
  >(null);

  const [testTemplate, setTestTemplate] =
    React.useState<EmailTemplate | null>(null);

  const [archiving, setArchiving] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);

    try {
      const result = await listEmailTemplates({
        search,
        category,
        status,
        page,
      });

      setItems(result.data);
      setPagination(result.meta);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("templates.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [category, page, search, status, t]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 200);

    return () => window.clearTimeout(timeout);
  }, [load]);

  async function archive(template: EmailTemplate) {
    setArchiving(template.id);

    try {
      await archiveEmailTemplate(template.id);

      toast.success(t("templates.archived"));

      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("templates.archiveError"),
      );
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("templates.title")}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("templates.subtitle")}
          </p>
        </div>

        {canCreate ? (
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            {t("templates.new")}
          </Button>
        ) : null}
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b bg-muted/10 p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("templates.searchPlaceholder")}
              className="bg-background pl-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-background sm:w-40">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">{t("templates.allCategories")}</SelectItem>
                <SelectItem value="transactional">
                  {t("category.transactional")}
                </SelectItem>
                <SelectItem value="marketing">{t("category.marketing")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-background sm:w-36">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">{t("templates.allStatus")}</SelectItem>
                <SelectItem value="draft">{t("status.draft")}</SelectItem>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="archived">{t("status.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => void load()}
            aria-label={t("templates.refreshAria")}
            className="shrink-0 bg-background"
          >
            <RefreshCw
              className={`size-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[32%]">
                  {t("templates.columnTemplate")}
                </TableHead>

                <TableHead>{t("templates.code")}</TableHead>

                <TableHead>{t("preferences.category")}</TableHead>

                <TableHead>{t("table.status")}</TableHead>

                <TableHead>{t("templates.updatedColumn")}</TableHead>

                <TableHead className="w-32 text-right">
                  {t("senders.columnActions")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-64 text-center"
                  >
                    <LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : items.length ? (
                items.map((template) => (
                  <TableRow
                    key={template.id}
                    className="group"
                  >
                    <TableCell>
                      <div className="max-w-sm">
                        <button
                          type="button"
                          onClick={() => setEditing(template)}
                          className="block max-w-full text-left"
                        >
                          <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                            {template.name}
                          </p>
                        </button>

                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {template.subject || t("templates.noSubject")}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <code className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                        {template.code}
                      </code>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm capitalize">
                        {t(`category.${template.category}`)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <EmailStatusBadge status={template.status} />
                    </TableCell>

                    <TableCell>
                      <p className="text-sm">
                        {formatEmailDate(template.updatedAt)}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {template.updatedBy?.name || t("templates.systemUser")}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(template)}
                          aria-label={t("templates.editAria", { name: template.name })}
                        >
                          {canUpdate ? (
                            <Pencil className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>

                        {canTest &&
                        template.status !== "archived" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setTestTemplate(template)
                            }
                            aria-label={t("templates.sendTestAria", { name: template.name })}
                          >
                            <Send className="size-4" />
                          </Button>
                        ) : null}

                        {canDelete &&
                        template.status !== "archived" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            disabled={
                              archiving === template.id
                            }
                            onClick={() =>
                              void archive(template)
                            }
                            aria-label={t("templates.archiveAria", { name: template.name })}
                          >
                            {archiving === template.id ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <Archive className="size-4" />
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="p-0"
                  >
                    <EmailEmptyState
                      title={t("templates.emptyTitle")}
                      description={t("templates.emptyDescription")}
                      action={
                        canCreate ? (
                          <Button
                            onClick={() =>
                              setEditing("new")
                            }
                          >
                            <Plus className="size-4" />
                            {t("templates.new")}
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 ? (
          <div className="flex items-center justify-between border-t bg-muted/10 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {t("templates.pagination", {
                total: pagination.total,
                page: pagination.page,
                pages: pagination.totalPages,
              })}
            </p>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1 || loading}
                onClick={() =>
                  setPage((value) => value - 1)
                }
              >
                <ChevronLeft className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="icon-sm"
                disabled={
                  page >= pagination.totalPages || loading
                }
                onClick={() =>
                  setPage((value) => value + 1)
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <TemplateBuilderDialog
        template={
          editing === "new" ? null : editing
        }
        open={Boolean(editing)}
        readOnly={
          !canUpdate && editing !== "new"
        }
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />

      <TestEmailDialog
        template={testTemplate}
        open={Boolean(testTemplate)}
        onOpenChange={(open) => {
          if (!open) {
            setTestTemplate(null);
          }
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Quick test email                              */
/* -------------------------------------------------------------------------- */

export function QuickTestEmailDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Admin.emails");
  const [templates, setTemplates] = React.useState<
    EmailTemplate[]
  >([]);

  const [selectedId, setSelectedId] =
    React.useState("");

  React.useEffect(() => {
    if (!open) return;

    void listEmailTemplates({ page: 1 })
      .then((result) => {
        const eligible = result.data.filter(
          (item) => item.status !== "archived",
        );

        setTemplates(eligible);

        setSelectedId(
          String(eligible[0]?.id || ""),
        );
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : t("templates.loadManyError"),
        );
      });
  }, [open, t]);

  const template =
    templates.find(
      (item) => String(item.id) === selectedId,
    ) || null;

  return (
    <TestEmailDialog
      open={open}
      onOpenChange={onOpenChange}
      template={template}
      templateSelector={
        <Field label={t("templates.columnTemplate")}>
          <Select
            value={selectedId}
            onValueChange={setSelectedId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("templates.selectTemplate")} />
            </SelectTrigger>

            <SelectContent>
              {templates.map((item) => (
                <SelectItem
                  key={item.id}
                  value={String(item.id)}
                >
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                             Template builder                               */
/* -------------------------------------------------------------------------- */

function TemplateBuilderDialog({
  template,
  open,
  readOnly,
  onOpenChange,
  onSaved,
}: {
  template: EmailTemplate | null;
  open: boolean;
  readOnly: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const t = useTranslations("Admin.emails");
  const [form, setForm] =
    React.useState(emptyTemplate);

  const [saving, setSaving] =
    React.useState(false);

  const [device, setDevice] =
    React.useState<"desktop" | "mobile">(
      "desktop",
    );

  const [preview, setPreview] = React.useState<{
    subject: string;
    html: string;
    text: string;
  } | null>(null);

  const { items: languages } = useUiLanguages();

  const [activeLocale, setActiveLocale] =
    React.useState<string>(emailTemplateDefaultLocale);

  const [variableCatalog, setVariableCatalog] =
    React.useState<
      EmailTemplateVariableCatalogEntry[]
    >([]);

  const [
    catalogUnavailable,
    setCatalogUnavailable,
  ] = React.useState(false);

  const [insertTarget, setInsertTarget] =
    React.useState<TemplateContentField>(
      "htmlContent",
    );

  const lastFocusedField =
    React.useRef<TemplateContentField | null>(
      null,
    );

  const contentFields = React.useRef<
    Record<
      TemplateContentField,
      | HTMLInputElement
      | HTMLTextAreaElement
      | null
    >
  >({
    subject: null,
    preheader: null,
    htmlContent: null,
    textContent: null,
  });

  React.useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => {
      setForm(
        template
          ? {
              ...toEmailTemplatePayload({
                ...template,
                senderId: null,
              }),
              code: template.code,
            }
          : structuredClone(emptyTemplate),
      );

      setPreview(null);
      setActiveLocale(emailTemplateDefaultLocale);
      setInsertTarget("htmlContent");
      lastFocusedField.current = null;
      setDevice("desktop");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [open, template]);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    void listEmailTemplateVariableCatalog()
      .then((entries) => {
        if (cancelled) return;

        setVariableCatalog(entries);
        setCatalogUnavailable(false);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogUnavailable(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  function translationFor(
    locale: string,
  ): EmailTemplateTranslation {
    return (
      form.translations?.find(
        (translation) =>
          translation.locale === locale,
      ) || {
        locale,
        subject: "",
        preheader: "",
        htmlContent: "",
        textContent: "",
      }
    );
  }

  function updateTranslation(
    locale: string,
    patch: Partial<EmailTemplateTranslation>,
  ) {
    setForm((currentForm) => {
      const existing =
        currentForm.translations || [];

      const index = existing.findIndex(
        (translation) =>
          translation.locale === locale,
      );

      const current =
        index >= 0
          ? existing[index]
          : {
              locale,
              subject: "",
              preheader: "",
              htmlContent: "",
              textContent: "",
            };

      const next = {
        ...current,
        ...patch,
      };

      const translations =
        index >= 0
          ? existing.map(
              (translation, position) =>
                position === index
                  ? next
                  : translation,
            )
          : [...existing, next];

      return {
        ...currentForm,
        translations,
      };
    });
  }

  const isDefaultLocale =
    activeLocale === emailTemplateDefaultLocale;

  function fieldValue(
    key: TemplateContentField,
  ) {
    if (isDefaultLocale) {
      return form[key] || "";
    }

    return (
      translationFor(activeLocale)[key] || ""
    );
  }

  function setFieldValue(
    key: TemplateContentField,
    value: string,
  ) {
    setPreview(null);

    if (isDefaultLocale) {
      setForm((current) => ({
        ...current,
        [key]: value,
      }));

      return;
    }

    updateTranslation(activeLocale, {
      [key]: value,
    });
  }

  function focusContentField(
    field: TemplateContentField,
  ) {
    lastFocusedField.current = field;
    setInsertTarget(field);
  }

  function insertVariable(
    variable: EmailTemplateVariable,
    target: TemplateContentField,
  ) {
    const element =
      contentFields.current[target];

    const selection =
      lastFocusedField.current === target &&
      element?.selectionStart !== null &&
      element?.selectionStart !== undefined
        ? {
            start: element.selectionStart,
            end:
              element.selectionEnd ??
              element.selectionStart,
          }
        : undefined;

    const result = insertTemplateVariable(
      fieldValue(target),
      variable.key,
      selection,
    );

    setFieldValue(target, result.value);

    if (
      !form.variables.some(
        (item) => item.key === variable.key,
      )
    ) {
      setForm((current) => ({
        ...current,
        variables: current.variables.some(
          (item) =>
            item.key === variable.key,
        )
          ? current.variables
          : [...current.variables, variable],
      }));
    }

    window.requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(
        result.cursor,
        result.cursor,
      );
    });
  }

  const sampleData = React.useMemo(
    () =>
      Object.fromEntries(
        form.variables.map((variable) => [
          variable.key,
          variable.example ??
            `{{${variable.key}}}`,
        ]),
      ),
    [form.variables],
  );

  const catalogEntry =
    variableCatalog.find(
      (entry) =>
        entry.scope === "template" &&
        entry.code === form.code.trim(),
    ) || null;

  const globalVariables =
    variableCatalog.find(
      (entry) => entry.scope === "global",
    )?.variables || [];

  const localPreview = {
    subject: renderClient(
      fieldValue("subject"),
      sampleData,
    ),
    html: safePreviewHtml(
      renderClient(
        fieldValue("htmlContent"),
        sampleData,
      ),
    ),
    text: renderClient(
      fieldValue("textContent") || "",
      sampleData,
    ),
  };

  async function save() {
    setSaving(true);

    try {
      if (template) {
        await updateEmailTemplate(
          template.id,
          form,
        );
      } else {
        await createEmailTemplate(form);
      }

      toast.success(
        template
          ? t("templates.updated")
          : t("templates.created"),
      );

      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("templates.saveError"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function serverPreview() {
    if (!template) {
      setPreview(localPreview);
      return;
    }

    try {
      const result =
        await previewEmailTemplate(
          template.id,
          sampleData,
          isDefaultLocale
            ? undefined
            : activeLocale,
        );

      setPreview({
        subject: result.subject,
        html: result.html,
        text: result.text,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("templates.previewError"),
      );
    }
  }

  const rendered = preview || localPreview;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex h-[94vh] max-h-[94vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1500px)]">
        {/* Builder header */}
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <DialogTitle className="truncate">
                {template
                  ? template.name
                  : t("builder.newTitle")}
              </DialogTitle>

              <DialogDescription className="mt-1">
                {template
                  ? template.code
                  : t("builder.newDescription")}
              </DialogDescription>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  void serverPreview()
                }
              >
                <Eye className="size-4" />
                {t("builder.preview")}
              </Button>

              {!readOnly ? (
                <Button
                  onClick={() => void save()}
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}

                  {t("builder.save")}
                </Button>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        {/* Builder body */}
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(520px,1fr)_minmax(420px,0.85fr)]">
          {/* Editor */}
          <div className="min-h-0 overflow-y-auto border-r">
            <div className="mx-auto max-w-4xl p-5 lg:p-6">
              <div className="space-y-8">
                <EditorSection title={t("builder.sectionGeneral")}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("builder.templateName")}>
                      <Input
                        disabled={readOnly}
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder={t("builder.namePlaceholder")}
                      />
                    </Field>

                    <Field label={t("templates.code")}>
                      <Input
                        disabled={
                          readOnly ||
                          Boolean(template)
                        }
                        value={form.code}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            code: event.target.value
                              .toLowerCase()
                              .replace(
                                /[^a-z0-9_]/g,
                                "_",
                              ),
                          }))
                        }
                        placeholder="welcome_email"
                        className="font-mono"
                      />
                    </Field>

                    <Field label={t("preferences.category")}>
                      <Select
                        disabled={readOnly}
                        value={form.category}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            category:
                              value as EmailCategory,
                            senderId: null,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="transactional">
                            {t("category.transactional")}
                          </SelectItem>

                          <SelectItem value="marketing">
                            {t("category.marketing")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label={t("table.status")}>
                      <Select
                        disabled={readOnly}
                        value={form.status}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            status:
                              value as EmailTemplate["status"],
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="draft">
                            {t("status.draft")}
                          </SelectItem>

                          <SelectItem value="active">
                            {t("status.active")}
                          </SelectItem>

                          <SelectItem value="archived">
                            {t("status.archived")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label={t("preferences.description")}>
                    <Textarea
                      disabled={readOnly}
                      value={
                        form.description || ""
                      }
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description:
                            event.target.value,
                        }))
                      }
                      placeholder={t("builder.descriptionPlaceholder")}
                      className="min-h-20 resize-y"
                    />
                  </Field>
                </EditorSection>

                <EditorSection title={t("builder.sectionContent")}>
                  {languages.length > 1 ? (
                    <div className="space-y-2">
                      <Label>{t("builder.language")}</Label>

                      <div className="flex flex-wrap gap-2">
                        {languages.map(
                          (language) => (
                            <Button
                              key={
                                language.locale
                              }
                              type="button"
                              size="sm"
                              variant={
                                activeLocale ===
                                language.locale
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                setActiveLocale(
                                  language.locale,
                                );

                                setPreview(null);

                                lastFocusedField.current =
                                  null;
                              }}
                            >
                              {language.label}

                              {language.locale ===
                              emailTemplateDefaultLocale
                                ? t("builder.defaultSuffix")
                                : ""}
                            </Button>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("guide.fields.subject")}>
                      <Input
                        ref={(node) => {
                          contentFields.current.subject =
                            node;
                        }}
                        onFocus={() =>
                          focusContentField(
                            "subject",
                          )
                        }
                        disabled={readOnly}
                        value={fieldValue(
                          "subject",
                        )}
                        onChange={(event) =>
                          setFieldValue(
                            "subject",
                            event.target.value,
                          )
                        }
                        placeholder={t("builder.subjectPlaceholder")}
                      />
                    </Field>

                    <Field label={t("guide.fields.preheader")}>
                      <Input
                        ref={(node) => {
                          contentFields.current.preheader =
                            node;
                        }}
                        onFocus={() =>
                          focusContentField(
                            "preheader",
                          )
                        }
                        disabled={readOnly}
                        value={
                          fieldValue(
                            "preheader",
                          ) || ""
                        }
                        onChange={(event) =>
                          setFieldValue(
                            "preheader",
                            event.target.value,
                          )
                        }
                        placeholder={t("builder.preheaderPlaceholder")}
                      />
                    </Field>
                  </div>
                </EditorSection>

                <EditorSection title={t("builder.sectionVariables")}>
                  <TemplateVariableGuide
                    variables={form.variables}
                    globalVariables={globalVariables}
                    catalog={catalogEntry}
                    catalogUnavailable={
                      catalogUnavailable
                    }
                    content={{
                      subject:
                        fieldValue("subject"),
                      preheader:
                        fieldValue("preheader"),
                      htmlContent:
                        fieldValue("htmlContent"),
                      textContent:
                        fieldValue("textContent"),
                    }}
                    target={insertTarget}
                    disabled={readOnly}
                    onTargetChange={
                      setInsertTarget
                    }
                    onInsert={insertVariable}
                  />

                  <VariablesEditor
                    variables={form.variables}
                    disabled={readOnly}
                    onChange={(variables) => {
                      setForm((current) => ({
                        ...current,
                        variables,
                      }));

                      setPreview(null);
                    }}
                  />
                </EditorSection>

                <EditorSection title={t("builder.sectionBody")}>
                  <Field
                    label={t("guide.fields.html") + (isDefaultLocale ? "" : ` · ${activeLocale}`)}
                  >
                    <Textarea
                      ref={(node) => {
                        contentFields.current.htmlContent =
                          node;
                      }}
                      onFocus={() =>
                        focusContentField(
                          "htmlContent",
                        )
                      }
                      disabled={readOnly}
                      value={fieldValue(
                        "htmlContent",
                      )}
                      onChange={(event) =>
                        setFieldValue(
                          "htmlContent",
                          event.target.value,
                        )
                      }
                      className="min-h-80 resize-y bg-muted/20 font-mono text-xs leading-5"
                      spellCheck={false}
                      placeholder={
                        isDefaultLocale
                          ? "<h1>Hello</h1>"
                          : t("builder.emptyUsesDefault")
                      }
                    />
                  </Field>

                  <Field
                    label={t("guide.fields.plainText") + (isDefaultLocale ? "" : ` · ${activeLocale}`)}
                  >
                    <Textarea
                      ref={(node) => {
                        contentFields.current.textContent =
                          node;
                      }}
                      onFocus={() =>
                        focusContentField(
                          "textContent",
                        )
                      }
                      disabled={readOnly}
                      value={
                        fieldValue(
                          "textContent",
                        ) || ""
                      }
                      onChange={(event) =>
                        setFieldValue(
                          "textContent",
                          event.target.value,
                        )
                      }
                      className="min-h-40 resize-y bg-muted/20 font-mono text-xs leading-5"
                      spellCheck={false}
                      placeholder={t("builder.plainTextPlaceholder")}
                    />
                  </Field>
                </EditorSection>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="hidden min-h-0 flex-col bg-muted/20 lg:flex">
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
              <div>
                <p className="text-sm font-medium">
                  {t("builder.preview")}
                </p>

                <p className="text-xs text-muted-foreground">
                  {t("builder.sampleApplied")}
                </p>
              </div>

              <Tabs
                value={device}
                onValueChange={(value) =>
                  setDevice(
                    value as typeof device,
                  )
                }
              >
                <TabsList className="h-8">
                  <TabsTrigger
                    value="desktop"
                    className="h-7 px-2.5"
                  >
                    <Monitor className="size-4" />
                  </TabsTrigger>

                  <TabsTrigger
                    value="mobile"
                    className="h-7 px-2.5"
                  >
                    <Smartphone className="size-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-6">
              <div
                className={`mx-auto overflow-hidden rounded-xl border bg-background shadow-sm transition-[max-width] duration-200 ${
                  device === "mobile"
                    ? "max-w-[390px]"
                    : "max-w-[760px]"
                }`}
              >
                {/* Email client header */}
                <div className="border-b bg-white px-4 py-3 text-black">
                  <p className="truncate text-sm font-semibold">
                    {rendered.subject ||
                      t("builder.untitled")}
                  </p>

                  <p className="mt-1 truncate text-xs text-neutral-500">
                    {renderClient(
                      fieldValue("preheader"),
                      sampleData,
                    ) || t("builder.noPreheader")}
                  </p>
                </div>

                <iframe
                  title={t("builder.iframeTitle")}
                  sandbox=""
                  srcDoc={rendered.html}
                  className="h-[680px] w-full bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Variable editor                               */
/* -------------------------------------------------------------------------- */

function VariablesEditor({
  variables,
  disabled,
  onChange,
}: {
  variables: EmailTemplateVariable[];
  disabled: boolean;
  onChange: (
    variables: EmailTemplateVariable[],
  ) => void;
}) {
  const t = useTranslations("Admin.emails");

  function update(
    index: number,
    patch: Partial<EmailTemplateVariable>,
  ) {
    onChange(
      variables.map((variable, position) =>
        position === index
          ? {
              ...variable,
              ...patch,
            }
          : variable,
      ),
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">
          {t("builder.schema")}
          <span className="ml-2 font-normal text-muted-foreground">
            {variables.length}
          </span>
        </p>

        {!disabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange([
                ...variables,
                {
                  key: "variable",
                  label: "Biến mới",
                  type: "string",
                  required: false,
                  example: "Sample",
                  description: "",
                },
              ])
            }
          >
            <Plus className="size-4" />
            {t("builder.add")}
          </Button>
        ) : null}
      </div>

      {variables.length ? (
        <div className="space-y-2">
          {variables.map(
            (variable, index) => (
              <div
                key={`${index}-${variable.key}`}
                className="rounded-lg border bg-background p-3"
              >
                <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_130px_1fr_32px]">
                  <VariableFieldLabel label={t("builder.varKey")}>
                    <Input
                      disabled={disabled}
                      value={variable.key}
                      onChange={(event) =>
                        update(index, {
                          key: event.target.value,
                        })
                      }
                      placeholder="user.name"
                      className="font-mono text-xs"
                    />
                  </VariableFieldLabel>

                  <VariableFieldLabel label={t("builder.varLabel")}>
                    <Input
                      disabled={disabled}
                      value={variable.label}
                      onChange={(event) =>
                        update(index, {
                          label:
                            event.target.value,
                        })
                      }
                      placeholder={t("builder.varLabelPlaceholder")}
                    />
                  </VariableFieldLabel>

                  <VariableFieldLabel label={t("table.type")}>
                    <Select
                      disabled={disabled}
                      value={variable.type}
                      onValueChange={(value) =>
                        update(index, {
                          type: value as EmailTemplateVariable["type"],
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {[
                          "string",
                          "number",
                          "date",
                          "url",
                          "currency",
                        ].map((value) => (
                          <SelectItem
                            key={value}
                            value={value}
                          >
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </VariableFieldLabel>

                  <VariableFieldLabel label={t("builder.varExample")}>
                    <Input
                      disabled={disabled}
                      value={String(
                        variable.example ?? "",
                      )}
                      onChange={(event) =>
                        update(index, {
                          example:
                            event.target.value,
                        })
                      }
                      placeholder={t("builder.varExamplePlaceholder")}
                    />
                  </VariableFieldLabel>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      disabled={disabled}
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        onChange(
                          variables.filter(
                            (_, position) =>
                              position !== index,
                          ),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center">
                  <label className="flex shrink-0 cursor-pointer items-center gap-2">
                    <Switch
                      disabled={disabled}
                      checked={variable.required}
                      onCheckedChange={(
                        required,
                      ) =>
                        update(index, {
                          required,
                        })
                      }
                    />

                    <span className="text-xs font-medium">
                      {t("preferences.required")}
                    </span>
                  </label>

                  <Input
                    disabled={disabled}
                    value={
                      variable.description || ""
                    }
                    onChange={(event) =>
                      update(index, {
                        description:
                          event.target.value,
                      })
                    }
                    placeholder={t("builder.varDescriptionPlaceholder")}
                    className="h-8 flex-1 text-xs"
                  />
                </div>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {t("builder.noVariables")}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Test email dialog                             */
/* -------------------------------------------------------------------------- */

function TestEmailDialog({
  template,
  open,
  onOpenChange,
  templateSelector,
}: {
  template: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateSelector?: React.ReactNode;
}) {
  const t = useTranslations("Admin.emails");
  const [recipient, setRecipient] =
    React.useState("");

  const [confirming, setConfirming] =
    React.useState(false);

  const [sending, setSending] =
    React.useState(false);

  React.useEffect(() => {
    if (open) return;

    const timeout = window.setTimeout(() => {
      setRecipient("");
      setConfirming(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [open]);

  async function send() {
    if (!template) return;

    setSending(true);

    try {
      await sendTemplateTest(
        template.id,
        recipient,
      );

      toast.success(
        t("templates.testSent", { recipient }),
      );

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("templates.testError"),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {confirming
              ? t("test.reviewTitle")
              : t("test.sendTitle")}
          </DialogTitle>

          <DialogDescription>
            {confirming
              ? t("test.reviewDescription")
              : t("test.sendDescription")}
          </DialogDescription>
        </DialogHeader>

        {!confirming ? (
          <div className="space-y-4 py-1">
            {templateSelector}

            <Field label={t("table.recipient")}>
              <Input
                type="email"
                autoComplete="email"
                value={recipient}
                onChange={(event) =>
                  setRecipient(
                    event.target.value,
                  )
                }
                placeholder="qa@example.com"
              />
            </Field>

            {template ? (
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">
                  {template.name}
                </p>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {template.subject ||
                    t("templates.noSubject")}
                </p>
              </div>
            ) : (
              <Alert>
                <AlertTitle>
                  {t("test.noTemplateTitle")}
                </AlertTitle>

                <AlertDescription>
                  {t("test.noTemplateDescription")}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : template ? (
          <div className="overflow-hidden rounded-xl border">
            <ConfirmRow
              label={t("table.recipient")}
              value={recipient}
            />

            <ConfirmRow
              label={t("guide.fields.subject")}
              value={template.subject}
            />

            <ConfirmRow
              label={t("templates.columnTemplate")}
              value={template.code}
            />
          </div>
        ) : null}

        <DialogFooter>
          {confirming ? (
            <Button
              variant="outline"
              onClick={() =>
                setConfirming(false)
              }
            >
              {t("senders.back")}
            </Button>
          ) : null}

          <Button
            disabled={
              !template ||
              !recipient.includes("@") ||
              sending
            }
            onClick={() =>
              confirming
                ? void send()
                : setConfirming(true)
            }
          >
            {sending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}

            {confirming
              ? t("test.send")
              : t("senders.continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function EditorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b pb-2">
        <h3 className="text-sm font-semibold">
          {title}
        </h3>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function VariableFieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground md:hidden">
        {label}
      </p>

      {children}
    </div>
  );
}

function ConfirmRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b px-4 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-sm font-medium">
        {value || "—"}
      </span>
    </div>
  );
}

function renderClient(
  content: string,
  sample: Record<string, unknown>,
) {
  return content.replace(
    /{{\s*([a-zA-Z][a-zA-Z0-9.]*)\s*}}/g,
    (_match, key: string) =>
      String(sample[key] ?? `{{${key}}}`),
  );
}

function safePreviewHtml(html: string) {
  return html
    .replace(
      /<\/?(?:script|iframe)[^>]*>/gi,
      "",
    )
    .replace(
      /\son\w+\s*=\s*(["']).*?\1/gi,
      "",
    )
    .replace(/javascript:/gi, "");
}
