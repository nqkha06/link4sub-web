export type SnippetSortOption = "newest" | "oldest" | "name-asc" | "name-desc";

export function apiSnippetSort(sort: SnippetSortOption) {
  if (sort === "oldest") return { sortBy: "createdAt" as const, sortOrder: "asc" as const };
  if (sort === "name-asc") return { sortBy: "name" as const, sortOrder: "asc" as const };
  if (sort === "name-desc") return { sortBy: "name" as const, sortOrder: "desc" as const };
  return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
}

export function isValidSnippetSort(value: string | null): SnippetSortOption {
  return ["newest", "oldest", "name-asc", "name-desc"].includes(value ?? "")
    ? (value as SnippetSortOption)
    : "newest";
}
