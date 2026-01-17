import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { updateCollectionPointSchema } from "@/lib/validations";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("collection-points:read");
    const { id } = await params;

    const point = await prisma.collectionPoint.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        routeStops: {
          include: { route: true },
        },
      },
    });

    if (!point) {
      return notFound("Ponto de coleta não encontrado");
    }

    return success(point);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("collection-points:update");
    const { id } = await params;
    const body = await request.json();
    const data = updateCollectionPointSchema.parse(body);

    const existing = await prisma.collectionPoint.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Ponto de coleta não encontrado");
    }

    const point = await prisma.collectionPoint.update({
      where: { id },
      data,
    });

    return success(point);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("collection-points:delete");
    const { id } = await params;

    const existing = await prisma.collectionPoint.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Ponto de coleta não encontrado");
    }

    // Soft delete
    await prisma.collectionPoint.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ message: "Ponto de coleta removido" });
  } catch (err) {
    return handleApiError(err);
  }
}
