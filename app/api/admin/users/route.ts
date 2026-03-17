// app/api/admin/users/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, serverError, badRequest, created } from "@/lib/http";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type StatusFilter = "ACTIVE" | "SUSPENDED";
type RoleFilter = "ADMIN" | "HR" | "APPLICANT";

function readOffsetParams(url: URL) {
  const limit = Math.max(
    1,
    Math.min(100, Number(url.searchParams.get("limit") || 10)),
  );
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  return { limit, page, skip: (page - 1) * limit };
}

// -----------------------------------
// GET — list admin + HR + applicant users
// -----------------------------------
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return badRequest("Unauthorized");
    }

    const url = new URL(req.url);
    const rawQ = url.searchParams.get("q") || "";
    const q = rawQ.trim();

    const statusParam = url.searchParams.get("status");
    const status: StatusFilter | null =
      statusParam === "ACTIVE" || statusParam === "SUSPENDED"
        ? statusParam
        : null;

    const roleParam = url.searchParams.get("role");
    const role: RoleFilter | null =
      roleParam === "ADMIN" ||
      roleParam === "HR" ||
      roleParam === "APPLICANT"
        ? roleParam
        : null;

    const { limit, page, skip } = readOffsetParams(url);

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role
        ? { role }
        : { role: { in: ["ADMIN", "HR", "APPLICANT"] } }),
      ...(status === "ACTIVE"
        ? { isSuspended: false }
        : status === "SUSPENDED"
          ? { isSuspended: true }
          : {}),
      ...(q
        ? {
            OR: [
              { firstname: { contains: q, mode: "insensitive" } },
              { lastname: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          role: true,
          isSuspended: true,
          emailVerified: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return ok(users, { page, limit, total, totalPages });
  } catch (err) {
    console.log(err);
    return serverError("Failed to load users");
  }
}

// -----------------------------------
// POST — create admin or HR user
// -----------------------------------
const createAdminUserSchema = z.object({
  firstname: z.string().min(1, "First name is required."),
  lastname: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  gender: z.string().min(1, "Gender is required."),
  role: z.enum(["ADMIN", "HR"]),
  autoVerify: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return badRequest("Unauthorized");
    }

    const raw = await req.json();
    const parsed = createAdminUserSchema.safeParse(raw);

    if (!parsed.success) {
      const flat = parsed.error.flatten();

      return badRequest("Invalid data", {
        message: "Some fields are invalid.",
        fieldErrors: flat.fieldErrors,
      });
    }

    const data = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existing) {
      return badRequest("Email already exists", {
        message: "Another user is already using this email.",
        field: "email",
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        password: hashedPassword,
        gender: data.gender,
        role: data.role,
        isSuspended: false,
        emailVerified: data.autoVerify ? new Date() : null,
      },
    });

    return created({
      id: user.id,
      message: "User created successfully.",
    });
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return badRequest("Email already exists", {
          message: "Duplicate email detected.",
          field: "email",
        });
      }
      return serverError("Database error.");
    }

    return serverError("Unexpected server error.");
  }
}
