"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/cn";
import { getResolverSchema } from "@/shared/lib/zod-resolver";
import { isFieldVisuallyRequired } from "@/shared/lib/zod-required";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FORM_GRID_COLUMNS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
} as const;

function FormGrid({
  columns = 3,
  className,
  ...props
}: React.ComponentProps<"div"> & { columns?: 1 | 2 | 3 }) {
  return (
    <div
      data-slot="form-grid"
      className={cn("grid gap-x-3 gap-y-2", FORM_GRID_COLUMNS[columns], className)}
      {...props}
    />
  );
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn(
          "grid min-w-0 gap-2",
          "in-data-[slot=form-grid]:row-span-3 in-data-[slot=form-grid]:grid-rows-subgrid in-data-[slot=form-grid]:content-start in-data-[slot=form-grid]:gap-0",
          className,
        )}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function useFieldRequired(explicit?: boolean) {
  const { name } = useFormField();
  const form = useFormContext();
  if (explicit != null) {
    return explicit;
  }
  if (!name || !form?.control) {
    return false;
  }
  try {
    const resolver = (form.control as { _options?: { resolver?: unknown } })._options?.resolver;
    const schema = getResolverSchema(resolver);
    if (!schema) {
      return false;
    }
    return isFieldVisuallyRequired(schema, name);
  } catch {
    return false;
  }
}

function FormLabel({
  className,
  children,
  required,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { required?: boolean }) {
  const { error, formItemId } = useFormField();
  const isRequired = useFieldRequired(required);

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn(
        "data-[error=true]:text-destructive in-data-[slot=form-grid]:self-end in-data-[slot=form-grid]:min-w-0",
        className,
      )}
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {isRequired ? (
        <span className="text-destructive ms-0.5 font-medium" aria-hidden="true">
          *
        </span>
      ) : null}
    </Label>
  );
}

function FormControl({
  required,
  ...props
}: React.ComponentProps<typeof Slot> & { required?: boolean }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  const isRequired = useFieldRequired(required);

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      aria-required={isRequired || undefined}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? "") : children;
  const text = typeof body === "string" ? body : undefined;

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      title={text || undefined}
      className={cn(
        "text-destructive min-w-0 text-sm leading-5",
        body ? "min-h-5" : "hidden",
        className,
      )}
      {...props}
    >
      {body || "\u00a0"}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormGrid,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
