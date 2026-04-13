import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const body = schema.parse(json);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Employees do not use password login. Use the Employee button to register or access your profile with email.",
        },
        { status: 403 }
      );
    }
    await createSession({
      id: user.id,
      email: user.email,
      role: "ADMIN",
      name: user.name,
    });
    return NextResponse.json({
      ok: true,
      role: user.role,
      redirect: "/admin",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: e.issues }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          error:
            "Database is misconfigured. Use DATABASE_URL=file:./dev.db for local SQLite, then run: npx prisma migrate dev && npm run db:seed",
        },
        { status: 503 }
      );
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P1001") {
      return NextResponse.json(
        { error: "Cannot connect to the database. Check DATABASE_URL and that the DB file or server exists." },
        { status: 503 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
