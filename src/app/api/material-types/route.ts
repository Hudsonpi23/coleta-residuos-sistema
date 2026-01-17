import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createMaterialTypeSchema } from "@/lib/validations";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requirePermission("material-types:read");

    const materialTypes = await prisma.materialType.findMany({
      where: { orgId: session.orgId, isActive: true },
      orderBy: { name: "asc" },
    });

    return success(materialTypes);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("material-types:create");
    const body = await request.json();
    const data = createMaterialTypeSchema.parse(body);

    const materialType = await prisma.materialType.create({
      data: {
        ...data,
        orgId: session.orgId,
      },
    });

    return success(materialType, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
