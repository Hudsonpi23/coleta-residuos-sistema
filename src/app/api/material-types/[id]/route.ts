import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { updateMaterialTypeSchema } from "@/lib/validations";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("material-types:read");
    const { id } = await params;

    const materialType = await prisma.materialType.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!materialType) {
      return notFound("Tipo de material não encontrado");
    }

    return success(materialType);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("material-types:update");
    const { id } = await params;
    const body = await request.json();
    const data = updateMaterialTypeSchema.parse(body);

    const existing = await prisma.materialType.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Tipo de material não encontrado");
    }

    const materialType = await prisma.materialType.update({
      where: { id },
      data,
    });

    return success(materialType);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("material-types:delete");
    const { id } = await params;

    const existing = await prisma.materialType.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Tipo de material não encontrado");
    }

    // Soft delete
    await prisma.materialType.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ message: "Tipo de material removido" });
  } catch (err) {
    return handleApiError(err);
  }
}
