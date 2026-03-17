import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  profession: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(40).optional(),
  profileSummary: z.string().trim().max(2000).optional(),
  profileCompleted: z.boolean().optional(),
  imageUrl: z.string().trim().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id as string;

    let profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        education: { orderBy: { enrolledDate: "desc" } },
        experience: { orderBy: { startDate: "desc" } },
        skills: {
          include: {
            skill: { select: { id: true, name: true, categoryId: true } },
          },
        },
        user: { select: { firstname: true, lastname: true, email: true } },
      },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId,
          profileCompleted: false,
        },
        include: {
          education: { orderBy: { enrolledDate: "desc" } },
          experience: { orderBy: { startDate: "desc" } },
          skills: {
            include: {
              skill: { select: { id: true, name: true, categoryId: true } },
            },
          },
          user: { select: { firstname: true, lastname: true, email: true } },
        },
      });
    }

    return NextResponse.json({ ok: true, data: profile });
  } catch (err) {
    console.error("PROFILE_GET_ERROR", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const json = await req.json();
    const parsed = updateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;

    const updated = await prisma.profile.upsert({
      where: { userId },
      update: parsed.data,
      create: {
        userId,
        profileCompleted: false,
        ...parsed.data,
      },
      include: {
        education: { orderBy: { enrolledDate: "desc" } },
        experience: { orderBy: { startDate: "desc" } },
        skills: {
          include: {
            skill: { select: { id: true, name: true, categoryId: true } },
          },
        },
        user: { select: { firstname: true, lastname: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("PROFILE_PATCH_ERROR", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
