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

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid min-w-0 gap-2", className)} {...props} />
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
      className={cn("data-[error=true]:text-destructive", className)}
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
        "text-destructive min-h-5 min-w-0 truncate text-sm leading-5",
        !body && "invisible",
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
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
