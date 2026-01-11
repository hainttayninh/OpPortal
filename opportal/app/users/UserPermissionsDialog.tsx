'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
} from '@/components/ui';
import { Shield, Loader2, Check, X } from 'lucide-react';

// Available actions and resources
const ACTIONS = ['View', 'Create', 'Update', 'Delete', 'Approve', 'Lock'] as const;
const RESOURCES = [
    { value: 'Users', label: 'Người dùng' },
    { value: 'OrganizationUnits', label: 'Đơn vị tổ chức' },
    { value: 'Shifts', label: 'Ca làm việc' },
    { value: 'ShiftAssignments', label: 'Phân ca' },
    { value: 'Attendance', label: 'Chấm công' },
    { value: 'KPI', label: 'KPI' },
    { value: 'Approvals', label: 'Phê duyệt' },
    { value: 'AuditLogs', label: 'Nhật ký' },
] as const;

const ACTION_LABELS: Record<string, string> = {
    View: 'Xem',
    Create: 'Tạo',
    Update: 'Sửa',
    Delete: 'Xóa',
    Approve: 'Duyệt',
    Lock: 'Khóa',
};

interface UserPermission {
    id: string;
    action: string;
    resource: string;
    grantedBy: { id: string; name: string };
    grantedAt: string;
    expiresAt?: string;
}

interface RolePermission {
    action: string;
    resource: string;
    scope: string;
    fromRole: boolean;
}

interface UserPermissionsDialogProps {
    userId: string;
    userName: string;
    userRole: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserPermissionsDialog({
    userId,
    userName,
    userRole,
    open,
    onOpenChange,
}: UserPermissionsDialogProps) {
    const [userPermissions, setUserPermissions] = React.useState<UserPermission[]>([]);
    const [rolePermissions, setRolePermissions] = React.useState<RolePermission[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState<string | null>(null); // Track which cell is saving

    // Fetch permissions when dialog opens
    React.useEffect(() => {
        if (open && userId) {
            fetchPermissions();
        }
    }, [open, userId]);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/user-permissions?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUserPermissions(data.userPermissions || []);
                setRolePermissions(data.rolePermissions || []);
            }
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check if permission exists from role
    const hasRolePermission = (action: string, resource: string) => {
        return rolePermissions.some(p => p.action === action && p.resource === resource);
    };

    // Check if permission exists as custom
    const hasUserPermission = (action: string, resource: string) => {
        return userPermissions.some(p => p.action === action && p.resource === resource);
    };

    // Get custom permission ID
    const getUserPermissionId = (action: string, resource: string) => {
        return userPermissions.find(p => p.action === action && p.resource === resource)?.id;
    };

    // Toggle permission
    const togglePermission = async (action: string, resource: string) => {
        const cellKey = `${action}-${resource}`;
        setSaving(cellKey);

        try {
            const existingId = getUserPermissionId(action, resource);

            if (existingId) {
                // Revoke permission
                const response = await fetch(`/api/user-permissions?id=${existingId}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    await fetchPermissions();
                }
            } else {
                // Grant permission
                const response = await fetch('/api/user-permissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, action, resource }),
                });
                if (response.ok) {
                    await fetchPermissions();
                }
            }
        } catch (error) {
            console.error('Failed to toggle permission:', error);
        } finally {
            setSaving(null);
        }
    };

    // Grant all permissions for a resource
    const grantAllForResource = async (resource: string) => {
        setSaving(`all-${resource}`);
        try {
            for (const action of ACTIONS) {
                if (!hasRolePermission(action, resource) && !hasUserPermission(action, resource)) {
                    await fetch('/api/user-permissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, action, resource }),
                    });
                }
            }
            await fetchPermissions();
        } catch (error) {
            console.error('Failed to grant all permissions:', error);
        } finally {
            setSaving(null);
        }
    };

    // Revoke all custom permissions for a resource
    const revokeAllForResource = async (resource: string) => {
        setSaving(`all-${resource}`);
        try {
            const permsToRevoke = userPermissions.filter(p => p.resource === resource);
            for (const perm of permsToRevoke) {
                await fetch(`/api/user-permissions?id=${perm.id}`, { method: 'DELETE' });
            }
            await fetchPermissions();
        } catch (error) {
            console.error('Failed to revoke permissions:', error);
        } finally {
            setSaving(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Phân quyền: {userName}
                    </DialogTitle>
                    <p className="text-sm text-slate-500">Role: {userRole}</p>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="py-4">
                        {/* Legend */}
                        <div className="flex items-center gap-6 mb-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-emerald-600" />
                                </div>
                                <span className="text-slate-600">Từ Role</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-blue-600" />
                                </div>
                                <span className="text-slate-600">Quyền bổ sung</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded border-2 border-slate-200"></div>
                                <span className="text-slate-600">Chưa có</span>
                            </div>
                        </div>

                        {/* Permission Grid */}
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="text-left px-4 py-3 font-medium text-slate-700 border-b">
                                            Chức năng
                                        </th>
                                        {ACTIONS.map(action => (
                                            <th
                                                key={action}
                                                className="text-center px-2 py-3 font-medium text-slate-700 border-b w-16"
                                            >
                                                {ACTION_LABELS[action]}
                                            </th>
                                        ))}
                                        <th className="text-center px-2 py-3 font-medium text-slate-700 border-b w-24">
                                            Tất cả
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {RESOURCES.map((resource, idx) => {
                                        const hasAllRolePerms = ACTIONS.every(a => hasRolePermission(a, resource.value));
                                        const hasAnyCustomPerm = ACTIONS.some(a => hasUserPermission(a, resource.value));

                                        return (
                                            <tr
                                                key={resource.value}
                                                className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-25'}
                                            >
                                                <td className="px-4 py-3 font-medium text-slate-700 border-b">
                                                    {resource.label}
                                                </td>
                                                {ACTIONS.map(action => {
                                                    const cellKey = `${action}-${resource.value}`;
                                                    const fromRole = hasRolePermission(action, resource.value);
                                                    const fromUser = hasUserPermission(action, resource.value);
                                                    const isSaving = saving === cellKey;

                                                    return (
                                                        <td
                                                            key={action}
                                                            className="text-center px-2 py-3 border-b"
                                                        >
                                                            {isSaving ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-blue-600 mx-auto" />
                                                            ) : fromRole ? (
                                                                <div
                                                                    className="w-6 h-6 mx-auto rounded bg-emerald-100 flex items-center justify-center cursor-not-allowed"
                                                                    title="Quyền từ Role (không thể xóa)"
                                                                >
                                                                    <Check className="h-4 w-4 text-emerald-600" />
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => togglePermission(action, resource.value)}
                                                                    className={`w-6 h-6 mx-auto rounded flex items-center justify-center transition-colors ${fromUser
                                                                            ? 'bg-blue-100 hover:bg-blue-200'
                                                                            : 'border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                                                                        }`}
                                                                    title={fromUser ? 'Nhấn để thu hồi' : 'Nhấn để cấp quyền'}
                                                                >
                                                                    {fromUser && <Check className="h-4 w-4 text-blue-600" />}
                                                                </button>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="text-center px-2 py-3 border-b">
                                                    {saving === `all-${resource.value}` ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600 mx-auto" />
                                                    ) : hasAllRolePerms ? (
                                                        <span className="text-xs text-slate-400">Đầy đủ</span>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => grantAllForResource(resource.value)}
                                                                className="p-1 rounded hover:bg-emerald-100 text-emerald-600"
                                                                title="Cấp tất cả quyền"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                            {hasAnyCustomPerm && (
                                                                <button
                                                                    onClick={() => revokeAllForResource(resource.value)}
                                                                    className="p-1 rounded hover:bg-red-100 text-red-500"
                                                                    title="Thu hồi quyền bổ sung"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
