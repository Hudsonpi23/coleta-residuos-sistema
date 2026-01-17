import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { success, notFound, handleApiError } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePermission("sorting:read");
    const { id } = await params;

    const batch = await prisma.sortingBatch.findFirst({
      where: {
        id,
        run: {
          assignment: {
            route: { orgId: session.orgId },
          },
        },
      },
      include: {
        run: {
          include: {
            assignment: {
              include: {
                route: true,
                team: true,
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
              },
            },
          },
        },
        items: {
          include: { materialType: true },
        },
        stockLots: {
          include: { materialType: true },
        },
      },
    });

    if (!batch) {
      return notFound("Lote de triagem não encontrado");
    }

    return success(batch);
  } catch (err) {
    return handleApiError(err);
  }
}
