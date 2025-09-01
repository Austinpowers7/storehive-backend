export const ROLE_TYPES = [
  "ADMIN",
  "OWNER",
  "CASHIER",
  "CUSTOMER",
  "MANAGER",
] as const;

export type RoleType = (typeof ROLE_TYPES)[number];
