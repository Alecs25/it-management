export type Role = "admin" | "manager" | "technician" | "readonly";

type PermissionMatrix = Record<string, Role[]>;

const PERMISSIONS: PermissionMatrix = {
  "user:create": ["admin"],
  "user:read": ["admin", "manager", "technician", "readonly"],
  "user:update": ["admin"],
  "user:delete": ["admin"],
  "user:assign_role": ["admin"],

  "credential:create": ["admin", "manager"],
  "credential:read": ["admin", "manager", "technician", "readonly"],
  "credential:update": ["admin", "manager"],
  "credential:delete": ["admin", "manager"],
  "credential:reveal": ["admin", "manager", "technician"],
  "credential:export": ["admin", "manager"],

  "client:create": ["admin", "manager"],
  "client:read": ["admin", "manager", "technician", "readonly"],
  "client:update": ["admin", "manager"],
  "client:delete": ["admin"],

  "site:create": ["admin", "manager"],
  "site:read": ["admin", "manager", "technician", "readonly"],
  "site:update": ["admin", "manager"],
  "site:delete": ["admin", "manager"],

  "device:create": ["admin", "manager"],
  "device:read": ["admin", "manager", "technician", "readonly"],
  "device:update": ["admin", "manager"],
  "device:delete": ["admin", "manager"],

  "audit:read": ["admin"],
  "audit:export": ["admin"],

  "mfa:enroll": ["admin", "manager", "technician", "readonly"],
  "mfa:disable": ["admin"],
};

class RBACService {
  hasPermission(role: Role, action: string): boolean {
    return PERMISSIONS[action]?.includes(role) ?? false;
  }

  hasAllPermissions(role: Role, actions: string[]): boolean {
    return actions.every((a) => this.hasPermission(role, a));
  }

  hasAnyPermission(role: Role, actions: string[]): boolean {
    return actions.some((a) => this.hasPermission(role, a));
  }

  getAllowedActions(role: Role): string[] {
    return Object.entries(PERMISSIONS)
      .filter(([, roles]) => roles.includes(role))
      .map(([action]) => action);
  }

  getRolesForAction(action: string): Role[] {
    return PERMISSIONS[action] ?? [];
  }
}

export const rbacService = new RBACService();
