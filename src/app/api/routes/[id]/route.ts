import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { updateRouteSchema } from "@/lib/validations";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("routes:read");
    const { id } = await params;

    const route = await prisma.route.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        stops: {
          include: { point: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!route) {
      return notFound("Rota não encontrada");
    }

    return success(route);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("routes:update");
    const { id } = await params;
    const body = await request.json();
    const data = updateRouteSchema.parse(body);

    const existing = await prisma.route.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Rota não encontrada");
    }

    const route = await prisma.route.update({
      where: { id },
      data,
    });

    return success(route);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("routes:delete");
    const { id } = await params;

    const existing = await prisma.route.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Rota não encontrada");
    }

    await prisma.route.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ message: "Rota removida" });
  } catch (err) {
    return handleApiError(err);
  }
}
