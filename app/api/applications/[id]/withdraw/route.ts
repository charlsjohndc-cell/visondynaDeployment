import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApplicationStatus } from "@prisma/client";
import { ok, badRequest, notFound, serverError } from "@/lib/http";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return badRequest("Unauthorized");
    }

    const { id } = await context.params;
    if (!id) return badRequest("Missing application ID");

    const application = await prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        applicantId: true,
        status: true,
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
          },
        },
      },
    });

    if (!application) {
      return notFound("Application not found");
    }

    if (application.applicantId !== session.user.id) {
      return badRequest("You are not allowed to withdraw this application");
    }

    if (application.status === ApplicationStatus.WITHDRAWN) {
      return badRequest("Application already withdrawn");
    }

    if (
      application.status === ApplicationStatus.HIRED ||
      application.status === ApplicationStatus.REJECTED
    ) {
      return badRequest(
        `You can no longer withdraw an application that is ${application.status.toLowerCase()}`
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.WITHDRAWN,
      },
      select: {
        id: true,
        status: true,
        applicantId: true,
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: updated.applicantId,
        message: `You withdrew your application for ${updated.job.title} at ${updated.job.company}.`,
        type: ApplicationStatus.WITHDRAWN,
        company: updated.job.company,
        jobTitle: updated.job.title,
        location: updated.job.location,
        status: "UNREAD",
      },
    });

    return ok({
      id: updated.id,
      status: updated.status,
      message: "Application withdrawn successfully",
    });
  } catch (err) {
    return serverError(err);
  }
}