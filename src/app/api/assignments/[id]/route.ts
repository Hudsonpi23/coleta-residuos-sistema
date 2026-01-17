import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("assignments:read");
    const { id } = await params;

    const assignment = await prisma.routeAssignment.findFirst({
      where: {
        id,
        route: { orgId: session.orgId },
      },
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
            events: {
              include: {
                stop: {
                  include: { point: true },
                },
                items: {
                  include: { materialType: true },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return notFound("Agendamento não encontrado");
    }

    return success(assignment);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("assignments:delete");
    const { id } = await params;

    const assignment = await prisma.routeAssignment.findFirst({
      where: {
        id,
        route: { orgId: session.orgId },
      },
      include: { runs: true },
    });

    if (!assignment) {
      return notFound("Agendamento não encontrado");
    }

    // Don't allow deletion if there are runs
    if (assignment.runs.length > 0) {
      return notFound("Não é possível excluir agendamento com execuções");
    }

    await prisma.routeAssignment.delete({
      where: { id },
    });

    return success({ message: "Agendamento removido" });
  } catch (err) {
    return handleApiError(err);
  }
}
