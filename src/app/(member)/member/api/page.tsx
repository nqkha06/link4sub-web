import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageContainer } from "@/components/dashboard/ui"
import { MemberApiPage } from "@/features/member-api/components/member-api-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("MemberApi")
  return { title: t("title") }
}

export default function MemberApiManagementPage() {
  return (
    <PageContainer className="min-w-0">
      <MemberApiPage />
    </PageContainer>
  )
}
