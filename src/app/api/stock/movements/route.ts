import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createStockMovementSchema } from "@/lib/validations";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("stock:read");
    const { searchParams } = new URL(request.url);
    const lotId = searchParams.get("lotId");
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {
      lot: { orgId: session.orgId },
    };

    if (lotId) {
      where.lotId = lotId;
    }

    if (type) {
      where.type = type;
    }

    if (from || to) {
      where.movedAt = {};
      if (from) {
        (where.movedAt as Record<string, Date>).gte = new Date(from);
      }
      if (to) {
        (where.movedAt as Record<string, Date>).lte = new Date(to);
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        lot: {
          include: { materialType: true },
        },
        destination: true,
        vehicle: true,
      },
      orderBy: { movedAt: "desc" },
    });

    return success(movements);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("stock:movement");
    const body = await request.json();
    const data = createStockMovementSchema.parse(body);

    // Verify lot exists and belongs to org
    const lot = await prisma.stockLot.findFirst({
      where: { id: data.lotId, orgId: session.orgId },
    });

    if (!lot) {
      return notFound("Lote não encontrado");
    }

    // For OUT movements, check available quantity
    if (data.type === "OUT" && data.quantityKg > lot.availableKg) {
      return error(
        `Quantidade insuficiente. Disponível: ${lot.availableKg}kg`
      );
    }

    // Verify destination if provided
    if (data.destinationId) {
      const destination = await prisma.destination.findFirst({
        where: { id: data.destinationId, orgId: session.orgId },
      });
      if (!destination) {
        return notFound("Destino não encontrado");
      }
    }

    // Verify vehicle if provided
    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.vehicleId, orgId: session.orgId },
      });
      if (!vehicle) {
        return notFound("Veículo não encontrado");
      }
    }

    // Calculate new available quantity
    let newAvailable = lot.availableKg;
    if (data.type === "IN") {
      newAvailable += data.quantityKg;
    } else if (data.type === "OUT") {
      newAvailable -= data.quantityKg;
    } else if (data.type === "ADJUST") {
      // For adjustments, the quantity is the new total available
      newAvailable = data.quantityKg;
    }

    // Create movement and update lot in transaction
    const movement = await prisma.$transaction(async (tx) => {
      const newMovement = await tx.stockMovement.create({
        data: {
          lotId: data.lotId,
          type: data.type,
          quantityKg: data.quantityKg,
          destinationId: data.destinationId,
          vehicleId: data.vehicleId,
          invoiceRef: data.invoiceRef,
          notes: data.notes,
          movedBy: session.userId,
        },
        include: {
          lot: {
            include: { materialType: true },
          },
          destination: true,
          vehicle: true,
        },
      });

      await tx.stockLot.update({
        where: { id: data.lotId },
        data: {
          availableKg: newAvailable,
          totalKg:
            data.type === "IN"
              ? lot.totalKg + data.quantityKg
              : lot.totalKg,
        },
      });

      return newMovement;
    });

    return success(movement, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
