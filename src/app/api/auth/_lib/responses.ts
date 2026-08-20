import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { ApiError, isApiError } from "@/shared/api/errors";
import { reportError } from "@/integrations/error-reporting/report";

export function bffSuccess(data: null = null): NextResponse {
  return NextResponse.json({ success: true, data });
}

export function bffError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: error.issues.map((issue) => ({
            loc: issue.path,
            msg: issue.message,
            type: issue.code,
          })),
        },
      },
      { status: 400 },
    );
  }

  if (isApiError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status || 400 },
    );
  }

  reportError(error);
  return NextResponse.json(
    {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Unexpected error" },
    },
    { status: 500 },
  );
}

export function isValidationError(error: unknown): boolean {
  return error instanceof ZodError || (isApiError(error) && error.code === "VALIDATION_ERROR");
}

export function isBenignForgotFailure(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status < 500 && error.code !== "VALIDATION_ERROR";
  }
  return false;
}
