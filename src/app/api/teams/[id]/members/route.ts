import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { addTeamMemberSchema } from "@/lib/validations";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("teams:update");
    const { id } = await params;
    const body = await request.json();
    const data = addTeamMemberSchema.parse(body);

    const team = await prisma.team.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!team) {
      return notFound("Equipe não encontrada");
    }

    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, orgId: session.orgId },
    });

    if (!employee) {
      return notFound("Funcionário não encontrado");
    }

    // Check if already member
    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId: id, employeeId: data.employeeId },
    });

    if (existingMember) {
      return error("Funcionário já é membro desta equipe");
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId: id,
        employeeId: data.employeeId,
        role: data.role,
      },
      include: { employee: true },
    });

    return success(member, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("teams:update");
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return error("ID do membro é obrigatório");
    }

    const team = await prisma.team.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!team) {
      return notFound("Equipe não encontrada");
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return success({ message: "Membro removido da equipe" });
  } catch (err) {
    return handleApiError(err);
  }
}
