// app/api/admin/users/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { ok, badRequest, conflict, serverError } from "@/lib/http";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import type { Role } from "@prisma/client";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateAdminUserSchema = z.object({
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "HR", "APPLICANT"]).optional(),
  birthDate: z.string().min(1).optional(),
  gender: z.string().min(1).optional(),
  isSuspended: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as { id?: string; role?: Role } | null;

    if (!currentUser?.id || currentUser.role !== "ADMIN") {
      return badRequest("Unauthorized");
    }

    const { id } = await params;

    const body = (await req.json()) as unknown;
    const parsed = updateAdminUserSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid user payload", parsed.error.flatten());
    }

    const data = parsed.data;

    const updateData: Parameters<typeof prisma.user.update>[0]["data"] = {};

    if (data.firstname !== undefined) updateData.firstname = data.firstname;
    if (data.lastname !== undefined) updateData.lastname = data.lastname;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role as Role;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.isSuspended !== undefined)
      updateData.isSuspended = data.isSuspended;
    if (data.password !== undefined) {
      updateData.password = data.password;
    }
    if (data.birthDate !== undefined) {
      updateData.birthDate = new Date(data.birthDate);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        isSuspended: true,
        createdAt: true,
      },
    });

    const fullName = `${updated.firstname} ${updated.lastname}`;

    return ok({
      ...updated,
      name: fullName,
      statusLabel: updated.isSuspended ? "Suspended" : "Active",
    });
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return conflict("Email already exists", err.meta);
      }
      return serverError(err);
    }
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as { id?: string; role?: Role } | null;

    if (!currentUser?.id || currentUser.role !== "ADMIN") {
      return badRequest("Unauthorized");
    }

    const { id } = await params;

    const deleted = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isSuspended: true,
      },
      select: {
        id: true,
      },
    });

    return ok({ id: deleted.id });
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      return serverError(err);
    }
    return serverError(err);
  }
}
