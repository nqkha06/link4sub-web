import type { Metadata } from "next"
import { LinkInBioEditPage } from "@/features/link-in-bio/components/link-in-bio-edit-page"
import { BIO_NEW_PAGE_PARAM, BIO_PUBLISH_INTENT_PARAM } from "@/features/link-in-bio/create/create-bio-page"

export const metadata: Metadata = {
  title: "Chỉnh sửa Link-in-bio",
}

export default async function EditLinkInBioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  return (
    <LinkInBioEditPage
      bioId={Number(id)}
      publishIntent={query[BIO_PUBLISH_INTENT_PARAM] === "1"}
      isNewPage={query[BIO_NEW_PAGE_PARAM] === "1"}
    />
  )
}
