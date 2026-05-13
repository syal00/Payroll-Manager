import { NextResponse } from "next/server";
import { requireMainAdmin, requireStaff } from "@/lib/api-auth";
import { getTaxRatePercent, setTaxRatePercent } from "@/lib/app-settings";
import { z } from "zod";

export async function GET() {
  try {
    await requireStaff();
    const taxRate = await getTaxRatePercent();
    return NextResponse.json({ taxRate });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

const patchSchema = z.object({
  taxRate: z.number().min(0).max(100),
});

export async function PATCH(req: Request) {
  try {
    await requireMainAdmin();
    const body = patchSchema.parse(await req.json());
    await setTaxRatePercent(body.taxRate);
    return NextResponse.json({ ok: true, taxRate: body.taxRate });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
