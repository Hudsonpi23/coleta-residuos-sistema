import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ runId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("runs:read");
    const { runId } = await params;

    const run = await prisma.collectionRun.findFirst({
      where: {
        id: runId,
        assignment: {
          route: { orgId: session.orgId },
        },
      },
      include: {
        assignment: {
          include: {
            route: true,
            team: {
              include: {
                members: {
                  include: { employee: true },
                },
              },
            },
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
            attachments: true,
          },
          orderBy: {
            stop: { orderIndex: "asc" },
          },
        },
        sortingBatches: {
          include: {
            items: {
              include: { materialType: true },
            },
          },
        },
      },
    });

    if (!run) {
      return notFound("Execução não encontrada");
    }

    return success(run);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("runs:update");
    const { runId } = await params;
    const body = await request.json();

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

    const updated = await prisma.collectionRun.update({
      where: { id: runId },
      data: {
        notes: body.notes,
      },
    });

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
