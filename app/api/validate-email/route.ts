import { NextResponse } from "next/server";
import { requireMainAdmin } from "@/lib/api-auth";
import {
  emailValidationMessage,
  validateEmailDeliverable,
} from "@/lib/email-validation";
import { z } from "zod";

const querySchema = z.object({
  email: z.string().trim().min(1).max(320),
});

export async function GET(req: Request) {
  try {
    await requireMainAdmin();
    const url = new URL(req.url);
    const { email } = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const result = await validateEmailDeliverable(email);
    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        reason: result.reason,
        message: emailValidationMessage(result.reason),
      });
    }

    return NextResponse.json({ valid: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          valid: false,
          reason: "invalid_syntax" as const,
          message: emailValidationMessage("invalid_syntax"),
        },
        { status: 400 }
      );
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
