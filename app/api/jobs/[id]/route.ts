import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { updateJobSchema } from "@/lib/schemas/jobs";
import type { Prisma } from "@prisma/client";

const jobDetailsSelect = {
  id: true,
  title: true,
  description: true,
  manpower: true,
  salary: true,
  company: true,
  location: true,
  status: true,
  createdAt: true,
  categoryId: true,
  category: { select: { id: true, name: true } },
  skills: {
    select: {
      skillTag: {
        select: { id: true, name: true },
      },
    },
  },
  applications: {
    where: { deletedAt: null },
    orderBy: { submittedAt: "desc" as const },
    select: {
      id: true,
      applicantId: true,
      status: true,
      submittedAt: true,
      formData: true,
      applicant: {
        select: {
          firstname: true,
          lastname: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.JobSelect;

type JobDetailsRecord = Prisma.JobGetPayload<{
  select: typeof jobDetailsSelect;
}>;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatApplicantName(firstname: string, lastname: string, email: string) {
  const fullName = `${firstname} ${lastname}`.trim();
  return fullName || email || "Applicant";
}

function serializeJob(job: JobDetailsRecord) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    manpower: job.manpower,
    salary: job.salary,
    company: job.company,
    location: job.location,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    category: job.category,
    skills: job.skills.map((entry) => entry.skillTag),
    applications: job.applications.map((application) => ({
      id: application.id,
      applicantId: application.applicantId,
      name: formatApplicantName(
        application.applicant.firstname,
        application.applicant.lastname,
        application.applicant.email,
      ),
      email: application.applicant.email,
      formData: application.formData,
      status: application.status,
      submittedAt: application.submittedAt.toISOString(),
    })),
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) return badRequest("Missing job ID");

    const job = await prisma.job.findUnique({
      where: { id },
      select: jobDetailsSelect,
    });

    if (!job) return notFound("Job not found");

    return ok(serializeJob(job));
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) return badRequest("Missing job ID");

    const existing = await prisma.job.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) return notFound("Job not found");

    const body = await req.json();
    const parsed = updateJobSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid job payload", parsed.error.flatten());
    }

    if (Object.keys(parsed.data).length === 0) {
      return badRequest("No fields provided to update");
    }

    const updated = await prisma.job.update({
      where: { id },
      data: parsed.data,
      select: jobDetailsSelect,
    });

    return ok(serializeJob(updated));
  } catch (err) {
    return serverError(err);
  }
}
