import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { startRunSchema } from "@/lib/validations";
import { success, notFound, error, handleApiError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("runs:execute");
    const body = await request.json();
    const data = startRunSchema.parse(body);

    // Verify assignment
    const assignment = await prisma.routeAssignment.findFirst({
      where: {
        id: data.assignmentId,
        route: { orgId: session.orgId },
      },
      include: {
        route: {
          include: {
            stops: true,
          },
        },
        runs: true,
      },
    });

    if (!assignment) {
      return notFound("Agendamento não encontrado");
    }

    // Check if there's already an active run
    const activeRun = assignment.runs.find(
      (r) => r.status === "EM_ANDAMENTO"
    );
    if (activeRun) {
      return error("Já existe uma execução em andamento para este agendamento");
    }

    // Create run and events for each stop
    const run = await prisma.collectionRun.create({
      data: {
        assignmentId: data.assignmentId,
        status: "EM_ANDAMENTO",
        startedAt: new Date(),
        events: {
          create: assignment.route.stops.map((stop) => ({
            stopId: stop.id,
            status: "PENDENTE",
          })),
        },
      },
      include: {
        assignment: {
          include: {
            route: true,
            team: true,
            vehicle: true,
          },
        },
        events: {
          include: {
            stop: {
              include: { point: true },
            },
          },
          orderBy: {
            stop: { orderIndex: "asc" },
          },
        },
      },
    });

    return success(run, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
