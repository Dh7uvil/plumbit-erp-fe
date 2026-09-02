import { Lock } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="bg-destructive/10 flex size-14 items-center justify-center rounded-full">
        <Lock className="text-destructive size-6" />
      </div>
      <div>
        <p className="text-foreground text-base font-semibold">Access Denied</p>
        <p className="text-muted-foreground mt-1 text-sm">
          You do not have permission to access this module.
        </p>
      </div>
      <p className="text-muted-foreground text-xs">
        Contact your administrator if you believe this is an error.
      </p>
    </div>
  );
}
