import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { updateEmployeeSchema } from "@/lib/validations";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("employees:read");
    const { id } = await params;

    const employee = await prisma.employee.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        teamMembers: {
          include: { team: true },
        },
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    if (!employee) {
      return notFound("Funcionário não encontrado");
    }

    return success(employee);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("employees:update");
    const { id } = await params;
    const body = await request.json();
    const data = updateEmployeeSchema.parse(body);

    const existing = await prisma.employee.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Funcionário não encontrado");
    }

    const employee = await prisma.employee.update({
      where: { id },
      data,
    });

    return success(employee);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("employees:delete");
    const { id } = await params;

    const existing = await prisma.employee.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) {
      return notFound("Funcionário não encontrado");
    }

    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ message: "Funcionário removido" });
  } catch (err) {
    return handleApiError(err);
  }
}
