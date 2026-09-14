import type { z } from "zod";

type ZodLike = {
  def?: {
    type?: string;
    innerType?: ZodLike;
    shape?: Record<string, ZodLike> | (() => Record<string, ZodLike>);
    element?: ZodLike;
    entries?: Record<string, ZodLike>;
  };
  safeParse?: (value: unknown) => { success: boolean };
};

function defOf(schema: ZodLike | undefined) {
  return schema?.def;
}

function isOptionalish(schema: ZodLike | undefined): boolean {
  const type = defOf(schema)?.type;
  return type === "optional" || type === "nullable" || type === "default";
}

function unwrap(schema: ZodLike | undefined): ZodLike | undefined {
  let current = schema;
  for (let index = 0; index < 12; index += 1) {
    const type = defOf(current)?.type;
    if (
      type === "optional" ||
      type === "nullable" ||
      type === "default" ||
      type === "catch" ||
      type === "readonly" ||
      type === "pipe"
    ) {
      current = defOf(current)?.innerType;
      continue;
    }
    break;
  }
  return current;
}

function objectShape(schema: ZodLike | undefined): Record<string, ZodLike> | undefined {
  const shape = defOf(unwrap(schema))?.shape ?? defOf(unwrap(schema))?.entries;
  if (typeof shape === "function") {
    return shape();
  }
  return shape;
}

export function schemaAtPath(schema: z.ZodType, path: string): z.ZodType | undefined {
  if (!schema || typeof path !== "string" || !path) {
    return undefined;
  }
  const segments = path.split(".").filter(Boolean);
  let current: ZodLike | undefined = schema;
  for (const segment of segments) {
    if (!current) {
      return undefined;
    }
    if (/^\d+$/.test(segment)) {
      current = unwrap(current);
      current = defOf(current)?.element;
      continue;
    }
    const shape = objectShape(current);
    current = shape?.[segment];
  }
  return current as z.ZodType | undefined;
}

export function isFieldVisuallyRequired(schema: z.ZodType, path: string): boolean {
  try {
    const field = schemaAtPath(schema, path) as ZodLike | undefined;
    if (!field || isOptionalish(field)) {
      return false;
    }
    const inner = unwrap(field);
    const type = defOf(inner)?.type;
    if (type === "boolean" || type === "object" || type === "array") {
      return false;
    }
    if (type === "string" && typeof inner?.safeParse === "function") {
      return !inner.safeParse("").success;
    }
    return true;
  } catch {
    return false;
  }
}
