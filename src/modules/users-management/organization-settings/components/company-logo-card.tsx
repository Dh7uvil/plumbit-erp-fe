"use client";

import { ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ALLOWED_LOGO_MIME_TYPES, MAX_LOGO_BYTES } from "@/config/constants";
import { organizationSettingsPermissions } from "@/modules/users-management/organization-settings/permissions";
import {
  useDeleteTenantLogo,
  useUploadTenantLogo,
} from "@/modules/users-management/tenants/mutations";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useIsClient } from "@/shared/hooks/use-is-client";
import { toDisplayLogoUrl } from "@/shared/lib/logo-url";
import { useCan } from "@/shared/providers/session-provider";

const LOGO_ACCEPT = ALLOWED_LOGO_MIME_TYPES.join(",");

export function CompanyLogoCard() {
  const can = useCan();
  const canUpdate = can(organizationSettingsPermissions.update);
  const tenantQuery = useCurrentTenant();
  const uploadLogo = useUploadTenantLogo();
  const deleteLogo = useDeleteTenantLogo();
  const inputRef = useRef<HTMLInputElement>(null);
  const isClient = useIsClient();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);

  const logoUrl = tenantQuery.data?.logo_url ?? null;
  const showLogo = Boolean(logoUrl) && logoUrl !== brokenSrc;
  const pending = uploadLogo.isPending || deleteLogo.isPending;

  async function onUpload(file: File) {
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be 2 MB or smaller.");
      return;
    }
    if (!(ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Use a JPEG, PNG, or WebP image.");
      return;
    }
    try {
      await uploadLogo.mutateAsync(file);
      setBrokenSrc(null);
      toast.success("Company logo updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onRemove() {
    try {
      await deleteLogo.mutateAsync();
      setBrokenSrc(null);
      setRemoveOpen(false);
      toast.success("Company logo removed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!isClient || tenantQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 pl-3">
            <Skeleton className="size-24 rounded-lg" />
            <Skeleton className="ml-auto h-8 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tenantQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company logo</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableError
            message={getErrorMessage(tenantQuery.error)}
            onRetry={() => {
              void tenantQuery.refetch();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Company logo</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex items-center gap-3 pl-3">
          <div className="bg-muted flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            {showLogo ? (
              // Presigned URLs expire in 1 hour; native img avoids caching an expired query string.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={toDisplayLogoUrl(logoUrl)}
                alt="Company logo"
                referrerPolicy="no-referrer"
                className="size-full object-contain"
                onError={() => {
                  if (logoUrl) {
                    setBrokenSrc(logoUrl);
                    void tenantQuery.refetch();
                  }
                }}
              />
            ) : (
              <ImageIcon className="text-muted-foreground size-8" aria-hidden="true" />
            )}
          </div>
          {showLogo ? null : (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">No company logo yet</p>
              <p className="text-muted-foreground text-xs">
                {canUpdate
                  ? "JPEG, PNG, or WebP up to 2 MB."
                  : "A company logo has not been uploaded."}
              </p>
            </div>
          )}
          {canUpdate ? (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept={LOGO_ACCEPT}
                className="sr-only"
                aria-label="Upload company logo"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) {
                    void onUpload(file);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
              >
                {uploadLogo.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                {showLogo ? "Replace logo" : "Upload logo"}
              </Button>
              {showLogo ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive size-8"
                  disabled={pending}
                  aria-label="Remove logo"
                  onClick={() => setRemoveOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
      <ConfirmActionDialog
        open={removeOpen}
        title="Remove company logo"
        description="Remove the company logo? Login and the sidebar will revert to the default mark."
        confirmLabel="Remove logo"
        pending={deleteLogo.isPending}
        onOpenChange={setRemoveOpen}
        onConfirm={() => void onRemove()}
      />
    </Card>
  );
}
