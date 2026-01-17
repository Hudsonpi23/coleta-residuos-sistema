import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAssignmentSchema } from "@/lib/validations";
import { success, notFound, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("assignments:read");
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    const where: Record<string, unknown> = {};
    
    // Filter by route's orgId
    where.route = { orgId: session.orgId };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        (where.date as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.date as Record<string, Date>).lte = new Date(dateTo);
      }
    }

    const assignments = await prisma.routeAssignment.findMany({
      where,
      include: {
        route: {
          include: {
            stops: {
              include: { point: true },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        team: {
          include: {
            members: {
              include: { employee: true },
            },
          },
        },
        vehicle: true,
        runs: {
          include: {
            _count: {
              select: { events: true },
            },
          },
        },
      },
      orderBy: [{ date: "asc" }, { shift: "asc" }],
    });

    return success(assignments);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("assignments:create");
    const body = await request.json();
    const data = createAssignmentSchema.parse(body);

    // Verify route belongs to org
    const route = await prisma.route.findFirst({
      where: { id: data.routeId, orgId: session.orgId },
    });
    if (!route) {
      return notFound("Rota não encontrada");
    }

    // Verify team belongs to org
    const team = await prisma.team.findFirst({
      where: { id: data.teamId, orgId: session.orgId },
    });
    if (!team) {
      return notFound("Equipe não encontrada");
    }

    // Verify vehicle belongs to org
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, orgId: session.orgId },
    });
    if (!vehicle) {
      return notFound("Veículo não encontrado");
    }

    const assignment = await prisma.routeAssignment.create({
      data: {
        routeId: data.routeId,
        teamId: data.teamId,
        vehicleId: data.vehicleId,
        date: new Date(data.date),
        shift: data.shift,
      },
      include: {
        route: true,
        team: true,
        vehicle: true,
      },
    });

    return success(assignment, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
