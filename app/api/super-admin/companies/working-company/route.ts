import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import {
  getPlatformWorkingCompany,
  setPlatformWorkingCompanyId,
} from "@/lib/platform-working-company";
import { z } from "zod";

const patchSchema = z.object({
  companyId: z.string().uuid().nullable(),
});

export async function GET() {
  try {
    await requireSuperAdmin();
    const working = await getPlatformWorkingCompany();
    return NextResponse.json({ workingCompany: working });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = patchSchema.parse(await req.json());

    if (body.companyId) {
      await setPlatformWorkingCompanyId(body.companyId);
    } else {
      await setPlatformWorkingCompanyId(null);
    }

    const working = await getPlatformWorkingCompany();

    await writeAuditLog({
      actorId: session.id,
      action: body.companyId ? "PLATFORM_WORKING_COMPANY_SET" : "PLATFORM_WORKING_COMPANY_CLEARED",
      entityType: "Company",
      entityId: body.companyId,
      details: {
        companyId: body.companyId,
        companyName: working?.name ?? null,
      },
    });

    return NextResponse.json({ ok: true, workingCompany: working });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
