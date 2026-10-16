"use client";

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  Mail,
  Pencil,
  Save,
  User,
  X,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { useBusinessConfig } from "@/features/business-settings/use-business-config";

import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/member/fields/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/member/fields/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/member/fields/select";
import {
  AuthClientError,
  changeAccountPassword,
  updateAccountProfile,
} from "@/features/auth/api/auth.client";
import { useAuthUser } from "@/features/auth/components/auth-user-provider";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";
import { MemberPaymentMethodsManager } from "@/features/payment-methods/components/member-payment-methods-page";
import {
  useSiteBrand,
} from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";

type PasswordForm = {
  current: string;
  next: string;
  confirm: string;
};

const inputClassName =
  "h-11 rounded-lg border-border bg-background shadow-none sm:h-10";

export function AccountView() {
  const t = useTranslations("Account");
  const avatarMaxBytes = useBusinessConfig().uploads.coverImageMaxBytes;
  const avatarMaxMb = Math.round(avatarMaxBytes / 1024 / 1024);
  const passwordT = useTranslations("ChangePassword");
  const locale = useLocale();
  const router = useRouter();
  const brand = useSiteBrand();
  const currentUser = useAuthUser();
  const currencyPreferences = useMemberCurrency();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [profileName, setProfileName] = useState(currentUser.name);
  const [savedProfileName, setSavedProfileName] = useState(currentUser.name);
  const [savedAvatar, setSavedAvatar] = useState(currentUser.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currency, setCurrency] = useState(currencyPreferences.currency);
  const [savedCurrency, setSavedCurrency] = useState(
    currencyPreferences.currency,
  );
  const [savingCurrency, setSavingCurrency] = useState(false);

  const [password, setPassword] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [linkRecommendationsEnabled, setLinkRecommendationsEnabled] =
    useState(true);

  const [
    savedLinkRecommendationsEnabled,
    setSavedLinkRecommendationsEnabled,
  ] = useState(true);

  const [savingLinkRecommendations, setSavingLinkRecommendations] =
    useState(false);


  const displayName =
    profileName.trim() || t("profile.fallbackName", { brand: brand.siteName });

  const displayedAvatar = removeAvatar
    ? undefined
    : avatarPreview || savedAvatar || undefined;

  const initials = useMemo(
    () =>
      displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase())
        .join("") ||
      (brand.siteShortName || brand.siteName).slice(0, 2).toUpperCase(),
    [brand.siteName, brand.siteShortName, displayName],
  );

  const passwordIsLongEnough = password.next.length >= 8;
  const passwordHasNumber = /\d/.test(password.next);
  const passwordHasUppercase = /[A-Z]/.test(password.next);
  const passwordHasLowercase = /[a-z]/.test(password.next);
  const passwordsMatch =
    Boolean(password.next) && password.next === password.confirm;
  const passwordIsDifferent =
    Boolean(password.current && password.next) &&
    password.current !== password.next;

  const canUpdatePassword =
    Boolean(password.current) &&
    passwordIsLongEnough &&
    passwordHasNumber &&
    passwordHasUppercase &&
    passwordHasLowercase &&
    passwordsMatch &&
    passwordIsDifferent;

  const currencyPreview = currencyPreferences.formatCurrency(48.1, {
    targetCurrency: currency,
  });

  const accountStatus =
    ({
      active: t("profile.status.active"),
      inactive: t("profile.status.inactive"),
      locked: t("profile.status.locked"),
      suspended: t("profile.status.suspended"),
      disabled: t("profile.status.disabled"),
    } as Record<string, string>)[currentUser.status] ?? currentUser.status;

  const normalizedProfileName = profileName.trim();
  const profileNameIsValid =
    normalizedProfileName.length >= 2 && normalizedProfileName.length <= 100;
  const profileHasChanges =
    normalizedProfileName !== savedProfileName ||
    Boolean(avatarFile) ||
    removeAvatar;

  const sections: Array<{ id: string; icon: LucideIcon; label: string }> = [
    { id: "personal-information", icon: User, label: t("navigation.personal") },
    { id: "payment-method", icon: CreditCard, label: t("navigation.payment") },
    { id: "currency", icon: CircleDollarSign, label: t("navigation.currency") },
    { id: "link-recommendations", icon: Lightbulb, label: "Gợi ý link" },
    { id: "change-password", icon: KeyRound, label: passwordT("title") },
  ];

  const saveCurrency = async () => {
    setSavingCurrency(true);

    try {
      await currencyPreferences.selectCurrency(currency);
      setSavedCurrency(currency);
      toast.success(t("toast.sectionSaved", { section: t("currency.title") }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể lưu đơn vị tiền tệ.",
      );
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleAvatarChange = (file?: File) => {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error(t("profile.avatarInvalid"));
      return;
    }

    if (file.size > avatarMaxBytes) {
      toast.error(t("profile.avatarTooLarge", { size: avatarMaxMb }));
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }

    setAvatarFile(file);
    setRemoveAvatar(false);

    const reader = new FileReader();
    reader.onload = () =>
      setAvatarPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    if (removeAvatar) {
      setRemoveAvatar(false);
    } else if (avatarFile) {
      setAvatarFile(null);
      setAvatarPreview("");
      setRemoveAvatar(false);
    } else if (savedAvatar) {
      setRemoveAvatar(true);
      setAvatarPreview("");
    }

    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileNameIsValid || !profileHasChanges || savingProfile) return;

    setSavingProfile(true);

    try {
      const updated = await updateAccountProfile({
        name: normalizedProfileName,
        ...(avatarFile ? { avatar: avatarFile } : {}),
        ...(removeAvatar ? { removeAvatar: true } : {}),
      });

      setProfileName(updated.name);
      setSavedProfileName(updated.name);
      setSavedAvatar(updated.avatar);
      setAvatarFile(null);
      setAvatarPreview("");
      setRemoveAvatar(false);

      if (avatarInputRef.current) avatarInputRef.current.value = "";

      toast.success(t("toast.sectionSaved", { section: t("profile.title") }));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("profile.saveFailed"),
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canUpdatePassword || updatingPassword) return;

    setUpdatingPassword(true);
    setPasswordError("");

    try {
      await changeAccountPassword({
        currentPassword: password.current,
        newPassword: password.next,
      });

      toast.success(passwordT("success"));
      setPassword({ current: "", next: "", confirm: "" });
      setShowPasswords(false);
    } catch (error) {
      const errorKey =
        error instanceof AuthClientError
          ? ({
              CURRENT_PASSWORD_INCORRECT: "errors.currentIncorrect",
              NEW_PASSWORD_SAME_AS_CURRENT: "errors.sameAsCurrent",
              PASSWORD_NOT_CONFIGURED: "errors.notConfigured",
              PASSWORD_CHANGE_IMPERSONATION_FORBIDDEN: "errors.impersonation",
              PASSWORD_CHANGED_CONCURRENTLY: "errors.concurrent",
            } as const)[error.code || ""]
          : undefined;

      const message = errorKey
        ? passwordT(errorKey)
        : passwordT("errors.generic");

      setPasswordError(message);
      toast.error(message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title={t("title")} />

      <div className="grid items-start gap-8 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
          <nav
            aria-label={t("navigation.label")}
            className="flex gap-1 overflow-x-auto border-b pb-3 lg:flex-col lg:overflow-visible lg:border-b-0 lg:pb-0"
          >
            {sections.map(({ id, icon: Icon, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={cn(
                  "flex min-h-9 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-sm",
                  "text-muted-foreground transition-colors",
                  "hover:bg-muted/50 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-8">
          <form onSubmit={handleProfileSubmit}>
            <SettingsCard
              id="personal-information"
              icon={User}
              title={t("profile.title")}
              footer={
                <CardActions>
                  <Button
                    type="submit"
                    className="h-9"
                    disabled={
                      !profileNameIsValid ||
                      !profileHasChanges ||
                      savingProfile
                    }
                  >
                    {savingProfile ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Save />
                    )}
                    {savingProfile ? t("profile.saving") : t("saveChanges")}
                  </Button>
                </CardActions>
              }
            >
              <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center">
                <div className="relative size-20 shrink-0">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label={t("profile.changeAvatar")}
                    title={t("profile.changeAvatar")}
                    className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Avatar className="size-20 border">
                      <AvatarImage src={displayedAvatar} alt={displayName} />
                      <AvatarFallback className="text-lg font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label={t("profile.changeAvatar")}
                    title={t("profile.changeAvatar")}
                    className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Pencil className="size-3.5" />
                  </button>

                  {avatarFile || removeAvatar || savedAvatar ? (
                    <button
                      type="button"
                      onClick={clearAvatar}
                      aria-label={
                        avatarFile || removeAvatar
                          ? t("profile.cancelAvatarChange")
                          : t("profile.removeAvatar")
                      }
                      title={
                        avatarFile || removeAvatar
                          ? t("profile.cancelAvatarChange")
                          : t("profile.removeAvatar")
                      }
                      className="absolute -right-0.5 -top-0.5 grid size-6 place-items-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm transition-colors hover:bg-destructive hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {avatarFile
                        ? avatarFile.name
                        : removeAvatar
                          ? t("profile.avatarMarkedForRemoval")
                          : savedAvatar
                            ? t("profile.currentAvatar")
                            : t("profile.noAvatar")}
                    </p>

                    {avatarFile || removeAvatar ? (
                      <Badge variant="secondary">
                        {t("profile.pendingSave")}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("profile.avatarHint", { size: avatarMaxMb })}
                  </p>

                </div>

                <input
                  ref={avatarInputRef}
                  id="account-avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) =>
                    handleAvatarChange(event.target.files?.[0])
                  }
                />
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <FieldBlock
                  label={t("profile.fullName")}
                  htmlFor="account-name"
                >
                  <Input
                    id="account-name"
                    value={profileName}
                    maxLength={100}
                    onChange={(event) => setProfileName(event.target.value)}
                    className={inputClassName}
                  />

                  {!profileNameIsValid && profileName.length > 0 ? (
                    <p className="text-xs text-destructive">
                      {t("profile.nameInvalid")}
                    </p>
                  ) : null}
                </FieldBlock>

                <FieldBlock
                  label={t("profile.email")}
                  htmlFor="account-email"
                >
                  <Input
                    readOnly
                    id="account-email"
                    type="email"
                    value={currentUser.email}
                    className={`${inputClassName} cursor-default bg-muted/30`}
                  />
                </FieldBlock>
              </div>

              <dl className="mt-7 divide-y border-y">
                <AccountDetail
                  icon={Fingerprint}
                  label={t("profile.accountId")}
                  value={`#${currentUser.id}`}
                />
                <AccountDetail
                  icon={CheckCircle2}
                  label={t("profile.accountStatus")}
                  value={accountStatus}
                  badge
                />
                <AccountDetail
                  icon={Mail}
                  label={t("profile.emailVerification")}
                  value={
                    currentUser.emailVerifiedAt
                      ? formatAccountDate(currentUser.emailVerifiedAt, locale)
                      : t("profile.notVerified")
                  }
                />
                <AccountDetail
                  icon={CalendarDays}
                  label={t("profile.createdAt")}
                  value={formatAccountDate(currentUser.createdAt, locale)}
                />
                <AccountDetail
                  icon={Clock3}
                  label={t("profile.updatedAt")}
                  value={formatAccountDate(currentUser.updatedAt, locale)}
                />
              </dl>
            </SettingsCard>
          </form>

          <SettingsCard
            id="payment-method"
            icon={CreditCard}
            title={t("payment.title")}
          >
            <MemberPaymentMethodsManager />
          </SettingsCard>

          <SettingsCard
            id="currency"
            icon={CircleDollarSign}
            title={t("currency.title")}
            footer={
              <CardActions>
                <Button
                  type="button"
                  className="h-9"
                  disabled={savingCurrency || currency === savedCurrency}
                  onClick={() => void saveCurrency()}
                >
                  {savingCurrency ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Save />
                  )}
                  {t("saveChanges")}
                </Button>
              </CardActions>
            }
          >
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <FieldBlock
                label={t("currency.label")}
                htmlFor="account-currency"
              >
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger
                    id="account-currency"
                    className={`${inputClassName} w-full`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyPreferences.availableCurrencies.map((item) => (
                      <SelectItem key={item.id} value={item.code}>
                        {item.code} — {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldBlock>

              <div className="md:min-w-[180px] md:text-right">
                <p className="text-xs text-muted-foreground">
                  {t("currency.preview")}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                  {currencyPreview}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {t("currency.hint")}
            </p>
          </SettingsCard>
          <SettingsCard
  id="link-recommendations"
  icon={Lightbulb}
  title="Gợi ý link"
  footer={
    <CardActions>
      <Button
        type="button"
        className="h-9"
        disabled={
          savingLinkRecommendations ||
          linkRecommendationsEnabled === savedLinkRecommendationsEnabled
        }
        onClick={async () => {
          setSavingLinkRecommendations(true);

          try {
            // TODO: lưu setting vào API
            // await updateAccountPreferences({
            //   linkRecommendationsEnabled,
            // });

            setSavedLinkRecommendationsEnabled(
              linkRecommendationsEnabled,
            );

            toast.success("Đã lưu cài đặt gợi ý link.");
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Không thể lưu cài đặt gợi ý link.",
            );
          } finally {
            setSavingLinkRecommendations(false);
          }
        }}
      >
        {savingLinkRecommendations ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Save />
        )}

        {t("saveChanges")}
      </Button>
    </CardActions>
  }
>
  <div className="flex items-start justify-between gap-6">
    <div className="min-w-0">
      <Label
        htmlFor="link-recommendations-enabled"
        className="text-sm font-medium text-foreground"
      >
        Hiển thị mục “Bạn có thể thích”
      </Label>

      <p className="mt-1.5 max-w-xl text-sm leading-5 text-muted-foreground">
        Sau khi người xem hoàn thành vượt link, hệ thống sẽ gợi ý thêm các
        liên kết khác do bạn tạo.
      </p>
    </div>

    <Switch
      id="link-recommendations-enabled"
      checked={linkRecommendationsEnabled}
      onCheckedChange={setLinkRecommendationsEnabled}
      className="mt-0.5 shrink-0"
    />
  </div>

  <div className="mt-5 rounded-lg border bg-muted/20 px-4 py-3">
    <div className="flex gap-3">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

      <p className="text-xs leading-5 text-muted-foreground">
        Khi bật, một số liên kết công khai khác của bạn có thể được hiển thị
        bên dưới trang vượt link để tăng lượt xem chéo giữa các liên kết.
      </p>
    </div>
  </div>
</SettingsCard>
          <form onSubmit={handlePasswordSubmit}>
            <SettingsCard
              id="change-password"
              icon={KeyRound}
              title={passwordT("title")}
              footer={
                <CardActions>
                  <Button
                    type="submit"
                    className="h-9"
                    disabled={!canUpdatePassword || updatingPassword}
                  >
                    {updatingPassword ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <KeyRound />
                    )}
                    {updatingPassword
                      ? passwordT("updating")
                      : passwordT("submit")}
                  </Button>
                </CardActions>
              }
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <PasswordField
                  id="current-password"
                  label={passwordT("currentPassword")}
                  value={password.current}
                  show={showPasswords}
                  onChange={(current) => {
                    setPassword((value) => ({ ...value, current }));
                    setPasswordError("");
                  }}
                  onToggle={() =>
                    setShowPasswords((current) => !current)
                  }
                  autoComplete="current-password"
                  showLabel={passwordT("showPassword")}
                  hideLabel={passwordT("hidePassword")}
                  className="sm:col-span-2"
                />
                <PasswordField
                  id="new-password"
                  label={passwordT("newPassword")}
                  value={password.next}
                  show={showPasswords}
                  onChange={(next) => {
                    setPassword((value) => ({ ...value, next }));
                    setPasswordError("");
                  }}
                  onToggle={() =>
                    setShowPasswords((current) => !current)
                  }
                  autoComplete="new-password"
                  showLabel={passwordT("showPassword")}
                  hideLabel={passwordT("hidePassword")}
                />
                <PasswordField
                  id="confirm-password"
                  label={passwordT("confirmPassword")}
                  value={password.confirm}
                  show={showPasswords}
                  onChange={(confirm) => {
                    setPassword((value) => ({ ...value, confirm }));
                    setPasswordError("");
                  }}
                  onToggle={() =>
                    setShowPasswords((current) => !current)
                  }
                  autoComplete="new-password"
                  showLabel={passwordT("showPassword")}
                  hideLabel={passwordT("hidePassword")}
                />
              </div>

              <div className="mt-6 grid gap-x-5 gap-y-2 border-t pt-5 text-xs sm:grid-cols-2 lg:grid-cols-3">
                <PasswordRequirement met={passwordIsLongEnough}>
                  {passwordT("requirements.length")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordHasUppercase}>
                  {passwordT("requirements.uppercase")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordHasLowercase}>
                  {passwordT("requirements.lowercase")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordHasNumber}>
                  {passwordT("requirements.number")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordsMatch}>
                  {passwordT("requirements.match")}
                </PasswordRequirement>
                <PasswordRequirement met={passwordIsDifferent}>
                  {passwordT("requirements.different")}
                </PasswordRequirement>
              </div>

              {passwordError ? (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {passwordError}
                </p>
              ) : null}
            </SettingsCard>
          </form>
        </main>
      </div>
    </PageContainer>
  );
}

function SettingsCard({
  id,
  title,
  description,
  status,
  footer,
  children,
}: {
  id: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  status?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        <header className="border-b px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {status}
          </div>

          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </header>

        <div className="px-5 py-6 sm:px-6">{children}</div>

        {footer}
      </Card>
    </section>
  );
}

function AccountDetail({
  icon: Icon,
  label,
  value,
  badge = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  badge?: boolean;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 py-3.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />

      <dt className="min-w-0 flex-1 text-sm text-muted-foreground">
        {label}
      </dt>

      <dd className="max-w-[62%] truncate text-right text-sm font-medium text-foreground">
        {badge ? <Badge variant="secondary">{value}</Badge> : value}
      </dd>
    </div>
  );
}

function formatAccountDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function FieldBlock({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function CardActions({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="card-actions"
      className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:[&>p]:mr-auto"
    >
      {children}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  show,
  onChange,
  onToggle,
  autoComplete,
  showLabel,
  hideLabel,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  autoComplete: "current-password" | "new-password";
  showLabel: string;
  hideLabel: string;
  className?: string;
}) {
  return (
    <FieldBlock label={label} htmlFor={id} className={className}>
      <InputGroup>
        <InputGroupInput
          id={id}
          type={show ? "text" : "password"}
          value={value}
          maxLength={128}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
        />

        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            aria-label={show ? hideLabel : showLabel}
            onClick={onToggle}
          >
            {show ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </FieldBlock>
  );
}

function PasswordRequirement({
  met,
  children,
}: {
  met: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2",
        met ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Check
        className={cn(
          "size-3.5 shrink-0",
          met
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground/30",
        )}
      />
      {children}
    </p>
  );
}
