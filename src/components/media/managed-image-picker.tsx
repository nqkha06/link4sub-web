"use client";

import type { ChangeEvent } from "react";
import * as React from "react";
import { useTranslations } from "next-intl";
import { useBusinessConfig } from "@/features/business-settings/use-business-config";
import { getUploadMimeType } from "@/lib/upload-compatibility";
import { uploadErrorMessage } from "@/lib/upload-request";

import { FilePickerCredenza } from "@/components/file-picker-credenza";
import {
  getFiles,
  type ManagedFileDto,
  uploadFile,
} from "@/lib/api-client";

const DEFAULT_IMAGE_MIME_PREFIXES = ["image/"] as const;

export function ManagedImagePicker({
  open,
  onOpenChange,
  selectedFileId,
  onSelect,
  onSelectMany,
  multiple = false,
  maxFiles,
  acceptedMimeTypes,
  maxSize,
  title = "Chọn ảnh từ Media Manager",
  acceptedMimePrefixes = DEFAULT_IMAGE_MIME_PREFIXES,
  assetLabel = "ảnh",
  accept = "image/*",
  uploadPurpose = "cover",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFileId?: string | null;
  onSelect: (file: ManagedFileDto) => void;
  onSelectMany?: (files: ManagedFileDto[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  acceptedMimeTypes?: readonly string[];
  maxSize?: number;
  title?: string;
  acceptedMimePrefixes?: readonly string[];
  assetLabel?: string;
  accept?: string;
  uploadPurpose?: "file" | "cover";
}) {
  const t = useTranslations("Uploads");
  const limits = useBusinessConfig().uploads;
  const sizeLimit = maxSize ?? (uploadPurpose === "cover" ? limits.coverImageMaxBytes : limits.memberFileMaxBytes);
  const uploadController = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => uploadController.current?.abort(), []);
  const [files, setFiles] = React.useState<ManagedFileDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const [finalizing, setFinalizing] = React.useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) uploadController.current?.abort();
    onOpenChange(nextOpen);
  }

  const loadFiles = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getFiles({
        sort: "date",
        direction: "desc",
        status: "active",
        limit: 100,
      });
      setFiles(response.data.filter((file) =>
        acceptedMimePrefixes.some((prefix) => file.mimeType.startsWith(prefix)) &&
        (!acceptedMimeTypes || acceptedMimeTypes.includes(file.mimeType.toLowerCase())) &&
        file.size <= sizeLimit,
      ));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải Media Manager.",
      );
    } finally {
      setLoading(false);
    }
  }, [acceptedMimePrefixes, acceptedMimeTypes, sizeLimit]);

  React.useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => void loadFiles(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadFiles, open]);

  async function handleFiles(selected: File[]) {
    if (uploadController.current) return;
    const images = selected.filter((file) =>
      acceptedMimePrefixes.some((prefix) => getUploadMimeType(file).startsWith(prefix)) &&
      (!acceptedMimeTypes || acceptedMimeTypes.includes(getUploadMimeType(file))) &&
      file.size > 0 && file.size <= sizeLimit,
    );
    if (!images.length) {
      setError(`${assetLabel} không đúng định dạng hoặc vượt quá dung lượng cho phép.`);
      return;
    }
    const selectedImages = multiple ? images : images.slice(0, 1);
    const uploadQueue = typeof maxFiles === "number"
      ? selectedImages.slice(0, maxFiles)
      : selectedImages;
    if (!uploadQueue.length) return;
    const controller = new AbortController();
    uploadController.current = controller;
    setUploading(true);
    setProgress(0);
    setFinalizing(false);
    setError("");
    try {
      const uploaded: ManagedFileDto[] = [];
      const totalBytes = uploadQueue.reduce((sum, file) => sum + file.size, 0);
      let completedBytes = 0;
      for (const image of uploadQueue) {
        setFinalizing(false);
        const file = await uploadFile(image, {
          purpose: uploadPurpose,
          signal: controller.signal,
          onProgress: (value) => setProgress(Math.min(99, Math.round((completedBytes + image.size * value / 100) / totalBytes * 100))),
          onFinalizing: () => setFinalizing(true),
        });
        uploaded.push(file);
        completedBytes += image.size;
        setFiles((current) => [file, ...current]);
      }
      controller.signal.throwIfAborted();
      setProgress(100);
      if (multiple && onSelectMany) {
        onSelectMany(uploaded);
      } else {
        onSelect(uploaded[0]);
      }
      onOpenChange(false);
    } catch (uploadError) {
      if (!controller.signal.aborted) setError(uploadErrorMessage(uploadError, t, t("failed")));
    } finally {
      uploadController.current = null;
      setUploading(false);
      setFinalizing(false);
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      void handleFiles(Array.from(event.target.files));
    }
    event.target.value = "";
  }

  return (
    <FilePickerCredenza
      open={open}
      onOpenChange={handleOpenChange}
      files={files}
      isLoading={loading}
      error={error}
      mode="cover"
      selectedFileId={selectedFileId ?? undefined}
      title={title}
      labels={{
        action: `Chọn ${assetLabel}`,
        close: "Đóng",
        empty: `Chưa có ${assetLabel} trong Media Manager.`,
        loading: `Đang tải ${assetLabel}...`,
        name: `Tên ${assetLabel}`,
        select: `Dùng ${assetLabel} này`,
        size: "Dung lượng",
        uploaded: "Ngày tải lên",
        search: `Tìm ${assetLabel}...`,
        filesTab: "Media Manager",
        uploadsTab: "Upload",
        dragHint: `Kéo ${assetLabel} vào đây hoặc chọn từ máy`,
        browseHint: `Chọn ${assetLabel} phù hợp từ thiết bị.`,
      }}
      upload={{
        accept,
        isUploading: uploading,
        label: `Chọn ${assetLabel}`,
        progress,
        uploadingLabel: finalizing ? t("finalizing") : t("uploading"),
        multiple,
        onChange: handleInput,
        onFiles: handleFiles,
      }}
      onSelect={(file) => {
        onSelect(file);
        onOpenChange(false);
      }}
    />
  );
}
