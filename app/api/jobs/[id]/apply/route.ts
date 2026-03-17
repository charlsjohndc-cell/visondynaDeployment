import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  ok,
  badRequest,
  notFound,
  unauthorized,
  forbidden,
  serverError,
} from "@/lib/http";

const applyJobSchema = z.object({
  coverLetter: z
    .string()
    .min(20, "Cover letter must be at least 20 characters long.")
    .max(2000, "Cover letter is too long."),
  resumeUrl: z
    .string()
    .url("Invalid resume URL.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ---------------------------
// GET /api/jobs/[id]/apply
// ---------------------------
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorized("You must be logged in to view your application.");
    }

    const userId = session.user.id;
    const { id } = await context.params;

    if (!id) {
      return badRequest("Missing job ID.");
    }

    const application = await prisma.application.findFirst({
      where: {
        jobId: id,
        applicantId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        formData: true,
      },
    });

    return ok(application ?? null);
  } catch (err) {
    return serverError(err);
  }
}

// ---------------------------
// POST /api/jobs/[id]/apply
// ---------------------------
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorized("You must be logged in to apply for this job.");
    }

    const user = session.user;
    if (user.role !== "APPLICANT") {
      return forbidden("Only applicants can apply to jobs.");
    }

    const { id } = await context.params;

    if (!id) {
      return badRequest("Missing job ID.");
    }

    const body = await req.json();
    const parsed = applyJobSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid application data.", parsed.error.flatten());
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!job || job.deletedAt) {
      return notFound("Job not found.");
    }

    if (job.status !== "OPEN") {
      return badRequest("This job is not open for applications.");
    }

    const existing = await prisma.application.findFirst({
      where: {
        jobId: job.id,
        applicantId: user.id,
        deletedAt: null,
      },
    });

    if (existing) {
      return badRequest("You have already applied for this job.");
    }

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        applicantId: user.id,
        formData: parsed.data,
      },
      select: {
        id: true,
        jobId: true,
        status: true,
        submittedAt: true,
        formData: true,
      },
    });

    return ok(application);
  } catch (err) {
    return serverError(err);
  }
}