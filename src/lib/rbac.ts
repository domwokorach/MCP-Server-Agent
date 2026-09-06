import type { Role } from "@prisma/client";

/** Ascending privilege order. Higher index = more privileged. */
const ROLE_ORDER: Role[] = ["user", "developer", "admin"];

export function roleRank(role: Role): number {
  return ROLE_ORDER.indexOf(role);
}

/** True when `role` meets or exceeds `minimum` in the privilege hierarchy. */
export function hasRole(role: Role, minimum: Role): boolean {
  return roleRank(role) >= roleRank(minimum);
}

export const ROLES = ROLE_ORDER;
