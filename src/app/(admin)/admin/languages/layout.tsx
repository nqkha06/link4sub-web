import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ngôn ngữ" };

export default function LanguagesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
