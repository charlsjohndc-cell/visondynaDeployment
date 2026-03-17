import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, jobId } = await req.json();

  if (!userId || !jobId) {
    return NextResponse.json({ error: "Missing userId or jobId" }, { status: 400 });
  }

  try {
    await prisma.savedJob.delete({
      where: { userId_jobId: { userId, jobId } },
    });

    return NextResponse.json({ success: true });
    // eslint-disable-line
  } catch (err) {// eslint-disable-line
    return NextResponse.json({ error: "Failed to unsave job" }, { status: 500 });
  }
}