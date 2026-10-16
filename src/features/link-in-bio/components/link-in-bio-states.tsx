import { UserRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { EmptyCard } from "@/components/dashboard/empty-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function LinkInBioEmptyState() {
  const t = useTranslations("LinkInBio.page")
  return <EmptyCard icon={UserRound} title={t("empty")} />
}

export function LinkInBioSkeleton() {
  return (
    <div className="grid gap-4 min-[1280px]:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="overflow-hidden rounded-xl border border-border bg-card">
          <Skeleton className="h-1 w-full rounded-none" />
          <div className="flex items-start justify-between gap-4 p-5"><div className="space-y-2"><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-48" /></div><Skeleton className="h-6 w-24" /></div>
          <div className="flex min-h-14 items-center justify-between border-t border-border px-5 py-2.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-28" /></div>
        </div>
      ))}
    </div>
  )
}

export function LinkInBioErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations("LinkInBio.page")
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm">
      <p className="text-destructive">{message}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>{t("retry")}</Button>
    </div>
  )
}
