import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(100),
  company: z.string().trim().min(1).max(100),
  teamSize: z.enum(["1-10", "11-50", "51-200", "200+"]),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    await prisma.demoRequest.create({
      data: {
        name: body.name,
        email: body.email,
        company: body.company,
        teamSize: body.teamSize,
      },
    });
    return NextResponse.json({
      ok: true,
      message: "Thanks! We'll be in touch within 24 hours.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
