import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { updateVehicleSchema } from "@/lib/validations";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("vehicles:read");
    const { id } = await params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!vehicle) {
      return notFound("Veículo não encontrado");
    }

    return success(vehicle);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("vehicles:update");
    const { id } = await params;
    const body = await request.json();
    const data = updateVehicleSchema.parse(body);

    const existing = await prisma.vehicle.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Veículo não encontrado");
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
    });

    return success(vehicle);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("vehicles:delete");
    const { id } = await params;

    const existing = await prisma.vehicle.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Veículo não encontrado");
    }

    await prisma.vehicle.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ message: "Veículo removido" });
  } catch (err) {
    return handleApiError(err);
  }
}
