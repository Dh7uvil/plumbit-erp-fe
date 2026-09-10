import { cn } from "@/shared/lib/cn";

export type WizardStep = {
  id: string;
  label: string;
};

export function WizardSteps({
  steps,
  currentStep,
  className,
}: {
  steps: readonly WizardStep[];
  currentStep: string;
  className?: string;
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep),
  );

  return (
    <ol className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      {steps.map((step, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                state === "done" && "bg-primary text-primary-foreground",
                state === "current" && "bg-foreground text-background",
                state === "upcoming" && "bg-muted text-muted-foreground",
              )}
              aria-current={state === "current" ? "step" : undefined}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                state === "current" ? "font-medium" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 ? (
              <span className="bg-border hidden h-px w-8 sm:inline-block" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
