import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
);

const COOKIE_NAME = "auth-token";
const TOKEN_EXPIRATION = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  orgId: string;
  orgSlug: string;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      org: true,
      employee: true,
    },
  });

  return user;
}

// RBAC Permission System
export type Permission =
  | "dashboard:view"
  | "collection-points:create"
  | "collection-points:read"
  | "collection-points:update"
  | "collection-points:delete"
  | "routes:create"
  | "routes:read"
  | "routes:update"
  | "routes:delete"
  | "teams:create"
  | "teams:read"
  | "teams:update"
  | "teams:delete"
  | "vehicles:create"
  | "vehicles:read"
  | "vehicles:update"
  | "vehicles:delete"
  | "assignments:create"
  | "assignments:read"
  | "assignments:update"
  | "assignments:delete"
  | "runs:create"
  | "runs:read"
  | "runs:update"
  | "runs:execute"
  | "sorting:create"
  | "sorting:read"
  | "sorting:update"
  | "sorting:close"
  | "stock:create"
  | "stock:read"
  | "stock:update"
  | "stock:movement"
  | "destinations:create"
  | "destinations:read"
  | "destinations:update"
  | "destinations:delete"
  | "material-types:create"
  | "material-types:read"
  | "material-types:update"
  | "material-types:delete"
  | "users:create"
  | "users:read"
  | "users:update"
  | "users:delete"
  | "employees:create"
  | "employees:read"
  | "employees:update"
  | "employees:delete"
  | "reports:view";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "collection-points:create", "collection-points:read", "collection-points:update", "collection-points:delete",
    "routes:create", "routes:read", "routes:update", "routes:delete",
    "teams:create", "teams:read", "teams:update", "teams:delete",
    "vehicles:create", "vehicles:read", "vehicles:update", "vehicles:delete",
    "assignments:create", "assignments:read", "assignments:update", "assignments:delete",
    "runs:create", "runs:read", "runs:update", "runs:execute",
    "sorting:create", "sorting:read", "sorting:update", "sorting:close",
    "stock:create", "stock:read", "stock:update", "stock:movement",
    "destinations:create", "destinations:read", "destinations:update", "destinations:delete",
    "material-types:create", "material-types:read", "material-types:update", "material-types:delete",
    "users:create", "users:read", "users:update", "users:delete",
    "employees:create", "employees:read", "employees:update", "employees:delete",
    "reports:view",
  ],
  GESTOR_OPERACAO: [
    "dashboard:view",
    "collection-points:create", "collection-points:read", "collection-points:update",
    "routes:create", "routes:read", "routes:update", "routes:delete",
    "teams:create", "teams:read", "teams:update",
    "vehicles:read",
    "assignments:create", "assignments:read", "assignments:update", "assignments:delete",
    "runs:create", "runs:read", "runs:update",
    "sorting:read",
    "stock:read",
    "destinations:read",
    "material-types:read",
    "employees:read",
    "reports:view",
  ],
  ALMOXARIFE: [
    "dashboard:view",
    "stock:create", "stock:read", "stock:update", "stock:movement",
    "destinations:read",
    "material-types:read",
    "sorting:read",
    "reports:view",
  ],
  SUPERVISOR: [
    "dashboard:view",
    "collection-points:read",
    "routes:read",
    "teams:read",
    "vehicles:read",
    "assignments:read",
    "runs:read", "runs:update",
    "sorting:read", "sorting:update", "sorting:close",
    "stock:read",
    "destinations:read",
    "material-types:read",
    "reports:view",
  ],
  COLETOR: [
    "runs:read", "runs:execute",
    "material-types:read",
  ],
  TRIAGEM: [
    "dashboard:view",
    "runs:read",
    "sorting:create", "sorting:read", "sorting:update",
    "material-types:read",
  ],
  VISUALIZADOR: [
    "dashboard:view",
    "collection-points:read",
    "routes:read",
    "teams:read",
    "vehicles:read",
    "assignments:read",
    "runs:read",
    "sorting:read",
    "stock:read",
    "destinations:read",
    "material-types:read",
    "reports:view",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export async function requirePermission(permission: Permission): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: No session");
  }
  if (!hasPermission(session.role, permission)) {
    throw new Error(`Forbidden: Missing permission ${permission}`);
  }
  return session;
}
