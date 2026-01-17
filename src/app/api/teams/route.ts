import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createTeamSchema } from "@/lib/validations";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requirePermission("teams:read");

    const teams = await prisma.team.findMany({
      where: { orgId: session.orgId, isActive: true },
      include: {
        members: {
          include: { employee: true },
        },
        _count: {
          select: { routeAssignments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return success(teams);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("teams:create");
    const body = await request.json();
    const data = createTeamSchema.parse(body);

    const team = await prisma.team.create({
      data: {
        ...data,
        orgId: session.orgId,
      },
    });

    return success(team, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
