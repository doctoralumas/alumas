import type { NextResponse } from "next/server";
import { currentUser } from "./auth";
import { apiError } from "./api-response";

export type AdminUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export type AdminAuthResult =
  | {
      authorized: true;
      user: AdminUser;
      admin: AdminUser;
      response: null;
    }
  | {
      authorized: false;
      user: null;
      admin: null;
      response: NextResponse;
    };

/**
 * Centralized server-side administrator authorization helper.
 *
 * Reliably verifies that:
 * 1. An active, valid session exists (retrieved via cryptographic token hash in Postgres).
 * 2. The authenticated user account possesses the system role "ADMIN".
 *
 * Guarantees:
 * - Cannot be bypassed by client-supplied role values, headers, or query parameters.
 * - Returns 401 AUTH_REQUIRED when no valid authenticated session is present.
 * - Returns 403 FORBIDDEN when an authenticated user lacks the ADMIN role.
 * - Provides consistent envelope { ok: false, error: string, code: string } across all admin endpoints.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const user = await currentUser();

  if (!user) {
    return {
      authorized: false,
      user: null,
      admin: null,
      response: apiError("Giriş yapmanız gerekmektedir.", 401, "AUTH_REQUIRED"),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      authorized: false,
      user: null,
      admin: null,
      response: apiError("Yönetici yetkisi gereklidir.", 403, "FORBIDDEN"),
    };
  }

  return {
    authorized: true,
    user,
    admin: user,
    response: null,
  };
}

/**
 * Alias for requireAdmin() for backward compatibility and semantic clarity.
 */
export const requireAdminUser = requireAdmin;

/**
 * Synchronous predicate to verify whether a user object holds ADMIN privileges.
 */
export function isAdminUser(user: { role?: string | null } | null | undefined): boolean {
  return user?.role === "ADMIN";
}
