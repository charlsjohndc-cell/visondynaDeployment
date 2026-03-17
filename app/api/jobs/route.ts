import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import {
  ok,
  created,
  badRequest,
  conflict,
  serverError,
  readPaginationParams,
} from "@/lib/http";
import { createJobSchema } from "@/lib/schemas/jobs";
import { Prisma } from "@prisma/client";
import type { JobStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// --- helpers ---
function buildJobWhere(
  q?: string | null,
  categoryId?: string | null,
  status?: JobStatus
) {
  const where: Record<string, unknown> = { deletedAt: null };

  if (categoryId?.trim()) where.categoryId = categoryId.trim();
  if (status) where.status = status;

  if (q?.trim()) {
    const searchConditions = [
      { title: { contains: q.trim(), mode: "insensitive" as const } },
      { description: { contains: q.trim(), mode: "insensitive" as const } },
      { company: { contains: q.trim(), mode: "insensitive" as const } },
      { location: { contains: q.trim(), mode: "insensitive" as const } },
    ];
    Object.assign(where, { OR: searchConditions });
  }

  return where;
}

const SORTABLE = ["title", "salary", "manpower", "applications", "createdAt"] as const;
type SortBy = (typeof SORTABLE)[number];
type SortDir = "asc" | "desc";

function readSort(url: URL | { searchParams: URLSearchParams }) {
  const rawBy = (url.searchParams.get("sortBy") || "createdAt") as string;
  const sortBy: SortBy = SORTABLE.includes(rawBy as SortBy) ? (rawBy as SortBy) : "createdAt";

  let sortDir: SortDir = (url.searchParams.get("sortDir") as SortDir) || "desc";
  if (sortDir !== "asc" && sortDir !== "desc") sortDir = "desc";
  if (!url.searchParams.has("sortDir") && sortBy !== "createdAt") sortDir = "asc";

  return { sortBy, sortDir };
}

function readOffsetParams(url: URL | { searchParams: URLSearchParams }) {
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 10)));
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const skip = (page - 1) * limit;
  return { limit, page, skip };
}

// --- API Handlers ---
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const q = url.searchParams.get("q") || undefined;
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const statusParam = url.searchParams.get("status");
    const status: JobStatus | undefined =
      statusParam === "OPEN" || statusParam === "CLOSED" || statusParam === "FILLED"
        ? (statusParam as JobStatus)
        : undefined;

    const { sortBy, sortDir } = readSort(url);
    const where = buildJobWhere(q, categoryId, status);

    // --- cursor pagination for createdAt ---
    if (sortBy === "createdAt") {
      const { limit, cursor } = readPaginationParams(url);
      let items = await prisma.job.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: sortDir }, { id: sortDir }],
        select: {
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
          skills: { select: { skillTag: { select: { id: true, name: true } } } },
          _count: { select: { applications: true } },
        },
      });

      let nextCursor: string | null = null;
      if (items.length > limit) {
        nextCursor = items[limit].id;
        items = items.slice(0, limit);
      }

      return ok(items, {
        nextCursor,
        limit,
        sortBy,
        sortDir,
        paging: { mode: "cursor", nextCursor },
      });
    }

    // --- offset pagination for other sorts ---
    const { limit, page, skip } = readOffsetParams(url);
    const orderByClause: Prisma.JobOrderByWithRelationInput[] =
      sortBy === "applications"
        ? [{ applications: { _count: sortDir } }, { id: "asc" }]
        : [{ [sortBy]: sortDir } as Prisma.JobOrderByWithRelationInput, { id: "asc" }];

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        take: limit,
        skip,
        orderBy: orderByClause,
        select: {
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
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasMore = page < totalPages;

    return ok(items, {
      nextCursor: null,
      limit,
      sortBy,
      sortDir,
      paging: { mode: "offset", page, total, totalPages, hasMore },
    });
  } catch (err: unknown) {
    return serverError(err);
  }
}
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return badRequest("Unauthorized");

    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid job payload", parsed.error.flatten());

    const skills: string[] | undefined = Array.isArray(body.skills) ? body.skills : undefined;

    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true },
    });
    if (!category) return badRequest("Invalid categoryId");

    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: { ...parsed.data, postedById: userId },
        select: {
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
        },
      });

      if (skills && skills.length > 0) {
        const validSkills = await tx.skillTag.findMany({
          where: { id: { in: skills } },
          select: { id: true },
        });

        if (validSkills.length !== skills.length) {
          throw new Error("Invalid skill ids");
        }

        await tx.jobSkillTag.createMany({
          data: validSkills.map((s) => ({
            jobId: job.id,
            skillTagId: s.id,
          })),
          skipDuplicates: true,
        });
      }

      const applicants = await tx.user.findMany({
        where: {
          role: "APPLICANT",
          deletedAt: null,
          isSuspended: false,
        },
        select: {
          id: true,
          email: true,
          role: true,
          deletedAt: true,
          isSuspended: true,
        },
      });

      console.log("JOB CREATED:", job.id, job.title);
      console.log("APPLICANTS FOUND:", applicants);

      if (applicants.length > 0) {
        const payload = applicants.map((applicant) => ({
          userId: applicant.id,
          message: `New job posted: ${job.title}`,
          type: "Job",
          status: "Open for applications",
          company: job.company,
          jobTitle: job.title,
          location: job.location,
          isRead: false,
        }));

        console.log("NOTIFICATION PAYLOAD:", payload);

        const createdNotifications = await tx.notification.createMany({
          data: payload,
        });

        console.log("CREATE MANY RESULT:", createdNotifications);
      } else {
        console.log("NO APPLICANTS FOUND TO NOTIFY");
      }

      return job;
    });

    return created(result);
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") return conflict("Unique constraint violation", err.meta);
    }
    return serverError(err);
  }
}
