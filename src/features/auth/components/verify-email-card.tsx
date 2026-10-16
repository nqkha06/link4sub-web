"use client";

import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { AuthLanguageSwitcher, AuthTopBar } from "@/components/auth/auth-page-chrome";
import { SiteBrandDisplay } from "@/components/site-brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resendEmailVerification, verifyEmail } from "../api/auth.client";

export function VerifyEmailCard({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const started = useRef(false);
  const [state, setState] = useState<"verifying" | "success" | "error">(
    token.length >= 32 ? "verifying" : "error",
  );
  const [message, setMessage] = useState(
    token.length >= 32 ? t("verify.verifyingMessage") : t("verify.errors.invalidLink"),
  );
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    window.history.replaceState({}, "", window.location.pathname);
    if (started.current || token.length < 32) return;
    started.current = true;
    void verifyEmail(token)
      .then(() => {
        setState("success");
        setMessage(t("verify.successMessage"));
      })
      .catch(() => {
        setState("error");
        setMessage(t("verify.errors.failed"));
      });
  }, [t, token]);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    try {
      setResending(true);
      await resendEmailVerification(email);
      setMessage(t("verify.resendSuccess"));
    } catch {
      setMessage(t("verify.errors.resend"));
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="container relative grid min-h-svh max-w-none items-center justify-center bg-background">
      <AuthTopBar />
      <div className="mx-auto w-full max-w-sm py-16">
        <Link href="/" className="mb-6 flex justify-center"><SiteBrandDisplay logoClassName="h-9 w-40" nameClassName="text-xl font-medium" /></Link>
        <Card className="shadow-sm">
          <CardHeader className="items-center text-center">
            <span className={`grid size-12 place-items-center rounded-full ${state === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
              {state === "verifying" ? <Loader2 className="animate-spin" /> : state === "success" ? <CheckCircle2 /> : <MailCheck />}
            </span>
            <CardTitle>{state === "success" ? t("verify.successTitle") : state === "verifying" ? t("verify.verifyingTitle") : t("verify.newLinkTitle")}</CardTitle>
            <CardDescription className="leading-5">{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state === "success" ? <Button asChild className="w-full"><Link href="/login">{t("login.submit")}</Link></Button> : null}
            {state === "error" ? (
              <form className="space-y-3" onSubmit={resend}>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required />
                <Button type="submit" className="w-full" variant="outline" disabled={resending}>{resending ? <Loader2 className="animate-spin" /> : <MailCheck />}{resending ? t("verify.sending") : t("verify.resend")}</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>

        <AuthLanguageSwitcher />
      </div>
    </main>
  );
}
