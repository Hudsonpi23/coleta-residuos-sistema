import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("sorting:close");
    const { id } = await params;

    const batch = await prisma.sortingBatch.findFirst({
      where: {
        id,
        run: {
          assignment: {
            route: { orgId: session.orgId },
          },
        },
      },
      include: {
        items: {
          include: { materialType: true },
        },
      },
    });

    if (!batch) {
      return notFound("Lote de triagem não encontrado");
    }

    if (batch.isClosed) {
      return error("Este lote já foi fechado");
    }

    if (batch.items.length === 0) {
      return error("Adicione pelo menos um item antes de fechar o lote");
    }

    // Create stock lots for each item
    const stockLots = await prisma.$transaction(
      batch.items.map((item) =>
        prisma.stockLot.create({
          data: {
            materialTypeId: item.materialTypeId,
            batchId: batch.id,
            orgId: session.orgId,
            totalKg: item.weightKg,
            availableKg: item.weightKg,
            qualityGrade: item.qualityGrade,
            originNote: `Triagem #${batch.id.slice(-6)}`,
          },
        })
      )
    );

    // Create IN movements for each stock lot
    await prisma.$transaction(
      stockLots.map((lot) =>
        prisma.stockMovement.create({
          data: {
            lotId: lot.id,
            type: "IN",
            quantityKg: lot.totalKg,
            movedBy: session.userId,
            notes: "Entrada automática da triagem",
          },
        })
      )
    );

    // Close the batch
    const updated = await prisma.sortingBatch.update({
      where: { id },
      data: { isClosed: true },
      include: {
        items: {
          include: { materialType: true },
        },
        stockLots: {
          include: { materialType: true },
        },
      },
    });

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
