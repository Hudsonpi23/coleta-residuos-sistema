import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { addSortedItemSchema } from "@/lib/validations";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("sorting:update");
    const { id } = await params;
    const body = await request.json();
    const data = addSortedItemSchema.parse(body);

    const batch = await prisma.sortingBatch.findFirst({
      where: {
        id,
        run: {
          assignment: {
            route: { orgId: session.orgId },
          },
        },
      },
    });

    if (!batch) {
      return notFound("Lote de triagem não encontrado");
    }

    if (batch.isClosed) {
      return error("Este lote já foi fechado");
    }

    // Verify material type exists
    const materialType = await prisma.materialType.findFirst({
      where: { id: data.materialTypeId, orgId: session.orgId },
    });

    if (!materialType) {
      return notFound("Tipo de material não encontrado");
    }

    const item = await prisma.sortedItem.create({
      data: {
        batchId: id,
        materialTypeId: data.materialTypeId,
        weightKg: data.weightKg,
        qualityGrade: data.qualityGrade,
        contaminationPct: data.contaminationPct,
        contaminationNote: data.contaminationNote,
      },
      include: {
        materialType: true,
      },
    });

    return success(item, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("sorting:update");
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return error("ID do item é obrigatório");
    }

    const batch = await prisma.sortingBatch.findFirst({
      where: {
        id,
        run: {
          assignment: {
            route: { orgId: session.orgId },
          },
        },
      },
    });

    if (!batch) {
      return notFound("Lote de triagem não encontrado");
    }

    if (batch.isClosed) {
      return error("Este lote já foi fechado");
    }

    await prisma.sortedItem.delete({
      where: { id: itemId },
    });

    return success({ message: "Item removido" });
  } catch (err) {
    return handleApiError(err);
  }
}
