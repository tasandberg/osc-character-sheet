export const OWNERSHIP_LEVELS = {
  INHERIT: -1,
  NONE: 0,
  LIMITED: 1,
  OBSERVER: 2,
  OWNER: 3,
} as const;

export type OwnershipLevel =
  (typeof OWNERSHIP_LEVELS)[keyof typeof OWNERSHIP_LEVELS];

export type PermissionTester = {
  testUserPermission?: (user: unknown, permission: string) => boolean;
};

export function canViewFullSheet(level: unknown): boolean {
  return (
    level === OWNERSHIP_LEVELS.OBSERVER || level === OWNERSHIP_LEVELS.OWNER
  );
}

export function resolveOwnershipLevel(
  document: PermissionTester | null | undefined,
  user: unknown,
): OwnershipLevel | null {
  if (typeof document?.testUserPermission !== "function") return null;
  if (document.testUserPermission(user, "OWNER")) return OWNERSHIP_LEVELS.OWNER;
  if (document.testUserPermission(user, "OBSERVER"))
    return OWNERSHIP_LEVELS.OBSERVER;
  if (document.testUserPermission(user, "LIMITED"))
    return OWNERSHIP_LEVELS.LIMITED;
  return OWNERSHIP_LEVELS.NONE;
}

export function canUserViewFullSheet(
  document: PermissionTester | null | undefined,
  user: unknown,
): boolean {
  return canViewFullSheet(resolveOwnershipLevel(document, user));
}
