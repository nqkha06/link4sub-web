import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trình đơn trang web" };

export default function MenusLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
