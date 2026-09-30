"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/shared/components/ui/button";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type"> & {
  isPending?: boolean;
};

export function SubmitButton({
  isPending = false,
  disabled,
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || isPending} {...props}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
