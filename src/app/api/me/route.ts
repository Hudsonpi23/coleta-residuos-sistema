import { getSession, getPermissions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { success, unauthorized, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        org: true,
        employee: true,
      },
    });

    if (!user) {
      return unauthorized("Usuário não encontrado");
    }

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      orgName: user.org.name,
      orgSlug: user.org.slug,
      employee: user.employee,
      permissions: getPermissions(user.role),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
