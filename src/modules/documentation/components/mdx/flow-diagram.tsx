import Link from "next/link";

import { cn } from "@/shared/lib/cn";

export type FlowStep = {
  label: string;
  note?: string;
  href?: string;
};

export type FlowBranch = {
  label: string;
  steps: FlowStep[];
};

export function FlowDiagram({
  steps,
  branches,
  direction = "vertical",
}: {
  steps: FlowStep[];
  branches?: FlowBranch[];
  direction?: "vertical" | "horizontal";
}) {
  const isVertical = direction === "vertical";

  return (
    <div className="not-prose my-4 space-y-4">
      <div
        className={cn(
          "flex gap-2",
          isVertical ? "flex-col" : "flex-row flex-wrap items-start",
        )}
      >
        {steps.map((step, index) => (
          <div
            key={`${step.label}-${index}`}
            className={cn("flex gap-2", isVertical ? "flex-col" : "flex-row items-start")}
          >
            <FlowStepCard step={step} />
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  "text-muted-foreground flex shrink-0 items-center justify-center text-xs font-medium",
                  isVertical ? "py-0.5" : "px-1 self-center",
                )}
                aria-hidden="true"
              >
                {isVertical ? "↓" : "→"}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {branches?.length ? (
        <div className="border-border space-y-3 border-s-2 ps-4">
          {branches.map((branch) => (
            <div key={branch.label}>
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                {branch.label}
              </p>
              <div
                className={cn(
                  "flex gap-2",
                  isVertical ? "flex-col" : "flex-row flex-wrap items-start",
                )}
              >
                {branch.steps.map((step, index) => (
                  <div
                    key={`${branch.label}-${step.label}-${index}`}
                    className={cn("flex gap-2", isVertical ? "flex-col" : "flex-row items-start")}
                  >
                    <FlowStepCard step={step} variant="branch" />
                    {index < branch.steps.length - 1 ? (
                      <span
                        className={cn(
                          "text-muted-foreground flex shrink-0 items-center justify-center text-xs",
                          isVertical ? "py-0.5" : "px-1 self-center",
                        )}
                        aria-hidden="true"
                      >
                        {isVertical ? "↓" : "→"}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FlowStepCard({ step, variant = "main" }: { step: FlowStep; variant?: "main" | "branch" }) {
  const inner = (
    <>
      <p className="text-foreground text-sm font-medium">{step.label}</p>
      {step.note ? <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{step.note}</p> : null}
    </>
  );

  const className = cn(
    "rounded-lg border px-3 py-2",
    variant === "main" ? "border-border bg-card" : "border-border/70 bg-muted/30",
    step.href && "hover:border-primary/40 transition-colors",
  );

  if (step.href) {
    return (
      <Link href={step.href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
