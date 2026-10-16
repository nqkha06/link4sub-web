import { monetizationActionIconKeys, type MonetizationActionIconKey } from "@/contracts";
import {
  BellRing, Download, ExternalLink, Gift, Globe2, Heart, Link2,
  Megaphone, MousePointerClick, Play, ShoppingBag, Star, Tag,
  ThumbsUp, UserPlus, Users, type LucideIcon,
} from "lucide-react";

/**
 * `label` is the default (Vietnamese) text kept for backwards compatibility;
 * UI code should translate `labelKey` under the Admin.monetizationActionIcons namespace.
 */
const icons: Record<MonetizationActionIconKey, { label: string; icon: LucideIcon }> = {
  globe: { label: "Website", icon: Globe2 },
  "mouse-pointer-click": { label: "Nhấp chuột", icon: MousePointerClick },
  "external-link": { label: "Mở liên kết", icon: ExternalLink },
  megaphone: { label: "Quảng cáo", icon: Megaphone },
  gift: { label: "Quà tặng", icon: Gift },
  "shopping-bag": { label: "Mua sắm", icon: ShoppingBag },
  tag: { label: "Ưu đãi", icon: Tag },
  download: { label: "Tải xuống", icon: Download },
  play: { label: "Xem video", icon: Play },
  heart: { label: "Yêu thích", icon: Heart },
  "thumbs-up": { label: "Thích", icon: ThumbsUp },
  users: { label: "Cộng đồng", icon: Users },
  "user-plus": { label: "Theo dõi", icon: UserPlus },
  bell: { label: "Thông báo", icon: BellRing },
  link: { label: "Liên kết", icon: Link2 },
  star: { label: "Ngôi sao", icon: Star },
};

export const monetizationActionIconOptions = monetizationActionIconKeys.map(
  (value) => ({ value, labelKey: value, ...icons[value] }),
);

export function getMonetizationActionIcon(key?: string | null): LucideIcon | undefined {
  return monetizationActionIconOptions.find((option) => option.value === key)?.icon;
}
