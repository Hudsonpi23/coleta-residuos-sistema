import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createStockLotSchema } from "@/lib/validations";
import { success, notFound, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("stock:read");
    const { searchParams } = new URL(request.url);
    const materialTypeId = searchParams.get("materialTypeId");
    const hasStock = searchParams.get("hasStock");

    const where: Record<string, unknown> = {
      orgId: session.orgId,
    };

    if (materialTypeId) {
      where.materialTypeId = materialTypeId;
    }

    if (hasStock === "true") {
      where.availableKg = { gt: 0 };
    }

    const lots = await prisma.stockLot.findMany({
      where,
      include: {
        materialType: true,
        batch: {
          include: {
            run: {
              include: {
                assignment: {
                  include: { route: true },
                },
              },
            },
          },
        },
        movements: {
          orderBy: { movedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(lots);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("stock:create");
    const body = await request.json();
    const data = createStockLotSchema.parse(body);

    // Verify material type exists
    const materialType = await prisma.materialType.findFirst({
      where: { id: data.materialTypeId, orgId: session.orgId },
    });

    if (!materialType) {
      return notFound("Tipo de material não encontrado");
    }

    // Create lot and IN movement in transaction
    const lot = await prisma.$transaction(async (tx) => {
      const newLot = await tx.stockLot.create({
        data: {
          materialTypeId: data.materialTypeId,
          orgId: session.orgId,
          totalKg: data.totalKg,
          availableKg: data.totalKg,
          qualityGrade: data.qualityGrade,
          originNote: data.originNote || "Entrada manual",
        },
      });

      await tx.stockMovement.create({
        data: {
          lotId: newLot.id,
          type: "IN",
          quantityKg: data.totalKg,
          movedBy: session.userId,
          notes: "Entrada manual de estoque",
        },
      });

      return newLot;
    });

    const lotWithType = await prisma.stockLot.findUnique({
      where: { id: lot.id },
      include: { materialType: true },
    });

    return success(lotWithType, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
