import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { ok, notFound, badRequest, serverError } from "@/lib/http";
import { updateApplicationStatusSchema } from "@/lib/schemas/applications";
import { ApplicationStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return badRequest("Missing application ID");

    const application = await prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        formData: true,
        submittedAt: true,
        job: {
          select: { id: true, title: true, company: true, location: true },
        },
        applicant: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
    });

    if (!application) return notFound("Application not found");

    return ok({
      id: application.id,
      status: application.status,
      submittedAt: application.submittedAt.toISOString(),
      formData: application.formData,
      job: application.job,
      applicant: {
        id: application.applicant.id,
        name: `${application.applicant.firstname} ${application.applicant.lastname}`,
        email: application.applicant.email,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return badRequest("Missing application ID");

    const json = await req.json();
    const parsed = updateApplicationStatusSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const existing = await prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        applicantId: true,
        job: {
          select: { id: true, title: true, company: true, location: true },
        },
      },
    });

    if (!existing) return notFound("Application not found");

    if (existing.status === ApplicationStatus.WITHDRAWN) {
      return badRequest(
        "This application has already been withdrawn by the applicant and can no longer be updated."
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: parsed.data.status },
      select: {
        id: true,
        status: true,
        applicantId: true,
        job: {
          select: { id: true, title: true, company: true, location: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: updated.applicantId,
        message: `Your application for ${updated.job.title} at ${updated.job.company} has been updated to ${parsed.data.status}`,
        type: parsed.data.status,
        company: updated.job.company,
        jobTitle: updated.job.title,
        location: updated.job.location,
        status: "UNREAD",
      },
    });

    return ok({ id: updated.id, status: updated.status });
  } catch (err) {
    return serverError(err);
  }
}