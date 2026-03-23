import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getProfileIdOrFail } from "@/lib/auth/profile";
import { zDateISO } from "@/lib/schemas/shared";

const updateSchema = z.object({
  job: z.string().min(2).optional(),
  company: z.string().min(1).optional(),
  startDate: zDateISO.optional(),
  lastAttended: zDateISO.optional(),
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

    const { job, company, startDate, lastAttended } = parsed.data;

    const updated = await prisma.experience.update({
      where: { id },
      data: {
        ...(job !== undefined ? { job } : {}),
        ...(company !== undefined ? { company } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(lastAttended ? { lastAttended: new Date(lastAttended) } : {}),
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

    await prisma.experience.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
