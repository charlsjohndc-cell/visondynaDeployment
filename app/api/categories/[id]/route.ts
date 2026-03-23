import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { ok, notFound, badRequest, conflict, serverError } from "@/lib/http";
import { updateCategorySchema } from "@/lib/schemas/categories";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: { select: { skills: true, jobs: true } },
      },
    });

    if (!category) return notFound("Category not found");
    return ok(category);
  } catch (err: unknown) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const json = await req.json();
    const parsed = updateCategorySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid category payload", parsed.error.flatten());
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: parsed.data.name.trim() },
      select: { id: true, name: true },
    });

    return ok(updated);
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2025") return notFound("Category not found");
      if (err.code === "P2002") return conflict("Category name must be unique");
    }
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const usage = await prisma.job.count({ where: { categoryId: id } });
    if (usage > 0) {
      return badRequest("Cannot delete a category that is in use by jobs.");
    }

    await prisma.category.delete({ where: { id } });
    return ok({ id });
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2025") return notFound("Category not found");
    }
    return serverError(err);
  }
}
