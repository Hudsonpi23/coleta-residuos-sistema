import { NextResponse } from "next/server";
import * as z from "zod";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function validationError(err: z.ZodError) {
  const issues = err.issues || [];
  const errors = issues.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
  return NextResponse.json(
    { success: false, error: "Validation error", details: errors },
    { status: 400 }
  );
}

export function serverError(message = "Internal server error") {
  console.error("[Server Error]", message);
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export function handleApiError(err: unknown) {
  console.error("[API Error]", err);
  
  if (err instanceof z.ZodError) {
    return validationError(err);
  }
  
  if (err instanceof Error) {
    if (err.message.includes("Unauthorized")) {
      return unauthorized(err.message);
    }
    if (err.message.includes("Forbidden")) {
      return forbidden(err.message);
    }
    if (err.message.includes("Not found")) {
      return notFound(err.message);
    }
    return error(err.message);
  }
  
  return serverError();
}
