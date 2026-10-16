"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CircleAlert, LoaderCircle, ChevronLeft } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageContainer } from "@/components/dashboard/ui"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { BioPageDto } from "@/lib/api-client"

import LinkInBioGenerator from "./link-in-bio-generator"

export function LinkInBioEditorPage({
  mode,
  initialBio,
  publishIntent = false,
  isNewPage = false,
}: {
  mode: "create" | "edit"
  initialBio?: BioPageDto
  /** Người dùng chọn "Công khai" khi tạo trang: lần lưu đầu sẽ xuất bản. */
  publishIntent?: boolean
  /** Trang vừa tạo từ hộp thoại: bật sẵn các khối gợi ý trong editor. */
  isNewPage?: boolean
}) {
  const editing = mode === "edit"
  const router = useRouter()
  const title = editing ? ("Chỉnh sửa trang @" + initialBio?.slug) : "Tạo trang Link-in-bio"
  const breadcrumbCurrent = editing ? "Chỉnh sửa" : "Tạo trang"

  return <PageContainer size="wide">
  <div className="space-y-5">
    <div className="border-border pb-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        {/* Heading */}
        <div className="flex min-w-0 items-start gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="
                  mt-0.5 size-9 shrink-0 rounded-xl
                  border-border/60 bg-background/80
                  text-muted-foreground shadow-sm
                  backdrop-blur
                  transition-all
                  hover:-translate-x-0.5
                  hover:border-border
                  hover:bg-muted/70
                  hover:text-foreground
                "
                aria-label="Quay lại Link-in-bio"
                onClick={() => router.push("/member/bio")}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </TooltipTrigger>

            <TooltipContent>
              Quay lại Link-in-bio
            </TooltipContent>
          </Tooltip>

          <div className="min-w-0 space-y-1.5">
            {/* Breadcrumb */}
            <Breadcrumb className="text-xs text-muted-foreground">
              <BreadcrumbList className="gap-1">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href="/member/bio"
                      className="transition-colors hover:text-foreground"
                    >
                      Link-in-bio
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator className="opacity-50" />

                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground">
                    {breadcrumbCurrent}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Title */}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                {title}
              </h1>

            </div>
          </div>
        </div>
      </div>
    </div>

    <LinkInBioGenerator
      key={initialBio?.id || "create-bio"}
      initialBio={initialBio}
      initialStatus={publishIntent && initialBio?.status === "draft" ? "published" : undefined}
      starterContent={isNewPage}
      onSaved={(bioPage) => {
        if (editing) {
          // Cờ trang mới / công khai chỉ áp dụng cho lần lưu đầu; bỏ khỏi URL sau khi lưu.
          if (publishIntent || isNewPage) router.replace(`/member/bio/${bioPage.id}/edit`, { scroll: false })
          return
        }

        router.replace(`/member/bio/${bioPage.id}/edit`)
        router.refresh()
      }}
    />
  </div>
</PageContainer>
}

export function LinkInBioEditorLoading() {
  return <PageContainer size="wide"><div className="border-b border-border pb-5"><Skeleton className="mb-3 h-5 w-48" /><Skeleton className="h-8 w-72" /><Skeleton className="mt-2 h-4 w-[34rem] max-w-full" /></div><div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]"><div className="space-y-3"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /></div><Skeleton className="h-[700px] rounded-xl" /></div></PageContainer>
}

export function LinkInBioEditorError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <PageContainer size="wide"><Button asChild variant="ghost" size="icon" className="size-11 sm:size-9" aria-label="Quay lại Link-in-bio"><Link href="/member/bio"><ArrowLeft /></Link></Button><Alert variant="destructive"><CircleAlert /><AlertTitle>Không tải được trang Link-in-bio</AlertTitle><AlertDescription><p>{message}</p><Button variant="outline" className="mt-3 bg-background" onClick={onRetry}><LoaderCircle />Thử lại</Button></AlertDescription></Alert></PageContainer>
}
