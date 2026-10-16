"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Award,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Save,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminMediaPicker } from "@/components/admin-media/admin-media-picker";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { useAuthUser } from "@/features/auth/components/auth-user-provider";
import {
  createAdminUser,
  updateAdminUser,
} from "@/features/admin-users/api/users.client";
import {
  createUserEditorFormSchema,
  type UserEditorFormValues,
} from "@/features/admin-users/schemas/user-schema";
import type {
  AdminUserDetail,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  UsersAccessOptions,
} from "@/features/admin-users/types";
import { userStatusConfig } from "@/features/admin-users/user-status";
import {
  applyApiValidationErrors,
  getApiErrorMessage,
} from "@/lib/api-response";
import { cn } from "@/lib/utils";

export function UserEditor({
  user,
  accessOptions,
}: {
  user: AdminUserDetail | null;
  accessOptions: UsersAccessOptions;
}) {
  const t = useTranslations("Admin.users");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const router = useRouter();
  const currentUser = useAuthUser();
  const currentUserId = currentUser.id;
  const permissions = useAdminPermissions();
  const canManageRoles = permissions.includes("users.manage-roles");
  const canManageStatus = permissions.includes("users.manage-status");
  const isAdministrator = currentUser.roles.includes("admin");
  const isSelf = Boolean(user && user.id === currentUserId);
  const [saving, setSaving] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [imagePickerOpen, setImagePickerOpen] = React.useState(false);
  const schema = React.useMemo(() => createUserEditorFormSchema(t), [t]);
  const form = useForm<UserEditorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(user),
    mode: "onBlur",
  });
  const hasChanges = form.formState.isDirty;
  const assignableRoles = React.useMemo(
    () =>
      isAdministrator
        ? accessOptions.roles
        : accessOptions.roles.filter(
            (role) =>
              role.key !== "admin" &&
              (role.permissionKeys || []).every((permission) =>
                permissions.includes(permission),
              ),
          ),
    [accessOptions.roles, isAdministrator, permissions],
  );
  React.useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges || saving) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasChanges, saving]);

  function leaveEditor() {
    if (
      hasChanges &&
      !saving &&
      !window.confirm(t("editor.unsavedConfirm"))
    ) {
      return;
    }
    router.push(user ? `/admin/users/${user.id}` : "/admin/users");
  }

  async function submit(values: UserEditorFormValues) {
    setSaving(true);
    try {
      if (values.mode === "create") {
        const payload: CreateAdminUserPayload = {
          name: values.name,
          email: values.email,
          avatar: values.avatar || undefined,
          password: values.password,
          roles: canManageRoles ? values.roles : ["member"],
          permissions: [],
          monetizationLevelId: values.monetizationLevelId,
          status: canManageStatus ? values.status : "active",
        };
        const created = await createAdminUser(payload);
        toast.success(t("editor.toast.created"));
        router.replace(`/admin/users/${created.id}`);
        router.refresh();
        return;
      }

      if (!user) return;
      const dirtyFields = form.formState.dirtyFields;
      const payload: UpdateAdminUserPayload = {
        name: values.name,
        email: values.email,
        avatar: values.avatar || null,
        ...(!isSelf &&
        canManageRoles &&
        dirtyFields.roles
          ? {
              roles: values.roles,
            }
          : {}),
        ...(!isSelf && canManageStatus && dirtyFields.status
          ? { status: values.status }
          : {}),
        ...(dirtyFields.monetizationLevelId
          ? { monetizationLevelId: values.monetizationLevelId }
          : {}),
      };
      const updated = await updateAdminUser(user.id, payload);
      form.reset(getDefaultValues(updated));
      toast.success(t("editor.toast.updated"));
      router.refresh();
    } catch (error) {
      applyApiValidationErrors(error, form.setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submit)}
          className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-6"
        >
          <AdminPageHeader
            title={
              user
                ? t("editor.editTitle", { name: user.name })
                : t("editor.createTitle")
            }
            breadcrumbs={
              user
                ? [
                    { label: t("details.breadcrumbs.dashboard"), href: "/admin" },
                    { label: t("details.breadcrumbs.users"), href: "/admin/users" },
                    {
                      label: user.name,
                      href: `/admin/users/${user.id}`,
                    },
                    { label: tc("edit") },
                  ]
                : undefined
            }
            leading={
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={tc("back")}
                onClick={leaveEditor}
              >
                <ArrowLeft />
              </Button>
            }
            actions={
              <>
                <Button type="button" variant="outline" onClick={leaveEditor}>
                  {tc("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={saving || (Boolean(user) && !hasChanges)}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save />}
                  {user ? tc("saveChanges") : t("editor.createTitle")}
                </Button>
              </>
            }
          />

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("editor.account.title")}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("details.profile.fullName")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoFocus={!user}
                            autoComplete="name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tc("email")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" autoComplete="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>{t("editor.account.avatar")}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://..."
                              inputMode="url"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setImagePickerOpen(true)}
                          >
                            <ImageIcon /> {t("editor.account.pickFromLibrary")}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {!user ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("editor.password.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-5 sm:grid-cols-2">
                    <PasswordField
                      form={form}
                      name="password"
                      label={t("editor.password.label")}
                      visible={showPassword}
                      onToggle={() => setShowPassword((value) => !value)}
                    />
                    <PasswordField
                      form={form}
                      name="confirmPassword"
                      label={t("editor.password.confirmLabel")}
                      visible={showPassword}
                      onToggle={() => setShowPassword((value) => !value)}
                    />
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>{t("editor.monetization.title")}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="monetizationLevelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("table.columns.monetizationLevel")}</FormLabel>
                        <Select
                          value={
                            field.value === null
                              ? "system-default"
                              : String(field.value)
                          }
                          onValueChange={(value) =>
                            field.onChange(
                              value === "system-default"
                                ? null
                                : Number(value),
                            )
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="system-default">
                              {t("table.defaultLevel")}
                            </SelectItem>
                            {accessOptions.monetizationLevels.map((level) => (
                              <SelectItem key={level.id} value={String(level.id)}>
                                {level.name}
                                {level.isDefault ? ` · ${t("editor.monetization.defaultSuffix")}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {user ? (
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 font-medium text-sm leading-none">
                        <Award className="size-4 text-primary" />
                        {t("details.summary.currentTier")}
                      </p>
                      <div className="flex h-9 items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 text-sm">
                        <span className="truncate font-medium">
                          {user.loyaltyTier?.name || t("details.summary.noTier")}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t("editor.monetization.tierProgress", {
                            views: user.loyaltyCurrentValue.toLocaleString(locale),
                            days: user.loyaltyWindowDays,
                          })}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {canManageRoles ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("details.access.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="roles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tc("role")}</FormLabel>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {assignableRoles.map((role) => (
                              <label
                                key={role.id}
                                className={cn(
                                  "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                                  !isSelf && "cursor-pointer hover:bg-muted/40",
                                  field.value.includes(role.key) &&
                                    "border-primary/40 bg-primary/5",
                                  isSelf && "cursor-not-allowed opacity-60",
                                )}
                              >
                                <Checkbox
                                  className="mt-0.5"
                                  checked={field.value.includes(role.key)}
                                  disabled={isSelf}
                                  onCheckedChange={(checked) =>
                                    field.onChange(
                                      toggleValue(
                                        field.value,
                                        role.key,
                                        checked === true,
                                      ),
                                    )
                                  }
                                />
                                <span className="min-w-0 space-y-1">
                                  <span className="flex flex-wrap items-center gap-2 font-medium text-sm">
                                    {role.name}
                                  </span>
                                  <span className="block text-xs leading-5 text-muted-foreground">
                                    {t("editor.roles.permissionCount", {
                                      count: role.permissionKeys?.length || 0,
                                    })}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                          {isSelf ? (
                            <FormDescription>
                              {t("editor.roles.selfLocked")}
                            </FormDescription>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {user?.directPermissions.length ? (
                      <div className="rounded-lg border bg-muted/30 px-4 py-3">
                        <p className="font-medium text-sm">
                          {t("editor.roles.directTitle")}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("editor.admin.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tc("status")}</FormLabel>
                          <Select
                            value={field.value}
                            disabled={!canManageStatus || isSelf}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(userStatusConfig).map(
                                ([value, config]) => (
                                  <SelectItem key={value} value={value}>
                                    {t(config.labelKey)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                </CardContent>
              </Card>

              {user ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("editor.system.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <MetadataRow
                      label={t("details.profile.userId")}
                      value={String(user.id)}
                    />
                    <MetadataRow
                      label={tc("createdAt")}
                      value={formatTimestamp(user.createdAt, locale)}
                    />
                    <MetadataRow
                      label={t("table.columns.updated")}
                      value={formatTimestamp(user.updatedAt, locale)}
                    />
                    <MetadataRow
                      label={t("editor.system.activeSessions")}
                      value={String(user.activeSessionsCount)}
                    />
                  </CardContent>
                </Card>
              ) : null}
            </aside>
          </div>
        </form>
      </Form>

      <AdminMediaPicker
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={(file) =>
          form.setValue("avatar", file.url, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        title={t("editor.avatarPickerTitle")}
      />
    </>
  );
}

function PasswordField({
  form,
  name,
  label,
  visible,
  onToggle,
}: {
  form: ReturnType<typeof useForm<UserEditorFormValues>>;
  name: "password" | "confirmPassword";
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("Admin.users");
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                {...field}
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                className="pr-10"
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              aria-label={
                visible
                  ? t("editor.password.hide")
                  : t("editor.password.show")
              }
              onClick={onToggle}
            >
              {visible ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function getDefaultValues(user: AdminUserDetail | null): UserEditorFormValues {
  if (!user) {
    return {
      mode: "create",
      name: "",
      email: "",
      avatar: "",
      password: "",
      confirmPassword: "",
      roles: ["member"],
      permissions: [],
      monetizationLevelId: null,
      status: "active",
    };
  }
  return {
    mode: "edit",
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    password: "",
    confirmPassword: "",
    roles: user.roles.map((role) => role.key),
    permissions: user.directPermissions,
    monetizationLevelId: user.selectedMonetizationLevelId,
    status: user.status,
  };
}

function toggleValue(values: string[], value: string, checked: boolean) {
  return checked
    ? [...new Set([...values, value])]
    : values.filter((item) => item !== value);
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function formatTimestamp(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
