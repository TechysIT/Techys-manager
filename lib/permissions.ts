import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function hasPermission(resource: string, action: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.permissions) {
    return false;
  }

  return session.user.permissions.some(
    (p) => p.resource === resource && p.action === action,
  );
}

export async function requirePermission(resource: string, action: string) {
  const allowed = await hasPermission(resource, action);

  if (!allowed) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }

  return true;
}

export async function getUserPermissions() {
  const session = await getServerSession(authOptions);
  return session?.user?.permissions || [];
}

// NEW: Check if user has permission from session object
export function checkPermission(
  session: any,
  resource: string,
  action: string,
): boolean {
  if (!session?.user?.permissions) {
    return false;
  }
  return session.user.permissions.some(
    (p: any) => p.resource === resource && p.action === action,
  );
}
