import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { cn } from "@/shared/lib/cn";

const tones = {
  note: "border-info/30 bg-info-muted text-info-foreground",
  tip: "border-success/30 bg-success-muted text-success-foreground",
  warning: "border-warning/30 bg-warning-muted text-warning-foreground",
  important: "border-danger/30 bg-danger-muted text-danger-foreground",
  implementation: "border-warning/40 bg-warning-muted/80 text-warning-foreground",
} as const;

const titles = {
  note: "Note",
  tip: "Tip",
  warning: "Warning",
  important: "Important",
  implementation: "Implementation note",
} as const;

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: keyof typeof tones;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Alert className={cn("not-prose my-4", tones[type])}>
      <AlertTitle className="text-sm font-semibold">{title ?? titles[type]}</AlertTitle>
      <AlertDescription className="text-sm [&_p]:my-1">{children}</AlertDescription>
    </Alert>
  );
}
