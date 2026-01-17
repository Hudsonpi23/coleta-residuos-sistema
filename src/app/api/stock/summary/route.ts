import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requirePermission("stock:read");

    // Get stock summary by material type
    const stockByMaterial = await prisma.stockLot.groupBy({
      by: ["materialTypeId"],
      where: {
        orgId: session.orgId,
        availableKg: { gt: 0 },
      },
      _sum: {
        availableKg: true,
        totalKg: true,
      },
      _count: true,
    });

    // Get material types for names
    const materialTypes = await prisma.materialType.findMany({
      where: { orgId: session.orgId },
    });

    const materialTypeMap = new Map(
      materialTypes.map((mt) => [mt.id, mt])
    );

    const summary = stockByMaterial.map((item) => ({
      materialType: materialTypeMap.get(item.materialTypeId),
      availableKg: item._sum.availableKg || 0,
      totalKg: item._sum.totalKg || 0,
      lotsCount: item._count,
    }));

    // Get totals
    const totals = await prisma.stockLot.aggregate({
      where: {
        orgId: session.orgId,
      },
      _sum: {
        availableKg: true,
        totalKg: true,
      },
      _count: true,
    });

    return success({
      byMaterial: summary,
      totals: {
        availableKg: totals._sum.availableKg || 0,
        totalKg: totals._sum.totalKg || 0,
        lotsCount: totals._count,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
