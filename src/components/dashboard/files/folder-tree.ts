export type FolderLike = { id: string; parentId: string | null; name: string };

/** Đường dẫn từ gốc tới thư mục (không gồm "Tất cả file"). */
export function folderPath<T extends FolderLike>(folders: T[], id: string | null): T[] {
  if (!id) return [];
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: T[] = [];
  const seen = new Set<string>();
  let cursor = byId.get(id);
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    path.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return path;
}

export function childFolders<T extends FolderLike>(folders: T[], parentId: string | null): T[] {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
}

/** Các thư mục đã cho cùng mọi thư mục con cháu (không thể là đích di chuyển). */
export function withDescendants(folders: FolderLike[], ids: Iterable<string>): Set<string> {
  const result = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (folder.parentId && result.has(folder.parentId) && !result.has(folder.id)) {
        result.add(folder.id);
        changed = true;
      }
    }
  }
  return result;
}
