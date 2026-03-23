import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getProfileIdOrFail } from "@/lib/auth/profile";
import { zDateISO } from "@/lib/schemas/shared";

const updateSchema = z.object({
  course: z.string().min(2).optional(),
  institution: z.string().min(2).optional(),
  graduated: z.boolean().optional(),
  enrolledDate: zDateISO.optional(),
  graduationDate: zDateISO.optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const profileId = await getProfileIdOrFail();
    if (!profileId)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const json = await req.json();
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { course, graduated, enrolledDate, institution, graduationDate } =
      parsed.data;

    const updated = await prisma.education.update({
      where: { id },
      data: {
        ...(course !== undefined ? { course } : {}),
        ...(institution !== undefined ? { institution } : {}),
        ...(graduated !== undefined ? { graduated } : {}),
        ...(enrolledDate ? { enrolledDate: new Date(enrolledDate) } : {}),
        ...(graduationDate ? { graduationDate: new Date(graduationDate) } : {}),
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const profileId = await getProfileIdOrFail();
    if (!profileId)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    await prisma.education.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
