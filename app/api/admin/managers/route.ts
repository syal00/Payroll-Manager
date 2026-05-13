import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireMainAdmin } from "@/lib/api-auth";
import { Role } from "@/lib/enums";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
});

export async function GET() {
  try {
    await requireMainAdmin();
    const managers = await prisma.user.findMany({
      where: { role: Role.MANAGER },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });
    return NextResponse.json({
      managers: managers.map((m) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        createdAt: m.createdAt.toISOString(),
        createdByEmail: m.createdBy?.email ?? null,
      })),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireMainAdmin();
    const body = createSchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Use a different email or reset access another way." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        passwordHash,
        role: Role.MANAGER,
        createdById: session.id,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "MANAGER_ACCOUNT_CREATED",
      entityType: "User",
      entityId: user.id,
      details: { email: user.email, name: user.name },
    });

    return NextResponse.json({
      ok: true,
      manager: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
