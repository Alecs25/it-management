export type Role = 'admin' | 'manager' | 'technician' | 'readonly';

export interface PermissionMatrix {
  [action: string]: Role[];
}

export const PERMISSION_MATRIX: PermissionMatrix = {
  // User management (admin only)
  'user:create': ['admin'],
  'user:read': ['admin', 'manager', 'technician', 'readonly'],
  'user:update': ['admin'],
  'user:delete': ['admin'],
  'user:assign_role': ['admin'],

  // Credential management
  'credential:create': ['admin', 'manager'],
  'credential:read': ['admin', 'manager', 'technician', 'readonly'],
  'credential:update': ['admin', 'manager'],
  'credential:delete': ['admin', 'manager'],
  'credential:reveal': ['admin', 'manager', 'technician'], // reveal requires PIN
  'credential:export': ['admin', 'manager'],

  // Client management
  'client:create': ['admin', 'manager'],
  'client:read': ['admin', 'manager', 'technician', 'readonly'],
  'client:update': ['admin', 'manager'],
  'client:delete': ['admin'],

  // Site management
  'site:create': ['admin', 'manager'],
  'site:read': ['admin', 'manager', 'technician', 'readonly'],
  'site:update': ['admin', 'manager'],
  'site:delete': ['admin', 'manager'],

  // Device management
  'device:create': ['admin', 'manager'],
  'device:read': ['admin', 'manager', 'technician', 'readonly'],
  'device:update': ['admin', 'manager'],
  'device:delete': ['admin', 'manager'],

  // Audit logs (admin only)
  'audit:read': ['admin'],
  'audit:export': ['admin'],

  // MFA management
  'mfa:enroll': ['admin', 'manager', 'technician', 'readonly'], // self-service
  'mfa:disable': ['admin'], // only admin can disable for others
};

export class RBACService {
  /**
   * Check if a role has permission for an action
   */
  public hasPermission(role: Role, action: string): boolean {
    const allowedRoles = PERMISSION_MATRIX[action];
    if (!allowedRoles) {
      console.warn(`Permission action not defined: ${action}`);
      return false;
    }
    return allowedRoles.includes(role);
  }

  /**
   * Validate that user has all required actions
   */
  public hasAllPermissions(role: Role, actions: string[]): boolean {
    return actions.every((action) => this.hasPermission(role, action));
  }

  /**
   * Validate that user has any of the required actions (OR logic)
   */
  public hasAnyPermission(role: Role, actions: string[]): boolean {
    return actions.some((action) => this.hasPermission(role, action));
  }

  /**
   * Get all actions allowed for a role
   */
  public getAllowedActions(role: Role): string[] {
    return Object.entries(PERMISSION_MATRIX)
      .filter(([_, roles]) => roles.includes(role))
      .map(([action, _]) => action);
  }

  /**
   * Get all roles for a specific action
   */
  public getRolesForAction(action: string): Role[] {
    return PERMISSION_MATRIX[action] || [];
  }
}

export const rbacService = new RBACService();
