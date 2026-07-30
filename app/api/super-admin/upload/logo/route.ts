import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { saveCompanyLogoUpload } from "@/lib/company-logo-upload";

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const { logoUrl } = await saveCompanyLogoUpload(file);
    return NextResponse.json({ ok: true, logoUrl });
  } catch (e) {
    const err = e as Error & { status?: number };
    const status = err.status ?? (err.message.includes("must be") ? 400 : 500);
    return NextResponse.json({ error: err.message }, { status });
  }
}
