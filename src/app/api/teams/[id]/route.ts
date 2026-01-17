import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { updateTeamSchema } from "@/lib/validations";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("teams:read");
    const { id } = await params;

    const team = await prisma.team.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        members: {
          include: { employee: true },
        },
      },
    });

    if (!team) {
      return notFound("Equipe não encontrada");
    }

    return success(team);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("teams:update");
    const { id } = await params;
    const body = await request.json();
    const data = updateTeamSchema.parse(body);

    const existing = await prisma.team.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Equipe não encontrada");
    }

    const team = await prisma.team.update({
      where: { id },
      data,
    });

    return success(team);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("teams:delete");
    const { id } = await params;

    const existing = await prisma.team.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Equipe não encontrada");
    }

    await prisma.team.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ message: "Equipe removida" });
  } catch (err) {
    return handleApiError(err);
  }
}
