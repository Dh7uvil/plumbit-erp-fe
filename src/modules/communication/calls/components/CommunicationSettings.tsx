"use client";

import {
  ArrowLeft,
  Bell,
  BellOff,
  Loader2,
  MessageSquare,
  Monitor,
  Phone,
  Smartphone,
  Users,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateCommunicationSettings } from "@/modules/communication/settings/mutations";
import { useCommunicationSettings } from "@/modules/communication/settings/queries";
import type { ChatNotificationSettingsUpdate } from "@/modules/communication/settings/schemas";
import {
  canShowNotifications,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/modules/communication/shared/notifications";
import { getErrorMessage } from "@/shared/api/errors";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { cn } from "@/shared/lib/cn";

const DEFAULTS: ChatNotificationSettingsUpdate = {
  message_notifications: true,
  group_notifications: true,
  call_notifications: true,
  sound_enabled: true,
  desktop_notifications: true,
  mobile_notifications: true,
};

type SettingKey = keyof ChatNotificationSettingsUpdate;

const NOTIFICATION_SETTINGS: {
  key: SettingKey;
  title: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    key: "message_notifications",
    title: "Direct messages",
    description: "Notify when someone sends you a direct message",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    key: "group_notifications",
    title: "Group chats",
    description: "Notify for new messages in group conversations",
    icon: <Users className="h-4 w-4" />,
  },
  {
    key: "call_notifications",
    title: "Calls",
    description: "Notify for incoming audio and video calls",
    icon: <Phone className="h-4 w-4" />,
  },
];

const DELIVERY_SETTINGS: {
  key: SettingKey;
  title: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    key: "sound_enabled",
    title: "Sounds",
    description: "Play a sound for new notifications",
    icon: <Volume2 className="h-4 w-4" />,
  },
  {
    key: "desktop_notifications",
    title: "Desktop",
    description: "Show notifications in your browser",
    icon: <Monitor className="h-4 w-4" />,
  },
  {
    key: "mobile_notifications",
    title: "Mobile",
    description: "Send push notifications to mobile devices",
    icon: <Smartphone className="h-4 w-4" />,
  },
];

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm dark:bg-card">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  control,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  control: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border/50 px-4 py-3.5 last:border-b-0",
        disabled && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-950/40 dark:text-blue-200">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function permissionBadgeLabel(permission: ReturnType<typeof getNotificationPermission>): string {
  switch (permission) {
    case "granted":
      return "Allowed";
    case "denied":
      return "Blocked";
    case "unsupported":
      return "Unsupported";
    default:
      return "Not set";
  }
}

function permissionBadgeVariant(
  permission: ReturnType<typeof getNotificationPermission>,
): "default" | "secondary" | "destructive" | "outline" {
  switch (permission) {
    case "granted":
      return "default";
    case "denied":
      return "destructive";
    default:
      return "secondary";
  }
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

export function CommunicationSettings() {
  const query = useCommunicationSettings();
  const update = useUpdateCommunicationSettings();
  const [formError, setFormError] = useState<string | null>(null);
  const [browserPermission, setBrowserPermission] = useState(getNotificationPermission());
  const form = useForm<ChatNotificationSettingsUpdate>({ defaultValues: DEFAULTS });

  useEffect(() => {
    if (!query.data) {
      return;
    }
    form.reset({
      message_notifications: query.data.message_notifications,
      group_notifications: query.data.group_notifications,
      call_notifications: query.data.call_notifications,
      sound_enabled: query.data.sound_enabled,
      desktop_notifications: query.data.desktop_notifications,
      mobile_notifications: query.data.mobile_notifications,
    });
  }, [form, query.data]);

  useDirtyFormGuard(form.formState.isDirty);

  async function onSave(values: ChatNotificationSettingsUpdate) {
    setFormError(null);
    try {
      await update.mutateAsync(values);
      toast.success("Settings saved");
      form.reset(values);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function enableBrowserNotifications() {
    const permission = await requestNotificationPermission();
    setBrowserPermission(permission);
    if (permission === "granted") {
      toast.success("Browser notifications enabled");
      form.setValue("desktop_notifications", true, { shouldDirty: true });
    } else if (permission === "denied") {
      toast.error("Browser notifications are blocked in your browser settings");
    }
  }

  if (query.isLoading && !query.data) {
    return (
      <div className="bg-[#f0f4f9] dark:bg-background -mx-4 min-h-full px-4 py-6 md:-mx-6 md:px-6">
        <SettingsSkeleton />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="bg-[#f0f4f9] dark:bg-background -mx-4 min-h-full px-4 py-6 md:-mx-6 md:px-6">
        <div className="mx-auto max-w-lg space-y-4">
          <SettingsHeader />
          <ErrorState
            message={getErrorMessage(query.error) || "Unable to load chat settings."}
            onRetry={() => void query.refetch()}
          />
        </div>
      </div>
    );
  }

  const pending = update.isPending;
  const isDirty = form.formState.isDirty;

  return (
    <div className="bg-[#f0f4f9] dark:bg-background -mx-4 min-h-full px-4 py-6 md:-mx-6 md:px-6">
      <div className="mx-auto max-w-lg space-y-5 pb-20">
        <SettingsHeader />

        <SettingsSection title="Browser">
          <SettingsRow
            icon={canShowNotifications() ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            title="Browser notifications"
            description={
              browserPermission === "denied"
                ? "Notifications are blocked. Enable them in your browser site settings."
                : "Allow this app to show notifications while you work in other tabs."
            }
            control={
              <div className="flex flex-col items-end gap-2">
                <Badge variant={permissionBadgeVariant(browserPermission)}>
                  {permissionBadgeLabel(browserPermission)}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => void enableBrowserNotifications()}
                  disabled={browserPermission === "granted" || browserPermission === "unsupported"}
                >
                  Enable
                </Button>
              </div>
            }
          />
        </SettingsSection>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-5">
            <SettingsSection title="Notifications">
              {NOTIFICATION_SETTINGS.map((setting) => (
                <FormField
                  key={setting.key}
                  control={form.control}
                  name={setting.key}
                  render={({ field }) => (
                    <FormItem>
                      <SettingsRow
                        icon={setting.icon}
                        title={setting.title}
                        description={setting.description}
                        disabled={pending}
                        control={
                          <FormControl>
                            <Switch
                              checked={Boolean(field.value)}
                              disabled={pending}
                              aria-label={setting.title}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        }
                      />
                    </FormItem>
                  )}
                />
              ))}
            </SettingsSection>

            <SettingsSection title="Delivery">
              {DELIVERY_SETTINGS.map((setting) => (
                <FormField
                  key={setting.key}
                  control={form.control}
                  name={setting.key}
                  render={({ field }) => (
                    <FormItem>
                      <SettingsRow
                        icon={setting.icon}
                        title={setting.title}
                        description={setting.description}
                        disabled={pending}
                        control={
                          <FormControl>
                            <Switch
                              checked={Boolean(field.value)}
                              disabled={pending}
                              aria-label={setting.title}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        }
                      />
                    </FormItem>
                  )}
                />
              ))}
            </SettingsSection>

            {formError ? (
              <p className="text-destructive px-1 text-sm">{formError}</p>
            ) : null}
          </form>
        </Form>
      </div>

      {isDirty ? (
        <div className="border-border/60 bg-white/95 supports-[backdrop-filter]:bg-white/80 fixed inset-x-0 bottom-0 z-20 border-t px-4 py-3 backdrop-blur md:px-6 dark:bg-card/95">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  if (query.data) {
                    form.reset({
                      message_notifications: query.data.message_notifications,
                      group_notifications: query.data.group_notifications,
                      call_notifications: query.data.call_notifications,
                      sound_enabled: query.data.sound_enabled,
                      desktop_notifications: query.data.desktop_notifications,
                      mobile_notifications: query.data.mobile_notifications,
                    });
                  }
                }}
              >
                Discard
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-[#1a73e8] hover:bg-[#1765cc]"
                disabled={pending}
                onClick={() => void form.handleSubmit(onSave)()}
              >
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Save changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SettingsHeader() {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" className="shrink-0" asChild aria-label="Back to chat">
        <Link href="/chat">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div>
        <h1 className="text-xl font-normal tracking-tight">Chat settings</h1>
        <p className="text-muted-foreground text-sm">Manage notifications and alerts</p>
      </div>
    </div>
  );
}
