import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

type Params = Promise<{ runId: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("runs:execute");
    const { runId } = await params;

    const run = await prisma.collectionRun.findFirst({
      where: {
        id: runId,
        assignment: {
          route: { orgId: session.orgId },
        },
      },
      include: {
        events: true,
      },
    });

    if (!run) {
      return notFound("Execução não encontrada");
    }

    if (run.status !== "EM_ANDAMENTO") {
      return error("Esta execução não está em andamento");
    }

    // Check if all events are completed
    const pendingEvents = run.events.filter((e) => e.status === "PENDENTE");
    if (pendingEvents.length > 0) {
      return error(`Ainda existem ${pendingEvents.length} paradas pendentes`);
    }

    const updated = await prisma.collectionRun.update({
      where: { id: runId },
      data: {
        status: "CONCLUIDO",
        endedAt: new Date(),
      },
      include: {
        assignment: {
          include: {
            route: true,
            team: true,
            vehicle: true,
          },
        },
        events: {
          include: {
            stop: {
              include: { point: true },
            },
            items: {
              include: { materialType: true },
            },
          },
        },
      },
    });

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
