import { NextResponse } from "next/server";
import { z } from "zod";
import { friendlyPrismaSchemaError } from "@/lib/prisma-errors";

export async function readTimesheetJsonBody(
  req: Request
): Promise<Record<string, unknown> | NextResponse> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

export function timesheetZodErrorResponse(e: z.ZodError) {
  const first = e.issues[0];
  const detail = first ? `${first.path.map(String).join(".")}: ${first.message}` : e.message;
  return NextResponse.json(
    { error: `Validation failed — ${detail}`, issues: e.issues },
    { status: 400 }
  );
}

/** Non-Zod failures: Prisma schema hints, then optional Error.status, then Error.message. */
export function timesheetUnknownErrorResponse(e: unknown) {
  const hint = friendlyPrismaSchemaError(e);
  if (hint) return NextResponse.json({ error: hint }, { status: 503 });

  const err = e as Error & { status?: number };
  const msg =
    err instanceof Error && typeof err.message === "string" && err.message.trim()
      ? err.message
      : "Server error";
  const status =
    typeof err.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
  return NextResponse.json({ error: msg }, { status });
}
