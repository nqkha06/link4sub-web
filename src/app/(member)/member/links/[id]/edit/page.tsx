import type { Metadata } from "next";
import { LinkEditPage } from "@/features/links/components/link-edit-page";

export const metadata: Metadata = {
  title: "Chỉnh sửa Social Link",
};

export default async function EditSocialLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <LinkEditPage linkId={id} />;
}
