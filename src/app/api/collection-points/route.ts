import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createCollectionPointSchema } from "@/lib/validations";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requirePermission("collection-points:read");

    const points = await prisma.collectionPoint.findMany({
      where: { orgId: session.orgId, isActive: true },
      orderBy: { name: "asc" },
    });

    return success(points);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("collection-points:create");
    const body = await request.json();
    const data = createCollectionPointSchema.parse(body);

    const point = await prisma.collectionPoint.create({
      data: {
        ...data,
        orgId: session.orgId,
      },
    });

    return success(point, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
