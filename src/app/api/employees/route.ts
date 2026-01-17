import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createEmployeeSchema } from "@/lib/validations";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requirePermission("employees:read");

    const employees = await prisma.employee.findMany({
      where: { orgId: session.orgId, isActive: true },
      include: {
        teamMembers: {
          include: { team: true },
        },
        user: {
          select: { id: true, email: true, role: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return success(employees);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("employees:create");
    const body = await request.json();
    const data = createEmployeeSchema.parse(body);

    const employee = await prisma.employee.create({
      data: {
        ...data,
        orgId: session.orgId,
      },
    });

    return success(employee, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
