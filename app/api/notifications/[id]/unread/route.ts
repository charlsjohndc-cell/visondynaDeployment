import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response("User not found", { status: 404 });

    const { id } = await params;
    const notifId = id;

    // Mark notification as unread
    const updated = await prisma.notification.updateMany({
      where: { id: notifId, userId: user.id },
      data: { isRead: false },
    });

    return new Response(JSON.stringify({ success: updated.count > 0 }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
