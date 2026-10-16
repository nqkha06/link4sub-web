"use client";

import { Check, LockKeyhole, Plus, Shield, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  createRole,
  deleteRole,
  updateRole,
} from "@/features/admin-authorization/api/authorization.client";
import type {
  AdminPermission,
  AdminRole,
  AuthorizationData,
  RolePayload,
} from "@/features/admin-authorization/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";

export function AuthorizationManager({
  roles,
  permissions,
}: AuthorizationData) {
  const t = useTranslations("Admin.authorization");
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const currentPermissions = useAdminPermissions();
  const canCreate = currentPermissions.includes("roles.create");
  const canUpdate = currentPermissions.includes("roles.update");
  const canDelete = currentPermissions.includes("roles.delete");
  const [selectedRoleId, setSelectedRoleId] = React.useState(
    roles[0]?.id || 0,
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) || roles[0] || null;

  const refresh = React.useCallback(() => router.refresh(), [router]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("page.title")}
        description={t("page.description")}
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> {t("page.addRole")}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("list.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedRole?.id === role.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50",
                )}
              >
                <Shield className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium text-sm">
                    {role.name}
                    {role.isSystem ? (
                      <Badge variant="secondary">{t("list.systemBadge")}</Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block truncate font-mono text-muted-foreground text-xs">
                    {role.key}
                  </span>
                  <span className="mt-2 flex gap-3 text-muted-foreground text-xs">
                    <span>
                      {t("list.permissionsCount", {
                        count: role.permissionKeys.length,
                      })}
                    </span>
                    <span>
                      {t("list.usersCount", { count: role.usersCount })}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        {selectedRole ? (
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{selectedRole.name}</CardTitle>
                    {selectedRole.isSystem ? (
                      <Badge variant="outline">
                        <LockKeyhole /> {t("detail.systemRole")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
                    {selectedRole.description || t("detail.noDescription")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {canUpdate ? (
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                      {tc("edit")}
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      variant="destructive"
                      size="icon"
                      disabled={selectedRole.isSystem}
                      onClick={() => setDeleteOpen(true)}
                      aria-label={t("delete.confirm")}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  {t("detail.usersCount", { count: selectedRole.usersCount })}
                </span>
                <span className="flex items-center gap-2">
                  <Check className="size-4 text-muted-foreground" />
                  {t("detail.permissionsRatio", {
                    granted: selectedRole.permissionKeys.length,
                    total: permissions.length,
                  })}
                </span>
              </CardContent>
            </Card>

            <PermissionOverview
              role={selectedRole}
              permissions={permissions}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              {t("detail.noRoles")}
            </CardContent>
          </Card>
        )}
      </div>

      {createOpen ? (
        <RoleEditorDialog
          open
          role={null}
          permissions={permissions}
          onOpenChange={setCreateOpen}
          onSuccess={refresh}
        />
      ) : null}
      {editOpen && selectedRole ? (
        <RoleEditorDialog
          key={selectedRole.id}
          open
          role={selectedRole}
          permissions={permissions}
          onOpenChange={setEditOpen}
          onSuccess={refresh}
        />
      ) : null}
      {selectedRole ? (
        <DeleteRoleDialog
          open={deleteOpen}
          role={selectedRole}
          onOpenChange={setDeleteOpen}
          onSuccess={refresh}
        />
      ) : null}
    </div>
  );
}

function PermissionOverview({
  role,
  permissions,
}: {
  role: AdminRole;
  permissions: AdminPermission[];
}) {
  const t = useTranslations("Admin.authorization");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groupPermissions(permissions).map(([group, items]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{group}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {items.map((permission) => {
              const granted = role.permissionKeys.includes(permission.key);
              return (
                <div
                  key={permission.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{permission.name}</p>
                    <p className="mt-1 font-mono text-muted-foreground text-xs">
                      {permission.key}
                    </p>
                  </div>
                  <Badge variant={granted ? "default" : "secondary"}>
                    {granted ? t("overview.granted") : t("overview.notGranted")}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RoleEditorDialog({
  open,
  role,
  permissions,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  role: AdminRole | null;
  permissions: AdminPermission[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("Admin.authorization");
  const tc = useTranslations("Admin.common");
  const [values, setValues] = React.useState<RolePayload>(() => ({
    key: role?.key || "",
    name: role?.name || "",
    description: role?.description || "",
    permissionKeys: role?.permissionKeys || [],
  }));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.name.trim() || (!role && !values.key?.trim())) {
      setError(t("editor.requiredError"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (role) {
        await updateRole(role.id, values);
        toast.success(t("editor.updated"));
      } else {
        await createRole({ ...values, key: values.key || "" });
        toast.success(t("editor.created"));
      }
      onOpenChange(false);
      onSuccess();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t("editor.saveError"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{role ? t("editor.editTitle") : t("editor.createTitle")}</DialogTitle>
          <DialogDescription>
            {t("editor.description")}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="role-name">{t("editor.nameLabel")}</Label>
              <Input
                id="role-name"
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role-key">{t("editor.keyLabel")}</Label>
              <Input
                id="role-key"
                value={values.key}
                disabled={Boolean(role)}
                placeholder="content-manager"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    key: slugRoleKey(event.target.value),
                  }))
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-description">{tc("description")}</Label>
            <Textarea
              id="role-description"
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {groupPermissions(permissions).map(([group, items]) => (
              <div key={group} className="grid content-start gap-3 rounded-lg border p-4">
                <p className="font-medium text-sm capitalize">{group}</p>
                {items.map((permission) => {
                  const protectedPermission =
                    role?.key === "admin";
                  return (
                    <label
                      key={permission.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={values.permissionKeys.includes(permission.key)}
                        disabled={protectedPermission}
                        onCheckedChange={(checked) =>
                          setValues((current) => ({
                            ...current,
                            permissionKeys: toggleValue(
                              current.permissionKeys,
                              permission.key,
                              checked === true,
                            ),
                          }))
                        }
                      />
                      <span>
                        {permission.name}
                        <span className="block font-mono text-muted-foreground text-xs">
                          {permission.key}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? tc("saving") : t("editor.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRoleDialog({
  open,
  role,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  role: AdminRole;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("Admin.authorization");
  const tc = useTranslations("Admin.common");
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");

  async function confirm() {
    setDeleting(true);
    setError("");
    try {
      await deleteRole(role.id);
      toast.success(t("delete.success"));
      onOpenChange(false);
      onSuccess();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t("delete.error"),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !deleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("delete.title", { name: role.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
          >
            {deleting ? tc("deleting") : t("delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function groupPermissions(permissions: AdminPermission[]) {
  return Object.entries(
    permissions.reduce<Record<string, AdminPermission[]>>(
      (groups, permission) => {
        (groups[permission.group] ||= []).push(permission);
        return groups;
      },
      {},
    ),
  );
}

function toggleValue(values: string[], value: string, checked: boolean) {
  return checked
    ? [...new Set([...values, value])]
    : values.filter((current) => current !== value);
}

function slugRoleKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
