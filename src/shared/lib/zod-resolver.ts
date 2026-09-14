import { zodResolver as hookformZodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

const SCHEMA_BY_RESOLVER = new WeakMap<object, z.ZodType>();

export const zodResolver = ((schema: z.ZodType, ...rest: unknown[]) => {
  const resolver = (hookformZodResolver as (schema: z.ZodType, ...rest: unknown[]) => object)(
    schema,
    ...rest,
  );
  SCHEMA_BY_RESOLVER.set(resolver, schema);
  return resolver;
}) as typeof hookformZodResolver;

export function getResolverSchema(resolver: unknown): z.ZodType | undefined {
  if (resolver == null || (typeof resolver !== "object" && typeof resolver !== "function")) {
    return undefined;
  }
  return SCHEMA_BY_RESOLVER.get(resolver);
}
