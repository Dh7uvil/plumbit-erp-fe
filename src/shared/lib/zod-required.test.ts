import { describe, expect, it } from "vitest";
import { z } from "zod";

import { isFieldVisuallyRequired } from "@/shared/lib/zod-required";

const schema = z.object({
  name: z.string().min(1, "Enter a name"),
  notes: z.string().max(100),
  email: z.string().optional(),
  remember_me: z.boolean(),
  nested: z.object({
    country: z.string().max(100),
    code: z.string().min(2),
  }),
});

describe("isFieldVisuallyRequired", () => {
  it("marks min-length strings required and empty-allowed strings not", () => {
    expect(isFieldVisuallyRequired(schema, "name")).toBe(true);
    expect(isFieldVisuallyRequired(schema, "notes")).toBe(false);
    expect(isFieldVisuallyRequired(schema, "email")).toBe(false);
    expect(isFieldVisuallyRequired(schema, "remember_me")).toBe(false);
  });

  it("walks nested paths", () => {
    expect(isFieldVisuallyRequired(schema, "nested.country")).toBe(false);
    expect(isFieldVisuallyRequired(schema, "nested.code")).toBe(true);
  });

  it("does not throw on empty paths", () => {
    expect(isFieldVisuallyRequired(schema, "")).toBe(false);
    expect(isFieldVisuallyRequired(schema, undefined as unknown as string)).toBe(false);
  });
});
