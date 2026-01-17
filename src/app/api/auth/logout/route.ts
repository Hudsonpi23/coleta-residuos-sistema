import { removeAuthCookie } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";

export async function POST() {
  try {
    await removeAuthCookie();
    return success({ message: "Logout realizado com sucesso" });
  } catch (err) {
    return handleApiError(err);
  }
}
