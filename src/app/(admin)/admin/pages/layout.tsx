import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trang nội dung" };

export default function PagesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
