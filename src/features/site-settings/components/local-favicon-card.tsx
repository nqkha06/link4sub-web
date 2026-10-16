"use client";

import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deleteLocalSiteIcon,
  getLocalSiteIconState,
  uploadLocalSiteIcon,
  type LocalSiteIconState,
} from "@/features/site-settings/api/site-icon.client";
import { getApiErrorMessage } from "@/lib/api-response";

export function LocalFaviconCard({ canUpdate }: { canUpdate: boolean }) {
  const t = useTranslations("Admin.siteSettings.branding");
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<LocalSiteIconState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getLocalSiteIconState()
      .then(setState)
      .catch(() => undefined);
  }, []);

  async function upload(file: File) {
    try {
      setBusy(true);
      setState(await uploadLocalSiteIcon(file));
      toast.success(t("faviconSaved"));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    try {
      setBusy(true);
      setState(await deleteLocalSiteIcon());
      toast.success(t("faviconRemoved"));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("faviconTitle")}</CardTitle>
        <CardDescription>{t("faviconDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid aspect-[3/1] place-items-center overflow-hidden rounded-xl border bg-muted/30">
          {state?.faviconUrl ? (
            <Image
              key={state.faviconUrl}
              src={state.faviconUrl}
              alt={t("faviconTitle")}
              width={96}
              height={96}
              unoptimized
              className="size-20 object-contain"
            />
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              <ImageIcon className="mx-auto mb-2" />
              {t("noFavicon")}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {t("faviconLocalNote")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!canUpdate || busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Upload />}
            {state?.configured ? t("replaceFavicon") : t("uploadFavicon")}
          </Button>
          {state?.configured ? (
            <Button
              type="button"
              variant="ghost"
              disabled={!canUpdate || busy}
              onClick={() => void remove()}
            >
              <Trash2 /> {t("removeImage")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
