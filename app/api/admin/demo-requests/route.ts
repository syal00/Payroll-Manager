import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMainAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireMainAdmin();
    const items = await prisma.demoRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ items });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
