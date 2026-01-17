import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createSortingBatchSchema } from "@/lib/validations";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("sorting:read");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // open or closed

    const where: Record<string, unknown> = {
      run: {
        assignment: {
          route: { orgId: session.orgId },
        },
      },
    };

    if (status === "open") {
      where.isClosed = false;
    } else if (status === "closed") {
      where.isClosed = true;
    }

    const batches = await prisma.sortingBatch.findMany({
      where,
      include: {
        run: {
          include: {
            assignment: {
              include: {
                route: true,
                team: true,
              },
            },
            events: {
              include: {
                items: {
                  include: { materialType: true },
                },
              },
            },
          },
        },
        items: {
          include: { materialType: true },
        },
        stockLots: {
          include: { materialType: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(batches);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("sorting:create");
    const body = await request.json();
    const data = createSortingBatchSchema.parse(body);

    // Verify run exists and is completed
    const run = await prisma.collectionRun.findFirst({
      where: {
        id: data.runId,
        assignment: {
          route: { orgId: session.orgId },
        },
      },
    });

    if (!run) {
      return notFound("Execução não encontrada");
    }

    if (run.status !== "CONCLUIDO") {
      return error("A execução precisa estar concluída para iniciar triagem");
    }

    // Check if there's already an open batch
    const existingBatch = await prisma.sortingBatch.findFirst({
      where: { runId: data.runId, isClosed: false },
    });

    if (existingBatch) {
      return error("Já existe uma triagem em aberto para esta execução");
    }

    const batch = await prisma.sortingBatch.create({
      data: {
        runId: data.runId,
        sortedBy: session.userId,
        notes: data.notes,
      },
      include: {
        run: {
          include: {
            assignment: {
              include: {
                route: true,
              },
            },
          },
        },
      },
    });

    return success(batch, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
