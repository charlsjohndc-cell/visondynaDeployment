import { NextRequest } from "next/server";
import { ok, notFound, badRequest, serverError } from "@/lib/http";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const id = (await params)?.id;

    if (!id) {
      return badRequest("Missing applicant id.");
    }

    const applicant = await prisma.user.findUnique({
      where: {
        id,
        role: "APPLICANT",
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        applicantInfo: {
          select: {
            id: true,
            profileSummary: true,
            phone: true,
            profession: true,
            resumeUrl: true,
            imageUrl: true,
            profileCompleted: true,
            createdAt: true,
            education: {
              select: {
                course: true,
                institution: true,
                graduated: true,
                enrolledDate: true,
                graduationDate: true,
              },
            },
            experience: {
              select: {
                job: true,
                company: true,
                startDate: true,
                lastAttended: true,
              },
            },
            skills: {
              select: { skill: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!applicant) {
      return notFound("Applicant not found.");
    }

    const result = {
      id: applicant.id,
      image: applicant.applicantInfo?.imageUrl,
      name: `${applicant.lastname}, ${applicant.firstname}`,
      email: applicant.email,
      phone: applicant.applicantInfo?.phone,
      summary: applicant.applicantInfo?.profileSummary,
      profession: applicant.applicantInfo?.profession,
      skills: applicant.applicantInfo?.skills,
      education: applicant.applicantInfo?.education,
      experience: applicant.applicantInfo?.experience,
    };

    return ok(result);
  } catch (err: unknown) {
    return serverError(err);
  }
}
