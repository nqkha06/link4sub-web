import type { Metadata } from "next";
import { FilesView } from "@/components/dashboard/views/files";

export const metadata: Metadata = {
  title: "Thư viện tệp",
};

export default function MemberFilesPage() {
  return <FilesView />;
}
