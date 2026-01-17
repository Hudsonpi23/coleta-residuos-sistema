import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { updateDestinationSchema } from "@/lib/validations";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("destinations:read");
    const { id } = await params;

    const destination = await prisma.destination.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!destination) {
      return notFound("Destino não encontrado");
    }

    return success(destination);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("destinations:update");
    const { id } = await params;
    const body = await request.json();
    const data = updateDestinationSchema.parse(body);

    const existing = await prisma.destination.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Destino não encontrado");
    }

    const destination = await prisma.destination.update({
      where: { id },
      data,
    });

    return success(destination);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("destinations:delete");
    const { id } = await params;

    const existing = await prisma.destination.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Destino não encontrado");
    }

    await prisma.destination.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ message: "Destino removido" });
  } catch (err) {
    return handleApiError(err);
  }
}
