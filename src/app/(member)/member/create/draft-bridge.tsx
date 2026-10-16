"use client"

import { useEffect, useState } from "react"

import { createSnippet } from "@/lib/api-client"
import type { LinkCreatorDraftValues } from "@/features/link-creation/components/link-creator"
import { clearAnonymousDraft, readAnonymousDraft } from "@/features/create-link/pending-draft"

import SocialLinksGenerator from "./demo"

/**
 * Bridges a link composed anonymously on the public /create page into the
 * real (authenticated) member link creator, right after the visitor signs
 * up or logs in. The draft lives in sessionStorage only — see
 * features/create-link/pending-draft.ts — and is consumed exactly once.
 */
export function CreateWithOptionalDraft() {
  const [draftValues, setDraftValues] = useState<LinkCreatorDraftValues | undefined>(undefined)
  const [isResolving, setIsResolving] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function resolveDraft() {
      const pending = readAnonymousDraft()
      if (!pending) {
        if (!cancelled) setIsResolving(false)
        return
      }
      clearAnonymousDraft()

      let selectedSnippet: string | undefined
      if (pending.inputType === "snippet" && pending.snippetContent) {
        try {
          const snippet = await createSnippet({
            name: pending.title || undefined,
            content: pending.snippetContent,
          })
          selectedSnippet = snippet.id
        } catch {
          // If snippet creation fails (e.g. transient network issue), fall
          // back to a blank create — the visitor still lands on a working
          // form and can paste their content back in manually.
        }
      }

      if (cancelled) return

      setDraftValues({
        inputType: pending.inputType,
        destinationUrl: pending.destinationUrl,
        selectedSnippet,
        title: pending.title,
        subtitle: pending.subtitle,
        customAlias: pending.customAlias,
        actions: pending.actions,
        backgroundSettings: pending.backgroundSettings,
        expiryEnabled: pending.expiryEnabled,
        expiryType: pending.expiryType,
        expiryDate: pending.expiryDate,
        expiryTime: pending.expiryTime,
        maxClicks: pending.maxClicks,
      })
      setIsResolving(false)
    }

    void resolveDraft()

    return () => {
      cancelled = true
    }
  }, [])

  if (isResolving) {
    // Briefly shown only when a pending draft is being resolved (at most
    // one network round-trip for the snippet case); avoids flashing an
    // empty form before it gets prefilled.
    return null
  }

  return <SocialLinksGenerator draftValues={draftValues} />
}
