"use client";

import { useState, type DragEvent } from "react";

/** Kiểu dữ liệu kéo thả nội bộ của thư viện file. */
const DRAG_TYPE = "application/x-stu-file-items";

export type DraggedItems = { fileIds: string[]; folderIds: string[] };

export function startItemsDrag(event: DragEvent, items: DraggedItems) {
  event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(items));
  event.dataTransfer.effectAllowed = "move";
}

function readItems(event: DragEvent): DraggedItems | null {
  try {
    const raw = event.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraggedItems>;
    return { fileIds: parsed.fileIds ?? [], folderIds: parsed.folderIds ?? [] };
  } catch {
    return null;
  }
}

/**
 * Biến một phần tử thành nơi thả file/thư mục. Bỏ qua file kéo từ máy tính
 * (khung upload xử lý) và không cho thả thư mục vào chính nó.
 */
export function useDropTarget(targetFolderId: string | null, onDrop: (items: DraggedItems, target: string | null) => void) {
  const [over, setOver] = useState(false);
  const accepts = (event: DragEvent) => event.dataTransfer.types.includes(DRAG_TYPE);
  return {
    over,
    props: {
      onDragOver: (event: DragEvent) => {
        if (!accepts(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (event: DragEvent) => {
        setOver(false);
        if (!accepts(event)) return;
        event.preventDefault();
        const items = readItems(event);
        if (!items) return;
        const folderIds = items.folderIds.filter((id) => id !== targetFolderId);
        if (!items.fileIds.length && !folderIds.length) return;
        onDrop({ fileIds: items.fileIds, folderIds }, targetFolderId);
      },
    },
  };
}
