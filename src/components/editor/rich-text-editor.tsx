"use client";

import { Image as TiptapImage } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import {
  EditorContent,
  type JSONContent,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useTranslations } from "next-intl";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Code,
  CodeXml,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import * as React from "react";

import { AdminMediaPicker } from "@/components/admin-media/admin-media-picker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: Record<string, unknown>;
  onChange: (value: {
    json: Record<string, unknown>;
    html: string;
  }) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("Admin.richTextEditor");
  const [imagePickerOpen, setImagePickerOpen] = React.useState(false);
  const [codeMode, setCodeMode] = React.useState(false);
  const [source, setSource] = React.useState("");
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TiptapImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full rounded-lg border",
        },
      }),
      Placeholder.configure({
        placeholder: t("placeholder"),
      }),
    ],
    content: value as JSONContent,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-96 px-5 py-4 text-sm leading-7 outline-none " +
          "[&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold " +
          "[&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold " +
          "[&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold " +
          "[&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold " +
          "[&_p]:mb-3 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 " +
          "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 " +
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 " +
          "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 " +
          "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 " +
          "[&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2 " +
          "[&_a]:text-primary [&_a]:underline [&_img]:my-4 [&_hr]:my-6 " +
          "[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left " +
          "[&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground " +
          "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange({
        json: current.getJSON() as Record<string, unknown>,
        html: current.getHTML(),
      });
    },
  });

  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-96 animate-pulse rounded-lg border bg-muted/30",
          className,
        )}
      />
    );
  }

  function toggleCodeMode() {
    if (!editor) return;
    if (!codeMode) setSource(formatHtmlSource(editor.getHTML()));
    setCodeMode(!codeMode);
  }

  function applySource(html: string) {
    if (!editor) return;
    setSource(html);
    // Tiptap chuẩn hóa HTML theo schema; JSON và HTML luôn được lưu đồng bộ.
    editor.commands.setContent(html, { emitUpdate: false });
    onChange({
      json: editor.getJSON() as Record<string, unknown>,
      html: editor.getHTML(),
    });
  }

  function setLink() {
    const previous = editor?.getAttributes("link").href as string | undefined;
    const href = window.prompt(t("linkPrompt"), previous || "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: href.trim(), target: "_blank" })
      .run();
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-background",
          disabled && "opacity-70",
          className,
        )}
      >
        <div className="flex items-start gap-1 border-b bg-muted/20 p-2">
          <fieldset
            disabled={codeMode}
            className="flex max-h-32 min-w-0 flex-1 flex-wrap items-center gap-1 overflow-y-auto disabled:opacity-50"
          >
          <EditorButton
            label={t("undo")}
            disabled={!editor.can().chain().focus().undo().run()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 />
          </EditorButton>
          <EditorButton
            label={t("redo")}
            disabled={!editor.can().chain().focus().redo().run()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 />
          </EditorButton>
          <ToolbarSeparator />
          {([1, 2, 3, 4] as const).map((level) => {
            const Icon = [Heading1, Heading2, Heading3, Heading4][level - 1]!;
            return (
              <EditorButton
                key={level}
                label={t("heading", { level })}
                active={editor.isActive("heading", { level })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level }).run()
                }
              >
                <Icon />
              </EditorButton>
            );
          })}
          <EditorButton
            label={t("paragraph")}
            active={editor.isActive("paragraph")}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <Pilcrow />
          </EditorButton>
          <ToolbarSeparator />
          <EditorButton
            label={t("bold")}
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold />
          </EditorButton>
          <EditorButton
            label={t("italic")}
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic />
          </EditorButton>
          <EditorButton
            label={t("underline")}
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline />
          </EditorButton>
          <EditorButton
            label={t("strike")}
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough />
          </EditorButton>
          <EditorButton
            label={t("inlineCode")}
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code />
          </EditorButton>
          <ToolbarSeparator />
          <EditorButton
            label={t("bulletList")}
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List />
          </EditorButton>
          <EditorButton
            label={t("orderedList")}
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered />
          </EditorButton>
          <EditorButton
            label={t("taskList")}
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <ListChecks />
          </EditorButton>
          <EditorButton
            label={t("blockquote")}
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote />
          </EditorButton>
          <EditorButton
            label={t("codeBlock")}
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Braces />
          </EditorButton>
          <EditorButton
            label={t("horizontalRule")}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus />
          </EditorButton>
          <ToolbarSeparator />
          <EditorButton
            label={t("addLink")}
            active={editor.isActive("link")}
            onClick={setLink}
          >
            <Link2 />
          </EditorButton>
          <EditorButton
            label={t("removeLink")}
            disabled={!editor.isActive("link")}
            onClick={() =>
              editor.chain().focus().extendMarkRange("link").unsetLink().run()
            }
          >
            <Unlink />
          </EditorButton>
          <EditorButton
            label={t("addImage")}
            onClick={() => setImagePickerOpen(true)}
          >
            <ImagePlus />
          </EditorButton>
          <ToolbarSeparator />
          {[
            ["left", AlignLeft, t("alignLeft")],
            ["center", AlignCenter, t("alignCenter")],
            ["right", AlignRight, t("alignRight")],
            ["justify", AlignJustify, t("alignJustify")],
          ].map(([alignment, Icon, label]) => (
            <EditorButton
              key={alignment as string}
              label={label as string}
              active={editor.isActive({ textAlign: alignment as string })}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setTextAlign(alignment as string)
                  .run()
              }
            >
              {React.createElement(Icon as React.ComponentType)}
            </EditorButton>
          ))}
          <ToolbarSeparator />
          <EditorButton
            label={t("clearFormatting")}
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <Eraser />
          </EditorButton>
          </fieldset>
          <EditorButton
            label={codeMode ? t("visualMode") : t("codeMode")}
            active={codeMode}
            disabled={disabled}
            onClick={toggleCodeMode}
          >
            <CodeXml />
          </EditorButton>
        </div>
        {codeMode ? (
          <textarea
            value={source}
            disabled={disabled}
            spellCheck={false}
            aria-label={t("codeMode")}
            placeholder={t("codePlaceholder")}
            className="block min-h-96 w-full resize-y bg-background px-5 py-4 font-mono text-sm leading-6 outline-none"
            onChange={(event) => applySource(event.target.value)}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      <AdminMediaPicker
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        title={t("imagePickerTitle")}
        onSelect={(file) => {
          editor
            .chain()
            .focus()
            .setImage({
              src: file.url,
              alt: file.altText || file.fileName,
              title: file.fileName,
            })
            .run();
        }}
      />
    </TooltipProvider>
  );
}

function EditorButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={active ? "secondary" : "ghost"}
          size="icon-sm"
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Xuống dòng sau các thẻ khối để mã HTML dễ đọc; không đụng tới thẻ inline. */
function formatHtmlSource(html: string) {
  return html.replace(
    /(<\/(?:p|h[1-6]|ul|ol|li|blockquote|pre|div)>|<hr[^>]*>|<(?:ul|ol|blockquote|li)(?:\s[^>]*)?>)(?=<)/g,
    "$1\n",
  );
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="mx-1 h-6" />;
}
