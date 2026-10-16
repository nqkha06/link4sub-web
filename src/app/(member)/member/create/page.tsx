import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { CreateWithOptionalDraft } from "./draft-bridge";

export const metadata: Metadata = {
  title: "Tạo Social Link",
};

export default function MemberCreatePage() {
  const pageTitle = "Tạo Social Link";

  return (
    <PageContainer>
      <PageHeader
        title={pageTitle}
        description="Tạo và cấu hình Social link để chia sẻ nội dung của bạn."
      />
      <CreateWithOptionalDraft />
    </PageContainer>
  );
}
