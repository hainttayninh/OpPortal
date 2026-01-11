import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES, canManageUser, ROLES } from '@/lib/auth';
import { z } from 'zod';

const grantPermissionSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    action: z.enum(['View', 'Create', 'Update', 'Delete', 'Approve', 'Lock']),
    resource: z.string().min(1, 'Resource is required'),
    reason: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
});

// GET - List permissions for a user
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admin and Manager can view user permissions
        if (!hasPermission(session, ACTIONS.VIEW, RESOURCES.USERS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Verify the target user exists and check if current user can manage them
        const targetUser = await prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
            include: {
                role: true,
                organizationUnit: true
            },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if current user can manage target user
        if (!canManageUser(session, targetUser.organizationUnitId, targetUser.role.name)) {
            return NextResponse.json({ error: 'Forbidden - Cannot access this user' }, { status: 403 });
        }

        // Get user's individual permissions
        const permissions = await prisma.userPermission.findMany({
            where: {
                userId,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            include: {
                grantedBy: { select: { id: true, name: true } },
            },
            orderBy: [{ resource: 'asc' }, { action: 'asc' }],
        });

        // Get role-based permissions
        const rolePermissions = await prisma.rolePermission.findMany({
            where: { roleId: targetUser.roleId },
            include: { permission: true },
        });

        return NextResponse.json({
            userPermissions: permissions,
            rolePermissions: rolePermissions.map(rp => ({
                action: rp.permission.action,
                resource: rp.permission.resource,
                scope: rp.permission.scope,
                fromRole: true,
            })),
            user: {
                id: targetUser.id,
                name: targetUser.name,
                role: targetUser.role.name,
            }
        });
    } catch (error) {
        console.error('Get user permissions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Grant a permission to a user
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admin and Manager can grant permissions
        if (session.role !== ROLES.ADMIN && session.role !== ROLES.MANAGER) {
            return NextResponse.json({ error: 'Forbidden - Only Admin or Manager can grant permissions' }, { status: 403 });
        }

        const body = await request.json();
        const validation = grantPermissionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { userId, action, resource, reason, expiresAt } = validation.data;

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
            include: { role: true, organizationUnit: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if current user can manage target user
        if (!canManageUser(session, targetUser.organizationUnitId, targetUser.role.name)) {
            return NextResponse.json({ error: 'Forbidden - Cannot manage this user' }, { status: 403 });
        }

        // Check if permission already exists
        const existingPermission = await prisma.userPermission.findUnique({
            where: {
                userId_action_resource: { userId, action, resource }
            },
        });

        if (existingPermission) {
            // Update existing permission
            const updated = await prisma.userPermission.update({
                where: { id: existingPermission.id },
                data: {
                    grantedById: session.userId,
                    grantedAt: new Date(),
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    reason,
                },
                include: {
                    grantedBy: { select: { id: true, name: true } },
                },
            });
            return NextResponse.json({ permission: updated, updated: true });
        }

        // Create new permission
        const permission = await prisma.userPermission.create({
            data: {
                userId,
                action,
                resource,
                grantedById: session.userId,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                reason,
            },
            include: {
                grantedBy: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ permission }, { status: 201 });
    } catch (error) {
        console.error('Grant permission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Revoke a permission from a user
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admin and Manager can revoke permissions
        if (session.role !== ROLES.ADMIN && session.role !== ROLES.MANAGER) {
            return NextResponse.json({ error: 'Forbidden - Only Admin or Manager can revoke permissions' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
        }

        // Find the permission
        const permission = await prisma.userPermission.findUnique({
            where: { id },
            include: {
                user: {
                    include: { role: true, organizationUnit: true }
                }
            },
        });

        if (!permission) {
            return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
        }

        // Check if current user can manage target user
        if (!canManageUser(session, permission.user.organizationUnitId, permission.user.role.name)) {
            return NextResponse.json({ error: 'Forbidden - Cannot manage this user' }, { status: 403 });
        }

        // Delete the permission
        await prisma.userPermission.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Revoke permission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
