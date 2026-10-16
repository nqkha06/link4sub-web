import type { Metadata } from "next";

export const metadata: Metadata = { title: "Thông báo" };

export default function AnnouncementsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
