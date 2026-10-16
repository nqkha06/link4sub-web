export const monetizationActionIconKeys = [
  "globe", "mouse-pointer-click", "external-link", "megaphone",
  "gift", "shopping-bag", "tag", "download", "play", "heart",
  "thumbs-up", "users", "user-plus", "bell", "link", "star",
] as const;

export type MonetizationActionIconKey = (typeof monetizationActionIconKeys)[number];
