import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createVehicleSchema } from "@/lib/validations";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requirePermission("vehicles:read");

    const vehicles = await prisma.vehicle.findMany({
      where: { orgId: session.orgId, isActive: true },
      orderBy: { plate: "asc" },
    });

    return success(vehicles);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("vehicles:create");
    const body = await request.json();
    const data = createVehicleSchema.parse(body);

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        orgId: session.orgId,
      },
    });

    return success(vehicle, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
