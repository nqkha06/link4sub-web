"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Eye,
  EyeOff,
  LogIn,
  Mail,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AuthLanguageSwitcher,
  AuthTopBar,
} from "@/components/auth/auth-page-chrome";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiteBrandDisplay } from "@/components/site-brand";
import {
  loginAccount,
  loginWithGoogle,
  registerAccount,
  requestPasswordReset,
} from "@/features/auth/api/auth.client";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";
import { useBusinessConfig } from "@/features/business-settings/use-business-config";

type AuthMode = "login" | "register" | "forgot";

type FieldName =
  | "name"
  | "email"
  | "password"
  | "confirmPassword"
  | "rememberMe";

type FieldErrors = Partial<Record<FieldName, string>>;

type AuthTranslator = ReturnType<typeof useTranslations<"Auth">>;

type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          type: "standard";
          theme: "outline";
          size: "large";
          text: "signin_with" | "signup_with";
          shape: "rectangular";
          logo_alignment: "left";
          width: number;
          locale: string;
        },
      ): void;
    };
  };
};

function Brand() {
  return (
    <Link
      href="/"
      className="mb-4 flex items-center justify-center"
    >
      <SiteBrandDisplay
        logoClassName="h-9 w-40"
        nameClassName="text-xl font-medium"
      />
    </Link>
  );
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label
        htmlFor={id}
        className={cn(
          "flex items-center gap-2 text-sm leading-none font-medium select-none",
          error && "text-destructive",
        )}
      >
        {label}
      </label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          className="text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validateForm(
  mode: AuthMode,
  form: HTMLFormElement,
  t: AuthTranslator,
) {
  const formData = new FormData(form);
  const errors: FieldErrors = {};

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const email = String(
    formData.get("email") ?? "",
  ).trim();

  const password = String(
    formData.get("password") ?? "",
  );

  const confirmPassword = String(
    formData.get("confirmPassword") ?? "",
  );

  if (
    mode === "register" &&
    name.length < 2
  ) {
    errors.name = t("validation.name");
  }

  if (!email) {
    errors.email = t(
      "validation.emailRequired",
    );
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    errors.email = t(
      "validation.emailInvalid",
    );
  }

  if (mode !== "forgot") {
    if (!password) {
      errors.password = t(
        "validation.passwordRequired",
      );
    } else if (password.length < 8) {
      errors.password = t(
        "validation.passwordLength",
      );
    } else if (
      mode === "register" &&
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(
        password,
      )
    ) {
      errors.password = t(
        "validation.passwordComplexity",
      );
    }
  }

  if (mode === "register") {
    if (!confirmPassword) {
      errors.confirmPassword = t(
        "validation.confirmPasswordRequired",
      );
    } else if (
      confirmPassword !== password
    ) {
      errors.confirmPassword = t(
        "validation.passwordMismatch",
      );
    }

  }

  return errors;
}

export function AuthScreen({
  mode,
  googleClientId = "",
  redirectTo = "/member",
  referralCode,
  initialMessage = "",
}: {
  mode: AuthMode;
  googleClientId?: string;
  redirectTo?: string;
  referralCode?: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Auth");
  const brand = useSiteBrand();

  const businessConfig =
    useBusinessConfig();

  const googleEnabled =
    businessConfig.authentication
      .googleLoginEnabled;

  const registrationEnabled =
    businessConfig.authentication
      .registrationEnabled;

  const fieldPrefix = useId();

  const copy =
    mode === "login"
      ? {
          title: t("login.title"),
          description: t(
            "login.description",
          ),
          switchText: t(
            "login.switchText",
          ),
          switchLabel: t(
            "login.switchLabel",
          ),
          switchHref: "/register",
          submit: t("login.submit"),
        }
      : mode === "register"
        ? {
            title: t(
              "register.title",
            ),
            description: t(
              "register.description",
              {
                siteName:
                  brand.siteName,
              },
            ),
            switchText: t(
              "register.switchText",
            ),
            switchLabel: t(
              "register.switchLabel",
            ),
            switchHref: "/login",
            submit: t(
              "register.submit",
            ),
          }
        : {
            title: t("forgot.title"),
            description: t(
              "forgot.description",
            ),
            switchText: t(
              "forgot.switchText",
            ),
            switchLabel: t(
              "forgot.switchLabel",
            ),
            switchHref: "/login",
            submit: t("forgot.submit"),
          };

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(false);

  const [errors, setErrors] =
    useState<FieldErrors>({});

  const [message, setMessage] =
    useState(initialMessage);

  const [
    messageIsSuccess,
    setMessageIsSuccess,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [googleReady, setGoogleReady] =
    useState(false);

  const googleButtonRef =
    useRef<HTMLDivElement>(null);

  const rememberMeRef =
    useRef(rememberMe);

  const fieldId = (
    name: FieldName,
  ) => `${fieldPrefix}-${name}`;

  function clearField(
    field: FieldName,
  ) {
    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }

    if (message) {
      setMessage("");
    }
  }

  useEffect(() => {
    rememberMeRef.current =
      rememberMe;
  }, [rememberMe]);

  useEffect(() => {
    const container =
      googleButtonRef.current;

    const google = (
      window as Window & {
        google?: GoogleIdentity;
      }
    ).google;

    if (
      !googleEnabled ||
      !googleClientId ||
      !googleReady ||
      !container ||
      !google
    ) {
      return;
    }

    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: ({
        credential,
      }) => {
        if (!credential) {
          setMessage(
            t(
              "errors.googleCredential",
            ),
          );

          setIsSubmitting(false);

          return;
        }

        setErrors({});
        setMessage("");
        setMessageIsSuccess(false);
        setIsSubmitting(true);

        void loginWithGoogle({
          idToken: credential,
          referralCode,
          rememberMe:
            rememberMeRef.current,
        })
          .then(() => {
            router.push(
              redirectTo,
            );

            router.refresh();
          })
          .catch(() => {
            setMessage(
              t(
                "errors.googleLogin",
              ),
            );

            setIsSubmitting(false);
          });
      },
    });

    container.replaceChildren();

    google.accounts.id.renderButton(
      container,
      {
        type: "standard",
        theme: "outline",
        size: "large",
        text:
          mode === "register"
            ? "signup_with"
            : "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: Math.min(
          Math.max(
            container.clientWidth,
            200,
          ),
          400,
        ),
        locale,
      },
    );
  }, [
    googleClientId,
    googleEnabled,
    googleReady,
    locale,
    mode,
    redirectTo,
    referralCode,
    router,
    t,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nextErrors =
      validateForm(
        mode,
        event.currentTarget,
        t,
      );

    setErrors(nextErrors);
    setMessageIsSuccess(false);

    if (
      Object.keys(nextErrors)
        .length > 0
    ) {
      setMessage("");
      return;
    }

    if (mode === "forgot") {
      const formData =
        new FormData(
          event.currentTarget,
        );

      setIsSubmitting(true);
      setMessage("");

      try {
        await requestPasswordReset({
          email: String(
            formData.get(
              "email",
            ) || "",
          ),
        });

        setMessage(
          t(
            "messages.passwordResetRequested",
          ),
        );

        setMessageIsSuccess(true);
      } catch {
        setMessage(
          t(
            "errors.forgotRequest",
          ),
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const formData =
      new FormData(
        event.currentTarget,
      );

    setIsSubmitting(true);
    setMessage("");

    try {
      if (mode === "register") {
        const registration =
          await registerAccount({
            name: String(
              formData.get(
                "name",
              ) || "",
            ),
            email: String(
              formData.get(
                "email",
              ) || "",
            ),
            password: String(
              formData.get(
                "password",
              ) || "",
            ),
            referralCode,
          });

        if (
          registration
            .requiresEmailVerification
        ) {
          setMessage(
            t(
              "messages.registrationVerification",
            ),
          );

          setMessageIsSuccess(
            true,
          );

          return;
        }
      }

      await loginAccount({
        email: String(
          formData.get(
            "email",
          ) || "",
        ),
        password: String(
          formData.get(
            "password",
          ) || "",
        ),
        rememberMe,
      });

      router.push(redirectTo);
      router.refresh();
    } catch {
      setMessage(
        mode === "register"
          ? t("errors.register")
          : t("errors.login"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitIcon =
    mode === "login" ? (
      <LogIn aria-hidden="true" />
    ) : mode === "register" ? (
      <UserPlus aria-hidden="true" />
    ) : (
      <Mail aria-hidden="true" />
    );

  return (
    <main className="relative grid min-h-svh max-w-none items-center justify-center bg-background">
      <AuthTopBar />

      {googleEnabled &&
      googleClientId ? (
        <Script
          src={`https://accounts.google.com/gsi/client?hl=${encodeURIComponent(locale)}`}
          strategy="afterInteractive"
          onReady={() =>
            setGoogleReady(true)
          }
          onError={() =>
            setMessage(
              t(
                "errors.googleScript",
              ),
            )
          }
        />
      ) : null}

      <div
        className="fixed top-0 left-0 z-[2147483647] h-0.5 w-full bg-transparent"
        aria-hidden="true"
      >
        <div className="h-full w-0 bg-muted-foreground" />
      </div>

      <div className="mx-auto flex w-full flex-col justify-center space-y-2 px-4 py-20 sm:max-w-md sm:px-8">
        <Brand />

        <Card className="w-full max-w-sm self-center gap-4 shadow-sm">
          <CardHeader className="gap-1.5">
            <CardTitle className="text-lg tracking-tight">
              {copy.title}
            </CardTitle>

            <CardDescription className="leading-5">
              {copy.description}{" "}

              <span className="max-sm:hidden">
                <br />
              </span>

              {copy.switchText}{" "}

              <Link
                href={copy.switchHref}
                className="text-nowrap underline underline-offset-4 hover:text-primary"
              >
                {copy.switchLabel}
              </Link>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={handleSubmit}
              noValidate
            >
              {mode ===
                "register" &&
              !registrationEnabled ? (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                  {t(
                    "registrationDisabled",
                  )}
                </p>
              ) : null}

              {mode ===
              "register" ? (
                <Field
                  id={fieldId(
                    "name",
                  )}
                  label={t(
                    "fields.name",
                  )}
                  error={
                    errors.name
                  }
                >
                  <Input
                    id={fieldId(
                      "name",
                    )}
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder={t(
                      "fields.namePlaceholder",
                    )}
                    aria-invalid={Boolean(
                      errors.name,
                    )}
                    aria-describedby={
                      errors.name
                        ? `${fieldId("name")}-error`
                        : undefined
                    }
                    onChange={() =>
                      clearField(
                        "name",
                      )
                    }
                  />
                </Field>
              ) : null}

              <Field
                id={fieldId(
                  "email",
                )}
                label={t(
                  "fields.email",
                )}
                error={
                  errors.email
                }
              >
                <Input
                  id={fieldId(
                    "email",
                  )}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  aria-invalid={Boolean(
                    errors.email,
                  )}
                  aria-describedby={
                    errors.email
                      ? `${fieldId("email")}-error`
                      : undefined
                  }
                  onChange={() =>
                    clearField(
                      "email",
                    )
                  }
                />
              </Field>

              {mode !==
              "forgot" ? (
                <Field
                  id={fieldId(
                    "password",
                  )}
                  className="relative"
                  error={
                    errors.password
                  }
                  label={
                    <>
                      {t(
                        "fields.password",
                      )}

                      {mode ===
                      "login" ? (
                        <Link
                          href="/forgot-password"
                          className="absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75"
                        >
                          {t(
                            "login.forgotPassword",
                          )}
                        </Link>
                      ) : null}
                    </>
                  }
                >
                  <div className="relative rounded-md">
                    <Input
                      id={fieldId(
                        "password",
                      )}
                      className="pe-9"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete={
                        mode ===
                        "register"
                          ? "new-password"
                          : "current-password"
                      }
                      placeholder="********"
                      aria-invalid={Boolean(
                        errors.password,
                      )}
                      aria-describedby={
                        errors.password
                          ? `${fieldId("password")}-error`
                          : undefined
                      }
                      onChange={() =>
                        clearField(
                          "password",
                        )
                      }
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="absolute inset-e-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() =>
                        setShowPassword(
                          (
                            current,
                          ) =>
                            !current,
                        )
                      }
                    >
                      {showPassword ? (
                        <Eye
                          aria-hidden="true"
                        />
                      ) : (
                        <EyeOff
                          aria-hidden="true"
                        />
                      )}

                      <span className="sr-only">
                        {showPassword
                          ? t(
                              "actions.hidePassword",
                            )
                          : t(
                              "actions.showPassword",
                            )}
                      </span>
                    </Button>
                  </div>
                </Field>
              ) : null}

              {mode ===
              "register" ? (
                <Field
                  id={fieldId(
                    "confirmPassword",
                  )}
                  label={t(
                    "fields.confirmPassword",
                  )}
                  error={
                    errors.confirmPassword
                  }
                >
                  <Input
                    id={fieldId(
                      "confirmPassword",
                    )}
                    name="confirmPassword"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    placeholder="********"
                    aria-invalid={Boolean(
                      errors.confirmPassword,
                    )}
                    aria-describedby={
                      errors.confirmPassword
                        ? `${fieldId("confirmPassword")}-error`
                        : undefined
                    }
                    onChange={() =>
                      clearField(
                        "confirmPassword",
                      )
                    }
                  />
                </Field>
              ) : null}

              {mode ===
                "register" &&
              referralCode ? (
                <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {t(
                    "referralCode",
                  )}
                  :{" "}
                  <strong className="font-mono text-foreground">
                    {
                      referralCode
                    }
                  </strong>
                </p>
              ) : null}

              {mode ===
              "login" ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={fieldId(
                      "rememberMe",
                    )}
                    name="rememberMe"
                    checked={
                      rememberMe
                    }
                    onCheckedChange={(
                      checked,
                    ) =>
                      setRememberMe(
                        checked ===
                          true,
                      )
                    }
                  />

                  <label
                    htmlFor={fieldId(
                      "rememberMe",
                    )}
                    className="cursor-pointer text-sm text-muted-foreground select-none"
                  >
                    {t(
                      "login.rememberMe",
                    )}
                  </label>
                </div>
              ) : null}

              {message ? (
                <p
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm leading-5",
                    messageIsSuccess
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                  role={
                    messageIsSuccess
                      ? "status"
                      : "alert"
                  }
                  aria-live="polite"
                >
                  {message}
                </p>
              ) : null}

              <Button
                className="mt-2"
                type="submit"
                disabled={
                  isSubmitting ||
                  (mode ===
                    "register" &&
                    !registrationEnabled)
                }
              >
                {submitIcon}

                {isSubmitting
                  ? t(
                      "actions.processing",
                    )
                  : copy.submit}
              </Button>

              {mode !==
                "forgot" &&
              googleEnabled &&
              googleClientId ? (
                <>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>

                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        {t(
                          "continueWith",
                        )}
                      </span>
                    </div>
                  </div>

                  <div
                    ref={
                      googleButtonRef
                    }
                    className={cn(
                      "flex min-h-10 w-full justify-center overflow-hidden",
                      isSubmitting &&
                        "pointer-events-none opacity-60",
                    )}
                    aria-busy={
                      isSubmitting
                    }
                  />
                </>
              ) : null}
            </form>
          </CardContent>

          <CardFooter>
            <p className="px-4 text-center text-sm leading-5 text-muted-foreground sm:px-8">
              {t(
                "terms.prefix",
              )}{" "}

              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                {t(
                  "terms.service",
                )}
              </Link>

              {" "}
              {t("terms.and")}{" "}

              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                {t(
                  "terms.privacy",
                )}
              </Link>
              .
            </p>
          </CardFooter>
        </Card>

        <AuthLanguageSwitcher />
      </div>
    </main>
  );
}
