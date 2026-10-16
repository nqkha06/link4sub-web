"use client"

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import {
  ChevronDown,
  Info,
  KeyRound,
  Loader2,
  Lock,
  RotateCw,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { CopyFeedbackIcon } from "@/components/copy-feedback-icon"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/ui"
import { Button } from "@/components/ui/button"
import { socialPlatforms } from "@/features/create-link/social-catalog"
import {
  getMemberApiKeyStatus,
  issueMemberApiKey,
  revokeMemberApiKey,
  type MemberApiKeyStatus,
} from "@/lib/api-client"
import { cn } from "@/lib/utils"

const subscribeToBrowserOrigin = () => () => undefined

const officialActionCatalog = Object.entries(socialPlatforms).map(
  ([value, platform]) => ({
    value,
    label: platform.name,
    icon: platform.icon,
    color: platform.color,
    actions: platform.actions.map((action) => ({
      value: action.id,
      label: action.label,
    })),
  }),
)

const SAMPLE_DESTINATION_URL = "https://example.com/content"
const SAMPLE_ACTION_URL = "https://www.youtube.com/@example"

function buildSamplePayload(title: string) {
  return {
    destinationUrl: SAMPLE_DESTINATION_URL,
    title,
    actions: [{ platform: "youtube", action: "subscribe", url: SAMPLE_ACTION_URL }],
  }
}

function buildSampleResponse(title: string) {
  return {
    success: true,
    message: "Resource created successfully.",
    data: {
      shortUrl: "https://link4sub.com/l/yd9wkrrm",
      alias: "yd9wkrrm",
      title,
      status: "active",
      createdAt: "2026-09-20T13:26:03.312Z",
    },
  }
}

const sampleError = {
  success: false,
  message: "Validation failed.",
  error: {
    code: "VALIDATION_ERROR",
  },
}

const errorCodes = ["400", "401", "409", "503"] as const

/** Mô tả nằm ở MemberApi.params.<descriptionKey>; ví dụ "sample:*" lấy từ MemberApi.sample. */
const parameters: Array<{
  name: string
  descriptionKey: string
  required?: boolean
  example?: string
}> = [
  { name: "destinationUrl", descriptionKey: "destinationUrl", required: true, example: SAMPLE_DESTINATION_URL },
  {
    name: "actions",
    descriptionKey: "actions",
    required: true,
    example: '[{ "platform": "youtube", "action": "subscribe", "url": "..." }]',
  },
  { name: "title", descriptionKey: "titleField", example: "sample:title" },
  { name: "subtitle", descriptionKey: "subtitle", example: "sample:subtitle" },
  { name: "customAlias", descriptionKey: "customAlias", example: "sample:alias" },
  { name: "appearance", descriptionKey: "appearance" },
]

const appearanceSample = `{
  "appearance": {
    "coverImageUrl": "https://cdn.example.com/cover.jpg",
    "background": {
      "mediaType": "image",
      "mediaUrl": "https://cdn.example.com/background.jpg",
      "sameAsCoverImage": false,
      "effects": {
        "opacity": 85,
        "blur": 2
      }
    }
  }
}`

type Language = "curl" | "php" | "javascript"

const languages: Array<{ value: Language; label: string }> = [
  { value: "curl", label: "cURL" },
  { value: "php", label: "PHP" },
  { value: "javascript", label: "JavaScript" },
]

/** Thẻ đánh số: khung chung cho từng phần của tài liệu. */
function Section({
  number,
  title,
  description,
  children,
}: {
  number: number
  title: string
  description: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex gap-3.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground">
          {number}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-7 text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function CopyButton({
  onClick,
  label,
  className,
}: {
  onClick: () => void
  label: string
  className?: string
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      onClick={onClick}
      aria-label={label}
      className={className}
    >
      <CopyFeedbackIcon className="size-3.5" />
    </Button>
  )
}

/** Khối code nền sáng, dùng cho ví dụ và response. */
function CodePanel({
  label,
  children,
  onCopy,
}: {
  label?: string
  children: string
  onCopy?: () => void
}) {
  const t = useTranslations("MemberApi")
  return (
    <div className="min-w-0">
      {label ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="group relative rounded-xl border bg-muted/30">
        {onCopy ? (
          <CopyButton
            onClick={onCopy}
            label={t("copy.default")}
            className="absolute right-2 top-2 z-10 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          />
        ) : null}
        <pre className="overflow-auto p-4 pr-12 font-mono text-[12.5px] leading-6 text-foreground">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  )
}

/** Thẻ <code> cho chuỗi dịch dạng rich text. */
function codeTag(chunks: ReactNode) {
  return <code className="text-foreground">{chunks}</code>
}

function Mark({ children }: { children: ReactNode }) {
  return <span className="text-violet-300">{children}</span>
}

function StatusPill({ required }: { required?: boolean }) {
  const t = useTranslations("MemberApi.params")
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        required
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          required ? "bg-red-500" : "bg-muted-foreground/60",
        )}
      />
      {required ? t("required") : t("optional")}
    </span>
  )
}

function CredentialField({
  label,
  value,
  onCopy,
}: {
  label: string
  value: string
  onCopy?: () => void
}) {
  const t = useTranslations("MemberApi")
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p>
      <div className="flex min-w-0 max-w-full items-stretch overflow-hidden rounded-lg border bg-background">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-3 py-2.5 font-mono text-[13px] text-foreground">
          {value}
        </code>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            aria-label={t("copy.field", { label })}
            className="grid w-10 shrink-0 place-items-center border-l text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none"
          >
            <CopyFeedbackIcon className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function MemberApiPage() {
  const t = useTranslations("MemberApi")
  const locale = useLocale()
  const samplePayload = buildSamplePayload(t("sample.title"))
  const sampleResponse = buildSampleResponse(t("sample.title"))
  const [status, setStatus] = useState<MemberApiKeyStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [language, setLanguage] = useState<Language>("curl")

  const browserOrigin = useSyncExternalStore(
    subscribeToBrowserOrigin,
    () => window.location.origin,
    () => "",
  )

  const endpoint = `${browserOrigin}/api/v1/member/social-links`

  useEffect(() => {
    getMemberApiKeyStatus()
      .then(setStatus)
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : t("toasts.loadFailed"),
        ),
      )
      .finally(() => setLoading(false))
  }, [t])

  const createKey = async () => {
    if (
      status?.active &&
      !window.confirm(t("confirm.rotate"))
    ) {
      return
    }

    setSubmitting(true)

    try {
      const result = await issueMemberApiKey()
      setStatus({
        active: true,
        allowed: true,
        ...result,
        lastUsedAt: null,
      })
      toast.success(t("toasts.created"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.createFailed"),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const revokeKey = async () => {
    if (
      !window.confirm(t("confirm.revoke"))
    ) {
      return
    }

    setSubmitting(true)

    try {
      await revokeMemberApiKey()
      setStatus({ active: false, allowed: status?.allowed })
      toast.success(t("toasts.revoked"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.revokeFailed"),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const copyText = async (value: string, message = t("toasts.copied")) => {
    await navigator.clipboard.writeText(value)
    toast.success(message)
  }

  // Có key đầy đủ thì điền thẳng vào ví dụ để copy là chạy được.
  const apiKey = status?.active ? status.apiKey : null
  const keyForExamples = apiKey ?? "YOUR_API_KEY"

  const requestJson = JSON.stringify(samplePayload, null, 2)
  const responseJson = JSON.stringify(sampleResponse, null, 2)
  const errorJson = JSON.stringify(sampleError, null, 2)

  const examples: Record<Language, string> = {
    curl: `curl -X POST '${endpoint}' \\
  -H 'Authorization: Bearer ${keyForExamples}' \\
  -H 'Content-Type: application/json' \\
  -d '${requestJson}'`,
    php: `$api_url   = '${endpoint}';
$api_token = '${keyForExamples}';
$payload   = [
    'destinationUrl' => '${samplePayload.destinationUrl}',
    'title'          => '${samplePayload.title}',
    'actions'        => [[
        'platform' => 'youtube',
        'action'   => 'subscribe',
        'url'      => '${SAMPLE_ACTION_URL}',
    ]],
];

$ch = curl_init($api_url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        "Authorization: Bearer {$api_token}",
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode($payload),
]);
$result = json_decode(curl_exec($ch), true);
curl_close($ch);

if (empty($result['success'])) {
    echo $result['message'];
} else {
    echo $result['data']['shortUrl'];
}`,
    javascript: `const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ${keyForExamples}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${requestJson.replace(/\n/g, "\n  ")}),
})

const result = await response.json()

if (!result.success) {
  console.error(result.message)
} else {
  console.log(result.data.shortUrl)
}`,
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        action={
          loading ? null : (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                status?.active
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  status?.active ? "bg-emerald-500" : "bg-muted-foreground/60",
                )}
              />
              {status?.active ? t("status.active") : t("status.inactive")}
            </span>
          )
        }
      />

      <div className="rounded-xl border border-primary/15 bg-primary/[0.05] p-4 sm:p-5">
        <Info className="size-4 text-primary" />
        <p className="mt-2 text-sm leading-6 text-foreground/80">
          {t("intro")}
        </p>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* Thông tin xác thực: lên đầu ở mobile, nằm cột phải ở desktop */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:order-last">
          <div className="min-w-0 overflow-hidden rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">
              {t("credentials.title")}
            </h2>

            <div className="mt-4 space-y-4">
              {loading ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : status?.active ? (
                <>
                  <CredentialField
                    label={t("credentials.apiKey")}
                    value={apiKey ?? `${status.keyPrefix}••••••••`}
                    onCopy={
                      apiKey
                        ? () => copyText(apiKey, t("toasts.copiedKey"))
                        : undefined
                    }
                  />
                  {apiKey ? null : (
                    <p className="-mt-2 text-xs leading-5 text-muted-foreground">
                      {t("credentials.legacyKeyHint")}
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-dashed px-4 py-6 text-center">
                  <span className="mx-auto grid size-10 place-items-center rounded-full bg-muted">
                    <ShieldCheck className="size-5 text-muted-foreground" />
                  </span>
                  <p className="mt-3 text-sm font-medium">{t("credentials.noKeyTitle")}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("credentials.noKeyDescription")}
                  </p>
                </div>
              )}

              <CredentialField
                label={t("credentials.endpoint")}
                value={endpoint}
                onCopy={() => copyText(endpoint, t("toasts.copiedEndpoint"))}
              />

              {status?.active ? (
                <dl className="space-y-2 border-t pt-4 text-xs">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t("credentials.createdAt")}</dt>
                    <dd className="text-right">
                      {new Date(status.createdAt).toLocaleString(locale)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t("credentials.lastUsedAt")}</dt>
                    <dd className="text-right">
                      {status.lastUsedAt
                        ? new Date(status.lastUsedAt).toLocaleString(locale)
                        : t("credentials.neverUsed")}
                    </dd>
                  </div>
                </dl>
              ) : null}

              {status?.allowed === false ? (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-400">
                  {t("credentials.notAllowed")}
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant={status?.active ? "outline" : "default"}
                  onClick={createKey}
                  disabled={submitting || loading || status?.allowed === false}
                  className="w-full"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" />
                  ) : status?.active ? (
                    <RotateCw />
                  ) : (
                    <KeyRound />
                  )}
                  {status?.active ? t("credentials.rotateKey") : t("credentials.createKey")}
                </Button>

                {status?.active ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={revokeKey}
                    disabled={submitting}
                    className="w-full text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                  >
                    <Trash2 />
                    {t("credentials.revokeKey")}
                  </Button>
                ) : null}
              </div>

              <div className="flex gap-2.5 rounded-lg bg-muted/40 p-3">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("credentials.keepPrivate")}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <Section
            number={1}
            title={t("request.title")}
            description={t("request.description")}
          >
            <div className="group relative rounded-xl bg-slate-900 dark:border dark:border-white/10">
              <CopyButton
                onClick={() =>
                  copyText(examples.curl, t("toasts.copiedCurl"))
                }
                label={t("copy.sampleRequest")}
                className="absolute right-2 top-2 z-10 text-slate-400 hover:bg-white/10 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              />
              <pre className="overflow-auto p-4 pr-12 font-mono text-[12.5px] leading-6 text-slate-100">
                <code>
                  <span className="font-semibold text-emerald-400">POST</span>{" "}
                  {endpoint}
                  {"\n"}Authorization: Bearer <Mark>{keyForExamples}</Mark>
                  {"\n"}Content-Type: application/json
                  {"\n\n"}
                  {"{\n"}
                  {'  "destinationUrl": "'}
                  <Mark>{samplePayload.destinationUrl}</Mark>
                  {'",\n'}
                  {'  "actions": [{ "platform": "'}
                  <Mark>youtube</Mark>
                  {'", "action": "'}
                  <Mark>subscribe</Mark>
                  {'", "url": "'}
                  <Mark>{samplePayload.actions[0].url}</Mark>
                  {'" }]\n}'}
                </code>
              </pre>
            </div>
          </Section>

          <Section
            number={2}
            title={t("quickStart.title")}
            description={t("quickStart.description")}
          >
            <div
              role="tablist"
              aria-label={t("quickStart.languages")}
              className="mb-3 inline-flex rounded-lg border bg-background p-1"
            >
              {languages.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={language === item.value}
                  onClick={() => setLanguage(item.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    language === item.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <CodePanel
              onCopy={() => copyText(examples[language], t("toasts.copiedExample"))}
            >
              {examples[language]}
            </CodePanel>
          </Section>

          <Section
            number={3}
            title={t("results.title")}
            description={t.rich("results.description", { code: codeTag })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <CodePanel
                label={t("results.success")}
                onCopy={() =>
                  copyText(responseJson, t("toasts.copiedResponse"))
                }
              >
                {responseJson}
              </CodePanel>
              <CodePanel label={t("results.error")}>{errorJson}</CodePanel>
            </div>

            <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {t("results.commonErrors")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {errorCodes.map((code) => (
                <div
                  key={code}
                  className="flex gap-3 rounded-xl border bg-muted/30 px-4 py-3"
                >
                  <code className="font-mono text-sm font-semibold">{code}</code>
                  <p className="text-sm leading-5 text-muted-foreground">
                    {t(`errors.${code}`)}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            number={4}
            title={t("params.title")}
            description={t("params.description")}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-[0.06em] text-muted-foreground">
                    <th className="px-3 pb-3 font-medium">{t("params.name")}</th>
                    <th className="px-3 pb-3 font-medium">{t("params.details")}</th>
                    <th className="px-3 pb-3 font-medium">{t("params.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((parameter) => (
                    <tr key={parameter.name} className="border-b last:border-b-0">
                      <td className="px-3 py-4 align-top">
                        <code className="rounded-md bg-muted px-2 py-1 font-mono text-[13px] font-semibold text-foreground">
                          {parameter.name}
                        </code>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <p className="leading-6 text-foreground">
                          {t(`params.${parameter.descriptionKey}`)}
                        </p>
                        {parameter.example ? (
                          <code className="mt-1 block break-all font-mono text-xs text-muted-foreground">
                            {parameter.example.startsWith("sample:")
                              ? t(`sample.${parameter.example.slice(7)}`)
                              : parameter.example}
                          </code>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 align-top">
                        <StatusPill required={parameter.required} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <details className="group mt-4 rounded-xl border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {t("appearance.title")}
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-4 border-t p-4">
                <div className="text-sm leading-7 text-muted-foreground">
                  <p>
                    <code className="text-foreground">coverImageUrl</code>: {t("appearance.coverImageUrl")}
                  </p>
                  <p>
                    <code className="text-foreground">background.mediaType</code>:{" "}
                    {t.rich("appearance.mediaType", { code: (chunks) => <code>{chunks}</code> })}
                  </p>
                  <p>
                    <code className="text-foreground">background.mediaUrl</code>: {t("appearance.mediaUrl")}
                  </p>
                  <p>
                    <code className="text-foreground">background.sameAsCoverImage</code>:{" "}
                    {t("appearance.sameAsCoverImage")}
                  </p>
                  <p>
                    <code className="text-foreground">background.effects</code>: {t("appearance.effects")}
                  </p>
                </div>
                <CodePanel>{appearanceSample}</CodePanel>
              </div>
            </details>
          </Section>

          <Section
            number={5}
            title={t("platforms.title")}
            description={t.rich("platforms.description", { code: codeTag })}
          >
            <div className="space-y-2">
              {officialActionCatalog.map((platform) => (
                <details key={platform.value} className="group rounded-xl border">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-lg text-white",
                          platform.color,
                        )}
                      >
                        <platform.icon className="size-3.5" />
                      </span>
                      <p className="text-sm font-medium">{platform.label}</p>
                      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {platform.value}
                      </code>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {t("platforms.actionCount", { count: platform.actions.length })}
                      <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>

                  <div className="flex flex-wrap gap-2 border-t px-4 py-3">
                    {platform.actions.map((action) => (
                      <span
                        key={action.value}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs"
                      >
                        <code className="font-mono font-semibold">
                          {action.value}
                        </code>
                        <span className="text-muted-foreground">
                          {action.label}
                        </span>
                      </span>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  )
}
