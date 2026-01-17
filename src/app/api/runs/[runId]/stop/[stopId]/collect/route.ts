import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { collectItemsSchema } from "@/lib/validations";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

type Params = Promise<{ runId: string; stopId: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("runs:execute");
    const { runId, stopId } = await params;
    const body = await request.json();
    const data = collectItemsSchema.parse(body);

    const run = await prisma.collectionRun.findFirst({
      where: {
        id: runId,
        assignment: {
          route: { orgId: session.orgId },
        },
      },
    });

    if (!run) {
      return notFound("Execução não encontrada");
    }

    if (run.status !== "EM_ANDAMENTO") {
      return error("Esta execução não está em andamento");
    }

    const event = await prisma.collectionEvent.findFirst({
      where: { runId, stopId },
    });

    if (!event) {
      return notFound("Parada não encontrada nesta execução");
    }

    if (event.status === "COLETADO" || event.status === "NAO_COLETADO") {
      return error("Esta parada já foi finalizada");
    }

    // Delete existing items and create new ones
    await prisma.collectedItem.deleteMany({
      where: { eventId: event.id },
    });

    // Create collected items
    await prisma.collectedItem.createMany({
      data: data.items.map((item) => ({
        eventId: event.id,
        materialTypeId: item.materialTypeId,
        quantity: item.quantity,
        unit: item.unit,
        isEstimated: item.isEstimated,
      })),
    });

    // Update event notes
    if (data.notes) {
      await prisma.collectionEvent.update({
        where: { id: event.id },
        data: { notes: data.notes },
      });
    }

    const updated = await prisma.collectionEvent.findUnique({
      where: { id: event.id },
      include: {
        stop: {
          include: { point: true },
        },
        items: {
          include: { materialType: true },
        },
      },
    });

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
