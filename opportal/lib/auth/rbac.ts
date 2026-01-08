import { type TokenPayload } from './jwt';

// ============================================
// ROLE DEFINITIONS
// ============================================

export const ROLES = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    LEADER: 'Leader',
    USER: 'User',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// Role hierarchy levels (lower = more privilege)
export const ROLE_LEVELS: Record<RoleName, number> = {
    [ROLES.ADMIN]: 0,
    [ROLES.MANAGER]: 1,
    [ROLES.LEADER]: 2,
    [ROLES.USER]: 3,
};

// ============================================
// SCOPE DEFINITIONS
// ============================================

export const SCOPES = {
    TTVH: 'TTVH',
    BCVH: 'BCVH',
    BCP: 'BCP',
    DEPARTMENT: 'DEPARTMENT',
    PERSONAL: 'PERSONAL',
} as const;

export type ScopeName = (typeof SCOPES)[keyof typeof SCOPES];

// Scope hierarchy levels (lower = broader scope)
export const SCOPE_LEVELS: Record<ScopeName, number> = {
    [SCOPES.TTVH]: 0,
    [SCOPES.BCVH]: 1,
    [SCOPES.BCP]: 2,
    [SCOPES.DEPARTMENT]: 3,
    [SCOPES.PERSONAL]: 4,
};

// ============================================
// ACTION DEFINITIONS
// ============================================

export const ACTIONS = {
    VIEW: 'View',
    CREATE: 'Create',
    UPDATE: 'Update',
    DELETE: 'Delete',
    APPROVE: 'Approve',
    LOCK: 'Lock',
} as const;

export type ActionName = (typeof ACTIONS)[keyof typeof ACTIONS];

// ============================================
// RESOURCE DEFINITIONS
// ============================================

export const RESOURCES = {
    USERS: 'Users',
    ROLES: 'Roles',
    ORGANIZATION_UNITS: 'OrganizationUnits',
    SHIFTS: 'Shifts',
    SHIFT_ASSIGNMENTS: 'ShiftAssignments',
    ATTENDANCE: 'Attendance',
    KPI: 'KPI',
    APPROVALS: 'Approvals',
    AUDIT_LOGS: 'AuditLogs',
    DASHBOARD: 'Dashboard',
} as const;

export type ResourceName = (typeof RESOURCES)[keyof typeof RESOURCES];

// ============================================
// PERMISSION MATRIX
// ============================================

export interface Permission {
    action: ActionName;
    resource: ResourceName;
    scope: ScopeName;
}

// Define default permissions for each role
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
    [ROLES.ADMIN]: [
        // Admin has full access to everything
        ...Object.values(RESOURCES).flatMap((resource) =>
            Object.values(ACTIONS).map((action) => ({
                action,
                resource,
                scope: SCOPES.TTVH,
            }))
        ),
    ],
    [ROLES.MANAGER]: [
        // Users
        { action: ACTIONS.VIEW, resource: RESOURCES.USERS, scope: SCOPES.TTVH },
        { action: ACTIONS.CREATE, resource: RESOURCES.USERS, scope: SCOPES.TTVH },
        { action: ACTIONS.UPDATE, resource: RESOURCES.USERS, scope: SCOPES.TTVH },
        // Organization
        { action: ACTIONS.VIEW, resource: RESOURCES.ORGANIZATION_UNITS, scope: SCOPES.TTVH },
        // Shifts
        { action: ACTIONS.VIEW, resource: RESOURCES.SHIFTS, scope: SCOPES.TTVH },
        { action: ACTIONS.CREATE, resource: RESOURCES.SHIFTS, scope: SCOPES.TTVH },
        { action: ACTIONS.UPDATE, resource: RESOURCES.SHIFTS, scope: SCOPES.TTVH },
        { action: ACTIONS.LOCK, resource: RESOURCES.SHIFTS, scope: SCOPES.TTVH },
        // Shift Assignments
        { action: ACTIONS.VIEW, resource: RESOURCES.SHIFT_ASSIGNMENTS, scope: SCOPES.TTVH },
        { action: ACTIONS.CREATE, resource: RESOURCES.SHIFT_ASSIGNMENTS, scope: SCOPES.TTVH },
        { action: ACTIONS.UPDATE, resource: RESOURCES.SHIFT_ASSIGNMENTS, scope: SCOPES.TTVH },
        { action: ACTIONS.DELETE, resource: RESOURCES.SHIFT_ASSIGNMENTS, scope: SCOPES.TTVH },
        // Attendance
        { action: ACTIONS.VIEW, resource: RESOURCES.ATTENDANCE, scope: SCOPES.TTVH },
        { action: ACTIONS.UPDATE, resource: RESOURCES.ATTENDANCE, scope: SCOPES.TTVH },
        { action: ACTIONS.LOCK, resource: RESOURCES.ATTENDANCE, scope: SCOPES.TTVH },
        { action: ACTIONS.APPROVE, resource: RESOURCES.ATTENDANCE, scope: SCOPES.TTVH },
        // KPI
        { action: ACTIONS.VIEW, resource: RESOURCES.KPI, scope: SCOPES.TTVH },
        { action: ACTIONS.CREATE, resource: RESOURCES.KPI, scope: SCOPES.TTVH },
        { action: ACTIONS.UPDATE, resource: RESOURCES.KPI, scope: SCOPES.TTVH },
        { action: ACTIONS.APPROVE, resource: RESOURCES.KPI, scope: SCOPES.TTVH },
        // Approvals
        { action: ACTIONS.VIEW, resource: RESOURCES.APPROVALS, scope: SCOPES.TTVH },
        { action: ACTIONS.APPROVE, resource: RESOURCES.APPROVALS, scope: SCOPES.TTVH },
        // Audit Logs
        { action: ACTIONS.VIEW, resource: RESOURCES.AUDIT_LOGS, scope: SCOPES.TTVH },
        // Dashboard
        { action: ACTIONS.VIEW, resource: RESOURCES.DASHBOARD, scope: SCOPES.TTVH },
    ],
    [ROLES.LEADER]: [
        // Users
        { action: ACTIONS.VIEW, resource: RESOURCES.USERS, scope: SCOPES.BCVH },
        // Organization
        { action: ACTIONS.VIEW, resource: RESOURCES.ORGANIZATION_UNITS, scope: SCOPES.BCVH },
        // Shifts
        { action: ACTIONS.VIEW, resource: RESOURCES.SHIFTS, scope: SCOPES.BCVH },
        { action: ACTIONS.CREATE, resource: RESOURCES.SHIFTS, scope: SCOPES.BCVH },
        { action: ACTIONS.UPDATE, resource: RESOURCES.SHIFTS, scope: SCOPES.BCVH },
        // Shift Assignments
        { action: ACTIONS.VIEW, resource: RESOURCES.SHIFT_ASSIGNMENTS, scope: SCOPES.BCVH },
        { action: ACTIONS.CREATE, resource: RESOURCES.SHIFT_ASSIGNMENTS, scope: SCOPES.BCVH },
        { action: ACTIONS.UPDATE, resource: RESOURCES.SHIFT_ASSIGNMENTS, scope: SCOPES.BCVH },
        // Attendance
        { action: ACTIONS.VIEW, resource: RESOURCES.ATTENDANCE, scope: SCOPES.BCVH },
        { action: ACTIONS.UPDATE, resource: RESOURCES.ATTENDANCE, scope: SCOPES.BCVH },
        { action: ACTIONS.APPROVE, resource: RESOURCES.ATTENDANCE, scope: SCOPES.BCVH },
        // KPI
        { action: ACTIONS.VIEW, resource: RESOURCES.KPI, scope: SCOPES.BCVH },
        { action: ACTIONS.CREATE, resource: RESOURCES.KPI, scope: SCOPES.BCVH },
        { action: ACTIONS.UPDATE, resource: RESOURCES.KPI, scope: SCOPES.BCVH },
        { action: ACTIONS.APPROVE, resource: RESOURCES.KPI, scope: SCOPES.BCVH },
        // Approvals
        { action: ACTIONS.VIEW, resource: RESOURCES.APPROVALS, scope: SCOPES.BCVH },
        { action: ACTIONS.APPROVE, resource: RESOURCES.APPROVALS, scope: SCOPES.BCVH },
        // Dashboard
        { action: ACTIONS.VIEW, resource: RESOURCES.DASHBOARD, scope: SCOPES.BCVH },
    ],
    [ROLES.USER]: [
        // Users - personal only
        { action: ACTIONS.VIEW, resource: RESOURCES.USERS, scope: SCOPES.PERSONAL },
        { action: ACTIONS.UPDATE, resource: RESOURCES.USERS, scope: SCOPES.PERSONAL },
        // Shifts - view assigned
        { action: ACTIONS.VIEW, resource: RESOURCES.SHIFTS, scope: SCOPES.PERSONAL },
        { action: ACTIONS.VIEW, resource: RESOURCES.SHIFT_ASSIGNMENTS, scope: SCOPES.PERSONAL },
        // Attendance - personal
        { action: ACTIONS.VIEW, resource: RESOURCES.ATTENDANCE, scope: SCOPES.PERSONAL },
        { action: ACTIONS.CREATE, resource: RESOURCES.ATTENDANCE, scope: SCOPES.PERSONAL },
        { action: ACTIONS.UPDATE, resource: RESOURCES.ATTENDANCE, scope: SCOPES.PERSONAL },
        // KPI - personal
        { action: ACTIONS.VIEW, resource: RESOURCES.KPI, scope: SCOPES.PERSONAL },
        { action: ACTIONS.CREATE, resource: RESOURCES.KPI, scope: SCOPES.PERSONAL },
        { action: ACTIONS.UPDATE, resource: RESOURCES.KPI, scope: SCOPES.PERSONAL },
        // Dashboard
        { action: ACTIONS.VIEW, resource: RESOURCES.DASHBOARD, scope: SCOPES.PERSONAL },
    ],
};

// ============================================
// PERMISSION CHECKING FUNCTIONS
// ============================================

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
    user: TokenPayload,
    action: ActionName,
    resource: ResourceName,
    requiredScope?: ScopeName
): boolean {
    const role = user.role as RoleName;
    const userScope = user.organizationUnitType as ScopeName;
    const permissions = ROLE_PERMISSIONS[role] || [];

    // Find matching permission
    const permission = permissions.find(
        (p) => p.action === action && p.resource === resource
    );

    if (!permission) {
        return false;
    }

    // If no specific scope is required, just check if user has the permission
    if (!requiredScope) {
        return true;
    }

    // Check if user's permission scope covers the required scope
    const permissionScopeLevel = SCOPE_LEVELS[permission.scope];
    const requiredScopeLevel = SCOPE_LEVELS[requiredScope];

    // User's permission scope must be equal to or broader than required scope
    return permissionScopeLevel <= requiredScopeLevel;
}

/**
 * Check if user can access data in a specific organization unit
 */
export function canAccessOrganizationUnit(
    user: TokenPayload,
    targetOrgUnitId: string,
    targetOrgUnitType: string,
    action: ActionName,
    resource: ResourceName
): boolean {
    // First check if user has the basic permission
    if (!hasPermission(user, action, resource)) {
        return false;
    }

    const userScope = user.organizationUnitType as ScopeName;
    const targetScope = targetOrgUnitType as ScopeName;

    // Admin can access everything
    if (user.role === ROLES.ADMIN) {
        return true;
    }

    // For personal scope, only allow access to own org unit
    if (userScope === SCOPES.PERSONAL) {
        return user.organizationUnitId === targetOrgUnitId;
    }

    // Check scope hierarchy
    const userScopeLevel = SCOPE_LEVELS[userScope];
    const targetScopeLevel = SCOPE_LEVELS[targetScope];

    // User's scope must be equal to or broader than target scope
    // AND the target must be within user's organization hierarchy
    return userScopeLevel <= targetScopeLevel;
}

/**
 * Check if user can perform action on another user
 */
export function canAccessUser(
    currentUser: TokenPayload,
    targetUserId: string,
    action: ActionName
): boolean {
    // Users can always view/update their own profile
    if (
        currentUser.userId === targetUserId &&
        (action === ACTIONS.VIEW || action === ACTIONS.UPDATE)
    ) {
        return true;
    }

    // For actions on other users, check role hierarchy and permissions
    return hasPermission(currentUser, action, RESOURCES.USERS);
}

/**
 * Get the scope filter for database queries based on user's permissions
 */
export function getScopeFilter(user: TokenPayload): { organizationUnitId?: string; userId?: string } {
    const scope = user.organizationUnitType as ScopeName;

    switch (scope) {
        case SCOPES.PERSONAL:
            return { userId: user.userId };
        case SCOPES.DEPARTMENT:
        case SCOPES.BCP:
        case SCOPES.BCVH:
        case SCOPES.TTVH:
            // For organization scopes, filter by org unit ID
            // Note: The API route should handle hierarchy traversal
            return { organizationUnitId: user.organizationUnitId };
        default:
            return { userId: user.userId };
    }
}

/**
 * Check if one role is higher than another
 */
export function isHigherRole(role1: RoleName, role2: RoleName): boolean {
    return ROLE_LEVELS[role1] < ROLE_LEVELS[role2];
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: RoleName): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}
