import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("runs:read");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    const where: Record<string, unknown> = {
      assignment: {
        route: { orgId: session.orgId },
      },
    };

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.assignment = {
        ...where.assignment as object,
        date: {},
      };
      if (dateFrom) {
        ((where.assignment as Record<string, unknown>).date as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        ((where.assignment as Record<string, unknown>).date as Record<string, Date>).lte = new Date(dateTo);
      }
    }

    const runs = await prisma.collectionRun.findMany({
      where,
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
            items: {
              include: { materialType: true },
            },
            _count: {
              select: { attachments: true },
            },
          },
          orderBy: {
            stop: { orderIndex: "asc" },
          },
        },
        _count: {
          select: { sortingBatches: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(runs);
  } catch (err) {
    return handleApiError(err);
  }
}
