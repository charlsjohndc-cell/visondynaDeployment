import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfileIdOrFail } from "@/lib/auth/profile";

type SessionUser = { id?: string; role?: "ADMIN" | "APPLICANT" | string };
type Params = { params: Promise<{ id: string }> };

/**
 * POST: mark messages not sent by requester as read
 */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const convo = await prisma.conversation.findUnique({
      where: { id },
    });
    if (!convo)
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 },
      );

    const role = (session.user as SessionUser).role ?? "";
    if (role !== "ADMIN") {
      const profileId = await getProfileIdOrFail();
      if (!profileId || convo.applicantProfileId !== profileId)
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 },
        );
    }

    const requesterRole = role === "ADMIN" ? "ADMIN" : "APPLICANT";
    const updated = await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderRole: { not: requesterRole },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      data: { updatedCount: updated.count },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
