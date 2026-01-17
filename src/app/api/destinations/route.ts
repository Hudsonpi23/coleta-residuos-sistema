import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createDestinationSchema } from "@/lib/validations";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requirePermission("destinations:read");

    const destinations = await prisma.destination.findMany({
      where: { orgId: session.orgId, isActive: true },
      orderBy: { name: "asc" },
    });

    return success(destinations);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("destinations:create");
    const body = await request.json();
    const data = createDestinationSchema.parse(body);

    const destination = await prisma.destination.create({
      data: {
        ...data,
        orgId: session.orgId,
      },
    });

    return success(destination, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
