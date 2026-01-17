import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("reports:view");
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    // Collection runs stats
    const runsWhere: Record<string, unknown> = {
      assignment: { route: { orgId: session.orgId } },
    };
    if (from || to) {
      runsWhere.createdAt = dateFilter;
    }

    const runs = await prisma.collectionRun.findMany({
      where: runsWhere,
      include: {
        events: {
          include: {
            items: {
              include: { materialType: true },
            },
          },
        },
        assignment: {
          include: {
            team: true,
            route: true,
          },
        },
      },
    });

    // Calculate collected kg by material
    const collectedByMaterial: Record<string, { name: string; category: string | null; totalKg: number }> = {};
    let totalCollectedKg = 0;
    let totalStops = 0;
    let completedStops = 0;
    let skippedStops = 0;

    for (const run of runs) {
      for (const event of run.events) {
        totalStops++;
        if (event.status === "COLETADO") {
          completedStops++;
          for (const item of event.items) {
            const mtId = item.materialTypeId;
            if (!collectedByMaterial[mtId]) {
              collectedByMaterial[mtId] = {
                name: item.materialType.name,
                category: item.materialType.category,
                totalKg: 0,
              };
            }
            collectedByMaterial[mtId].totalKg += item.quantity;
            totalCollectedKg += item.quantity;
          }
        } else if (event.status === "NAO_COLETADO") {
          skippedStops++;
        }
      }
    }

    // Team productivity
    const teamStats: Record<string, { name: string; runs: number; stopsCompleted: number; totalKg: number }> = {};
    for (const run of runs) {
      const teamId = run.assignment.teamId;
      const teamName = run.assignment.team.name;
      if (!teamStats[teamId]) {
        teamStats[teamId] = { name: teamName, runs: 0, stopsCompleted: 0, totalKg: 0 };
      }
      teamStats[teamId].runs++;
      for (const event of run.events) {
        if (event.status === "COLETADO") {
          teamStats[teamId].stopsCompleted++;
          teamStats[teamId].totalKg += event.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
        }
      }
    }

    // Stock summary
    const stockSummary = await prisma.stockLot.aggregate({
      where: { orgId: session.orgId },
      _sum: { availableKg: true },
    });

    // Recent movements
    const movementsWhere: Record<string, unknown> = {
      lot: { orgId: session.orgId },
    };
    if (from || to) {
      movementsWhere.movedAt = dateFilter;
    }

    const recentMovements = await prisma.stockMovement.findMany({
      where: movementsWhere,
      include: {
        lot: { include: { materialType: true } },
        destination: true,
      },
      orderBy: { movedAt: "desc" },
      take: 10,
    });

    // Top collection points by volume
    const pointStats = await prisma.collectedItem.groupBy({
      by: ["eventId"],
      _sum: { quantity: true },
    });

    // Get skip reasons distribution
    const skipReasons = await prisma.collectionEvent.groupBy({
      by: ["skipReason"],
      where: {
        status: "NAO_COLETADO",
        run: {
          assignment: { route: { orgId: session.orgId } },
          ...(from || to ? { createdAt: dateFilter } : {}),
        },
      },
      _count: true,
    });

    return success({
      period: { from, to },
      collection: {
        totalRuns: runs.length,
        completedRuns: runs.filter((r) => r.status === "CONCLUIDO").length,
        totalStops,
        completedStops,
        skippedStops,
        completionRate: totalStops > 0 
          ? Math.round((completedStops / totalStops) * 100) 
          : 0,
        totalCollectedKg: Math.round(totalCollectedKg * 100) / 100,
      },
      collectedByMaterial: Object.values(collectedByMaterial).sort(
        (a, b) => b.totalKg - a.totalKg
      ),
      teamProductivity: Object.values(teamStats).sort(
        (a, b) => b.totalKg - a.totalKg
      ),
      stock: {
        totalAvailableKg: stockSummary._sum.availableKg || 0,
      },
      recentMovements,
      skipReasons: skipReasons.map((r) => ({
        reason: r.skipReason || "Não informado",
        count: r._count,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
