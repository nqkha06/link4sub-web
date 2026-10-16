import type {
  PublicMenu,
  PublicMenuItem,
  PublicMenusResponse,
} from "./types";

export function menusInArea(data: PublicMenusResponse | undefined, area: string): PublicMenu[] {
  if (!data) return [];
  return (data.locations ?? [])
    .filter((location) => location.area === area)
    .flatMap((location) => data.menus[location.key] ? [data.menus[location.key]] : []);
}

export function menuItemsInArea(data: PublicMenusResponse | undefined, area: string): PublicMenuItem[] {
  return menusInArea(data, area).flatMap((menu) => menu.items);
}

export function resolveMenuHref(href: string, anchorPrefix = ""): string {
  const retiredAnchors: Record<string, string> = {
    "#why-us": "#why-link4sub",
    "#features": "#creator-loop",
    "#faqs": "/how-it-works#faq",
    "#get-started": "/create",
    "#link-flow": "/how-it-works#process",
  };
  const destination = retiredAnchors[href] ?? href;
  return anchorPrefix && destination.startsWith("#")
    ? `${anchorPrefix}${destination}`
    : destination;
}
