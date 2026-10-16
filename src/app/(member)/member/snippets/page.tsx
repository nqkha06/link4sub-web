import type { Metadata } from "next";
import { SnippetsView } from "@/components/dashboard/views/snippets";

export const metadata: Metadata = {
  title: "Snippet",
};

export default function MemberSnippetsPage() {
  return <SnippetsView />;
}
