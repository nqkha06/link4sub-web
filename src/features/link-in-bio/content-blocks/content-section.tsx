"use client";

import {
  ChevronDown,
  FileDown,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Images,
  Landmark,
  Link2,
  Pencil,
  Plus,
  Share2,
  SeparatorHorizontal,
  Trash2,
  Type,
  Video,
  X,
} from "lucide-react";
import { useImperativeHandle, useState, type Ref } from "react";
import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ManagedImagePicker } from "@/components/media/managed-image-picker";
import { useBusinessConfig } from "@/features/business-settings/use-business-config";
import { Input } from "@/components/member/fields/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/member/fields/select";
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from "@/components/ui/sortable";
import { GalleryBlockEditor } from "@/features/link-in-bio/gallery/gallery-block-editor";
import { bioWidgetPlatformOptions } from "@/components/bio-widget-embed";
import { BankDetailsBlockEditor } from "./bank-details-block-editor";
import { DividerBlockEditor } from "./divider-block-editor";
import { TextBlockEditor } from "./text-block-editor";
import { DownloadCardEditor } from "./download-card-editor";
import {
  contentOrderKey,
  createGalleryBlock,
  GALLERY_ACCEPTED_MIME_TYPES,
  normalizeContentOrder,
} from "@/features/link-in-bio/gallery/gallery-types";
import { generateId } from "@/lib/id";
import {
  getFilePreviewUrl,
  type BioBankDetailsBlockDto,
  type BioContentOrderItemDto,
  type BioCustomLinkDto,
  type BioDividerBlockDto,
  type BioGalleryBlockDto,
  type BioSocialLinkDto,
  type BioTextBlockDto,
  type BioWidgetDto,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ContentBlockPickerDialog } from "./content-block-picker-dialog";
import { LinkAdvancedSettings } from "./link-animation-picker";
import type { ContentBlockPickerType } from "./content-block-registry";
import { createBankDetailsBlock, createDividerBlock, createTextBlock } from "./simple-content-types";
import { socialUrlForPlatformChange, socialUrlTemplate } from "./social-url-templates";
import { SocialIcon } from "../social-icon";
import type { ContentIssue } from "./content-issues";

const socialPlatforms = [
  "Instagram", "Twitter", "Facebook", "TikTok", "YouTube", "LinkedIn", "PayPal", "Venmo",
  "CashApp", "Spotify", "Apple Music", "Reddit", "Discord", "Twitch",
];

function focusBlockField(id: string) {
  window.setTimeout(() => document.getElementById(id)?.focus(), 0);
}

export type ContentSectionHandle = {
  /** Mở khối chứa ô lỗi, cuộn tới và focus vào ô đó. */
  revealIssue: (issue: ContentIssue) => void;
};

/** Dòng báo lỗi ngay dưới ô nhập. */
function FieldIssue({ id, issue }: { id: string; issue?: ContentIssue }) {
  return issue ? <p id={`${id}-issue`} className="text-xs leading-4 text-destructive">{issue.message}</p> : null;
}

export function ContentSection({
  customLinks,
  socialLinks,
  widgets,
  galleries,
  dividers,
  bankDetails,
  textBlocks,
  hiddenLinks,
  contentOrder,
  disabled,
  onCustomLinksChange,
  onSocialLinksChange,
  onWidgetsChange,
  onGalleriesChange,
  onDividersChange,
  onBankDetailsChange,
  onTextBlocksChange,
  onHiddenLinksChange,
  onContentOrderChange,
  issues = [],
  ref,
}: {
  customLinks: BioCustomLinkDto[];
  socialLinks: BioSocialLinkDto[];
  widgets: BioWidgetDto[];
  galleries: BioGalleryBlockDto[];
  dividers: BioDividerBlockDto[];
  bankDetails: BioBankDetailsBlockDto[];
  textBlocks: BioTextBlockDto[];
  hiddenLinks: string[];
  contentOrder: BioContentOrderItemDto[];
  disabled?: boolean;
  onCustomLinksChange: (links: BioCustomLinkDto[]) => void;
  onSocialLinksChange: (links: BioSocialLinkDto[]) => void;
  onWidgetsChange: (widgets: BioWidgetDto[]) => void;
  onGalleriesChange: (galleries: BioGalleryBlockDto[]) => void;
  onDividersChange: (dividers: BioDividerBlockDto[]) => void;
  onBankDetailsChange: (bankDetails: BioBankDetailsBlockDto[]) => void;
  onTextBlocksChange: (textBlocks: BioTextBlockDto[]) => void;
  onHiddenLinksChange: (ids: string[]) => void;
  onContentOrderChange: (order: BioContentOrderItemDto[]) => void;
  /** Ô bắt buộc còn trống / nhập sai (chỉ truyền sau khi người dùng bấm lưu). */
  issues?: ContentIssue[];
  ref?: Ref<ContentSectionHandle>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const validationT = useTranslations("BioValidation");
  const downloadT = useTranslations("BioDownload");
  const deleteT = useTranslations("BioContentDelete");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  useImperativeHandle(ref, () => ({
    revealIssue: (issue) => {
      setExpandedKey(issue.blockKey);
      // Chờ khối mở ra rồi mới cuộn + focus.
      window.setTimeout(() => {
        const field = document.getElementById(issue.fieldId);
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field?.focus({ preventScroll: true });
      }, 120);
    },
  }), []);
  const issueOf = (fieldId: string) => issues.find((issue) => issue.fieldId === fieldId);
  const invalidProps = (fieldId: string) => issueOf(fieldId)
    ? { "aria-invalid": true, "aria-describedby": `${fieldId}-issue` }
    : {};
  const [pendingDelete, setPendingDelete] = useState<BioContentOrderItemDto | null>(null);
  const [iconPickerLinkId, setIconPickerLinkId] = useState<string | null>(null);
  const imageMaxSize = useBusinessConfig().uploads.coverImageMaxBytes;
  const normalizedOrder = normalizeContentOrder(contentOrder, {
    socials: socialLinks,
    widgets,
    galleries,
    dividers,
    bankDetails,
    textBlocks,
    links: customLinks,
  });

  function appendOrder(item: BioContentOrderItemDto) {
    onContentOrderChange([...normalizedOrder, item]);
    setExpandedKey(contentOrderKey(item));
  }

  function addBlock(type: ContentBlockPickerType) {
    if (type === "download") {
      const id = `download-${generateId({ length: 10 })}`;
      onCustomLinksChange([...customLinks, { id, kind: "download", title: "", url: "", fileId: null, description: "", buttonText: "" }]);
      appendOrder({ type: "link", id });
      focusBlockField(`content-link-fileId-${id}`);
      return;
    }
    if (type === "link") {
      const id = `link-${generateId({ length: 10 })}`;
      onCustomLinksChange([...customLinks, { id, title: "", url: "", animationEffect: "none" }]);
      appendOrder({ type: "link", id });
      focusBlockField(`content-link-title-${id}`);
      return;
    }
    if (type === "gallery") {
      const gallery = createGalleryBlock(`gallery-${generateId({ length: 10 })}`);
      onGalleriesChange([...galleries, gallery]);
      appendOrder({ type: "gallery", id: gallery.id });
      focusBlockField(`gallery-title-${gallery.id}`);
      return;
    }
    if (type === "social") {
      if (socialLinks.length) return;
      const id = `social-${generateId({ length: 10 })}`;
      onSocialLinksChange([{ id, platform: "Instagram", url: socialUrlTemplate("Instagram"), enabled: true }]);
      appendOrder({ type: "social", id: "socials" });
      focusBlockField(`content-social-url-${id}`);
      return;
    }
    if (type === "divider") {
      const block = createDividerBlock(`divider-${generateId({ length: 10 })}`);
      onDividersChange([...dividers, block]);
      appendOrder({ type: "divider", id: block.id });
      return;
    }
    if (type === "bank-details") {
      const block = createBankDetailsBlock(`bank-${generateId({ length: 10 })}`);
      onBankDetailsChange([...bankDetails, block]);
      appendOrder({ type: "bank-details", id: block.id });
      focusBlockField(`bank-name-${block.id}`);
      return;
    }
    if (type === "text") {
      const block = createTextBlock(`text-${generateId({ length: 10 })}`);
      onTextBlocksChange([...textBlocks, block]);
      appendOrder({ type: "text", id: block.id });
      focusBlockField(`text-content-${block.id}`);
      return;
    }
    const id = `widget-${generateId({ length: 10 })}`;
    onWidgetsChange([...widgets, { id, type: bioWidgetPlatformOptions[0].value, title: "", url: "", description: "", enabled: true }]);
    appendOrder({ type: "widget", id });
    focusBlockField(`content-widget-title-${id}`);
  }

  function updateLink(id: string, patch: Partial<BioCustomLinkDto>) {
    onCustomLinksChange(customLinks.map((link) => link.id === id ? { ...link, ...patch } : link));
  }

  function updateWidget(id: string, patch: Partial<BioWidgetDto>) {
    onWidgetsChange(widgets.map((widget) => widget.id === id ? { ...widget, ...patch } : widget));
  }

  function updateGallery(nextGallery: BioGalleryBlockDto) {
    onGalleriesChange(galleries.map((gallery) => gallery.id === nextGallery.id ? nextGallery : gallery));
  }

  function updateDivider(nextBlock: BioDividerBlockDto) {
    onDividersChange(dividers.map((block) => block.id === nextBlock.id ? nextBlock : block));
  }

  function updateBankDetails(nextBlock: BioBankDetailsBlockDto) {
    onBankDetailsChange(bankDetails.map((block) => block.id === nextBlock.id ? nextBlock : block));
  }

  function updateTextBlock(nextBlock: BioTextBlockDto) {
    onTextBlocksChange(textBlocks.map((block) => block.id === nextBlock.id ? nextBlock : block));
  }

  function removeSocial(id: string) {
    const remaining = socialLinks.filter((social) => social.id !== id);
    onSocialLinksChange(remaining);
    if (remaining.length === 0) {
      onContentOrderChange(normalizedOrder.filter((item) => item.type !== "social"));
      setExpandedKey(null);
    }
  }

  function toggleVisibility(item: BioContentOrderItemDto, checked: boolean) {
    if (item.type === "link") {
      onHiddenLinksChange(checked ? hiddenLinks.filter((id) => id !== item.id) : [...hiddenLinks, item.id]);
    } else if (item.type === "gallery") {
      const gallery = galleries.find((entry) => entry.id === item.id);
      if (gallery) updateGallery({ ...gallery, enabled: checked });
    } else if (item.type === "widget") {
      updateWidget(item.id, { enabled: checked });
    } else if (item.type === "social") {
      onSocialLinksChange(socialLinks.map((social) => ({ ...social, enabled: checked })));
    } else if (item.type === "divider") {
      const block = dividers.find((entry) => entry.id === item.id);
      if (block) updateDivider({ ...block, enabled: checked });
    } else if (item.type === "text") {
      const block = textBlocks.find((entry) => entry.id === item.id);
      if (block) updateTextBlock({ ...block, enabled: checked });
    } else {
      const block = bankDetails.find((entry) => entry.id === item.id);
      if (block) updateBankDetails({ ...block, enabled: checked });
    }
  }

  function deleteBlock(item: BioContentOrderItemDto) {
    if (item.type === "link") {
      onCustomLinksChange(customLinks.filter((link) => link.id !== item.id));
      onHiddenLinksChange(hiddenLinks.filter((id) => id !== item.id));
    } else if (item.type === "gallery") {
      onGalleriesChange(galleries.filter((gallery) => gallery.id !== item.id));
    } else if (item.type === "widget") {
      onWidgetsChange(widgets.filter((widget) => widget.id !== item.id));
    } else if (item.type === "social") {
      onSocialLinksChange([]);
    } else if (item.type === "divider") {
      onDividersChange(dividers.filter((block) => block.id !== item.id));
    } else if (item.type === "text") {
      onTextBlocksChange(textBlocks.filter((block) => block.id !== item.id));
    } else {
      onBankDetailsChange(bankDetails.filter((block) => block.id !== item.id));
    }
    onContentOrderChange(normalizedOrder.filter((entry) => contentOrderKey(entry) !== contentOrderKey(item)));
    if (expandedKey === contentOrderKey(item)) setExpandedKey(null);
    setPendingDelete(null);
  }

  function blockMeta(item: BioContentOrderItemDto) {
    if (item.type === "link") {
      const link = customLinks.find((entry) => entry.id === item.id);
      if (link?.kind === "download") return { icon: FileDown, title: link.title || downloadT("blockTitle"), summary: link.downloadFile?.name || downloadT("noFile"), visible: !hiddenLinks.includes(item.id) };
      return { icon: Link2, title: link?.title || "Liên kết chưa đặt tên", summary: link?.url || "Chưa có URL", visible: !hiddenLinks.includes(item.id) };
    }
    if (item.type === "gallery") {
      const gallery = galleries.find((entry) => entry.id === item.id);
      return { icon: Images, title: gallery?.title || "Bộ sưu tập chưa đặt tên", summary: `${gallery?.images.length || 0} ảnh · ${gallery?.displayMode === "slider" ? "Slider" : "Grid"}`, visible: gallery?.enabled !== false };
    }
    if (item.type === "social") {
      return { icon: Share2, title: "Mạng xã hội", summary: `${socialLinks.length} hồ sơ`, visible: socialLinks.some((social) => social.enabled !== false) };
    }
    if (item.type === "divider") {
      const block = dividers.find((entry) => entry.id === item.id);
      return { icon: SeparatorHorizontal, title: block?.label || "Dấu phân cách", summary: block?.showLabel && block.label ? "Có nhãn" : "Đường phân cách", visible: block?.enabled !== false };
    }
    if (item.type === "bank-details") {
      const block = bankDetails.find((entry) => entry.id === item.id);
      return { icon: Landmark, title: block?.title || "Thông tin ngân hàng", summary: block?.bankName || "Chưa nhập ngân hàng", visible: block?.enabled !== false };
    }
    if (item.type === "text") {
      const block = textBlocks.find((entry) => entry.id === item.id);
      const textStyleLabel = block?.style === "subheading" ? "Tiêu đề phụ" : block?.style === "paragraph" ? "Đoạn văn" : "Tiêu đề lớn";
      return { icon: Type, title: block?.content?.trim().slice(0, 40) || "Văn bản / Tiêu đề", summary: textStyleLabel, visible: block?.enabled !== false };
    }
    const widget = widgets.find((entry) => entry.id === item.id);
    const platform = bioWidgetPlatformOptions.find((option) => option.value === widget?.type);
    return { icon: platform?.icon || Video, title: widget?.title || platform?.label || "Nội dung nhúng", summary: platform?.label || widget?.type || "Nhúng", visible: widget?.enabled !== false };
  }

  return (
    <>
      {normalizedOrder.length ? (
        <Sortable value={normalizedOrder} getItemValue={contentOrderKey} onValueChange={onContentOrderChange} orientation="vertical">
          <SortableContent className="space-y-2">
            {normalizedOrder.map((item) => {
              const key = contentOrderKey(item);
              const meta = blockMeta(item);
              const Icon = meta.icon;
              // Liên kết có icon riêng: hiện ảnh đó thay cho icon loại khối.
              const linkIconUrl = item.type === "link" ? customLinks.find((entry) => entry.id === item.id)?.iconUrl : undefined;
              const open = expandedKey === key;
              return (
                <SortableItem key={key} value={key} disabled={disabled} className={cn("overflow-hidden rounded-lg border bg-background", issues.some((issue) => issue.blockKey === key) ? "border-destructive/50" : "border-border")}>
                  <Collapsible open={open} onOpenChange={(nextOpen) => setExpandedKey(nextOpen ? key : null)}>
                    <div className="flex min-h-13 items-center gap-1.5 px-2 py-2">
                      <SortableItemHandle disabled={disabled} className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent" aria-label={`Kéo để sắp xếp ${meta.title}`}><GripVertical className="size-4" /></SortableItemHandle>
                      <button type="button" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setExpandedKey(open ? null : key)} aria-expanded={open}>
                        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">{linkIconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={linkIconUrl} alt="" className="size-full object-cover" />
                        ) : <Icon className="size-4" />}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-foreground">{meta.title}</span>{issues.some((issue) => issue.blockKey === key) ? <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-destructive"><span className="size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden />{validationT("review")}</span> : <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{meta.summary}</span>}</span>
                      </button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} onClick={() => toggleVisibility(item, !meta.visible)} aria-label={meta.visible ? `Ẩn ${meta.title}` : `Hiện ${meta.title}`} className="text-muted-foreground">{meta.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} onClick={() => setPendingDelete(item)} aria-label={`Xóa ${meta.title}`} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setExpandedKey(open ? null : key)} aria-label={open ? `Thu gọn ${meta.title}` : `Chỉnh sửa ${meta.title}`}><ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} /></Button>
                    </div>
                    <CollapsibleContent>
                      <div className="border-t border-border bg-muted/10 p-3 sm:p-4">
                        {item.type === "link" ? (() => {
                          const link = customLinks.find((entry) => entry.id === item.id);
                          if (link?.kind === "download") return <DownloadCardEditor block={link} onChange={(patch) => updateLink(link.id, patch)} disabled={disabled} issues={issues.filter((issue) => issue.blockKey === key)} />;
                          return link ? (
                            <div className="space-y-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-2"><Label htmlFor={`content-link-title-${link.id}`}>Tiêu đề <span className="text-destructive">*</span></Label><Input disabled={disabled} id={`content-link-title-${link.id}`} {...invalidProps(`content-link-title-${link.id}`)} value={link.title} onChange={(event) => updateLink(link.id, { title: event.target.value })} placeholder="Shop ở đây" /><FieldIssue id={`content-link-title-${link.id}`} issue={issueOf(`content-link-title-${link.id}`)} /></div>
                                <div className="grid gap-2"><Label htmlFor={`content-link-url-${link.id}`}>URL <span className="text-destructive">*</span></Label><Input disabled={disabled} id={`content-link-url-${link.id}`} {...invalidProps(`content-link-url-${link.id}`)} value={link.url} onChange={(event) => updateLink(link.id, { url: event.target.value })} placeholder="https://example.com" /><FieldIssue id={`content-link-url-${link.id}`} issue={issueOf(`content-link-url-${link.id}`)} /></div>
                              </div>
                              <LinkAdvancedSettings
                                effect={link.animationEffect}
                                disabled={disabled}
                                onChange={(animationEffect) => updateLink(link.id, { animationEffect })}
                                iconSlot={
                                  <div className="relative size-14">
                                    <button
                                      type="button"
                                      disabled={disabled}
                                      onClick={() => setIconPickerLinkId(link.id)}
                                      aria-label={link.iconUrl ? "Đổi icon" : "Chọn icon"}
                                      title={link.iconUrl ? "Đổi icon" : "Chọn icon"}
                                      className="grid size-14 place-items-center overflow-hidden rounded-xl border border-border bg-muted text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                      {link.iconUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={link.iconUrl} alt="" className="size-full object-cover" />
                                      ) : (
                                        <ImageIcon className="size-5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={disabled}
                                      onClick={() => setIconPickerLinkId(link.id)}
                                      aria-label={link.iconUrl ? "Đổi icon" : "Chọn icon"}
                                      className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                      <Pencil className="size-3" />
                                    </button>
                                    {link.iconUrl ? (
                                      <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => updateLink(link.id, { iconFileId: undefined, iconUrl: undefined })}
                                        aria-label="Gỡ icon"
                                        title="Gỡ icon"
                                        className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm hover:bg-destructive hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                      >
                                        <X className="size-3" />
                                      </button>
                                    ) : null}
                                  </div>
                                }
                              />
                            </div>
                          ) : null;
                        })() : item.type === "gallery" ? (() => {
                          const gallery = galleries.find((entry) => entry.id === item.id);
                          return gallery ? <GalleryBlockEditor gallery={gallery} onChange={updateGallery} onDelete={() => setPendingDelete(item)} disabled={disabled} embedded /> : null;
                        })() : item.type === "divider" ? (() => {
                          const block = dividers.find((entry) => entry.id === item.id);
                          return block ? <DividerBlockEditor block={block} onChange={updateDivider} disabled={disabled} /> : null;
                        })() : item.type === "bank-details" ? (() => {
                          const block = bankDetails.find((entry) => entry.id === item.id);
                          return block ? <BankDetailsBlockEditor block={block} onChange={updateBankDetails} disabled={disabled} errors={Object.fromEntries(issues.filter((issue) => issue.blockKey === key).map((issue) => [issue.fieldId, issue.message]))} /> : null;
                        })() : item.type === "text" ? (() => {
                          const block = textBlocks.find((entry) => entry.id === item.id);
                          return block ? <TextBlockEditor block={block} onChange={updateTextBlock} disabled={disabled} /> : null;
                        })() : item.type === "social" ? (
                          <div className="space-y-3">
                            {socialLinks.map((social) => <div key={social.id} className="grid gap-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] sm:items-start"><div className="grid gap-2"><Label>Nền tảng</Label><Select disabled={disabled} value={social.platform} onValueChange={(platform) => onSocialLinksChange(socialLinks.map((entry) => entry.id === social.id ? { ...entry, platform, url: socialUrlForPlatformChange(entry.url, platform) } : entry))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{socialPlatforms.map((platform) => <SelectItem key={platform} value={platform}><SocialIcon platform={platform} className="size-4 shrink-0" />{platform}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor={`content-social-url-${social.id}`}>URL hồ sơ <span className="text-destructive">*</span></Label><Input disabled={disabled} id={`content-social-url-${social.id}`} {...invalidProps(`content-social-url-${social.id}`)} value={social.url} onChange={(event) => onSocialLinksChange(socialLinks.map((entry) => entry.id === social.id ? { ...entry, url: event.target.value } : entry))} placeholder={socialUrlTemplate(social.platform) ? `${socialUrlTemplate(social.platform)}ten-cua-ban` : "https://..."} /><FieldIssue id={`content-social-url-${social.id}`} issue={issueOf(`content-social-url-${social.id}`)} /></div><Button disabled={disabled} type="button" variant="ghost" size="icon" className="sm:mt-[1.375rem]" aria-label={`Xóa ${social.platform}`} onClick={() => removeSocial(social.id)}><Trash2 /></Button></div>)}
                            <Button disabled={disabled} type="button" variant="outline" className="w-full border-dashed" onClick={() => { const id = `social-${generateId({ length: 10 })}`; onSocialLinksChange([...socialLinks, { id, platform: "Instagram", url: socialUrlTemplate("Instagram"), enabled: true }]); focusBlockField(`content-social-url-${id}`); }}><Plus />Thêm mạng xã hội</Button>
                          </div>
                        ) : (() => {
                          const widget = widgets.find((entry) => entry.id === item.id);
                          if (!widget) return null;
                          const platform = bioWidgetPlatformOptions.find((option) => option.value === widget.type) || bioWidgetPlatformOptions[0];
                          return (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor={`content-widget-type-${widget.id}`}>Loại nhúng</Label>
                                <Select disabled={disabled} value={widget.type} onValueChange={(type) => updateWidget(widget.id, { type })}>
                                  <SelectTrigger id={`content-widget-type-${widget.id}`}><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {bioWidgetPlatformOptions.map((option) => {
                                      const OptionIcon = option.icon;
                                      return (
                                        <SelectItem key={option.value} value={option.value}>
                                          <span className="flex items-center gap-2"><OptionIcon className="size-4" />{option.label}</span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`content-widget-title-${widget.id}`}>Tiêu đề</Label>
                                <Input disabled={disabled} id={`content-widget-title-${widget.id}`} maxLength={120} {...invalidProps(`content-widget-title-${widget.id}`)} value={widget.title} onChange={(event) => updateWidget(widget.id, { title: event.target.value })} placeholder="Không bắt buộc" />
                                <FieldIssue id={`content-widget-title-${widget.id}`} issue={issueOf(`content-widget-title-${widget.id}`)} />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`content-widget-url-${widget.id}`}>URL <span className="text-destructive">*</span></Label>
                                <Input disabled={disabled} id={`content-widget-url-${widget.id}`} {...invalidProps(`content-widget-url-${widget.id}`)} value={widget.url} onChange={(event) => updateWidget(widget.id, { url: event.target.value })} placeholder={platform.placeholder} />
                                <FieldIssue id={`content-widget-url-${widget.id}`} issue={issueOf(`content-widget-url-${widget.id}`)} />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </SortableItem>
              );
            })}
          </SortableContent>
        </Sortable>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/15 px-4 py-7 text-center"><p className="text-sm font-medium text-foreground">Chưa có nội dung</p><p className="mt-1 text-xs text-muted-foreground">Thêm liên kết, bộ sưu tập hoặc nội dung media vào trang.</p></div>
      )}

      <Button type="button" variant="outline" className="h-10 w-full border-dashed shadow-none" disabled={disabled} onClick={() => setPickerOpen(true)}><Plus className="size-4" />Thêm nội dung</Button>
      <ContentBlockPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={addBlock} isTypeAdded={(type) => type === "social" && socialLinks.length > 0} onEditExisting={(type) => { if (type !== "social") return; setExpandedKey(contentOrderKey({ type: "social", id: "socials" })); if (socialLinks[0]) focusBlockField(`content-social-url-${socialLinks[0].id}`); }} />

      <ManagedImagePicker
        open={Boolean(iconPickerLinkId)}
        onOpenChange={(open) => { if (!open) setIconPickerLinkId(null); }}
        selectedFileId={customLinks.find((link) => link.id === iconPickerLinkId)?.iconFileId}
        acceptedMimeTypes={GALLERY_ACCEPTED_MIME_TYPES}
        maxSize={imageMaxSize}
        title="Chọn ảnh làm icon cho liên kết"
        onSelect={(file) => {
          if (iconPickerLinkId) {
            updateLink(iconPickerLinkId, { iconFileId: file.id, iconUrl: getFilePreviewUrl(file) });
          }
          setIconPickerLinkId(null);
        }}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{deleteT("title")}</AlertDialogTitle>
          <AlertDialogDescription>{deleteT("description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row max-sm:[&>button]:flex-1">
            <AlertDialogCancel className="min-h-11">{deleteT("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" variant="destructive" onClick={() => pendingDelete && deleteBlock(pendingDelete)}>{deleteT("confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
