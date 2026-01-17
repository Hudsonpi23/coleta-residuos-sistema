import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { closeStopSchema } from "@/lib/validations";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

type Params = Promise<{ runId: string; stopId: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("runs:execute");
    const { runId, stopId } = await params;
    const body = await request.json();
    const data = closeStopSchema.parse(body);

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

    // If NAO_COLETADO, require skip reason
    if (data.status === "NAO_COLETADO" && !data.skipReason) {
      return error("Motivo é obrigatório quando não coletado");
    }

    const updated = await prisma.collectionEvent.update({
      where: { id: event.id },
      data: {
        status: data.status,
        skipReason: data.skipReason,
        departedAt: new Date(),
      },
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
