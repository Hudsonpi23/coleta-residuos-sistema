import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string; stopId: string }>;

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("routes:update");
    const { id, stopId } = await params;

    const route = await prisma.route.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!route) {
      return notFound("Rota não encontrada");
    }

    const stop = await prisma.routeStop.findFirst({
      where: { id: stopId, routeId: id },
    });

    if (!stop) {
      return notFound("Parada não encontrada");
    }

    await prisma.routeStop.delete({
      where: { id: stopId },
    });

    return success({ message: "Parada removida" });
  } catch (err) {
    return handleApiError(err);
  }
}
