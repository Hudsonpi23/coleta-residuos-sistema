import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createRouteSchema } from "@/lib/validations";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requirePermission("routes:read");

    const routes = await prisma.route.findMany({
      where: { orgId: session.orgId, isActive: true },
      include: {
        stops: {
          include: { point: true },
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return success(routes);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("routes:create");
    const body = await request.json();
    const data = createRouteSchema.parse(body);

    const route = await prisma.route.create({
      data: {
        ...data,
        orgId: session.orgId,
      },
    });

    return success(route, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
