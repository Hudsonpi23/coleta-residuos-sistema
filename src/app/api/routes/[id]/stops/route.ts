import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { addRouteStopSchema } from "@/lib/validations";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("routes:read");
    const { id } = await params;

    const route = await prisma.route.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!route) {
      return notFound("Rota não encontrada");
    }

    const stops = await prisma.routeStop.findMany({
      where: { routeId: id },
      include: { point: true },
      orderBy: { orderIndex: "asc" },
    });

    return success(stops);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("routes:update");
    const { id } = await params;
    const body = await request.json();
    const data = addRouteStopSchema.parse(body);

    const route = await prisma.route.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!route) {
      return notFound("Rota não encontrada");
    }

    // Check if point exists
    const point = await prisma.collectionPoint.findFirst({
      where: { id: data.pointId, orgId: session.orgId },
    });

    if (!point) {
      return notFound("Ponto de coleta não encontrado");
    }

    // Check if order index is already used
    const existingStop = await prisma.routeStop.findFirst({
      where: { routeId: id, orderIndex: data.orderIndex },
    });

    if (existingStop) {
      return error("Já existe uma parada com este índice de ordem");
    }

    const stop = await prisma.routeStop.create({
      data: {
        routeId: id,
        ...data,
      },
      include: { point: true },
    });

    return success(stop, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("routes:update");
    const { id } = await params;
    const body = await request.json();
    
    // Expect array of stops with their new order
    const stops = body.stops as { id: string; orderIndex: number }[];

    const route = await prisma.route.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!route) {
      return notFound("Rota não encontrada");
    }

    // Update all stops order in transaction
    await prisma.$transaction(
      stops.map((stop) =>
        prisma.routeStop.update({
          where: { id: stop.id },
          data: { orderIndex: stop.orderIndex },
        })
      )
    );

    const updatedStops = await prisma.routeStop.findMany({
      where: { routeId: id },
      include: { point: true },
      orderBy: { orderIndex: "asc" },
    });

    return success(updatedStops);
  } catch (err) {
    return handleApiError(err);
  }
}
