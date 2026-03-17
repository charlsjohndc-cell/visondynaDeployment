import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await req.json();

  // Check if job is already saved
  const existing = await prisma.savedJob.findUnique({
    where: {
      userId_jobId: {
        userId: session.user.id,
        jobId,
      },
    },
  });

  if (existing) {
    // Correct delete using compound unique
    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    });

    return NextResponse.json({ saved: false });
  }

  // Otherwise, create (save)
  await prisma.savedJob.create({
    data: {
      userId: session.user.id,
      jobId,
    },
  });

  return NextResponse.json({ saved: true });
}