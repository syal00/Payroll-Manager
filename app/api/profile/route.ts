import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { employee: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return NextResponse.json({ user: safe });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = patchSchema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
      },
      include: { employee: true },
    });
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return NextResponse.json({ user: safe });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
