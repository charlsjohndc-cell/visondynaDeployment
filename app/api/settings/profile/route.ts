import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  profession: z.string().optional(),
  phone: z.string().optional(),
  profileSummary: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { profession, phone, profileSummary } = parsed.data;

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {
      profession,
      phone,
      profileSummary,
    },
    create: {
      userId: session.user.id,
      profession,
      phone,
      profileSummary,
    },
  });

  return NextResponse.json({ ok: true });
}
