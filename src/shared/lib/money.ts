import { z } from "zod";

export const DecimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? String(value) : value.trim()));

export const MoneySchema = DecimalStringSchema;

export const NullableDecimalStringSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) => (value === null ? null : typeof value === "number" ? String(value) : value.trim()));
